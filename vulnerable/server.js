const express = require("express");
const users = require("../data/users.json"); // [{ username, password }]

const app = express();
app.use(express.json()); // liest JSON aus dem Request-Body in req.body

app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // User mit passendem Namen UND Passwort suchen (Klartext-Vergleich -> angreifbar)
  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (user) {
    return res.status(200).json({ success: true });
  } else {
    return res.status(401).json({ success: false, message: "Login fehlgeschlagen" });
  }
});

app.listen(3000, () => {
  console.log("Vulnerabler Server läuft auf http://localhost:3000");
});