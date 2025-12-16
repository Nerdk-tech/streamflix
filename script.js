// ====================================================================
// StreamFlix: script.js - Application Logic and API Integration
// This file contains all the corrected JavaScript functions.
// ====================================================================

// --- API CONFIGURATION ---
const API_KEY = "Godszeal"; 
const BASE_URL = "https://gzmovieboxapi.vercel.app/api/";

// API ENDPOINT URLs
const HOT_CONTENT_URL = `${BASE_URL}hot-movies-series?apikey=${API_KEY}`;
const SEARCH_URL = `${BASE_URL}search?apikey=${API_KEY}`;
const MEDIA_URL = `${BASE_URL}media?apikey=${API_KEY}`;
const DETAIL_URL = `${BASE_URL}item-details?apikey=${API_KEY}`;


// ====================================================================
// CORE UTILITY FUNCTIONS
// ====================================================================

function toggleContentSections(isSearching, isDetail) {
    const isHome = !isSearching && !isDetail;
    document.getElementById('detail-page').style.display = isDetail ? 'block' : 'none';
    document.getElementById('search-results-section').style.display = isSearching ? 'block' : 'none';
    document.getElementById('hot-movies-section').style.display = isHome ? 'block' : 'none';
    document.getElementById('hot-series-section').style.display = isHome ? 'block' : 'none';
    document.getElementById('video-player-section').style.display = 'none';
}

