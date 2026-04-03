# Påskerebus – Løsningsbeskrivelse

## Hva er dette?

En web-app for å arrangere en interaktiv påskerebus. Admin legger inn oppgaver og et løsningsbilde. Spillere løser oppgavene på mobilen, og for hver riktig besvarelse låses en ny brikke av et puslespill opp. Når alle oppgaver er løst må spilleren dra brikkene på riktig plass i rutenettet. Det løste puslespillet – og det fulle løsningsbildet – avslører gjemmestedet for påskeegget.

---

## Teknologi

| Teknologi | Bruk |
|-----------|------|
| React 18 + TypeScript | UI og komponentlogikk |
| Vite | Byggverktøy og utviklingsserver |
| Tailwind CSS | Styling (custom easter-farger, Nunito-font) |
| Zustand | State management (admin + spill) |
| canvas-confetti | Animasjoner ved riktig svar og fullføring |
| Canvas API | Automatisk oppdeling av løsningsbilde + kameraopptak |
| getUserMedia API | Kameratilgang på desktop og mobil |
| Claude Vision API | Bildsammenligning for lokasjonsoppgaver |
| localStorage | Persistering av konfig og spilltilstand |
| Pointer Events API | Drag-and-drop i puslespill (mus + touch) |
| HashRouter | URL-routing kompatibel med GitHub Pages |

---

## Filstruktur

```
src/
  types/index.ts              Felles typer (Task, AdminConfig, GameState)
  utils/
    storage.ts                localStorage + eksport/import + tasks.json-lasting
    splitImage.ts             Canvas-basert automatisk bildeoppdeling
    imageComparison.ts        Claude Vision API-integrasjon
  store/
    adminStore.ts             Zustand: oppgaver, passord, løsningsbilde, API-nøkkel
    gameStore.ts              Zustand: spillfremgang (currentTaskIndex)
  components/
    CameraCapture.tsx         Kameramodal via getUserMedia (desktop + mobil)
    TextTask.tsx              Tekstoppgave-UI med fasitsjekk
    LocationTask.tsx          Lokasjonsoppgave med kamera/fil-valg
    PuzzleBoard.tsx           Puslespill-rutenett under spilling (låst/ulåst)
    PuzzleSolve.tsx           Drag-and-drop puslespill på sluttsiden
    PieceReveal.tsx           Modal + konfetti ved ny brikke
    AdminTaskForm.tsx         Skjema for ny/rediger oppgave (inkl. ImageUpload)
    AdminTaskList.tsx         Oppgaveliste med flytt opp/ned, rediger, slett
  pages/
    PlayerPage.tsx            Spillergrensesnitt
    AdminPage.tsx             Admin: innlogging / oppsett / panel
    CompletePage.tsx          Puslespill-løsing + avslutning med konfetti
  App.tsx                     HashRouter med ruter
  main.tsx                    React entry point
```

---

## Datamodell

```typescript
interface Task {
  id: string;
  order: number;
  type: 'text' | 'location';
  question: string;
  questionImage?: string;        // base64
  answer?: string;               // fasit, kommaseparert for alternativ
  referenceImage?: string;       // base64, kun lokasjonsoppgave
  similarityThreshold?: number;  // 0–1, kun lokasjonsoppgave
}

interface AdminConfig {
  passwordHash: string;          // SHA-256 av adminpassord
  claudeApiKey?: string;
  tasks: Task[];
  solutionImage?: string;        // base64 – fullbilde lastet opp av admin
  puzzlePieces?: string[];       // base64[] – auto-splittet fra solutionImage
}

interface GameState {
  currentTaskIndex: number;
  completed: boolean;
  startedAt: string;
}
```

---

## Flyten

### Admin-oppsett
1. Gå til `/#/admin`
2. Første gang: velg adminpassord og valgfri Claude API-nøkkel
3. Legg inn oppgaver under **Oppgaver**-fanen (tekst- eller lokasjonsoppgave)
4. Last opp løsningsbilde under **Puslespill**-fanen (📷 Kamera eller 📁 Fil) – appen deler det automatisk i N brikker (N = antall oppgaver)
5. Sjekk forhåndsvisning av puslespillet i samme fane
6. Eksporter konfigurasjonen som `easter-hunt-config.json` for backup / gjenbruk

