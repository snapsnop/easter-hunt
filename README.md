# Påskerebus

En interaktiv påskerebus-app for mobil. Admin legger inn oppgaver og et løsningsbilde. Spillere løser oppgavene én etter én, og låser opp en brikke av et puslespill for hvert riktige svar. Når alle oppgaver er løst må spilleren dra brikkene på plass – det ferdige puslespillet avslører gjemmestedet for påskeegget.

## Funksjoner

- **Tre oppgavetyper:** Tekstsvar, flervalg (multiple choice) og lokasjonsoppgave (bilde)
- **AI-generering:** Lag oppgaver automatisk med Gemini – velg tema, vanskelighetsgrad og om de skal være påskerelaterte
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
2. Legg inn Gemini API-nøkkel under **Innstillinger** (nødvendig for lokasjonsoppgaver og AI-generering)
3. Legg til oppgaver under **Oppgaver**-fanen – bruk "✨ Generer med Gemini" for å lage oppgaver automatisk
4. Last opp løsningsbilde under **Puslespill**-fanen
5. Konfigurer velkomstside under **Velkomst**-fanen (valgfritt)

Spillere åpner `/#/` på mobilen.

## Dele konfig til spillere

Konfigurasjonen (oppgaver, bilder, velkomsttekst og API-nøkkel) deles fra admin-mobilen til spillernes mobiler via eksport/import.

### Fremgangsmåte

1. Konfigurer rebusen på admin-mobilen (oppgaver, løsningsbilde, velkomst)
2. Gå til **Innstillinger → ↑ Del** – dette åpner AirDrop, Messenger, e-post o.l.
3. Mottakeren åpner filen i nettleseren → **Innstillinger → ⬆ Importer**

Alternativt: bruk **⬇ Eksporter** og send filen manuelt.

> **Merk:** Lokasjonsoppgaver krever Gemini API-nøkkel for automatisk bildverifisering. Uten nøkkel må spilleren bekrefte selv at de er på riktig sted.

## Deploy til GitHub Pages

1. Aktiver GitHub Pages: **Settings → Pages → Source: GitHub Actions**
2. Push til `main` – appen deployes automatisk

```
https://brukernavn.github.io/easter-hunt/
```

Ingen secrets eller API-nøkler trengs i GitHub – nøkkelen legges inn lokalt i admin-panelet.

### Forhåndsinnlaste oppgaver via GitHub

For å bake oppgaver inn i appen ved deploy, legg til en environment variable i GitHub:

- **Settings → Environments → github-pages → Variables → `TASKS_JSON`**
- Verdien er innholdet av `tasks.json` (eksportert uten API-nøkkel fra admin)

## Konfigurasjonsfiler

| Knapp i admin | Resultat |
|---|---|
| ↑ Del | Deler konfig via AirDrop/Messenger/e-post (med API-nøkkel) |
| ⬇ Eksporter | `easter-hunt-config.json` med API-nøkkel (lokal backup) |
| ⬇ tasks.json | Uten API-nøkkel – kan legges i `public/` eller brukes som `TASKS_JSON` |
| ⬆ Importer | Laster inn tidligere eksportert konfig |
