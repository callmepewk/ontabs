# OnTabs — Modelo de Ameaças e Segurança da Aplicação (Phase A/B)

**Data**: 2026-10-19  
**Responsável**: Antigravity — Hardening & Technical Assurance  
**Repositório Canônico**: `https://github.com/callmepewk/ontabs`  

---

## 1. Escopo de Threat Modeling

O OnTabs opera como uma aplicação web que processa mídia de áudio e gerencia direitos de acesso e assinaturas. Este modelo de ameaças examina os vetores de ataque reais sobre as superfícies de:
1. Ingestão de arquivos de áudio/vídeo locais.
2. Ingestão de URLs externas (conectores).
3. Camada de persistência e concorrência.
4. Máquina de estados de acesso, autenticação e autorização.
5. Superfície de rede e exposição de endpoints.

---

## 2. Matriz de Ameaças e Controles Implementados

| ID | Vetor de Ameaça | Gravidade | Mecanismo de Ataque | Controle Implementado / Requerido | Status |
|---|---|---|---|---|---|
| **THREAT-01** | **SSRF via Conectores de URL** | **Alta** | Atacante submete URL interna (ex: `http://169.254.169.254/latest/meta-data/` ou `http://localhost:3001/admin`) | Allowlist estrita de domínios (`youtube.com`, `youtu.be`, `spotify.com`); proibição de resolução de endereços IP privados/loopback | **EM HARDENING** |
| **THREAT-02** | **Bypass de Limite do Trial via Relógio** | **Alta** | Usuário atrasa o relógio da máquina cliente para prorrogar os 7 dias de trial | Autorização 100% server-side comparando `trialEndsAt` com o relógio do servidor | **VERIFICADO** |
| **THREAT-03** | **Manipulação de Planos via Frontend** | **Alta** | Usuário envia mutation ou chamada de API alterando `plan_code` para Pro/Premium | Servidor rejeita upgrades diretos sem confirmação de webhook de pagamento | **EM HARDENING** |
| **THREAT-04** | **Acesso Cruzado / Exclusão Não Autorizada** | **Crítica** | Usuário B envia requisição `DELETE /api/songs/{id_de_outro}` | Verificação estrita de ownership: `song.userId === currentUser.id` | **VERIFICADO** |
| **THREAT-05** | **Bypass da Cota Gratuita de Visitante** | **Média** | Visitante limpa `localStorage` e gera novo ID de visitante para usar grátis infinitamente | Assinatura de fingerprint de navegador e limitação por hash de IP no backend | **EM HARDENING** |
| **THREAT-06** | **Race Condition / Concorrência no DB** | **Alta** | Múltiplas requisições simultâneas de gravação sobrescrevendo dados em memória | Fila assíncrona serializada (Async Lock Mutex) na escrita | **EM HARDENING** |
| **THREAT-07** | **Ataque de Exaustão de Recursos (Bomba ZIP / Áudio Gigante)** | **Alta** | Upload de arquivo compactado malicioso ou arquivo de 2GB para exaurir RAM | Validação de tamanho no cliente (<=30MB) e destruição de stream no servidor se >10MB | **EM HARDENING** |
| **THREAT-08** | **Injeção de Código / XSS via Título da Música** | **Média** | Título contendo `<script>` renderizado sem sanitização | Renderização segura em React via escape automático de JSX; validação de strings no backend | **VERIFICADO** |
| **THREAT-09** | **Força Bruta / Roubo de Credenciais** | **Alta** | Ataque de dicionário ou rainbow tables contra senhas de usuários | Derivação de chaves via `scryptSync` com salt criptográfico único de 16 bytes | **VERIFICADO** |
| **THREAT-10** | **Exposição Inadvertida de Túnel** | **Alta** | Deixar túnel público ativo expondo ambiente local de desenvolvimento | Proibição estrita de ativação de túnel sem autorização expressa | **VERIFICADO** |

---

## 3. Diretrizes de Mitigação Imediata

1. **Sanitização de URLs no Backend**: Nenhuma requisição HTTP externa deve ser disparada pelo servidor para URLs fornecidas por usuários a menos que o hostname pertença à allowlist prévia:
   - `*.youtube.com`
   - `youtu.be`
   - `open.spotify.com`
2. **Serialização de Mutação do DB**: O arquivo `src/server/db.ts` deve encapsular todas as gravações em um mecanismo de lock para garantir ACID sem corrupção concorrente.
3. **Bloqueio de Upgrade Sintético**: O endpoint `POST /api/plans/select` não pode autorizar planos pagos (`pro` ou `premium`) em ambiente de desenvolvimento sem transação verificável.
