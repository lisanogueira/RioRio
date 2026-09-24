# RioRio — página principal (redesign)

Experiência editorial digital para divulgar o livro **RioRio — A história da Cidade do
Rio de Janeiro em quadrinhos: 1500–2000**, o projeto **Caminhos do Rio**, a autora
**Renata de Faria Pereira** e o personagem **Criu Carioca**.

Conceito: **“Uma viagem desenhada pela história do Rio”** — papel quente, quadrinhos
originais como protagonistas e o Criu como anfitrião.

## Como visualizar

Abrir direto: `index.html` funciona ao ser aberto no navegador (as fontes vêm do Google
Fonts; sem internet, caem para fontes do sistema). Para o comportamento completo (JS,
caminhos relativos garantidos), sirva a pasta localmente:

```bash
node server.mjs
```

Depois acesse `http://localhost:4599/`. (`server.mjs` é apenas um servidor estático de
desenvolvimento — não faz parte do site; pode ser removido ao publicar.)

## Stack e decisão

Diretório inicial vazio, sem stack. Como o entregável é **uma** homepage que precisa ser
resiliente sem JS, com CLS≈0 e bom Core Web Vitals, optou-se por **HTML + CSS + JavaScript
vanilla, sem framework nem biblioteca de animação** (o próprio brief recomenda CSS +
IntersectionObserver para efeitos simples). Zero dependências → build de produção trivial
(os arquivos já são o resultado final) e preview imediato.

## Estrutura

```
index.html              # todas as seções (componentes marcados por comentários)
assets/css/styles.css   # design system + layout + motion (sumário no topo)
assets/js/main.js       # progressive enhancement (9 módulos, comentados)
assets/images/          # 29 imagens reais do acervo (ver mapeamento abaixo)
server.mjs              # servidor estático só para preview local
```

Componentes (seções) no `index.html`: Header · Hero · EditorialManifesto · BookShowcase ·
HistoricalTimeline · **Atividades** · CriuIntroduction · CaminhosSection/RouteCard ·
ArchiveGallery · AuthorSection · SchoolsCTA · Closing · ContactSection · Footer · Lightbox.

## Atividades (novo)

Seção `#atividades` com conteúdo real dos cadernos do Caminhos do Rio:
- **Atividade interativa “A fundação da cidade”** — o estudante associa cada morro (Cara de
  Cão, Urca, Pão de Açúcar) ao número na imagem histórica, com verificação e feedback
  acessível (cor + ✓/✗ + mensagem, nunca só cor). Lógica em `main.js` (módulo 10).
- **Série “Resumo da história do Rio”** — as 5 atividades de mapa, uma por época da linha do tempo.
- **Imagens antigas para observar** — 4 gravuras históricas (São Sebastião 1775, Debret,
  Steinmann, Rugendas) com legenda real; clique amplia no lightbox.

Este trabalho **evolui o site atual** (mantém identidade, conteúdo e ordem geral) e adiciona
as atividades — não substitui as ilustrações originais nem inventa conteúdo.

## Design

- **Paleta (WCAG AA):** papel `#FBF7EF`, tinta `#14233B`, ciano institucional `#0E7C8B`
  (texto/link `#0A5A66`), azul `#123C8C`, amarelo `#F2B705` (descoberta/fundos), rosa
  `#C11F5B` (chamadas), verde `#2F8F5B` e laranja `#D9642A` (categorias de roteiro).
  Hierarquia ≈ 65% neutros / 20% ciano-azul / 15% acentos. Amarelo e rosa nunca em texto
  pequeno sobre branco (só em fundos ou texto escuro).
- **Tipografia:** Fraunces (display editorial) + Archivo (sans, corpo/UI) + Caveat (apenas
  anotações curtas). Tamanhos fluidos com `clamp()`.

## Motion

Entrada da capa “sobre a mesa”, Criu entrando por trajetória curta, parallax de ponteiro
só no hero (`pointer:fine`), reveal por IntersectionObserver, linha do tempo com progresso
no scroll, traços SVG via `stroke-dashoffset`, hovers discretos. Tudo obedece a
`prefers-reduced-motion` e a página é 100% funcional sem JavaScript.

## Mapeamento de imagens (ativos reais)

Todas as imagens em `assets/images/` foram baixadas do site oficial do projeto
(`rj.riorio.com.br`). Nomes locais → origem:

| Local | Origem (rj.riorio.com.br/wp-content/uploads/…) |
|---|---|
| capa-riorio.webp | 2025/11/RioRio-capa1-scaled.webp |
| criu.png | 2023/07/criu_v4.png |
| criu-prefeito.webp | 2026/01/prefeito_criu.webp |
| era1-fundacao.webp | 2026/03/Primeira-Missa.webp |
| era2-expansao.webp | 2025/11/FRANCESES-NA-GUANABARA_v2-scaled.webp |
| era3-seculo19.webp | 2026/03/praca-xv-1832-500x744px.webp |
| era4-moderna.webp | 2025/11/PRIMEIRAS-ESTRADAS-DE-FERRO-scaled.webp |
| era5-contemporanea.webp | 2025/11/SURTO-MIGRATORIO-DOS-ANOS-40-scaled.webp |
| comic-*.webp | 2026/03/{Capital-do-reino,transferencia,Governadores,debret}.webp |
| rot-*.webp | 2025/11 e 2025/12 (fotos dos 10 roteiros) |
| caderno-caminhos.webp | 2025/11/CAPA-Caminhos-1.webp |
| premio-iab / premio-camara / doc-* / carta-estudante | 2025/11 e 2026/03 (acervo) |

## Pendências reais (para o cliente decidir)

1. **Retrato da autora:** não há foto da Renata no acervo público. A seção “A autora” usa,
   provisoriamente, um registro institucional do projeto (`criu-prefeito.webp`). **Substituir
   por uma foto real da autora** quando disponível (trocar o `src` em `#autora`).
2. **Otimização de imagens:** as imagens são as originais do WordPress (algumas > 400 KB).
   Para produção, gerar versões responsivas (`srcset`) e recomprimir — total atual ~6 MB.
   A imagem LCP (capa) já tem `preload` + `fetchpriority=high`; as demais usam `loading=lazy`.
3. **Roteiro 4 (Cristo Redentor):** marcado como *“Indisponível no momento”*, conforme o
   status atual do site. Rever quando voltar a ser oferecido.
4. **Páginas internas:** a home conduz para `#contato` (WhatsApp/e-mail). Os fluxos de
   “conhecer o livro”, roteiros completos, acervo completo e registros pertencem a páginas
   internas — **não foi criado checkout** (não existe no projeto). Preços não foram inventados.
5. **Ilustrações originais:** nenhuma arte da autora foi substituída por genérica/IA. Os
   ornamentos desenhados (linhas, setas, balão, carimbo) são elementos de UI originais.

## Conteúdo

Textos baseados no conteúdo real dos documentos do projeto. Frases preservadas: “Conhecer
para amar. Amar para preservar.”, “O Rio é a nossa casa gigante.”, “A história da Cidade do
Rio de Janeiro em quadrinhos: 1500–2000.”, além das falas do Criu Carioca. Sem datas,
prêmios, depoimentos ou estatísticas inventados.
