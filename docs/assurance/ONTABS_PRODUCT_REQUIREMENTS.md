# OnTabs — Requisitos de Produto e Especificação Funcional (Phase 0/1)
**Identificador**: ONTABS-SPEC-PRD-001  
**Classificação**: Requisito de Produto, Arquitetura, UX e Engenharia Musical  
**Data**: 2026-10-19  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  
**Referência Publicada**: `https://ontabs.base44.app`  

---

## 1. Visão de Produto & Diferencial Estratégico

O OnTabs evolui de um simples gerador de tablaturas para uma **plataforma soberana de engenharia musical, aprendizagem e coordenação de banda multi-instrumental**.

O diferencial central é responder à pergunta:
> *"Como reproduzir musicalmente a mesma gravação em instrumentos diferentes, mostrando o que cada instrumento realmente toca, como executar cada passagem e por que aquela transcrição faz sentido — individualmente e no contexto do arranjo coletivo da banda."*

### 1.1 Quatro Pilares Conceituais Inconfundíveis
1. **Separação de Stems**: Isolar com segurança acústica os componentes de uma mix (Vocais, Bateria, Baixo, Outros/Instrumental).
2. **Transcrição Musical**: Estimar eventos físicos (onsets, $F_0$, acordes, polifonia, métrica temporal) a partir do áudio.
3. **Adaptação Instrumental ("Play It Your Way")**: Traduzir a interpretação musical para o vocabulário idiomático de cada instrumento (Guitarra Lead/Rítmica, Baixo, Violão, Bateria, Saxofone), respeitando tessitura, afinação, ergonomia e dificuldade.
4. **Coordenação Coletiva & Acompanhamento ("Active Listener & Band Rehearsal")**: Mapear as relações entre os instrumentos (dobras, uníssonos, contrapontos, transições) e prover feedback auditivo em tempo real que valoriza a criatividade e distingue variação musical de erro de execução.

---

## 2. Taxonomia de Instrumentos & Capacidades Alvo

| Instrumento | Papel Musical Primário | Representação de Saída | Status Atual no Repositório |
|---|---|---|---|
| **Guitarra Elétrica (Lead & Rítmica)** | Riffs, solos, condução harmônica, texturas | Tablatura 6 cordas (afinações padrão, Drop D/C), técnicas (bends, slides, h/p) | `PARTIALLY_VERIFIED` (Otimização ergonômica e validação física implementadas; separação de duas guitarras planejada) |
| **Baixo Elétrico (4 e 5 Cordas)** | Sustentação harmônica, conexão rítmica com o bumbo (kick) | Tablatura de baixo (4/5 cordas), fundamental, oitavas, ghost notes | `PARTIALLY_VERIFIED` (Mapeamento de notas implementado; transcrição a partir de stem de baixo em especificação) |
| **Violão (Acoustic Guitar)** | Cifras, batidas (strumming), dedilhados (fingerpicking), pestanas | Cifras harmônicas, diagramas de acordes, tablatura acústica, indicação de capo | `IMPLEMENTED` (Suporte a afinações e acordes no engine; visualização com capo em desenvolvimento) |
| **Bateria (Drum Kit)** | Pulsação, tempo, dinâmica, acentuações, viradas (fills) | Drum Grid, notação rítmica (Kick, Snare, Hi-Hat, Toms, Pratos) | `NOT_IMPLEMENTED` (Planejado no roadmap de expansão multi-instrumental) |
| **Saxofone (Alto / Tenor)** | Linha melódica lírica, dinâmica de respiração, solo | Partitura transposta (Eb para Alto, Bb para Tenor), tom de concerto vs. notação | `NOT_IMPLEMENTED` (Planejado no roadmap de expansão multi-instrumental) |

---

## 3. Requisitos Funcionais do Sistema (RF)

### RF-01: Ingestão de Áudio & Active Listener
- **RF-01.1**: Aceitar uploads de arquivos locais nos formatos `.mp3`, `.wav`, `.ogg`, `.flac`, `.aac` e `.mp4` (com faixa de áudio AAC/PCM).
- **RF-01.2**: Aplicar validação rigorosa pré-decodificação: tamanho máximo de 30MB, duração máxima de 600 segundos, rejeição imediata de arquivos de 0 bytes e captura de falhas de codec com mensagens em linguagem clara.
- **RF-01.3**: Suportar resolução de links de plataformas autorizadas (YouTube e Spotify) exclusivamente para extração de metadados catalográficos (título, artista, ISRC, duração) com estrita defesa contra SSRF e aviso explícito de necessidade de arquivo de áudio autorizado para transcrição.
- **RF-01.4**: Suporte a escuta com microfone local (Active Listener) para afinação em tempo real e verificação de acordes executados, com consentimento explícito e privacidade 100% no navegador.

