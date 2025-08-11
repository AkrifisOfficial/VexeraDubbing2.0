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
// Добавляем новые маршруты
app.get('/api/anime/search', async (req, res) => {
  const { query } = req.query;
  try {
    const { rows } = await pool.query(
      `SELECT * FROM anime 
       WHERE title ILIKE $1 OR description ILIKE $1 
       ORDER BY title`,
      [`%${query}%`]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/anime/filter', async (req, res) => {
  const { genre, minRating, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  
  try {
    let query = `
      SELECT a.*, 
             COALESCE(AVG(r.rating), 0) as average_rating,
             COUNT(r.id) as rating_count
      FROM anime a
      LEFT JOIN ratings r ON a.id = r.anime_id
    `;
    
    const params = [];
    let whereClauses = [];
    
    if (genre) {
      query += ` JOIN anime_genres ag ON a.id = ag.anime_id JOIN genres g ON ag.genre_id = g.id`;
      whereClauses.push(`g.name = $${params.length + 1}`);
      params.push(genre);
    }
    
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    
    query += ` GROUP BY a.id`;
    
    if (minRating) {
      query += ` HAVING COALESCE(AVG(r.rating), 0) >= $${params.length + 1}`;
      params.push(parseFloat(minRating));
    }
    
    query += ` ORDER BY a.title LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), offset);
    
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/anime/:id/comments', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM comments 
       WHERE anime_id = $1 
       ORDER BY created_at DESC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/anime/:id/comments', async (req, res) => {
  const { username, text } = req.body;
  try {
    await pool.query(
      `INSERT INTO comments (anime_id, username, text)
       VALUES ($1, $2, $3)`,
      [req.params.id, username, text]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/anime/:id/rate', async (req, res) => {
  const { rating, userIp } = req.body;
  try {
    // Проверяем, не оценивал ли уже пользователь
    const { rows } = await pool.query(
      `SELECT * FROM ratings 
       WHERE anime_id = $1 AND user_ip = $2`,
      [req.params.id, userIp]
    );
    
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Вы уже оценили это аниме' });
    }
    
    await pool.query(
      `INSERT INTO ratings (anime_id, user_ip, rating)
       VALUES ($1, $2, $3)`,
      [req.params.id, userIp, rating]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/genres', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM genres ORDER BY name');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
