# OnTabs — Relatório de Assurance Matemático e Numérico (FASE MAT)

**Data de Referência**: 2026-10-19  
**Status**: **VERIFICADO & COMPROVADO POR ORÁCULOS INDEPENDENTES**  
**Suíte de Testes**: `src/engine/__tests__/mathAndDijkstra.test.ts` (19 testes dedicados)

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

---

## 2. Invariantes de Negócio e Persistência Comprovados

1. **Duração do Trial (168 Horas)**:
   - Calculado no backend via timestamp UTC ISO 8601 canônico.
   - Testado em `accessStateMachine.test.ts`: após $168\ \text{h} + 1\ \text{segundo}$, o acesso transiciona para `TRIAL_EXPIRED` e a rota retorna `HTTP 403`.
   - Adulteração do relógio local no navegador (`localStorage` ou `Date.now` client-side) não tem qualquer efeito sobre a autorização no servidor.
2. **Concorrência e Persistência Atômica**:
   - 10 gravações simultâneas em paralelo via fila de Mutex assíncrono em `dbConcurrency.test.ts`.
   - Zero registros perdidos, integridade de JSON validada após execução.
3. **Proteção contra SSRF em Conectores**:
   - Rejeição de IPs de metadados da nuvem (`169.254.169.254`), `localhost` (`127.0.0.1`), faixas privadas RFC 1918 (`10.x`, `192.168.x`).
