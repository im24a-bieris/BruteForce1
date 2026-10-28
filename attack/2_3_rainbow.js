// Rainbow-Table-Angriff (2.3a, Teil 2): OFFLINE. Statt Hashes selbst zu
// berechnen, schlägt der Angriff den gestohlenen Hash einfach in der zuvor
// gebauten Tabelle (data/rainbow_table.csv) nach.
//
// Zuerst die Tabelle bauen:  node scripts/build_rainbow.js

const fs = require("fs");
const { TARGET_HASH } = require("../common/target");

const start = Date.now();

// Tabelle einlesen und in ein Nachschlage-Objekt { hash: klartext } umwandeln
const table = {};
const content = fs.readFileSync("data/rainbow_table.csv", "utf8");
for (const line of content.split(/\r?\n/)) {
  if (line.length === 0) continue;
  const [hash, plaintext] = line.split(",");
  table[hash] = plaintext;
}

console.log("Gesuchter Hash:", TARGET_HASH);

// Reines Nachschlagen – keine Hash-Berechnung mehr
const found = table[TARGET_HASH];
const seconds = (Date.now() - start) / 1000;

if (found !== undefined) {
  console.log("Passwort gefunden:", found);
} else {
  console.log("Hash nicht in der Tabelle (Passwort ausserhalb des Suchraums).");
}
console.log("Dauer:", seconds, "Sekunden");
