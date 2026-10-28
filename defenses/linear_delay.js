// Lineare Verzögerung (3.1a): Vor JEDEM Versuch wird eine feste Zeit gewartet
// (hier 0,5 Sekunden). Die Wartezeit bleibt immer gleich (darum "linear").
// Für einen echten Nutzer kaum spürbar, aber ein Angreifer kann pro Sekunde nur
// noch wenige Passwörter testen -> automatisiertes Durchprobieren wird ausgebremst.

const { login } = require("../common/login");

const DELAY_MS = 500; // feste Wartezeit pro Versuch (Vorgabe: 0,5 - 2 Sekunden)

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Legt sich um login() und wartet vor jedem Versuch DELAY_MS Millisekunden
function withLinearDelay(loginFn) {
  return async function (username, password) {
    await sleep(DELAY_MS);
    return loginFn(username, password);
  };
}

// --- Demo: drei falsche Versuche, dann der richtige ----------------------
async function demo() {
  const protectedLogin = withLinearDelay(login);
  const start = Date.now();

  for (const pw of ["wrong1", "wrong2", "wrong3", "monkey"]) {
    const ok = await protectedLogin("admin", pw);
    console.log(`Versuch "${pw}" ->`, ok ? "ERFOLG" : "falsch");
  }

  // 4 Versuche * 0,5 s = ~2 Sekunden -> zeigt die eingebaute Bremse
  console.log("Gesamtdauer:", (Date.now() - start) / 1000, "Sekunden");
}

demo();

module.exports = { withLinearDelay };
