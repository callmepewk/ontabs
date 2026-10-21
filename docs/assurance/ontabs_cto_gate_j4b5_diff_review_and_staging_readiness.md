# ONTABS — PARECER FORENSE E REVISÃO INDEPENDENTE DE DIFF
## Gate J.4B.5 · Independent Security Diff Review & Commit Readiness

**Data de Referência:** 20 de Outubro de 2026<br>
**Autoridade de Aprovação:** Pedro Henrique Brezolin de Freitas<br>
**Auditoria e Parecer:** Antigravity (CTO & Scientific Systems Lead)<br>
**Repositório Canônico:** C:\Users\pedro\OneDrive\Desktop\ontabs-app<br>
**Branch:** main | **HEAD:** ced6583038c639e9480b77eb988289e801011726<br>
**Modo de Execução:** Auditoria Independente · Read-Only · Zero Mutações · Zero Staging<br>
**Classificação Final:** `SECURITY_REVIEW_READY_FOR_SELECTIVE_STAGING`

---

## 1. PREFLIGHT E INTEGRIDADE DO WORKING TREE

O preflight capturou com precisão o estado do repositório:
- **HEAD Canônico:** `ced6583038c639e9480b77eb988289e801011726`
- **Branch Ativo:** `main` (ahead 18 em relação a `origin/main`)
- **Staging Area:** 0 arquivos staged. `git add` não foi executado.
- **Higiene do Diff de Segurança:**
  ```bash
  git diff --check -- src/server/routes.ts src/server/db.ts src/server/__tests__/adminAuthorization.test.ts src/server/__tests__/serverIntegration.test.ts
  ```
  **Código de Saída:** `0` (Zero erros de formatação, zero espaços espúrios nos arquivos de segurança).

---

## 2. REVISÃO FORENSE DE AUTORIZAÇÃO (12 PONTOS DE AUDITORIA)

A inspeção detalhada do diff real e das funções afetadas em `src/server/routes.ts` e `src/server/db.ts` demonstrou:

### 1. Origens de `userId`, `visitorId` e `role`
- **`user.id` e `user.role`:** Carregados exclusivamente do banco de dados `db.users` através de `extractAuthUser`, que valida o token criptográfico `Bearer <token>` contra a tabela de sessões ativas (`db.sessions`) e expiração (`session.expiresAt`).
- **`visitorId`:** Processado invariavelmente por `sanitizeVisitorId(req.headers['x-visitor-id'])` na entrada de `dispatchApiRequest`. Nunca é nulo ou indefinido; se ausente, malformado ou reservado, é gerado com `crypto.randomUUID()` com namespace seguro `vis_`.
- **`role`:** Derivado exclusivamente de `user.role` (ou padrão `'visitor'`). Parâmetros `role` enviados no corpo de `/api/auth/register` ou `/api/music/convert` são categoricamente ignorados pelo servidor.

