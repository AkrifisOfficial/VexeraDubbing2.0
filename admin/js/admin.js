document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const logoutBtn = document.getElementById('logoutBtn');
  const animeForm = document.getElementById('animeForm');
  const loginContainer = document.getElementById('loginContainer');
  const adminPanel = document.getElementById('adminPanel');

  // Проверка токена
  const token = localStorage.getItem('adminToken');
  if (token) {
    verifyToken(token);
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = e.target[0].value;
    const password = e.target[1].value;
    
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        loginContainer.style.display = 'none';
        adminPanel.style.display = 'block';
      } else {
        alert(data.error || 'Ошибка входа');
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  });

  logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    adminPanel.style.display = 'none';
    loginContainer.style.display = 'block';
  });

  animeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('adminToken');
    
    const animeData = {
      title: e.target[0].value,
      description: e.target[1].value,
      image_url: e.target[2].value,
      video_url: e.target[3].value
    };
    
    try {
      const response = await fetch('/api/admin/anime', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(animeData)
      });
      
      if (response.ok) {
        alert('Аниме успешно добавлено!');
        animeForm.reset();
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка добавления');
      }
    } catch (error) {
      console.error('Add anime error:', error);
    }
  });
});

async function verifyToken(token) {
  try {
    const response = await fetch('/api/admin/verify', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      document.getElementById('loginContainer').style.display = 'none';
      document.getElementById('adminPanel').style.display = 'block';
    } else {
      localStorage.removeItem('adminToken');
    }
  } catch (error) {
    console.error('Token verification error:', error);
  }
          }
// После успешного входа загружаем жанры и комментарии
if (token) {
  fetchGenres();
  fetchRecentComments();
}

async function fetchGenres() {
  try {
    const response = await fetch('/api/genres', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const genres = await response.json();
    renderGenres(genres);
  } catch (error) {
    console.error('Error fetching genres:', error);
  }
}

async function fetchRecentComments() {
  try {
    const response = await fetch('/api/comments/recent', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const comments = await response.json();
    renderComments(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
}

function renderGenres(genres) {
  const container = document.getElementById('genresContainer');
  container.innerHTML = '';
  
  genres.forEach(genre => {
    const genreElement = document.createElement('div');
    genreElement.className = 'genre-item';
    genreElement.innerHTML = `
      <span>${genre.name}</span>
      <button class="delete-genre" data-id="${genre.id}">Удалить</button>
    `;
    container.appendChild(genreElement);
  });
  
  // Добавляем обработчики для кнопок удаления
  document.querySelectorAll('.delete-genre').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const genreId = e.target.dataset.id;
      if (confirm('Удалить этот жанр?')) {
        await deleteGenre(genreId);
      }
    });
  });
}

function renderComments(comments) {
  const container = document.getElementById('commentsContainer');
  container.innerHTML = '';
  
  comments.forEach(comment => {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    commentElement.innerHTML = `
      <div class="comment-header">
        <strong>${comment.username || 'Аноним'}</strong>
        <span>${new Date(comment.created_at).toLocaleString()}</span>
      </div>
      <div class="comment-text">${comment.text}</div>
      <div class="comment-actions">
        <button class="delete-comment" data-id="${comment.id}">Удалить</button>
      </div>
    `;
    container.appendChild(commentElement);
  });
  
  // Добавляем обработчики для кнопок удаления
  document.querySelectorAll('.delete-comment').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const commentId = e.target.dataset.id;
      if (confirm('Удалить этот комментарий?')) {
        await deleteComment(commentId);
      }
    });
  });
}

async function deleteGenre(genreId) {
  try {
    const response = await fetch(`/api/admin/genres/${genreId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      fetchGenres();
    } else {
      alert('Ошибка при удалении жанра');
    }
  } catch (error) {
    console.error('Error deleting genre:', error);
  }
}

async function deleteComment(commentId) {
  try {
    const response = await fetch(`/api/admin/comments/${commentId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    
    if (response.ok) {
      fetchRecentComments();
    } else {
      alert('Ошибка при удалении комментария');
    }
  } catch (error) {
    console.error('Error deleting comment:', error);
  }
}
