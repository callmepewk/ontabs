// ontabs-play/components/TouchControls.tsx
import { InputManager } from '../inputManager';

interface TouchControlsProps {
  laneCount: number;
  laneColors: string[];
  input: InputManager;
}

export function TouchControls({ laneCount, laneColors, input }: TouchControlsProps) {
  return (
    <div className="otp-touch-controls">
      {Array.from({ length: laneCount }).map((_, lane) => (
        <button
          key={lane}
          className="otp-touch-btn"
          style={{ background: laneColors[lane % laneColors.length] }}
          onPointerDown={(e) => {
            e.preventDefault();
            input.touchHit(lane);
          }}
        />
      ))}
    </div>
  );
}
