// Winziges simuliertes Login-System für die Verteidigungs-Demos.
// login(username, password) gibt einfach true/false zurück. Die Verteidigungen
// in defenses/ legen sich als "Hülle" um diese Funktion.

const USERS = { admin: "monkey" };

function login(username, password) {
  return USERS[username] === password;
}

module.exports = { login };
