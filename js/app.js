const BODYWORK=['Para-choque dianteiro','Capô','Lateral dianteira esquerda','Porta dianteira esquerda','Porta traseira esquerda','Lateral traseira esquerda','Tampa do porta-malas','Para-choque traseiro','Lateral traseira direita','Porta traseira direita','Porta dianteira direita','Lateral dianteira direita','Teto'];
const INTERIOR=['Bancos e revestimentos','Painel e acabamento','Forro do teto','Ar-condicionado','Vidros e travas elétricas','Multimídia / rádio','Câmera / sensor de estacionamento','Luzes de advertência no painel'];
const MECHANICAL=['Motor em funcionamento','Ruído anormal do motor','Vazamento aparente','Câmbio / embreagem','Direção','Suspensão / ruídos','Freios','Pneus dianteiros','Pneus traseiros','Rodas','Estepe','Macaco e chave de roda','Chave reserva','Manual'];
const PHOTO_SLOTS=['Dianteira 45° esquerda','Traseira 45° esquerda','Traseira 45° direita','Dianteira 45° direita','Painel completo','Quilometragem com veículo ligado','Bancos dianteiros','Bancos traseiros','Porta-malas','Compartimento do motor'];
let currentTab='active',currentRecord=null,deferredInstallPrompt=null,saveTimer=null;const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];document.addEventListener('DOMContentLoaded',init);
async function init(){buildChecklist();buildPhotoSlots();bindUI();await renderList();updateStorageInfo();if('serviceWorker'in navigator)navigator.serviceWorker.register('./service-worker.js').catch(console.error);}
function newRecord(){const now=new Date().toISOString();return{id:crypto.randomUUID(),formatVersion:'1.2',status:'active',createdAt:now,updatedAt:now,data:{},checklist:{bodywork:{},interior:{},mechanical:{}},photos:[],extraPhotos:[]};}
function checklistOptions(group,label){if(group==='bodywork')return['OK','Avaria'];if(group==='interior'){if(label==='Luzes de advertência no painel')return['Normal','Acesa'];if(['Vidros e travas elétricas','Multimídia / rádio','Câmera / sensor de estacionamento'].includes(label))return['OK','Problema','N/A'];return['OK','Avaria'];}if(['Pneus dianteiros','Pneus traseiros'].includes(label))return['Bom','Regular','Ruim'];if(label==='Rodas')return['OK','Avaria'];if(label==='Estepe')return['OK','Ruim','Ausente'];if(['Macaco e chave de roda','Chave reserva','Manual'].includes(label))return['Presente','Ausente'];if(['Ruído anormal do motor','Vazamento aparente'].includes(label))return['Não','Sim'];return['Normal','Anormal'];}
function buildChecklist(){for(const[group,items]of[['bodywork',BODYWORK],['interior',INTERIOR],['mechanical',MECHANICAL]]){const host=$(`#${group}Items`);host.innerHTML='';items.forEach((label,index)=>{const key=`${group}_${index}`,item=document.createElement('div');item.className='check-item';item.dataset.group=group;item.dataset.key=key;item.dataset.label=label;item.innerHTML=`<div class="check-title">${label}</div><div class="segmented">${checklistOptions(group,label).map(o=>`<button type="button" data-value="${o}">${o}</button>`).join('')}</div><div class="issue-fields"><input class="issue-note" placeholder="Observação (opcional)" /></div>`;host.appendChild(item);});}}
function buildPhotoSlots(){const host=$('#photoGrid');host.innerHTML='';PHOTO_SLOTS.forEach((label,index)=>{const card=document.createElement('div');card.className='photo-card';card.dataset.index=index;card.innerHTML=`<label><span>📷<br>${index+1}. ${label}</span><input type="file" accept="image/*" capture="environment" hidden /></label>`;host.appendChild(card);});}
function bindUI(){$('#newEvaluationBtn').addEventListener('click',()=>openRecord(newRecord()));$('#backBtn').addEventListener('click',async()=>{await saveNow();showHome();});
  $('#bottomBackBtn').addEventListener('click',async()=>{await saveNow();showHome();});$('#searchInput').addEventListener('input',renderList);$$('.tab').forEach(btn=>btn.addEventListener('click',()=>{$$('.tab').forEach(b=>b.classList.remove('active'));btn.classList.add('active');currentTab=btn.dataset.tab;renderList();}));$$('.accordion-head').forEach(h=>h.addEventListener('click',()=>{
    const section=h.closest('.accordion');
    if(section.classList.contains('open')){
      collapseSection(section);
    }else{
      $$('.accordion.open').forEach(other=>other!==section&&other.classList.remove('open'));
      section.classList.add('open');
      setTimeout(()=>section.scrollIntoView({behavior:'smooth',block:'start'}),40);
    }
  }));
  addCollapseButtons();$('#evaluationForm').addEventListener('input',scheduleSave);$('#evaluationForm').addEventListener('change',scheduleSave);$$('.check-item .segmented button').forEach(btn=>btn.addEventListener('click',()=>{const item=btn.closest('.check-item');item.querySelectorAll('.segmented button').forEach(b=>b.className='');const kind=valueKind(btn.dataset.value);btn.classList.add('selected',kind);item.querySelector('.issue-fields').classList.toggle('visible',['bad','warn'].includes(kind));scheduleSave();}));$$('.issue-note').forEach(i=>i.addEventListener('input',scheduleSave));bindPhotoInputsOnly();$('#extraPhotoInput').addEventListener('change',async e=>{const file=e.target.files[0];if(!file)return;const dataUrl=await compressImage(file);currentRecord.extraPhotos.push({id:crypto.randomUUID(),label:'Foto adicional',note:'',dataUrl});e.target.value='';renderPhotos();scheduleSave();});$('#generatePdfBtn').addEventListener('click',handleGeneratePdf);$('#importJsonInput').addEventListener('change',importJson);$$('[data-close-pdf-modal]').forEach(el=>el.addEventListener('click',closePdfModal));$('#openPdfBtn').addEventListener('click',openGeneratedPdf);$('#sharePdfBtn').addEventListener('click',shareGeneratedPdf);$('#downloadPdfBtn').addEventListener('click',downloadGeneratedPdf);
  $('#finishToHomeBtn').addEventListener('click',async()=>{closePdfModal();await saveNow();showHome();});window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;$('#installBtn').classList.remove('hidden');});$('#installBtn').addEventListener('click',async()=>{if(!deferredInstallPrompt)return;deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$('#installBtn').classList.add('hidden');});}
