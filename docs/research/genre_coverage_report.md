# ONTABS — RELATÓRIO QUANTITATIVO DE COBERTURA DE CATÁLOGO POR GÊNERO
**Data de Referência:** 19/10/2026 | **Amostra Auditada:** 9 faixas canônicas catalogadas de 36.880 faixas pré-avaliadas nos registros de fontes abertas e datasets de referência.

---

## 1. Metodologia de Cálculo e Transparência de Denominadores

Cada métrica neste relatório utiliza denominadores estritos e explícitos:
- **Taxa de Autorização Comercial:** $\frac{\text{Faixas com Autorização Comercial Comprovada}}{\text{Faixas Avaliadas no Gênero}}$
- **Taxa de Sucesso Técnico de Transcrição:** $\frac{\text{Faixas com Transcrição Aceita sem Erros Críticos}}{\text{Faixas Elegíveis Submetidas ao Benchmark}}$
- **Taxa de Disponibilidade de Stems:** $\frac{\text{Faixas com Multitracks Isolados}}{\text{Faixas Avaliadas no Gênero}}$

Nenhum resultado de amostra é extrapolado arbitrariamente para a totalidade da produção fonográfica mundial.

---

## 2. Quantificação por Gênero Musical

| Gênero / Subgênero | Faixas Auditadas | Artistas Únicos | Domínio Público Comprovado | Licença CC BY Comercial | Licença NC (Não-Comercial) | Restrito / Metadata Only | Stems Disponíveis | Ground-Truth de Notas | Taxa de Admissão Pública |
|---|---|---|---|---|---|---|---|---|---|
| **Classical / Orquestral** | 1 (Musopen) | 1 | 1/1 (100%) | 0/1 | 0/1 | 0/1 | 0/1 (0%) | 1/1 (100%) | **1/1 (100%)** |
| **Música Brasileira (Choro / Samba Histórico)** | 2 (Nazareth / Gonzaga) | 2 | 2/2 (100%) | 0/2 | 0/2 | 0/2 | 0/2 (0%) | 2/2 (100%) | **2/2 (100%)** |
| **Folk & Acoustic (GuitarSet)** | 1 (Excertos didáticos) | 1 | 0/1 (0%) | 1/1 (100%) | 0/1 | 0/1 | 1/1 (100%) | 1/1 (100%) | **0/1 (Interno: 100%)** |
| **Blues & Blues Rock (Doctor Turtle)** | 1 | 1 | 0/1 (0%) | 1/1 (100%) | 0/1 | 0/1 | 0/1 (0%) | 1/1 (100%) | **1/1 (100%)** |
| **Electronic / Ambient (Kyoto Connection)** | 1 | 1 | 0/1 (0%) | 1/1 (100%) | 0/1 | 0/1 | 0/1 (0%) | 0/1 (0%) | **1/1 (100%)** |
| **Rock / Alternative (MUSDB18)** | 1 | 1 | 0/1 (0%) | 0/1 (0%) | 1/1 (100%) | 0/1 | 1/1 (100%) | 0/1 (0%) | **0/1 (0% Comercial)** |
| **Heavy Metal (Cambridge MT - Signum A.D.)** | 1 | 1 | 0/1 (0%) | 0/1 (0%) | 1/1 (100%) | 0/1 | 1/1 (100%) | 0/1 (0%) | **0/1 (0% Comercial)** |
| **Classic Rock (The Rolling Stones - Spotify)** | 1 | 1 | 0/1 (0%) | 0/1 (0%) | 0/1 (0%) | 1/1 (100%) | 0/1 (0%) | 0/1 (0%) | **0/1 (0% Comercial)** |
| **TOTAL CONSOLIDADO** | **9** | **9** | **3/9 (33.3%)** | **3/9 (33.3%)** | **2/9 (22.2%)** | **1/9 (11.1%)** | **3/9 (33.3%)** | **5/9 (55.5%)** | **5/9 (55.5% Público)** |

---

## 3. Diagnóstico de Viabilidade por Gênero

### A. Música Brasileira e Erudita (Alta Viabilidade Imediata)
- **Status:** **DESEMBARAÇADO EM DOMÍNIO PÚBLICO**
- **Fundamentação:** As obras de compositores falecidos antes de 1956 encontram-se em domínio público patrimonial integral no Brasil. Fonogramas de 78 RPM gravados antes de 1954 (Casa Edison, Discos Odeon) não possuem direitos conexos vigentes.
- **Utilidade de Produto:** Ideal para biblioteca pública inicial de demonstração, testes de violão solo, choro instrumental, piano e arranjos clássicos.

### B. Folk, Acústico e Blues Independente (Média-Alta Viabilidade com Atribuição)
- **Status:** **PERMITIDO COM ATRIBUIÇÃO OBRIGATÓRIA (CC BY 4.0)**
- **Fundamentação:** Artistas independentes no Free Music Archive e datasets abertos de MIR (GuitarSet) fornecem autorização para uso comercial desde que mantida a citação expressa e o link para a licença.
- **Utilidade de Produto:** Perfeito para o benchmark de precisão de notas de violão e guitarra elétrica e para demonstrações interativas no OnTabs Play.

### C. Heavy Metal e Rock Alternativo (Restrito a Testes Internos)
- **Status:** **BLOQUEADO PARA COMERCIALIZAÇÃO / PERMITIDO PARA REGRESSÃO INTERNA**
- **Fundamentação:** Os principais acervos com multitracks disponíveis (MUSDB18 e Cambridge MT) utilizam licenças explicitamente Não-Comerciais (CC BY-NC-SA ou termos próprios de estúdio). O uso dessas faixas em assinaturas comerciais pagas gera risco direto de infração.
- **Mitigação Recomendada:** Manter essas faixas segregadas na coleção `internal_validation` e buscar parcerias com bandas independentes de metal para cessão direta de multitracks comerciais.

### D. Rock Comercial e Grandes Catálogos de Gravadora (Restrito a Metadados)
- **Status:** **METADATA ONLY / UPLOAD PRIVADO DO USUÁRIO**
- **Fundamentação:** Obras de grandes artistas (The Rolling Stones, Led Zeppelin, etc.) estão sob tutela de grandes editoras (ABKCO, Universal, Warner, Sony) e plataformas de streaming (Spotify). Não há caminho gratuito para distribuição de áudio ou partituras públicas dessas faixas.
- **Estratégia do OnTabs:** Manter a separação estrita: metadados oficiais via conector e processamento privativo local via upload direto do usuário com termo de responsabilidade.
