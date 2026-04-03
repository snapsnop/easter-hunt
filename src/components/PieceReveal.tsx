import { useEffect } from 'react';
import confetti from 'canvas-confetti';

interface Props {
  piece: string;
  onClose: () => void;
}

export default function PieceReveal({ piece, onClose }: Props) {
  useEffect(() => {
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.55 } });
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-6 flex flex-col items-center gap-4 max-w-xs w-full">
        <div className="text-5xl">🥚</div>
        <h2 className="text-2xl font-black text-amber-600">Riktig svar!</h2>
        <p className="text-gray-500 text-sm text-center">Du fikk en ny puslespillbrikke!</p>
        <img
          src={piece}
          alt="Ny brikke"
          className="w-36 h-36 object-cover rounded-xl border-4 border-amber-400 shadow-lg"
        />
        <button
          onClick={onClose}
          className="w-full py-3 bg-amber-400 hover:bg-amber-500 text-white font-black rounded-2xl transition-colors text-lg"
        >
          Neste oppgave →
        </button>
      </div>
    </div>
  );
}
