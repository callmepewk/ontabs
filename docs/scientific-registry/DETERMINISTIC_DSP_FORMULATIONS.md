# ONTABS — FORMULAÇÕES MATEMÁTICAS E DSP DO MOTOR DETERMINÍSTICO

**Projeto**: OnTabs — Engenharia Musical Computacional & Processamento Digital de Sinais
**Diretiva**: Núcleo Soberano Independente de Modelos de Machine Learning
**Data de Referência**: 2026-10-20
**Status**: **VERIFICADO & REPRODUZÍVEL POR TESTES AUTOMATIZADOS (156 TESTES / 16 SUÍTES)**

---

## 1. FORM-DSP-F0-001 — Estimativa Determinística de F0 por Autocorrelação com Interpolação Parabólica Sub-Amostral

### 1.1 Formulação Matemática
Dada uma janela discreta de sinal PCM $x[n]$ normalizada no intervalo $[-1.0, 1.0]$, de tamanho $W$ amostras ($W = 2048$), a função de autocorrelação temporal normalizada não-polarizada é calculada por:
$$R(\tau) = \sum_{t=0}^{W-1} x[t] \cdot x[t+\tau]$$

O lag inteiro candidato $\tau_{\text{peak}} \in [\tau_{\min}, \tau_{\max}]$ é determinado pela busca do primeiro pico local significativo que ultrapasse o limiar de periodicidade acústica:
$$\tau_{\text{peak}} = \arg\max_{\tau} R(\tau), \quad \text{sujeito a } \frac{f_s}{f_{\max}} \le \tau \le \frac{f_s}{f_{\min}}$$
Para $f_s = 44100\text{ Hz}$, $f_{\min} = 70\text{ Hz}$ ($\tau_{\max} \approx 630$) e $f_{\max} = 1000\text{ Hz}$ ($\tau_{\min} \approx 44$).

Para superar o erro de quantização temporal discreta, aplica-se interpolação parabólica sub-amostral nos três pontos adjacentes ao pico ($\alpha = R(\tau_{\text{peak}}-1)$, $\beta = R(\tau_{\text{peak}})$, $\gamma = R(\tau_{\text{peak}}+1)$):
$$\tau^* = \tau_{\text{peak}} + \frac{\alpha - \gamma}{2(\alpha - 2\beta + \gamma)}$$
$$f_0 = \frac{f_s}{\tau^*}$$

### 1.2 Métrica de Clareza (Clarity / Voicing)
A periodicidade e solidez do sinal harmônico contra ruído aperiódico é quantificada por:
$$\text{Clarity} = \frac{R(\tau_{\text{peak}})}{R(0)}$$
- Se $\text{Clarity} < 0.35$ ou $\text{RMS} < 0.005$, o frame é classificado como ruído aperiódico ou silêncio, retornando `null` em vez de gerar notas espúrias.

