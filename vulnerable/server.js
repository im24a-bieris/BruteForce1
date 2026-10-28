// Unsicherer Login-Server: vergleicht das Passwort im Klartext und erlaubt
// beliebig viele Versuche. Genau das macht ihn angreifbar.

const express = require("express"); // Framework, das den Webserver einfach macht
const users = require("../data/users.json"); // unsere "Datenbank": [{ username, password }]

const path = require("path");

const app = express();
app.use(express.json()); // wandelt den JSON-Text der Anfrage in req.body um
app.use(express.static(path.join(__dirname, "..", "public"))); // liefert das Frontend (public/index.html) aus

// wird aufgerufen, wenn eine POST-Anfrage an /login kommt
// req = Anfrage mit den gesendeten Daten, res = unsere Antwort
app.post("/login", (req, res) => {
  const { username, password } = req.body || {}; // || {} falls gar kein Body gesendet wird

  // Benutzer suchen, bei dem Name UND Passwort stimmen
  // der direkte Klartext-Vergleich (===) ist die Schwachstelle
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    return res.status(200).json({ success: true }); // 200 = Login OK
  } else {
    return res.status(401).json({ success: false, message: "Login fehlgeschlagen" }); // 401 = abgelehnt
  }
});

// Server starten und auf Port 3000 auf Anfragen warten
const PORT = process.env.PORT || 3000; // Port notfalls per Umgebungsvariable überschreibbar
app.listen(PORT, () => {
  console.log(`Vulnerabler Server läuft auf http://localhost:${PORT}`);
});
