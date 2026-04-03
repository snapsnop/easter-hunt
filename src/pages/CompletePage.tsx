import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAdminStore } from '../store/adminStore';
import { useGameStore } from '../store/gameStore';
import PuzzleSolve from '../components/PuzzleSolve';

export default function CompletePage() {
  const { reset } = useGameStore();
  const config = useAdminStore(s => s.config);
  const navigate = useNavigate();

  const pieces = config?.puzzlePieces ?? [];
  const hasPuzzle = pieces.length > 1;

  const [puzzleSolved, setPuzzleSolved] = useState(!hasPuzzle);

  useEffect(() => {
    if (puzzleSolved) {
      const end = Date.now() + 5000;
      function frame() {
        confetti({ particleCount: 3, angle: 60, spread: 55, origin: { x: 0 } });
        confetti({ particleCount: 3, angle: 120, spread: 55, origin: { x: 1 } });
        if (Date.now() < end) requestAnimationFrame(frame);
      }
      frame();
    }
  }, [puzzleSolved]);

  if (!puzzleSolved) {
    return (
      <div className="min-h-screen bg-yellow-50 flex flex-col">
        <div className="bg-amber-400 px-4 py-3 shadow">
          <h1 className="text-xl font-black text-white text-center">🎊 Alle oppgaver løst!</h1>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 gap-2">
          <PuzzleSolve pieces={pieces} onSolved={() => setPuzzleSolved(true)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-6 text-center gap-4">
      <div className="text-6xl">🎉</div>
      <h1 className="text-4xl font-black text-amber-600">Gratulerer!</h1>
      <p className="text-gray-600 max-w-xs">
        Puslespillet er løst! Bildet viser deg hvor påskeegget er gjemt!
      </p>

      {config?.solutionImage ? (
        <img
          src={config.solutionImage}
          alt="Løsning"
          className="rounded-3xl shadow-xl max-w-sm w-full object-cover"
        />
      ) : pieces.length > 0 ? (
        <div className="grid gap-0.5" style={{
          gridTemplateColumns: `repeat(${Math.ceil(Math.sqrt(pieces.length))}, 1fr)`,
          maxWidth: 320,
        }}>
          {pieces.map((p, i) => (
            <img key={i} src={p} alt="" className="w-full aspect-square object-cover" />
          ))}
        </div>
      ) : null}

      <p className="text-2xl">🥚</p>

      <button
        onClick={() => { reset(); navigate('/'); }}
        className="px-8 py-3 bg-amber-400 hover:bg-amber-500 text-white font-black rounded-2xl transition-colors text-lg"
      >
        Spill igjen
      </button>
    </div>
  );
}
