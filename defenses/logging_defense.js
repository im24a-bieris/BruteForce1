// Logging + Alarm (3.3): Jeder Fehlversuch wird mit Zeitstempel und Benutzername
// in logs/login_attempts.csv protokolliert. Gibt es innerhalb von 60 Sekunden
// mindestens 3 Fehlversuche desselben Benutzers, wird ein ALARM ausgegeben.
// Diese Verteidigung SPERRT nicht – sie meldet nur auffällige Aktivität.

const fs = require("fs");
const path = require("path");
const { login } = require("../common/login");

const LOG_FILE = "logs/login_attempts.csv";
const WINDOW_MS = 60 * 1000;
const ALARM_THRESHOLD = 3;

function logFailure(username) {
  fs.mkdirSync(path.dirname(LOG_FILE), { recursive: true });
  const line = `${new Date().toISOString()},${username}\n`;
  fs.appendFileSync(LOG_FILE, line);
}

function withLogging(loginFn) {
  const recentFailures = []; // Zeitstempel (ms) der letzten Fehlversuche

  return function (username, password) {
    const ok = loginFn(username, password);

    if (!ok) {
      const now = Date.now();
      logFailure(username);
      recentFailures.push(now);

      // nur Fehlversuche innerhalb des Zeitfensters behalten
      while (recentFailures.length && now - recentFailures[0] > WINDOW_MS) {
        recentFailures.shift();
      }

      if (recentFailures.length >= ALARM_THRESHOLD) {
        console.log(`ALARM: ${recentFailures.length} Fehlversuche für "${username}" in < 60s!`);
      }
    }

    return ok;
  };
}

// --- Demo: 3 falsche Versuche lösen den Alarm aus, danach klappt der Login -
function demo() {
  const protectedLogin = withLogging(login);

  for (const pw of ["wrong1", "wrong2", "wrong3"]) {
    console.log(`Versuch "${pw}" ->`, protectedLogin("admin", pw) ? "ERFOLG" : "falsch");
  }
  console.log(`Versuch "monkey" ->`, protectedLogin("admin", "monkey") ? "ERFOLG" : "falsch");
  console.log("Protokoll geschrieben nach:", LOG_FILE);
}

demo();

module.exports = { withLogging };
