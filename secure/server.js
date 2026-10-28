const express = require("express");
const crypto = require("crypto");
const { setTimeout: sleep } = require("timers/promises"); // sleep(ms) wartet ms Millisekunden
const users = require("../data/users.secure.json"); // [{ username, salt, hash }]

const app = express();
app.use(express.json()); // liest JSON aus dem Request-Body in req.body

// Einstellungen für die Schutzmassnahmen
const MAX_ATTEMPTS = 5; // so viele Fehlversuche sind erlaubt
const LOCK_MS = 15 * 60 * 1000; // danach 15 Minuten gesperrt
const DELAY_MS = 500; // jeder Versuch dauert mindestens 0,5 Sekunden

// Merkt sich pro Benutzername die Anzahl Fehlversuche und bis wann gesperrt ist
const failures = {}; // { admin: { count: 2, lockedUntil: 0 } }

// Passwort hashen (mit dem gespeicherten Salt) und mit dem Hash vergleichen
function passwordIsCorrect(password, user) {
  const hash = crypto.scryptSync(password, user.salt, 64).toString("hex");
  return hash === user.hash;
}

app.post("/login", async (req, res) => {
  const { username, password } = req.body || {};

  // 1) Jeder Versuch wird bewusst verzögert -> bremst das schnelle Durchprobieren
  await sleep(DELAY_MS);

  // 2) Fehlversuche für diesen Benutzer holen (oder neu anlegen)
  if (!failures[username]) {
    failures[username] = { count: 0, lockedUntil: 0 };
  }
  const record = failures[username];

  // 3) Ist der Benutzer gerade gesperrt?
  if (Date.now() < record.lockedUntil) {
    return res.status(429).json({ success: false, message: "Zu viele Versuche. Bitte später erneut." });
  }

  // 4) Passwort prüfen
  const user = users.find((u) => u.username === username);
  if (user && passwordIsCorrect(password, user)) {
    record.count = 0; // Erfolg -> Zähler zurücksetzen
    return res.status(200).json({ success: true });
  }

  // 5) Falsch -> Fehlversuch zählen und bei zu vielen sperren
  record.count = record.count + 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = Date.now() + LOCK_MS;
  }

  return res.status(401).json({ success: false, message: "Login fehlgeschlagen" });
});

app.listen(3001, () => {
  console.log("Sicherer Server läuft auf http://localhost:3001");
});
