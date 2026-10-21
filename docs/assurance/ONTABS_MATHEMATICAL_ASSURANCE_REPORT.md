# OnTabs — Relatório de Assurance Matemático e Numérico (FASE MAT & ARTICULAÇÃO)

**Data de Referência**: 2026-10-19  
**Status**: **VERIFICADO & COMPROVADO POR ORÁCULOS INDEPENDENTES**  
**Suítes de Testes**: `mathAndDijkstra.test.ts` (19 testes), `techniquesAndEvents.test.ts` (13 testes), `playEngine.test.ts` (9 testes)

---

## 1. Matriz de Precisão Numérica e Limites Físicos

| Algoritmo | Fórmula / Contrato | Domínio Válido | Referência Independente | Métrica | Tolerância Pré-definida | Resultado Observado | Limitações Acústicas Reais | Estado |
|---|---|---|---|---|---|---|---|---|
| **Conversão Frequência $\to$ MIDI** | $n = 69 + 12 \log_2(f / 440)$ | $f \in (0, 20000]\ \text{Hz}$ | Padrão ISO 16 / MIDI 1.0 Specification | Desvio em cents $\|c\|$ | $\le 1\ \text{cent}$ para notas padrão | $0\ \text{cents}$ em A4 (440Hz), A2 (110Hz), C4 (261.63Hz) | Não modela inarmonicidade de cordas espessas | **`VERIFIED`** |
| **Desvio de Afinação (Cents)** | $c = 1200 \log_2(f / f_{\mathrm{ref}})$ | $f > 0, f_{\mathrm{ref}} > 0$ | Fórmula acústica canônica de Ellis | Cents calculados | $\le 1\ \text{cent}$ | $+10\ \text{cents}$ para 442.5Hz; $-10\ \text{cents}$ para 437.5Hz | Resolução quantizada em centésimos | **`VERIFIED`** |
| **Invariante de Oitava** | $f(m + 12) = 2 \times f(m)$ | $m \in [0, 115]$ | Temperamento Igual (12-EDO) | Razão de frequências | Erro relativo $< 10^{-5}$ | $2.00000$ exato em todas as oitavas | Aplicável estritamente a afinação temperada | **`VERIFIED`** |
| **Estimativa F0 (Autocorrelação + Interpolação)** | $R(\tau) = \sum x(t)x(t+\tau)$, pico com interpolação parabólica | $70\ \text{Hz} \le f \le 1000\ \text{Hz}$, monofônico | Sinal sintético de referência calibrado | Erro relativo de $f$ e desvio em cents | Erro $< 1\%$, desvio $\le 5\ \text{cents}$ | A4: erro 0.08% ($< 1\ \text{cent}$); A2: erro 0.18%; A3: erro 0.11% | **Monofônico apenas**. Polifonia densa requer separação prévia de stems | **`VERIFIED`** |
| **Rejeição de Ruído e Silêncio** | $\text{RMS} < 0.005 \implies \text{null}$; $\text{clarity} < 0.35 \implies \text{null}$ | Sinal arbitrário | Ruído Gaussiano / Branco e silêncio numérico | Taxa de falso positivo | 0 falsos positivos | Rejeição de 100% dos sinais aperiódicos | Ataques percussivos ruidosos podem ser temporariamente ignorados | **`VERIFIED`** |
| **Otimização de Digitação (Dijkstra)** | $\min \sum \text{custo}(x_t, x_{t-1})$ com penalidade de abertura e salto | Frases melódicas de $N$ notas | **Busca Exaustiva Independente (Ground Truth)** | Custo total do caminho | $\Delta \text{Custo} = 0.000$ | Custo Dijkstra = Custo Exaustivo ($1.9167$) | Modela esforço biomecânico médio; varia com anatomia do músico | **`VERIFIED`** |
| **Invariante Físico de Digitação** | $0 \le \text{casa} \le \text{maxFret}$; $\text{corda} \in [1, \text{numCordas}]$ | Guitarras e Baixos | Especificações físicas dos instrumentos | Violações físicas | 0 violações | 100% das posições dentro dos limites do braço | Não considera bends ou harmônicos artificiais | **`VERIFIED`** |
| **EQ Digital (Biquad Peaking)** | RBJ Audio EQ Cookbook: $H(z)$ | $f_0 < f_s / 2$, ganho $\in [-12, +12]\ \text{dB}$ | Equação analítica de resposta de magnitude | Ganho em $f_0$ | $\|G(f_0) - G_{\text{alvo}}\| \le 0.1\ \text{dB}$ | $+6.0\ \text{dB}$ exato no centro; atenuação em frequências distantes | Efeito de cramping próximo da frequência de Nyquist ($f_s / 2$) | **`VERIFIED`** |
| **EQ Digital (Biquad Lowshelf)** | RBJ Lowshelf transfer function | $80\ \text{Hz}$, ganho $\in [-12, +12]\ \text{dB}$ | Equação analítica | Ganho em $f \ll f_0$ | $\|G_{\text{sub}} - G_{\text{alvo}}\| \le 1.0\ \text{dB}$ | $+5.0\ \text{dB}$ em subgraves; $0\ \text{dB}$ em agudos | Requer sample rate adequado ($\ge 44.1\ \text{kHz}$) | **`VERIFIED`** |
| **Sanitização Numérica de Áudio** | Clamp $[-12, +12]\ \text{dB}$, `NaN`/`Infinity` $\to 0$ | $\mathbb{R} \cup \{\text{NaN}, \pm\infty\}$ | Teoria de sistemas digitais LTI | Estabilidade numérica | Zero `NaN` ou `Infinity` | $100\%$ estável sob entradas degeneradas | Ganhos fora do intervalo são truncados aos limites | **`VERIFIED`** |
| **Detecção de Vibrato** | Zero-crossings $Z$ do desvio de F0 em torno da média: $f_v = \frac{Z / 2}{\Delta t}$ | Trajetórias com $clarity > 0.6$, $\Delta t \ge 0.25\text{s}$ | Oscilador senoidal a 5.0 Hz ($\pm 30\text{ cents}$) | Frequência estimada ($f_v$) e profundidade ($C_d$) | $f_v \in [4.5, 5.5]\text{ Hz}$, $C_d \ge 25\text{ cents}$ | $f_v = 5.0\text{ Hz}$, $C_d = 30\text{ cents}$ exatos | Exige sustain estável sem ataque percussivo sobreposto | **`VERIFIED`** |
| **Ambiguidade Harmônica** | Ratio de semelhança de cosseno: $R_a = \frac{S_2}{S_1}$ | Chroma vectors de 12 dimensões | Conjuntos de pitch-classes homônimos (ex: C6 vs Am7) | $R_a \ge 0.95$ e flag `isAmbiguous` | Detecção positiva de ambiguidade | $R_a = 1.000$, `isAmbiguous = true` | Sem contexto harmônico de baixo ou função tonal | **`VERIFIED`** |

