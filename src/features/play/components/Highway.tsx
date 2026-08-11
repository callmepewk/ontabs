// ontabs-play/components/Highway.tsx
// Canvas puro. O GameEngine desenha direto aqui via RAF — o React só monta
// o <canvas> uma vez e nunca mais re-renderiza por causa da animação.

import { useEffect, useRef } from 'react';
import { GameEngine } from '../gameEngine';

interface HighwayProps {
  engine: GameEngine | null;
  laneCount: number;
  laneColors: string[];
}

export function Highway({ engine, laneCount, laneColors }: HighwayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !engine) return;

    const resize = () => {
      const rect = canvas.parentElement!.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      engine.attachCanvas(ctx, {
        laneCount,
        width: rect.width,
        height: rect.height,
        hitZoneY: rect.height - 90,
        laneColors,
      });
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [engine, laneCount, laneColors]);

  return (
    <div className="otp-highway">
      <canvas ref={canvasRef} />
      <div className="otp-hitzone-labels">
        {Array.from({ length: laneCount }).map((_, i) => (
          <div key={i} className="otp-lane-label" style={{ background: laneColors[i % laneColors.length] }} />
        ))}
      </div>
    </div>
  );
}
