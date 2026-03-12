import { useState, useEffect, useRef } from 'react';

interface ComboCelebrationProps {
  onComplete: () => void;
}

export default function ComboCelebration({ onComplete }: ComboCelebrationProps) {
  const [phase, setPhase] = useState<'grow' | 'dust' | 'done'>('grow');
  const sound1Ref = useRef<HTMLAudioElement | null>(null);
  const sound2Ref = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Play combo sound 1 immediately
    const s1 = new Audio('/combosound1.mp3');
    sound1Ref.current = s1;
    s1.play().catch(() => {});

    // When sound 1 ends, play sound 2
    s1.addEventListener('ended', () => {
      const s2 = new Audio('/combosound2.mp3');
      sound2Ref.current = s2;
      s2.play().catch(() => {});
    });

    // After the grow animation (4s), start dust phase
    const dustTimer = setTimeout(() => {
      setPhase('dust');
    }, 4000);

    // After dust animation (1s more), we're done
    const doneTimer = setTimeout(() => {
      setPhase('done');
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(dustTimer);
      clearTimeout(doneTimer);
      s1.pause();
      sound1Ref.current = null;
      if (sound2Ref.current) {
        sound2Ref.current.pause();
        sound2Ref.current = null;
      }
    };
  }, [onComplete]);

  if (phase === 'done') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80">
      <video
        src="/combo.mp4"
        autoPlay
        loop
        muted
        playsInline
        className={`max-h-[80vh] max-w-[90vw] object-contain ${
          phase === 'grow' ? 'combo-grow' : 'combo-dust'
        }`}
      />
      <div className="absolute bottom-12 left-0 right-0 text-center">
        <p className="fire-text text-4xl tracking-wider">FULL COMBO!</p>
      </div>
    </div>
  );
}
