# CLAUDE.md — Projektregeln für den Abendstrategen

Diese Datei gilt für jede Arbeit in diesem Repository. Sie hat Vorrang vor der
`README.md`, wo beide sich widersprechen.

## Was dieses Repo ist — und was es nicht mehr ist

Die `README.md` beginnt mit einem Handoff-Text aus Claude Design („CODING
AGENTS: READ THIS FIRST“). **Diese Phase ist abgeschlossen.** Die App ist
implementiert und im Einsatz. `project/` und `chats/` sind historische
Design-Artefakte:

- **Nicht** aus `project/Der Abendstratege.dc.html` neu implementieren.
- **Nicht** in `project/` oder `chats/` schreiben.
- Sie dürfen als Nachschlagewerk gelesen werden, wenn eine Design-Absicht
  unklar ist. Maßgeblich ist aber der Zustand in `src/`.

Der Abendstratege ist eine deutschsprachige PWA zur Abendreflexion: ein Erfolg
pro Lebensbereich, in fünf Ebenen vertieft, plus höchstens fünf „Hiebe“
(Handlungen) für den nächsten Tag.

## Stack und Befehle

Vite + React 19 + TypeScript, kein State-Framework, kein UI-Framework,
kein CSS-Framework.

```bash
npm run dev         # Entwicklungsserver
npm run build       # tsc -b && vite build
npm run typecheck   # muss vor jedem Abschluss grün sein
npm test            # Terminlogik des Versands + Firestore-Regeln (braucht Emulator)
npm run icons       # Icons aus assets/icon.svg neu erzeugen
```

`npm run typecheck` ist die verbindliche Abnahme. `npm test` deckt
`scripts/schedule.mjs`, die Wochenrechnung in `src/lib/date.ts` und
`firestore.rules` ab — wer an einem davon arbeitet, führt es aus.

`scripts/test-week.mjs` lädt `src/lib/date.ts` direkt über
`node --experimental-strip-types`. Das geht nur, solange die geprüfte Datei
keine Modulimporte ohne Dateiendung hat: Node löst `'./date'` nicht auf, Vite
schon. Wer weitere reine Logik so prüfen will, beachtet das.

## Harte Randbedingungen

1. **Keine neuen Laufzeit-Abhängigkeiten.** Weder in `package.json` noch in
   `scripts/package.json`. Was gebraucht wird, wird geschrieben. Wenn eine
   Aufgabe ohne neue Abhängigkeit wirklich nicht lösbar scheint: erst fragen.
2. **Firebase-Spark-Tarif, keine Zahlungsmethode.** Keine Cloud Functions,
   keine kostenpflichtigen Dienste. Der geplante GitHub-Actions-Job in
   `.github/workflows/reminder.yml` ersetzt sie bewusst.
3. **Schreibsparsamkeit in Firestore.** Der Entwurf wird bei jedem Tastendruck
   fortgeschrieben; nur der Abgleich in `remote.ts` verhindert hunderte
   Schreibvorgänge pro Abend. Wer am Datenmodell arbeitet, prüft, ob eine
   Änderung die Zahl der Schreibvorgänge erhöht — und begründet sie im Kommentar.
4. **Bestandsdaten bleiben unangetastet.** Bestehende Konten dürfen durch eine
   Änderung nie stillschweigend umgeschrieben oder verloren gehen.
5. **Keine Analytics, kein Tracking, keine externen Schriften außer den bereits
   in `index.html` eingebundenen.**

## Aufbau — wo was hingehört

