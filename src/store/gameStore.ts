import { create } from 'zustand';
import type { GameState } from '../types';
import { loadGameState, saveGameState, clearGameState } from '../utils/storage';

interface GameStore {
  state: GameState;
  init: (totalTasks: number) => void;
  start: () => void;
  completeTask: (index: number) => void;
  goToTask: (index: number) => void;
  reset: () => void;
}

function freshState(): GameState {
  return {
    currentTaskIndex: 0,
    completedTaskIndices: [],
    completed: false,
    startedAt: new Date().toISOString(),
    started: false,
  };
}

function migrateState(s: GameState): GameState {
  // Backwards compat: old saves only had currentTaskIndex, no completedTaskIndices
  if (!Array.isArray(s.completedTaskIndices)) {
    const completed = Array.from({ length: s.currentTaskIndex }, (_, i) => i);
    return { ...s, completedTaskIndices: completed };
  }
  return s;
}

export const useGameStore = create<GameStore>((set) => ({
  state: migrateState(loadGameState() ?? freshState()),

  init(totalTasks) {
    const existing = loadGameState();
    if (existing && existing.currentTaskIndex <= totalTasks) {
      set({ state: migrateState(existing) });
    } else {
      const s = freshState();
      saveGameState(s);
      set({ state: s });
    }
  },

  start() {
    set(prev => {
      const next: GameState = { ...prev.state, started: true };
      saveGameState(next);
      return { state: next };
    });
  },

  completeTask(index) {
    set(prev => {
      const completed = prev.state.completedTaskIndices.includes(index)
        ? prev.state.completedTaskIndices
        : [...prev.state.completedTaskIndices, index];
      const next: GameState = { ...prev.state, completedTaskIndices: completed };
      saveGameState(next);
      return { state: next };
    });
  },

  goToTask(index) {
    set(prev => {
      const next: GameState = { ...prev.state, currentTaskIndex: index };
      saveGameState(next);
      return { state: next };
    });
  },

  reset() {
    clearGameState();
    const s = freshState();
    saveGameState(s);
    set({ state: s });
  },
}));
