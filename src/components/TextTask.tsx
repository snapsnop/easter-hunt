import { useEffect, useState } from 'react';
import type { Task } from '../types';

interface Props {
  task: Task;
  onCorrect: () => void;
}

function checkAnswer(input: string, answer: string): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  const given = normalize(input);
  return answer.split(',').map(a => normalize(a)).some(a => a === given);
}

export default function TextTask({ task, onCorrect }: Props) {
  const [input, setInput] = useState('');
  const [wrong, setWrong] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    setInput('');
    setWrong(false);
    setWrongCount(0);
  }, [task.id]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (task.answer && checkAnswer(input, task.answer)) {
      onCorrect();
    } else {
      setWrong(true);
      setWrongCount(c => c + 1);
      setTimeout(() => setWrong(false), 1500);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {task.questionImage && (
        <img
          src={task.questionImage}
          alt="Oppgavebilde"
          className="rounded-2xl max-w-full max-h-96 w-auto h-auto mx-auto block"
        />
      )}
      <p className="text-lg font-semibold text-gray-800">{task.question}</p>
      <input
        type="text"
        value={input}
        onChange={e => { setInput(e.target.value); setWrong(false); }}
        placeholder="Skriv svaret ditt her..."
        className={`border-2 rounded-2xl px-4 py-3 text-gray-800 outline-none transition-colors ${
          wrong ? 'border-red-400 bg-red-50' : 'border-amber-200 focus:border-amber-400'
        }`}
      />
      {wrong && (
        <p className="text-red-500 text-sm font-semibold text-center">
          Feil svar – prøv igjen! 🙈
        </p>
      )}
      {wrongCount >= 3 && task.hint && (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl px-4 py-3 text-amber-700 text-sm">
          💡 <span className="font-semibold">Hint:</span> {task.hint}
        </div>
      )}
      <button
        type="submit"
        disabled={!input.trim()}
        className="py-3 bg-amber-400 hover:bg-amber-500 disabled:bg-gray-100 disabled:text-gray-400 text-white font-black rounded-2xl transition-colors"
      >
        Sjekk svar ✓
      </button>
    </form>
  );
}
