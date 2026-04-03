import { useState } from 'react';
import { useAdminStore } from '../store/adminStore';
import { useGameStore } from '../store/gameStore';
import { exportConfig, saveConfig } from '../utils/storage';
import AdminTaskList from '../components/AdminTaskList';
import PuzzleBoard from '../components/PuzzleBoard';
import { ImageUpload } from '../components/AdminTaskForm';

export default function AdminPage() {
  const { config, isAuthenticated, authenticate, initWithPassword } = useAdminStore();

  if (!config) return <SetupView onSetup={initWithPassword} />;
  if (!isAuthenticated) return <LoginView onLogin={authenticate} />;
  return <AdminPanel />;
}

// ─── Setup (first run) ───────────────────────────────────────────────────────

interface SetupViewProps {
  onSetup: (password: string, apiKey?: string) => Promise<void>;
}

function SetupView({ onSetup }: SetupViewProps) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 4) { setError('Passordet må være minst 4 tegn'); return; }
    if (password !== confirm) { setError('Passordene er ikke like'); return; }
    await onSetup(password, apiKey || undefined);
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <div className="text-5xl mb-2">🐰</div>
          <h1 className="text-2xl font-black text-amber-600">Påskerebus-admin</h1>
          <p className="text-sm text-gray-400 mt-1">Første gangs oppsett</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Velg adminpassord"
            autoFocus
            className="border-2 border-amber-200 rounded-2xl px-4 py-3 outline-none focus:border-amber-400"
          />
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            placeholder="Bekreft passord"
            className="border-2 border-amber-200 rounded-2xl px-4 py-3 outline-none focus:border-amber-400"
          />
          {import.meta.env.VITE_GEMINI_API_KEY ? (
            <p className="text-xs text-green-600 font-semibold text-center">
              ✓ Gemini API-nøkkel er satt via miljøvariabel.
            </p>
          ) : (
            <input
              type="password"
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="Gemini API-nøkkel (valgfritt)"
              className="border-2 border-amber-200 rounded-2xl px-4 py-3 outline-none focus:border-amber-400 font-mono text-sm"
            />
          )}
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button
            type="submit"
            disabled={!password || !confirm}
            className="py-3 bg-amber-400 disabled:bg-gray-100 disabled:text-gray-400 text-white font-black rounded-2xl"
          >
            Opprett admin
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Login ───────────────────────────────────────────────────────────────────

interface LoginViewProps {
  onLogin: (pw: string) => Promise<boolean>;
}

function LoginView({ onLogin }: LoginViewProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await onLogin(password);
    if (!ok) {
      setError(true);
      setPassword('');
      setTimeout(() => setError(false), 2500);
    }
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-3xl shadow-lg p-6 w-full max-w-sm flex flex-col gap-4">
        <div className="text-center">
          <div className="text-5xl mb-2">🔐</div>
          <h1 className="text-2xl font-black text-amber-600">Admin-innlogging</h1>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Adminpassord"
            autoFocus
            className={`border-2 rounded-2xl px-4 py-3 outline-none transition-colors ${
              error ? 'border-red-400 bg-red-50' : 'border-amber-200 focus:border-amber-400'
            }`}
          />
          {error && <p className="text-red-500 text-sm text-center">Feil passord</p>}
          <button type="submit" disabled={!password} className="py-3 bg-amber-400 disabled:bg-gray-100 disabled:text-gray-400 text-white font-black rounded-2xl">
            Logg inn
          </button>
        </form>
        <a href="#/" className="text-center text-sm text-amber-500 hover:underline">
          ← Tilbake til spillet
        </a>
      </div>
    </div>
  );
}

// ─── Admin panel ─────────────────────────────────────────────────────────────

type Tab = 'tasks' | 'puzzle' | 'welcome' | 'settings';

