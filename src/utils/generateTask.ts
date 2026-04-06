import { GoogleGenerativeAI } from '@google/generative-ai';

export type Theme = 'gåte' | 'natur' | 'historie' | 'samfunn' | 'musikk' | 'blandet';
export type Difficulty = 'barn' | 'ungdom' | 'voksen';

export interface GenerateTaskOptions {
  type: 'text' | 'multiple-choice';
  theme: Theme;
  easterRelated: boolean;
  difficulty: Difficulty;
  welcomeContext?: string;
  apiKey?: string;
}

export interface GeneratedTask {
  question: string;
  answer: string;
  choices?: string[];
}

async function withBackoff<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let delay = 500;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const isRetryable =
        err instanceof Error &&
        (err.message.includes('429') || err.message.includes('503') || err.message.includes('500'));
      if (!isRetryable || attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, delay + Math.random() * 200));
      delay *= 2;
    }
  }
  throw new Error('Maks antall forsøk nådd');
}

const THEME_LABELS: Record<Theme, string> = {
  'gåte': 'gåter og ordspill',
  'natur': 'natur og dyr',
  'historie': 'norsk og europeisk historie',
  'samfunn': 'samfunn og geografi',
  'musikk': 'musikk',
  'blandet': 'lett blandet',
};

const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  'barn': 'barn (6–10 år)',
  'ungdom': 'ungdom (11–16 år)',
  'voksen': 'voksne',
};

export async function generateTask(options: GenerateTaskOptions): Promise<GeneratedTask> {
  const { type, theme, easterRelated, difficulty, welcomeContext, apiKey } = options;
  const resolvedKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!resolvedKey) throw new Error('Ingen API-nøkkel konfigurert');

  const genAI = new GoogleGenerativeAI(resolvedKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const themeLabel = THEME_LABELS[theme];
  const difficultyLabel = DIFFICULTY_LABELS[difficulty];
  const easterNote = easterRelated
    ? 'Oppgaven skal ha et påskerelatert tema eller innhold (påsk, egg, hare, kylling, kors, bibel, vår, osv.).'
    : '';
  const contextNote = welcomeContext?.trim()
    ? `Kontekst for rebusen: "${welcomeContext.trim()}". Bruk gjerne denne konteksten til å tilpasse oppgaven.`
    : '';

  const taskInstruction = theme === 'gåte'
    ? 'Lag én gåte eller et ordspill (ikke et triviaspørsmål).'
    : `Lag ett triviaspørsmål innenfor temaet: ${themeLabel}. Ikke lag en gåte – stil et faktabasert spørsmål.`;

  let prompt: string;
  if (type === 'text') {
    prompt = `Du er en kreativ spilldesigner for en norsk påskerebus. ${taskInstruction} Vanskelighetsgrad: ${difficultyLabel}. ${easterNote} ${contextNote}

Oppgaven skal ha ett enkelt tekstsvar (ett eller noen få ord). Svar KUN med gyldig JSON, ingenting annet:
{"question": "Spørsmålet eller gåten her", "answer": "Fasitsvar"}

Svar kortfattet og morsomt. Bruk norsk bokmål.`;
  } else {
    prompt = `Du er en kreativ spilldesigner for en norsk påskerebus. ${taskInstruction} Vanskelighetsgrad: ${difficultyLabel}. ${easterNote} ${contextNote}

Oppgaven skal ha nøyaktig 4 svaralternativer der ett er riktig. Svar KUN med gyldig JSON, ingenting annet:
{"question": "Spørsmålet her", "choices": ["Alternativ A", "Alternativ B", "Alternativ C", "Alternativ D"], "answer": "Alternativ A"}

Viktig: "answer" må være identisk (tegn for tegn) med ett av valgene i "choices". Svar kortfattet og morsomt. Bruk norsk bokmål.`;
  }

  const result = await withBackoff(() => model.generateContent(prompt));
  const text = result.response.text().trim();

  try {
    return JSON.parse(text) as GeneratedTask;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as GeneratedTask;
    throw new Error('Uventet svar fra Gemini – prøv igjen');
  }
}
