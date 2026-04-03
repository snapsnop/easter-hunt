import { useState } from 'react';
import type { Task } from '../types';
import { useAdminStore } from '../store/adminStore';
import AdminTaskForm from './AdminTaskForm';

interface Props {
  tasks: Task[];
}

export default function AdminTaskList({ tasks }: Props) {
  const { addTask, updateTask, deleteTask, reorderTasks } = useAdminStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);

  const sorted = [...tasks].sort((a, b) => a.order - b.order);

  function moveUp(index: number) {
    if (index === 0) return;
    const next = [...sorted];
    [next[index - 1], next[index]] = [next[index], next[index - 1]];
    reorderTasks(next);
  }

  function moveDown(index: number) {
    if (index === sorted.length - 1) return;
    const next = [...sorted];
    [next[index], next[index + 1]] = [next[index + 1], next[index]];
    reorderTasks(next);
  }

  return (
    <div className="flex flex-col gap-3">
      {sorted.length === 0 && !adding && (
        <p className="text-gray-400 text-sm text-center py-4">
          Ingen oppgaver ennå. Legg til den første!
        </p>
      )}

      {sorted.map((task, i) =>
        editingId === task.id ? (
          <div key={task.id} className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
            <h3 className="font-black text-amber-700 mb-3">Rediger oppgave {i + 1}</h3>
            <AdminTaskForm
              task={task}
              onSave={data => { updateTask({ ...task, ...data }); setEditingId(null); }}
              onCancel={() => setEditingId(null)}
            />
          </div>
        ) : (
          <div key={task.id} className="bg-white border border-gray-100 rounded-2xl p-3 shadow-sm flex gap-3 items-start">
            {/* Move buttons */}
            <div className="flex flex-col gap-1 flex-shrink-0 mt-1">
              <button
                onClick={() => moveUp(i)}
                disabled={i === 0}
                className="w-7 h-7 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-30 font-bold"
              >
                ↑
              </button>
              <button
                onClick={() => moveDown(i)}
                disabled={i === sorted.length - 1}
                className="w-7 h-7 text-xs bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-30 font-bold"
              >
                ↓
              </button>
            </div>

            {/* Task type icon */}
            <div className="w-12 h-12 rounded-lg border-2 border-amber-100 bg-amber-50 flex-shrink-0 flex items-center justify-center text-2xl">
              {task.type === 'text' ? '📝' : '📍'}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold">
                  {i + 1}
                </span>
                <span className="text-xs text-gray-400">
                  {task.type === 'text' ? '📝 Tekst' : '📍 Lokasjon'}
                </span>
              </div>
              <p className="text-sm text-gray-700 line-clamp-2">{task.question}</p>
              {task.type === 'text' && task.answer && (
                <p className="text-xs text-gray-400 mt-0.5 truncate">Fasit: {task.answer}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-1 flex-shrink-0">
              <button
                onClick={() => setEditingId(task.id)}
                className="px-3 py-1 text-xs bg-amber-100 text-amber-700 font-bold rounded-lg hover:bg-amber-200 transition-colors"
              >
                Rediger
              </button>
              <button
                onClick={() => { if (confirm(`Slett oppgave ${i + 1}?`)) deleteTask(task.id); }}
                className="px-3 py-1 text-xs bg-red-100 text-red-600 font-bold rounded-lg hover:bg-red-200 transition-colors"
              >
                Slett
              </button>
            </div>
          </div>
        )
      )}

      {adding ? (
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
          <h3 className="font-black text-amber-700 mb-3">Ny oppgave</h3>
          <AdminTaskForm
            onSave={data => { addTask(data); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="py-4 border-2 border-dashed border-amber-300 rounded-2xl text-amber-600 font-bold hover:bg-amber-50 transition-colors"
        >
          + Legg til oppgave
        </button>
      )}
    </div>
  );
}
