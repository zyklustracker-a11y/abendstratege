# Einrichtung – Schritt für Schritt

Diese Anleitung ist für alle Schritte gedacht, die außerhalb des Codes
stattfinden. Der Code ist fertig; er wartet nur noch auf die Werte aus deinem
Firebase-Projekt.

Zeitbedarf: etwa 25 Minuten. Eine Kreditkarte wird an keiner Stelle verlangt –
wenn dich eine Seite nach einer Zahlungsmethode fragt, bist du im falschen
Menü (das passiert nur beim „Blaze“-Tarif, den wir bewusst nicht brauchen).

---

## Was geheim bleiben muss – und was nicht

| Wert | Geheim? | Wohin |
| --- | --- | --- |
| Firebase-Web-Konfiguration (`apiKey`, `appId` …) | **nein** | `src/lib/firebase-config.ts`, darf eingecheckt werden |
| Öffentlicher VAPID-Schlüssel | **nein** | `src/lib/firebase-config.ts` |
| **Privater VAPID-Schlüssel** | **ja** | nur GitHub-Secret `VAPID_PRIVATE_KEY` |
| **Dienstkonto-JSON** | **ja** | nur GitHub-Secret `FIREBASE_SERVICE_ACCOUNT` |

Der `apiKey` sieht geheim aus, ist es aber nicht: Er steht in jeder
Firebase-Web-App offen im Quelltext. Geschützt werden deine Daten durch die
Regeln in `firestore.rules` und durch die Liste erlaubter Domains – nicht durch
Geheimhaltung dieses Schlüssels.

---

## 1. Firebase-Projekt anlegen

1. Öffne <https://console.firebase.google.com> und melde dich mit deinem
   Google-Konto an.
2. **„Projekt hinzufügen“** → Name z. B. `abendstratege` → **Weiter**.
3. Google Analytics: **ausschalten** (brauchen wir nicht) → **Projekt erstellen**.
4. Prüfe unten links: Dort muss **„Spark“** stehen. Das ist der kostenlose
   Tarif ohne Zahlungsmethode. Nicht auf „Blaze“ upgraden.

## 2. Web-App registrieren und Konfiguration abholen

1. Auf der Projekt-Startseite auf das **`</>`-Symbol** („Web“) klicken.
2. Spitzname: `Abendstratege`. Das Häkchen bei „Firebase Hosting einrichten“
   darfst du setzen – schadet nicht.
3. Es erscheint ein Code-Block mit `const firebaseConfig = { … }`.
   **Diesen Block komplett kopieren.**

→ **Schick mir diesen Block**, oder trage die Werte selbst in
`src/lib/firebase-config.ts` ein (dort stehen Platzhalter wie
`HIER_API_KEY_EINTRAGEN`).

Wichtig: Bei `authDomain` später den Wert **`DEIN-PROJEKT.web.app`** eintragen
(nicht `…firebaseapp.com`). Das ist der Grund, warum die Anmeldung auf dem
iPhone im Homescreen-Modus zuverlässig funktioniert.

## 3. Google-Anmeldung aktivieren

1. Links im Menü: **Erstellen → Authentication → Jetzt starten**.
2. Reiter **„Sign-in method“** → **Google** anklicken.
3. Schalter auf **Aktivieren**, eine Support-E-Mail auswählen → **Speichern**.

## 4. Firestore-Datenbank anlegen

1. Links: **Erstellen → Firestore Database → Datenbank erstellen**.
2. Standort: **`eur3 (europe-west)`** → **Weiter**.
3. Regeln: **„Im Produktionsmodus starten“** → **Erstellen**.
   (Die richtigen Regeln kommen in Schritt 5 aus `firestore.rules`.)

## 5. Sicherheitsregeln setzen

1. In der Firestore-Ansicht oben auf den Reiter **„Regeln“**.
2. Den gesamten Inhalt der Datei **`firestore.rules`** aus diesem Repo
   hineinkopieren – das Vorhandene komplett ersetzen.
3. **Veröffentlichen**.

Damit gilt: Jedes Konto kommt ausschließlich an seinen eigenen Zweig.

## 6. Push-Schlüssel (VAPID) erzeugen

Das Schlüsselpaar erzeugst du am einfachsten hier im Repo:

```bash
npx web-push generate-vapid-keys
```

Ausgabe sind zwei Zeilen, `Public Key:` und `Private Key:`.

- Den **Public Key** → in `src/lib/firebase-config.ts` bei `vapidPublicKey`.
- Den **Private Key** → nur in die GitHub-Secrets (Schritt 8). Nirgendwo sonst.

→ **Schick mir den Public Key**, den privaten behältst du.

