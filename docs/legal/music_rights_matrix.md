# ONTABS — MATRIZ DE DIREITOS, LICENCIAMENTO & FRONTEIRAS OPERACIONAIS
**Data:** 19/10/2026 | **Versão:** 1.0.0  
**Enquadramento:** Lei Federal nº 9.610/1998 (Brasil), LGPD (Lei nº 13.709/2018), Spotify Developer Terms e Creative Commons Jurisprudence.

---

## 1. Princípio Fundamental de Separação de Direitos

No OnTabs, a autorização jurídica nunca é tratada como um valor booleano genérico (`legal: true`). Uma operação permitida (ex: decodificar áudio em memória no navegador para o próprio usuário) não transfere nem presume autorização para outras operações (ex: streaming público, publicação de partitura ou treinamento de modelos de IA).

```
                      ┌───────────────────────────────────────┐
                      │            FONTE MUSICAL              │
                      └──────────────────┬────────────────────┘
                                         │
                 ┌───────────────────────┴───────────────────────┐
                 ▼                                               ▼
     ┌───────────────────────┐                       ┌───────────────────────┐
     │ OBRA MUSICAL (AUTOR)  │                       │ FONOGRAMA (GRAVAÇÃO)  │
     │  Melodia / Letra /    │                       │  Fixação Sonora /     │
     │  Harmonia (Editora)   │                       │  Produtor / Músicos   │
     └───────────┬───────────┘                       └───────────┬───────────┘
                 │                                               │
        ┌────────┴────────┐                             ┌────────┴────────┐
        ▼                 ▼                             ▼                 ▼
 ┌─────────────┐   ┌─────────────┐               ┌─────────────┐   ┌─────────────┐
 │ REPRODUÇÃO  │   │  EXECUÇÃO   │               │PROCESSAMENTO│   │ REDISTRI-   │
 │   GRÁFICA   │   │   PÚBLICA   │               │   DIGITAL   │   │   BUIÇÃO    │
 │ (TABLATURA) │   │   (ECAD)    │               │  (DSP / IA) │   │ (STREAMING) │
 └─────────────┘   └─────────────┘               └─────────────┘   └─────────────┘
```

---

## 2. Matriz Granular de Direitos por Fonte de Catálogo

| Fonte / Dataset | Composição | Fonograma | Download / Armazenamento | Processamento Privado (User) | Processamento Comercial (App) | Separação de Stems | Exibição de Tablatura | Reprodução Pública | Treinamento de IA / ML | Atribuição Obrigatória |
|---|---|---|---|---|---|---|---|---|---|---|
| **Musopen CC0** | Domínio Público | Domínio Público (CC0) | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | Não (Recomendada) |
| **Domínio Público BR (< 1954)** | Domínio Público | Domínio Público | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **Sim (Art. 41/96)** |
| **GuitarSet (ISMIR)** | CC BY 4.0 | CC BY 4.0 | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **CONDICIONAL** | **ALLOWED** | **Sim (NYU MARL)** |
| **Free Music Archive (CC BY)** | CC BY 4.0 | CC BY 4.0 | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **ALLOWED** | **CONDICIONAL** | **ALLOWED** | **Sim (Autor/FMA)** |
| **MUSDB18 / MedleyDB** | Mista (NC) | Mista (NC) | **ALLOWED (Pesquisa)** | **ALLOWED** | **BLOCKED (NC)** | **ALLOWED (Pesquisa)** | **BLOCKED (Público)** | **BLOCKED** | **CONDICIONAL (Acadêmico)** | **Sim** |
| **Cambridge MT (Mixing Secrets)** | Mista | Licença Pessoal MTK | **ALLOWED (Prática)** | **ALLOWED** | **BLOCKED** | **ALLOWED (Prática)** | **BLOCKED** | **BLOCKED** | **BLOCKED (Expressamente)** | **Sim** |
| **Spotify API / Web** | Copyright Comercial | Copyright Gravadora | **BLOCKED (TOS)** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED** | **BLOCKED (Expressamente)** | **Sim (Branding)** |
| **Upload Privado do Usuário** | Declarada pelo Usuário | Declarada pelo Usuário | **ALLOWED (Volátil)** | **ALLOWED** | **ALLOWED (Isolado)** | **ALLOWED** | **ALLOWED (Privado)** | **BLOCKED (Sem Clear)** | **BLOCKED** | N/A |

---

## 3. As 14 Dimensões de Avaliação da Matriz de Decisão

1. **Direitos sobre a Composição:** Titularidade da melodia e letra. Se sob domínio público, a transcrição não gera infração à editora. Se protegida, a transcrição gráfica pública exige autorização.
2. **Direitos sobre o Fonograma:** Titularidade do produtor fonográfico e intérpretes. A existência de direitos conexos impede cópia ou redistribuição da gravação sem licença de sincronização/reprodução.
3. **Download e Retenção em Disco:** Autorização para transferir e manter cópia do arquivo de áudio nos servidores do OnTabs.
4. **Processamento Privado:** Capacidade de analisar o sinal na máquina ou sessão do usuário sem exposição pública do áudio.
5. **Processamento Comercial:** Direito de utilizar a gravação como parte de produto pago ou com cobrança de mensalidade/assinatura.
6. **Inferência por IA/DSP:** Alimentação do sinal de áudio em algoritmos de transformada de Fourier, autocorrelação e modelos de rede neural para predição de notas.
7. **Treinamento de Modelos de IA:** Uso do áudio e anotações para ajuste de pesos de modelos matemáticos.
8. **Geração e Retenção de Stems:** Autorização para criar arquivos separados de bateria, baixo, voz e outros.
9. **Exibição de Tablatura e Notação:** Apresentação visual da transcrição para terceiros ou no modo público.
10. **Reprodução Pública (Streaming):** Execução do áudio audível para múltiplos usuários através da aplicação web.
11. **Redistribuição:** Entrega de arquivos de áudio brutos ou modificados para download pelo usuário final.
12. **Atribuição:** Requisitos de citação de nomes de artistas, produtores e links de licença.
13. **Territorialidade:** Validade no território brasileiro e internacional.
14. **Revogabilidade e Takedown:** Mecanismos de expiração e resposta imediata a notificações de violação.