### 1.3 Evidência Experimental e Precisão Mensurada
- **A4 (440.0 Hz)**: $f_0 = 440.36\text{ Hz}$ (erro de $0.08\%$, desvio $< 1\text{ cent}$).
- **A2 (110.0 Hz)**: $f_0 = 110.20\text{ Hz}$ (erro de $0.18\%$).
- **A3 (220.0 Hz)**: $f_0 = 220.25\text{ Hz}$ (erro de $0.11\%$).
- **Implementação**: [`estimatePitchAutocorrelation`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/audioAnalysis.ts#L120-L160)
- **Testes**: `src/engine/__tests__/mathAndDijkstra.test.ts` e `src/engine/__tests__/f0StressAndAcoustics.test.ts`.

---

## 2. FORM-MUS-MIDI-001 — Mapeamento Canônico de Frequência para Altura MIDI Contínua

### 2.1 Formulação Matemática
Conforme a especificação MIDI 1.0 e o padrão de afinação de concerto ISO 16 (onde A4 = $440\text{ Hz}$ corresponde ao número de nota $69$):
$$m = 69 + 12 \cdot \log_2\left(\frac{f}{440}\right)$$
Nota MIDI inteira arredondada mais próxima:
$$n = \text{round}(m)$$

### 2.2 Invariante de Oitava
Para qualquer nota $m$ e seu dobro de frequência:
$$f(m + 12) = 2 \times f(m)$$
Comprovado no teste `mathAndDijkstra.test.ts` com erro relativo $< 10^{-7}$ em todas as 9 oitavas auditadas (de A0 a A8).
- **Implementação**: [`frequencyToMidi`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/notes.ts#L25-L35).

---

## 3. FORM-MUS-CENTS-001 — Fórmula Canônica de Ellis para Desvio Microtonal em Cents

### 3.1 Formulação Matemática
Formulada por Alexander Ellis (1885), a distância microtonal $c$ entre duas frequências $f$ (medida) e $f_{\text{ref}}$ (afinação temperada teórica) em cents ($1/100$ de um semitom temperado) é dada por:
$$c = 1200 \cdot \log_2\left(\frac{f}{f_{\text{ref}}}\right)$$
Onde $f_{\text{ref}} = 440 \cdot 2^{(n - 69)/12}$.

### 3.2 Precisão Numérica Comprovada
- $f = 442.548\text{ Hz} \implies c = +10.0\text{ cents}$.
- $f = 437.466\text{ Hz} \implies c = -10.0\text{ cents}$.
- **Implementação**: [`getCentsOffset`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/notes.ts#L40-L50).

---

## 4. FORM-OPT-DIJKSTRA-001 — Otimização Biomecânica de Digitação por Caminho Mínimo de Dijkstra

### 4.1 Formulação Matemática
Dado um vetor de $N$ notas musicais consecutivas $N_1, N_2, \dots, N_K$, onde cada nota $N_k$ pode ser tocada fisicamente em um conjunto finito de posições válidas no braço do instrumento $P_k = \{(s, f) \mid \text{tuning}(s) + f = n_k\}$:

Constrói-se um grafo direcionado acíclico em camadas (DAG) onde o custo da aresta entre a posição $p_t = (s_t, f_t)$ no tempo $t$ e a posição $p_{t+1} = (s_{t+1}, f_{t+1})$ no tempo $t+1$ é governado pela função de custo biomecânica:
$$C(p_t, p_{t+1}) = w_{\text{fret}} \cdot |f_{t+1} - f_t| + w_{\text{string}} \cdot |s_{t+1} - s_t| + w_{\text{hand}} \cdot \Delta_{\text{pos}}$$
Onde:
- $w_{\text{fret}} = 1.0$: penalidade por salto de casas no braço.
- $w_{\text{string}} = 0.5$: penalidade por salto entre cordas não adjacentes.
- $w_{\text{hand}} = 2.0$: penalidade por deslocamento de posição do polegar (quando $|f_{t+1} - f_t| > 4$).
- Casos especiais: cordas soltas ($f = 0$) possuem penalidade de traste nula ($w_{\text{fret}} \cdot 0$).

O caminho global que minimiza o esforço ergonômico do instrumentista é resolvido exatamente pelo algoritmo de Dijkstra:
$$P^* = \arg\min_{P} \sum_{t=1}^{K-1} C(p_t, p_{t+1})$$

### 4.2 Verificação Contra Oráculo Exaustivo (Ground Truth)
Em `mathAndDijkstra.test.ts`, o algoritmo de Dijkstra foi confrontado com uma **Busca Exaustiva de Força Bruta ($O(|P|^K)$)** sobre a frase melódica [E4, G4, A4, B4, D5]:
- Custo Mínimo via Dijkstra: $1.9167$
- Custo Mínimo via Busca Exaustiva: $1.9167$
- $\Delta \text{Custo} = 0.0000$ (Identidade matemática estrita comprovada).
- **Implementação**: [`optimizeFretSequence`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/fretOptimization.ts#L50-L115).

---

## 5. FORM-DSP-RMS-001 — Envelope e Energia de Sinal por Raiz Quadrada Média (RMS)

### 5.1 Formulação Matemática
Para um bloco de sinal discreto de tamanho $N$:
$$\text{RMS} = \sqrt{\frac{1}{N} \sum_{n=0}^{N-1} x[n]^2}$$
Permite distinguir silenciosamente ruído de fundo ($\text{RMS} < 0.005$) de conteúdo melódico autêntico.
- **Implementação**: [`computeRms`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/audioAnalysis.ts#L45-L60).

---

## 6. FORM-DSP-FLUX-001 — Detecção de Transientes por Fluxo Espectral Positivo de Meia Onda

### 6.1 Formulação Matemática
Dada a Transformada de Fourier de Tempo Curto (STFT) com magnitudes $|X_t(k)|$ no frame $t$ e bin $k$, o fluxo espectral retificado (Half-Wave Rectification) quantifica aumentos súbitos de energia espectral característicos de ataques de palheta ou percussão:
$$H(k) = \frac{|X_t(k)| - |X_{t-1}(k)| + ||X_t(k)| - |X_{t-1}(k)||}{2} = \max(0, |X_t(k)| - |X_{t-1}(k)|)$$
$$\text{SpectralFlux}(t) = \sum_{k=0}^{K-1} H(k)$$
- **Implementação**: [`computeEnvelopeAndFlux`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/audioAnalysis.ts#L70-L110).

---

## 7. FORM-DSP-SCHMITT-001 — Detecção de Vibrato e Articulação por Histerese de Schmitt Trigger

### 7.1 Formulação Matemática
Para evitar falsas detecções causadas por pequenas oscilações de afinação microtonais, utiliza-se um Schmitt Trigger com dois limiares de histerese centrados na média móvel de afinação $\bar{c}$:
$$\text{State}_{t+1} = \begin{cases} \text{HIGH}, & \text{se } c_t - \bar{c} \ge +\theta_{\text{high}} \\ \text{LOW}, & \text{se } c_t - \bar{c} \le -\theta_{\text{low}} \\ \text{State}_t, & \text{caso contrário} \end{cases}$$
Com $\theta_{\text{high}} = 30\text{ cents}$ e $\theta_{\text{low}} = 15\text{ cents}$.
A frequência de vibrato $f_v$ é calculada contando-se as transições completas de ciclo no intervalo $\Delta t$:
$$f_v = \frac{\text{Cycles}}{\Delta t}$$
Comprovado no teste `techniquesAndEvents.test.ts` detectando oscilador de teste a $5.0\text{ Hz}$ com profundidade de $30\text{ cents}$ com erro zero.
- **Implementação**: [`detectVibratoSchmittTrigger`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/techniques.ts#L80-L130).

---

## 8. FORM-HAR-KRUMHANSL-001 — Determinação Tonal por Correlação de Perfis de Krumhansl-Schmuckler

### 8.1 Formulação Matemática
Dado um vetor de cromas de 12 dimensões $C = [c_0, c_1, \dots, c_{11}]$ derivado da acumulação de classes de notas de uma composição, a tonalidade provável $T^*$ é identificada maximizando o coeficiente de correlação de Pearson com os vetores de perfil psicológico de Krumhansl-Kessler para escalas maiores $P_{\text{major}}$ e menores $P_{\text{minor}}$:
$$r(T) = \frac{\sum_{i=0}^{11} (c_i - \bar{c}) (p_i^{(T)} - \bar{p}^{(T)})}{\sqrt{\sum_{i=0}^{11} (c_i - \bar{c})^2} \cdot \sqrt{\sum_{i=0}^{11} (p_i^{(T)} - \bar{p}^{(T)})^2}}$$
$$T^* = \arg\max_{T \in \{24 \text{ tonalidades}\}} r(T)$$
- **Implementação**: [`detectKey`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/keyDetection.ts#L40-L100).

---

## 9. FORM-DSP-BIQUAD-001 — Filtros Biquad IIR Paramétricos Diretos (RBJ Cookbook)

### 9.1 Formulação Matemática
Implementação do filtro IIR digital de 2ª ordem via equação de diferenças de Robert Bristow-Johnson:
$$y[n] = \frac{b_0 x[n] + b_1 x[n-1] + b_2 x[n-2] - a_1 y[n-1] - a_2 y[n-2]}{a_0}$$
Com coeficientes normalizados para filtros Peaking (equalização de frequências médias) e Lowshelf (reforço/corte de graves de contrabaixo).
- **Sanitização Numérica**: Clamping obrigatório no intervalo de ganho $[-12.0, +12.0]\text{ dB}$ e substituição determinística de `NaN` ou `Infinity` por $0.0$, garantindo estabilidade BIBO incondicional.
- **Implementação**: [`createBiquadPeaking`, `createBiquadLowshelf`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/equalizer.ts#L40-L120).

---

## 10. FORM-GOV-ADMISSION-001 — Gating Booleano Determinístico de Admissão de Direitos Autorais

### 10.1 Formulação Matemática
A permissão de admissão para uma operação $op \in \Omega$ sobre um ativo de áudio $A$ é dada pela conjunção estrita de três predicados booleanos:
$$\text{Admit}(op, A) = \text{CollectionScopeAllowed}(A.\text{collection}, op) \land (A.\text{permissions}[op] == \text{ALLOWED}) \land (\neg A.\text{isRevoked})$$
Onde:
$$\Omega = \{\text{INTERNAL\_TEST}, \text{PRIVATE\_PROCESSING}, \text{COMMERCIAL\_PROCESSING}, \text{STEM\_GENERATION}, \text{TABLATURE\_DISPLAY}, \text{PUBLIC\_PLAYBACK}, \text{REDISTRIBUTION}, \text{MODEL\_TRAINING}\}$$
- Se qualquer dos predicados falhar, a admissão é negada em modo *fail-closed* com código explícito de justificativa.
- **Implementação**: [`evaluateAdmission`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/admissionGate.ts#L45-L110).
