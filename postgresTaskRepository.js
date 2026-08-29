const pool = require('./pool');

// Repository interface (used by taskService.js):
//   findAll({ done, search })  -> Task[]
//   findById(id)               -> Task | null
//   create(title)              -> Task
//   update(id, { title, done })-> Task | null
//   remove(id)                 -> boolean (true if a row was deleted)
//   countTotal()                -> number
//   countDone()                 -> number
//   seedIfEmpty()               -> void
//   resetToSeed()                -> Task[]

function toTask(row) {
  return { id: row.id, title: row.title, done: row.done };
}

const SEED_TASKS = [
  { title: 'Buy milk', done: false },
  { title: 'Walk the dog', done: false },
  { title: 'Write README', done: true },
];

async function findAll({ done, search } = {}) {
  const clauses = [];
  const params = [];

  if (done !== undefined) {
    params.push(done);
    clauses.push(`done = $${params.length}`);
  }
  if (search) {
    params.push(`%${search}%`);
    clauses.push(`title ILIKE $${params.length}`);
  }

  const where = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
  const { rows } = await pool.query(`SELECT * FROM tasks ${where} ORDER BY id`, params);
  return rows.map(toTask);
}

async function findById(id) {
  const { rows } = await pool.query('SELECT * FROM tasks WHERE id = $1', [id]);
  return rows[0] ? toTask(rows[0]) : null;
}

async function create(title) {
  const { rows } = await pool.query(
    'INSERT INTO tasks (title, done) VALUES ($1, false) RETURNING *',
    [title]
  );
  return toTask(rows[0]);
}

async function update(id, { title, done }) {
  const existing = await findById(id);
  if (!existing) return null;

  const newTitle = title !== undefined ? title : existing.title;
  const newDone = done !== undefined ? done : existing.done;

  const { rows } = await pool.query(
    'UPDATE tasks SET title = $1, done = $2 WHERE id = $3 RETURNING *',
    [newTitle, newDone, id]
  );
  return toTask(rows[0]);
}

async function remove(id) {
  const { rowCount } = await pool.query('DELETE FROM tasks WHERE id = $1', [id]);
  return rowCount > 0;
}

async function countTotal() {
  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM tasks');
  return Number(rows[0].count);
}

async function countDone() {
  const { rows } = await pool.query('SELECT COUNT(*) AS count FROM tasks WHERE done = true');
  return Number(rows[0].count);
}

async function ensureSchema() {
  // init.sql only runs automatically for a fresh Docker Postgres container.
  // Managed/hosted Postgres (Render, etc.) never sees that file, so create
  // the table here too if it doesn't already exist — safe to run every time.
  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      done BOOLEAN NOT NULL DEFAULT FALSE
    )
  `);
}

async function seedIfEmpty() {
  await ensureSchema();
  const total = await countTotal();
  if (total > 0) return;

  for (const task of SEED_TASKS) {
    await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [task.title, task.done]);
  }
}

async function resetToSeed() {
  await pool.query('DELETE FROM tasks');
  for (const task of SEED_TASKS) {
    await pool.query('INSERT INTO tasks (title, done) VALUES ($1, $2)', [task.title, task.done]);
  }
  return findAll();
}

module.exports = {
  findAll,
  findById,
  create,
  update,
  remove,
  countTotal,
  countDone,
  ensureSchema,
  seedIfEmpty,
  resetToSeed,
};