### Spilleropplevelse
1. Åpne `/#/` på mobilen
2. Les oppgaven og svar: tekst eller bilde (📷 Kamera eller 📁 Fil)
3. Ved riktig svar: modal viser ny puslespillbrikke + konfetti
4. Puslespill-brettet nederst viser opptjente brikker underveis
5. Etter siste oppgave: puslespill-siden åpnes med stokket rutenett
6. Dra brikkene til riktig posisjon for å løse puslespillet
7. Når alle brikker er på plass: det fulle løsningsbildet vises med konfetti

---

## Bildeopplasting (kamera)

Alle bildeopplastinger bruker en felles `CameraCapture`-modal basert på `getUserMedia`:

- Åpner live kameravisning i en fullskjerm-overlay
- Forsøker bakre kamera først (`facingMode: environment`) – faller tilbake til frontkamera
- Bruker Canvas API til å ta stillbilde fra videostrømmen
- Spilleren kan se forhåndsvisning og velge å ta om igjen eller bekrefte
- Feilmelding vises hvis nettleseren mangler kameratilgang

Alle steder har også en **📁 Fil**-knapp som åpner vanlig filvelger.

---

## Bildeoppdeling

Løsningsbildet deles opp med Canvas API i nettleseren:

- Antall kolonner: `Math.ceil(√N)` – nær kvadratisk rutenett
- Antall rader: `Math.ceil(N / kolonner)`
- Hver brikke: lik andel av bildet, lagret som JPEG base64
- Reberegnes automatisk når antall oppgaver endres

Eksempel: 6 oppgaver → 3×2 rutenett, 9 oppgaver → 3×3 rutenett.

---

## Drag-and-drop puslespill

Etter at alle oppgaver er løst vises `PuzzleSolve`-komponenten:

- Brikkene plasseres tilfeldig i rutenettet ved start (Fisher-Yates shuffle)
- Spilleren drar en brikke over en annen for å bytte plass
- Implementert med **Pointer Events API** – fungerer for mus, touch og stylus
- `setPointerCapture` sikrer at drag-events følger pekeren utenfor elementet
- Brikker på riktig plass får grønn kant + glød
- Teller viser `X / N på riktig plass`
- Når alle er korrekte: 700 ms forsinkelse, deretter konfetti + fullbilde

---

## Bildsammenligning (lokasjonsoppgave)

Kaller Claude claude-haiku-4-5-20251001 via Anthropic API direkte fra nettleseren:

- Sender referansebilde + spillerbilde som base64
- Ber modellen vurdere om bildene viser samme sted
- Godkjenningsterskel satt av admin (30–100 %)
- Returnerer `{ match: boolean, reason: string }` på norsk
- **Fallback** uten API-nøkkel: viser begge bilder side om side, spiller bekrefter selv

API-nøkkelen lagres i localStorage. Akseptabelt for privat bruk.

---

## Lagring og gjenbruk

| Mekanisme | Detaljer |
|-----------|----------|
| `localStorage` | Konfig og spilltilstand lagres automatisk |
| Eksport | Admin laster ned `easter-hunt-config.json` med alle bilder (base64) |
| Import | Admin laster opp tidligere eksportert fil – siden lastes på nytt |
| `public/tasks.json` | Valgfri standard-konfig som lastes ved første oppstart |

Bilder lagres som base64 i localStorage. Merk at localStorage er begrenset til ~5 MB per opprinnelse; store bilder bør komprimeres før opplasting.

---

## Hosting på GitHub Pages

Konfigurert med `base: '/easter-hunt/'` i `vite.config.ts` og HashRouter for klient-side routing.

**Deploy med GitHub Actions:**
```yaml
- run: npm ci && npm run build
- uses: actions/deploy-pages@v4
  with:
    folder: dist
```

**URL-er etter deploy:**

| Adresse | Innhold |
|---------|---------|
| `brukernavn.github.io/easter-hunt/#/` | Spillergrensesnitt |
| `brukernavn.github.io/easter-hunt/#/admin` | Adminpanel |
| `brukernavn.github.io/easter-hunt/#/complete` | Puslespill + avslutning |

---

## Lokal utvikling

```bash
npm install
npm run dev      # http://localhost:5173/easter-hunt/
npm run build    # Produksjonsbygg til dist/
```

Krever Node.js 18+.
