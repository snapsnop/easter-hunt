# Påskerebus

En interaktiv påskerebus-app for mobil. Admin legger inn oppgaver og et løsningsbilde. Spillere løser oppgavene én etter én, og låser opp en brikke av et puslespill for hvert riktige svar. Når alle oppgaver er løst må spilleren dra brikkene på plass – det ferdige puslespillet avslører gjemmestedet for påskeegget.

## Funksjoner

- **Tre oppgavetyper:** Tekstsvar, flervalg (multiple choice) og lokasjonsoppgave (bilde)
- **Hint:** Vises automatisk etter 3 feil forsøk (konfigureres per oppgave)
- **Velkomstside:** Tilpasset tittel, tekst og bilde før rebusen starter
- **Puslespill:** Bildet deles automatisk i N brikker, én per oppgave, avslørt i tilfeldig rekkefølge
- **Kamera:** Innebygd kamerastøtte for alle bildeopplastinger (admin og spiller)
- **Bildegjenkjenning:** Lokasjonsoppgaver verifiseres automatisk med Gemini Vision API
- **Ingen backend:** Alt lagres i `localStorage`; eksport/import som JSON-fil

## Teknologi

React 18 + TypeScript · Vite · Tailwind CSS · Zustand · Gemini API · Canvas API · Pointer Events API · HashRouter

## Kom i gang

```bash
npm install
npm run dev      # https://localhost:5173/easter-hunt/
npm run build
```

Krever Node.js 18+. HTTPS er aktivert i dev-modus (nødvendig for kamera og crypto på LAN).

## Oppsett

1. Åpne `/#/admin` og opprett adminpassord
2. Legg til oppgaver under **Oppgaver**-fanen
3. Last opp løsningsbilde under **Puslespill**-fanen
4. Konfigurer velkomstside under **Velkomst**-fanen (valgfritt)
5. Legg inn Gemini API-nøkkel under **Innstillinger** (nødvendig for lokasjonsoppgaver)

Spillere åpner `/#/` på mobilen.

## Deploy til GitHub Pages

1. Aktiver GitHub Pages: **Settings → Pages → Source: GitHub Actions**
2. Legg til secret: **Settings → Secrets → `VITE_GEMINI_API_KEY`**
3. Push til `main` – appen deployes automatisk

```
https://brukernavn.github.io/easter-hunt/
```

## Konfigurasjonsfiler

| Knapp i admin | Resultat |
|---|---|
| ⬇ Eksporter | `easter-hunt-config.json` med API-nøkkel (backup) |
| ⬇ tasks.json | Uten API-nøkkel – legg i `public/` for automatisk lasting |
| ⬆ Importer | Laster inn tidligere eksportert konfig |

Plasser `tasks.json` i `public/`-mappen for å forhåndsinnlaste konfig (f.eks. via `tasks.json` eksportert i admin).
