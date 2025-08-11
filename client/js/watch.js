document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  const animeId = urlParams.get('id');
  
  if (animeId) {
    fetchAnimeDetails(animeId);
    fetchComments(animeId);
    setupRating(animeId);
    setupCommentForm(animeId);
  } else {
    window.location.href = '/';
  }
});

async function fetchAnimeDetails(animeId) {
  try {
    const response = await fetch(`/api/anime/${animeId}`);
    const anime = await response.json();
    
    document.getElementById('animeTitle').textContent = anime.title;
    document.getElementById('animeDescription').textContent = anime.description;
    document.getElementById('videoPlayer').src = anime.video_url;
  } catch (error) {
    console.error('Error fetching anime details:', error);
  }
}

async function fetchComments(animeId) {
  try {
    const response = await fetch(`/api/anime/${animeId}/comments`);
    const comments = await response.json();
    renderComments(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
  }
}

function renderComments(comments) {
  const container = document.getElementById('commentsList');
  container.innerHTML = '';
  
  if (comments.length === 0) {
    container.innerHTML = '<p>Пока нет комментариев. Будьте первым!</p>';
    return;
  }
  
  comments.forEach(comment => {
    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `
      <div class="comment-header">
        <strong>${comment.username || 'Аноним'}</strong>
        <span>${new Date(comment.created_at).toLocaleString()}</span>
      </div>
      <div class="comment-text">${comment.text}</div>
    `;
    container.appendChild(commentElement);
  });
}

function setupRating(animeId) {
  const stars = document.querySelectorAll('#ratingStars span');
  const ratingMessage = document.getElementById('ratingMessage');
  
  // Получаем IP пользователя (упрощённо)
  const userIp = 'user-ip'; // В реальном приложении нужно получать IP
  
  stars.forEach(star => {
    star.addEventListener('mouseover', () => {
      const rating = star.dataset.rating;
      highlightStars(rating);
    });
    
    star.addEventListener('click', async () => {
      const rating = star.dataset.rating;
      try {
        const response = await fetch(`/api/anime/${animeId}/rate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rating, userIp })
        });
        
        const data = await response.json();
        if (response.ok) {
          ratingMessage.textContent = 'Спасибо за вашу оценку!';
          ratingMessage.style.color = 'green';
        } else {
          ratingMessage.textContent = data.error || 'Ошибка при оценке';
          ratingMessage.style.color = 'red';
        }
      } catch (error) {
        console.error('Error submitting rating:', error);
        ratingMessage.textContent = 'Ошибка при отправке оценки';
        ratingMessage.style.color = 'red';
      }
    });
  });
  
  document.getElementById('ratingStars').addEventListener('mouseleave', () => {
    highlightStars(0);
  });
}

function highlightStars(rating) {
  const stars = document.querySelectorAll('#ratingStars span');
  stars.forEach(star => {
    if (star.dataset.rating <= rating) {
      star.textContent = '★';
      star.style.color = '#ffc107';
    } else {
      star.textContent = '☆';
      star.style.color = '#ccc';
    }
  });
}

function setupCommentForm(animeId) {
  document.getElementById('submitComment').addEventListener('click', async () => {
    const username = document.getElementById('commentName').value.trim();
    const text = document.getElementById('commentText').value.trim();
    
    if (!text) {
      alert('Пожалуйста, введите текст комментария');
      return;
    }
    
    try {
      const response = await fetch(`/api/anime/${animeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, text })
      });
      
      if (response.ok) {
        document.getElementById('commentText').value = '';
        fetchComments(animeId);
      } else {
        const error = await response.json();
        alert(error.error || 'Ошибка при отправке комментария');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Ошибка при отправке комментария');
    }
  });
}
