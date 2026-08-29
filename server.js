const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');
const taskService = require('./services/taskService');

const app = express();

// Render provides PORT through environment variables.
// Locally, it will use port 3000.
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// =====================================================
// ROOT + HEALTH CHECK
// =====================================================

app.get('/', (req, res) => {
  res.json({
    name: 'Task API',
    version: '1.0',
    status: 'running',
    endpoints: [
      'GET /tasks',
      'GET /tasks/:id',
      'POST /tasks',
      'PUT /tasks/:id',
      'DELETE /tasks/:id',
      'GET /stats',
      'POST /reset',
      'GET /health',
      'GET /docs'
    ]
  });
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok'
  });
});

// =====================================================
// GET ALL TASKS
// =====================================================

app.get('/tasks', async (req, res, next) => {
  try {
    const tasks = await taskService.listTasks(req.query);
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// =====================================================
// GET SINGLE TASK
// =====================================================

app.get('/tasks/:id', async (req, res, next) => {
  try {
    const task = await taskService.getTask(
      Number(req.params.id)
    );

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// =====================================================
// CREATE TASK
// =====================================================

app.post('/tasks', async (req, res, next) => {
  try {
    const task = await taskService.createTask(
      req.body || {}
    );

    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
});

// =====================================================
// UPDATE TASK
// =====================================================

app.put('/tasks/:id', async (req, res, next) => {
  try {
    const task = await taskService.updateTask(
      Number(req.params.id),
      req.body || {}
    );

    res.json(task);
  } catch (err) {
    next(err);
  }
});

// =====================================================
// DELETE TASK
// =====================================================

app.delete('/tasks/:id', async (req, res, next) => {
  try {
    await taskService.deleteTask(
      Number(req.params.id)
    );

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// =====================================================
// STATISTICS
// =====================================================

app.get('/stats', async (req, res, next) => {
  try {
    const stats = await taskService.getStats();

    res.json(stats);
  } catch (err) {
    next(err);
  }
});

// =====================================================
// RESET TASKS
// =====================================================

app.post('/reset', async (req, res, next) => {
  try {
    const tasks = await taskService.resetTasks();

    res.json({
      status: 'reset',
      tasks
    });
  } catch (err) {
    next(err);
  }
});

// =====================================================
// SWAGGER DOCUMENTATION
// =====================================================

app.use(
  '/docs',
  swaggerUi.serve,
  swaggerUi.setup(openapiSpec)
);

// =====================================================
// ERROR HANDLING
// =====================================================

app.use((err, req, res, next) => {
  console.error('Application error:', err);

  if (err instanceof taskService.ValidationError) {
    return res.status(400).json({
      error: err.message
    });
  }

  if (err instanceof taskService.NotFoundError) {
    return res.status(404).json({
      error: err.message
    });
  }

  res.status(500).json({
    error: 'Internal server error'
  });
});

// =====================================================
// START SERVER
// =====================================================
async function start() {
  // Start the HTTP server FIRST so Render detects the port
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Task API running on port ${PORT}`);
    console.log(`Health check available at /health`);
    console.log(`Swagger UI available at /docs`);
  });

  // Initialize database after server starts
  try {
    console.log('Initializing database...');
    await taskService.init();
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Database initialization failed:');
    console.error(err);
  }
}


start();
