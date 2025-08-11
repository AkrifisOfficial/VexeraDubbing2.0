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