## 7. Dienstkonto-Schlüssel erzeugen

Dieser Schlüssel erlaubt dem geplanten Job, die Erinnerungen zu verschicken,
und der Veröffentlichung, die App hochzuladen.

1. Firebase-Konsole → **Zahnrad oben links → Projekteinstellungen**.
2. Reiter **„Dienstkonten“** → **„Neuen privaten Schlüssel generieren“** →
   **Schlüssel generieren**. Es lädt eine `.json`-Datei herunter.
3. Diese Datei **nicht** ins Repo legen. Sie kommt gleich in ein GitHub-Secret.

Damit derselbe Schlüssel auch veröffentlichen darf, noch zwei Rollen ergänzen:

4. Öffne <https://console.cloud.google.com/iam-admin/iam> und wähle oben dein
   Projekt aus.
5. Suche die Zeile `firebase-adminsdk-…@dein-projekt.iam.gserviceaccount.com`
   und klicke rechts auf das **Stift-Symbol**.
6. **„Weitere Rolle hinzufügen“** → `Firebase Hosting Admin` auswählen.
7. Noch einmal **„Weitere Rolle hinzufügen“** → `API Keys Viewer` → **Speichern**.

## 8. GitHub-Secrets hinterlegen

Gehe zu
`https://github.com/zyklustracker-a11y/abendstratege/settings/secrets/actions`
und lege über **„New repository secret“** an:

| Name | Inhalt |
| --- | --- |
| `FIREBASE_SERVICE_ACCOUNT` | der **komplette Inhalt** der `.json`-Datei aus Schritt 7 (Datei im Texteditor öffnen, alles kopieren) |
| `VAPID_PRIVATE_KEY` | der Private Key aus Schritt 6 |
| `VAPID_PUBLIC_KEY` | der Public Key aus Schritt 6 |
| `VAPID_SUBJECT` | `mailto:deine@email.de` – Apple verlangt eine Kontaktadresse |

Dann auf den Reiter **„Variables“** daneben, **„New repository variable“**:

| Name | Inhalt |
| --- | --- |
| `FIREBASE_PROJECT_ID` | deine Projekt-ID, z. B. `abendstratege` |

## 9. Veröffentlichen

Sobald die Werte aus Schritt 2 und 6 im Code stehen und der Branch nach `main`
gelaufen ist, veröffentlicht GitHub die App bei jedem Push automatisch.

Den ersten Lauf kannst du von Hand anstoßen:
`https://github.com/zyklustracker-a11y/abendstratege/actions` → links
**„Veröffentlichen“** → rechts **„Run workflow“**.

Deine Adresse lautet danach: **`https://DEIN-PROJEKT.web.app`**

## 10. Adresse als erlaubte Domain eintragen

Ohne diesen Schritt verweigert Google die Anmeldung auf der echten Adresse.

1. Firebase-Konsole → **Authentication → Reiter „Settings“ → „Autorisierte
   Domains“**.
2. **„Domain hinzufügen“** → `DEIN-PROJEKT.web.app`.
3. Das Gleiche noch einmal für `DEIN-PROJEKT.firebaseapp.com`.

## 11. Repo öffentlich schalten (wegen der Erinnerungen)

Der Erinnerungs-Job läuft alle 15 Minuten. Bei **öffentlichen** Repos sind
GitHub Actions unbegrenzt kostenlos, bei privaten gibt es 2 000 Minuten im
Monat – das würde nicht reichen.

- Entweder: `Settings → General → ganz unten „Change repository visibility“ →
  **Public**`. Im Code stehen keine Geheimnisse, die Secrets bleiben auch bei
  einem öffentlichen Repo verborgen.
- Oder: Repo privat lassen und in `.github/workflows/reminder.yml` den Takt auf
  `'*/30 * * * *'` ändern (≈ 1 440 Minuten im Monat, passt gerade so).

---

## Danach: auf dem iPhone einrichten

1. `https://DEIN-PROJEKT.web.app` **in Safari** öffnen (nicht Chrome – auf iOS
   kann nur Safari die App installieren).
2. Unten auf **„Teilen“** (Quadrat mit Pfeil) → **„Zum Home-Bildschirm“** →
   **Hinzufügen**.
3. Die App vom Homebildschirm über das neue Symbol **öffnen**.
4. Mit Google anmelden.
5. **Zahnrad oben rechts → Abend-Erinnerung einschalten** → die Systemfrage mit
   **„Erlauben“** bestätigen.

Erst ab Schritt 3 sind Benachrichtigungen möglich – Apple lässt sie im normalen
Safari-Tab grundsätzlich nicht zu. Die App weist an dieser Stelle selbst darauf
hin.
