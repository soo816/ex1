// Main Application Logic for Discover Jeju

// Current App State
let currentLang = 'en';
let activeCategory = 'all';
let searchQuery = '';
let savedSpotIds = JSON.parse(localStorage.getItem('jeju_saved_spots')) || [];

// Currency Rates (1 KRW equivalent)
const exchangeRates = {
  USD: 0.00075,
  EUR: 0.00069,
  CNY: 0.0054,
  JPY: 0.11
};

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  renderPhrases();
  renderAttractions();
  updateItineraryBadge();
  setupEventListeners();
  initCurrencyConverter();
});

// Setup Language & Translation
function initLanguage() {
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', (e) => {
      currentLang = e.target.value;
      onLanguageChange();
    });
  }
  updateDOMTranslations();
  updateLanguageToggleUI();
}

function toggleLanguage() {
  // Toggle between English ('en') and Korean ('ko')
  if (currentLang === 'en') {
    currentLang = 'ko';
  } else {
    currentLang = 'en';
  }
  
  const langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.value = currentLang;
  }
  
  onLanguageChange();
}

function onLanguageChange() {
  updateDOMTranslations();
  updateLanguageToggleUI();
  renderAttractions();
  renderPhrases();
  renderItineraryList();
}

function updateLanguageToggleUI() {
  const label = document.getElementById('langToggleLabel');
  if (label) {
    if (currentLang === 'en') {
      label.textContent = "Switch to 한국어 (Korean)";
    } else if (currentLang === 'ko') {
      label.textContent = "Switch to English (영어)";
    } else {
      label.textContent = "English ↔ 한국어";
    }
  }
}

function updateDOMTranslations() {
  const dict = i18n[currentLang] || i18n.en;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (dict[key]) {
      el.placeholder = dict[key];
    }
  });
}

// Render Attraction Cards
function renderAttractions() {
  const grid = document.getElementById('attractionGrid');
  if (!grid) return;

  const dict = i18n[currentLang] || i18n.en;
  
  const filtered = attractionsData.filter(item => {
    const matchesCategory = (activeCategory === 'all') || (item.category === activeCategory);
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      item.nameEn.toLowerCase().includes(query) || 
      item.nameKo.toLowerCase().includes(query) ||
      item.descEn.toLowerCase().includes(query);
    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted);">
      No matching attractions found. Try another search keyword!
    </div>`;
    return;
  }

  grid.innerHTML = filtered.map(spot => {
    const isSaved = savedSpotIds.includes(spot.id);
    const desc = currentLang === 'ko' ? spot.descKo : spot.descEn;

    return `
      <div class="card glass-panel">
        <div class="card-img-wrapper">
          <img src="${spot.image}" alt="${spot.nameEn}" class="card-img" />
          <span class="card-tag">${spot.tags[0]}</span>
        </div>
        <div class="card-content">
          <h3 class="card-title-en">${spot.nameEn}</h3>
          <div class="card-title-ko">${spot.nameKo}</div>
          <p class="card-desc">${desc}</p>
          <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:12px;">
            📍 ${spot.addressEn}
          </div>
          <div class="card-actions">
            <button class="btn-card btn-taxi" onclick="openTaxiModal(${spot.id})">
              ${dict.taxiCardBtn}
            </button>
            <button class="btn-card btn-bookmark ${isSaved ? 'saved' : ''}" onclick="toggleSaveSpot(${spot.id})">
              ${isSaved ? '✓ ' + dict.savedLabel : dict.bookmarkBtn}
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Render Tourist Korean Phrase Cards
function renderPhrases() {
  const container = document.getElementById('phrasesGrid');
  if (!container) return;

  const dict = i18n[currentLang] || i18n.en;

  container.innerHTML = koreanPhrases.map(phrase => {
    return `
      <div class="phrase-card glass-panel" onclick="playKoreanSpeech('${phrase.ttsText}')">
        <div class="phrase-cat">${phrase.category}</div>
        <div class="phrase-ko">${phrase.ko}</div>
        <div class="phrase-phonetic">${phrase.phonetic}</div>
        <div class="phrase-en">${phrase.en}</div>
        <div class="phrase-audio-btn">
          ${dict.listenAudio}
        </div>
      </div>
    `;
  }).join('');
}

// Web Speech API - Text to Speech for Korean
function playKoreanSpeech(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop current playing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ko-KR';
    utterance.rate = 0.9; // slightly slower for clarity
    window.speechSynthesis.speak(utterance);
  } else {
    alert('Speech Synthesis is not supported in this browser.');
  }
}

// Event Listeners Initialization
function setupEventListeners() {
  // Category Filtering
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      activeCategory = e.target.getAttribute('data-category');
      renderAttractions();
    });
  });

  // Search Bar
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      renderAttractions();
    });
  }

  // Modals Overlay Close logic
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeAllModals();
      }
    });
  });
}

