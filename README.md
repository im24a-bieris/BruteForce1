# BruteForce1

Projekt für **M183 / LU02f – LB2**, Fokusthema **Brute-Force**. Es zeigt an einem
bewusst verwundbaren Login-System verschiedene **Angriffe** (2.1–2.3) und
**Gegenmassnahmen** (3.1–3.3). Kein Frontend – alles läuft über die Kommandozeile.

> ⚠️ Nur lokal auf `localhost` zu Lernzwecken. Niemals gegen fremde Systeme einsetzen.

## Voraussetzungen

- Node.js 18+ (nutzt `fetch`, `worker_threads`, `crypto`)
- Abhängigkeiten installieren: `npm install`

Immer **aus dem Projekt-Stammverzeichnis** starten (einige Skripte lesen Dateien
aus `data/` relativ zum aktuellen Verzeichnis).

## Abdeckung der Bewertung

| Rubrik | Variante | Datei | Start |
| --- | --- | --- | --- |
| 2.1 Angriff | Mono-Alphabet | `attack/2_1_bruteforce.js` | `npm run bruteforce` |
| 2.2 Angriff | Dictionary (+ Permutationen) | `attack/2_2_dictionary.js` | `npm run dictionary` |
| 2.2 Angriff | Poly-Alphabet | `attack/2_2_polyalphabet.js` | `npm run poly` |
| 2.3 Angriff | Rainbow-Table | `attack/2_3_rainbow.js` (+ `scripts/build_rainbow.js`) | `npm run rainbow:build` dann `npm run rainbow` |
| 2.3 Angriff | Parallelisiert | `attack/2_3_parallel.js` | `npm run parallel` |
| 3.1 Verteidigung | Linear Delay | `secure/server.js` (500 ms pro Versuch) | `npm run server:secure` |
| 3.1 Verteidigung | Progressive Delay | `defenses/progressive_delay.js` | `npm run defense:progressive` |
| 3.2 Verteidigung | Counter-Limit | `secure/server.js` (Sperre nach 5 Versuchen) | `npm run server:secure` |
| 3.2 Verteidigung | Captcha | `defenses/captcha.js` | `npm run defense:captcha` |
| 3.3 Verteidigung | Logging + Alarm | `defenses/logging_defense.js` (auch im `secure/server.js`) | `npm run defense:logging` |

Jeder Angriff und jede Verteidigung liegt in einer eigenen Datei (Rubrik 4.1.4 / 4.2.4).

## Projektstruktur

```
vulnerable/server.js   Verwundbarer Login-Server (Klartext-Vergleich), Port 3000
secure/server.js       Abgesicherter Server (Hashing, Delay, Lockout, Logging), Port 3001
attack/                Ein Skript pro Angriffsvariante
defenses/              Ein Skript pro Verteidigungsvariante (umschliesst common/login.js)
common/                Gemeinsame Hilfen: login.js (simulierter Login), target.js (Offline-Ziel-Hash)
scripts/build_rainbow.js  Baut die Lookup-Tabelle data/rainbow_table.csv
demo/run_demo.js       Startet einen Angriff nach Wahl: node demo/run_demo.js <angriff>
data/                  users.json, users.secure.json, dictionary.txt, victim_profile.json
logs/                  login_attempts.csv (von der Logging-Verteidigung erzeugt)
```

## Angriffe

### 2.1 Mono-Alphabet (`npm run bruteforce`)
Online gegen den Server (Port 3000). Probiert alle Kombinationen aus **einem**
Zeichensatz (nur `a–z`) bis `maxLength = 4`. Findet `monkey` bewusst **nicht**
(6 Zeichen) – zeigt, dass reines Durchprobieren schnell an Grenzen stösst.

### 2.2 Dictionary + Permutationen (`npm run dictionary`)
Online. Testet erst **Permutationen aus persönlichen Daten** des Opfers
(`data/victim_profile.json`: Name, Geburtsjahr, Haustier → z.B. `monkey`,
`monkey1998`, `monkey98`), danach die Wortliste `data/dictionary.txt`. Findet
`monkey` sofort über das Haustier – genau die Schwäche, die dieser Angriff ausnutzt.

### 2.2 Poly-Alphabet (`npm run poly`)
Online. Wie Mono-Alphabet, aber mit **kombiniertem** Zeichensatz
(`a–z`, `A–Z`, `0–9`, Sonderzeichen). Zielt auf den Benutzer `test` mit dem
kurzen Passwort `a7`. `maxLength` ist klein gehalten, weil der Suchraum pro
Stelle viel grösser ist.

### 2.3 Rainbow-Table (`npm run rainbow:build` → `npm run rainbow`)
**Offline.** `scripts/build_rainbow.js` berechnet einmalig alle Hashes für kurze
`a–z`-Passwörter und speichert sie als `hash,klartext` in `data/rainbow_table.csv`.
Der Angriff selbst rechnet nichts mehr, sondern **schlägt den gestohlenen Hash nur
nach** (Ziel-Hash in `common/target.js`, Passwort `cat`).

### 2.3 Parallelisiert (`npm run parallel`)
**Offline.** Teilt den Zeichensatz auf mehrere `worker_threads` auf – jeder Worker
durchsucht nur Passwörter, die mit seinen zugeteilten Anfangsbuchstaben beginnen.
Der erste Treffer stoppt die übrigen Worker.

## Gegenmassnahmen

### 3.1 Linear Delay — `secure/server.js`
Jeder Login-Versuch wartet fest 500 ms → bremst automatisiertes Durchprobieren.

### 3.1 Progressive Delay — `npm run defense:progressive`
Wartezeit wächst pro Fehlversuch: **10 s, dann 1 min, …** (Vorgabe). Für eine
schnelle Demo: `node defenses/progressive_delay.js --fast` (1 s, 2 s, …).

### 3.2 Counter-Limit — `secure/server.js`
Nach 5 Fehlversuchen pro Benutzer 15 Minuten gesperrt (Antwort `429`).

### 3.2 Captcha — `npm run defense:captcha`
Nach 3 Fehlversuchen muss vor jedem weiteren Login eine Rechenaufgabe gelöst
werden. Ein automatisches Skript bleibt daran hängen. (Interaktiv: Eingabe nötig.)

### 3.3 Logging + Alarm — `npm run defense:logging`
Jeder Fehlversuch wird mit Zeitstempel und Benutzername in
`logs/login_attempts.csv` protokolliert. Bei ≥ 3 Fehlversuchen desselben
Benutzers in 60 s wird ein **ALARM** ausgegeben. Dieselbe Logik steckt auch im
`secure/server.js`.

## Sicherer Server im Überblick (`npm run server:secure`, Port 3001)

Bündelt mehrere Massnahmen in einem echten Server: **scrypt-Hashing + Salt**
(`data/users.secure.json`, kein Klartext), **feste Verzögerung**,
**Lockout nach 5 Versuchen**, **Logging + Alarm** und eine **unspezifische
Fehlermeldung** (verrät nicht, ob der Benutzer existiert). Lässt man einen
Online-Angriff gegen Port 3001 laufen (URL im Angriffsskript anpassen), bricht er
am Lockout ab.

## Demo-Starter

```bash
node demo/run_demo.js rainbow     # bruteforce | dictionary | poly | rainbow | parallel
```
