# Nyhetsdashbord

Et React-basert dashbord for å følge lokale nyhetssaker og hendelser i sanntid. Appen henter ferdig prosesserte saker fra Supabase, oppdaterer visningen automatisk, og lar brukeren filtrere på prioritet og kilde.

## Hva prosjektet gjør

- Henter de nyeste sakene fra Supabase-tabellen `news_items`
- Oppdaterer automatisk hvert minutt
- Filtrerer på prioritet (`Rød`, `Gul`, `Grønn`, `Alle`, `Siste`)
- Filtrerer på kilde
- Viser AI-score, begrunnelse og sammendrag
- Marker røde og ferske saker med alarm-animasjon
- Kan sende nettleservarsler for saker med høy score

## Teknologistack

- React 19
- TypeScript
- Vite
- Tailwind CSS 4
- Supabase JavaScript client

## Hvordan appen er bygget

Prosjektet er en ren frontend-app. Den gjør ikke selve skrapingen eller AI-vurderingen lokalt, men leser ferdig bearbeidede data fra Supabase.

### Hovedfiler

- `src/main.tsx`: starter React-appen
- `src/App.tsx`: hovedlogikk for lasting, polling, filtrering, sortering og layout
- `src/components/newsService.ts`: henter nyheter fra Supabase og mapper databasefelter til frontend-modellen
- `src/services/supabaseClient.ts`: oppretter Supabase-klienten fra miljøvariabler
- `src/components/FilterControls.tsx`: filterknapper og kildevalg
- `src/components/NewsCard.tsx`: presentasjon av hver sak, inkludert kildelenke og varsellogikk
- `src/types.ts`: TypeScript-typer for nyhetsdata
- `src/constants.ts`: konstanter som oppdateringsintervall og prioritetsterskler

## Dataflyt

1. Appen kobler seg til Supabase med miljøvariabler.
2. `fetchNews()` leser de siste radene fra `news_items`.
3. Data fra databasen mappes fra `snake_case` til feltene frontend bruker.
4. Appen filtrerer bort gamle saker, lar brukeren velge prioritet og kilde, og sorterer resultatene.
5. UI-et viser kort med kilde, tidspunkt, score, sammendrag og lenker videre.

## Sortering og prioritet

Appen bruker både publiseringstid og AI-score for å løfte frem viktige saker.

- Nye saker kan havne høyt basert på `geminiScore`
- Saker eldre enn 5 timer mister denne topprioriteten i sorteringen
- Filteret `Siste` viser de 9 nyeste sakene før de sorteres etter den interne prioriteringslogikken

Selve AI-scoren og `priorityTag` antas å være satt i backend før dataene lagres i Supabase.

## Miljøvariabler

Lag en `.env`-fil med disse verdiene:

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

Begge variablene er påkrevd for at appen skal starte.

## Lokal utvikling

Installer avhengigheter:

```bash
npm install
```

Start utviklingsserver:

```bash
npm run dev
```

Bygg produksjonsversjon:

```bash
npm run build
```

Kjør lint:

```bash
npm run lint
```

## Forventet datamodell

Frontend-koden forventer at `news_items` inneholder felter som ligner på:

- `id`
- `title`
- `source`
- `published_at`
- `url`
- `description`
- `gemini_score`
- `gemini_reasoning`
- `priority_tag`
- `ai_summary`

## Merknader

- Prosjektet inneholder en `triggerScraping()`-funksjon for en Supabase Edge Function, men denne brukes ikke direkte i UI-et akkurat nå.
- Appen er designet som et operativt dashbord med mørk visning og tydelig prioritering av hendelser.
