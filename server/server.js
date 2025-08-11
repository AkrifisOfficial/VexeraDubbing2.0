const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// Подключение к PostgreSQL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Проверка подключения
pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch(err => console.error('Connection error', err.stack));

// Маршруты
app.get('/api/anime', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM anime ORDER BY title');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Аутентификация администратора
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  
  try {
    const { rows } = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
    if (rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });
    
    const isValid = await bcrypt.compare(password, rows[0].password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });
    
    const token = jwt.sign({ id: rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Защищенные маршруты (требуют JWT)
app.use('/api/admin', require('./middleware/auth'));

// Админские маршруты
app.post('/api/admin/anime', async (req, res) => {
  // Добавление нового аниме
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
