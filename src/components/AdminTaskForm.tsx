import { useRef, useState } from 'react';
import type { Task, TaskType } from '../types';
import CameraCapture from './CameraCapture';

type NewTask = Omit<Task, 'id' | 'order'>;

interface Props {
  task?: Task;
  onSave: (task: NewTask) => void;
  onCancel: () => void;
}

export default function AdminTaskForm({ task, onSave, onCancel }: Props) {
  const [type, setType] = useState<TaskType>(task?.type ?? 'text');
  const [question, setQuestion] = useState(task?.question ?? '');
  const [answer, setAnswer] = useState(task?.answer ?? '');
  const [choices, setChoices] = useState<string[]>(task?.choices ?? ['', '', '', '']);
  const [questionImage, setQuestionImage] = useState<string | undefined>(task?.questionImage);
  const [referenceImage, setReferenceImage] = useState<string | undefined>(task?.referenceImage);
  const [threshold, setThreshold] = useState(task?.similarityThreshold ?? 0.7);
  const [hint, setHint] = useState(task?.hint ?? '');

  function handleSave() {
    if (!question.trim()) return;
    const filledChoices = choices.map(c => c.trim()).filter(Boolean);
    onSave({
      type,
      question: question.trim(),
      answer: type === 'text' ? answer.trim() || undefined
            : type === 'multiple-choice' ? answer.trim() || undefined
            : undefined,
      choices: type === 'multiple-choice' ? filledChoices : undefined,
      hint: hint.trim() || undefined,
      questionImage,
      referenceImage: type === 'location' ? referenceImage : undefined,
      similarityThreshold: type === 'location' ? threshold : undefined,
    });
  }

  const filledChoices = choices.map(c => c.trim()).filter(Boolean);
  const canSave =
    question.trim() &&
    (type === 'text' ? answer.trim()
     : type === 'multiple-choice' ? filledChoices.length >= 2 && answer.trim()
     : referenceImage);

  return (
    <div className="flex flex-col gap-4">
      {/* Type */}
      <div className="flex gap-2">
        {(['text', 'multiple-choice', 'location'] as TaskType[]).map(t => (
          <button
            key={t}
            type="button"
            onClick={() => setType(t)}
            className={`flex-1 py-2 rounded-xl font-semibold text-xs transition-colors ${
              type === t ? 'bg-amber-400 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {t === 'text' ? '📝 Tekst' : t === 'multiple-choice' ? '☑ Flervalg' : '📍 Lokasjon'}
          </button>
        ))}
      </div>

      {/* Question */}
      <div>
        <label className="text-sm font-semibold text-gray-600 block mb-1">Spørsmål / beskrivelse *</label>
        <textarea
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={3}
          placeholder="Skriv oppgaveteksten her..."
          className="w-full border-2 border-amber-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none"
        />
      </div>

      {/* Optional question image */}
      <ImageUpload
        label="Bilde til oppgaven (valgfritt)"
        value={questionImage}
        onClear={() => setQuestionImage(undefined)}
        onCapture={setQuestionImage}
      />

      {/* Text task: answer */}
      {type === 'text' && (
        <div>
          <label className="text-sm font-semibold text-gray-600 block mb-1">
            Fasit * <span className="font-normal text-gray-400">(kommaseparer for alternativ)</span>
          </label>
          <input
            type="text"
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="f.eks. fjøset, Fjøset, FJØSET"
            className="w-full border-2 border-amber-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400"
          />
        </div>
      )}

      {/* Multiple choice: options + correct answer */}
      {type === 'multiple-choice' && (
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-gray-600">
            Svaralternativer * <span className="font-normal text-gray-400">(minst 2)</span>
          </label>
          {choices.map((c, i) => (
            <input
              key={i}
              type="text"
              value={c}
              onChange={e => {
                const next = [...choices];
                next[i] = e.target.value;
                setChoices(next);
              }}
              placeholder={`Alternativ ${i + 1}${i < 2 ? ' *' : ' (valgfritt)'}`}
              className="w-full border-2 border-amber-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400"
            />
          ))}
          <div className="mt-1">
            <label className="text-sm font-semibold text-gray-600 block mb-1">
              Riktig svar * <span className="font-normal text-gray-400">(skriv nøyaktig som alternativet over)</span>
            </label>
            <select
              value={answer}
              onChange={e => setAnswer(e.target.value)}
              className="w-full border-2 border-amber-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white"
            >
              <option value="">Velg riktig svar...</option>
              {choices.filter(c => c.trim()).map((c, i) => (
                <option key={i} value={c.trim()}>{c.trim()}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Location task: reference image + threshold */}
      {type === 'location' && (
        <>
          <ImageUpload
            label="Referansebilde – stedet spilleren skal finne *"
            value={referenceImage}
            onClear={() => setReferenceImage(undefined)}
            onCapture={setReferenceImage}
          />
          <div>
            <label className="text-sm font-semibold text-gray-600 block mb-1">
              Godkjenningsterskel: {Math.round(threshold * 100)}%
            </label>
            <input
              type="range"
              min={0.3}
              max={1}
              step={0.05}
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-full accent-amber-400"
            />
            <div className="flex justify-between text-xs text-gray-400 mt-0.5">
              <span>Lav (30%)</span>
              <span>Høy (100%)</span>
            </div>
          </div>
        </>
      )}

      {/* Hint */}
      <div>
        <label className="text-sm font-semibold text-gray-600 block mb-1">
          Hint <span className="font-normal text-gray-400">(vises etter 3 feil forsøk, valgfritt)</span>
        </label>
        <input
          type="text"
          value={hint}
          onChange={e => setHint(e.target.value)}
          placeholder="F.eks. Se etter noe rødt ved inngangen..."
          className="w-full border-2 border-amber-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50"
        >
          Avbryt
        </button>
        <button
          type="button"
          onClick={handleSave}
          disabled={!canSave}
          className="flex-1 py-3 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-black rounded-2xl transition-colors"
        >
          {task ? 'Lagre' : 'Legg til'}
        </button>
      </div>
    </div>
  );
}

// ─── Reusable image upload with camera + file ─────────────────────────────────

interface ImageUploadProps {
  label: string;
  value: string | undefined;
  onClear: () => void;
  onCapture: (base64: string) => void;
}

function readFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export function ImageUpload({ label, value, onClear, onCapture }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [showCamera, setShowCamera] = useState(false);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onCapture(await readFile(file));
    e.target.value = '';
  }

  return (
    <div>
      {label && <label className="text-sm font-semibold text-gray-600 block mb-1">{label}</label>}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

      {value ? (
        <div className="relative group">
          <img src={value} alt={label} className="rounded-xl w-full object-contain max-h-40" />
          <button
            type="button"
            onClick={onClear}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
          >
            ✕
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowCamera(true)}
            className="flex-1 py-3 border-2 border-dashed border-amber-200 rounded-xl text-amber-500 text-sm font-semibold hover:bg-amber-50 transition-colors"
          >
            📷 Kamera
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 py-3 border-2 border-dashed border-amber-200 rounded-xl text-amber-500 text-sm font-semibold hover:bg-amber-50 transition-colors"
          >
            📁 Fil
          </button>
        </div>
      )}

      {showCamera && (
        <CameraCapture
          onCapture={base64 => { onCapture(base64); setShowCamera(false); }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
}
