document.addEventListener('DOMContentLoaded', () => {
  fetchAnime();
});

async function fetchAnime() {
  try {
    const response = await fetch('/api/anime');
    const animeList = await response.json();
    renderAnime(animeList);
  } catch (error) {
    console.error('Error fetching anime:', error);
  }
}

function renderAnime(animeList) {
  const container = document.getElementById('animeContainer');
  
  animeList.forEach(anime => {
    const animeCard = document.createElement('div');
    animeCard.className = 'anime-card';
    animeCard.innerHTML = `
      <img src="${anime.image_url}" alt="${anime.title}">
      <h3>${anime.title}</h3>
      <p>${anime.description.substring(0, 100)}...</p>
      <a href="/watch.html?id=${anime.id}" class="watch-btn">Смотреть</a>
    `;
    container.appendChild(animeCard);
  });
      }
