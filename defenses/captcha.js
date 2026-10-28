// Captcha-Challenge (3.2b): Nach 3 Fehlversuchen muss vor jedem weiteren Login
// eine einfache Rechenaufgabe gelöst werden. Ein automatisches Skript kann die
// Aufgabe nicht ohne Weiteres beantworten -> der Angriff stockt.

const readline = require("readline");
const { login } = require("../common/login");

const THRESHOLD = 3; // ab so vielen Fehlversuchen kommt die Challenge

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function withCaptcha(loginFn) {
  let failures = 0;

  return async function (username, password) {
    // Challenge erst ab dem Schwellwert
    if (failures >= THRESHOLD) {
      const a = Math.floor(Math.random() * 10);
      const b = Math.floor(Math.random() * 10);
      const answer = await ask(`Captcha: Wie viel ist ${a} + ${b}? `);
      if (Number(answer) !== a + b) {
        console.log("Captcha falsch – Login abgelehnt.");
        return false;
      }
    }

    const ok = loginFn(username, password);
    failures = ok ? 0 : failures + 1;
    return ok;
  };
}

// --- Demo: 3 falsche Versuche lösen die Challenge aus ---------------------
async function demo() {
  const protectedLogin = withCaptcha(login);

  for (const pw of ["wrong1", "wrong2", "wrong3"]) {
    console.log(`Versuch "${pw}" ->`, (await protectedLogin("admin", pw)) ? "ERFOLG" : "falsch");
  }
  console.log("Jetzt ist die Captcha-Schwelle erreicht. Nächster Versuch verlangt die Rechenaufgabe:");
  console.log(`Versuch "monkey" ->`, (await protectedLogin("admin", "monkey")) ? "ERFOLG" : "falsch");
  process.exit(0);
}

demo();

module.exports = { withCaptcha };
