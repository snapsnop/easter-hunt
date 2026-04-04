import type { AdminConfig, GameState } from '../types';

const CONFIG_KEY = 'easter-hunt-config';
const GAME_KEY = 'easter-hunt-game';

function isValidConfig(obj: unknown): obj is AdminConfig {
  return (
    typeof obj === 'object' &&
    obj !== null &&
    'passwordHash' in obj &&
    typeof (obj as AdminConfig).passwordHash === 'string' &&
    (obj as AdminConfig).passwordHash.length > 0 &&
    Array.isArray((obj as AdminConfig).tasks)
  );
}

export async function loadConfig(): Promise<AdminConfig | null> {
  const stored = localStorage.getItem(CONFIG_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (isValidConfig(parsed)) return parsed;
    } catch { /* fall through */ }
  }
  try {
    const res = await fetch(import.meta.env.BASE_URL + 'tasks.json');
    if (res.ok) {
      const text = await res.text();
      if (!text.trim()) return null;
      const parsed = JSON.parse(text);
      if (isValidConfig(parsed)) {
        saveConfig(parsed);
        return parsed;
      }
    }
  } catch { /* no default config */ }
  return null;
}

export function saveConfig(config: AdminConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export function loadGameState(): GameState | null {
  const stored = localStorage.getItem(GAME_KEY);
  if (!stored) return null;
  try { return JSON.parse(stored); } catch { return null; }
}

export function saveGameState(state: GameState): void {
  localStorage.setItem(GAME_KEY, JSON.stringify(state));
}

export function clearGameState(): void {
  localStorage.removeItem(GAME_KEY);
}

export function exportConfig(config: AdminConfig, includeApiKey = true): void {
  const data = includeApiKey ? config : { ...config, geminiApiKey: undefined };
  const filename = includeApiKey ? 'easter-hunt-config.json' : 'tasks.json';
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function shareConfig(config: AdminConfig): Promise<'shared' | 'downloaded' | 'error'> {
  const data = { ...config, geminiApiKey: undefined };
  const json = JSON.stringify(data, null, 2);
  const file = new File([json], 'easter-hunt-config.json', { type: 'application/json' });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Påskerebus-konfig' });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'error';
    }
  }
  // Fallback to download
  exportConfig(config, false);
  return 'downloaded';
}
