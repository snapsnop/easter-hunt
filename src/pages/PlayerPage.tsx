import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../store/adminStore';
import { useGameStore } from '../store/gameStore';
import TextTask from '../components/TextTask';
import MultipleChoiceTask from '../components/MultipleChoiceTask';
import LocationTask from '../components/LocationTask';
import PuzzleBoard from '../components/PuzzleBoard';
import PieceReveal from '../components/PieceReveal';

export default function PlayerPage() {
  const config = useAdminStore(s => s.config);
  const { state, init, start, advanceTask } = useGameStore();
  const navigate = useNavigate();
  const [revealPiece, setRevealPiece] = useState<string | null>(null);

  const tasks = (config?.tasks ?? []).slice().sort((a, b) => a.order - b.order);
  const revealOrder = config?.pieceRevealOrder;

  useEffect(() => {
    if (tasks.length > 0) init(tasks.length);
  }, [tasks.length, init]);

  // Navigate once modal is closed and all tasks are done
  useEffect(() => {
    if (!revealPiece && tasks.length > 0 && state.currentTaskIndex >= tasks.length) {
      navigate('/complete');
    }
  }, [state.currentTaskIndex, tasks.length, revealPiece, navigate]);

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

  // Show welcome screen if not yet started
  if (!state.started) {
    const hasWelcome = config.welcomeTitle || config.welcomeText || config.welcomeImage;
    return (
      <div className="min-h-screen bg-yellow-50 flex flex-col items-center justify-center p-6 text-center gap-6 max-w-lg mx-auto w-full">
        {config.welcomeImage && (
          <img
            src={config.welcomeImage}
            alt="Velkomstbilde"
            className="w-full rounded-3xl object-cover max-h-72 shadow-md"
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

  // Which slot-index is revealed for the current task
  const currentSlot = revealOrder?.[state.currentTaskIndex] ?? state.currentTaskIndex;
  const currentTask = tasks[state.currentTaskIndex];

  function handleCorrect() {
    const piece = config?.puzzlePieces?.[currentSlot];
    const isLast = state.currentTaskIndex >= tasks.length - 1;
    advanceTask();
    if (piece) {
      setRevealPiece(piece);
    } else if (isLast) {
      navigate('/complete');
    }
  }

  function handleRevealClose() {
    setRevealPiece(null);
    // Explicit navigate for Safari (in case effect doesn't fire)
    if (state.currentTaskIndex >= tasks.length) {
      navigate('/complete');
    }
  }

  // Build sparse display array: piece sits at its correct grid slot
  const unlockedSlots = new Set(
    (revealOrder ?? tasks.map((_, i) => i)).slice(0, state.currentTaskIndex)
  );
  const displayPieces = (config.puzzlePieces ?? []).map((p, i) =>
    unlockedSlots.has(i) ? p : ''
  );

  const progress = tasks.length > 0 ? state.currentTaskIndex / tasks.length : 0;

  return (
    // Always render the outer shell so PieceReveal can mount even after the last task
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      {currentTask && (
        <>
          <div className="bg-amber-400 px-4 py-3 flex items-center justify-between shadow">
            <h1 className="text-xl font-black text-white">🐣 Påskerebus</h1>
            <span className="text-amber-100 text-sm font-semibold">
              {state.currentTaskIndex + 1} / {tasks.length}
            </span>
          </div>

          <div className="h-2 bg-amber-100">
            <div
              className="h-2 bg-amber-400 transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>

          <div className="flex-1 p-4 flex flex-col gap-4 max-w-lg mx-auto w-full">
            <div className="bg-white rounded-3xl shadow-md p-5">
              <div className="text-xs font-black text-amber-400 uppercase tracking-widest mb-3">
                Oppgave {state.currentTaskIndex + 1}
              </div>
              {currentTask.type === 'text' ? (
                <TextTask task={currentTask} onCorrect={handleCorrect} />
              ) : currentTask.type === 'multiple-choice' ? (
                <MultipleChoiceTask task={currentTask} onCorrect={handleCorrect} />
              ) : (
                <LocationTask task={currentTask} apiKey={config.geminiApiKey} onCorrect={handleCorrect} />
              )}
            </div>

            {config.puzzlePieces && config.puzzlePieces.length > 0 && (
              <div className="bg-white rounded-3xl shadow-md p-4 flex justify-center">
                <PuzzleBoard pieces={displayPieces} total={tasks.length} compact />
              </div>
            )}
          </div>
        </>
      )}

      {/* Rendered outside the currentTask guard so it shows even after the last task */}
      {revealPiece && (
        <PieceReveal piece={revealPiece} onClose={handleRevealClose} />
      )}
    </div>
  );
}
