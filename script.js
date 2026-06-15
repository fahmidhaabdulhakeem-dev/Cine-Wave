/* ==========================================================================
   CineWave Javascript - Controller & API Integration
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // State Management
    let shows = [];
    let currentShow = null;
    let selectedGenre = 'all';
    let minRating = 0;
    let sortBy = 'popularity';
    let activeTheme = 'dark';
    
    // Curated initial keywords to fetch trending content
    const trendingQueries = ['Marvel', 'Dark', 'Game', 'Empire', 'Star', 'Stranger', 'Planet', 'Westworld', 'Black Mirror', 'Arcane'];
    // DOM Elements
    const movieSearch = document.getElementById('movieSearch');
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    const themeToggle = document.getElementById('themeToggle');
    const heroSection = document.getElementById('heroSection');
    const heroBackdrop = document.getElementById('heroBackdrop');
    const heroTitle = document.getElementById('heroTitle');
    const heroRating = document.getElementById('heroRating');
    const heroYear = document.getElementById('heroYear');
    const heroGenres = document.getElementById('heroGenres');
    const heroDescription = document.getElementById('heroDescription');
    const heroInfoBtn = document.getElementById('heroInfoBtn');
    
    const genreContainer = document.getElementById('genreContainer');
    const ratingSlider = document.getElementById('ratingSlider');
    const ratingVal = document.getElementById('ratingVal');
    const sortBySelect = document.getElementById('sortBySelect');
    const sectionHeading = document.getElementById('sectionHeading');
    const resultsCount = document.getElementById('resultsCount');
    const movieGrid = document.getElementById('movieGrid');
    const emptyState = document.getElementById('emptyState');
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    
    const movieModal = document.getElementById('movieModal');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalContent = document.getElementById('modalContent');
    // Fallback Poster image (Premium cinematic visual)
    const fallbackPoster = 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?q=80&w=400&auto=format&fit=crop';
    /* --------------------------------------------------------------------------
       1. Initialization & Initial Load
       -------------------------------------------------------------------------- */
    async function init() {
        setupEventListeners();
        loadSavedTheme();
        
        // Pick a random trending query to show fresh contents on load
        const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];
        sectionHeading.textContent = `Trending: ${randomQuery}`;
        await fetchShows(randomQuery);
    }
    /* --------------------------------------------------------------------------
       2. Event Listeners Setup
       -------------------------------------------------------------------------- */
    function setupEventListeners() {
        // Search Inputs
        movieSearch.addEventListener('input', debounce(handleSearch, 400));
        clearSearchBtn.addEventListener('click', clearSearch);
        
        // Theme Toggle
        themeToggle.addEventListener('click', toggleTheme);
        
        // Filters & Sorting
        genreContainer.addEventListener('click', handleGenreChange);
        ratingSlider.addEventListener('input', handleRatingChange);
        sortBySelect.addEventListener('change', handleSortChange);
        resetFiltersBtn.addEventListener('click', resetFilters);
        
        // Modal Closing
        modalCloseBtn.addEventListener('click', closeModal);
        movieModal.addEventListener('click', (e) => {
            if (e.target === movieModal) closeModal();
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });
        
        // Hero section action
        heroInfoBtn.addEventListener('click', () => {
            if (currentShow) openModal(currentShow.id);
        });
    }
    /* --------------------------------------------------------------------------
       3. Theme Toggling
       -------------------------------------------------------------------------- */
    function loadSavedTheme() {
        const savedTheme = localStorage.getItem('cinewave-theme');
        if (savedTheme === 'neon') {
            activeTheme = 'neon';
            document.body.className = 'theme-neon';
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        } else {
            activeTheme = 'dark';
            document.body.className = 'theme-dark';
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        }
    }
    function toggleTheme() {
        if (activeTheme === 'dark') {
            activeTheme = 'neon';
            document.body.className = 'theme-neon';
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            localStorage.setItem('cinewave-theme', 'neon');
        } else {
            activeTheme = 'dark';
            document.body.className = 'theme-dark';
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            localStorage.setItem('cinewave-theme', 'dark');
        }
        
        // Play click animation on theme toggle button
        themeToggle.style.transform = 'scale(0.9)';
        setTimeout(() => {
            themeToggle.style.transform = '';
        }, 150);
    }
    /* --------------------------------------------------------------------------
       4. Fetching Data from API
       -------------------------------------------------------------------------- */
    async function fetchShows(query) {
        showLoadingState();
        try {
            const response = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`);
            if (!response.ok) throw new Error('API Request failed');
            
            const results = await response.json();
            
            // Map the search scores and show objects
            shows = results.map(item => ({
                id: item.show.id,
                name: item.show.name,
                genres: item.show.genres || [],
                rating: item.show.rating?.average || null,
                image: item.show.image?.medium || item.show.image?.original || null,
                originalImage: item.show.image?.original || null,
                summary: item.show.summary || 'No description available.',
                premiered: item.show.premiered ? item.show.premiered.split('-')[0] : 'N/A',
                premieredFull: item.show.premiered || 'N/A',
                language: item.show.language || 'English',
                runtime: item.show.runtime ? `${item.show.runtime} mins` : 'N/A',
                network: item.show.network?.name || item.show.webChannel?.name || 'N/A',
                officialSite: item.show.officialSite || '',
                score: item.score || 0
            }));
            
            if (shows.length > 0) {
                // Set the highest rated or first search result as the featured show in the Hero Section
                const sortedForHero = [...shows].sort((a, b) => (b.rating || 0) - (a.rating || 0));
                setHeroShow(sortedForHero[0]);
                emptyState.classList.add('hidden');
            } else {
                setHeroPlaceholder();
            }
            
            applyFiltersAndSort();
        } catch (error) {
            console.error('Error fetching shows:', error);
            showErrorState();
        }
    }
    function showLoadingState() {
        movieGrid.innerHTML = `
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
            <div class="shimmer-card"></div>
        `;
        resultsCount.textContent = 'Searching...';
        emptyState.classList.add('hidden');
    }
    function showErrorState() {
        movieGrid.innerHTML = '';
        resultsCount.textContent = '0 shows found';
        emptyState.classList.remove('hidden');
        const emptyIcon = emptyState.querySelector('.empty-icon');
        const emptyTitle = emptyState.querySelector('h3');
        const emptyText = emptyState.querySelector('p');
        
        emptyIcon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        emptyTitle.textContent = 'Oops! Something went wrong';
        emptyText.textContent = 'We couldn\'t load movie data. Please check your network and try again.';
    }
    /* --------------------------------------------------------------------------
       5. Render Hero & Grid
       -------------------------------------------------------------------------- */
    function setHeroShow(show) {
        currentShow = show;
        heroSection.style.display = 'flex';
        
        // Set background image
        const imageSrc = show.originalImage || show.image || fallbackPoster;
        heroBackdrop.style.backgroundImage = `url('${imageSrc}')`;
        
        heroTitle.textContent = show.name;
        heroRating.innerHTML = `<i class="fa-solid fa-star"></i> ${show.rating ? show.rating.toFixed(1) : 'N/A'}`;
        heroYear.textContent = show.premiered;
        heroGenres.textContent = show.genres.length > 0 ? show.genres.slice(0, 3).join(', ') : 'TV Show';
        
        // Strip HTML tags from summary for short preview
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = show.summary;
        const plainSummary = tempDiv.textContent || tempDiv.innerText || '';
        heroDescription.textContent = plainSummary.substring(0, 200) + (plainSummary.length > 200 ? '...' : '');
    }
    function setHeroPlaceholder() {
        heroSection.style.display = 'none';
        currentShow = null;
    }
    function renderMovieGrid(list) {
        movieGrid.innerHTML = '';
        resultsCount.textContent = `${list.length} show${list.length !== 1 ? 's' : ''} found`;
        
        if (list.length === 0) {
            emptyState.classList.remove('hidden');
            // Restore default empty message if it was modified by error state
            const emptyIcon = emptyState.querySelector('.empty-icon');
            const emptyTitle = emptyState.querySelector('h3');
            const emptyText = emptyState.querySelector('p');
            emptyIcon.innerHTML = '<i class="fa-solid fa-film"></i>';
            emptyTitle.textContent = 'No movies or shows found';
            emptyText.textContent = 'Try searching for something else or adjusting your filters.';
            return;
        }
        
        emptyState.classList.add('hidden');
        
        list.forEach((show, index) => {
            const card = document.createElement('div');
            card.className = 'movie-card';
            card.style.animationDelay = `${index * 50}ms`;
            
            const ratingText = show.rating ? show.rating.toFixed(1) : 'N/A';
            const genresHTML = show.genres.slice(0, 2).map(g => `<span class="card-genre">${g}</span>`).join('');
            const posterSrc = show.image || fallbackPoster;
            
            card.innerHTML = `
                <div class="card-poster-wrapper">
                    <img class="card-poster" src="${posterSrc}" alt="${show.name} Poster" loading="lazy">
                    <div class="card-rating-badge">
                        <i class="fa-solid fa-star"></i> ${ratingText}
                    </div>
                </div>
                <div class="card-content">
                    <div class="card-genres">
                        ${genresHTML || '<span class="card-genre">General</span>'}
                    </div>
                    <h3 class="card-title" title="${show.name}">${show.name}</h3>
                    <div class="card-footer">
                        <span class="card-year">${show.premiered}</span>
                        <button class="card-btn">Details <i class="fa-solid fa-arrow-right"></i></button>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => openModal(show.id));
            movieGrid.appendChild(card);
        });
    }
    /* --------------------------------------------------------------------------
       6. Search & Filters Logic
       -------------------------------------------------------------------------- */
    async function handleSearch() {
        const query = movieSearch.value.trim();
        
        if (query.length > 0) {
            clearSearchBtn.classList.remove('hidden');
            sectionHeading.textContent = `Search Results: "${query}"`;
            await fetchShows(query);
        } else {
            clearSearchBtn.classList.add('hidden');
            // If empty search, reset to trending
            const randomQuery = trendingQueries[Math.floor(Math.random() * trendingQueries.length)];
            sectionHeading.textContent = `Trending: ${randomQuery}`;
            await fetchShows(randomQuery);
        }
    }
    function clearSearch() {
        movieSearch.value = '';
        clearSearchBtn.classList.add('hidden');
        handleSearch();
    }
    function handleGenreChange(e) {
        if (!e.target.classList.contains('genre-tag')) return;
        
        // Update UI active tag
        document.querySelectorAll('.genre-tag').forEach(tag => tag.classList.remove('active'));
        e.target.classList.add('active');
        
        selectedGenre = e.target.getAttribute('data-genre');
        applyFiltersAndSort();
    }
    function handleRatingChange() {
        minRating = parseFloat(ratingSlider.value);
        ratingVal.textContent = minRating.toFixed(1);
        
        // Dynamically style slider filled track background
        const fillPercent = (minRating / 10) * 100;
        ratingSlider.style.background = `linear-gradient(to right, var(--accent-color) 0%, var(--accent-color) ${fillPercent}%, var(--bg-input) ${fillPercent}%, var(--bg-input) 100%)`;
        
        applyFiltersAndSort();
    }
    function handleSortChange() {
        sortBy = sortBySelect.value;
        applyFiltersAndSort();
    }
    function resetFilters() {
        // Reset Genres UI
        document.querySelectorAll('.genre-tag').forEach(tag => tag.classList.remove('active'));
        document.querySelector('.genre-tag[data-genre="all"]').classList.add('active');
        selectedGenre = 'all';
        
        // Reset Slider UI
        ratingSlider.value = '0';
        ratingVal.textContent = '0';
        ratingSlider.style.background = '';
        minRating = 0;
        
        // Reset Sort UI
        sortBySelect.value = 'popularity';
        sortBy = 'popularity';
        
        applyFiltersAndSort();
    }
    function applyFiltersAndSort() {
        let filtered = [...shows];
        
        // 1. Filter by Genre
        if (selectedGenre !== 'all') {
            filtered = filtered.filter(show => 
                show.genres.some(g => g.toLowerCase() === selectedGenre.toLowerCase())
            );
        }
        
        // 2. Filter by Rating
        if (minRating > 0) {
            filtered = filtered.filter(show => (show.rating || 0) >= minRating);
        }
        
        // 3. Sorting
        switch (sortBy) {
            case 'ratingDesc':
                filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
                break;
            case 'ratingAsc':
                filtered.sort((a, b) => {
                    if (a.rating === null) return 1;
                    if (b.rating === null) return -1;
                    return a.rating - b.rating;
                });
                break;
            case 'nameAsc':
                filtered.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'nameDesc':
                filtered.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'yearDesc':
                filtered.sort((a, b) => {
                    const yearA = parseInt(a.premiered) || 0;
                    const yearB = parseInt(b.premiered) || 0;
                    return yearB - yearA;
                });
                break;
            case 'yearAsc':
                filtered.sort((a, b) => {
                    const yearA = parseInt(a.premiered) || 9999;
                    const yearB = parseInt(b.premiered) || 9999;
                    return yearA - yearB;
                });
                break;
            case 'popularity':
            default:
                // Sort by default search score from API
                filtered.sort((a, b) => b.score - a.score);
                break;
        }
        
        renderMovieGrid(filtered);
    }
    /* --------------------------------------------------------------------------
       7. Modal (Detail View)
       -------------------------------------------------------------------------- */
    async function openModal(showId) {
        // Show loading state inside the modal
        movieModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Disable page scrolling
        
        modalContent.innerHTML = `
            <div class="modal-shimmer">
                <div class="shimmer-box shimmer-image"></div>
                <div class="shimmer-info">
                    <div class="shimmer-box shimmer-title"></div>
                    <div class="shimmer-box shimmer-line"></div>
                    <div class="shimmer-box shimmer-line"></div>
                    <div class="shimmer-box shimmer-text"></div>
                </div>
            </div>
        `;
        
        try {
            // Find show details locally, but request TVMaze show with cast extension for a gorgeous experience
            const localDetails = shows.find(s => s.id === showId);
            const response = await fetch(`https://api.tvmaze.com/shows/${showId}?embed=cast`);
            
            if (!response.ok) {
                // If the embedded fetch fails, fallback to local details
                if (localDetails) {
                    renderModalContent(localDetails, null);
                } else {
                    throw new Error('Show details not found');
                }
                return;
            }
            
            const detailedShow = await response.json();
            renderModalContent(detailedShow, detailedShow._embedded?.cast || []);
        } catch (error) {
            console.error('Error fetching detailed show info:', error);
            modalContent.innerHTML = `
                <div style="padding: 60px; text-align: center; width: 100%;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 48px; color: var(--color-danger); margin-bottom: 20px;"></i>
                    <h3>Failed to load show details</h3>
                    <p style="color: var(--text-secondary); margin-top: 8px;">Please check your connection and try again.</p>
                </div>
            `;
        }
    }
    function closeModal() {
        movieModal.classList.remove('active');
        document.body.style.overflow = ''; // Restore page scrolling
    }
    function renderModalContent(show, castList) {
        const ratingText = show.rating?.average ? `${show.rating.average.toFixed(1)}/10` : 'N/A';
        const posterSrc = show.image?.medium || show.image?.original || fallbackPoster;
        const genresHTML = show.genres && show.genres.length > 0 
            ? show.genres.map(g => `<span class="modal-badge">${g}</span>`).join('') 
            : '<span class="modal-badge">General</span>';
            
        // Premiered and status formatting
        const premieredYear = show.premiered ? show.premiered.split('-')[0] : 'N/A';
        const formattedPremiere = show.premiered || 'N/A';
        const officialLink = show.officialSite 
            ? `<a href="${show.officialSite}" target="_blank" class="modal-action-btn modal-btn-primary"><i class="fa-solid fa-play"></i> Watch Official</a>`
            : '';
            
        // Render up to 5 cast members if available
        let castHTML = '';
        if (castList && castList.length > 0) {
            const topCast = castList.slice(0, 5);
            const castItems = topCast.map(member => {
                const headshot = member.person.image?.medium || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop';
                return `
                    <div style="display: flex; align-items: center; gap: 12px; background: var(--bg-input); padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-color);">
                        <img src="${headshot}" alt="${member.person.name}" style="width: 40px; height: 40px; border-radius: var(--radius-circle); object-fit: cover;">
                        <div style="display: flex; flex-direction: column;">
                            <span style="font-size: 13px; font-weight: 700; color: var(--text-primary); line-height: 1.2;">${member.person.name}</span>
                            <span style="font-size: 11px; color: var(--text-muted);">${member.character.name}</span>
                        </div>
                    </div>
                `;
            }).join('');
            
            castHTML = `
                <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 16px;">
                    <h4 style="font-size: 14px; text-transform: uppercase; color: var(--text-muted); font-weight: 700;">Key Cast</h4>
                    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 8px;">
                        ${castItems}
                    </div>
                </div>
            `;
        }
        modalContent.innerHTML = `
            <div class="modal-grid">
                <div class="modal-poster-side">
                    <img class="modal-poster-img" src="${posterSrc}" alt="${show.name} Poster">
                </div>
                <div class="modal-info-side">
                    <h2 class="modal-title">${show.name}</h2>
                    <div class="modal-badges">
                        <span class="modal-badge modal-badge-rating">
                            <i class="fa-solid fa-star"></i> ${ratingText}
                        </span>
                        <span class="modal-badge">${premieredYear}</span>
                        <span class="modal-badge">${show.runtime ? `${show.runtime}m` : 'N/A'}</span>
                        <span class="modal-badge" style="text-transform: uppercase;">${show.language}</span>
                    </div>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 6px;">
                        ${genresHTML}
                    </div>
                    <div class="modal-summary-section">
                        <h4>Synopsis</h4>
                        <div class="modal-summary-text">${show.summary || 'No summary available.'}</div>
                    </div>
                    <div class="modal-details-list">
                        <div class="details-item">
                            <span class="details-label">Network / Channel</span>
                            <span class="details-value">${show.network?.name || show.webChannel?.name || 'N/A'}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Premiere Date</span>
                            <span class="details-value">${formattedPremiere}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Status</span>
                            <span class="details-value">${show.status || 'N/A'}</span>
                        </div>
                        <div class="details-item">
                            <span class="details-label">Schedule</span>
                            <span class="details-value">${show.schedule?.days?.join(', ') || 'N/A'} (${show.schedule?.time || 'N/A'})</span>
                        </div>
                    </div>
                    ${castHTML}
                    <div class="modal-actions">
                        ${officialLink}
                        <a href="https://www.imdb.com/find?q=${encodeURIComponent(show.name)}" target="_blank" rel="noopener noreferrer" class="modal-action-btn modal-btn-secondary">
                            <i class="fa-brands fa-imdb"></i> IMDb Search
                        </a>
                        <a href="${show.url}" target="_blank" rel="noopener noreferrer" class="modal-action-btn modal-btn-secondary">
                            <i class="fa-solid fa-link"></i> TVMaze Info
                        </a>
                    </div>
                </div>
            </div>
        `;
    }
    /* --------------------------------------------------------------------------
       8. Debounce Helper
       -------------------------------------------------------------------------- */
    function debounce(func, wait) {
        let timeout;
        return function(...args) {
            const context = this;
            clearTimeout(timeout);
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    }
    // Initialize application
    init();
});