### RF-02: Separação de Stems & Mixagem Multicanal
- **RF-02.1**: Pipeline de separação de stems padrão de 4 canais: `vocals`, `drums`, `bass`, `other`, além de faixa `instrumental` combinada e mix original.
- **RF-02.2**: Player com controles independentes por stem: Solo, Mute, Ganho/Volume (-inf a +6dB), Panorâmica estéreo (-100% L a +100% R).
- **RF-02.3**: Sincronização temporal estrita entre todos os canais de stems e o cursor visual da tablatura/partitura com correção de deriva (drift compensation).

### RF-03: Inteligência de Arranjo Coletivo (Collective Arrangement Intelligence)
- **RF-03.1 (Double Guitar Intelligence)**: Capacidade de correlacionar onsets, contornos melódicos e espectro para distinguir partes de guitarra sobrepostas (Guitarra Rítmica vs. Guitarra Solo/Riff).
- **RF-03.2 (Classificação de Relações de Partes)**: Classificar formalmente trechos simultâneos como: `UNISON`, `OCTAVE_DOUBLING`, `HARMONIZED`, `RHYTHMIC_COMPLEMENT`, `INDEPENDENT_LINES`, `HARMONIC_SUPPORT`, `TEXTURAL_LAYER`, `POSSIBLE_DOUBLING` ou `UNKNOWN_RELATION`.
- **RF-03.3 (Arrangement Map)**: Linha do tempo estrutural integrando seções (Intro, Verso, Refrão, Solo, Ponte, Break, Coda), instrumentação ativa em cada compasso e convenções de ensaio.
- **RF-03.4 (Detecção de Transições)**: Identificar timestamps e natureza de mudanças de seção, variações de andamento, viradas de bateria e quebras coletivas.

### RF-04: Transcrição, Teoria & Adaptação Instrumental ("Play It Your Way")
- **RF-04.1**: Detecção de $F_0$ por autocorrelação interpolada para sinais monofônicos e análise de cromagrama multi-harmônico para progressões de acordes.
- **RF-04.2**: Otimização biomecânica de tablaturas balanceando distância de casas, uso preferencial de cordas soltas, minimização de pestanas e respeito a afinações alternativas.
- **RF-04.3**: Quatro perfis de dificuldade funcionais: `Beginner` (voicings abertos, casas 0-3), `Intermediate` (pestanas básicas, acordes com 7ª), `Advanced` (posições ao longo do braço todo, arpejos), `Expert` (transcrição fidedigna com técnicas completas).
- **RF-04.4**: Transposição e adaptação idêntica da obra para instrumentos de tessitura distinta (ex: linha de guitarra adaptada para baixo ou saxofone) com marcação de oitava alterada.

### RF-05: Player Sincronizado, EQ & Ferramentas de Estudo
- **RF-05.1**: Loop A-B com precisão de milissegundos para repetição de trechos difíceis.
- **RF-05.2**: Controle de velocidade variável (50% a 150%) com preservação de pitch (time-stretching via Web Audio API).
- **RF-05.3**: Equalizador paramétrico/gráfico de 5 bandas com filtros biquad no cliente e presets otimizados para estudo (Clareza de Guitarra, Definição de Baixo, Supressão Vocal).
- **RF-05.4**: Afinador cromático integrado com detecção de desvio em cents e suporte a A4 configurável (440Hz baseline).

### RF-06: Acesso, Trial de 168h, Planos & Soberania
- **RF-06.1**: Uso gratuito degustação (1 conversão) para visitantes anônimos com tracking por fingerprint/X-Visitor-Id server-side.
- **RF-06.2**: Trial programático de 7 dias (168 horas corridas UTC) iniciado no cadastro do usuário com avaliação estrita no backend.
- **RF-06.3**: Bloqueio server-side categorizado das rotas de processamento musical após a expiração do trial, mantendo acesso às páginas públicas e biblioteca salva.
- **RF-06.4**: Checkout transparente: enquanto o gateway de pagamento (Stripe/Pix) estiver em homologação, o sistema rejeita ativações fictícias com HTTP 402, instruindo o uso do Trial Pro.

---

## 4. Requisitos Não Funcionais (RNF)

- **RNF-01 (Independência de Runtime)**: 100% desacoplado de SDKs, créditos ou serviços proprietários do Base44. Execução autônoma em Node.js nativo + Vite.
- **RNF-02 (Segurança & SSRF)**: Rejeição imperativa de qualquer chamada de rede externa a endereços de loopback (`127.0.0.1`, `localhost`), metadados de nuvem (`169.254.169.254`) e blocos RFC 1918.
- **RNF-03 (Concorrência & Persistência)**: Fila de mutex serializada no backend para assegurar integridade atômica do banco de dados em disco sem race conditions.
- **RNF-04 (Desempenho & Acessibilidade)**: Interface sem travamentos (offload de DSP para Web Workers/workers assíncronos), suporte a `prefers-reduced-motion` e conformidade com WCAG 2.1 AA.
- **RNF-05 (Conformidade Jurídica & Transparência)**: Nenhuma transcrição estimada pode ser apresentada como partitura oficial proprietária. Toda saída incerta deve carregar indicador explícito de confiança.
