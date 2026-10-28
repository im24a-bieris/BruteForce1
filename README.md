# BruteForce1

Unser Projekt für M183 / LU02f (LB2), Thema Brute-Force. An einem absichtlich
unsicheren Login zeigen wir ein paar Angriffe und die passenden Gegenmassnahmen.
Das meiste läuft über die Kommandozeile, dazu gibt es eine kleine Login-Seite.

Nur lokal auf localhost zum Lernen gedacht, nicht gegen fremde Systeme.

## Setup

Node.js 18 oder neuer, dann einmal:

```bash
npm install
```

Die Skripte immer aus dem Projektordner starten, weil einige Dateien aus `data/`
relativ geladen werden.

## Angriffe

Die Online-Angriffe brauchen den laufenden Server (`npm run server`), die
Offline-Angriffe nicht.

- `npm run bruteforce` – Mono-Alphabet (2.1): probiert alle Kombinationen aus
  nur `a-z` durch, bis 4 Zeichen. Findet `monkey` absichtlich nicht (zu lang),
  das zeigt die Grenze vom reinen Durchprobieren.
- `npm run dictionary` – Wörterbuch (2.2): testet zuerst Varianten aus den
  persönlichen Daten in `data/victim_profile.json` (Name, Geburtsjahr, Haustier),
  danach die Liste in `data/dictionary.txt`. Findet `monkey` über das Haustier.
- `npm run poly` – Poly-Alphabet (2.2): wie oben, aber mit allen Zeichen
  (`a-z`, `A-Z`, `0-9`, Sonderzeichen). Knackt den Benutzer `test` mit Passwort `a7`.
- `npm run rainbow:build` und dann `npm run rainbow` – Rainbow-Table (2.3,
  offline): erst werden die Hashes in `data/rainbow_table.csv` berechnet, der
  Angriff schlägt den gestohlenen Hash dann nur noch nach.
- `npm run parallel` – Parallelisiert (2.3, offline): verteilt die Suche auf
  mehrere Worker-Threads, jeder übernimmt einen Teil der Anfangsbuchstaben.

## Gegenmassnahmen

Jede Massnahme hat ihre eigene Datei in `defenses/` mit einer kleinen Demo.

- `npm run defense:linear` – Linear Delay (3.1): wartet vor jedem Versuch 500 ms.
- `npm run defense:progressive` – Progressive Delay (3.1): Wartezeit wird nach
  jedem Fehlversuch länger (10 s, dann 1 min, ...). Mit `--fast` kürzer für die Demo.
- `npm run defense:counter` – Counter-Limit (3.2): nach ein paar Fehlversuchen
  wird der Benutzer gesperrt, danach geht auch das richtige Passwort nicht mehr.
- `npm run defense:captcha` – Captcha (3.2): ab dem 3. Fehlversuch kommt eine
  Rechenaufgabe, an der ein automatisches Skript hängen bleibt.
- `npm run defense:logging` – Logging + Alarm (3.3): schreibt Fehlversuche nach
  `logs/login_attempts.csv` und meldet Alarm bei 3 Versuchen in 60 Sekunden.

Der sichere Server (`npm run server:secure`, Port 3001) fasst mehrere davon
zusammen: scrypt-Hash mit Salt statt Klartext, feste Verzögerung, Sperre nach
5 Versuchen, Logging/Alarm und eine Fehlermeldung, die nicht verrät, ob der
Benutzer existiert.

## Login-Seite

`npm run server` starten und `http://localhost:3000` im Browser öffnen. Mit
`admin` / `monkey` kommt "Eingeloggt!", sonst der Fehlertext. Die Seite schickt
genau dieselbe Anfrage wie die Angriffsskripte.

## Ordner

```
vulnerable/   unsicherer Server (Klartext-Vergleich), Port 3000
secure/       abgesicherter Server, Port 3001
attack/       ein Skript pro Angriff
defenses/     ein Skript pro Gegenmassnahme
common/       login.js (simulierter Login), target.js (Ziel-Hash für offline)
scripts/      build_rainbow.js baut die Lookup-Tabelle
demo/         run_demo.js startet einen Angriff: node demo/run_demo.js <angriff>
data/         Benutzer, Wortliste, Opferprofil
public/       die Login-Seite
```
