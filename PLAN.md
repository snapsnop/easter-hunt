# Påskerebus – Implementasjonsplan

## Tech-stack (eksisterende)
- Vite + React 18 + TypeScript
- Tailwind CSS
- Zustand (state management)
- canvas-confetti (animasjoner)
- Base path: `/easter-hunt/`

---

## Filstruktur

```
src/
  main.tsx                   # React entry point
  App.tsx                    # Router setup (player / admin)
  types/
    index.ts                 # Felles typer
  store/
    gameStore.ts             # Spill-tilstand (Zustand + localStorage)
    adminStore.ts            # Admin-tilstand (Zustand + localStorage)
  pages/
    PlayerPage.tsx           # Spiller-grensesnitt (hoved-URL)
    AdminPage.tsx            # Admin-grensesnitt (/admin)
    CompletePage.tsx         # Avslutning – fullt puslespill + konfetti
  components/
    TaskView.tsx             # Wrapper som velger TextTask eller LocationTask
    TextTask.tsx             # UI for Type 1-oppgave
    LocationTask.tsx         # UI for Type 2-oppgave
    PuzzleBoard.tsx          # Viser opptjente brikker
    PieceReveal.tsx          # Animasjon ved ny brikke
    AdminTaskForm.tsx        # Skjema for å legge inn / redigere oppgave
    AdminTaskList.tsx        # Liste over alle oppgaver i admin
  utils/
    imageComparison.ts       # Kall til Claude Vision API
    storage.ts               # localStorage helpers
```

---

## Datamodell

```typescript
type TaskType = 'text' | 'location';

interface Task {
  id: string;
  order: number;
  type: TaskType;
  question: string;          // Spørsmålstekst
  questionImage?: string;    // Base64 – valgfritt bilde (begge typer)
  answer?: string;           // Fasit (kun type 'text'), evt kommaseparert
  referenceImage?: string;   // Base64 – referansebilde (kun type 'location')
  hintPiece: string;         // Base64 – puslespill-brikke
  similarityThreshold?: number; // 0–1, default 0.7 (kun type 'location')
}

interface AdminConfig {
  password: string;          // Hash av adminpassord
  claudeApiKey?: string;     // For bildsammenligning
  tasks: Task[];
}

interface GameState {
  currentTaskIndex: number;
  unlockedPieces: string[];  // Base64-brikker i rekkefølge
  completed: boolean;
  startedAt?: string;
}
```

---

## Faser

### Fase 1 – Grunnleggende infrastruktur
- [ ] `src/main.tsx` og `src/App.tsx` med routing (`/`, `/admin`)
- [ ] `src/types/index.ts`
- [ ] `src/utils/storage.ts` – lese/skrive `AdminConfig` og `GameState` i localStorage
- [ ] `src/store/adminStore.ts` – Zustand store for admin
- [ ] `src/store/gameStore.ts` – Zustand store for spill

### Fase 2 – Admin-grensesnitt
- [ ] `AdminPage.tsx` – passordsjekk ved inngang
- [ ] `AdminTaskList.tsx` – liste med drag-to-reorder
- [ ] `AdminTaskForm.tsx` – skjema for ny/rediger oppgave
  - Velg oppgavetype
  - Last opp bilde (question image / reference image)
  - Last opp hint-brikke
  - Angi fasit (tekst) eller threshold (lokasjon)
- [ ] API-nøkkel-innstilling i admin
- [ ] Forhåndsvisning av puslespill-brettet
- [ ] **Eksport**: knapp som laster ned `easter-hunt-config.json` med alle oppgaver og bilder
- [ ] **Import**: filopplasting som laster inn en tidligere eksportert JSON og erstatter gjeldende konfig

### Fase 3 – Spillergrensesnitt
- [ ] `PlayerPage.tsx` – viser gjeldende oppgave + puslespill-brett
- [ ] `TextTask.tsx` – tekstinnlegg + submit
- [ ] `LocationTask.tsx` – kamera-capture / filopplasting
- [ ] `PuzzleBoard.tsx` – grid med brikker (grå placeholder for ulåste)
- [ ] `PieceReveal.tsx` – animasjon (slide-in + glow) ved ny brikke
- [ ] `CompletePage.tsx` – fullt bilde + konfetti

### Fase 4 – Bildsammenligning (lokasjonsoppgave)
- [ ] `utils/imageComparison.ts`
  - Send referansebilde + spillerbilde til Claude claude-haiku-4-5-20251001 via API
  - Prompt: vurder om de viser samme sted fra omtrent samme vinkel
  - Returner `{ match: boolean, confidence: number, reason: string }`
- [ ] Fallback-modus uten API-nøkkel: vis begge bilder, la spiller bekrefte

### Fase 5 – Polish
- [ ] Responsivt design (mobile-first)
- [ ] Norsk feilmeldinger og hjelptekster
- [ ] Loading-states ved API-kall
- [ ] Feilhåndtering (ugyldig bilde, nettverksfeil)
- [ ] Reset-funksjon i admin (starter spill fra scratch)

---

## Ruting

Bruker `HashRouter` (ikke `BrowserRouter`) for kompatibilitet med GitHub Pages – URL-er blir `/#/` og `/#/admin`.

| Hash-URL    | Innhold                          |
|-------------|----------------------------------|
| `/#/`       | Spillergrensesnitt               |
| `/#/admin`  | Admingrensesnitt (passordvaktet) |
| `/#/complete` | Avslutning + puslespill        |

---

## Bildelagring og konfigfilformat

Bilder lagres som base64-strenger i `AdminConfig.tasks`. Konfigurasjonen kan eksporteres/importeres som JSON:

```
public/tasks.json          # Valgfri standard-konfig, lastes ved første oppstart
easter-hunt-config.json    # Eksportert fil (lastes ned / lastes opp av admin)
```

Oppstarts-prioritet:
1. `localStorage` (hvis noe er lagret fra før)
2. `public/tasks.json` (hvis localStorage er tom og filen finnes)
3. Tom konfig

localStorage-grensen (~5 MB) kan bli en begrensning ved mange store bilder. Eksport/import-løsningen omgår dette ved at konfigen lever som en fil på disk mellom sesjonene.

---

## Bildsammenligning – Claude API

Kall til `https://api.anthropic.com/v1/messages` med:
- Modell: `claude-haiku-4-5-20251001` (rask og billig)
- To bilder i meldingen (referanse + spillerbilde)
- Prompt ber modellen vurdere om bildene viser samme sted
- API-nøkkel sendes fra klient (akseptabelt for privat bruk)

Svar parses til `{ match: boolean }` basert på modellens vurdering.