### 2. Autenticação Estritamente Server-Side
A função `extractAuthUser` ([`routes.ts:148-156`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/server/routes.ts#L148-L156)) valida a integridade do token Bearer no armazenamento atômico de sessões. Nenhum parâmetro em query string, cookie ou header alternativo pode burlar ou fabricar uma sessão válida.

### 3. Impossibilidade de Forja de Papéis Privilegiados (`admin`/`owner`)
- O endpoint de cadastro (`/api/auth/register`) ignora qualquer `body.role`. O papel só é definido como `'owner'` se o e-mail constar na lista configurada no ambiente `process.env.ONTABS_ADMIN_EMAILS`.
- A promoção de papéis em `/api/admin/users/:id/role` exige sessão autenticada com papel `admin` ou `owner`.
- O endpoint `/api/admin/bootstrap` opera em fail-closed: sem `process.env.ONTABS_ADMIN_SECRET`, retorna `HTTP 503`.

### 4. Bloqueio Completo de Criação/Atualização com `userId === 'system'`
Em todos os endpoints de escrita da API (`POST /api/music/convert`, `POST /api/tabs`, `POST /api/setlists`, `POST /api/practice`), a titularidade é atribuída por `user ? user.id : visitorId`. Como `user.id` inicia com `usr_` e `visitorId` inicia com `vis_`, é matematicamente impossível que um recurso criado via API receba `userId === 'system'`. Ademais, há barreira defensiva explícita em `routes.ts:605`: se `effectiveOwnerId === 'system'`, a requisição é rejeitada com `HTTP 400`.

### 5. Distinção Confiável entre Catálogo Soberano e Recursos de Usuário
Recursos com `userId === 'system'` têm origem restrita ao seed inicial de catálogo soberano (`Database.seedDefaultData()`) e ao arquivo estático `data/music-library/catalog.json`. Como nenhum upload de usuário pode possuir `userId === 'system'`, a flag `isSystemResource` é garantida como falsa para todo conteúdo submetido por clientes, impedindo que uploads de usuários sejam expostos como catálogo público.

### 6. Aplicação Consistente de `sanitizeVisitorId`
`sanitizeVisitorId` é invocada exatamente na linha 205 de `routes.ts`, antes do roteamento de qualquer endpoint em `dispatchApiRequest`. Todas as rotas subsequentes operam sobre a mesma variável `visitorId` sanitizada. Não existe nenhuma leitura crua secundária de `req.headers['x-visitor-id']`.

### 7. Normalização, Prefixo e Limites de Tamanho
- A regex `/^[a-zA-Z0-9_\-]{3,64}$/` barra caracteres especiais, injeções de path traversal (`../`) e strings gigantes (> 64 bytes).
- A lista restritiva `RESERVED_IDENTITIES` (`system`, `admin`, `owner`, `root`, `visitor`, `visitor_default`, `public`, `internal`, `superuser`, `moderator`, `test`) e prefixos `system_` / `admin_` são interceptados.
- Todo identificador válido recebe normalização minúscula e prefixo `vis_`, permitindo que visitantes legítimos mantenham rascunhos anônimos sem risco de colisão de namespace com contas de sistema.

### 8. Tratamento Seguro de Cabeçalhos em Array (Duplicate Headers)
Em `routes.ts:91`:
```typescript
if (typeof headerValue !== 'string') {
  return `vis_${crypto.randomUUID()}`;
}
```
Caso um cliente envie cabeçalhos duplicados, o Node.js entrega `headerValue` como `string[]`. O servidor detecta `typeof !== 'string'` e gera imediatamente um identificador seguro via `crypto.randomUUID()`, prevenindo falhas de runtime ou bypasses por poluição de parâmetros HTTP (HPP).

### 9. Compatibilidade com Recursos Legítimos Preexistentes
Recursos públicos do catálogo (`song_demo_canon_rock` e `tab_demo_canon_rock`) continuam retornando `HTTP 200 OK` para acessos anônimos. Usuários autenticados continuam acessando seus próprios recursos normalmente. O build e a suíte completa de 200 testes aprovados comprovam ausência de regressões contratuais.

### 10. Coerência e Isolamento da Idempotência
A idempotência em `POST /api/music/convert` utiliza `(key, actorId)`. Como `actorId` é `user.id` (prefixo `usr_`) ou `visitorId` (prefixo `vis_`), chaves enviadas por atores diferentes são tratadas em partições separadas no banco durável (`db.ts`). Não há vazamento de dados em replays entre usuários.

### 11. Consistência Transacional em Caso de Falha
As validações de mídia (MIME/Magic Bytes) e de quota (Entitlement) ocorrem antes de qualquer mutação no banco de dados. Em caso de falha de validação ou quota, nenhum registro de música, tablatura ou idempotência é salvo, preservando a consistência do estado.

### 12. Validação Efetiva dos Testes HTTP
Os 10 novos testes em `serverIntegration.test.ts` realizam chamadas HTTP reais via `fetch` contra o servidor efêmero, inspecionando códigos de resposta (`200`, `400`, `403`, `404`, `409`) e inspecionando o corpo JSON retornado pela rede. Não são asserções sobre mocks ou variáveis intermediárias.

---

## 3. AUDITORIA DOS TESTES EXECUTADOS

- `serverIntegration.test.ts`: **27 testes aprovados** (cobrindo IDOR, concorrência, idempotência sequencial/conflitante, tentativas de injeção de `system`, cabeçalhos malformados e catálogo legítimo).
- `adminAuthorization.test.ts`: **8 testes aprovados** (cobrindo fail-closed do bootstrap sem segredo e rejeição de chave inválida).
- `dbConcurrency.test.ts`: **1 teste aprovado** (cobrindo persistência e concorrência no arquivo JSON).
- `npm test`: **200 testes aprovados em 19 suítes** (0 falhas, 0 skips, duração: 2.19s).
- `npm run build`: **Compilação limpa em 1.00s** (0 erros TypeScript).
- `npm run gap-check`: **0 lacunas arquiteturais**.

---

## 4. RECONCILIAÇÃO DO WORKING TREE E SEGREGAÇÃO

A segregação do Grupo 1 (Segurança) está matematicamente confirmada:
1. `src/server/db.ts` (32 linhas adicionadas)
2. `src/server/routes.ts` (134 linhas modificadas/adicionadas)
3. `src/server/__tests__/adminAuthorization.test.ts` (25 linhas modificadas)
4. `src/server/__tests__/serverIntegration.test.ts` (450 linhas adicionadas)

**Isolamento Temático:** Nenhum dos 4 arquivos de segurança contém hunks pertencentes ao Crivo Harmônico (DSP) ou ao Catálogo Soberano. O staging seletivo do Grupo 1 pode ser executado cirurgicamente sem arrastar código de outros domínios.

**Avisos Globais de Whitespace:** Mantidos intocados nos 14 arquivos preexistentes de catálogo e documentação (evitando limpezas oportunistas fora de escopo).

---

## 5. PARECER CONCLUSIVO E RECOMENDAÇÃO

**Classificação Oficial:** **`SECURITY_REVIEW_READY_FOR_SELECTIVE_STAGING`**

### Próximos Passos Submetidos à Decisão do Sr. Pedro:
1. **Autorizar o staging seletivo estrito do Grupo 1** (apenas os 4 arquivos de segurança):
   - `git add src/server/db.ts src/server/routes.ts src/server/__tests__/adminAuthorization.test.ts src/server/__tests__/serverIntegration.test.ts`
   - Realizar o commit com mensagem canônica de segurança: `fix(security): remediate reserved identity bypass, enforce strict IDOR checks, and harden administrative bootstrap`
2. Manter o Grupo 2 (Crivo Harmônico) e o Grupo 3 (Catálogo Soberano) unstaged para revisões e consolidações dedicadas em etapas futuras.
3. Desbloquear a frente de planejamento do **Gate K (Frontend Visual Redesign)**.