function addCollapseButtons(){
  $$('.accordion-body').forEach(body=>{
    if(body.querySelector('.collapse-section-btn'))return;
    const btn=document.createElement('button');
    btn.type='button';
    btn.className='btn collapse-section-btn';
    btn.textContent='Concluir e recolher';
    btn.addEventListener('click',async()=>{await saveNow();collapseSection(body.closest('.accordion'));});
    body.appendChild(btn);
  });
}
function collapseSection(section){
  section.classList.remove('open');
  requestAnimationFrame(()=>{
    const offset=(document.querySelector('.app-header')?.offsetHeight||64)+8;
    const top=section.getBoundingClientRect().top+window.scrollY-offset;
    window.scrollTo({top,behavior:'smooth'});
  });
}
function valueKind(v){const s=String(v||'').toLowerCase();if(['ok','normal','bom','excelente','presente','não','nao'].includes(s))return'good';if(['avaria','problema','anormal','ruim','sim','ausente','acesa'].includes(s))return'bad';if(['regular','atenção','atencao'].includes(s))return'warn';return'neutral';}
async function openRecord(record){currentRecord=record;$('#homeView').classList.remove('active');$('#formView').classList.add('active');loadForm(record);window.scrollTo({top:0,behavior:'instant'});}
function showHome(){$('#formView').classList.remove('active');$('#homeView').classList.add('active');currentRecord=null;renderList();updateStorageInfo();}
function loadForm(record){const form=$('#evaluationForm');form.reset();[...form.elements].forEach(el=>{if(el.name&&record.data?.[el.name]!==undefined)el.value=record.data[el.name]??'';});$$('.check-item').forEach(item=>{const saved=record.checklist?.[item.dataset.group]?.[item.dataset.key];item.querySelectorAll('.segmented button').forEach(b=>{b.className='';if(saved?.value===b.dataset.value)b.classList.add('selected',valueKind(saved.value));});const note=item.querySelector('.issue-note');note.value=saved?.note||'';note.closest('.issue-fields').classList.toggle('visible',!!saved?.note||['bad','warn'].includes(valueKind(saved?.value)));});calculateCosts();renderPhotos();updateFormUI();}
function collectRecord(){if(!currentRecord)return null;const fd=new FormData($('#evaluationForm')),data=Object.fromEntries(fd.entries());data.totalCost=$('#totalCost').value;const checklist={bodywork:{},interior:{},mechanical:{}};$$('.check-item').forEach(item=>{const selected=item.querySelector('.segmented button.selected');checklist[item.dataset.group][item.dataset.key]={label:item.dataset.label,value:selected?.dataset.value||'',note:item.querySelector('.issue-note').value.trim()};});$$('.extra-photo-entry').forEach(entry=>{const target=currentRecord.extraPhotos.find(p=>p.id===entry.dataset.id);if(target)target.note=entry.querySelector('textarea').value.trim();});currentRecord.data=data;currentRecord.checklist=checklist;currentRecord.updatedAt=new Date().toISOString();return currentRecord;}
function scheduleSave(){calculateCosts();updateFormUI();clearTimeout(saveTimer);$('#saveIndicator').textContent='Salvando…';saveTimer=setTimeout(saveNow,450);}async function saveNow(){if(!currentRecord)return;collectRecord();await dbPut(currentRecord);$('#saveIndicator').textContent='Salvo neste dispositivo';}
function calculateCosts(){const get=n=>parseMoney($(`[name="${n}"]`)?.value||'');const total=get('bodyworkCost')+get('mechanicalCost')+get('tiresCost')+get('otherCost');$('#totalCost').value=total?formatMoney(total):'';}function parseMoney(v){const s=String(v||'').replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.');return Number(s)||0;}function formatMoney(v){return new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v);}
function isFilledValue(value){
  return String(value ?? '').trim() !== '';
}

function countNamedFields(names){
  return names.filter(name => isFilledValue($(`[name="${name}"]`)?.value)).length;
}

function updateFormUI(){
  if(!currentRecord)return;

  const fd=Object.fromEntries(new FormData($('#evaluationForm')).entries());
  const title=[fd.brand,fd.model].filter(Boolean).join(' ')||fd.plate||'Nova avaliação';
  $('#formVehicleTitle').textContent=title;

  const archived=currentRecord.status==='archived';
  $('#formStatusBadge').textContent=archived?'Arquivada':'Em andamento';
  $('#formStatusBadge').classList.toggle('archived',archived);
  $('#evaluationDate').textContent=`Data da avaliação: ${formatDateOnly(currentRecord.createdAt)}`;

  // Vendedor/Cliente: telefone fixo não entra na contagem.
  const sellerFields=['sellerName','clientName','clientMobile'];
  const sellerDone=countNamedFields(sellerFields);

  // Identificação: todos os campos da seção.
  const vehicleFields=[
    'plate','brand','model','version','year',
    'mileage','color','transmission','fuel'
  ];
  const vehicleDone=countNamedFields(vehicleFields);

  // Checklists: todos os itens selecionáveis contam.
  const bodyworkDone=$$('#bodyworkItems .check-item')
    .filter(item=>item.querySelector('.segmented button.selected')).length;

  const interiorDone=$$('#interiorItems .check-item')
    .filter(item=>item.querySelector('.segmented button.selected')).length;

  const mechanicalDone=$$('#mechanicalItems .check-item')
    .filter(item=>item.querySelector('.segmented button.selected')).length;

  // Fotos: somente as fotos orientadas. Fotos adicionais não entram.
  const photosDone=(currentRecord.photos||[]).length;

  // Avaliação comercial: todos os campos, exceto observações finais.
  const commercialFields=[
    'referenceValue','requestedValue','bodyworkCost','mechanicalCost',
    'tiresCost','otherCost','suggestedPurchaseValue','overallRating'
  ];
  let commercialDone=countNamedFields(commercialFields);

  // Custo total de preparação é um campo da seção e também entra na contagem.
  const totalCostFilled=isFilledValue($('#totalCost')?.value);
  if(totalCostFilled) commercialDone+=1;
  const commercialTotal=commercialFields.length+1;

  const total=
    sellerFields.length+
    vehicleFields.length+
    BODYWORK.length+
    INTERIOR.length+
    MECHANICAL.length+
    PHOTO_SLOTS.length+
    commercialTotal;

  const done=
    sellerDone+
    vehicleDone+
    bodyworkDone+
    interiorDone+
    mechanicalDone+
    photosDone+
    commercialDone;

  const pct=total?Math.round(done/total*100):0;
  $('#progressText').textContent=`${pct}%`;
  $('#progressBar').style.width=`${pct}%`;

  setSectionStatus('sellerClient',sellerDone,sellerFields.length);
  setSectionStatus('vehicle',vehicleDone,vehicleFields.length);
  setSectionStatus('bodywork',bodyworkDone,BODYWORK.length);
  setSectionStatus('interior',interiorDone,INTERIOR.length);
  setSectionStatus('mechanical',mechanicalDone,MECHANICAL.length);
  setSectionStatus('photos',photosDone,PHOTO_SLOTS.length);
  setSectionStatus('commercial',commercialDone,commercialTotal);
}

function setSectionStatus(section,done,total){
  const node=$(`.accordion[data-section="${section}"] .section-status`);
  if(!node)return;
  node.textContent=done>=total?'Concluído':`${done}/${total} preenchidos`;
}"] .section-status`);node.textContent=done>=total?'Concluído':`${done}/${total} preenchidos`;}
function renderPhotos(){const byIndex=new Map((currentRecord?.photos||[]).map(p=>[p.index,p]));$$('#photoGrid .photo-card').forEach(card=>{const i=Number(card.dataset.index),p=byIndex.get(i);if(p){card.innerHTML=`<img src="${p.dataUrl}" alt="${p.label}"><button class="photo-remove" type="button">×</button><div class="photo-overlay">${i+1}. ${p.label}</div>`;card.querySelector('.photo-remove').addEventListener('click',()=>{currentRecord.photos=currentRecord.photos.filter(x=>x.index!==i);buildPhotoSlots();bindPhotoInputsOnly();renderPhotos();scheduleSave();});}});const extra=$('#extraPhotoList');extra.innerHTML='';(currentRecord?.extraPhotos||[]).forEach(p=>{const entry=document.createElement('div');entry.className='extra-photo-entry';entry.dataset.id=p.id;entry.innerHTML=`<img src="${p.dataUrl}" alt="Foto adicional"><label>Apontamento<textarea rows="5" placeholder="Descreva o motivo, avaria ou ocorrência relacionada a esta foto."></textarea></label><div class="extra-photo-actions"><button class="btn btn-danger" type="button">Excluir foto</button></div>`;entry.querySelector('textarea').value=p.note||'';entry.querySelector('textarea').addEventListener('input',scheduleSave);entry.querySelector('.btn-danger').addEventListener('click',()=>{currentRecord.extraPhotos=currentRecord.extraPhotos.filter(x=>x.id!==p.id);renderPhotos();scheduleSave();});extra.appendChild(entry);});updateFormUI();}
function bindPhotoInputsOnly(){$$('#photoGrid input[type=file]').forEach(input=>input.addEventListener('change',async e=>{if(!e.target.files[0])return;const card=e.target.closest('.photo-card'),index=Number(card.dataset.index),dataUrl=await compressImage(e.target.files[0]);currentRecord.photos=(currentRecord.photos||[]).filter(p=>p.index!==index);currentRecord.photos.push({index,label:PHOTO_SLOTS[index],dataUrl});renderPhotos();scheduleSave();}));}
async function compressImage(file){const dataUrl=await fileToDataUrl(file),img=await loadImage(dataUrl),max=1600,scale=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);return c.toDataURL('image/jpeg',.78);}function fileToDataUrl(file){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(file);});}function loadImage(src){return new Promise((res,rej)=>{const i=new Image();i.onload=()=>res(i);i.onerror=rej;i.src=src;});}
async function renderList(){
  const records=(await dbGetAll())
    .filter(r=>currentTab==='archived'?r.status==='archived':r.status!=='archived')
    .sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));

  const q=$('#searchInput').value.trim().toLowerCase();
  const filtered=records.filter(r=>{
    const d=r.data||{};
    return[d.plate,d.brand,d.model,d.version,d.clientName,d.sellerName].join(' ').toLowerCase().includes(q);
  });

  const host=$('#evaluationList');
  host.innerHTML='';
  $('#emptyState').classList.toggle('hidden',filtered.length>0);

  filtered.forEach(r=>{
    const d=r.data||{};
    const vehicle=[d.brand,d.model].filter(Boolean).join(' ')||'Avaliação sem identificação';
    const details=[d.year,d.version,d.fuel].filter(Boolean).join(' • ');
    const firstPhoto=(r.photos||[]).slice().sort((a,b)=>(a.index??999)-(b.index??999))[0];

    const card=document.createElement('article');
    card.className='eval-card eval-card-clickable';
    card.tabIndex=0;
    card.setAttribute('role','button');
    card.innerHTML=`
      <div class="eval-thumb ${firstPhoto?'':'eval-thumb-placeholder'}">
        ${firstPhoto?`<img src="${firstPhoto.dataUrl}" alt="Miniatura do veículo">`:'<span>🚘</span>'}
      </div>
      <div class="eval-info">
        <h3>${escapeHtml(vehicle)}</h3>
        <p class="eval-details">${escapeHtml(details||'Dados do veículo')}</p>
        <div class="eval-meta-row">
          <span class="plate-chip">${escapeHtml(d.plate||'Sem placa')}</span>
          <span class="status-chip ${r.status==='archived'?'archived':''}">${r.status==='archived'?'Arquivada':'Em andamento'}</span>
        </div>
        <small>Atualizado ${relativeTime(r.updatedAt)}</small>
      </div>
      <div class="kebab-wrap">
        <button class="kebab-btn" type="button" aria-label="Ações da vistoria">⋮</button>
        <div class="kebab-menu hidden">
          <button type="button" data-pdf>Gerar PDF</button>
          <button type="button" data-json>Exportar JSON</button>
          <button type="button" data-archive>${r.status==='archived'?'Desarquivar':'Arquivar'}</button>
          <button type="button" data-delete class="danger-menu-item">Excluir</button>
        </div>
      </div>`;

    card.addEventListener('click',e=>{if(!e.target.closest('.kebab-wrap'))openRecord(r);});
    card.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&!e.target.closest('.kebab-wrap')){e.preventDefault();openRecord(r);}});

    const menu=card.querySelector('.kebab-menu');
    card.querySelector('.kebab-btn').onclick=e=>{
      e.stopPropagation();
      $$('.kebab-menu').forEach(m=>m!==menu&&m.classList.add('hidden'));
      menu.classList.toggle('hidden');
    };
    card.querySelector('[data-pdf]').onclick=async e=>{e.stopPropagation();menu.classList.add('hidden');currentRecord=r;await handleGeneratePdf(false);currentRecord=null;};
    card.querySelector('[data-json]').onclick=e=>{e.stopPropagation();menu.classList.add('hidden');exportJson(r);};
    card.querySelector('[data-archive]').onclick=async e=>{e.stopPropagation();menu.classList.add('hidden');r.status=r.status==='archived'?'active':'archived';r.updatedAt=new Date().toISOString();await dbPut(r);renderList();updateStorageInfo();};
    card.querySelector('[data-delete]').onclick=async e=>{e.stopPropagation();menu.classList.add('hidden');if(!confirm('Excluir definitivamente esta vistoria? Todos os dados e fotos armazenados neste dispositivo serão removidos.'))return;await dbDelete(r.id);renderList();updateStorageInfo();toast('Vistoria excluída definitivamente.');};

    host.appendChild(card);
  });
}
async function handleGeneratePdf(saveFirst=true){try{if(saveFirst&&currentRecord)await saveNow();const record=collectRecord()||currentRecord;await generateEvaluationPDF(record);openPdfModal();}catch(err){console.error(err);alert('Não foi possível gerar o PDF. Verifique se o aplicativo foi carregado corretamente.');}}
function openPdfModal(){
  const record=currentRecord,d=record?.data||{};
  $('#previewVehicle').textContent=[d.brand,d.model].filter(Boolean).join(' ')||'Veículo';
  $('#previewDetails').textContent=[d.year,d.version,d.fuel].filter(Boolean).join(' • ')||'Dados da avaliação';
  $('#previewPlate').textContent=`Placa: ${d.plate||'—'}`;
  $('#previewMileage').textContent=`Quilometragem: ${d.mileage?Number(d.mileage).toLocaleString('pt-BR')+' km':'—'}`;
  $('#previewDate').textContent=`Gerado em ${new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date())}`;
  const preview=$('#previewPhoto');
  const photo=(record?.photos||[]).slice().sort((a,b)=>(a.index??999)-(b.index??999))[0];
  preview.innerHTML=photo?`<img src="${photo.dataUrl}" alt="Foto do veículo">`:'<span>🚘</span>';
  preview.classList.toggle('preview-placeholder',!photo);
  $('#pdfModal').classList.remove('hidden');
  const canShare=!!(lastGeneratedPdf&&navigator.canShare?.({files:[new File([lastGeneratedPdf.blob],lastGeneratedPdf.filename,{type:'application/pdf'})]}));
  $('#sharePdfBtn').disabled=!canShare;
}function closePdfModal(){$('#pdfModal').classList.add('hidden');}function openGeneratedPdf(){if(lastGeneratedPdf)window.open(lastGeneratedPdf.url,'_blank','noopener');}async function shareGeneratedPdf(){if(!lastGeneratedPdf)return;const file=new File([lastGeneratedPdf.blob],lastGeneratedPdf.filename,{type:'application/pdf'});if(navigator.canShare?.({files:[file]}))await navigator.share({title:'Relatório de avaliação de veículo',files:[file]});}function downloadGeneratedPdf(){if(lastGeneratedPdf)downloadBlob(lastGeneratedPdf.blob,lastGeneratedPdf.filename);}
function sanitizeFilePart(value,fallback){
  const text=String(value||fallback||'')
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-zA-Z0-9]+/g,'_')
    .replace(/^_+|_+$/g,'');
  return text||fallback||'nao_informado';
}
function evaluationBaseFilename(record){
  const d=record?.data||{};
  const years=String(d.year||'').match(/\d{4}/g);
  const year=years?.length?years[years.length-1]:(d.year||'sem_ano');
  return [
    sanitizeFilePart(d.brand,'sem_marca'),
    sanitizeFilePart(d.model,'sem_modelo'),
    sanitizeFilePart(year,'sem_ano'),
    sanitizeFilePart(d.color,'sem_cor')
  ].join('_');
}
function exportJson(record){
  const blob=new Blob([JSON.stringify(record,null,2)],{type:'application/json'});
  downloadBlob(blob,`${evaluationBaseFilename(record)}.json`);
}
async function importJson(e){const file=e.target.files[0];if(!file)return;try{const obj=JSON.parse(await file.text());if(!obj.formatVersion||!obj.id)throw new Error('Arquivo incompatível');const imported={...obj,id:crypto.randomUUID(),updatedAt:new Date().toISOString(),createdAt:obj.createdAt||new Date().toISOString(),data:obj.data||{},checklist:obj.checklist||{bodywork:{},interior:{},mechanical:{}},photos:obj.photos||[],extraPhotos:(obj.extraPhotos||[]).map(p=>({...p,note:p.note||''}))};delete imported.data.owner;delete imported.data.evaluator;await dbPut(imported);toast('Avaliação importada com sucesso.');renderList();updateStorageInfo();}catch(err){alert('Não foi possível importar este arquivo JSON. Verifique se ele foi gerado pelo Speed Avaliação.');}e.target.value='';}
function downloadBlob(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);}function formatDate(iso){try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short',timeStyle:'short'}).format(new Date(iso));}catch{return'';}}function formatDateOnly(iso){try{return new Intl.DateTimeFormat('pt-BR',{dateStyle:'short'}).format(new Date(iso));}catch{return'--/--/----';}}function relativeTime(iso){
  const diff=Math.max(0,Date.now()-new Date(iso).getTime()),min=Math.floor(diff/60000);
  if(min<1)return'agora';
  if(min<60)return`há ${min} min`;
  const h=Math.floor(min/60);
  if(h<24)return`há ${h} h`;
  const d=Math.floor(h/24);
  return d===1?'há 1 dia':`há ${d} dias`;
}
function escapeHtml(s){return String(s||'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));}function toast(msg){const t=$('#toast');t.textContent=msg;t.classList.remove('hidden');setTimeout(()=>t.classList.add('hidden'),2200);}async function updateStorageInfo(){
  const count=(await dbGetAll()).length;
  if(!navigator.storage?.estimate){
    $('#storageInfo').textContent=`${count} avaliações • armazenamento local ativo`;
    $('#storagePercent').textContent='—';
    $('#storageProgressBar').style.width='0%';
    return;
  }
  const {usage=0,quota=0}=await navigator.storage.estimate();
  const fmt=n=>n>1024**3?`${(n/1024**3).toFixed(1)} GB`:`${(n/1024**2).toFixed(0)} MB`;
  const pct=quota?Math.min(100,Math.round(usage/quota*100)):0;
  $('#storageInfo').textContent=`${fmt(usage)} de ${fmt(quota)} utilizados • ${count} avaliações`;
  $('#storagePercent').textContent=`${pct}%`;
  $('#storageProgressBar').style.width=`${pct}%`;
}
document.addEventListener('click',e=>{if(!e.target.closest('.kebab-wrap'))$$('.kebab-menu').forEach(m=>m.classList.add('hidden'));});