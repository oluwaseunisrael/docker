// This is the ONLY line that names a specific storage technology.
// Swapping Postgres for something else means changing this one require —
// server.js and everything below stays exactly the same.
const repository = require('./postgresTaskRepository');

class ValidationError extends Error {}
class NotFoundError extends Error {}

function validateTitle(title) {
  if (title === undefined) return; // not being changed
  if (typeof title !== 'string' || !title.trim()) {
    throw new ValidationError('title must be a non-empty string');
  }
}

function validateDone(done) {
  if (done === undefined) return; // not being changed
  if (typeof done !== 'boolean') {
    throw new ValidationError('done must be a boolean');
  }
}

async function init() {
  await repository.seedIfEmpty();
}

async function listTasks({ done, search } = {}) {
  const filters = {};
  if (done !== undefined) filters.done = done === 'true';
  if (search) filters.search = search;
  return repository.findAll(filters);
}

async function getTask(id) {
  const task = await repository.findById(id);
  if (!task) throw new NotFoundError(`Task ${id} not found`);
  return task;
}

async function createTask({ title }) {
  if (!title || typeof title !== 'string' || !title.trim()) {
    throw new ValidationError('title is required and must be a non-empty string');
  }
  return repository.create(title.trim());
}

async function updateTask(id, { title, done }) {
  if (title === undefined && done === undefined) {
    throw new ValidationError('provide at least one of: title, done');
  }
  validateTitle(title);
  validateDone(done);

  const updated = await repository.update(id, {
    title: title !== undefined ? title.trim() : undefined,
    done,
  });
  if (!updated) throw new NotFoundError(`Task ${id} not found`);
  return updated;
}

async function deleteTask(id) {
  const deleted = await repository.remove(id);
  if (!deleted) throw new NotFoundError(`Task ${id} not found`);
}

async function getStats() {
  const total = await repository.countTotal();
  const done = await repository.countDone();
  return { total, done, open: total - done };
}

async function resetTasks() {
  return repository.resetToSeed();
}

module.exports = {
  ValidationError,
  NotFoundError,
  init,
  listTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask,
  getStats,
  resetTasks,
};