function AdminPanel() {
  const { config, logout, setApiKey, changePassword, setSolutionImage, setWelcome } = useAdminStore();
  const { reset } = useGameStore();
  const [tab, setTab] = useState<Tab>('tasks');
  const [apiKeyInput, setApiKeyInput] = useState(config?.geminiApiKey ?? '');
  const [newPw, setNewPw] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [splitting, setSplitting] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [welcomeTitle, setWelcomeTitle] = useState(config?.welcomeTitle ?? '');
  const [welcomeText, setWelcomeText] = useState(config?.welcomeText ?? '');
  const [welcomeImage, setWelcomeImage] = useState<string | undefined>(config?.welcomeImage);

  if (!config) return null;

  const tasks = [...config.tasks].sort((a, b) => a.order - b.order);

  function flash(msg: string) {
    setSaved(msg);
    setTimeout(() => setSaved(null), 2000);
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = JSON.parse(reader.result as string);
        saveConfig(imported);
        window.location.reload();
      } catch {
        alert('Ugyldig konfigurasjonsfil');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  }

  async function handleSolutionCapture(base64: string) {
    setSplitting(true);
    try {
      await setSolutionImage(base64);
      flash('Løsningsbilde lastet opp og delt');
    } catch (err) {
      flash('Feil ved oppdeling av bilde – prøv igjen');
      console.error(err);
    } finally {
      setSplitting(false);
    }
  }

  async function handleSavePassword() {
    if (!newPw) return;
    await changePassword(newPw);
    setNewPw('');
    flash('Passord endret');
  }

  return (
    <div className="min-h-screen bg-yellow-50 flex flex-col">
      {/* Header */}
      <div className="bg-amber-400 px-4 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-3">
          <a href="#/" className="text-amber-100 text-sm hover:text-white">← Spill</a>
          <h1 className="text-lg font-black text-white">Admin</h1>
        </div>
        <button onClick={logout} className="text-amber-100 text-sm font-semibold hover:text-white">
          Logg ut
        </button>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-amber-100">
        {(['tasks', 'puzzle', 'welcome', 'settings'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-xs font-bold transition-colors ${
              tab === t
                ? 'text-amber-600 border-b-2 border-amber-400'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {t === 'tasks' ? 'Oppgaver' : t === 'puzzle' ? 'Puslespill' : t === 'welcome' ? 'Velkomst' : 'Innstillinger'}
          </button>
        ))}
      </div>

      <div className="flex-1 p-4 max-w-lg mx-auto w-full">
        {/* Tasks tab */}
        {tab === 'tasks' && <AdminTaskList tasks={tasks} />}

        {/* Puzzle tab */}
        {tab === 'puzzle' && (
          <div className="flex flex-col gap-4 py-2">
            <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
              <h3 className="font-black text-gray-700">Løsningsbilde</h3>
              <p className="text-xs text-gray-400">
                Last opp bildet som avslører gjemmestedet. Appen deler det automatisk opp i{' '}
                {tasks.length > 0 ? tasks.length : 'N'} brikker – én per oppgave.
              </p>

              <ImageUpload
                label=""
                value={config.solutionImage}
                onClear={async () => { await setSolutionImage(''); flash('Løsningsbilde fjernet'); }}
                onCapture={handleSolutionCapture}
              />

              {splitting && (
                <p className="text-amber-600 text-sm text-center animate-pulse">Deler opp bildet...</p>
              )}

              {tasks.length === 0 && (
                <p className="text-xs text-orange-400 text-center">
                  Legg til oppgaver først – antall brikker = antall oppgaver.
                </p>
              )}
            </div>

            {config.puzzlePieces && config.puzzlePieces.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col items-center gap-3">
                <h3 className="font-black text-gray-700">Forhåndsvisning</h3>
                <p className="text-xs text-gray-400 text-center">
                  Slik ser det ut når spilleren har samlet alle {config.puzzlePieces.length} brikker:
                </p>
                <PuzzleBoard
                  pieces={config.puzzlePieces}
                  total={config.puzzlePieces.length}
                />
              </div>
            )}
          </div>
        )}

        {/* Welcome tab */}
        {tab === 'welcome' && (
          <div className="flex flex-col gap-4 py-2">
            <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-3">
              <h3 className="font-black text-gray-700">Velkomstside</h3>
              <p className="text-xs text-gray-400">
                Vises for spilleren før rebusen starter. Alt er valgfritt.
              </p>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Tittel</label>
                <input
                  type="text"
                  value={welcomeTitle}
                  onChange={e => setWelcomeTitle(e.target.value)}
                  onBlur={() => setWelcome(welcomeTitle, welcomeText, welcomeImage)}
                  placeholder="Påskerebus 2026"
                  className="w-full border-2 border-amber-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-600 block mb-1">Tekst</label>
                <textarea
                  value={welcomeText}
                  onChange={e => setWelcomeText(e.target.value)}
                  onBlur={() => setWelcome(welcomeTitle, welcomeText, welcomeImage)}
                  rows={4}
                  placeholder="Velkommen til årets påskerebus! Finn alle påskeeggene..."
                  className="w-full border-2 border-amber-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-amber-400 resize-none"
                />
              </div>
              <ImageUpload
                label="Bilde (valgfritt)"
                value={welcomeImage}
                onClear={() => { setWelcomeImage(undefined); setWelcome(welcomeTitle, welcomeText, undefined); }}
                onCapture={img => { setWelcomeImage(img); setWelcome(welcomeTitle, welcomeText, img); }}
              />
              <button
                onClick={() => { setWelcome(welcomeTitle, welcomeText, welcomeImage); flash('Velkomstside lagret'); }}
                className="py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition-colors"
              >
                Lagre velkomstside
              </button>
            </div>
          </div>
        )}

        {/* Settings tab */}
        {tab === 'settings' && (
          <div className="flex flex-col gap-4 py-2">
            {saved && (
              <div className="bg-green-100 text-green-700 text-sm font-semibold text-center py-2 rounded-2xl">
                ✓ {saved}
              </div>
            )}

            {/* API key */}
            <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
              <h3 className="font-black text-gray-700">Gemini API-nøkkel</h3>
              {import.meta.env.VITE_GEMINI_API_KEY ? (
                <p className="text-xs text-green-600 font-semibold">
                  ✓ API-nøkkel er satt via miljøvariabel (GitHub secret).
                </p>
              ) : (
                <>
                  <p className="text-xs text-gray-400">
                    Brukes til automatisk bildsammenligning i lokasjonsoppgaver.
                    Uten nøkkel må spilleren bekrefte selv.
                  </p>
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={e => setApiKeyInput(e.target.value)}
                    placeholder="AIza..."
                    className="border-2 border-amber-200 rounded-xl px-3 py-2 font-mono text-sm outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={() => { setApiKey(apiKeyInput); flash('API-nøkkel lagret'); }}
                    className="py-2 bg-amber-400 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition-colors"
                  >
                    Lagre nøkkel
                  </button>
                </>
              )}
            </div>

            {/* Change password */}
            <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
              <h3 className="font-black text-gray-700">Endre passord</h3>
              <input
                type="password"
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Nytt passord"
                className="border-2 border-amber-200 rounded-xl px-3 py-2 outline-none focus:border-amber-400"
              />
              <button
                onClick={handleSavePassword}
                disabled={newPw.length < 4}
                className="py-2 bg-amber-400 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold rounded-xl text-sm"
              >
                Endre passord
              </button>
            </div>

            {/* Export / Import */}
            <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
              <h3 className="font-black text-gray-700">Eksport / Import</h3>
              <p className="text-xs text-gray-400">
                Lagre alle oppgaver og bilder til fil for backup eller gjenbruk neste år.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => exportConfig(config, true)}
                  className="flex-1 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold rounded-xl text-sm transition-colors"
                  title="Eksporter med API-nøkkel (backup)"
                >
                  ⬇ Eksporter
                </button>
                <button
                  onClick={() => exportConfig(config, false)}
                  className="flex-1 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold rounded-xl text-sm transition-colors"
                  title="Eksporter uten API-nøkkel – lagres som tasks.json"
                >
                  ⬇ tasks.json
                </button>
                <label className="flex-1 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold rounded-xl text-sm text-center cursor-pointer transition-colors">
                  ⬆ Importer
                  <input type="file" accept=".json" className="hidden" onChange={handleImport} />
                </label>
              </div>
            </div>

            {/* Reset game */}
            <div className="bg-white rounded-2xl shadow-sm p-4 flex flex-col gap-2">
              <h3 className="font-black text-gray-700">Nullstill spill</h3>
              <p className="text-xs text-gray-400">
                Sletter spillerens fremgang. Oppgavene beholdes.
              </p>
              {confirmReset ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => { reset(); setConfirmReset(false); flash('Spillet er nullstilt'); }}
                    className="flex-1 py-2 bg-red-500 text-white font-bold rounded-xl text-sm"
                  >
                    Ja, nullstill
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    className="flex-1 py-2 bg-gray-100 text-gray-600 font-bold rounded-xl text-sm"
                  >
                    Avbryt
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmReset(true)}
                  className="py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold rounded-xl text-sm transition-colors"
                >
                  🔄 Nullstill spill
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
