import { useEffect, useState } from 'react';
import type { Task } from '../types';
import { compareImages } from '../utils/imageComparison';
import CameraCapture from './CameraCapture';

interface Props {
  task: Task;
  apiKey?: string;
  onCorrect: () => void;
}

type Status = 'idle' | 'loading' | 'wrong' | 'error';

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export default function LocationTask({ task, apiKey, onCorrect }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [reason, setReason] = useState('');
  const [confirmMode, setConfirmMode] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    setPreview(null);
    setStatus('idle');
    setReason('');
    setConfirmMode(false);
    setWrongCount(0);
  }, [task.id]);

  function setPhoto(base64: string) {
    setPreview(base64);
    setStatus('idle');
    setReason('');
  }

  async function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) setPhoto(await readFile(file));
    e.target.value = '';
  }

  async function handleSubmit() {
    if (!preview || !task.referenceImage) return;

    if (!apiKey && !import.meta.env.VITE_GEMINI_API_KEY) {
      setConfirmMode(true);
      return;
    }

    setStatus('loading');
    try {
      const result = await compareImages(
        task.referenceImage,
        preview,
        apiKey,
        task.similarityThreshold,
      );
      if (result.match) {
        onCorrect();
      } else {
        setReason(result.reason);
        setStatus('wrong');
        setWrongCount(c => c + 1);
      }
    } catch (err) {
      setReason(err instanceof Error ? err.message : 'Ukjent feil');
      setStatus('error');
    }
  }

  function reset() {
    setPreview(null);
    setStatus('idle');
    setReason('');
    setConfirmMode(false);
  }

  // Confirm mode (no API key – side-by-side comparison)
  if (confirmMode) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-sm font-semibold text-gray-600 text-center">
          Er dette samme sted som referansebildet?
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-xs text-gray-400 mb-1 text-center">Referanse</p>
            <img src={task.referenceImage} alt="Referanse" className="rounded-xl w-full object-contain h-36" />
          </div>
          <div>
            <p className="text-xs text-gray-400 mb-1 text-center">Ditt bilde</p>
            <img src={preview!} alt="Ditt bilde" className="rounded-xl w-full object-contain h-36" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={reset} className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl">
            Nei, prøv igjen
          </button>
          <button onClick={onCorrect} className="flex-1 py-3 bg-amber-400 text-white font-black rounded-2xl">
            Ja! ✓
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {task.questionImage && (
        <img src={task.questionImage} alt="Oppgavebilde" className="rounded-2xl w-full object-contain max-h-48" />
      )}
      {task.referenceImage && (
        <div>
          <p className="text-xs font-bold text-gray-500 mb-1">📍 Finn dette stedet:</p>
          <img src={task.referenceImage} alt="Lokasjon" className="rounded-2xl w-full object-contain max-h-64" />
        </div>
      )}
      <p className="text-lg font-semibold text-gray-800">{task.question}</p>

      {preview ? (
        <div className="flex flex-col gap-3">
          <img src={preview} alt="Ditt bilde" className="rounded-2xl w-full object-contain max-h-48" />
          {status === 'wrong' && (
            <p className="text-red-500 text-sm font-semibold text-center">
              Ikke riktig sted. {reason}
            </p>
          )}
          {status === 'error' && (
            <p className="text-orange-500 text-sm text-center">{reason}</p>
          )}
          {wrongCount >= 3 && task.hint && (
            <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3 text-amber-700 text-sm">
              💡 <span className="font-semibold">Hint:</span> {task.hint}
            </div>
          )}
          <div className="flex gap-2">
            <button
              onClick={reset}
              className="flex-1 py-3 border-2 border-amber-300 text-amber-700 font-bold rounded-2xl text-sm"
            >
              Nytt bilde
            </button>
            <button
              onClick={handleSubmit}
              disabled={status === 'loading'}
              className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-black rounded-2xl text-sm transition-colors"
            >
              {status === 'loading' ? 'Sjekker...' : 'Send inn ✓'}
            </button>
          </div>
        </div>
      ) : (
        /* Photo picker */
        <div className="flex gap-2">
          <button
            onClick={() => setShowCamera(true)}
            className="flex-1 py-5 border-2 border-dashed border-amber-300 rounded-2xl text-amber-600 font-bold hover:bg-amber-50 transition-colors"
          >
            📷 Kamera
          </button>
          <label className="flex-1 py-5 border-2 border-dashed border-amber-300 rounded-2xl text-amber-600 font-bold hover:bg-amber-50 transition-colors text-center cursor-pointer">
            📁 Fil
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={base64 => { setPhoto(base64); setShowCamera(false); }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
