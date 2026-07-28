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

## Der Abend im Ablauf

1. **Bereich wählen** – in welchem Lebensbereich gab es heute einen Erfolg?
2. **Durchlauf** für genau diesen Bereich: Erfolg → fünf Ebenen → Warum (mit
   eingeblendetem Leitziel) → Ausweiten → Next Steps.
3. **Noch ein Bereich?** Beliebig viele weitere Durchläufe; bereits reflektierte
   Bereiche sind in der Auswahl markiert und lassen sich erneut öffnen.
4. **Die Hiebe** – einmal für den ganzen nächsten Tag, höchstens fünf, mindestens
   einer. Die Next Steps aller Durchläufe stehen als Vorlage bereit.
5. **Abschluss** – alles wird als *ein* Tageseintrag gespeichert.

Alles daraus bleibt änderbar: Ein Abend im Rückblick öffnet denselben Ablauf
erneut, einzelne Durchläufe lassen sich entfernen, Hiebe bearbeiten.

## Aufbau

```
index.html            Einstiegspunkt, Schriften, Meta-Daten
src/
  App.tsx             Rahmen: Ansichtszustand, Verteilung auf die vier Bereiche
  styles.css          Design-Tokens (Farben, Schriften) und alle Komponenten-Styles
  lib/
    types.ts          Datenmodell (Area, AreaReflection, Hieb, Entry …)
    constants.ts      Vorschlagsbereiche, die fünf Leitfragen, Grenzwerte
    factories.ts      Leere Reflexion, leerer Hieb, leerer Entwurf
    date.ts           Lokales Datum, deutsche Formate, Wochenschlüssel, Streak
    storage.ts        Laden, Speichern und Migration alter Datenstände
    store.ts          Zustand und alle schreibenden Aktionen (`useStore`)
    selectors.ts      Ableitungen: Sortierung, Statistiken, Bereichsnamen
  components/
    SetupScreen.tsx   Einmalige Einrichtung der fünf Leitziele
    AppHeader.tsx     Titel, Streak-Anzeige, Navigation
    ConfirmDialog.tsx Rückfrage vor unwiderruflichen Schritten
    reflect/          Auftakt, Bereichswahl, Durchlauf, Zwischenfrage, Hiebe, Abschluss
    MorgenView.tsx    Tagesliste: Hiebe plus ergänzte To-dos
    RueckblickView.tsx Auswertungen, Filter, Archiv
    EntryCard.tsx     Ein Abend im Archiv, Bereiche einzeln aufklappbar
    ZieleView.tsx     Lebensbereiche und Ziele verwalten
```

## Daten

Alles liegt unter einem Schlüssel (`abendstratege-v1`) im `localStorage`:
Lebensbereiche samt Leitziel, alle Abende (ein Eintrag pro Tag, mit beliebig
vielen Bereichs-Reflexionen, einer gemeinsamen Hieb-Liste und einer optionalen
Erkenntnis) sowie die begonnene, noch nicht abgeschlossene Reflexion. Der
Entwurf wird bei jeder Eingabe gesichert – ein geschlossener Tab kostet keinen
Satz.

**Migration:** Datenstände aus der ersten Fassung (ein Erfolg pro Abend plus
„weitere Erfolge“ in Kurzform) werden beim Laden automatisch in das neue Format
überführt: Der Haupterfolg wird zur ersten Bereichs-Reflexion, jeder weitere
Erfolg zu einer eigenen. Nichts geht verloren. Die entfernte „Erfolgsformel“
bleibt als `legacyFormula` unangetastet im Speicher liegen, statt gelöscht zu
werden.

**Gelöschte Lebensbereiche** werden archiviert, sobald ein Eintrag auf sie zeigt;
alte Abende bleiben lesbar und weisen den Bereich als „Archiviert: …“ aus. Nur
nie benutzte Bereiche verschwinden vollständig.

Abweichungen vom ursprünglichen Prototyp: Die Vorschau-Schalter des Design-Tools
(`demoDaten`, `startAnsicht`) sind nicht übernommen. Ergänzt wurden
Tastatur-Fokusringe, ARIA-Beschriftungen und einige dezente Hover-Zustände, die
das Prototyp-Format nicht ausdrücken konnte.
