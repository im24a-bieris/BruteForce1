// Counter-Limit (3.2a): Fehlversuche werden gezählt. Nach einer bestimmten Anzahl
// wird der Benutzer GESPERRT und sogar das richtige Passwort wird nicht mehr
// akzeptiert. So kann ein Angreifer nicht endlos weiterraten.

const { login } = require("../common/login");

const MAX_ATTEMPTS = 3; // so viele Fehlversuche sind erlaubt, dann Sperre

// Legt sich um login() und zählt die Fehlversuche pro Benutzer
function withCounterLimit(loginFn) {
  const failures = {}; // { admin: 2 } -> Anzahl Fehlversuche je Benutzer
  const locked = {};   // { admin: true } -> ist der Benutzer gesperrt?

  return function (username, password) {
    // schon gesperrt? -> gar nicht erst prüfen
    if (locked[username]) {
      console.log(`"${username}" ist gesperrt (zu viele Fehlversuche).`);
      return false;
    }

    const ok = loginFn(username, password);

    if (ok) {
      failures[username] = 0; // Erfolg -> Zähler zurücksetzen
      return true;
    }

    // falsch -> hochzählen und bei Erreichen des Limits sperren
    failures[username] = (failures[username] || 0) + 1;
    if (failures[username] >= MAX_ATTEMPTS) {
      locked[username] = true;
    }
    return false;
  };
}

// --- Demo: 3 falsche Versuche sperren den Benutzer -----------------------
function demo() {
  const protectedLogin = withCounterLimit(login);

  for (const pw of ["wrong1", "wrong2", "wrong3"]) {
    console.log(`Versuch "${pw}" ->`, protectedLogin("admin", pw) ? "ERFOLG" : "falsch");
  }
  // jetzt gesperrt: selbst das richtige Passwort wird abgelehnt
  console.log(`Versuch "monkey" ->`, protectedLogin("admin", "monkey") ? "ERFOLG" : "falsch");
}

demo();

module.exports = { withCounterLimit };
