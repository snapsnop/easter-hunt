import { useEffect, useState } from 'react';
import type { Task } from '../types';

interface Props {
  task: Task;
  onCorrect: () => void;
}

export default function MultipleChoiceTask({ task, onCorrect }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [wrong, setWrong] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);

  useEffect(() => {
    setSelected(null);
    setWrong(false);
    setWrongCount(0);
  }, [task.id]);

  const choices = task.choices ?? [];

  function handleSelect(choice: string) {
    setSelected(choice);
    setWrong(false);
    if (choice === task.answer) {
      onCorrect();
    } else {
      setWrong(true);
      setWrongCount(c => c + 1);
      setTimeout(() => setWrong(false), 1500);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {task.questionImage && (
        <img
          src={task.questionImage}
          alt="Oppgavebilde"
          className="rounded-2xl max-w-full max-h-96 w-auto h-auto mx-auto block"
        />
      )}
      <p className="text-lg font-semibold text-gray-800">{task.question}</p>

      <div className="flex flex-col gap-2">
        {choices.map((choice, i) => {
          const isWrong = wrong && selected === choice;
          return (
            <button
              key={i}
              onClick={() => handleSelect(choice)}
              className={`w-full py-3 px-4 rounded-2xl font-semibold text-left border-2 transition-colors ${
                isWrong
                  ? 'border-red-400 bg-red-50 text-red-700'
                  : 'border-amber-200 bg-white hover:bg-amber-50 text-gray-800'
              }`}
            >
              {choice}
            </button>
          );
        })}
      </div>

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
    </div>
  );
}
