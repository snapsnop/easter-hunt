import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import { useGameStore } from '../store/gameStore';
import TextTask from '../components/TextTask';
import MultipleChoiceTask from '../components/MultipleChoiceTask';
import LocationTask from '../components/LocationTask';
import PuzzleBoard from '../components/PuzzleBoard';
import PieceReveal from '../components/PieceReveal';

function nextUnanswered(current: number, total: number, completed: number[]): number | null {
  for (let offset = 1; offset < total; offset++) {
    const idx = (current + offset) % total;
    if (!completed.includes(idx)) return idx;
  }
  return null;
}

export default function PlayerPage() {
  const config = useAdminStore(s => s.config);
  const { state, init, start, completeTask, goToTask } = useGameStore();
  const navigate = useNavigate();
  const [revealPiece, setRevealPiece] = useState<string | null>(null);

  const tasks = (config?.tasks ?? []).slice().sort((a, b) => a.order - b.order);
  const revealOrder = config?.pieceRevealOrder;
  const completed = state.completedTaskIndices ?? [];
  const allDone = tasks.length > 0 && completed.length >= tasks.length;

  useEffect(() => {
    if (tasks.length > 0) init(tasks.length);
  }, [tasks.length, init]);

  // Navigate when all tasks are completed and no modal is open
  useEffect(() => {
    if (!revealPiece && allDone) {
      navigate('/complete');
    }
  }, [allDone, revealPiece, navigate]);

  if (!config || tasks.length === 0) {
    return (
      <div className="min-h-screen bg-easter-yellow flex flex-col items-center justify-center p-6 text-center gap-4">
        <div className="text-7xl">🐣</div>
        <h1 className="text-3xl font-black text-amber-700">Påskerebus</h1>
        <p className="text-amber-600">Ingen oppgaver er lagt inn ennå.</p>
        <a href="#/admin" className="mt-2 px-5 py-2 bg-amber-400 text-white font-bold rounded-2xl hover:bg-amber-500 transition-colors">
          Gå til admin →
        </a>
      </div>
    );
  }

  // Welcome screen
  if (!state.started) {
    const hasWelcome = config.welcomeTitle || config.welcomeText || config.welcomeImage;
    return (
      <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-6 text-center gap-6 max-w-lg mx-auto w-full">
        {config.welcomeImage && (
          <img
            src={config.welcomeImage}
            alt="Velkomstbilde"
            className="w-full rounded-3xl object-contain max-h-72 shadow-md"
          />
        )}
        <div className="flex flex-col gap-3">
          <div className="text-6xl">{hasWelcome ? '🐰' : '🐣'}</div>
          <h1 className="text-3xl font-black text-amber-700">
            {config.welcomeTitle || 'Påskerebus'}
          </h1>
          {config.welcomeText && (
            <p className="text-amber-700 text-base whitespace-pre-wrap">{config.welcomeText}</p>
          )}
          {!hasWelcome && (
            <p className="text-amber-600">{tasks.length} oppgaver venter på deg!</p>
          )}
        </div>
        <button
          onClick={start}
          className="px-8 py-4 bg-amber-400 hover:bg-amber-500 text-white font-black text-lg rounded-2xl shadow transition-colors"
        >
          Start rebusen! 🐣
        </button>
      </div>
    );
  }

  const currentTaskIndex = state.currentTaskIndex;
  const currentTask = tasks[currentTaskIndex];
  const currentSlot = revealOrder?.[currentTaskIndex] ?? currentTaskIndex;
  const skippedCount = tasks.length - completed.length;
  const next = nextUnanswered(currentTaskIndex, tasks.length, completed);

  function handleCorrect() {
    const piece = config?.puzzlePieces?.[currentSlot];
    completeTask(currentTaskIndex);
    // Navigate to next unanswered after reveal closes (or immediately if no piece)
    const nextIdx = nextUnanswered(currentTaskIndex, tasks.length, [...completed, currentTaskIndex]);
    if (piece) {
      setRevealPiece(piece);
      if (nextIdx !== null) goToTask(nextIdx);
    } else if (nextIdx !== null) {
      goToTask(nextIdx);
    }
    // If nextIdx is null, allDone will trigger navigate('/complete') via effect
  }

  function handleRevealClose() {
    setRevealPiece(null);
  }

  function handleSkip() {
    if (next !== null) goToTask(next);
  }

  // Build unlocked slots from completed indices
  const unlockedSlots = new Set(
    completed.map(i => revealOrder?.[i] ?? i)
  );
  const displayPieces = (config.puzzlePieces ?? []).map((p, i) =>
    unlockedSlots.has(i) ? p : ''
  );

  const progress = tasks.length > 0 ? completed.length / tasks.length : 0;

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      {currentTask && (
        <>
          <div className="bg-amber-400 px-4 py-3 flex items-center justify-between shadow">
            <h1 className="text-xl font-black text-white">🐣 Påskerebus</h1>
            <span className="text-amber-100 text-sm font-semibold">
              {completed.length} / {tasks.length} løst
            </span>
          </div>

          <div className="h-2 bg-amber-100">
            <div
              className="h-2 bg-amber-400 transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          {/* Task navigation row */}
          <div className="bg-white border-b border-amber-100 px-4 py-2 flex gap-1.5 justify-center flex-wrap">
            {tasks.map((_, i) => {
              const isDone = completed.includes(i);
              const isCurrent = i === currentTaskIndex;
              return (
                <button
                  key={i}
                  onClick={() => !isDone && goToTask(i)}
                  disabled={isDone}
                  className={`w-8 h-8 rounded-full text-xs font-black transition-colors ${
                    isDone
                      ? 'bg-green-400 text-white cursor-default'
                      : isCurrent
                      ? 'bg-amber-400 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-amber-100'
                  }`}
                >
                  {isDone ? '✓' : i + 1}
                </button>
              );
            })}
          </div>

          <div className="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
            <div className="bg-white rounded-3xl shadow-md p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-black text-amber-400 uppercase tracking-widest">
                  Oppgave {currentTaskIndex + 1}
                </div>
                {next !== null && (
                  <button
                    onClick={handleSkip}
                    className="text-xs text-gray-400 hover:text-amber-500 font-semibold"
                  >
                    Hopp over →
                  </button>
                )}
              </div>
              {currentTask.type === 'text' ? (
                <TextTask task={currentTask} onCorrect={handleCorrect} />
              ) : currentTask.type === 'multiple-choice' ? (
                <MultipleChoiceTask task={currentTask} onCorrect={handleCorrect} />
              ) : (
                <LocationTask task={currentTask} apiKey={config.geminiApiKey} onCorrect={handleCorrect} />
              )}
            </div>

            {skippedCount > 0 && completed.length > 0 && (
              <p className="text-center text-xs text-amber-600 font-semibold">
                {skippedCount} ubesvart{skippedCount !== 1 ? 'e' : ''} oppgave{skippedCount !== 1 ? 'r' : ''} gjenstår
              </p>
            )}

            {config.puzzlePieces && config.puzzlePieces.length > 0 && (
              <div className="bg-white rounded-3xl shadow-md p-4 flex justify-center">
                <PuzzleBoard pieces={displayPieces} total={tasks.length} compact />
              </div>
            )}
          </div>
        </>
      )}

      {revealPiece && (
        <PieceReveal
          piece={revealPiece}
          onClose={handleRevealClose}
        />
      )}
    </div>
  );
}
