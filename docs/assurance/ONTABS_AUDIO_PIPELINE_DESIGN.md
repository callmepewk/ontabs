# OnTabs — Projeto do Pipeline de Áudio, DSP & Engenharia Musical (Phase 0/1)
**Identificador**: ONTABS-SPEC-AUDIO-001  
**Classificação**: Especificação de DSP, Processamento de Sinal e Machine Learning  
**Data**: 2026-10-19  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Visão Geral do Pipeline de Áudio

O processamento de sinal do OnTabs foi desenhado para ser determinístico, auditável e balanceado entre execução no cliente (Web Audio API) e serviços de retaguarda:

```
[Entrada de Áudio] (Upload local / Link com áudio / Microfone)
       │
       ▼
[Validação Estrita] (Tamanho ≤ 30MB, Duração ≤ 600s, Codec AAC/PCM/MP3/OGG)
       │
       ▼
[Decodificação & Resampling] (Web Audio API -> Float32Array Mono @ 44.1kHz)
       │
       ├─────────────────────────────────┐
       ▼                                 ▼
[Envelope RMS & Spectral Flux]    [Separação de Stems] (Voz, Bateria, Baixo, Outros)
       │                                 │
       ▼                                 ▼
[Detecção de Onsets & BPM]        [Canais Especializados de Análise]
       │                                 │
       ├─────────────────────────────────┘
       ▼
[Pitch Tracking Fundamental (F0)] (Autocorrelação no tempo + Interpolação Parabólica)
       │
       ▼
[Extração Cromática (Goertzel/Chroma)] (Vetor de 12 classes de notas)
       │
       ▼
[Detecção Harmônica & Tonalidade] (Algoritmo Krumhansl-Schmuckler + Acordes)
       │
       ▼
[Representação Musical Intermediária (IR)]
       │
       ├─────────────────────────────────────────────────┐
       ▼                                                 ▼
[Inteligência de Arranjo Coletivo]            [Adaptação Instrumental ("Play It Your Way")]
 (Double Guitar, Transições, Mapa da Banda)     (Guitarra, Baixo, Violão, Bateria, Saxofone)
       │                                                 │
       └────────────────────────┬────────────────────────┘
                                ▼
               [Validação Física & Tocabilidade]
                                │
                                ▼
               [Player Sincronizado & Tablatura]
```

---

## 2. Detalhamento Algorítmico das Etapas de DSP

### 2.1 Envelope de Energia RMS & Spectral Flux Novelty Curve
Calculado sobre quadros de 512 amostras com avanço temporal constante ($fps = sampleRate / 512$):
$$\text{RMS}_i = \sqrt{\frac{1}{N} \sum_{j=0}^{N-1} x[i \cdot N + j]^2}$$
$$\text{Flux}_i = \max(0, \text{RMS}_i - \text{RMS}_{i-1})$$
O *Spectral Flux* representa os ataques candidatos (onsets), eliminando falsos positivos provocados pelo sustain de notas anteriores.

### 2.2 Estimativa de BPM por Autocorrelação de Fluxo
A periodicidade rítmica é calculada por autocorrelação do vetor de fluxo entre 60 e 190 BPM:
$$R(\tau) = \frac{1}{M - \tau} \sum_{k=\tau}^{M-1} \text{Flux}[k] \cdot \text{Flux}[k - \tau], \quad \tau = \text{round}\left(\frac{60}{\text{BPM}} \cdot fps\right)$$
O valor de $\tau$ que maximiza $R(\tau)$ determina o andamento fundamental, gerando um beat grid alinhado com o primeiro onset expressivo.

### 2.3 Rastreamento de Pitch Fundamental ($F_0$) por Autocorrelação Interpolada
Para cada janela temporal de 2048 amostras nos instantes de nota ativa:
1. Rejeição de silêncio acústico quando $\text{RMS} < 0.005$.
2. Cálculo da autocorrelação normalizada $r(\ell)$ entre $\ell_{\min} = \frac{f_s}{1000\text{Hz}}$ e $\ell_{\max} = \frac{f_s}{70\text{Hz}}$.
3. Detecção do pico máximo $r(\ell^*)$. Se $r(\ell^*) < 0.35$, o sinal é descartado como ruído aperiódico.
4. **Interpolação Parabólica Sub-amostra**:
   $$\delta = \frac{r(\ell^*+1) - r(\ell^*-1)}{2(2r(\ell^*) - r(\ell^*-1) - r(\ell^*+1))}$$
   $$f_0 = \frac{f_s}{\ell^* + \delta}$$
   $$\text{MIDI} = 69 + 12 \cdot \log_2\left(\frac{f_0}{440}\right)$$
   $$\text{Cents} = (\text{MIDI}_{\text{exato}} - \text{round}(\text{MIDI})) \cdot 100$$

### 2.4 Extração Cromática de Goertzel & Tonalidade de Krumhansl-Schmuckler
Para estimar a tonalidade e progressão de acordes sem FFT completa de alto custo, aplicam-se filtros de segunda ordem de Goertzel sobre as frequências centrais das 12 notas de C2 a B6:
- O vetor cromático normalizado resultante $\mathbf{C} = [c_0, c_1, \dots, c_{11}]$ é correlacionado contra os 24 perfis modais de Krumhansl-Schmuckler (12 maiores, 12 menores):
  $$r(k) = \frac{\sum (c_i - \bar{c})(P_k[i] - \bar{P}_k)}{\sqrt{\sum (c_i - \bar{c})^2 \sum (P_k[i] - \bar{P}_k)^2}}$$
A chave com maior coeficiente de correlação de Pearson $r(k)$ define a tonalidade da obra (`songKey`).

---

## 3. Otimização Biomecânica de Dedilhados

Dada uma sequência de notas com números MIDI $\{m_1, m_2, \dots, m_T\}$, cada nota pode ser tocada em múltiplos pontos $(c, f)$ do braço (corda $c \in [1..6]$, casa $f \in [0..24]$).

A função de custo acumulado que o algoritmo de Dijkstra/Viterbi minimiza é:
$$J = \sum_{t=1}^{T} \left[ \text{FretPenalty}(f_t) + \text{DistanceCost}(f_t, f_{t-1}) + \text{StringChangeCost}(c_t, c_{t-1}) + \text{OpenStringBonus}(f_t) \right]$$

Onde:
- $\text{FretPenalty}(f)$: penaliza casas excessivamente altas ($f > 15$).
- $\text{DistanceCost}(f_t, f_{t-1})$: penaliza saltos maiores que 4 casas entre notas consecutivas ($\sim \text{span}$ natural da mão).
- $\text{OpenStringBonus}(f=0)$: bonificação que incentiva o uso de cordas soltas para diminuir fadiga física.

---

## 4. Estratégia de Sincronização & Prevenção de Deriva

O player de áudio não depende de `setInterval` ou `requestAnimationFrame` para contagem de tempo:
1. **Clock Master**: `AudioContext.currentTime` fornece o referencial monótono do hardware de áudio.
2. **Reconciliação Contínua**: Em cada ciclo de renderização visual, calcula-se a posição temporal do áudio:
   $$t_{\text{visual}} = (t_{\text{ctx}} - t_{\text{start}}) \cdot \text{playbackRate}$$
3. **Seek & Loop A-B**: Ao acionar o seek ou no limite $B$ do loop, o buffer de áudio é reiniciado de forma atômica no offset exato, realinhando o cursor da tablatura sem acumular latência.
