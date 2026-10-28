// Progressive Verzögerung (3.1b): Nach jedem Fehlversuch wird die Wartezeit
// LÄNGER. Gemäss Vorgabe: 1. Fehlversuch -> 10 Sekunden, dann 1 Minute, usw.
// Ein Angreifer wird so mit jedem Versuch stärker ausgebremst, ein echter
// Nutzer mit korrektem Passwort kaum gestört.
//
// Wartezeiten laut Vorgabe (in Sekunden): [10, 60, 300, ...].
// Mit dem Flag "--fast" werden kurze Zeiten benutzt, damit die Demo schnell läuft:
//   node defenses/progressive_delay.js          -> echte Zeiten (10s, 60s, ...)
//   node defenses/progressive_delay.js --fast    -> kurze Zeiten (1s, 2s, ...)

const { login } = require("../common/login");

const fast = process.argv.includes("--fast");
const DELAYS_S = fast ? [1, 2, 4, 8] : [10, 60, 300, 600]; // Sekunden pro Fehlversuch-Stufe

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Legt sich um login() und wartet vor jedem weiteren Fehlversuch länger
function withProgressiveDelay(loginFn) {
  let failures = 0;

  return async function (username, password) {
    if (failures > 0) {
      // letzte Stufe wiederholen, falls es mehr Fehlversuche als Stufen gibt
      const waitS = DELAYS_S[Math.min(failures - 1, DELAYS_S.length - 1)];
      console.log(`Warte ${waitS}s wegen ${failures} Fehlversuch(en) ...`);
      await sleep(waitS * 1000);
    }

    const ok = loginFn(username, password);
    failures = ok ? 0 : failures + 1; // bei Erfolg Zähler zurücksetzen
    return ok;
  };
}

// --- Demo: drei falsche Versuche, dann der richtige -----------------------
async function demo() {
  const protectedLogin = withProgressiveDelay(login);
  const start = Date.now();

  for (const pw of ["wrong1", "wrong2", "wrong3", "monkey"]) {
    const ok = await protectedLogin("admin", pw);
    console.log(`Versuch "${pw}" ->`, ok ? "ERFOLG" : "falsch");
  }

  console.log("Gesamtdauer:", (Date.now() - start) / 1000, "Sekunden");
}

demo();

module.exports = { withProgressiveDelay };
