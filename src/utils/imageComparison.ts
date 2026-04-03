import { GoogleGenerativeAI } from '@google/generative-ai';

export interface ComparisonResult {
  match: boolean;
  reason: string;
}

function mediaType(base64: string): string {
  if (base64.includes('data:image/png')) return 'image/png';
  if (base64.includes('data:image/webp')) return 'image/webp';
  if (base64.includes('data:image/gif')) return 'image/gif';
  return 'image/jpeg';
}

function stripPrefix(base64: string): string {
  return base64.replace(/^data:image\/\w+;base64,/, '');
}

async function withExponentialBackoff<T>(fn: () => Promise<T>, maxRetries = 4): Promise<T> {
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

export async function compareImages(
  referenceBase64: string,
  playerBase64: string,
  apiKey: string | undefined,
  threshold = 0.7,
): Promise<ComparisonResult> {
  const resolvedKey = apiKey || import.meta.env.VITE_GEMINI_API_KEY;
  if (!resolvedKey) throw new Error('Ingen API-nøkkel konfigurert');

  const confidencePct = Math.round(threshold * 100);

  const genAI = new GoogleGenerativeAI(resolvedKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' });

  const prompt = `Det første bildet er et referansebilde av en lokasjon eller et objekt fra en påskerebus. Det andre bildet er tatt av en spiller som forsøker å finne samme lokasjon eller objekt. Vurder om bildene viser samme sted eller objekt – vær raus og godkjenn selv om vinkel, lysforhold eller utsnitt er litt forskjellig, så lenge stedet eller objektet på bildet er gjenkjennelig. Godkjenn hvis du er minst ${confidencePct}% sikker. Svar kun med gyldig JSON: {"match": true, "reason": "kort og vittig begrunnelse på norsk"}`;

  const result = await withExponentialBackoff(() =>
    model.generateContent([
      { inlineData: { data: stripPrefix(referenceBase64), mimeType: mediaType(referenceBase64) } },
      { inlineData: { data: stripPrefix(playerBase64), mimeType: mediaType(playerBase64) } },
      prompt,
    ])
  );

  const text = result.response.text().trim();

  try {
    return JSON.parse(text) as ComparisonResult;
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (m) return JSON.parse(m[0]) as ComparisonResult;
    throw new Error('Uventet svar fra API');
  }
}
