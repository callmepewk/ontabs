# ONTABS — POLÍTICA DE USO DE MÚSICA, TERMOS DE INGESTÃO E GOVERNANÇA DE TAKEDOWN
**Data de Vigência:** 19/10/2026 | **Versão:** 1.0.0-MVP  
**Aderência:** Lei Federal nº 9.610/1998 (Direitos Autorais), Lei Federal nº 12.965/2014 (Marco Civil da Internet), Lei Federal nº 13.709/2018 (LGPD).

---

## 1. Declaração do Usuário no Upload de Arquivos (MP3 / MP4)

Ao enviar qualquer arquivo de áudio ou vídeo para conversão na plataforma OnTabs, o usuário deve declarar expressamente e sob sua exclusiva responsabilidade que:

1. É o autor, titular originário ou cessionário legítimo dos direitos patrimoniais sobre a gravação e a obra musical; ou
2. Possui autorização, licença expressa ou consentimento do titular dos direitos para efetuar o upload e a análise musical privada; ou
3. A obra e a gravação encontram-se em domínio público comprovado; ou
4. A utilização pretendida enquadra-se estritamente nas hipóteses de limitações aos direitos autorais previstas em lei (como cópia privada individual para estudo ou ensino pessoal, sem intuito de lucro e sem disponibilização pública a terceiros, nos termos do Art. 46 da Lei 9.610/98).

> [!WARNING]
> O OnTabs não efetua publicação automática, compartilhamento em rede, distribuição pública nem disponibilização de arquivos de áudio enviados por usuários. O processamento ocorre exclusivamente para geração privada da tablatura de estudo na conta do próprio usuário.

---

## 2. Fluxo de Processamento Privado, Retenção e Descarte (LGPD)

- **Processamento em Memória:** As rotinas de decodificação de áudio, cálculo de envelope RMS, detecção de BPM e F0 por autocorrelação ocorrem prioritariamente na memória de execução local do navegador (Web Audio API) ou em instâncias voláteis e isoladas de backend.
- **Isolamento de Dados de Usuários:** Arquivos temporários são gravados em diretórios segregados por identificador de usuário (`uploads/<userId>/`), com higienização estrita contra ataques de *Path Traversal* e barreiras de acesso multiusuário.
- **Política de Retenção:** Arquivos de áudio brutos enviados para conversão temporária são descartados após a extração das notas e geração da tablatura, não sendo mantidos em bibliotecas compartilhadas da plataforma.
- **Tratamento de Dados Pessoais (LGPD):** Apenas os metadados cadastrais essenciais (e-mail, nome de usuário, histórico de transações e estatísticas de uso) são processados com base no cumprimento de contrato (Art. 7º, V) e legítimo interesse (Art. 7º, IX da LGPD). Não são coletados dados biométricos de voz.

---

## 3. Política de Notificação, Retirada e Contranotificação (Notice & Takedown)

O OnTabs adota procedimento célere para apuração e cessação de qualquer alegada violação a direitos autorais:

### 3.1 Procedimento de Notificação Extrajudicial
Qualquer titular de direitos autorais ou seu procurador legalmente constituído poderá enviar notificação motivada para o canal de conformidade (`legal@ontabs.com` / `abuse@ontabs.com`), contendo:
1. Identificação precisa da obra musical ou fonograma protegido;
2. Link ou identificador do ativo apontado como infringente na plataforma;
3. Comprovação documental de titularidade ou procuração válida;
4. Declaração expressa de veracidade sob as penas da lei.

### 3.2 Ação Imediata do Portão de Admissão
Ao receber notificação formal idônea:
1. O ativo é imediatamente marcado no catálogo com o status `isRevoked: true` e `decision: REVOKED`;
2. O [`admissionGate`](file:///C:/Users/pedro/OneDrive/Desktop/ontabs-app/src/engine/admissionGate.ts) bloqueia em tempo real qualquer operação de reprodução pública, exibição ou processamento comercial;
3. Um registro imutável do evento é gravado no log de proveniência (`provenance.jsonl`).

### 3.3 Política de Infratores Reincidentes
Contas de usuários que reiteradamente enviarem arquivos de terceiros em violação ostensiva às diretrizes da plataforma terão seus privilégios de upload suspensos temporariamente ou a conta cancelada definitivamente, garantido o direito de resposta e contranotificação.
