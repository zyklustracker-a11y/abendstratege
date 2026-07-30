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
lauffähige Web-App umgesetzt: **Vite + React + TypeScript**. Anmeldung über
Google, Daten pro Konto in Firestore, Abend-Erinnerung als echte
Push-Benachrichtigung.

**Erstinbetriebnahme: siehe [SETUP.md](SETUP.md).** Ohne die Werte aus dem
Firebase-Projekt zeigt die App statt des Anmeldebildschirms einen Hinweis.

## Loslegen

```bash
npm install
npm run dev        # Entwicklungsserver (http://localhost:5173)
npm run build      # Produktionsbuild nach dist/
npm run preview    # Build lokal prüfen
npm test           # Terminlogik des Versands + Sicherheitsregeln
npm run icons      # Icons aus assets/icon.svg neu erzeugen
```

## Dienste und Kosten

Alles läuft im dauerhaft kostenlosen Rahmen, ohne hinterlegte Zahlungsmethode:

| Baustein | Dienst | Kostenloses Kontingent |
| --- | --- | --- |
| Anmeldung | Firebase Authentication (Spark) | unbegrenzt für Google-Login |
| Datenbank | Cloud Firestore (Spark) | 1 GiB, 50 000 Lesevorgänge und 20 000 Schreibvorgänge pro Tag |
| Hosting | Firebase Hosting (Spark) | 10 GB Speicher, 360 MB Auslieferung pro Tag |
| Push-Zustellung | Web Push über Apple/Google/Mozilla | kostenlos, kein Konto nötig |
| Zeitplan | GitHub Actions (`.github/workflows/reminder.yml`) | unbegrenzt bei öffentlichen Repos |

Bewusst **nicht** verwendet: Firebase Cloud Functions. Die setzen den
Blaze-Tarif und damit eine hinterlegte Zahlungsmethode voraus. Der geplante
Job im Repo übernimmt ihre Aufgabe vollständig.

## Veröffentlichung

`.github/workflows/deploy.yml` baut die App bei jedem Push auf `main` und lädt
sie zu Firebase Hosting. Firebase Hosting statt GitHub Pages, weil es den
Anmelde-Helfer unter `/__/auth/` auf derselben Domain ausliefert – ohne das
funktioniert die Google-Weiterleitung auf dem iPhone im Homescreen-Modus nicht
zuverlässig. Außerdem liegt die App unter der Wurzel, sodass der Service Worker
ohne Pfadkorrekturen für die ganze Anwendung zuständig ist.

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
index.html            Einstiegspunkt, Schriften, Icons, iOS-Meta-Daten
assets/icon.svg       Quelle aller Icons – Messing-Monogramm auf dunklem Grund
public/               Icons, Manifest, Service Worker (unverändert ausgeliefert)
  sw.js               Push-Empfang, Klickverhalten, schlichter Offline-Fallback
firestore.rules       Sicherheitsregeln: jedes Konto sieht nur seinen Zweig
firebase.json         Hosting-Konfiguration samt Cache-Regeln
src/
  App.tsx             Anmelde-Weiche, Ansichtszustand, Verteilung auf die Bereiche
  styles.css          Design-Tokens (Farben, Schriften) und alle Komponenten-Styles
  lib/
    types.ts          Datenmodell (Area, AreaReflection, Hieb, Entry, Reminder …)
    constants.ts      Vorschlagsbereiche, die fünf Leitfragen, Grenzwerte
    factories.ts      Leere Reflexion, leerer Hieb, leerer Entwurf
    date.ts           Lokales Datum, deutsche Formate, Wochenschlüssel, Streak
    storage.ts        Einlesen, Migration alter Stände, lokaler Spiegel
    firebase.ts       Zugriff auf Auth und Firestore
    firebase-config.ts Die einzutragenden Projektwerte (nicht geheim)
    auth.ts           Google-Anmeldung, Popup bzw. Weiterleitung je nach Gerät
    remote.ts         Lesen und Schreiben in Firestore, Abgleich der Änderungen
    push.ts           Berechtigung, Push-Abo, Geräteverwaltung
    platform.ts       Was Benachrichtigungen auf diesem Gerät im Weg steht
    store.ts          Zustand und alle schreibenden Aktionen (`useStore`)
    selectors.ts      Ableitungen: Sortierung, Statistiken, Bereichsnamen
  components/
    LoginScreen.tsx   Anmeldung mit Google
    SettingsView.tsx  Konto, Abend-Erinnerung, Gerätestatus
    SyncBadge.tsx     Dezenter Hinweis auf Speichern, Offline, Fehler
    SetupScreen.tsx   Einmalige Einrichtung der fünf Leitziele
    AppHeader.tsx     Titel, Streak-Anzeige, Navigation, Zahnrad
    ConfirmDialog.tsx Rückfrage vor unwiderruflichen Schritten
    reflect/          Auftakt, Bereichswahl, Durchlauf, Zwischenfrage, Hiebe, Abschluss
    MorgenView.tsx    Tagesliste: Hiebe plus ergänzte To-dos
    RueckblickView.tsx Auswertungen, Filter, Archiv
    EntryCard.tsx     Ein Abend im Archiv, Bereiche einzeln aufklappbar
    ZieleView.tsx     Lebensbereiche und Ziele verwalten
