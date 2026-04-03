import { create } from 'zustand';
import type { GameState } from '../types';
import { loadGameState, saveGameState, clearGameState } from '../utils/storage';

interface GameStore {
  state: GameState;
  init: (totalTasks: number) => void;
  start: () => void;
  advanceTask: () => void;
  reset: () => void;
}

function freshState(): GameState {
  return {
    currentTaskIndex: 0,
    completed: false,
    startedAt: new Date().toISOString(),
    started: false,
  };
}

export const useGameStore = create<GameStore>((set) => ({
  state: loadGameState() ?? freshState(),

  init(totalTasks) {
    const existing = loadGameState();
    if (existing && existing.currentTaskIndex <= totalTasks) {
      set({ state: existing });
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

  advanceTask() {
    set(prev => {
      const next: GameState = {
        ...prev.state,
        currentTaskIndex: prev.state.currentTaskIndex + 1,
      };
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