```
src/App.tsx              Anmelde-Weiche + Ansichtszustand (view, stage, runId, runStep …)
src/lib/store.ts         useStore: der gesamte persistierte Zustand + alle schreibenden Aktionen
src/lib/types.ts         Datenmodell
src/lib/storage.ts       Lesen/Parsen/Migrieren beliebiger Stände, lokaler Spiegel
src/lib/remote.ts        Firestore: Laden, Anlegen, differenzielles Schreiben
src/lib/selectors.ts     Reine Ableitungen aus dem Zustand (Statistik, Labels, Sortierung)
src/lib/date.ts          Lokale Datumslogik, deutsche Formate, Streak
src/lib/constants.ts     Texte und Grenzwerte, die an mehreren Stellen gebraucht werden
src/components/          Ansichten; reflect/ enthält die Stufen des Abendablaufs
src/styles.css           Design-Tokens und sämtliche Styles
public/sw.js             Service Worker, wird unverändert ausgeliefert (kein Build-Schritt)
scripts/                 Node-Skripte für GitHub Actions (eigene package.json)
```

**Zustandsregeln:**

- Persistierter Zustand gehört ausschließlich in `useStore`. Komponenten
  bekommen Daten und Callbacks als Props, sie greifen nicht selbst auf
  Firestore zu.
- Ansichtszustand (welche Ansicht, welche Stufe) bleibt bewusst in `App.tsx`
  und wird **nicht** persistiert: Jeder Abend beginnt beim Auftakt.
- Neue Ableitungen gehören als reine Funktion in `selectors.ts`, nicht in die
  Komponente.

## Datenmodell ändern — die drei Stellen

Eine Änderung an `PersistedState`, `Entry`, `AreaReflection`, `Hieb`, `Area`
oder `Reminder` muss durchgezogen werden durch:

1. `src/lib/types.ts` — die Deklaration.
2. `src/lib/storage.ts` — `emptyState()` **und** `readV2()`. Jedes Feld, das
   `readV2` nicht liest, geht beim Laden verloren. Neue optionale Felder mit
   einem sicheren Standardwert lesen; `CURRENT_VERSION` nur erhöhen, wenn eine
   echte Umformung alter Stände nötig ist.
3. `src/lib/remote.ts` — `rootPayload()`, wenn das Feld im Wurzeldokument
   liegt. Was dort fehlt, wird nie geschrieben.

`migrateV1()` beschreibt das allererste Format und ist historisch: Es liest
Stände, die es in freier Wildbahn noch gibt. **Nicht an neue Anforderungen
anpassen.** Es stützt sich dafür auf `LEGACY_V1_AREAS` — die fünf Bereiche der
ersten Fassung, unveränderlich, weil nur unter diesen ids die gespeicherten
Ziele liegen.

`DEFAULT_AREAS` daneben gilt **allein für neu angelegte Konten** und darf in
Länge und Inhalt frei geändert werden; sonst muss dafür nichts angefasst
werden. Bedingungen: ids klein, ohne Umlaute und Leerzeichen, und eine id, die
in `GOAL_PLACEHOLDERS` steht, erbt deren Beispieltext. Für die aktuelle
Vorgabeliste ist bewusst kein Beispielziel hinterlegt — die Formulierung soll
niemandem vorweggenommen werden.

Entscheidend für Bestandskonten ist `readV2()`: Bringt ein Stand eine
Bereichsliste mit, gilt ausschließlich sie — auch wenn sie leer ist. Die
Vorgabewerte greifen nur, wenn das Feld ganz fehlt. Diese Bedingung nicht
aufweichen, sonst schiebt die nächste Änderung an `DEFAULT_AREAS` bestehenden
Konten Bereiche unter.

Ablage in Firestore:

```
users/{uid}                       Bereiche, Ziele, Einstellungen, Entwurf
users/{uid}/entries/{YYYY-MM-DD}  ein Dokument pro Abend
users/{uid}/devices/{geraeteId}   Push-Abo je Gerät
```

Wer eine neue Sammlung oder ein neues Feld ergänzt, prüft `firestore.rules`
und ergänzt bei Bedarf `scripts/test-rules.mjs`.

## Sprache und Ton

- **Oberfläche durchgängig deutsch**, in der Du-Form, knapp und ruhig. Der Ton
  ist nüchtern-anspruchsvoll, nicht motivational-laut. Keine Emoji.