scripts/
  send-reminders.mjs  Versand der Abend-Erinnerungen (läuft in GitHub Actions)
  schedule.mjs        Wann ist eine Erinnerung fällig – reine Funktionen
  test-schedule.mjs   Prüfung der Zeitzonen- und Terminlogik
  test-rules.mjs      Prüfung der Sicherheitsregeln gegen den Emulator
  make-icons.mjs      Erzeugt alle Icon-Größen aus assets/icon.svg
```

## Daten

Pro Konto in Firestore, getrennt nach Änderungshäufigkeit:

```
users/{uid}                       Lebensbereiche, Ziele, Einstellungen, Entwurf
users/{uid}/entries/{YYYY-MM-DD}  ein Dokument pro Abend
users/{uid}/devices/{geraeteId}   Push-Abo je Gerät
```

Ein Abend als eigenes Dokument statt alles in einem: So bleibt jede Änderung
ein kleiner Schreibvorgang, und der Stand wächst nicht gegen das
Dokumentenlimit von 1 MiB.

Geschrieben wird verzögert und gebündelt – erst nach einer kurzen Tippause, und
auch dann nur für die Dokumente, die sich wirklich verändert haben. Der Entwurf
wird bei jeder Eingabe fortgeschrieben; ohne diesen Abgleich wären das pro Abend
hunderte überflüssige Schreibvorgänge. Parallel liegt ein Spiegel im
`localStorage`, damit die App auch ohne Verbindung sofort mit Inhalt dasteht.

**Übernahme lokaler Daten:** Beim ersten Anmelden eines Kontos wird ein
vorhandener Stand aus `abendstratege-v1` automatisch übernommen. Der lokale
Schlüssel bleibt unangetastet liegen – er dient weiterhin als Sicherheitsnetz.

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

## Abend-Erinnerung

Der Versand läuft serverseitig und hängt nicht daran, dass die App offen ist.
`.github/workflows/reminder.yml` startet `scripts/send-reminders.mjs` alle
15 Minuten. Der Job prüft je Konto, ob die eingestellte Uhrzeit in der jeweiligen
Zeitzone erreicht ist, überspringt Abende mit bereits abgeschlossener Reflexion,
stellt an alle hinterlegten Geräte zu und räumt abgelaufene Abos weg. Ein
Nachlauf von 90 Minuten fängt verspätete Cron-Läufe ab; nach Mitternacht wird
nichts mehr nachgereicht.

Der enge Takt ist der Grund, warum beliebige Uhrzeiten und Zeitzonen mit einem
einzigen Zeitplan funktionieren.

**Web Push auf dem iPhone** ist an drei Bedingungen geknüpft: iOS 16.4 oder
neuer, die Seite muss über Safari mit „Zum Home-Bildschirm“ installiert sein,
und die Berechtigung lässt sich erst aus der installierten App heraus erteilen.
Im normalen Safari-Tab fehlt die Schnittstelle vollständig. Die App prüft das
und nennt in den Einstellungen den jeweils passenden Ausweg, statt den Schalter
wirkungslos anzubieten.

Zum Prüfen ohne Warten auf den Abend:

- **Auf diesem Gerät:** Einstellungen → „Testbenachrichtigung senden“. Zeigt die
  Meldung sofort über den Service Worker an – prüft Berechtigung und Darstellung.
- **Über den echten Weg:** GitHub → Actions → „Abend-Erinnerung“ → „Run
  workflow“ mit Modus `test`. Das geht denselben Weg wie abends um 21:00 Uhr,
  ignoriert aber Uhrzeit und Tagesstand.

### Wenn nichts ankommt

In dieser Reihenfolge – die ersten beiden Punkte erklären die meisten Fälle:

1. **Lief der Job überhaupt?** GitHub → Actions → „Abend-Erinnerung“. Drei
   Eigenheiten geplanter Workflows sind hier üblich: Sie laufen nur auf dem
   Standard-Branch; GitHub schaltet sie nach längerer Inaktivität im Repository
   von selbst ab (die Actions-Seite bietet dann „Enable workflow“ an); und ein
   `*/15`-Takt wird auf geteilten Runnern zu Stoßzeiten verzögert oder ganz
   übersprungen. Jeder Lauf schreibt inzwischen eine Zusammenfassung – geprüfte
   Konten, fällige, zugestellte, entfernte Abos, Fehler mit Statuscode – und
   schlägt fehl, wenn niemand erreicht wurde. Ein Lauf ohne Konto mit aktiver
   Erinnerung gilt ebenfalls als Fehler; wer die Erinnerung bewusst abschaltet,
   sieht den Job also rot.
2. **Kam der Lauf zu spät?** `NACHLAUF_MINUTEN` in `scripts/schedule.mjs` steht
   auf 90. Ein Lauf danach stellt nichts mehr zu – in der Zusammenfassung steht
   das jetzt als „Nachlauf vorbei“.
3. **Steht die Erinnerung serverseitig auf aktiv?** Einstellungen → „Diagnose“
   zeigt Berechtigung, Installationszustand, Uhrzeit, Zeitzone, Anzahl der
   Geräte und den letzten Versandvermerk. In der Firestore-Konsole liegen
   dieselben Werte unter `users/{uid}.reminder`. Der Versand filtert über
   `where('reminder.enabled', '==', true)`: Fehlt das Feld oder ist es anders
   geschrieben, wird das Konto nie gefunden.
4. **Gibt es ein Gerät im Verteiler?** `users/{uid}/devices` braucht mindestens
   ein Dokument mit `endpoint` und beiden Schlüsseln; die Diagnose zeigt die
   Anzahl. Auf dem iPhone entsteht es nur, wenn die App über „Zum
   Home-Bildschirm“ installiert ist **und** die Berechtigung aus dieser
   installierten App heraus erteilt wurde. Apple entwertet Abos außerdem still,
   wenn eine App lange nicht geöffnet wurde – dann hilft nur, die Erinnerung
   einmal aus- und wieder einzuschalten.
5. **Stimmt die Zeitzone?** Weicht die Zeitzone des Geräts von der gespeicherten
   ab, weist die Diagnose darauf hin und bietet an, sie zu übernehmen. Das ist
   der häufigste Grund für eine Erinnerung zur falschen Stunde.
6. **Passen die VAPID-Schlüssel zusammen?** Der öffentliche Schlüssel in
   `src/lib/firebase-config.ts` und das Paar in den GitHub-Secrets müssen aus
   demselben Satz stammen. Sonst lehnt der Push-Dienst mit 403 ab; der
   Statuscode steht in der Zusammenfassung des Laufs, mit ausdrücklichem
   Hinweis auf das Schlüsselpaar.

`reminder.lastSentLocalDate` gehört dem Versand-Job. Der Client liest das Feld
(für die Diagnose), schreibt es aber nie – täte er es, überschriebe schon ein
Tastendruck im Entwurf den Vermerk des Jobs mit einem älteren Stand, und die
Erinnerung ginge doppelt raus oder bliebe ganz aus.
