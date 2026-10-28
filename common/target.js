const crypto = require("crypto");

// Gemeinsames Angriffsziel für die OFFLINE-Angriffe (Rainbow-Table, parallel).
// Bewusst SHA-256 OHNE Salt und ein kurzes Passwort – so, wie man es für eine
// Übung zu Hash-Angriffen braucht. (Ein echter Server würde das nie so machen.)
const DEMO_PASSWORD = "cat"; // kurz, damit die Demos sofort fertig sind

function sha256(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// Das ist der "gestohlene" Hash, den ein Angreifer z.B. aus einem Leak hätte.
const TARGET_HASH = sha256(DEMO_PASSWORD);

module.exports = { sha256, TARGET_HASH, DEMO_PASSWORD };