function clearSearch() {
    document.getElementById('search-input').value = "";
    toggleContentSections(false, false);
    document.querySelector('.main-container').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ====================================================================
// API 4: Fetch and Display the Stream (Robust Error Handling)
// ====================================================================
async function fetchAndDisplayStream(subjectId, detailPath, title) {
    const playerSection = document.getElementById('video-player-section');
    const playerContainer = document.getElementById('player-container');
    const playerMessage = document.getElementById('player-message');
    const videoTitle = document.getElementById('video-title');

    playerContainer.innerHTML = '<p class="message">Fetching stream link...</p>';
    videoTitle.textContent = `Now Playing: ${title}`;
    playerSection.style.display = 'block';
    playerMessage.textContent = 'Please wait while we secure the stream link.';

    playerSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const streamUrl = `${MEDIA_URL}&subjectId=${subjectId}&detailPath=${detailPath}`;

    try {
        const response = await fetch(streamUrl);
        const data = await response.json();

        if (data && data.data && data.data.resource) {
            // --- SUCCESS PATH: Video link found in the expected structure ---
            const resource = data.data.resource;
            const videoLink = resource.hls || resource.mp4;
            const finalTitle = title || 'Media Content';

            if (videoLink) {
                playerMessage.textContent = 'Stream found! Playing video.';
                videoTitle.textContent = `Now Playing: ${finalTitle}`;
                playerContainer.innerHTML = `
                    <video id="streamflix-player" controls preload="auto" style="width: 100%; height: 500px; background-color: black;">
                        <source src="${videoLink}" type="${resource.hls ? 'application/x-mpegURL' : 'video/mp4'}">
                        Your browser does not support the video tag.
                    </video>
                `;

                const videoElement = document.getElementById('streamflix-player');
                videoElement.play().catch(e => {
                    console.error("Video Playback Error (Autoplay/CORS):", e);
                    playerMessage.textContent = 'Error: Video failed to auto-play (Browser restriction). Please tap the play button manually.';
                });
                
            } else {
                // Video link structure exists, but the link itself is null/empty
                playerMessage.textContent = 'Error: Resource found, but the direct video link (HLS/MP4) is missing.';
                playerContainer.innerHTML = '<p class="message">The API is not providing a direct stream link for this content.</p>';
            }

        } else if (data && data.status === 'error') {
            // --- API ERROR PATH: API reports an error status ---
             playerMessage.textContent = `API Error: ${data.message || 'The API returned an error status.'}`;
             playerContainer.innerHTML = '<p class="message">Could not load the streaming resource due to an API error.</p>';
        
        } else if (data && data.message) {
            // --- CUSTOM MEDIA FETCH FAILURES: API returns a message instead of data.resource ---
            playerMessage.textContent = `Media Source Error: ${data.message}`;
            playerContainer.innerHTML = `<p class="message">The API could not find a playable resource for **${title}**.</p>`;
            
        } else {
            // --- CATCH-ALL FAILURE PATH: Unexpected JSON structure ---
            console.error("Unexpected API response structure:", data); 
            playerMessage.textContent = `General Fetch Error: Unknown response structure.`;
            playerContainer.innerHTML = '<p class="message">An unexpected error occurred during the media fetch. Please check your browser console (F12) for the full response data.</p>';
        }
    } catch (error) {
        console.error("Critical network error during stream fetch:", error);
        playerMessage.textContent = 'A critical network error occurred. Check your internet connection or console for details.';
        playerContainer.innerHTML = '<p class="message">Network request failed.</p>';
    }
}


// ====================================================================
// API 3: Fetch and Display Detail Page
// ====================================================================
async function showDetailPage(subjectId, detailPath, title, posterUrl) {
    const detailPage = document.getElementById('detail-page');
    toggleContentSections(false, true);
    detailPage.innerHTML = '<p class="message">Loading movie details...</p>';
    detailPage.scrollIntoView({ behavior: 'smooth', block: 'start' });

    const detailUrl = `${DETAIL_URL}&subjectId=${subjectId}&detailPath=${detailPath}`;

    try {
        const response = await fetch(detailUrl);
        const data = await response.json();
        
        if (data.status === 'success' && data.data) {
            const item = data.data;
            
            const castHtml = item.staffList 
                ? item.staffList.map(staff => `<span>${staff.name} (${staff.role})</span>`).join('')
                : 'No cast information available.';

            const finalTitle = item.title || title || 'Title Unavailable';

            detailPage.innerHTML = `
                <div class="detail-header">
                    <img src="${posterUrl}" alt="${finalTitle}" class="detail-poster">
                    <div class="detail-info">
                        <h1>${finalTitle}</h1>
                        <p class="detail-meta">
                            <i class="fa-solid fa-star" style="color: gold;"></i> ${item.imdbRatingValue || 'N/A'} 
                            | ${item.releaseDate ? item.releaseDate.substring(0, 4) : 'N/A'}
                            | ${item.genre ? item.genre.split(',').join(' / ') : 'N/A'}
                            | ${item.countryName || 'N/A'}
                        </p>
                        <p class="detail-plot">${item.description || 'No plot summary available.'}</p>
                        
                        <h3>Cast & Crew</h3>
                        <div class="detail-cast-list">${castHtml}</div>
                        
                        <button class="detail-play-button" onclick="fetchAndDisplayStream('${subjectId}', '${detailPath}', '${finalTitle}')">
                            <i class="fa-solid fa-play"></i> Play Now
                        </button>
                        <button onclick="clearSearch()" class="go-back-button" style="margin-left: 20px;">
                            <i class="fa-solid fa-arrow-left"></i> Back to Home
                        </button>
                    </div>
                </div>
            `;
            
        } else {
            detailPage.innerHTML = '<p class="message">Failed to load detailed information for this title.</p>';
        }

    } catch (error) {
        console.error("Error fetching detail page:", error);
        detailPage.innerHTML = '<p class="message">A network error occurred while fetching details.</p>';
    }
}


// ====================================================================
// Utility to create HTML cards (Includes ID and Image Safety Checks)
// ====================================================================
function createCard(item, containerId) {
    
    // --- CRITICAL SAFETY CHECK ---
    // If these key IDs are missing, the detail page and stream will always fail.
    if (!item.subjectId || !item.detailPath) {
        console.warn('Skipping card creation: Missing subjectId or detailPath for item:', item.title);
        return; 
    }
    
    const container = document.getElementById(containerId);
    
    // Defensive Checks for UI elements
    const cardTitle = item.title || 'Title Unknown';
    const cardCoverUrl = item.cover && item.cover.url ? item.cover.url : 'data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22150%22%20height%3D%22225%22%20viewBox%3D%220%200%20150%20225%22%3E%3Crect%20width%3D%22150%22%20height%3D%22225%22%20fill%3D%22%23333%22%2F%3E%3Ctext%20x%3D%2275%22%20y%3D%22115%22%20fill%3D%22%23E50914%22%20font-size%3D%2214%22%20text-anchor%3D%22middle%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E';
    
    const card = document.createElement('div');
    card.className = 'movie-card';
    
    // Clicking the card opens the Detail Page
    card.onclick = () => showDetailPage(item.subjectId, item.detailPath, cardTitle, cardCoverUrl);

    const img = document.createElement('img');
    img.src = cardCoverUrl;
    img.alt = cardTitle;

    const info = document.createElement('div');
    info.className = 'movie-info';

    const title = document.createElement('p');
    title.className = 'movie-title';
    title.textContent = cardTitle;

    const rating = document.createElement('p');
    rating.className = 'movie-rating';
    const ratingValue = item.imdbRatingValue && item.imdbRatingValue !== "0.0" ? item.imdbRatingValue : "N/A";
    rating.innerHTML = `<i class="fa-solid fa-star"></i> ${ratingValue}`;

    info.appendChild(title);
    info.appendChild(rating);
    card.appendChild(img);
    card.appendChild(info);
    container.appendChild(card);
}


// ====================================================================
// API 1: Fetch and Display Hot Movies/Series (Homepage)
// ====================================================================
async function fetchHotContent() {
    toggleContentSections(false, false); 
    
    const movieContent = document.getElementById('movie-content');
    const seriesContent = document.getElementById('series-content');

    movieContent.innerHTML = '<p class="message">Loading hot movies...</p>';
    seriesContent.innerHTML = '<p class="message">Loading trending series...</p>';

    try {
        const response = await fetch(HOT_CONTENT_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        movieContent.innerHTML = '';
        seriesContent.innerHTML = '';

        if (data.data && data.data.movie && data.data.movie.length > 0) {
            data.data.movie.forEach(item => createCard(item, 'movie-content'));
        } else {
            movieContent.innerHTML = '<p class="message">No hot movies found in the API data.</p>';
        }

        if (data.data && data.data.tv && data.data.tv.length > 0) {
            data.data.tv.forEach(item => createCard(item, 'series-content'));
        } else {
            seriesContent.innerHTML = '<p class="message">No trending series found in the API data.</p>';
        }

    } catch (error) {
        console.error("Critical error fetching hot content:", error);
        const errorMessage = `Failed to load content. Error: ${error.message}. Please check your connection or try searching.`;
        
        movieContent.innerHTML = `<p class="message" style="color: #E50914;">${errorMessage}</p>`;
        seriesContent.innerHTML = `<p class="message" style="color: #E50914;">If you just deployed, the API might be temporarily unresponsive.</p>`;
    }
}


// ====================================================================
// API 2: Fetch and Display Search Results
// ====================================================================
async function fetchSearchResults() {
    const searchInput = document.getElementById('search-input');
    const keyword = searchInput.value.trim();
    const searchContent = document.getElementById('search-content');
    const searchTitle = document.getElementById('search-results-title').querySelector('span');
    
    if (keyword.length < 2) {
        clearSearch(); 
        return;
    }

    toggleContentSections(true, false);
    searchTitle.textContent = `Search Results for "${keyword}"`;
    searchContent.innerHTML = '<p class="message">Searching...</p>';

    const encodedKeyword = encodeURIComponent(keyword);
    const searchUrl = `${SEARCH_URL}&keyword=${encodedKeyword}`;
    
    try {
        const response = await fetch(searchUrl);
        const data = await response.json();

        searchContent.innerHTML = '';

        if (data.data && data.data.items && data.data.items.length > 0) {
            data.data.items.forEach(item => createCard(item, 'search-content'));
            document.getElementById('search-results-section').scrollIntoView({ behavior: 'smooth', block: 'start' }); 
        } else {
            searchContent.innerHTML = `<p class="message">No results found for "${keyword}".</p>`;
        }

    } catch (error) {
        console.error("Error fetching search results:", error);
        searchContent.innerHTML = '<p class="message">Error fetching search results. Please check the console for details.</p>';
    }
}


// ====================================================================
// INITIALIZATION
// ====================================================================

// Event listener for pressing 'Enter' in the search bar
document.getElementById('search-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        fetchSearchResults();
    }
});

// Start the application by loading the hot content when the script loads
fetchHotContent();
