# BruteForce1

Lerndemo für das Modul 347. Sie zeigt an einem **bewusst verwundbaren** Login-Server,
wie ein Brute-Force- und ein Wörterbuch-Angriff funktionieren und warum ein gutes
Wörterbuch schwache Passwörter oft schneller findet als blosses Durchprobieren.

> ⚠️ Nur für die lokale Nutzung auf `localhost` zu Lernzwecken. Niemals gegen fremde
> Systeme einsetzen.

## Voraussetzungen

- Node.js (mit `fetch`, also Node 18 oder neuer)
- Abhängigkeiten installieren:

```bash
npm install
```

## Projektstruktur

| Pfad                        | Zweck                                                              |
| --------------------------- | ----------------------------------------------------------------- |
| `vulnerable/server.js`      | Login-Server mit Klartext-Passwortvergleich (die Schwachstelle).  |
| `secure/server.js`          | Abgesicherter Login-Server (Hashing, Lockout, Verzögerung).       |
| `attack/2_1_bruteforce.js`  | Brute-Force: probiert Zeichenkombinationen durch.                 |
| `attack/2_2_dictionary.js`  | Wörterbuch-Angriff (2.2): Wörter aus `data/dictionary.txt` + Varianten aus Opferdaten. |
| `attack/2_2_polyalphabet.js`| Poly-Alphabet-Angriff (2.2): voller Zeichensatz (a–z, A–Z, 0–9, Sonderzeichen). |
| `data/users.json`           | Zugangsdaten des verwundbaren Servers (`admin`/`monkey`, `test`/`a7`). |
| `data/users.secure.json`    | Zugangsdaten des sicheren Servers (scrypt-Hash + Salt).           |
| `data/dictionary.txt`       | Liste häufiger Passwörter.                                         |

## Ausführen

Immer **aus dem Projekt-Stammverzeichnis** starten (der Wörterbuch-Angriff liest
`data/dictionary.txt` relativ zum aktuellen Verzeichnis).

1. Server in einem Terminal starten:

   ```bash
   npm run server
   ```

   Läuft auf <http://localhost:3000>.

2. In einem zweiten Terminal einen Angriff starten:

   ```bash
   npm run bruteforce    # 2.1 Mono-Alphabet (nur a–z)
   npm run dictionary    # 2.2 Wörterbuch + Opferdaten-Varianten
   npm run poly          # 2.2 Poly-Alphabet: voller Zeichensatz, Ziel-Benutzer `test`
   ```

## Erwartetes Ergebnis

- **Wörterbuch** findet das Passwort `monkey`, weil es in `data/dictionary.txt` steht.
- **Brute-Force** findet es mit den Standardwerten *nicht*: Der Zeichensatz ist
  `a–z` und `maxLength = 4`, das Passwort `monkey` hat aber 6 Zeichen.
  Das verdeutlicht, dass ein passendes Wörterbuch dem reinen Durchprobieren oft
  überlegen ist.
- **Poly-Alphabet** nutzt den vollen Zeichensatz (a–z, A–Z, 0–9, Sonderzeichen) und
  findet das kurze Passwort `a7` des Benutzers `test`. Weil der Suchraum pro Stelle
  viel grösser ist, ist `maxLength` hier klein gehalten – das zeigt, wie stark mehr
  Zeichen den Aufwand in die Höhe treiben.

## Sicherer Server (Gegenmassnahmen)

`secure/server.js` läuft auf <http://localhost:3001> und zeigt, wie man dieselben
Angriffe abwehrt:

```bash
npm run server:secure
```

Umgesetzte Massnahmen:

- **Passwort-Hashing** – gespeichert wird nur ein `scrypt`-Hash mit Salt
  (`data/users.secure.json`), kein Klartext. Ein Datenleck gibt die Passwörter
  nicht preis.
- **Rate-Limiting / Lockout** – nach 5 Fehlversuchen pro Benutzername wird
  für 15 Minuten gesperrt (Antwort `429`). Das stoppt die Angriffsschleifen.
- **Feste Verzögerung** – jeder Versuch dauert mindestens 500 ms, was
  automatisiertes Durchprobieren stark ausbremst.
- **Unspezifische Fehlermeldung** – verrät nicht, ob der Benutzername existiert.
- **Logging + Alarm** – jeder Fehlversuch wird mit Zeitstempel und Benutzername in
  `logs/login_attempts.csv` protokolliert. Häufen sich 3 Fehlversuche desselben
  Benutzers innerhalb von 60 Sekunden, gibt der Server eine `[ALARM]`-Warnung aus.

Lässt man `npm run dictionary` gegen den sicheren Server laufen (URL im Skript auf
Port `3001` anpassen), bricht der Angriff nach wenigen Versuchen am Lockout ab.
