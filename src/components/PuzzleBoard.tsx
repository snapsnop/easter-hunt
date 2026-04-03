interface Props {
  pieces: string[];
  total: number;
  compact?: boolean;
}

export default function PuzzleBoard({ pieces, total, compact = false }: Props) {
  const cols = Math.ceil(Math.sqrt(total));
  const size = compact ? 'w-10 h-10' : 'w-20 h-20';

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">
        {pieces.filter(Boolean).length} / {total} brikker
      </p>
      <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: total }).map((_, i) => {
          const piece = pieces[i];
          return piece ? (
            <img
              key={i}
              src={piece}
              alt={`Brikke ${i + 1}`}
              className={`${size} object-cover rounded border-2 border-amber-400 shadow-sm`}
            />
          ) : (
            <div
              key={i}
              className={`${size} rounded border-2 border-dashed border-amber-200 bg-amber-50 flex items-center justify-center text-amber-300 text-lg`}
            >
              ?
            </div>
          );
        })}
      </div>
    </div>
  );
}
