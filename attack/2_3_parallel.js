// Parallelisierter Brute-Force (2.3b): OFFLINE gegen den gestohlenen Hash.
// Der Zeichensatz wird auf mehrere Worker-Threads aufgeteilt – jeder Worker
// bekommt einen Teil der möglichen ERSTEN Buchstaben und durchsucht nur
// Passwörter, die damit beginnen. Wer zuerst fündig wird, meldet es; danach
// werden die anderen Worker beendet.

// worker_threads lässt mehrere Teile dieses Programms GLEICHZEITIG laufen.
// Ein "Worker" ist wie ein zweites Node-Programm, das parallel arbeitet.
// Trick: Dieselbe Datei wird sowohl als Haupt-Programm als auch als Worker
// gestartet. Die Variable isMainThread sagt uns, in welcher Rolle wir gerade sind.
const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const { sha256, TARGET_HASH } = require("../common/target");

const charset = "abcdefghijklmnopqrstuvwxyz";
const maxLength = 3;
const WORKERS = 4; // so viele parallele Worker starten wir

// ---------------------------------------------------------------------------
// WORKER-Teil: durchsucht nur Passwörter, die mit einem der "firstChars" beginnen
// ---------------------------------------------------------------------------
if (!isMainThread) {
  // baut ab einem Anfangsstück alle Passwörter dieser Länge und vergleicht den
  // Hash mit dem Ziel-Hash; gibt den Treffer zurück oder null
  function search(prefix, length) {
    if (prefix.length === length) {
      return sha256(prefix) === TARGET_HASH ? prefix : null;
    }
    for (const char of charset) {
      const hit = search(prefix + char, length);
      if (hit) return hit;
    }
    return null;
  }

  // workerData.firstChars = die Anfangsbuchstaben, die genau DIESER Worker prüfen soll
  let result = null;
  for (const first of workerData.firstChars) {
    for (let length = 1; length <= maxLength; length++) {
      const hit = search(first, length);
      if (hit) { result = hit; break; }
    }
    if (result) break;
  }
  parentPort.postMessage(result); // Ergebnis ans Haupt-Programm schicken (null = nichts gefunden)
}

// ---------------------------------------------------------------------------
// HAUPT-Teil: Zeichensatz aufteilen, Worker starten, auf ersten Treffer warten
// ---------------------------------------------------------------------------
if (isMainThread) {
  const start = Date.now();
  const letters = charset.split("");

  // Buchstaben reihum auf die Worker verteilen
  const buckets = Array.from({ length: WORKERS }, () => []);
  letters.forEach((letter, i) => buckets[i % WORKERS].push(letter));

  let finished = 0;    // wie viele Worker ohne Treffer fertig sind
  const workers = [];

  // stoppt alle Worker (z.B. sobald einer das Passwort gefunden hat)
  function stopAll() {
    for (const w of workers) w.terminate();
  }

  for (const firstChars of buckets) {
    // startet DIESE Datei nochmals als Worker und übergibt ihm seinen Buchstaben-Teil
    const worker = new Worker(__filename, { workerData: { firstChars } });
    workers.push(worker);

    // wird aufgerufen, wenn der Worker sein Ergebnis zurückschickt
    worker.on("message", (result) => {
      if (result) {
        const seconds = (Date.now() - start) / 1000;
        console.log("Passwort gefunden:", result);
        console.log("Dauer:", seconds, "Sekunden");
        stopAll();
      } else {
        finished++;
        if (finished === WORKERS) {
          console.log("Passwort nicht gefunden (ausserhalb des Suchraums).");
        }
      }
    });
  }

  console.log("Starte", WORKERS, "Worker ...");
}
