/**
 * AeroMusic App Logic Controller
 * Supports custom API base URL, HLS.js integration, Web Audio Equalizer Canvas, 
 * local storage caching, and a sandbox Demo Mode fallback.
 */

// --- Global App State ---
const state = {
  apiBaseUrl: window.location.origin + '/api',
  isDemoMode: false,
  currentTrack: null,
  playlistQueue: [],
  currentQueueIndex: -1,
  isPlaying: false,
  isShuffle: false,
  isLoop: false,
  favorites: [],
};

// --- Royalty-Free Mock Data for Sandbox Demo Mode ---
const demoTracks = [
  {
    id: "demo_1",
    title: "Lofi Study Session",
    artist: "Chill Beats Co.",
    img: "https://images.unsplash.com/photo-1518173946687-a4c8a383392e?q=80&w=300&h=300&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    lyrics: `
      <p>[Instrumental Lofi Intro]</p>
      <p>Soft rain drops tap against the window pane...</p>
      <p>A warm cup of coffee by my side...</p>
      <p>Studying away, day turns into night...</p>
      <p>Just chill beats to keep the mind at ease...</p>
      <p>Feel the rhythm of the gentle breeze...</p>
      <p>Lost inside the melodies, drifting away...</p>
      <p>[Mellow Keyboard Bridge]</p>
      <p>Tomorrow is another quiet day...</p>
    `
  },
  {
    id: "demo_2",
    title: "Neon Horizons",
    artist: "Retro Synth",
    img: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=300&h=300&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
    lyrics: `
      <p>[Synthwave Electronic Beat]</p>
      <p>Cruising down the neon grid at midnight...</p>
      <p>Cybernetic skylines glowing so bright...</p>
      <p>Driving fast, chasing the arcade dreams...</p>
      <p>Nothing is ever quite what it seems...</p>
      <p>Lost in the frequency of retro waves...</p>
      <p>Rebels escaping from their digital caves...</p>
      <p>[Synthesizer Solo]</p>
      <p>Into the sunset, we ride away...</p>
    `
  },
  {
    id: "demo_3",
    title: "Midnight Groove",
    artist: "Jazz Cafe Collective",
    img: "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=300&h=300&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    lyrics: `
      <p>[Smooth Saxophone Intro]</p>
      <p>The lights dim low in the smoky room...</p>
      <p>A double bass hums, dispelling the gloom...</p>
      <p>A quiet table in the corner space...</p>
      <p>Time slows down in this jazz embrace...</p>
      <p>Just groove with the late night blues...</p>
      <p>Relax, there is nothing left to lose...</p>
      <p>[Soft Piano Chords]</p>
      <p>Let the jazz take care of you...</p>
    `
  },
  {
    id: "demo_4",
    title: "Electric Dreams",
    artist: "Future Wave",
    img: "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=300&h=300&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
    lyrics: `
      <p>[Electronic Synthesizer Intro]</p>
      <p>Waking up inside an electric dream...</p>
      <p>Floating downstream in digital streams...</p>
      <p>Pulses of light dancing in the code...</p>
      <p>Taking the synthetic open road...</p>
      <p>Can you feel the circuit start to spark?</p>
      <p>A glowing pathway cutting through the dark...</p>
      <p>[Synth Bass drop]</p>
      <p>Dreaming in electric blue...</p>
    `
  },
  {
    id: "demo_5",
    title: "Rainy Cafe",
    artist: "Lofi Beats",
    img: "https://images.unsplash.com/photo-1498804103079-a6351b050096?q=80&w=300&h=300&fit=crop",
    url: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
    lyrics: `
      <p>[Sound of rain and cup clinking]</p>
      <p>Rain pouring down outside the door...</p>
      <p>Soft piano keys floating off the floor...</p>
      <p>Warm mug in hand, watching the steam rise...</p>
      <p>Reflections of streetlights in your eyes...</p>
      <p>Shelter from the storm, cozy and warm...</p>
      <p>Lofi rhythms keeping us safe from harm...</p>
      <p>[Rain patterns continue]</p>
    `
  }
];

// --- DOM Elements ---
const audio = document.getElementById('main-audio');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const engineSelect = document.getElementById('engine-select');
const searchResultsList = document.getElementById('search-results-list');
const resultsCount = document.getElementById('results-count');
const settingsBtn = document.getElementById('settings-btn');
const demoBadge = document.getElementById('demo-badge');

const albumArt = document.getElementById('album-art');
const albumArtWrapper = document.getElementById('album-art-wrapper');
const trackTitle = document.getElementById('track-title');
const trackArtist = document.getElementById('track-artist');

const progressSlider = document.getElementById('progress-slider');
const progressFill = document.getElementById('progress-fill');
const currentTimeEl = document.getElementById('current-time');
const durationTimeEl = document.getElementById('duration-time');

const playPauseBtn = document.getElementById('play-pause-btn');
const playIcon = document.getElementById('play-icon');
const pauseIcon = document.getElementById('pause-icon');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const favoriteBtn = document.getElementById('favorite-btn');
const shuffleBtn = document.getElementById('shuffle-btn');
const loopBtn = document.getElementById('loop-btn');

const volumeBtn = document.getElementById('volume-btn');
const volumeIconHigh = document.getElementById('volume-icon-high');
const volumeIconMute = document.getElementById('volume-icon-mute');
const volumeSlider = document.getElementById('volume-slider');
const volumeFill = document.getElementById('volume-fill');

const tabQueue = document.getElementById('tab-queue');
const tabLyrics = document.getElementById('tab-lyrics');
const queueSection = document.getElementById('queue-section');
const lyricsSection = document.getElementById('lyrics-section');
const queueList = document.getElementById('queue-list');
const lyricsContent = document.getElementById('lyrics-content');
const clearQueueBtn = document.getElementById('clear-queue-btn');

const settingsModal = document.getElementById('settings-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const demoToggle = document.getElementById('demo-toggle');
const apiUrlInput = document.getElementById('api-url-input');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const toastContainer = document.getElementById('toast-container');
const visualizerCanvas = document.getElementById('visualizer-canvas');

// Feature Cards
const featuredCards = document.querySelectorAll('.featured-section .featured-card');

// --- HLS and Web Audio Context Global Handles ---
let hlsInstance = null;
let audioCtx = null;
let analyser = null;
let source = null;
let animationFrameId = null;
let isSeeking = false;

// --- Initialize App ---
function init() {
  loadSettings();
  setupEventHandlers();
  renderFavoritesState();
  initCanvasSize();
  
  // Load initial demo queue to populate visual state
  if (state.isDemoMode) {
    state.playlistQueue = [...demoTracks];
    state.currentQueueIndex = 0;
    loadTrack(state.playlistQueue[0], false);
    renderQueue();
  } else {
    // Populate UI with live Lofi tracks on startup
    performSearch("Lofi Hip Hop");
  }
}

// --- LocalStorage Settings ---
function loadSettings() {
  let storedUrl = localStorage.getItem('apiBaseUrl');
  const storedDemo = localStorage.getItem('isDemoMode');
  const storedFavs = localStorage.getItem('favorites');
  
  // Transition users from the old deprecated worker or custom endpoints to our new local server
  if (!storedUrl || storedUrl.includes('workers.dev') || storedUrl.includes('127.0.0.1:8787') || storedUrl === '/api') {
    storedUrl = window.location.origin + '/api';
    localStorage.setItem('apiBaseUrl', storedUrl);
  }
  
  if (storedUrl) {
    state.apiBaseUrl = storedUrl;
    apiUrlInput.value = storedUrl;
  }
  
  // Default to live mode (Sandbox off) on startup to ensure API queries run immediately
  state.isDemoMode = false;
  demoToggle.checked = false;
  localStorage.setItem('isDemoMode', 'false');
  
  if (storedFavs) {
    state.favorites = JSON.parse(storedFavs);
  }
  
  updateDemoBadge();
}

function saveSettings() {
  state.apiBaseUrl = apiUrlInput.value.trim() || (window.location.origin + '/api');
  state.isDemoMode = demoToggle.checked;
  
  localStorage.setItem('apiBaseUrl', state.apiBaseUrl);
  localStorage.setItem('isDemoMode', state.isDemoMode.toString());
  
  updateDemoBadge();
  showToast("Settings saved successfully!", "info");
  
  // If demo mode gets toggled, handle current playlist
  if (state.isDemoMode) {
    if (state.playlistQueue.length === 0) {
      state.playlistQueue = [...demoTracks];
      state.currentQueueIndex = 0;
      loadTrack(state.playlistQueue[0], false);
    }
  } else {
    showToast(`App set to stream from: ${state.apiBaseUrl}`, "info");
  }
  
  renderQueue();
  closeModal();
}

function updateDemoBadge() {
  if (state.isDemoMode) {
    demoBadge.classList.remove('hidden');
    document.querySelector('.engine-indicator').textContent = 'Sandbox Mode';
  } else {
    demoBadge.classList.add('hidden');
    document.querySelector('.engine-indicator').textContent = 'Live API Mode';
  }
}

// --- Toast System ---
function showToast(message, type = "info") {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px) scale(0.95)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- UI Navigation Event Handlers ---
function setupEventHandlers() {
  // Settings Modal
  settingsBtn.addEventListener('click', openModal);
  closeModalBtn.addEventListener('click', closeModal);
  saveSettingsBtn.addEventListener('click', saveSettings);
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeModal();
  });
  
  // Search Actions
  searchInput.addEventListener('input', handleSearchInput);
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      clearTimeout(searchDebounceTimeout);
      performSearch(searchInput.value.trim());
    }
  });
  engineSelect.addEventListener('change', () => {
    const query = searchInput.value.trim();
    if (query) performSearch(query);
  });
  searchClearBtn.addEventListener('click', () => {
    searchInput.value = '';
    searchClearBtn.style.display = 'none';
    clearSearchResults();
  });
  
  // Featured Discover cards
  featuredCards.forEach(card => {
    card.addEventListener('click', () => {
      const q = card.getAttribute('data-query');
      searchInput.value = q;
      searchClearBtn.style.display = 'block';
      performSearch(q);
    });
  });

  // Controls
  playPauseBtn.addEventListener('click', togglePlay);
  prevBtn.addEventListener('click', playPrevious);
  nextBtn.addEventListener('click', playNext);
  shuffleBtn.addEventListener('click', toggleShuffle);
  loopBtn.addEventListener('click', toggleLoop);
  favoriteBtn.addEventListener('click', toggleFavorite);
  
  // Time Seeks
  progressSlider.addEventListener('input', handleProgressInput);
  progressSlider.addEventListener('change', handleProgressChange);
  
  // Volume Controls
  volumeSlider.addEventListener('input', handleVolumeChange);
  volumeBtn.addEventListener('click', toggleMute);
  
  // Right Panel Tabs
  tabQueue.addEventListener('click', () => switchTab('queue'));
  tabLyrics.addEventListener('click', () => switchTab('lyrics'));
  clearQueueBtn.addEventListener('click', clearQueue);
  
  // Audio Player Listeners
  audio.addEventListener('timeupdate', updatePlaybackProgress);
  audio.addEventListener('loadedmetadata', onAudioMetadataLoaded);
  audio.addEventListener('ended', onTrackEnded);
  audio.addEventListener('error', handleAudioError);
}

// --- Tabs Management ---
function switchTab(tab) {
  if (tab === 'queue') {
    tabQueue.classList.add('active');
    tabLyrics.classList.remove('active');
    queueSection.classList.remove('hidden');
    lyricsSection.classList.add('hidden');
  } else {
    tabQueue.classList.remove('active');
    tabLyrics.classList.add('active');
    queueSection.classList.add('hidden');
    lyricsSection.classList.remove('hidden');
    
    // Refresh lyrics if currently playing
    if (state.currentTrack) {
      loadLyrics(state.currentTrack);
    }
  }
}

// --- Search Engine Client ---
let searchDebounceTimeout = null;
function handleSearchInput() {
  const query = searchInput.value.trim();
  if (query.length > 0) {
    searchClearBtn.style.display = 'block';
  } else {
    searchClearBtn.style.display = 'none';
  }
  
  clearTimeout(searchDebounceTimeout);
  searchDebounceTimeout = setTimeout(() => {
    performSearch(query);
  }, 400);
}

function clearSearchResults() {
  searchResultsList.innerHTML = `
    <div class="empty-state">
      <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 8v4M12 16h.01"></path>
      </svg>
      <p>Search for your favorite tracks to stream high quality audio.</p>
    </div>
  `;
  resultsCount.textContent = "0 found";
}

async function performSearch(query) {
  if (!query) {
    clearSearchResults();
    return;
  }
  
  searchResultsList.innerHTML = `
    <div class="empty-state">
      <div class="spinner"></div>
      <p>Searching engines...</p>
    </div>
  `;
  
  const engine = engineSelect.value;
  
  if (state.isDemoMode) {
    // Sandbox / Mock Search
    setTimeout(() => {
      const filtered = demoTracks.filter(t => 
        t.title.toLowerCase().includes(query.toLowerCase()) || 
        t.artist.toLowerCase().includes(query.toLowerCase())
      );
      
      // If nothing filtered, return random subselection to simulate engine search
      const results = filtered.length > 0 ? filtered : demoTracks.slice(0, 3);
      renderSearchResults(results);
    }, 450);
  } else {
    // Live Endpoint Call
    try {
      const url = `${state.apiBaseUrl}/search?q=${encodeURIComponent(query)}&filter=${engine}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error("Server responded with error status");
      
      const data = await response.json();
      
      if (data.status === 200 && Array.isArray(data.response)) {
        // Map API response to match our internal format
        const formattedResults = data.response.map(track => ({
          id: track.id,
          title: track.title,
          artist: track.artist || "Unknown Artist",
          img: track.img || "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=150&h=150&fit=crop",
          engine: engine, // track which category it came from
          url: null // url will be fetched dynamically via /fetch endpoint
        }));
        
        renderSearchResults(formattedResults);
      } else {
        renderSearchResults([]);
      }
    } catch (err) {
      console.error(err);
      showToast("API Offline. Reverting to Sandbox Mode.", "error");
      state.isDemoMode = true;
      demoToggle.checked = true;
      updateDemoBadge();
      // Re-trigger in Demo Mode
      performSearch(query);
    }
  }
}

