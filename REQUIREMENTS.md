# Påskerebus – Krav

## Oversikt

Web-app for en interaktiv påskerebus. En administrator legger inn oppgaver og laster opp et løsningsbilde. Spillere løser oppgavene sekvensielt, og for hvert riktig svar låses en ny brikke av puslespillet opp. Når alle brikker er samlet viser det ferdige bildet gjemmestedet for påskeegget.

---

## Roller

### Administrator
- Kan legge til, redigere, slette og sortere oppgaver
- Laster opp bilder til oppgaver via kamera eller fil
- Laster opp ett løsningsbilde (kamera eller fil) – appen deler det automatisk opp i puslespillbrikker
- Kan konfigurere Claude API-nøkkel (brukes til bildsammenligning i lokasjonsoppgaver)
- Har tilgang via passord
- Kan eksportere og importere hele konfigurasjonen som JSON-fil
- Kan nullstille spillerens fremgang uten å miste oppgavene

### Spiller
- Ser oppgaver én om gangen, i rekkefølge
- Besvarer oppgaven via tekst eller bilde (kamera eller fil)
- Får en puslespillbrikke ved riktig svar (animasjon med konfetti)
- Kan se puslespill-brettet med opptjente brikker underveis
- Ser det ferdige bildet med konfetti når alle oppgaver er løst

---

## Oppgavetyper

### Type 1: Tekstoppgave
- Inneholder: spørsmålstekst og valgfritt bilde
- Svar: fritekst, sjekkes case-insensitivt mot konfigurert fasit
- Støtte for alternative riktige svar (kommaseparert liste)

### Type 2: Lokasjonsoppgave
- Inneholder: referansebilde fra en lokasjon og beskrivende tekst
- Svar: spiller tar bilde på samme sted via **kamera** eller laster opp fra fil
- Bildet sammenlignes mot referansebildet via Claude Vision API (claude-haiku-4-5-20251001)
- Fallback uten API-nøkkel: appen viser begge bilder side om side og ber spilleren bekrefte selv
- Admin kan stille godkjenningsterskel (30–100 %)

---

## Puslespill-system

- Admin laster opp ett løsningsbilde (kamera eller fil)
- Appen splitter bildet automatisk i N like store brikker (N = antall oppgaver) via Canvas API
- Brikkene er arrangert i et rutenett som til sammen viser det fullstendige bildet
- Spilleren låser opp én brikke per løst oppgave
- Ulåste posisjoner vises som grå plassholdere med «?»
- Brikker reberegnes automatisk hvis antall oppgaver endres etter at løsningsbilde er lastet opp
- Admin kan se forhåndsvisning av ferdig puslespill

---

## Bildeopplasting

Alle bildeopplastinger – for admin og spiller – støtter:
- **📷 Kamera** – åpner kamera direkte (bakre kamera på mobil)
- **📁 Fil** – velg fra enhetens filsystem / kamerarulle

---

## Lagring og gjenbruk

Siden appen er ren frontend kan den ikke skrive direkte til disk. Løsningen:

- All data lagres i `localStorage` under kjøring
- **Eksport**: admin laster ned hele konfigurasjonen som `easter-hunt-config.json` (inkl. alle bilder som base64)
- **Import**: admin laster opp en tidligere eksportert fil for å gjenopprette oppgavesettet
- **Standard-konfig**: appen laster `public/tasks.json` automatisk ved første oppstart, noe som gjør det mulig å distribuere et ferdigkonfigurert oppsett

Dette gjør det mulig å forberede rebuset i god tid, ta backup og gjenbruke samme oppsett år etter år.

---

## Tekniske krav

- Ren frontend-app – ingen backend nødvendig
- Kan hostes på GitHub Pages (bruker HashRouter for URL-kompatibilitet)
- Responsivt design – optimalisert for mobiltelefon
- Norsk grensesnitt

---

## Ikke i scope

- Brukerkontoer / innlogging for spillere
- Multiplayer / ledertavle
- Backend / database
- Push-notifikasjoner
