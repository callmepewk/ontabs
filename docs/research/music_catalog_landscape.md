# ONTABS — PANORAMA DE MERCADO, FONTES DE ÁUDIO & ESTRATÉGIA DE CATÁLOGO
**Data:** 19/10/2026 | **Versão:** 1.0.0-MVP  
**Responsável Técnico:** Antigravity Research & Systems Architecture

---

## 1. O Abismo entre Metadados, Streaming e Licença de Processamento

A ilusão mais comum em produtos musicais digitais é presumir que a ubiquidade de uma música no Spotify, YouTube ou Apple Music significa que qualquer desenvolvedor pode criar uma aplicação que baixe esse áudio, separe os instrumentos e gere tablaturas.

A realidade jurídica e técnica impõe quatro categorias absolutamente estanques:

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. API DE METADADOS (Spotify, MusicBrainz, Discogs)                    │
│    - Permite: Título, artista, ISRC, capa, popularidade, BPM estimado  │
│    - VEDA: Captura do áudio, cache permanente, modelos de IA           │
├────────────────────────────────────────────────────────────────────────┤
│ 2. REPRODUTORES DE STREAMING INTEGRADOS (Spotify SDK, YouTube Embed)  │
│    - Permite: Tocar a música no cliente autenticado (Premium)          │
│    - VEDA: Acesso a buffers de áudio PCM, DSP, separação, gravação     │
├────────────────────────────────────────────────────────────────────────┤
│ 3. ACERVOS DE DOMÍNIO PÚBLICO E CREATIVE COMMONS COMERCIAL (CC BY)     │
│    - Permite: Download do PCM, análise espectral, tablaturas, streaming│
│    - Condição: Manutenção de crédito canônico e respeito a fonogramas  │
├────────────────────────────────────────────────────────────────────────┤
│ 4. LICENCIAMENTO DIRETO COM GRAVADORAS E EDITORAS (Major / Indie)      │
│    - Permite: Exploração comercial irrestrita de catálogo famoso       │
│    - Exige: Contratos de sincronização, adiantamento mínimo e royalties │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Auditoria Primária das Principais Fontes Investigadas

### 2.1 GuitarSet (NYU MARL)
- **O que é:** 360 excertos de violão acústico (estilo fingerstyle e comping) gravados com captação hexafônica independente (uma faixa por corda).
- **Licenciamento:** Código sob licença MIT; gravações e anotações JAMS/MIDI sob **CC BY 4.0**.
- **Veredito OnTabs:** **ATIVO PREMIUM PARA BENCHMARK**. É a fonte mais limpa do mundo acadêmico para avaliar erro de digitação de traste e pitch de violão. Autorizado para testes e processamento comercial com atribuição obrigatória.

### 2.2 MUSDB18 e MedleyDB
- **O que é:** Datasets de referência para separação de fontes (stems de drums, bass, vocals, other).
- **Licenciamento:** **CC BY-NC-SA 4.0** (Non-Commercial).
- **Veredito OnTabs:** **RESTRITO A TESTES INTERNOS DE REGRESSÃO**. Não pode ser exposto a clientes pagantes nem ser parte de planos de assinatura.

### 2.3 Cambridge Music Technology (Mixing Secrets)
- **O que é:** Acervo curado por Mike Senior com centenas de projetos multipista reais de estúdio.
- **Licenciamento:** Licença própria para prática educacional pessoal. Veda expressamente uso comercial, portfólio monetizado e **proíbe categoricamente treinamento de modelos de IA**.
- **Veredito OnTabs:** **RESTRITO A AFERIÇÃO DIDÁTICA INTERNA**. Proibida qualquer ingestão em modelos de inferência comercial.

### 2.4 Acervos de Domínio Público Brasileiro (Discografia Brasileira IMS / MEC)
- **O que é:** Milhares de gravações originais digitalizadas de discos de 78 RPM (1902 a 1954).
- **Licenciamento:** Domínio público pleno (composição e fonograma pré-1954 sob a Lei 9.610/98).
- **Veredito OnTabs:** **COLUNA DORSAL DO CATÁLOGO INICIAL**. Permite demonstrações ricas de choro, samba antigo e violão brasileiro sem risco de litígio ou exigência de pagamento ao ECAD.

---

## 3. Rota Estratégica de Expansão Comercial de Catálogo (Fase 2)

Para incorporar artistas contemporâneos de peso comercial (como bandas de rock nacional e internacional), o OnTabs deve seguir três rotas legítimas:

1. **Parcerias com Selos Independentes (Indie Labels & Aggregators):**
   - Empresas como CD Baby, DistroKid, ONErpm e gravadoras independentes possuem contratos flexíveis de sincronização para aplicativos educativos e musicais.
2. **Licenciamento Direto com Bandas e Criadores:**
   - Acordos de cessão de multitracks de estúdio com bandas que desejam promover suas músicas no ecossistema OnTabs Play e Tablatura.
3. **Licença de Reprodução Gráfica com Editoras (Sync & Print Rights):**
   - Negociação com associações editoriais para publicação de tablaturas canônicas, remunerando os compositores originais.
