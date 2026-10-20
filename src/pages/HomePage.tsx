// src/pages/HomePage.tsx
// OnTabs Commercial Landing Page — Engenharia Musical Soberana (FASE UI)

import { useState } from 'react';
import { Link } from 'react-router-dom';

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
      specs: ['Afinação Standard, Drop D, DADGAD e afinações abertas', 'Otimização de casas via Dijkstra com tolerância biomecânica', 'Identificação de terças e oitavas paralelas entre guitarras'],
      icon: '🎸',
    },
    bass: {
      title: 'Contrabaixo (4 e 5 Cordas)',
      desc: 'Transposição inteligente de 1 oitava abaixo, mantendo clareza da fundamental e evitando posições fisicamente impossíveis.',
      specs: ['Extensão E1 a G3 com filtragem de notas fantasmas', 'Foco na linha rítmica fundamental e notas de passagem', 'Equalizador de estudo com boost de 80Hz para isolamento'],
      icon: '🎻',
    },
    drums: {
      title: 'Bateria & Percussão (Groove Grid)',
      desc: 'Tradução precisa de transientes e fluxo espectral para grade de 4 vias: Bumbo, Caixa, Chimbal e Pratos.',
      specs: ['Detecção de onsets por derivada positiva de fluxo', 'Sincronização milimétrica de compassos e andamento (BPM)', 'Padrão visual pronto para treino rítmico'],
      icon: '🥁',
    },
    sax: {
      title: 'Saxofone & Instrumentos de Sopro',
      desc: 'Transposição automática para afinações em Eb (Alto/Barítono) e Bb (Tenor/Soprano) com respirações guiadas.',
      specs: ['Transposição de tom automático (+9 ou +2 semitons)', 'Marcadores visuais de pausa para respiração a cada 4 compassos', 'Afinador cromático em cents para embocadura precisa'],
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
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 80px' }}>
      {/* 1. Header Profissional */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 0 32px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 40,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontSize: 22,
            fontWeight: 800,
            background: 'linear-gradient(90deg, #3ddc97, #4d8dff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            ONTABS
          </div>
          <span style={{
            fontSize: 10,
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#10b981',
            padding: '2px 8px',
            borderRadius: 12,
            fontWeight: 700,
          }}>
            SOVEREIGN ENGINE
          </span>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <a href="#recursos" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Recursos</a>
          <a href="#instrumentos" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Instrumentos</a>
          <a href="#como-funciona" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Como Funciona</a>
          <a href="#planos" style={{ fontSize: 13, color: 'var(--text-muted)' }}>Planos</a>
          <a href="#faq" style={{ fontSize: 13, color: 'var(--text-muted)' }}>FAQ</a>
          <Link to="/library" style={{ fontSize: 13, color: 'var(--text)', fontWeight: 600 }}>Biblioteca</Link>
          <Link to="/login" className="btn secondary" style={{ fontSize: 12, padding: '6px 14px' }}>
            Entrar
          </Link>
          <Link to="/register" className="btn" style={{ fontSize: 12, padding: '6px 14px', background: '#10b981', color: '#000', fontWeight: 700 }}>
            Começar Grátis
          </Link>
        </nav>
      </header>

      {/* 2. Hero Section */}
      <section style={{ textAlign: 'center', padding: '40px 0 60px' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'rgba(255, 255, 255, 0.05)',
          padding: '6px 16px',
          borderRadius: 20,
          fontSize: 12,
          color: '#3ddc97',
          marginBottom: 20,
          border: '1px solid rgba(61, 220, 151, 0.2)',
        }}>
          <span>⚡</span>
          <span>Engenharia Musical Soberana · Multi-Instrumental · DSP Local</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 54px)',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
          maxWidth: 860,
          margin: '0 auto 20px',
        }}>
          Da gravação à tablatura perfeita, com <span style={{ color: '#10b981' }}>precisão matemática</span> e inteligência de banda.
        </h1>

        <p style={{
          fontSize: 'clamp(16px, 2vw, 19px)',
          color: 'var(--text-muted)',
          maxWidth: 720,
          margin: '0 auto 32px',
          lineHeight: 1.6,
        }}>
          Vá além de conversores automáticos rasos. Isole guitarras solo e base, adapte arranjos para contrabaixo e saxofone, refine sua execução com afinador em cents e coordene os ensaios do seu grupo.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
          <Link
            to="/converter"
            className="btn"
            style={{
              background: '#10b981',
              color: '#000',
              fontWeight: 700,
              padding: '12px 28px',
              fontSize: 15,
              borderRadius: 8,
            }}
          >
            Experimentar Análise Grátis →
          </Link>
          <Link
            to="/library"
            className="btn secondary"
            style={{ padding: '12px 24px', fontSize: 15, borderRadius: 8 }}
          >
            Explorar Catálogo Público
          </Link>
        </div>

        {/* Mockup Interativo do Hero */}
        <div style={{
          marginTop: 50,
          background: '#0e0f17',
          border: '1px solid var(--border)',
          borderRadius: 12,
          padding: 24,
          boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
          textAlign: 'left',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffd166' }} />
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981' }} />
              <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>
                Canon Rock — JerryC (Otimização Ergonômica de Braço)
              </span>
            </div>

            <button
              onClick={playDemoSound}
              className="btn"
              style={{
                fontSize: 12,
                padding: '4px 12px',
                background: demoPlaying ? '#ffd166' : '#10b981',
                color: '#000',
                fontWeight: 700,
              }}
            >
              {demoPlaying ? '🔊 Reproduzindo...' : '▶ Tocar Arpejo Demo'}
            </button>
          </div>

          {/* Mini-Staff de Tablatura Interativa */}
          <div style={{ background: '#09090b', borderRadius: 8, padding: 16, fontFamily: 'monospace', fontSize: 13 }}>
            {[
              { str: 'e|', note: '12', pos: 25 },
              { str: 'B|', note: '15', pos: 45 },
              { str: 'G|', note: '14', pos: 65 },
              { str: 'D|', note: '12', pos: 85 },
              { str: 'A|', note: '—', pos: 0 },
              { str: 'E|', note: '—', pos: 0 },
            ].map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', height: 22, position: 'relative' }}>
                <span style={{ width: 30, color: '#10b981', fontWeight: 'bold' }}>{s.str}</span>
                <div style={{ flex: 1, height: 1, background: '#27272a', position: 'relative' }}>
                  {s.pos > 0 && (
                    <span style={{
                      position: 'absolute',
                      left: `${s.pos}%`,
                      top: -10,
                      background: '#10b981',
                      color: '#000',
                      borderRadius: 4,
                      padding: '0 4px',
                      fontSize: 11,
                      fontWeight: 'bold',
                    }}>
                      {s.note}
                    </span>
                  )}
                </div>
                <span style={{ color: '#27272a' }}>|</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', marginTop: 12 }}>
            <span>Tom: Ré Maior (D) · 130 BPM · Afinação: Drop D</span>
            <span style={{ color: '#3ddc97' }}>✓ Custo de deslocamento biomecânico minimizado por Dijkstra</span>
          </div>
        </div>
      </section>

      {/* 3. Diferenciação Editorial: Conversores Rasos vs. OnTabs */}
      <section id="recursos" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Por que o OnTabs é diferente?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 600, margin: '0 auto' }}>
            A maioria das ferramentas promete converter qualquer áudio com um clique, mas entrega partituras injogáveis e notas fantasmas.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
          <div className="card" style={{ padding: 24, background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
            <h3 style={{ color: '#ef4444', fontSize: 16, marginTop: 0 }}>❌ Conversores de Áudio Tradicionais</h3>
            <ul style={{ fontSize: 13, color: 'var(--text-muted)', paddingLeft: 18, lineHeight: 1.8 }}>
              <li>Empilham notas aleatórias na mesma corda no mesmo milissegundo.</li>
              <li>Exigem digitações absurdas com aberturas de mais de 7 casas no braço.</li>
              <li>Não distinguem entre a Guitarra Solo e a Base de apoio rítmico.</li>
              <li>Ignoram a afinação física de instrumentos como baixo e saxofone.</li>
              <li>Promessas vazias de 100% de precisão para mixagens polifônicas densas.</li>
            </ul>
          </div>

          <div className="card" style={{ padding: 24, background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
            <h3 style={{ color: '#10b981', fontSize: 16, marginTop: 0 }}>✓ Plataforma de Engenharia OnTabs</h3>
            <ul style={{ fontSize: 13, color: 'var(--text)', paddingLeft: 18, lineHeight: 1.8 }}>
              <li><strong>Otimização Ergonômica</strong>: Algoritmo de Dijkstra encontra a rota de menor custo biomecânico.</li>
              <li><strong>Inteligência de Duas Guitarras</strong>: Identifica Lead vs. Rhythm e harmonizações a terças.</li>
              <li><strong>Multi-Instrumental Real</strong>: Transposição de oitavas para baixo e intervalos de respiração para sax.</li>
              <li><strong>Equalizador de Estudo</strong>: Filtros Biquad paramétricos para isolar a faixa de frequência desejada.</li>
              <li><strong>Transparência Científica</strong>: Métricas e limites numéricos claros sem falsas alegações.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. Instrumentos Suportados ("Toque do Seu Jeito") */}
      <section id="instrumentos" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Adaptação Multi-Instrumental</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            Uma única gravação de referência desdobrada com fidelidade para a sua prática pessoal.
          </p>
        </div>

        {/* Abas de Instrumentos */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
          {(['guitar', 'bass', 'drums', 'sax'] as const).map((k) => (
            <button
              key={k}
              onClick={() => setActiveInstrumentTab(k)}
              style={{
                padding: '10px 18px',
                borderRadius: 8,
                fontSize: 13,
                cursor: 'pointer',
                border: activeInstrumentTab === k ? '1px solid #10b981' : '1px solid var(--border)',
                background: activeInstrumentTab === k ? 'rgba(16, 185, 129, 0.2)' : 'var(--bg-elevated)',
                color: activeInstrumentTab === k ? '#10b981' : 'var(--text-muted)',
                fontWeight: activeInstrumentTab === k ? 700 : 400,
              }}
            >
              {instrumentsData[k].icon} {instrumentsData[k].title.split(' ')[0]}
            </button>
          ))}
        </div>

        {/* Detalhe do Instrumento Selecionado */}
        <div className="card" style={{ padding: 28, background: '#0e0f17' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <span style={{ fontSize: 32 }}>{instrumentsData[activeInstrumentTab].icon}</span>
            <div>
              <h3 style={{ margin: 0, fontSize: 18 }}>{instrumentsData[activeInstrumentTab].title}</h3>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: 13 }}>
                {instrumentsData[activeInstrumentTab].desc}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#3ddc97', marginBottom: 8 }}>
              ESPECIFICAÇÕES DO MOTOR:
            </div>
            <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, color: 'var(--text)', lineHeight: 1.8 }}>
              {instrumentsData[activeInstrumentTab].specs.map((s, idx) => (
                <li key={idx}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* 5. Como Funciona (Fluxo de 4 Etapas) */}
      <section id="como-funciona" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Como Funciona o Fluxo Soberano</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            Da importação da faixa até o ensaio no palco em quatro etapas transparentes.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 16 }}>
          {[
            { step: '01', title: 'Ingestão Autorizada', desc: 'Envie seu arquivo de áudio ou importe referências públicas com verificação estrita de segurança e defesa anti-SSRF.' },
            { step: '02', title: 'DSP & Teoria Musical', desc: 'Extração de envelope RMS, fluxo espectral de onsets, autocorrelação interpolada e cromas Goertzel.' },
            { step: '03', title: 'Validação Física', desc: 'Dijkstra mapeia as notas no braço garantindo que cada acorde e digitação respeite a anatomia mecânica da mão.' },
            { step: '04', title: 'Prática & Ensaio', desc: 'Estude com o equalizador de 5 bandas, receba feedback do Ouvinte Ativo e monte setlists sincronizadas para seu show.' },
          ].map((item) => (
            <div key={item.step} className="card" style={{ padding: 20, background: '#0e0f17' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#10b981', marginBottom: 8 }}>{item.step}</div>
              <h4 style={{ margin: '0 0 6px', fontSize: 15 }}>{item.title}</h4>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 6. Planos e Acesso Transparente */}
      <section id="planos" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Planos Claros & Sem Pegadinhas</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            Experimente gratuitamente e evolua conforme a necessidade do seu aprendizado ou estúdio.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {/* Card Free */}
          <div className="card" style={{ padding: 24, background: '#0e0f17' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>Iniciante (Free)</h3>
            <div style={{ fontSize: 24, fontWeight: 800, margin: '12px 0' }}>Grátis</div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Ideal para testar a plataforma e estudar uma música por vez.
            </p>
            <ul style={{ fontSize: 13, paddingLeft: 18, lineHeight: 1.8, marginBottom: 24 }}>
              <li>1 música na biblioteca pessoal</li>
              <li>5 análises de áudio por mês</li>
              <li>Acesso ao afinador cromático em cents</li>
              <li>Visualizador interativo de tablaturas</li>
            </ul>
            <Link to="/register" className="btn secondary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
              Cadastrar Grátis
            </Link>
          </div>

          {/* Card Pro (Destacado) */}
          <div className="card" style={{ padding: 24, background: '#0e0f17', border: '1px solid #10b981', position: 'relative' }}>
            <div style={{
              position: 'absolute',
              top: -10,
              right: 16,
              background: '#10b981',
              color: '#000',
              fontSize: 10,
              fontWeight: 800,
              padding: '2px 8px',
              borderRadius: 10,
            }}>
              7 DIAS DE TRIAL GRÁTIS
            </div>
            <h3 style={{ margin: '0 0 4px', fontSize: 18, color: '#10b981' }}>Músico Pro</h3>
            <div style={{ fontSize: 24, fontWeight: 800, margin: '12px 0' }}>
              R$ 29,90 <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/mês</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Para músicos praticantes, estudantes e bandas ativas.
            </p>
            <ul style={{ fontSize: 13, paddingLeft: 18, lineHeight: 1.8, marginBottom: 24 }}>
              <li>200 músicas na biblioteca</li>
              <li>60 análises musicais por mês</li>
              <li>Inteligência de Duas Guitarras (Lead/Rhythm)</li>
              <li>Equalizador de 5 faixas e Stems Mixer</li>
              <li>Coordenação de Repertórios e Setlists ao vivo</li>
            </ul>
            <Link to="/register" className="btn" style={{ width: '100%', textAlign: 'center', display: 'block', background: '#10b981', color: '#000', fontWeight: 700 }}>
              Ativar 7 Dias Grátis
            </Link>
          </div>

          {/* Card Premium */}
          <div className="card" style={{ padding: 24, background: '#0e0f17' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 18 }}>Estúdio Premium</h3>
            <div style={{ fontSize: 24, fontWeight: 800, margin: '12px 0' }}>
              R$ 69,90 <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/mês</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 16 }}>
              Para produtores, arranjadores e estúdios musicais.
            </p>
            <ul style={{ fontSize: 13, paddingLeft: 18, lineHeight: 1.8, marginBottom: 24 }}>
              <li>Biblioteca ilimitada (5.000 músicas)</li>
              <li>500 análises musicais mensais</li>
              <li>Exportação de tablaturas em MIDI e MusicXML</li>
              <li>Suporte técnico prioritário de engenharia</li>
            </ul>
            <Link to="/register" className="btn secondary" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
              Conhecer Estúdio
            </Link>
          </div>
        </div>
      </section>

      {/* 7. FAQ (Perguntas Frequentes) */}
      <section id="faq" style={{ padding: '60px 0', borderTop: '1px solid var(--border)' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <h2 style={{ fontSize: 28, fontWeight: 700, margin: '0 0 8px' }}>Perguntas Frequentes</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: 15 }}>
            Respostas diretas e honestas sobre a engenharia e o uso do OnTabs.
          </p>
        </div>

        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {faqs.map((f, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div
                key={idx}
                className="card"
                onClick={() => setActiveFaq(isOpen ? null : idx)}
                style={{ padding: 18, cursor: 'pointer', background: '#0e0f17' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{f.q}</h4>
                  <span style={{ fontSize: 14, color: '#10b981' }}>{isOpen ? '▲' : '▼'}</span>
                </div>
                {isOpen && (
                  <p style={{ margin: '12px 0 0', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {f.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. CTA Final e Footer */}
      <section style={{
        textAlign: 'center',
        padding: '50px 20px',
        background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.08) 0%, transparent 100%)',
        borderRadius: 12,
        border: '1px solid rgba(16, 185, 129, 0.2)',
        margin: '40px 0',
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, margin: '0 0 12px' }}>
          Pronto para elevar seu estudo musical?
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: 15, maxWidth: 520, margin: '0 auto 24px' }}>
          Comece agora mesmo com sua primeira análise gratuita e experimente a diferença da engenharia de áudio soberana.
        </p>
        <Link
          to="/register"
          className="btn"
          style={{
            background: '#10b981',
            color: '#000',
            fontWeight: 700,
            padding: '12px 32px',
            fontSize: 15,
            borderRadius: 8,
          }}
        >
          Criar Conta Gratuita →
        </Link>
      </section>

      {/* Footer */}
      <footer style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 32,
        borderTop: '1px solid var(--border)',
        fontSize: 12,
        color: 'var(--text-muted)',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          © 2026 OnTabs Platform. Todos os direitos reservados. Motor independente de engenharia musical.
        </div>
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