// Taxi Driver Flashcard Modal
function openTaxiModal(spotId) {
  const spot = attractionsData.find(s => s.id === spotId);
  if (!spot) return;

  document.getElementById('taxiModalDestKo').textContent = spot.nameKo;
  document.getElementById('taxiModalAddrKo').textContent = spot.addressKo;
  document.getElementById('taxiModalDestEn').textContent = spot.nameEn;
  
  const modal = document.getElementById('taxiModal');
  if (modal) {
    modal.classList.add('active');
  }
}

function closeAllModals() {
  document.querySelectorAll('.modal-overlay').forEach(m => m.classList.remove('active'));
}

// Save / Bookmark Logic
function toggleSaveSpot(spotId) {
  const index = savedSpotIds.indexOf(spotId);
  if (index > -1) {
    savedSpotIds.splice(index, 1);
  } else {
    savedSpotIds.push(spotId);
  }
  localStorage.setItem('jeju_saved_spots', JSON.stringify(savedSpotIds));
  updateItineraryBadge();
  renderAttractions();
  renderItineraryList();
}

function updateItineraryBadge() {
  const countEl = document.getElementById('itineraryCount');
  if (countEl) {
    countEl.textContent = savedSpotIds.length;
  }
}

// Itinerary Modal Display & Management
function openItineraryModal() {
  renderItineraryList();
  const modal = document.getElementById('itineraryModal');
  if (modal) modal.classList.add('active');
}

function renderItineraryList() {
  const container = document.getElementById('itineraryList');
  if (!container) return;

  const dict = i18n[currentLang] || i18n.en;

  if (savedSpotIds.length === 0) {
    container.innerHTML = `<div style="text-align:center; padding:30px; color:var(--text-muted);">
      ${dict.noSavedItems}
    </div>`;
    return;
  }

  const savedObjects = attractionsData.filter(s => savedSpotIds.includes(s.id));

  container.innerHTML = savedObjects.map(spot => {
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.06); padding:12px 16px; border-radius:12px; margin-bottom:10px;">
        <div>
          <div style="font-weight:700; color:#fff;">${spot.nameEn} (${spot.nameKo})</div>
          <div style="font-size:0.8rem; color:var(--accent-amber);">${spot.addressKo}</div>
        </div>
        <button onclick="toggleSaveSpot(${spot.id})" style="background:rgba(239, 68, 68, 0.2); border:1px solid #ef4444; color:#ef4444; padding:6px 12px; border-radius:8px; cursor:pointer; font-weight:700;">
          ✕
        </button>
      </div>
    `;
  }).join('');
}

function clearAllItinerary() {
  savedSpotIds = [];
  localStorage.removeItem('jeju_saved_spots');
  updateItineraryBadge();
  renderAttractions();
  renderItineraryList();
}

function printItinerary() {
  window.print();
}

// Currency Converter Logic
function initCurrencyConverter() {
  const krwInput = document.getElementById('krwAmount');
  if (!krwInput) return;

  krwInput.addEventListener('input', (e) => {
    const val = parseFloat(e.target.value) || 0;
    document.getElementById('valUSD').textContent = (val * exchangeRates.USD).toFixed(2);
    document.getElementById('valEUR').textContent = (val * exchangeRates.EUR).toFixed(2);
    document.getElementById('valCNY').textContent = (val * exchangeRates.CNY).toFixed(2);
    document.getElementById('valJPY').textContent = (val * exchangeRates.JPY).toFixed(0);
  });
}
