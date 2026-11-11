// Password hashing off the main thread.
//
// Hashing a password takes about a tenth of a second of solid CPU work. Done
// on the main thread it freezes every other request for that long, so a rush
// of logins made the whole site stall. Here the work is handed to a few
// background threads; the main thread stays free to serve pages.
const { Worker, isMainThread, parentPort } = require('worker_threads');
const os = require('os');
const bcrypt = require('bcryptjs');

const ROUNDS = 10;

if (!isMainThread) {
  // ── Background thread: do the slow work, send the answer back ──
  parentPort.on('message', ({ id, op, password, hash }) => {
    try {
      const result = op === 'hash' ? bcrypt.hashSync(password, ROUNDS) : bcrypt.compareSync(password, hash);
      parentPort.postMessage({ id, result });
    } catch (e) {
      parentPort.postMessage({ id, error: e.message });
    }
  });
} else {
  // Leave a core for the main thread; never more than 4 so a shared server
  // is not swamped by one app.
  const SIZE = Math.max(1, Math.min(4, os.cpus().length - 1));
  const MAX_QUEUE = 500; // beyond this, refuse quickly instead of piling up

  const idle = [];
  const queue = [];
  const jobs = new Map(); // id -> { resolve, reject }
  let nextId = 1;
  let started = 0;

  function spawn() {
    started++;
    const worker = new Worker(__filename);
    worker.jobId = null;
    worker.on('message', ({ id, result, error }) => {
      const job = jobs.get(id);
      jobs.delete(id);
      worker.jobId = null;
      if (job) error ? job.reject(new Error(error)) : job.resolve(result);
      next(worker);
    });
    const lost = (err) => {
      started--;
      const i = idle.indexOf(worker);
      if (i >= 0) idle.splice(i, 1);
      const job = jobs.get(worker.jobId);
      if (job) { jobs.delete(worker.jobId); job.reject(err || new Error('Password worker stopped')); }
      pump();
    };
    worker.once('error', lost);
    worker.once('exit', (code) => { if (code !== 0) lost(); });
    worker.unref(); // never keep the process alive just for the pool
    return worker;
  }

  function next(worker) {
    const task = queue.shift();
    if (!task) return idle.push(worker);
    worker.jobId = task.id;
    worker.postMessage(task);
  }

  function pump() {
    while (queue.length && (idle.length || started < SIZE)) next(idle.pop() || spawn());
  }

  function run(task) {
    return new Promise((resolve, reject) => {
      if (queue.length >= MAX_QUEUE) {
        const err = new Error('Too many sign-ins at once, please try again in a moment');
        err.status = 503;
        return reject(err);
      }
      const id = nextId++;
      jobs.set(id, { resolve, reject });
      queue.push({ id, ...task });
      pump();
    });
  }

  module.exports = {
    /** Hash a new password. */
    hash: (password) => run({ op: 'hash', password: String(password) }),
    /** Check a password against a stored hash. Resolves false for a missing hash. */
    compare: (password, hash) => (hash ? run({ op: 'compare', password: String(password), hash }) : Promise.resolve(false)),
  };
}
