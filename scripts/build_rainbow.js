// Baut die Rainbow-Table (2.3a, Teil 1): berechnet EINMALIG die Hashes für
// alle kurzen Kleinbuchstaben-Passwörter und speichert sie als
// "hash,klartext" in data/rainbow_table.csv. Der eigentliche Angriff
// (attack/2_3_rainbow.js) rechnet danach nichts mehr, sondern schlägt nur nach.

const fs = require("fs");
const { sha256 } = require("../common/target");

const charset = "abcdefghijklmnopqrstuvwxyz";
const maxLength = 3; // kleiner Suchraum, damit die Tabelle schnell gebaut ist

const lines = [];

// Alle Kombinationen aufbauen und jeweils eine Zeile "hash,klartext" schreiben
function build(prefix, length) {
  if (prefix.length === length) {
    lines.push(sha256(prefix) + "," + prefix);
    return;
  }
  for (const char of charset) {
    build(prefix + char, length);
  }
}

for (let length = 1; length <= maxLength; length++) {
  build("", length);
}

fs.writeFileSync("data/rainbow_table.csv", lines.join("\n") + "\n");
console.log("Rainbow-Table gebaut:", lines.length, "Einträge -> data/rainbow_table.csv");
