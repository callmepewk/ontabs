// src/pages/HomePage.tsx
// OnTabs Commercial Landing Page — Engenharia Musical Soberana

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Card } from '@/components/ui';

export function HomePage() {
  const [activeInstrumentTab, setActiveInstrumentTab] = useState<'guitar' | 'bass' | 'drums' | 'sax'>('guitar');
  const [demoPlaying, setDemoPlaying] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // Síntese Web Audio real simples para a demonstração interativa do Hero
  function playDemoSound() {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const gain = ctx.createGain();

      const notes = [261.63, 329.63, 392.0, 523.25]; // C E G C (Arpejo Dó Maior)
      let time = ctx.currentTime;

      gain.gain.setValueAtTime(0.15, time);

      notes.forEach((freq) => {
        const noteOsc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        noteOsc.type = 'triangle';
        noteOsc.frequency.setValueAtTime(freq, time);

        noteGain.gain.setValueAtTime(0.2, time);
        noteGain.gain.exponentialRampToValueAtTime(0.001, time + 0.35);

        noteOsc.connect(noteGain);
        noteGain.connect(ctx.destination);

        noteOsc.start(time);
        noteOsc.stop(time + 0.38);
        time += 0.2;
      });

      setDemoPlaying(true);
      setTimeout(() => setDemoPlaying(false), 900);
    } catch {
      // Fallback gracioso caso áudio esteja bloqueado
    }
  }

  const instrumentsData = {
    guitar: {
      title: 'Guitarra Elétrica (Solo & Base)',
      desc: 'Classificação automática de papéis (Lead vs. Rhythm) e mapeamento polifônico para dedilhados ergonômicos no braço.',
      specs: [
        'Afinação Standard, Drop D, DADGAD e afinações abertas',
        'Otimização de casas via Dijkstra com tolerância biomecânica',
        'Identificação de terças e oitavas paralelas entre guitarras',
      ],
      icon: '🎸',
    },
    bass: {
      title: 'Contrabaixo (4 e 5 Cordas)',
      desc: 'Transposição inteligente de 1 oitava abaixo, mantendo clareza da fundamental e evitando posições fisicamente impossíveis.',
      specs: [
        'Extensão E1 a G3 com filtragem de notas fantasmas',
        'Foco na linha rítmica fundamental e notas de passagem',
        'Equalizador de estudo com boost de 80Hz para isolamento',
      ],
      icon: '🎻',
    },
    drums: {
      title: 'Bateria & Percussão (Groove Grid)',
      desc: 'Tradução precisa de transientes e fluxo espectral para grade de 4 vias: Bumbo, Caixa, Chimbal e Pratos.',
      specs: [
        'Detecção de onsets por derivada positiva de fluxo',
        'Sincronização milimétrica de compassos e andamento (BPM)',
        'Padrão visual pronto para treino rítmico',
      ],
      icon: '🥁',
    },
    sax: {
      title: 'Saxofone & Instrumentos de Sopro',
      desc: 'Transposição automática para afinações em Eb (Alto/Barítono) e Bb (Tenor/Soprano) com respirações guiadas.',
      specs: [
        'Transposição de tom automático (+9 ou +2 semitons)',
        'Marcadores visuais de pausa para respiração a cada 4 compassos',
        'Afinador cromático em cents para embocadura precisa',
      ],
      icon: '🎷',
    },
  };

  const faqs = [
    {
      q: 'O OnTabs é apenas um conversor automático de MP3 para tablatura?',
      a: 'Não. O OnTabs é uma plataforma completa de engenharia musical. Além da estimativa de frequência fundamental (F0) por autocorrelação interpolada, ele realiza otimização física de digitação (Dijkstra), inteligência de duas guitarras (Lead vs. Rhythm), adaptação instrumental e coordenação de setlists ao vivo com transições de afinação.',
    },
    {
      q: 'Qual é a precisão matemática do motor musical?',
      a: 'Para sinais monofônicos claros, o motor atinge desvio inferior a 5 cents e erro de frequência < 1% comprovado por testes automatizados com oráculos independentes. Para sinais polifônicos complexos, o motor utiliza filtros Goertzel e perfis tonais Krumhansl-Schmuckler, sem alegar infalibilidade absoluta em mixagens densas.',
    },
    {
      q: 'Como funciona o período de testes (Trial)?',
      a: 'Ao criar sua conta, você recebe 7 dias completos (168 horas corridas) de acesso aos recursos Pro. O controle é executado com precisão UTC no servidor, sem pegadinhas nem cobranças automáticas não autorizadas.',
    },
    {
      q: 'Posso explorar e testar a plataforma sem me cadastrar?',
      a: 'Sim! Visitantes anônimos podem explorar o catálogo demonstrativo na Biblioteca, alternar modos de visualização em grade ou lista, filtrar instrumentos, testar o afinador cromático e visualizar tablaturas reais antes de criar conta.',
    },
    {
      q: 'Meu áudio pessoal é enviado para servidores externos?',
      a: 'O módulo Active Listener (Afinador e Coach) processa o microfone 100% no seu navegador via Web Audio API, com zero retenção de dados e zero upload. As análises de arquivos enviados são processadas pelo servidor soberano local.',
    },
  ];

  return (
    <div className="page" style={{ maxWidth: 1140, margin: '0 auto', paddingBottom: 80 }}>
      {/* 1. Header Institucional */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 0 28px',
          borderBottom: '1px solid var(--border-subtle)',
          marginBottom: 40,
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 800,
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
            }}
          >
            ON<span style={{ color: 'var(--accent-primary)' }}>TABS</span>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
          <a href="#recursos" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Recursos
          </a>
          <a href="#instrumentos" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Instrumentos
          </a>
          <a href="#como-funciona" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Como Funciona
          </a>
          <a href="#planos" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            Planos
          </a>
          <a href="#faq" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            FAQ
          </a>
          <Link to="/library" style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
            Biblioteca
          </Link>
          <Link to="/login">
            <Button variant="secondary" size="sm">
              Entrar
            </Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">
              Começar Grátis
            </Button>
          </Link>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section style={{ textAlign: 'center', padding: '40px 0 56px' }}>
        <h1
          style={{
            fontSize: 'clamp(32px, 5vw, 52px)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            maxWidth: 880,
            margin: '0 auto 20px',
            color: 'var(--text-primary)',
          }}
        >
          Da gravação à tablatura perfeita, com{' '}
          <span style={{ color: 'var(--accent-primary)' }}>
            precisão musical
          </span>{' '}
          e inteligência de banda.
        </h1>

        <p
          style={{
            fontSize: 'clamp(16px, 2vw, 18px)',
            color: 'var(--text-secondary)',
            maxWidth: 720,
            margin: '0 auto 32px',
            lineHeight: 1.6,
          }}
        >
          Vá além de conversores automáticos rasos. Isole guitarras solo e base, adapte arranjos para contrabaixo e saxofone, refine sua execução com afinador em cents e coordene os ensaios do seu grupo.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link to="/converter">
            <Button variant="primary" size="lg">
              Experimentar Análise Grátis →
            </Button>
          </Link>
          <Link to="/library">
            <Button variant="secondary" size="lg">
              Explorar Catálogo Público
            </Button>
          </Link>
        </div>

        {/* Mockup Interativo do Hero */}
        <Card
          elevation={2}
          style={{
            marginTop: 48,
            textAlign: 'left',
            padding: 24,
            border: '1px solid var(--border-default)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '3px 8px',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--surface-overlay)',
                  color: 'var(--accent-primary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Demonstração Interativa
              </span>
              <span style={{ fontSize: 13, color: 'var(--text-primary)', fontWeight: 600 }}>
                Canon Rock — JerryC
              </span>
            </div>

            <Button
              variant={demoPlaying ? 'secondary' : 'primary'}
              size="sm"
              onClick={playDemoSound}
              style={{ fontSize: 12 }}
            >
              {demoPlaying ? 'Reproduzindo...' : '▶ Tocar Arpejo Demo'}
            </Button>
          </div>

          {/* Mini-Staff de Tablatura Interativa */}
          <div
            style={{
              background: 'var(--bg-canvas)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              fontFamily: 'monospace',
              fontSize: 13,
              border: '1px solid var(--border-subtle)',
            }}
          >
            {[
              { str: 'e|', note: '12', pos: 25 },
              { str: 'B|', note: '15', pos: 45 },
              { str: 'G|', note: '14', pos: 65 },
              { str: 'D|', note: '12', pos: 85 },
              { str: 'A|', note: '—', pos: 0 },
              { str: 'E|', note: '—', pos: 0 },
            ].map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', height: 22, position: 'relative' }}>
                <span style={{ width: 30, color: 'var(--accent-neon)', fontWeight: 'bold' }}>{s.str}</span>
                <div style={{ flex: 1, height: 1, background: 'rgba(255, 255, 255, 0.1)', position: 'relative' }}>
                  {s.pos > 0 && (
                    <span
                      style={{
                        position: 'absolute',
                        left: `${s.pos}%`,
                        top: -10,
                        background: 'var(--accent-neon)',
                        color: '#051a11',
                        borderRadius: 'var(--radius-xs)',
                        padding: '1px 5px',
                        fontSize: 11,
                        fontWeight: 'bold',
                      }}
                    >
                      {s.note}
                    </span>
                  )}
                </div>
                <span style={{ color: 'rgba(255, 255, 255, 0.15)' }}>|</span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 14,
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <span>Tom: Ré Maior (D) · 130 BPM · Afinação: Drop D</span>
            <span style={{ color: 'var(--accent-primary)', fontWeight: 500 }}>
              ✓ Custo de deslocamento biomecânico minimizado por Dijkstra
            </span>
          </div>
        </Card>
      </section>

      {/* 3. Diferenciação Editorial: Conversores Rasos vs. OnTabs */}
      <section id="recursos" style={{ padding: '60px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>
            Por que o OnTabs é diferente?
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 620, margin: '0 auto' }}>
            A maioria das ferramentas promete converter qualquer áudio com um clique, mas entrega partituras injogáveis e notas fantasmas.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <Card
            elevation={1}
            style={{
              padding: 28,
              background: 'rgba(239, 68, 68, 0.04)',
              borderColor: 'rgba(239, 68, 68, 0.25)',
            }}
          >
            <h3 style={{ color: 'var(--accent-coral)', fontSize: 16, marginTop: 0, fontWeight: 700 }}>
              ❌ Conversores de Áudio Tradicionais
            </h3>
            <ul style={{ fontSize: 14, color: 'var(--text-secondary)', paddingLeft: 18, lineHeight: 1.8, margin: 0 }}>
              <li>Empilham notas aleatórias na mesma corda no mesmo milissegundo.</li>
              <li>Exigem digitações absurdas com aberturas de mais de 7 casas no braço.</li>
              <li>Não distinguem entre a Guitarra Solo e a Base de apoio rítmico.</li>
              <li>Ignoram a afinação física de instrumentos como baixo e saxofone.</li>
              <li>Promessas vazias de 100% de precisão para mixagens polifônicas densas.</li>
            </ul>
          </Card>

          <Card
            elevation={1}
            style={{
              padding: 28,
              background: 'rgba(99, 102, 241, 0.04)',
              borderColor: 'rgba(99, 102, 241, 0.3)',
            }}
          >
            <h3 style={{ color: 'var(--accent-primary)', fontSize: 16, marginTop: 0, fontWeight: 700 }}>
              ✓ Plataforma de Engenharia OnTabs
            </h3>
            <ul style={{ fontSize: 14, color: 'var(--text-primary)', paddingLeft: 18, lineHeight: 1.8, margin: 0 }}>
              <li>
                <strong>Otimização Ergonômica</strong>: Algoritmo de Dijkstra encontra a rota de menor custo biomecânico.
              </li>
              <li>
                <strong>Inteligência de Duas Guitarras</strong>: Identifica Lead vs. Rhythm e harmonizações a terças.
              </li>
              <li>
                <strong>Multi-Instrumental Real</strong>: Transposição de oitavas para baixo e intervalos de respiração para sax.
              </li>
              <li>
                <strong>Equalizador de Estudo</strong>: Filtros Biquad paramétricos para isolar a faixa de frequência desejada.
              </li>
              <li>
                <strong>Transparência Científica</strong>: Métricas e limites numéricos claros sem falsas alegações.
              </li>
            </ul>
          </Card>
        </div>
      </section>

      {/* 4. Instrumentos Suportados ("Toque do Seu Jeito") */}
      <section id="instrumentos" style={{ padding: '60px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>
            Adaptação Multi-Instrumental
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Uma única gravação de referência desdobrada com fidelidade para a sua prática pessoal.
          </p>
        </div>

        {/* Abas de Instrumentos */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['guitar', 'bass', 'drums', 'sax'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setActiveInstrumentTab(k)}
              style={{
                padding: '10px 20px',
                borderRadius: 'var(--radius-md)',
                fontSize: 13,
                cursor: 'pointer',
                border: activeInstrumentTab === k ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
                background: activeInstrumentTab === k ? 'var(--surface-overlay)' : 'var(--surface-base)',
                color: activeInstrumentTab === k ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: activeInstrumentTab === k ? 600 : 500,
                transition: 'all var(--duration-fast) var(--ease-spring)',
              }}
            >
              {instrumentsData[k].icon} {instrumentsData[k].title.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Detalhe do Instrumento Selecionado */}
        <Card elevation={2} style={{ padding: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
            <span style={{ fontSize: 36 }}>{instrumentsData[activeInstrumentTab].icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--text-primary)' }}>
                {instrumentsData[activeInstrumentTab].title}
              </h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 14 }}>
                {instrumentsData[activeInstrumentTab].desc}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 20, borderTop: '1px solid var(--border-subtle)', paddingTop: 20 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-primary)', marginBottom: 10, letterSpacing: '0.04em' }}>
              ESPECIFICAÇÕES DO MOTOR:
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.8 }}>
              {instrumentsData[activeInstrumentTab].specs.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        </Card>
      </section>

      {/* 5. Como Funciona (Fluxo de 4 Etapas) */}
      <section id="como-funciona" style={{ padding: '60px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>
            Como Funciona o Fluxo Soberano
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Da importação da faixa até o ensaio no palco em quatro etapas transparentes.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 18 }}>
          {[
            {
              step: '01',
              title: 'Ingestão Autorizada',
              desc: 'Envie seu arquivo de áudio ou importe referências públicas com verificação estrita de segurança e defesa anti-SSRF.',
            },
            {
              step: '02',
              title: 'DSP & Teoria Musical',
              desc: 'Extração de envelope RMS, fluxo espectral de onsets, autocorrelação interpolada e cromas Goertzel.',
            },
            {
              step: '03',
              title: 'Validação Física',
              desc: 'Dijkstra mapeia as notas no braço garantindo que cada acorde e digitação respeite a anatomia mecânica da mão.',
            },
            {
              step: '04',
              title: 'Prática & Ensaio',
              desc: 'Estude com o equalizador de 5 bandas, receba feedback do Ouvinte Ativo e monte setlists sincronizadas para seu show.',
            },
          ].map((item) => (
            <Card key={item.step} elevation={1} style={{ padding: 24 }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--accent-primary)', marginBottom: 10 }}>
                {item.step}
              </div>
              <h4 style={{ margin: '0 0 8px', fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
                {item.title}
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{item.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* 6. Planos e Acesso Transparente */}
      <section id="planos" style={{ padding: '60px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>
            Planos Claros & Sem Pegadinhas
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Experimente gratuitamente e evolua conforme a necessidade do seu aprendizado ou estúdio.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {/* Card Free */}
          <Card elevation={1} style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, color: 'var(--text-primary)' }}>Iniciante (Free)</h3>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '14px 0', color: 'var(--text-primary)' }}>Grátis</div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Ideal para testar a plataforma e estudar uma música por vez.
              </p>
              <ul style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 18, lineHeight: 1.8, marginBottom: 28 }}>
                <li>1 música na biblioteca pessoal</li>
                <li>5 análises de áudio por mês</li>
                <li>Acesso ao afinador cromático em cents</li>
                <li>Visualizador interativo de tablaturas</li>
              </ul>
            </div>
            <Link to="/register" style={{ display: 'block' }}>
              <Button variant="secondary" style={{ width: '100%' }}>
                Cadastrar Grátis
              </Button>
            </Link>
          </Card>

          {/* Card Pro (Destacado) */}
          <Card
            elevation={2}
            style={{
              padding: 28,
              border: '1px solid var(--accent-primary)',
              boxShadow: 'var(--shadow-md)',
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  position: 'absolute',
                  top: -11,
                  right: 20,
                  background: 'var(--accent-primary)',
                  color: '#ffffff',
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: 'var(--radius-sm)',
                  letterSpacing: '0.04em',
                }}
              >
                7 DIAS DE TRIAL GRÁTIS
              </div>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, color: 'var(--text-primary)' }}>Músico Pro</h3>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '14px 0', color: 'var(--text-primary)' }}>
                R$ 29,90 <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Para músicos praticantes, estudantes e bandas ativas.
              </p>
              <ul style={{ fontSize: 13, color: 'var(--text-primary)', paddingLeft: 18, lineHeight: 1.8, marginBottom: 28 }}>
                <li>200 músicas na biblioteca</li>
                <li>60 análises musicais por mês</li>
                <li>Inteligência de Duas Guitarras (Lead/Rhythm)</li>
                <li>Equalizador de 5 faixas e Stems Mixer</li>
                <li>Coordenação de Repertórios e Setlists ao vivo</li>
              </ul>
            </div>
            <Link to="/register" style={{ display: 'block' }}>
              <Button variant="primary" style={{ width: '100%' }}>
                Ativar 7 Dias Grátis
              </Button>
            </Link>
          </Card>

          {/* Card Premium */}
          <Card elevation={1} style={{ padding: 28, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ margin: '0 0 4px', fontSize: 18, color: 'var(--text-primary)' }}>Estúdio Premium</h3>
              <div style={{ fontSize: 28, fontWeight: 800, margin: '14px 0', color: 'var(--text-primary)' }}>
                R$ 69,90 <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 400 }}>/mês</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20 }}>
                Para produtores, arranjadores e estúdios musicais.
              </p>
              <ul style={{ fontSize: 13, color: 'var(--text-secondary)', paddingLeft: 18, lineHeight: 1.8, marginBottom: 28 }}>
                <li>Biblioteca ilimitada (5.000 músicas)</li>
                <li>500 análises musicais mensais</li>
                <li>Exportação de tablaturas em MIDI e MusicXML</li>
                <li>Suporte técnico prioritário de engenharia</li>
              </ul>
            </div>
            <Link to="/register" style={{ display: 'block' }}>
              <Button variant="secondary" style={{ width: '100%' }}>
                Conhecer Estúdio
              </Button>
            </Link>
          </Card>
        </div>
      </section>

      {/* 7. FAQ (Perguntas Frequentes) */}
      <section id="faq" style={{ padding: '60px 0', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 10px', color: 'var(--text-primary)' }}>
            Perguntas Frequentes
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>
            Respostas diretas e honestas sobre a engenharia e o uso do OnTabs.
          </p>
        </div>

        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((f, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <Card
                key={idx}
                elevation={1}
                interactive
                onClick={() => setActiveFaq(isOpen ? null : idx)}
                style={{ padding: '18px 24px' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>{f.q}</h4>
                  <span style={{ fontSize: 13, color: 'var(--text-muted)', marginLeft: 16 }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <p style={{ margin: '14px 0 0', fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    {f.a}
                  </p>
                )}
              </Card>
            );
          })}
        </div>
      </section>

      {/* 8. CTA Final */}
      <section
        style={{
          textAlign: 'center',
          padding: '48px 24px',
          background: 'radial-gradient(ellipse at center, rgba(16, 185, 129, 0.12) 0%, transparent 70%)',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid rgba(16, 185, 129, 0.25)',
          margin: '40px 0',
        }}
      >
        <h2 style={{ fontSize: 30, fontWeight: 800, margin: '0 0 12px', color: 'var(--text-primary)' }}>
          Pronto para elevar seu estudo musical?
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 540, margin: '0 auto 24px' }}>
          Comece agora mesmo com sua primeira análise gratuita e experimente a diferença da engenharia de áudio soberana.
        </p>
        <Link to="/register">
          <Button variant="primary" size="lg">
            Criar Conta Gratuita →
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 32,
          borderTop: '1px solid var(--border-subtle)',
          fontSize: 13,
          color: 'var(--text-muted)',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        <div>© 2026 OnTabs Platform. Todos os direitos reservados. Motor independente de engenharia musical.</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/library">Biblioteca</Link>
          <Link to="/converter">Converter</Link>
          <Link to="/setlists">Repertórios</Link>
          <Link to="/planos">Planos</Link>
          <Link to="/login">Entrar</Link>
        </div>
      </footer>
    </div>
  );
}
