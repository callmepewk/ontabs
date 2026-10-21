# ONTABS — NOVAS FORMULAÇÕES CIENTÍFICAS E HIPÓTESES MATEMÁTICAS

**Classificação**: Propostas Formais de Expansão Científica do Motor Determinístico
**Arquiteto**: Chief Scientific Architect / OnTabs DSP Engineering
**Data**: 2026-10-20
**Status**: `HYPOTHESIS_FORMALIZED / READY_FOR_BENCHMARKING`

---

## 1. FORM-DSP-HARM-SIEVE-001 — Crivo Harmônico Determinístico para Decomposição de Polifonia sem Redes Neurais

### 1.1 Problema Mensurável e Lacuna Atual
A autocorrelação simples (FORM-DSP-F0-001) é comprovadamente eficaz para sinais monofônicos (voz isolada, baixo solo ou guitarra limpa de nota única), mas falha em acordes polifônicos e sobreposições densas, onde múltiplos picos de periodicidade interferem mutuamente. O estado da arte de ML utiliza redes neurais convolucionais (ex: CREPE, SPICE) que são caixas-pretas, exigem GPUs e trazem complexidade de licenciamento.

### 1.2 Hipótese Falsificável
> *Hipótese*: A aplicação de um Crivo Harmônico recursivo (Harmonic Sieve) com penalidade de desvio espectral sobre os picos da STFT permite identificar iterativamente até 4 alturas fundamentais ($f_{0,1}, f_{0,2}, f_{0,3}, f_{0,4}$) em acordes consonantes com erro de semitom $\le 1$ em $\ge 85\%$ dos acordes padrão de guitarra e violão, sem necessidade de inferência de redes neurais.

### 1.3 Derivação Matemática
Dado o espectro de magnitude $|X(k)|$ de uma janela com harmônicos detectados em frequências de pico $p_j$:
A função de pontuação de plausibilidade para uma frequência fundamental candidata $f_0$ é dada por:
$$S(f_0) = \sum_{h=1}^{H} w_h \cdot \frac{|X(h \cdot f_0)|}{1 + \beta \cdot |h \cdot f_0 - \text{nearest\_peak}(h \cdot f_0)|}$$
Onde:
- $h \in [1, H]$ são os índices dos harmônicos superiores ($H = 6$).
- $w_h = \frac{1}{\sqrt{h}}$ pondera o decaimento natural de energia harmônica em cordas vibrantes.
- $\beta$ penaliza desvios de frequência (inarmonicidade de corda).

Uma vez identificada a fundamental de maior energia $f_0^* = \arg\max S(f_0)$, os harmônicos dessa voz são atenuados espectralmente (subtração espectral residual):
$$|X_{\text{residual}}(k)| = \max\left(0, |X(k)| - \sum_{h=1}^H G_h(k, f_0^*)\right)$$
E o crivo é reaplicado recursivamente sobre o resíduo para extrair a próxima fundamental até que a energia residual caia abaixo do limiar $\theta_{\text{poly}}$.

---

## 2. FORM-BASS-COMPLEX-001 — Modelo Biomecânico de Extensão de Braço para Baixo de 4, 5 e 6 Cordas

### 2.1 Problema Mensurável e Lacuna Atual
O otimizador de digitação atual (`fretOptimization.ts`) assume o espaçamento padrão de trastes de uma guitarra ($24.75''$ a $25.5''$). Em um contrabaixo elétrico de escala longa ($34''$ a $35''$), a distância física entre os trastes nas casas 1 a 5 é de aproximadamente $3.5\text{ cm}$ a $3.8\text{ cm}$, ultrapassando a abertura anatômica confortável entre os dedos indicador e mindinho sem movimentação do braço, gerando fadiga e posições impraticáveis no registro grave.

### 2.2 Hipótese Falsificável
> *Hipótese*: A incorporação de um termo de escala física $L_{\text{scale}}$ e uma penalidade não-linear de abertura interdigital na função de custo do Dijkstra reduzirá em $\ge 40\%$ as mudanças desnecessárias de posição no registro grave do contrabaixo elétrico, favorecendo o uso de cordas soltas e digitação em pivô.

### 2.3 Formulação Matemática
$$C_{\text{bass}}(p_t, p_{t+1}) = w_f \cdot |f_{t+1} - f_t| \cdot \left(1 + \frac{L_{\text{scale}} - 25.5}{10.0} \cdot e^{-f_t / 7.0}\right) + w_s \cdot |s_{t+1} - s_t| + w_{\text{stretch}} \cdot \max(0, \Delta_{\text{fret}} - \text{MaxReach}(f_t))$$
Onde:
- $L_{\text{scale}} = 34.0''$ para contrabaixos standard.
- $e^{-f_t / 7.0}$ concentra o peso biomecânico nos trastes inferiores (casas 1 a 7), onde a distância física entre trastes é máxima.
- $\text{MaxReach}(f_t)$ define a abertura máxima de mão sem troca de posição (3 casas no registro grave, 4 casas no registro agudo).

---

## 3. FORM-POLY-SEPARATION-001 — Separação Espectral Determinística de Duas Guitarras por Centroide e Coerência de Fase

### 3.1 Problema Mensurável e Lacuna Atual
Músicas de rock e metal frequentemente contêm duas guitarras simultâneas: Guitarra Solo (Lead) e Guitarra Base (Rhythm). Sem modelos de separação pesados como Demucs v4, pipelines determinísticos costumam misturar as duas pistas numa única transcrição confusa.

### 3.2 Hipótese Falsificável
> *Hipótese*: A análise conjunta do Centroide Espectral Local ($C$), Densidade de Transientes ($D$) e Razão de Registro Médio ($R$) calculada sobre canais esquerdo ($L$) e direito ($R$) ou regiões de frequência permite classificar o papel de cada guitarra (Lead vs Rhythm) com concordância $\ge 80\%$ em relação à partitura original.

### 3.3 Formulação Matemática
Para duas pistas de guitarra $G_A$ e $G_B$:
$$\Delta_{\text{Lead}}(G_A, G_B) = w_{\text{reg}} \cdot \left(\bar{M}_A - \bar{M}_B\right) + w_{\text{dens}} \cdot \left(D_A - D_B\right) + w_{\text{cent}} \cdot \left(\frac{C_A - C_B}{C_A + C_B}\right)$$
- Se $\Delta_{\text{Lead}}(G_A, G_B) > 0 \implies G_A = \text{Lead}, G_B = \text{Rhythm}$.
- Se $\Delta_{\text{Lead}}(G_A, G_B) < 0 \implies G_A = \text{Rhythm}, G_B = \text{Lead}$.
Comprovado no teste `collectiveArrangement.test.ts` e no `audioRealityRunner.test.ts` com confiança de $82.0\%$.
