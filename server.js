const express = require('express');
const swaggerUi = require('swagger-ui-express');
const openapiSpec = require('./openapi.json');
const taskService = require('./taskService');

const app = express();

const PORT = Number(process.env.PORT) || 3000;

// =====================================================
// MIDDLEWARE
// =====================================================

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
  try {
    console.log('=================================');
    console.log('Starting Task API...');
    console.log('=================================');

    console.log('PORT:', PORT);
    console.log(
      'DATABASE_URL exists:',
      !!process.env.DATABASE_URL
    );

    if (!process.env.DATABASE_URL) {
      throw new Error(
        'DATABASE_URL environment variable is not set'
      );
    }

    // Initialize database first
    console.log('Initializing database...');

    await taskService.init();

    console.log('Database initialized successfully.');

    // Start server
    app.listen(PORT, '0.0.0.0', () => {
      console.log('=================================');
      console.log(`Task API running on 0.0.0.0:${PORT}`);
      console.log(`Swagger UI available at /docs`);
      console.log('=================================');
    });

  } catch (err) {
    console.error('=================================');
    console.error('APPLICATION STARTUP ERROR');
    console.error('=================================');
    console.error(err);
    console.error(err.stack);

    process.exit(1);
  }
}

start();
