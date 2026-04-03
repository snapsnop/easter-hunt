import { useEffect, useRef, useState } from 'react';

interface Props {
  pieces: string[];     // correct pieces in order (index = correct slot)
  onSolved: () => void;
}

function shuffle(arr: number[]): number[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  // Ensure at least one piece is out of place (avoid trivially solved start)
  if (a.every((v, i) => v === i) && a.length > 1) {
    [a[0], a[1]] = [a[1], a[0]];
  }
  return a;
}

export default function PuzzleSolve({ pieces, onSolved }: Props) {
  const n = pieces.length;
  const cols = Math.ceil(Math.sqrt(n));

  const [placement, setPlacement] = useState<number[]>(() =>
    shuffle(pieces.map((_, i) => i)),
  );
  const [dragging, setDragging] = useState<number | null>(null); // slot index
  const [dragPos, setDragPos] = useState({ x: 0, y: 0 });
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);

  const isSolved = placement.every((p, i) => p === i);

  useEffect(() => {
    if (isSolved) {
      const t = setTimeout(onSolved, 700);
      return () => clearTimeout(t);
    }
  }, [isSolved, onSolved]);

  function findSlotAt(x: number, y: number): number | null {
    for (let i = 0; i < slotRefs.current.length; i++) {
      const el = slotRefs.current[i];
      if (!el) continue;
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return i;
    }
    return null;
  }

  function handlePointerDown(e: React.PointerEvent<HTMLDivElement>, slotIdx: number) {
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(slotIdx);
    setDragPos({ x: e.clientX, y: e.clientY });
  }

  function handlePointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (dragging === null) return;
    setDragPos({ x: e.clientX, y: e.clientY });
  }

  function handlePointerUp(e: React.PointerEvent<HTMLDivElement>) {
    if (dragging === null) return;
    const target = findSlotAt(e.clientX, e.clientY);
    if (target !== null && target !== dragging) {
      setPlacement(prev => {
        const next = [...prev];
        [next[dragging], next[target]] = [next[target], next[dragging]];
        return next;
      });
    }
    setDragging(null);
  }

  const ghostPiece = dragging !== null ? pieces[placement[dragging]] : null;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-gray-500 text-center px-2">
        Dra brikkene til riktig sted for å avsløre gjemmestedet!
      </p>

      {/* Puzzle grid */}
      <div
        className="grid gap-1 touch-none select-none"
        style={{
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          width: 'min(90vmin, 360px)',
        }}
      >
        {placement.map((pieceIdx, slotIdx) => {
          const correct = pieceIdx === slotIdx;
          const isDragging = dragging === slotIdx;

          return (
            <div
              key={slotIdx}
              ref={el => { slotRefs.current[slotIdx] = el; }}
              className={`aspect-square rounded-lg overflow-hidden border-2 cursor-grab active:cursor-grabbing transition-all duration-150 ${
                correct
                  ? 'border-green-400 ring-2 ring-green-300'
                  : 'border-gray-200 hover:border-amber-300'
              } ${isDragging ? 'opacity-25 scale-95' : ''}`}
              style={{ touchAction: 'none' }}
              onPointerDown={e => handlePointerDown(e, slotIdx)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
            >
              <img
                src={pieces[pieceIdx]}
                alt={`Brikke ${slotIdx + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                draggable={false}
              />
            </div>
          );
        })}
      </div>

      {/* Progress hint */}
      <p className="text-xs text-gray-400">
        {placement.filter((p, i) => p === i).length} / {n} på riktig plass
      </p>

      {isSolved && (
        <p className="text-lg font-black text-green-600 animate-bounce">
          Puslespillet er løst! 🎉
        </p>
      )}

      {/* Drag ghost */}
      {ghostPiece && dragging !== null && (
        <div
          className="fixed pointer-events-none z-50 rounded-lg overflow-hidden shadow-2xl ring-2 ring-amber-400"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            width: 80,
            height: 80,
            transform: 'translate(-50%, -50%) scale(1.12)',
          }}
        >
          <img src={ghostPiece} alt="" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
