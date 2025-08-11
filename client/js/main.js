document.addEventListener('DOMContentLoaded', () => {
    // Состояние приложения
    const state = {
        currentPage: 1,
        itemsPerPage: 12,
        totalItems: 0,
        totalPages: 1,
        animeList: [],
        genres: [],
        filters: {
            genre: '',
            rating: '',
            sort: 'title',
            searchQuery: ''
        },
        viewMode: 'grid' // grid или list
    };

    // Элементы DOM
    const elements = {
        animeContainer: document.getElementById('animeContainer'),
        genreFilter: document.getElementById('genreFilter'),
        ratingFilter: document.getElementById('ratingFilter'),
        sortBy: document.getElementById('sortBy'),
        applyFilters: document.getElementById('applyFilters'),
        resetFilters: document.getElementById('resetFilters'),
        pagination: document.getElementById('pagination'),
        prevPage: document.getElementById('prevPage'),
        nextPage: document.getElementById('nextPage'),
        firstPage: document.getElementById('firstPage'),
        lastPage: document.getElementById('lastPage'),
        pageNumbers: document.getElementById('pageNumbers'),
        heroSearch: document.getElementById('heroSearch'),
        heroSearchBtn: document.getElementById('heroSearchBtn'),
        gridView: document.getElementById('gridView'),
        listView: document.getElementById('listView'),
        loadingSpinner: document.querySelector('.loading-spinner')
    };

    // Инициализация приложения
    init();

    async function init() {
        await fetchGenres();
        setupEventListeners();
        fetchAnime();
    }

    // Настройка обработчиков событий
    function setupEventListeners() {
        elements.applyFilters.addEventListener('click', applyFilters);
        elements.resetFilters.addEventListener('click', resetFilters);
        elements.prevPage.addEventListener('click', () => changePage(state.currentPage - 1));
        elements.nextPage.addEventListener('click', () => changePage(state.currentPage + 1));
        elements.firstPage.addEventListener('click', () => changePage(1));
        elements.lastPage.addEventListener('click', () => changePage(state.totalPages));
        elements.heroSearchBtn.addEventListener('click', searchAnime);
        elements.heroSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') searchAnime();
        });
        elements.gridView.addEventListener('click', () => switchViewMode('grid'));
        elements.listView.addEventListener('click', () => switchViewMode('list'));
    }

    // Загрузка жанров
    async function fetchGenres() {
        try {
            const response = await fetch('/api/genres');
            if (!response.ok) throw new Error('Ошибка загрузки жанров');
            
            state.genres = await response.json();
            populateGenreFilter();
        } catch (error) {
            console.error('Error fetching genres:', error);
            showError('Не удалось загрузить жанры');
        }
    }

    // Заполнение фильтра жанров
    function populateGenreFilter() {
        elements.genreFilter.innerHTML = '<option value="">Все жанры</option>';
        state.genres.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.id;
            option.textContent = genre.name;
            elements.genreFilter.appendChild(option);
        });
    }

    // Загрузка аниме
    async function fetchAnime() {
        showLoading(true);
        
        try {
            const params = new URLSearchParams();
            params.append('page', state.currentPage);
            params.append('limit', state.itemsPerPage);
            
            if (state.filters.genre) params.append('genre', state.filters.genre);
            if (state.filters.rating) params.append('minRating', state.filters.rating);
            if (state.filters.sort) params.append('sort', state.filters.sort);
            if (state.filters.searchQuery) params.append('search', state.filters.searchQuery);

            const response = await fetch(`/api/anime?${params.toString()}`);
            if (!response.ok) throw new Error('Ошибка загрузки аниме');
            
            const data = await response.json();
            state.animeList = data.items;
            state.totalItems = data.total;
            state.totalPages = Math.ceil(data.total / state.itemsPerPage);
            
            renderAnimeList();
            updatePagination();
        } catch (error) {
            console.error('Error fetching anime:', error);
            showError('Не удалось загрузить аниме');
        } finally {
            showLoading(false);
        }
    }

    // Поиск аниме
    function searchAnime() {
        const query = elements.heroSearch.value.trim();
        state.filters.searchQuery = query;
        state.currentPage = 1;
        fetchAnime();
    }

    // Применение фильтров
    function applyFilters() {
        state.filters = {
            genre: elements.genreFilter.value,
            rating: elements.ratingFilter.value,
            sort: elements.sortBy.value,
            searchQuery: state.filters.searchQuery
        };
        state.currentPage = 1;
        fetchAnime();
    }

    // Сброс фильтров
    function resetFilters() {
        elements.genreFilter.value = '';
        elements.ratingFilter.value = '';
        elements.sortBy.value = 'title';
        elements.heroSearch.value = '';
        
        state.filters = {
            genre: '',
            rating: '',
            sort: 'title',
            searchQuery: ''
        };
        
        state.currentPage = 1;
        fetchAnime();
    }

    // Переключение страницы
    function changePage(page) {
        if (page < 1 || page > state.totalPages) return;
        state.currentPage = page;
        fetchAnime();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Обновление пагинации
    function updatePagination() {
        // Кнопки навигации
        elements.firstPage.disabled = state.currentPage === 1;
        elements.prevPage.disabled = state.currentPage === 1;
        elements.nextPage.disabled = state.currentPage === state.totalPages;
        elements.lastPage.disabled = state.currentPage === state.totalPages;

        // Номера страниц
        elements.pageNumbers.innerHTML = '';
        
        const maxVisiblePages = 5;
        let startPage = Math.max(1, state.currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(state.totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        if (startPage > 1) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            elements.pageNumbers.appendChild(ellipsis);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            const pageBtn = document.createElement('button');
            pageBtn.textContent = i;
            if (i === state.currentPage) {
                pageBtn.classList.add('active');
            }
            pageBtn.addEventListener('click', () => changePage(i));
            elements.pageNumbers.appendChild(pageBtn);
        }
        
        if (endPage < state.totalPages) {
            const ellipsis = document.createElement('span');
            ellipsis.textContent = '...';
            elements.pageNumbers.appendChild(ellipsis);
        }
    }

    // Переключение режима отображения
    function switchViewMode(mode) {
        state.viewMode = mode;
        if (mode === 'grid') {
            elements.gridView.classList.add('active');
            elements.listView.classList.remove('active');
        } else {
            elements.listView.classList.add('active');
            elements.gridView.classList.remove('active');
        }
        renderAnimeList();
    }

    // Отображение списка аниме
    function renderAnimeList() {
        elements.animeContainer.innerHTML = '';
        
        if (state.animeList.length === 0) {
            elements.animeContainer.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Ничего не найдено</h3>
                    <p>Попробуйте изменить параметры поиска</p>
                </div>
            `;
            return;
        }
        
        state.animeList.forEach(anime => {
            const animeCard = document.createElement('div');
            animeCard.className = `anime-card ${state.viewMode}`;
            
            const rating = anime.average_rating 
                ? `<div class="rating"><i class="fas fa-star"></i> ${anime.average_rating.toFixed(1)}</div>`
                : '<div class="rating no-rating"><i class="far fa-star"></i> Нет оценок</div>';
            
            animeCard.innerHTML = `
                <div class="anime-poster">
                    <img src="${anime.image_url || 'images/default-poster.jpg'}" alt="${anime.title}">
                    ${rating}
                    <div class="anime-overlay">
                        <button class="watch-btn"><i class="fas fa-play"></i> Смотреть</button>
                    </div>
                </div>
                <div class="anime-info">
                    <h3 class="anime-title">${anime.title}</h3>
                    <div class="anime-meta">
                        <span class="anime-year">${anime.year || '—'}</span>
                        <span class="anime-episodes"><i class="fas fa-list-ol"></i> ${anime.episodes || '?'} эп.</span>
                    </div>
                    <div class="anime-genres">${renderGenres(anime.genres)}</div>
                    <p class="anime-description">${anime.description ? truncate(anime.description, 100) : 'Описание отсутствует'}</p>
                </div>
            `;
            
            animeCard.querySelector('.watch-btn').addEventListener('click', () => {
                window.location.href = `/watch.html?id=${anime.id}`;
            });
            
            elements.animeContainer.appendChild(animeCard);
        });
    }

    // Отображение жанров для карточки аниме
    function renderGenres(genres) {
        if (!genres || genres.length === 0) return '';
        return genres.slice(0, 3).map(g => `<span class="genre-tag">${g.name}</span>`).join('');
    }

    // Усечение текста
    function truncate(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    // Показать/скрыть индикатор загрузки
    function showLoading(show) {
        elements.loadingSpinner.style.display = show ? 'flex' : 'none';
    }

    // Показать сообщение об ошибке
    function showError(message) {
        elements.animeContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message}</p>
                <button onclick="window.location.reload()">Попробовать снова</button>
            </div>
        `;
    }
});
