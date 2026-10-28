// Sicherer Login-Server: gleiche Aufgabe, aber mit Schutzmassnahmen gegen
// Brute-Force (Hashing, Verzögerung, Sperre nach zu vielen Fehlversuchen).

const express = require("express");
const crypto = require("crypto"); // eingebautes Modul fürs Hashing
const fs = require("fs"); // zum Schreiben der Log-Datei
const { setTimeout: sleep } = require("timers/promises"); // sleep(ms) wartet ms Millisekunden
const users = require("../data/users.secure.json"); // [{ username, salt, hash }] -> kein Klartext

const app = express();
app.use(express.json()); // JSON aus dem Request-Body in req.body umwandeln

// Einstellungen für die Schutzmassnahmen (zentral, leicht anpassbar)
const MAX_ATTEMPTS = 5;         // so viele Fehlversuche sind erlaubt
const LOCK_MS = 15 * 60 * 1000; // danach 15 Minuten gesperrt (in Millisekunden)
const DELAY_MS = 500;           // jeder Versuch dauert mindestens 0,5 Sekunden
const ALARM_THRESHOLD = 3;          // so viele Fehlversuche in kurzer Zeit lösen Alarm aus
const ALARM_WINDOW_MS = 60 * 1000;  // "kurze Zeit" = 60 Sekunden
const LOG_FILE = "logs/login_attempts.csv";
fs.mkdirSync("logs", { recursive: true }); // Log-Ordner anlegen, falls er fehlt

// merkt sich pro Benutzer die Fehlversuche, bis wann gesperrt und die Zeitpunkte
// der letzten Fehlversuche (für den Alarm). Liegt nur im Arbeitsspeicher.
const failures = {}; // { admin: { count: 2, lockedUntil: 0, times: [] } }

// prüft, ob das Passwort stimmt: eingegebenes Passwort mit demselben Salt hashen
// und mit dem gespeicherten Hash vergleichen. So braucht man kein Klartext-Passwort.
function passwordIsCorrect(password, user) {
  const hash = crypto.scryptSync(password, user.salt, 64).toString("hex");
  return hash === user.hash; // nur bei gleichem Hash war das Passwort richtig
}

// async, weil wir unten mit await auf die Verzögerung (sleep) warten
app.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  // 1) jeden Versuch bewusst verzögern -> bremst schnelles Durchprobieren aus
  await sleep(DELAY_MS);

  // 2) Eintrag für diesen Benutzer holen oder neu anlegen
  if (!failures[username]) {
    failures[username] = { count: 0, lockedUntil: 0, times: [] };
  }
  const record = failures[username];

  // 3) noch gesperrt? -> gar nicht erst das Passwort prüfen, direkt ablehnen
  if (Date.now() < record.lockedUntil) {
    return res.status(429).json({ success: false, message: "Zu viele Versuche. Bitte später erneut." });
  }

  // 4) Passwort prüfen: erst den Benutzer suchen, dann den Hash vergleichen
  const user = users.find((u) => u.username === username);
  if (user && passwordIsCorrect(password, user)) {
    record.count = 0; // Erfolg -> Fehlversuch-Zähler zurücksetzen
    return res.status(200).json({ success: true });
  }

  // 5) falsch -> Fehlversuch zählen und bei zu vielen den Benutzer sperren
  record.count = record.count + 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCK_MS; // Sperre bis jetzt + 15 Minuten
  }

  // 6) Fehlversuch protokollieren (Zeitpunkt + Benutzername) und auf Alarm prüfen
  fs.appendFileSync(LOG_FILE, `${new Date().toISOString()},${username}\n`);
  record.times = record.times.filter((t) => Date.now() - t < ALARM_WINDOW_MS); // nur Versuche im Zeitfenster behalten
  record.times.push(Date.now());
  if (record.times.length >= ALARM_THRESHOLD) {
    console.warn(`[ALARM] ${record.times.length} Fehlversuche für "${username}" in unter 60 Sekunden`);
  }

  // Meldung verrät absichtlich nicht, ob der Benutzername überhaupt existiert
  return res.status(401).json({ success: false, message: "Login fehlgeschlagen" });
});

// Server starten, Port 3001 (anderer Port als der verwundbare Server)
const PORT = process.env.PORT || 3001; // Port notfalls per Umgebungsvariable überschreibbar
app.listen(PORT, () => {
  console.log(`Sicherer Server läuft auf http://localhost:${PORT}`);
});