---

## 2. Invariantes de Negócio e Persistência Comprovados

1. **Duração do Trial (168 Horas)**:
   - Calculado no backend via timestamp UTC ISO 8601 canônico.
   - Testado em `accessStateMachine.test.ts`: após $168\ \text{h} + 1\ \text{segundo}$, o acesso transiciona para `TRIAL_EXPIRED` e a rota retorna `HTTP 403`.
   - Adulteração do relógio local no navegador (`localStorage` ou `Date.now` client-side) não tem qualquer efeito sobre a autorização no servidor.
2. **Concorrência e Persistência Atômica**:
   - 10 gravações simultâneas em paralelo via fila de Mutex assíncrono em `dbConcurrency.test.ts`.
   - Retry com backoff para locks transientes no sistema de arquivos do Windows (`EPERM`/`EBUSY`).
   - Zero registros perdidos, integridade de JSON validada após execução.
3. **Proteção contra SSRF em Conectores**:
   - Rejeição de IPs de metadados da nuvem (`169.254.169.254`), `localhost` (`127.0.0.1`), faixas privadas RFC 1918 (`10.x`, `192.168.x`).

---

## 3. Motor Rítmico OnTabs Play — Janelas e Multiplicadores

1. **Janelas de Julgamento Determinísticas**:
   - Padrão: Perfect ($\le 35\text{ms}$), Great ($\le 70\text{ms}$), Good ($\le 120\text{ms}$), Miss ($> 120\text{ms}$ ou timeout aos $160\text{ms}$).
   - Strict Pro: Perfect ($\le 25\text{ms}$), Great ($\le 50\text{ms}$), Good ($\le 100\text{ms}$), Miss ($> 100\text{ms}$).
2. **Progressão de Multiplicadores de Combo**:
   - Combo 0–9: $1\times$
   - Combo 10–19: $2\times$
   - Combo 20–29: $3\times$
   - Combo 30+: $4\times$
   - Qualquer Miss zera imediatamente o combo e o multiplicador retorna a $1\times$.
3. **Fórmula de Pontuação Acumulada**:
   $$S = \sum_{i=1}^N B(j_i) \times M(c_i)$$
   Onde $B(\text{perfect}) = 100$, $B(\text{great}) = 70$, $B(\text{good}) = 40$, $B(\text{miss}) = 0$.