function renderSearchResults(tracks) {
  searchResultsList.innerHTML = "";
  resultsCount.textContent = `${tracks.length} found`;
  
  if (tracks.length === 0) {
    searchResultsList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 8v4M12 16h.01"></path>
        </svg>
        <p>${state.isDemoMode ? 'Sandbox Mode is active. Turn it off in Settings (top-right cog) to search YouTube Music live!' : 'No results found. Try a different query.'}</p>
      </div>
    `;
    return;
  }
  
  tracks.forEach(track => {
    const card = document.createElement('div');
    const isCurrent = state.currentTrack && state.currentTrack.id === track.id;
    card.className = `song-card ${isCurrent ? 'active' : ''}`;
    
    card.innerHTML = `
      <img class="song-art" src="${track.img}" alt="Cover">
      <div class="song-info">
        <div class="song-title">${track.title}</div>
        <div class="song-artist">${track.artist}</div>
      </div>
      <div class="song-controls-right">
        <button class="list-play-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
        </button>
      </div>
    `;
    
    card.addEventListener('click', () => {
      if (track.type === 'albums') {
        playAlbumDirectly(track);
      } else {
        playTrackDirectly(track);
      }
    });
    
    searchResultsList.appendChild(card);
  });
}

// --- Now Playing & Loading Tracks ---
async function playTrackDirectly(track) {
  // Add to queue if not present, and play
  const existingIndex = state.playlistQueue.findIndex(t => t.id === track.id);
  
  if (existingIndex === -1) {
    // Insert after current index or push to queue
    if (state.currentQueueIndex === -1) {
      state.playlistQueue.push(track);
      state.currentQueueIndex = 0;
    } else {
      state.playlistQueue.splice(state.currentQueueIndex + 1, 0, track);
      state.currentQueueIndex += 1;
    }
  } else {
    state.currentQueueIndex = existingIndex;
  }
  
  renderQueue();
  await loadTrack(track, true);
  
  // Highlight active state in search results if visible
  const cards = searchResultsList.querySelectorAll('.song-card');
  cards.forEach(c => c.classList.remove('active'));
  const foundCard = Array.from(cards).find(c => c.querySelector('.song-title').textContent === track.title);
  if (foundCard) foundCard.classList.add('active');
}

async function playAlbumDirectly(track) {
  showToast("Loading album tracks...", "info");
  try {
    const response = await fetch(`${state.apiBaseUrl}/album?id=${encodeURIComponent(track.id)}`);
    if (!response.ok) throw new Error("Failed to load album tracks");
    const data = await response.json();
    
    if (data.status === 200 && Array.isArray(data.response) && data.response.length > 0) {
      // Set the play queue to the album tracks
      state.playlistQueue = data.response;
      state.currentQueueIndex = 0;
      renderQueue();
      await loadTrack(state.playlistQueue[0], true);
      showToast(`Loaded album: ${track.title}`, "info");
    } else {
      showToast("Album is empty or failed to load", "error");
    }
  } catch (err) {
    console.error(err);
    showToast("Error loading album", "error");
  }
}

async function loadTrack(track, shouldPlay = true) {
  state.currentTrack = track;
  
  // Update Track Info UI
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  albumArt.src = track.img;
  
  // Set Favorite icon state
  renderFavoritesState();
  
  // Fetch Stream URL if not present (only in live API mode)
  let streamUrl = track.url;
  
  if (!streamUrl && !state.isDemoMode) {
    // Use direct same-origin streaming proxy
    streamUrl = `${state.apiBaseUrl}/stream?id=${encodeURIComponent(track.id)}`;
    track.url = streamUrl;
  }
  
  if (!streamUrl && state.isDemoMode) {
    // Safeguard for demo mode
    streamUrl = demoTracks[0].url;
  }
  
  // Load stream based on HLS or regular MP3
  const isHls = streamUrl.includes('.m3u8') || track.engine === 'gaama';
  
  // Cleanup previous HLS instances
  if (hlsInstance) {
    hlsInstance.destroy();
    hlsInstance = null;
  }
  
  if (isHls) {
    if (Hls.isSupported()) {
      hlsInstance = new Hls();
      hlsInstance.loadSource(streamUrl);
      hlsInstance.attachMedia(audio);
      hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
        if (shouldPlay) startPlayback();
      });
      hlsInstance.on(Hls.Events.ERROR, (event, data) => {
        if (data.fatal) {
          console.error("HLS fatal error:", data.type);
          showToast("Streaming stream error", "error");
        }
      });
    } else if (audio.canPlayType('application/vnd.apple.mpegurl')) {
      // Native Apple device support
      audio.src = streamUrl;
      if (shouldPlay) startPlayback();
    } else {
      showToast("Your browser does not support HLS streaming", "error");
      stopPlayback();
      return;
    }
  } else {
    // Normal MP3 audio stream
    audio.src = streamUrl;
    audio.load();
    if (shouldPlay) startPlayback();
  }
  
  // Reset Progress Slider UI
  progressSlider.value = 0;
  progressFill.style.width = '0%';
  currentTimeEl.textContent = '0:00';
  
  // Update play state
  if (shouldPlay) {
    state.isPlaying = true;
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    playPauseBtn.classList.add('playing');
    albumArtWrapper.classList.add('playing');
    initVisualizer();
  } else {
    state.isPlaying = false;
    playIcon.classList.remove('hidden');
    pauseIcon.classList.add('hidden');
    playPauseBtn.classList.remove('playing');
    albumArtWrapper.classList.remove('playing');
  }
  
  // Load Lyrics if tab is active
  loadLyrics(track);
  
  // Scroll to active song in Queue list
  scrollToActiveQueueTrack();
}

function startPlayback() {
  audio.play()
    .then(() => {
      // Resume AudioContext if suspended (browser security)
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }
    })
    .catch(err => {
      console.warn("Playback error or autoplay blocked, attempting to reload and resume:", err);
      const currentPos = audio.currentTime;
      if (currentPos > 0) {
        audio.load();
        const onCanPlay = () => {
          audio.currentTime = currentPos;
          audio.play().catch(e => console.error("Resume playback failed:", e));
          audio.removeEventListener('canplay', onCanPlay);
        };
        audio.addEventListener('canplay', onCanPlay);
      } else {
        state.isPlaying = false;
        playIcon.classList.remove('hidden');
        pauseIcon.classList.add('hidden');
        playPauseBtn.classList.remove('playing');
        albumArtWrapper.classList.remove('playing');
      }
    });
}

function stopPlayback() {
  audio.pause();
  state.isPlaying = false;
  playIcon.classList.remove('hidden');
  pauseIcon.classList.add('hidden');
  playPauseBtn.classList.remove('playing');
  albumArtWrapper.classList.remove('playing');
}

function togglePlay() {
  if (!state.currentTrack) return;
  
  if (state.isPlaying) {
    stopPlayback();
  } else {
    state.isPlaying = true;
    playIcon.classList.add('hidden');
    pauseIcon.classList.remove('hidden');
    playPauseBtn.classList.add('playing');
    albumArtWrapper.classList.add('playing');
    
    // Check if we are resuming a track that was already in progress
    const currentPos = audio.currentTime;
    if (currentPos > 0 && !state.isDemoMode) {
      audio.load();
      const onCanPlay = () => {
        audio.currentTime = currentPos;
        audio.play().then(() => {
          if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
          }
        }).catch(e => console.error("Resume playback failed:", e));
        audio.removeEventListener('canplay', onCanPlay);
      };
      audio.addEventListener('canplay', onCanPlay);
    } else {
      startPlayback();
    }
    
    initVisualizer();
  }
}

// --- Play Queue Manager ---
function renderQueue() {
  queueList.innerHTML = "";
  
  if (state.playlistQueue.length === 0) {
    queueList.innerHTML = `
      <div class="empty-state">
        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
        </svg>
        <p>No tracks in queue.</p>
      </div>
    `;
    return;
  }
  
  state.playlistQueue.forEach((track, index) => {
    const isCurrent = state.currentQueueIndex === index;
    const card = document.createElement('div');
    card.className = `song-card ${isCurrent ? 'active' : ''}`;
    
    card.innerHTML = `
      <img class="song-art" src="${track.img}" alt="Cover">
      <div class="song-info">
        <div class="song-title">${track.title}</div>
        <div class="song-artist">${track.artist}</div>
      </div>
      <div class="song-controls-right">
        <button class="queue-remove-btn" title="Remove from queue">
          &times;
        </button>
      </div>
    `;
    
    // Play on click
    card.addEventListener('click', (e) => {
      // Don't trigger if clicked on the delete button
      if (e.target.classList.contains('queue-remove-btn')) return;
      state.currentQueueIndex = index;
      loadTrack(track, true);
      renderQueue();
    });
    
    // Delete track from queue
    const deleteBtn = card.querySelector('.queue-remove-btn');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeFromQueue(index);
    });
    
    queueList.appendChild(card);
  });
}

function removeFromQueue(index) {
  const isPlayingActive = state.currentQueueIndex === index;
  state.playlistQueue.splice(index, 1);
  
  if (state.playlistQueue.length === 0) {
    state.currentQueueIndex = -1;
    state.currentTrack = null;
    stopPlayback();
    // Reset track UI
    trackTitle.textContent = "Not Playing";
    trackArtist.textContent = "Select a song to start listening";
    albumArt.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&h=300&fit=crop";
  } else if (isPlayingActive) {
    // Current song was deleted, load next
    if (index >= state.playlistQueue.length) {
      state.currentQueueIndex = state.playlistQueue.length - 1;
    } else {
      state.currentQueueIndex = index;
    }
    loadTrack(state.playlistQueue[state.currentQueueIndex], state.isPlaying);
  } else if (index < state.currentQueueIndex) {
    // Keep index aligned
    state.currentQueueIndex -= 1;
  }
  
  renderQueue();
}

function clearQueue() {
  state.playlistQueue = [];
  state.currentQueueIndex = -1;
  state.currentTrack = null;
  stopPlayback();
  trackTitle.textContent = "Not Playing";
  trackArtist.textContent = "Select a song to start listening";
  albumArt.src = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=300&h=300&fit=crop";
  renderQueue();
  showToast("Queue cleared", "info");
}

function playNext() {
  if (state.playlistQueue.length === 0) return;
  
  if (state.isShuffle) {
    state.currentQueueIndex = Math.floor(Math.random() * state.playlistQueue.length);
  } else {
    state.currentQueueIndex = (state.currentQueueIndex + 1) % state.playlistQueue.length;
  }
  
  loadTrack(state.playlistQueue[state.currentQueueIndex], true);
  renderQueue();
}

function playPrevious() {
  if (state.playlistQueue.length === 0) return;
  
  state.currentQueueIndex = state.currentQueueIndex - 1;
  if (state.currentQueueIndex < 0) {
    state.currentQueueIndex = state.playlistQueue.length - 1;
  }
  
  loadTrack(state.playlistQueue[state.currentQueueIndex], true);
  renderQueue();
}

function scrollToActiveQueueTrack() {
  const activeEl = queueList.querySelector('.song-card.active');
  if (activeEl) {
    activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// --- Player Settings (Shuffle/Loop/Favorite) ---
function toggleShuffle() {
  state.isShuffle = !state.isShuffle;
  shuffleBtn.classList.toggle('active', state.isShuffle);
  showToast(state.isShuffle ? "Shuffle On" : "Shuffle Off", "info");
}

function toggleLoop() {
  state.isLoop = !state.isLoop;
  loopBtn.classList.toggle('active', state.isLoop);
  showToast(state.isLoop ? "Loop On" : "Loop Off", "info");
}

function toggleFavorite() {
  if (!state.currentTrack) return;
  
  const favIndex = state.favorites.findIndex(id => id === state.currentTrack.id);
  
  if (favIndex === -1) {
    state.favorites.push(state.currentTrack.id);
    showToast("Added to Favorites", "info");
  } else {
    state.favorites.splice(favIndex, 1);
    showToast("Removed from Favorites", "info");
  }
  
  localStorage.setItem('favorites', JSON.stringify(state.favorites));
  renderFavoritesState();
}

function renderFavoritesState() {
  if (state.currentTrack && state.favorites.includes(state.currentTrack.id)) {
    favoriteBtn.classList.add('active');
    favoriteBtn.querySelector('svg').setAttribute('fill', 'currentColor');
  } else {
    favoriteBtn.classList.remove('active');
    favoriteBtn.querySelector('svg').setAttribute('fill', 'none');
  }
}

// --- Volume Controls ---
function handleVolumeChange() {
  const vol = volumeSlider.value;
  audio.volume = vol / 100;
  audio.muted = false; // automatically unmute when sliding
  volumeFill.style.width = `${vol}%`;
  
  if (vol == 0) {
    volumeIconHigh.classList.add('hidden');
    volumeIconMute.classList.remove('hidden');
  } else {
    volumeIconHigh.classList.remove('hidden');
    volumeIconMute.classList.add('hidden');
  }
}

function toggleMute() {
  if (audio.muted) {
    audio.muted = false;
    volumeIconHigh.classList.remove('hidden');
    volumeIconMute.classList.add('hidden');
    volumeSlider.value = audio.volume * 100;
    volumeFill.style.width = `${audio.volume * 100}%`;
  } else {
    audio.muted = true;
    volumeIconHigh.classList.add('hidden');
    volumeIconMute.classList.remove('hidden');
    volumeFill.style.width = '0%';
  }
}

// --- Player Time Progress & Seek ---
function onAudioMetadataLoaded() {
  durationTimeEl.textContent = formatTime(audio.duration);
}

function updatePlaybackProgress() {
  if (isSeeking) return; // skip updating slider visual state during user drag
  if (audio.duration) {
    const percent = (audio.currentTime / audio.duration) * 100;
    progressSlider.value = percent;
    progressFill.style.width = `${percent}%`;
    currentTimeEl.textContent = formatTime(audio.currentTime);
  }
}

function handleProgressInput() {
  isSeeking = true;
  if (audio.duration) {
    const percent = progressSlider.value;
    progressFill.style.width = `${percent}%`;
    const seekTime = (percent / 100) * audio.duration;
    currentTimeEl.textContent = formatTime(seekTime);
  }
}

function handleProgressChange() {
  if (audio.duration) {
    const seekTime = (progressSlider.value / 100) * audio.duration;
    audio.currentTime = seekTime;
  }
  isSeeking = false;
}

function onTrackEnded() {
  if (state.isLoop) {
    audio.currentTime = 0;
    startPlayback();
  } else {
    playNext();
  }
}

function handleAudioError(e) {
  console.error("Audio playback error:", e);
  showToast("Playback encountered an error. Skipping track.", "error");
  setTimeout(playNext, 1000);
}

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// --- Lyrics Client Integrator ---
async function loadLyrics(track) {
  // Clear layout
  lyricsContent.innerHTML = `
    <div class="empty-state">
      <div class="spinner"></div>
      <p>Fetching lyrics...</p>
    </div>
  `;
  
  if (state.isDemoMode) {
    // Load from local demo data if present
    setTimeout(() => {
      const demo = demoTracks.find(t => t.id === track.id);
      if (demo && demo.lyrics) {
        lyricsContent.innerHTML = demo.lyrics;
      } else {
        lyricsContent.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
            </svg>
            <p>No lyrics found for this sandbox track.</p>
          </div>
        `;
      }
    }, 300);
  } else {
    // Call live lyrics endpoint (Gaama engine offers /lyrics)
    try {
      const url = `${state.apiBaseUrl}/lyrics?id=${encodeURIComponent(track.id)}`;
      const response = await fetch(url);
      
      if (!response.ok) throw new Error("Lyrics fetch failed");
      
      const data = await response.json();
      
      if (data.status === 200 && data.response) {
        // Strip nested HTML templates if needed, or render as-is since gaama sends paragraph wrappers
        lyricsContent.innerHTML = data.response;
      } else {
        lyricsContent.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="8" y1="12" x2="16" y2="12"></line>
            </svg>
            <p>Lyrics unavailable for this song.</p>
          </div>
        `;
      }
    } catch (err) {
      console.warn("Could not load lyrics from endpoint", err);
      lyricsContent.innerHTML = `
        <div class="empty-state">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="8" y1="12" x2="16" y2="12"></line>
          </svg>
          <p>Lyrics API offline.</p>
        </div>
      `;
    }
  }
}

// --- Equalizer Canvas Visualizer using Web Audio API ---
function initCanvasSize() {
  const dpr = window.devicePixelRatio || 1;
  const rect = visualizerCanvas.getBoundingClientRect();
  visualizerCanvas.width = rect.width * dpr;
  visualizerCanvas.height = rect.height * dpr;
  
  const ctx = visualizerCanvas.getContext('2d');
  ctx.scale(dpr, dpr);
}

function initVisualizer() {
  if (audioCtx) return;
  
  try {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    
    // Connect audio node to analyser
    source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);
    
    drawVisualizer();
  } catch (err) {
    console.warn("Web Audio API not supported or blocked by security settings", err);
  }
}

function drawVisualizer() {
  if (!analyser) return;
  
  animationFrameId = requestAnimationFrame(drawVisualizer);
  
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);
  analyser.getByteFrequencyData(dataArray);
  
  const ctx = visualizerCanvas.getContext('2d');
  const width = visualizerCanvas.width / (window.devicePixelRatio || 1);
  const height = visualizerCanvas.height / (window.devicePixelRatio || 1);
  
  ctx.clearRect(0, 0, width, height);
  
  // Center coordinates
  const cx = width / 2;
  const cy = height / 2;
  
  // Draw glowing visualizer bars in an outer circle around the album cover
  const radius = 95; // Just outside the 180px album cover (radius 90)
  const barCount = 60;
  
  for (let i = 0; i < barCount; i++) {
    const angle = (i / barCount) * Math.PI * 2;
    
    // Get frequency index
    const dataIndex = Math.floor((i / barCount) * bufferLength * 0.7); // scale to focus on mid/lows
    const frequencyVal = dataArray[dataIndex];
    
    // Bar height proportional to frequency value
    const barHeight = (frequencyVal / 255) * 28;
    
    // Calculate start/end of the visualizer line
    const xStart = cx + Math.cos(angle) * radius;
    const yStart = cy + Math.sin(angle) * radius;
    const xEnd = cx + Math.cos(angle) * (radius + barHeight);
    const yEnd = cy + Math.sin(angle) * (radius + barHeight);
    
    // Color styling (gradient pink to neon violet glow)
    ctx.strokeStyle = `rgba(255, 78, 126, ${0.4 + (frequencyVal / 255) * 0.6})`;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    
    ctx.beginPath();
    ctx.moveTo(xStart, yStart);
    ctx.lineTo(xEnd, yEnd);
    ctx.stroke();
    
    // Subtle outer node highlights
    if (frequencyVal > 150) {
      ctx.fillStyle = '#ff758c';
      ctx.beginPath();
      ctx.arc(xEnd, yEnd, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

// Window resizing adjustments for canvas resolution
window.addEventListener('resize', () => {
  if (visualizerCanvas) {
    initCanvasSize();
  }
});

// --- Modal Display Operations ---
function openModal() {
  settingsModal.classList.remove('hidden');
}

function closeModal() {
  settingsModal.classList.add('hidden');
}

// Load trigger
window.addEventListener('DOMContentLoaded', init);
