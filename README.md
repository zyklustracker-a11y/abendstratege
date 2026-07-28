# CODING AGENTS: READ THIS FIRST

This is a **handoff bundle** from Claude Design (claude.ai/design).

A user mocked up designs in HTML/CSS/JS using an AI design tool, then exported this bundle so a coding agent can implement the designs for real.

## What you should do — IMPORTANT

**Read the chat transcripts first.** There are 1 chat transcript(s) in `chats/`. The transcripts show the full back-and-forth between the user and the design assistant — they tell you **what the user actually wants** and **where they landed** after iterating. Don't skip them. The final HTML files are the output, but the chat is where the intent lives.

**Read `project/Der Abendstratege.dc.html` in full.** The user had this file open when they triggered the handoff, so it's almost certainly the primary design they want built. Read it top to bottom — don't skim. Then **follow its imports**: open every file it pulls in (shared components, CSS, scripts) so you understand how the pieces fit together before you start implementing.

**If anything is ambiguous, ask the user to confirm before you start implementing.** It's much cheaper to clarify scope up front than to build the wrong thing.

## About the design files

The design medium is **HTML/CSS/JS** — these are prototypes, not production code. Your job is to **recreate them pixel-perfectly** in whatever technology makes sense for the target codebase (React, Vue, native, whatever fits). Match the visual output; don't copy the prototype's internal structure unless it happens to fit.

**Don't render these files in a browser or take screenshots unless the user asks you to.** Everything you need — dimensions, colors, layout rules — is spelled out in the source. Read the HTML and CSS directly; a screenshot won't tell you anything they don't.

## Bundle contents

- `README.md` — this file
- `chats/` — conversation transcripts (read these!)
- `project/` — the `App zur Abendreflexion und Erfolgstrack` project files (HTML prototypes, assets, components)

---

# Der Abendstratege — Implementierung

Das Design aus `project/Der Abendstratege.dc.html` ist in diesem Repository als
lauffähige Web-App umgesetzt: **Vite + React + TypeScript**, alle Daten lokal im
`localStorage`, kein Backend, keine Tracker.

## Loslegen

```bash
npm install
npm run dev      # Entwicklungsserver (http://localhost:5173)
npm run build    # Produktionsbuild nach dist/
npm run preview  # Build lokal prüfen
```

`dist/` ist ein rein statischer Ordner und kann auf jedem Webspace liegen
(GitHub Pages, Netlify, eigener Server). Die App lädt lediglich die beiden
Schriften von Google Fonts nach; sonst geht nichts nach außen.

## Aufbau

```
index.html            Einstiegspunkt, Schriften, Meta-Daten
src/
  App.tsx             Rahmen: Ansichtszustand und Verteilung auf die vier Bereiche
  styles.css          Design-Tokens (Farben, Schriften) und alle Komponenten-Styles
  lib/
    types.ts          Datenmodell (Entry, Draft, Hieb, Goals …)
    constants.ts      Lebensbereiche, die fünf Leitfragen, Platzhalter
    date.ts           Lokales Datum, deutsche Formate, Wochenschlüssel, Streak
    storage.ts        Laden/Speichern unter dem Schlüssel `abendstratege-v1`
    store.ts          Zustand und alle schreibenden Aktionen (`useStore`)
    selectors.ts      Ableitungen: Sortierung, Statistiken, Hieb-Zusatz
  components/
    SetupScreen.tsx   Einmalige Einrichtung der fünf Leitziele
    GoalFields.tsx    Zielfelder, geteilt von Einrichtung und „Meine Ziele“
    AppHeader.tsx     Titel, Streak-Anzeige, Navigation
    reflect/          Abendreflexion: Auftakt, Schritte A–F (+ optional), Abschluss
    MorgenView.tsx    Morgen-Blick mit abhakbaren Hieben
    RueckblickView.tsx Statistiken, Erfolgsformel, Filter, Archiv
    EntryCard.tsx     Ein Archiveintrag, aufklappbar
    ZieleView.tsx     Leitziele bearbeiten
```

## Daten

Alles liegt unter einem Schlüssel (`abendstratege-v1`) im `localStorage`:
Leitziele, alle Reflexionen (eine pro Tag, Datum ist der fachliche Schlüssel),
die Erfolgsformel, die zuletzt ausgeblendete Impuls-Woche und die begonnene, noch
nicht abgeschlossene Reflexion. Der Entwurf wird bei jeder Eingabe gesichert –
ein geschlossener Tab kostet keinen Satz.

Abweichungen vom Prototyp: Die Vorschau-Schalter des Design-Tools
(`demoDaten`, `startAnsicht`) sind bewusst nicht übernommen. Ergänzt wurden
Tastatur-Fokusringe, ARIA-Beschriftungen und einige dezente Hover-Zustände, die
das Prototyp-Format nicht ausdrücken konnte.
