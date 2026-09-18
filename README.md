# Speed Avaliação

PWA mobile-first para avaliação comercial de veículos usados da Speed Multimarcas.

## Recursos implementados

- Funcionamento como PWA instalável
- Layout mobile-first e responsivo
- Armazenamento local com IndexedDB
- Salvamento automático
- Seções em accordion, recolhidas por padrão
- Listagem separada em "Em andamento" e "Arquivadas"
- Arquivar e desarquivar avaliações
- Importar, exportar e compartilhar JSON individual
- Fotos orientadas com captura pela câmera
- Compressão de imagens antes do armazenamento
- Geração de PDF com cabeçalho, rodapé, paginação, logo e cores da empresa
- Resultados positivos em verde e negativos em vermelho no PDF
- Indicador de uso de armazenamento
- Instalação no celular via navegador compatível

## Publicar no GitHub Pages

1. Crie um repositório no GitHub.
2. Envie todo o conteúdo desta pasta para a raiz do repositório.
3. No GitHub, abra **Settings > Pages**.
4. Em **Build and deployment**, escolha **Deploy from a branch**.
5. Selecione a branch `main` e a pasta `/ (root)`.
6. Salve e aguarde a URL do GitHub Pages.

## Instalação no celular

Abra a URL publicada no Chrome/Edge compatível. O botão **Instalar app** aparece quando o navegador liberar a instalação do PWA.

## Observação importante

Os dados das avaliações ficam no dispositivo/browser do usuário. Limpar os dados do navegador pode apagar as vistorias. Use a exportação JSON como backup individual.

## Estrutura

- `index.html`
- `manifest.json`
- `service-worker.js`
- `css/styles.css`
- `js/database.js`
- `js/pdf.js`
- `js/app.js`
- `assets/logo.jpg`
- `assets/icons/`


## Atualização 1.1
- Bloco Vendedor/Cliente como primeira seção
- Data automática no cabeçalho
- Exclusão definitiva na listagem
- Dentro da vistoria permanece apenas Gerar PDF
- Após gerar PDF: Abrir, Compartilhar e Baixar
- Checklist do PDF em duas colunas com linhas azuis
- Fotos no PDF: duas por página, uma sobre a outra
- Fotos adicionais com campo Apontamento
- Correção do carregamento do logo no formulário e no PDF


## Atualização 1.2

- Novo logo oficial no app, PDF e ícones do PWA.
- Azul do logo (#0C024E) como cor primária.
- Amarelo do logo (#FDCD02) como cor secundária.
- Elementos azuis do PDF alinhados ao azul do novo logo.
- Removido o botão "Compartilhar JSON" da listagem de vistorias.
- Linhas azuis finas também em Vendedor/Cliente, Identificação do veículo e Avaliação comercial.
- Rótulos dos campos em negrito no PDF.
- PDF e JSON passam a usar o padrão de nome: marca_modelo_ano_cor.
