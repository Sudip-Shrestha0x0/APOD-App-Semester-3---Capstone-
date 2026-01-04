// NASA APOD API Configuration
const NASA_API_KEY = 'NQVetJz2Pgam8m88NTbj6h3bcyokrOnKSMwp0lc4';
const NASA_API_BASE_URL = 'https://api.nasa.gov/planetary/apod';

// Global state management
let currentAPOD = null;
let favorites = JSON.parse(localStorage.getItem('apod-favorites')) || [];

// DOM Elements
const elements = {
    // Navigation
    hamburger: document.getElementById('hamburger'),
    navMenu: document.getElementById('navMenu'),
    navLinks: document.querySelectorAll('.nav-link'),
    
    // Pages
    pages: document.querySelectorAll('.page'),
    
    // Search
    searchForm: document.getElementById('searchForm'),
    dateInput: document.getElementById('dateInput'),
    searchBtn: document.getElementById('searchBtn'),
    
    // APOD Display
    apodSection: document.getElementById('apodSection'),
    apodImage: document.getElementById('apodImage'),
    apodTitle: document.getElementById('apodTitle'),
    apodDate: document.getElementById('apodDate'),
    apodDescription: document.getElementById('apodDescription'),
    favoriteBtn: document.getElementById('favoriteBtn'),
    
    // Home Favorites
    homeFavoritesSection: document.getElementById('homeFavoritesSection'),
    homeFavoritesGrid: document.getElementById('homeFavoritesGrid'),
    
    // Loading and Error
    loading: document.getElementById('loading'),
    errorMessage: document.getElementById('errorMessage'),
    errorText: document.getElementById('errorText'),
    retryBtn: document.getElementById('retryBtn'),
    
    // Favorites
    favoritesGrid: document.getElementById('favoritesGrid'),
    favoritesCount: document.getElementById('favoritesCount'),
    clearAllBtn: document.getElementById('clearAllBtn'),
    exploreBtn: document.getElementById('exploreBtn'),
    
    // Toast
    toast: document.getElementById('toast'),
    toastClose: document.getElementById('toastClose'),
    
    // Footer
    footerLinks: document.querySelectorAll('.footer-links a[data-page]')
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupEventListeners();
    setDefaultDate();
    updateFavoritesDisplay();
    updateHomeFavoritesDisplay();
    updateFavoritesCount();
    
    // Set initial page
    switchPage('home');
    
    console.log('🌌 Stellar View initialized successfully!');
}

function setupEventListeners() {
    // Hamburger menu toggle
    if (elements.hamburger) {
        elements.hamburger.addEventListener('click', toggleMobileMenu);
    }
    
    // Navigation links
    elements.navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Footer navigation links
    elements.footerLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    // Search form
    if (elements.searchForm) {
        elements.searchForm.addEventListener('submit', handleSearch);
    }
    
    // Favorite button
    if (elements.favoriteBtn) {
        elements.favoriteBtn.addEventListener('click', toggleFavorite);
    }
    
    // Clear all favorites
    if (elements.clearAllBtn) {
        elements.clearAllBtn.addEventListener('click', confirmClearAllFavorites);
    }
    
    // Explore button
    if (elements.exploreBtn) {
        elements.exploreBtn.addEventListener('click', () => switchPage('home'));
    }
    
    // Retry button
    if (elements.retryBtn) {
        elements.retryBtn.addEventListener('click', hideError);
    }
    
    // Toast close button
    if (elements.toastClose) {
        elements.toastClose.addEventListener('click', hideToast);
    }
    
    // Event delegation for dynamically created content
    document.addEventListener('click', handleDynamicClicks);
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!elements.navMenu?.contains(e.target) && !elements.hamburger?.contains(e.target)) {
            closeMobileMenu();
        }
    });
    
    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMobileMenu();
        }
    });
}

