// Parallelisierter Brute-Force (2.3b): OFFLINE gegen den gestohlenen Hash.
// Der Zeichensatz wird auf mehrere Worker-Threads aufgeteilt – jeder Worker
// bekommt einen Teil der möglichen ERSTEN Buchstaben und durchsucht nur
// Passwörter, die damit beginnen. Wer zuerst fündig wird, meldet es; danach
// werden die anderen Worker beendet.

const { Worker, isMainThread, parentPort, workerData } = require("worker_threads");
const { sha256, TARGET_HASH } = require("../common/target");

const charset = "abcdefghijklmnopqrstuvwxyz";
const maxLength = 3;
const WORKERS = 4;

// ---------------------------------------------------------------------------
// WORKER-Teil: durchsucht nur Passwörter, die mit einem der "firstChars" beginnen
// ---------------------------------------------------------------------------
if (!isMainThread) {
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

  let result = null;
  for (const first of workerData.firstChars) {
    for (let length = 1; length <= maxLength; length++) {
      const hit = search(first, length);
      if (hit) { result = hit; break; }
    }
    if (result) break;
  }
  parentPort.postMessage(result); // null = in diesem Bereich nichts gefunden
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

  let finished = 0;
  const workers = [];

  function stopAll() {
    for (const w of workers) w.terminate();
  }

  for (const firstChars of buckets) {
    const worker = new Worker(__filename, { workerData: { firstChars } });
    workers.push(worker);

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
