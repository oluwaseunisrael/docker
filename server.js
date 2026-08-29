const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');
const taskService = require('./services/taskService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// ---- root + health ----
app.get('/', (req, res) => {
  res.json({
    name: 'Task API',
    version: '1.0',
    endpoints: ['/tasks'],
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// ---- Read ----
app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await taskService.listTasks(req.query);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

app.get('/tasks/:id', async (req, res, next) => {
  try {
    const task = await taskService.getTask(Number(req.params.id));
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// ---- Create ----
app.post('/tasks', async (req, res, next) => {
  try {
    const task = await taskService.createTask(req.body || {});
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// ---- Update & Delete ----
app.put('/tasks/:id', async (req, res, next) => {
  try {
    const task = await taskService.updateTask(Number(req.params.id), req.body || {});
    res.json(task);
  } catch (err) {
    next(err);
  }
});

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    await taskService.deleteTask(Number(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ---- Extras ----
app.get('/stats', async (req, res, next) => {
  try {
    res.json(await taskService.getStats());
  } catch (err) {
    next(err);
  }
});

app.post('/reset', async (req, res, next) => {
  try {
    const tasks = await taskService.resetTasks();
    res.json({ status: 'reset', tasks });
  } catch (err) {
    next(err);
  }
});

// ---- Swagger UI ----
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// ---- Error handling: translate service errors into status codes ----
app.use((err, req, res, next) => {
  if (err instanceof taskService.ValidationError) {
    return res.status(400).json({ error: err.message });
  }
  if (err instanceof taskService.NotFoundError) {
    return res.status(404).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

async function start() {
  await taskService.init(); // seeds the 3 example tasks if the table is empty
  app.listen(PORT, () => {
    console.log(`Task API running at http://localhost:${PORT}`);
    console.log(`Swagger UI at http://localhost:${PORT}/docs`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