// Event delegation for dynamic content
function handleDynamicClicks(e) {
    const target = e.target;
    
    // Handle view favorite buttons
    if (target.classList.contains('view-btn')) {
        const favoriteItem = target.closest('.favorite-item');
        const date = favoriteItem?.dataset.date;
        if (date) {
            viewFavorite(date);
        }
    }
    
    // Handle remove favorite buttons
    if (target.classList.contains('remove-btn')) {
        const favoriteItem = target.closest('.favorite-item');
        const date = favoriteItem?.dataset.date;
        if (date) {
            removeFavorite(date);
        }
    }
    
    // Handle favorite image clicks
    if (target.classList.contains('favorite-image')) {
        const favoriteItem = target.closest('.favorite-item');
        const date = favoriteItem?.dataset.date;
        if (date) {
            viewFavorite(date);
        }
    }
    
    // Handle explore button in empty state
    if (target.classList.contains('explore-btn')) {
        switchPage('home');
    }
}

// Navigation Functions
function toggleMobileMenu() {
    if (elements.hamburger) {
        elements.hamburger.classList.toggle('active');
    }
    if (elements.navMenu) {
        elements.navMenu.classList.toggle('active');
    }
}

function closeMobileMenu() {
    if (elements.hamburger) {
        elements.hamburger.classList.remove('active');
    }
    if (elements.navMenu) {
        elements.navMenu.classList.remove('active');
    }
}

function handleNavigation(e) {
    e.preventDefault();
    const page = e.target.getAttribute('data-page');
    if (page) {
        switchPage(page);
        closeMobileMenu();
    }
}

function switchPage(pageName) {
    console.log('Switching to page:', pageName);
    
    // Update nav links
    elements.navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('data-page') === pageName) {
            link.classList.add('active');
        }
    });
    
    // Update pages
    elements.pages.forEach(page => {
        page.classList.remove('active');
        if (page.id === pageName) {
            page.classList.add('active');
        }
    });
    
    // Update page-specific content
    if (pageName === 'favorites') {
        updateFavoritesDisplay();
    } else if (pageName === 'home') {
        updateHomeFavoritesDisplay();
    }
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Date handling
function setDefaultDate() {
    if (elements.dateInput) {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        elements.dateInput.value = yesterday.toISOString().split('T')[0];
        elements.dateInput.max = yesterday.toISOString().split('T')[0];
    }
}

// Search functionality
async function handleSearch(e) {
    e.preventDefault();
    
    const selectedDate = elements.dateInput?.value;
    if (!selectedDate) {
        showToast('Please select a date', 'error');
        return;
    }
    
    // Validate date range
    const today = new Date();
    const selectedDateObj = new Date(selectedDate);
    const minDate = new Date('1995-06-16'); // APOD started June 16, 1995
    
    if (selectedDateObj > today) {
        showToast('Please select a date in the past', 'error');
        return;
    }
    
    if (selectedDateObj < minDate) {
        showToast('APOD data is only available from June 16, 1995', 'error');
        return;
    }
    
    await fetchAPOD(selectedDate);
}

async function fetchAPOD(date) {
    showLoading();
    hideError();
    
    try {
        const url = `${NASA_API_BASE_URL}?api_key=${NASA_API_KEY}&date=${date}`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Check if it's an image (not video)
        if (data.media_type !== 'image') {
            throw new Error('This date contains a video instead of an image. Please select a different date.');
        }
        
        currentAPOD = data;
        displayAPOD(data);
        showToast('APOD loaded successfully! 🌌', 'success');
        
    } catch (error) {
        console.error('Error fetching APOD:', error);
        showError(error.message);
        showToast('Failed to load APOD', 'error');
    } finally {
        hideLoading();
    }
}

function displayAPOD(data) {
    if (!data) return;
    
    // Update image
    if (elements.apodImage) {
        elements.apodImage.src = data.hdurl || data.url;
        elements.apodImage.alt = data.title;
        elements.apodImage.onerror = function() {
            this.src = data.url; // Fallback to regular quality if HD fails
        };
    }
    
    // Update title
    if (elements.apodTitle) {
        elements.apodTitle.textContent = data.title;
    }
    
    // Update date
    if (elements.apodDate) {
        const formattedDate = formatDate(data.date);
        elements.apodDate.textContent = formattedDate;
    }
    
    // Update description
    if (elements.apodDescription) {
        elements.apodDescription.textContent = data.explanation;
    }
    
    // Update favorite button state
    updateFavoriteButton();
    
    // Show the APOD section
    if (elements.apodSection) {
        elements.apodSection.classList.add('show');
    }
}