- **Kommentare und Commit-Nachrichten ebenfalls deutsch.**
- Kommentare erklären das **Warum**, nie das Was. Ein Kommentar, der den Code
  wiederholt, wird nicht geschrieben. Die vorhandenen Kommentare sind der
  Maßstab.
- Fachbegriffe bleiben, wie sie sind: *Hieb*, *Lebensbereich*, *Leitziel*,
  *Durchlauf*, *Morgen-Blick*, *Rückblick & Muster*.

## Styles

- Alle Styles zentral in `src/styles.css`. **Keine Inline-Styles**, außer für
  einen berechneten Einzelwert (wie die Balkenbreite in der Statistik). Keine
  CSS-Module, kein Tailwind, keine styled-components.
- Farben, Schriften und Abstände über die Design-Tokens in `:root`
  (`--gold`, `--ink`, `--muted`, `--panel`, `--line`, `--serif`, `--sans` …).
  **Keine rohen Hex-Werte** in neuen Regeln.
- Klassennamen folgen BEM-artig dem Bestand: `.block__element--modifier`.
- Neue Regeln in den passenden, mit `/* ---------- … ---------- */`
  überschriebenen Abschnitt einsortieren, nicht ans Dateiende hängen.
- Zielgerät ist das Handy im Homescreen-Modus. Jede Layout-Änderung wird
  gegen 320 px Breite geprüft, nicht nur gegen den Desktop.
- Es gibt genau zwei Breakpoints: `max-width: 480px` (Handy) und
  `max-width: 400px` (schmales Handy). Keine weiteren erfinden — vorhandene
  mitbenutzen. Media Queries stehen unmittelbar bei den Regeln, die sie
  abwandeln, und arbeiten additiv: Das Desktop-Bild bleibt unverändert.

## Barrierefreiheit

Der Bestand hält ein Niveau, das nicht unterschritten wird: sichtbare
Fokusringe, `aria-label` an Icon-Schaltflächen, `aria-current` an der
Navigation, `aria-pressed` an Filtern, `role="status"` bzw. `role="alert"` an
eingeblendeten Hinweisen, jedes Eingabefeld beschriftet. Neue interaktive
Elemente sind Buttons mit `type="button"`, keine klickbaren `div`s.

## Benachrichtigungen — drei Orte, ein Text

Titel und Text der Erinnerung stehen zwangsläufig dreifach im Repo, weil die
drei Umgebungen sich nichts teilen können:

- `src/lib/constants.ts` — die Testbenachrichtigung in der App
- `public/sw.js` — die Rückfallwerte im Service Worker (kein Build-Schritt)
- `scripts/send-reminders.mjs` — der echte serverseitige Versand

Wer einen davon ändert, ändert alle drei. Der Text soll den App-Namen **nicht**
wiederholen: Das Betriebssystem stellt ihn der Benachrichtigung ohnehin voran.

`reminder.lastSentLocalDate` gehört dem Server. Der Client liest das Feld, aber
`rootPayload()` und `saveReminder()` schreiben es nie — täte der Client es,
überschriebe ein Tastendruck im Entwurf den Vermerk des Versand-Jobs, und die
Erinnerung ginge doppelt raus oder bliebe ganz aus.

## Arbeitsweise

- Vor der Änderung die betroffenen Dateien vollständig lesen. Die Kommentare
  enthalten Entscheidungen, die sich aus dem Code allein nicht ergeben.
- Bestehende Muster übernehmen, statt eigene einzuführen.
- Ein Commit pro abgeschlossenem Anliegen, deutsche Commit-Nachricht im
  Imperativ.
- Nichts still auskommentieren oder entfernen: Wenn etwas wegfällt, gehört der
  Grund in die Commit-Nachricht.
- Am Ende jeder Aufgabe: `npm run typecheck`, und bei Änderungen an
  `scripts/` oder `firestore.rules` zusätzlich `npm test`.
- Diese Datei aktuell halten, wenn sich eine Regel oder der Aufbau ändert.
