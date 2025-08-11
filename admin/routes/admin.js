const express = require('express');
const router = express.Router();
const { pool } = require('../db');

// Получить последние комментарии
router.get('/comments/recent', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT c.*, a.title as anime_title 
       FROM comments c
       JOIN anime a ON c.anime_id = a.id
       ORDER BY c.created_at DESC
       LIMIT 20`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить комментарий
router.delete('/comments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Удалить жанр
router.delete('/genres/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM genres WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