// Favorites functionality
function toggleFavorite() {
    if (!currentAPOD) {
        showToast('No APOD selected', 'error');
        return;
    }
    
    const favoriteIndex = favorites.findIndex(fav => fav.date === currentAPOD.date);
    
    if (favoriteIndex === -1) {
        // Add to favorites
        const favoriteItem = {
            date: currentAPOD.date,
            title: currentAPOD.title,
            url: currentAPOD.url,
            hdurl: currentAPOD.hdurl,
            explanation: currentAPOD.explanation,
            addedAt: new Date().toISOString()
        };
        
        favorites.unshift(favoriteItem); // Add to beginning
        showToast('Added to favorites! ⭐', 'success');
    } else {
        // Remove from favorites
        favorites.splice(favoriteIndex, 1);
        showToast('Removed from favorites', 'success');
    }
    
    saveFavorites();
    updateFavoriteButton();
    updateFavoritesCount();
    updateHomeFavoritesDisplay();
    
    // Update favorites display if on favorites page
    const favoritesPage = document.getElementById('favorites');
    if (favoritesPage?.classList.contains('active')) {
        updateFavoritesDisplay();
    }
}

function updateFavoriteButton() {
    if (!elements.favoriteBtn || !currentAPOD) return;
    
    const isFavorited = favorites.some(fav => fav.date === currentAPOD.date);
    const starIcon = elements.favoriteBtn.querySelector('.star-icon');
    const btnText = elements.favoriteBtn.querySelector('.btn-text');
    
    if (isFavorited) {
        elements.favoriteBtn.classList.add('favorited');
        if (starIcon) starIcon.textContent = '★';
        if (btnText) btnText.textContent = 'Remove from Favorites';
        elements.favoriteBtn.title = 'Remove from Favorites';
    } else {
        elements.favoriteBtn.classList.remove('favorited');
        if (starIcon) starIcon.textContent = '⭐';
        if (btnText) btnText.textContent = 'Add to Favorites';
        elements.favoriteBtn.title = 'Add to Favorites';
    }
}

function updateHomeFavoritesDisplay() {
    if (!elements.homeFavoritesGrid) return;
    
    if (favorites.length === 0) {
        elements.homeFavoritesGrid.innerHTML = `
            <div class="empty-home-favorites">
                <div class="empty-icon">🌌</div>
                <h3>No favorites yet</h3>
                <p>Start exploring and add your favorite cosmic discoveries!</p>
            </div>
        `;
        return;
    }
    
    // Show only first 3 favorites on home page
    const displayFavorites = favorites.slice(0, 3);
    
    elements.homeFavoritesGrid.innerHTML = displayFavorites.map(favorite => `
        <div class="favorite-item" data-date="${favorite.date}">
            <img src="${favorite.url}" 
                 alt="${favorite.title}" 
                 class="favorite-image">
            <div class="favorite-info">
                <h3 class="favorite-title">${favorite.title}</h3>
                <p class="favorite-date">${formatDate(favorite.date)}</p>
                <div class="favorite-actions">
                    <button class="view-btn">
                        👁️ View
                    </button>
                    <button class="remove-btn">
                        🗑️ Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function updateFavoritesDisplay() {
    if (!elements.favoritesGrid) return;
    
    if (favorites.length === 0) {
        elements.favoritesGrid.innerHTML = `
            <div class="empty-favorites">
                <div class="empty-icon">🌌</div>
                <h3>No favorites yet</h3>
                <p>Start exploring and add your favorite cosmic discoveries!</p>
                <button class="explore-btn">
                    🚀 Start Exploring
                </button>
            </div>
        `;
        return;
    }
    
    elements.favoritesGrid.innerHTML = favorites.map(favorite => `
        <div class="favorite-item" data-date="${favorite.date}">
            <img src="${favorite.url}" 
                 alt="${favorite.title}" 
                 class="favorite-image">
            <div class="favorite-info">
                <h3 class="favorite-title">${favorite.title}</h3>
                <p class="favorite-date">${formatDate(favorite.date)}</p>
                <div class="favorite-actions">
                    <button class="view-btn">
                        👁️ View
                    </button>
                    <button class="remove-btn">
                        🗑️ Remove
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

function viewFavorite(date) {
    const favorite = favorites.find(fav => fav.date === date);
    if (favorite) {
        currentAPOD = favorite;
        if (elements.dateInput) {
            elements.dateInput.value = date;
        }
        displayAPOD(favorite);
        switchPage('home');
        showToast('Viewing favorite APOD', 'success');
    }
}

function removeFavorite(date) {
    if (confirm('Are you sure you want to remove this favorite?')) {
        favorites = favorites.filter(fav => fav.date !== date);
        saveFavorites();
        updateFavoritesDisplay();
        updateHomeFavoritesDisplay();
        updateFavoritesCount();
        updateFavoriteButton();
        showToast('Favorite removed', 'success');
    }
}

function confirmClearAllFavorites() {
    if (favorites.length === 0) {
        showToast('No favorites to clear', 'error');
        return;
    }
    
    if (confirm(`Are you sure you want to remove all ${favorites.length} favorites? This action cannot be undone.`)) {
        clearAllFavorites();
    }
}

function clearAllFavorites() {
    favorites = [];
    saveFavorites();
    updateFavoritesDisplay();
    updateHomeFavoritesDisplay();
    updateFavoritesCount();
    updateFavoriteButton();
    showToast('All favorites cleared', 'success');
}

function updateFavoritesCount() {
    if (elements.favoritesCount) {
        elements.favoritesCount.textContent = favorites.length;
    }
}

function saveFavorites() {
    try {
        localStorage.setItem('apod-favorites', JSON.stringify(favorites));
    } catch (error) {
        console.error('Error saving favorites:', error);
        showToast('Error saving favorites', 'error');
    }
}

// Utility functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function showLoading() {
    if (elements.loading) {
        elements.loading.classList.add('show');
    }
    if (elements.searchBtn) {
        elements.searchBtn.disabled = true;
        const btnText = elements.searchBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = 'Searching...';
        }
    }
}

