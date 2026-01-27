import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';

import studentRoutes from './routes/studentRoutes.js';
import db from './config/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
  res.json({ message: 'School Portal API running' });
});

// Simple DB health check
app.get('/health/db', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ ok: true, message: 'Database connected' });
  } catch (err) {
    console.error('DB health check failed:', err);
    res.status(500).json({ ok: false, message: 'Database connection failed' });
  }
});

app.use('/api/students', studentRoutes);

// Basic error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
