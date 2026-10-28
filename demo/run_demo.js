// Kleiner Demo-Starter: wählt per Kommandozeile einen Angriff aus und führt ihn
// aus. Beispiel:  node demo/run_demo.js rainbow
//
// Die Online-Angriffe (bruteforce, dictionary, poly) brauchen den laufenden
// Server:  npm run server

const { spawnSync } = require("child_process");
const path = require("path");

const attacks = {
  bruteforce: "attack/2_1_bruteforce.js",
  dictionary: "attack/2_2_dictionary.js",
  poly: "attack/2_2_polyalphabet.js",
  rainbow: "attack/2_3_rainbow.js",
  parallel: "attack/2_3_parallel.js",
};

const choice = process.argv[2];

if (!choice || !attacks[choice]) {
  console.log("Verwendung: node demo/run_demo.js <angriff>");
  console.log("Verfügbare Angriffe:", Object.keys(attacks).join(", "));
  process.exit(1);
}

console.log("Starte Angriff:", choice);
const script = path.join(__dirname, "..", attacks[choice]);
spawnSync("node", [script], { stdio: "inherit" });