function hideLoading() {
    if (elements.loading) {
        elements.loading.classList.remove('show');
    }
    if (elements.searchBtn) {
        elements.searchBtn.disabled = false;
        const btnText = elements.searchBtn.querySelector('.btn-text');
        if (btnText) {
            btnText.textContent = 'Search APOD';
        }
    }
}

function showError(message) {
    if (elements.errorMessage) {
        elements.errorMessage.classList.add('show');
        if (elements.errorText) {
            elements.errorText.textContent = message;
        }
    }
}

function hideError() {
    if (elements.errorMessage) {
        elements.errorMessage.classList.remove('show');
    }
}

function showToast(message, type = 'success') {
    if (!elements.toast) return;
    
    const toastIcon = elements.toast.querySelector('.toast-icon');
    const toastMessage = elements.toast.querySelector('.toast-message');
    
    // Set icon based on type
    if (toastIcon) {
        toastIcon.textContent = type === 'success' ? '✅' : '❌';
    }
    
    // Set message
    if (toastMessage) {
        toastMessage.textContent = message;
    }
    
    // Set type class
    elements.toast.className = `toast ${type}`;
    elements.toast.classList.add('show');
    
    // Auto hide after 4 seconds
    setTimeout(() => {
        hideToast();
    }, 4000);
}

function hideToast() {
    if (elements.toast) {
        elements.toast.classList.remove('show');
    }
}

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // ESC key to close mobile menu
    if (e.key === 'Escape') {
        closeMobileMenu();
        hideToast();
    }
    
    // Enter key on favorite button
    if (e.key === 'Enter' && e.target === elements.favoriteBtn) {
        toggleFavorite();
    }
    
    // Keyboard shortcuts
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                switchPage('home');
                break;
            case '2':
                e.preventDefault();
                switchPage('favorites');
                break;
            case '3':
                e.preventDefault();
                switchPage('about');
                break;
        }
    }
});

// Performance optimization - Lazy loading for images
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            }
        });
    });
    
    // Observe all images with data-src attribute
    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// Error handling for unhandled promise rejections
window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
    showToast('An unexpected error occurred', 'error');
});

// Service Worker registration for offline capability
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        console.log('Service Worker support detected');
    });
}