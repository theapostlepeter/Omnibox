import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  deleteDoc, 
  collection, 
  query, 
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  addDoc,
  onSnapshot,
  orderBy
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ==========================================
// CONFIGURATION FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyCrZSA5JpCsZtQ4-Wq2NcOjQdV-qf7RxmI",
  authDomain: "omnibox-1efe1.firebaseapp.com",
  projectId: "omnibox-1efe1",
  storageBucket: "omnibox-1efe1.firebasestorage.app",
  messagingSenderId: "877728553873",
  appId: "1:877728553873:web:255947a26598e37b581830"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ==========================================
// CONFIGURATION API TMDB
// ==========================================
const TMDB_API_KEY = "a7751486036c522a434f3984aae93ed2";
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_URL = "https://image.tmdb.org/t/p/w500";
const DISCORD_CLIENT_ID = '1547674867296501872';

// ==========================================
// ÉTAT DE L'APPLICATION
// ==========================================
let currentUser = null;
let userProfileData = null;
let viewedProfileUid = null;
let currentMedia = null;
let currentUserRating = null;
let userWatchlist = [];
let commentsUnsubscribe = null;
let directDiscordUser = null;

// ==========================================
// ÉLÉMENTS DU DOM
// ==========================================
const loginBtn = document.getElementById("login-btn");
const authModal = document.getElementById("auth-modal");
const closeAuthModal = document.getElementById("close-auth-modal");
const googleLoginBtn = document.getElementById("google-login-btn");
const discordLoginBtn = document.getElementById("discord-login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");
const userName = document.getElementById("user-name");
const headerAvatar = document.getElementById("header-avatar");

const navHome = document.getElementById("nav-home");
const navWatchlist = document.getElementById("nav-watchlist");
const navProfile = document.getElementById("nav-profile");

const mainContentView = document.getElementById("main-content-view");
const profileView = document.getElementById("profile-view");
const searchFilterSection = document.getElementById("search-filter-section");

const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const categorySelect = document.getElementById("category-select");
const genreSelect = document.getElementById("genre-select");
const resetFiltersBtn = document.getElementById("reset-filters-btn");

const mediaGrid = document.getElementById("media-grid");
const trendingSection = document.getElementById("trending-section");
const trendingCarousel = document.getElementById("trending-carousel");
const sectionTitle = document.getElementById("section-title");

// Profil Elements
const profileAvatar = document.getElementById("profile-avatar");
const profileDisplayName = document.getElementById("profile-display-name");
const profileBio = document.getElementById("profile-bio");
const profileXBtn = document.getElementById("profile-x-btn");
const profileDiscordBtn = document.getElementById("profile-discord-btn");
const addFriendBtn = document.getElementById("add-friend-btn");

const editProfileBtn = document.getElementById("edit-profile-btn");
const editProfileForm = document.getElementById("edit-profile-form");
const editUsername = document.getElementById("edit-username");
const editPhotoFile = document.getElementById("edit-photo-file");
const editPhotoUrl = document.getElementById("edit-photo-url");
const editBio = document.getElementById("edit-bio");
const editX = document.getElementById("edit-x");
const editDiscord = document.getElementById("edit-discord");
const saveProfileBtn = document.getElementById("save-profile-btn");
const cancelProfileBtn = document.getElementById("cancel-profile-btn");
const photoSourceTabs = Array.from(document.querySelectorAll(".photo-source-tab"));
const photoFilePanel = document.getElementById("photo-file-panel");
const photoUrlPanel = document.getElementById("photo-url-panel");

// Notifications / Amis
const notifBtn = document.getElementById("notif-btn");
const notifBadge = document.getElementById("notif-badge");
const notifDropdown = document.getElementById("notif-dropdown");
const friendRequestsList = document.getElementById("friend-requests-list");

// Modale
const modal = document.getElementById("detail-modal");
const closeModal = document.getElementById("close-modal");
const modalImg = document.getElementById("modal-img");
const modalTitle = document.getElementById("modal-title");
const modalRating = document.getElementById("modal-rating");
const modalDescription = document.getElementById("modal-description");
const modalAddBtn = document.getElementById("modal-add-btn");
const modalFavBtn = document.getElementById("modal-favorite-btn");
const providerList = document.getElementById("provider-list");
const userTrackingSection = document.getElementById("user-tracking-section");
const mediaStatusSelect = document.getElementById("media-status-select");
const mediaProgressSection = document.getElementById("media-progress-section");
const currentSeasonInput = document.getElementById("current-season");
const currentEpisodeInput = document.getElementById("current-episode");
const episodeProgressDisplay = document.getElementById("episode-progress-display");
const saveProgressBtn = document.getElementById("save-progress-btn");
const watchlistView = document.getElementById("watchlist");
const watchlistContainers = {
  watching: document.getElementById("watchlist-watching"),
  plan_to_watch: document.getElementById("watchlist-plan-to-watch"),
  completed: document.getElementById("watchlist-completed"),
  dropped: document.getElementById("watchlist-dropped")
};
const userStarRating = document.getElementById("user-star-rating");
const ratingValueDisplay = document.getElementById("rating-value-display");

// Commentaires
const commentInput = document.getElementById("comment-input");
const submitCommentBtn = document.getElementById("submit-comment-btn");
const commentsList = document.getElementById("comments-list");

// ==========================================
// AUTHENTIFICATION
// ==========================================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    viewedProfileUid = user.uid;
    navProfile.style.display = "block";
    loginBtn.style.display = "none";
    userInfo.style.display = "flex";

    await loadUserProfile(currentUser.uid);
    await loadUserWatchlist();
    await checkFriendRequests();
  } else {
    if (!directDiscordUser) {
      currentUser = null;
      userProfileData = null;
      userWatchlist = [];
      navProfile.style.display = "none";
      loginBtn.style.display = "block";
      userInfo.style.display = "none";
    }
  }
  loadTrending();
  applyFiltersAndFetch();
});

loginBtn.addEventListener("click", () => {
  authModal.style.display = "flex";
});

async function signInWithProvider(provider) {
  try {
    await signInWithPopup(auth, provider);
    authModal.style.display = "none";
  } catch (err) {
    console.error("Erreur de connexion :", err);
  }
}

function buildDiscordAuthorizeUrl() {
  const redirectUri = window.location.origin;
  return `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=identify%20email`;
}

function openDiscordAuthorization() {
  const popup = window.open(buildDiscordAuthorizeUrl(), "discord-oauth", "popup,width=520,height=720");
  if (!popup) window.location.assign(buildDiscordAuthorizeUrl());
}

async function handleDiscordRedirect() {
  const hashParams = new URLSearchParams(window.location.hash.slice(1));
  const accessToken = hashParams.get("access_token");
  if (!accessToken) return;

  try {
    const response = await fetch("https://discord.com/api/v10/users/@me", {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (!response.ok) throw new Error(`Discord API: ${response.status}`);

    const userData = await response.json();
    const photoURL = userData.avatar
      ? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png`
      : `https://cdn.discordapp.com/embed/avatars/${Number(userData.discriminator || 0) % 5}.png`;
    const discordSession = {
      uid: `discord_${userData.id}`,
      discordId: userData.id,
      displayName: userData.global_name || userData.username || "Utilisateur Discord",
      photoURL,
      email: userData.email || "",
      provider: "discord"
    };

    localStorage.setItem("discordSession", JSON.stringify(discordSession));
    window.history.replaceState({}, document.title, window.location.pathname);
    if (window.opener) {
      window.close();
      return;
    }
    await activateDiscordSession(discordSession);
  } catch (error) {
    console.error("Erreur de connexion Discord :", error);
    window.history.replaceState({}, document.title, window.location.pathname);
  }
}

async function activateDiscordSession(discordSession) {
  directDiscordUser = discordSession;
  currentUser = discordSession;
  viewedProfileUid = discordSession.uid;
  navProfile.style.display = "block";
  loginBtn.style.display = "none";
  userInfo.style.display = "flex";
  userName.textContent = discordSession.displayName;
  headerAvatar.src = discordSession.photoURL;

  const profileData = {
    displayName: discordSession.displayName,
    photoURL: discordSession.photoURL,
    bio: "Passionné de cinéma, séries et animes.",
    xLink: "",
    discord: discordSession.displayName,
    email: discordSession.email,
    provider: "discord",
    friends: [],
    friendRequests: []
  };
  userProfileData = profileData;

  try {
    await setDoc(doc(db, "users", discordSession.uid), profileData, { merge: true });
  } catch (error) {
    console.warn("Synchronisation Firestore Discord indisponible :", error);
  }

  renderUserProfile(profileData, discordSession.uid);
  await loadUserWatchlist();
  loadTrending();
  applyFiltersAndFetch();
}

window.addEventListener("storage", (event) => {
  if (event.key === "discordSession" && event.newValue) {
    activateDiscordSession(JSON.parse(event.newValue));
  }
});

googleLoginBtn.addEventListener("click", () => {
  const provider = new GoogleAuthProvider();
  signInWithProvider(provider);
});

discordLoginBtn.addEventListener("click", () => {
  openDiscordAuthorization();
});

closeAuthModal.addEventListener("click", () => {
  authModal.style.display = "none";
});

authModal.addEventListener("click", (event) => {
  if (event.target === authModal) {
    authModal.style.display = "none";
  }
});

logoutBtn.addEventListener("click", () => {
  if (directDiscordUser) {
    directDiscordUser = null;
    localStorage.removeItem("discordSession");
    currentUser = null;
    userProfileData = null;
    userWatchlist = [];
    navProfile.style.display = "none";
    loginBtn.style.display = "block";
    userInfo.style.display = "none";
    switchTab("home");
    return;
  }
  signOut(auth).then(() => switchTab("home"));
});

const storedDiscordSession = localStorage.getItem("discordSession");
if (storedDiscordSession) {
  try {
    directDiscordUser = JSON.parse(storedDiscordSession);
  } catch {
    localStorage.removeItem("discordSession");
  }
}

if (directDiscordUser) activateDiscordSession(directDiscordUser);
handleDiscordRedirect();

// ==========================================
// REQUÊTES TMDB ET DÉTECTION AUTOMATIQUE KDRAMA
// ==========================================
searchBtn.addEventListener("click", applyFiltersAndFetch);
searchInput.addEventListener("keypress", (e) => { if (e.key === "Enter") applyFiltersAndFetch(); });
categorySelect.addEventListener("change", applyFiltersAndFetch);
genreSelect.addEventListener("change", applyFiltersAndFetch);

resetFiltersBtn.addEventListener("click", () => {
  searchInput.value = "";
  categorySelect.value = "all";
  genreSelect.value = "all";
  applyFiltersAndFetch();
});

async function applyFiltersAndFetch() {
  const queryText = searchInput.value.trim();
  const cat = categorySelect.value;
  const genre = genreSelect.value;

  sectionTitle.textContent = "Chargement des contenus...";
  mediaGrid.innerHTML = "<p>Recherche en cours...</p>";

  if (queryText) {
    fetchSearchResults(queryText, cat);
    return;
  }

  try {
    let items = [];

    if (cat === "movie") {
      items = await fetchTMDBDiscover("movie", genre);
      sectionTitle.textContent = "Films" + (genre !== "all" ? " (par genre)" : "");
    } else if (cat === "tv") {
      items = await fetchTMDBDiscover("tv", genre);
      sectionTitle.textContent = "Séries" + (genre !== "all" ? " (par genre)" : "");
    } else if (cat === "anime") {
      items = await fetchTMDBDiscover("tv", genre, "16", "KR|JP");
      sectionTitle.textContent = "Animes" + (genre !== "all" ? " (par genre)" : "");
    } else if (cat === "kdrama") {
      items = await fetchTMDBDiscover("tv", genre, "", "KR");
      sectionTitle.textContent = "K-Dramas" + (genre !== "all" ? " (par genre)" : "");
    } else if (cat === "documentary") {
      items = await fetchTMDBDiscover("movie", "99");
      sectionTitle.textContent = "Documentaires";
    } else {
      const movies = await fetchTMDBDiscover("movie", genre);
      const tvs = await fetchTMDBDiscover("tv", genre);
      items = [...movies, ...tvs].sort(() => 0.5 - Math.random());
      sectionTitle.textContent = "Populaires du moment";
    }

    renderGrid(items);
  } catch (e) {
    console.error(e);
    mediaGrid.innerHTML = "<p>Erreur lors du chargement des données.</p>";
  }
}

async function fetchTMDBDiscover(type, genreId = "all", withGenresExtra = "", originCountry = "") {
  let url = `${TMDB_BASE_URL}/discover/${type}?api_key=${TMDB_API_KEY}&language=fr-FR&sort_by=popularity.desc`;
  
  let genreParam = [];
  if (genreId !== "all") genreParam.push(genreId);
  if (withGenresExtra) genreParam.push(withGenresExtra);
  if (genreParam.length > 0) url += `&with_genres=${genreParam.join(",")}`;

  if (originCountry) url += `&with_origin_country=${originCountry}`;

  const res = await fetch(url);
  const data = await res.json();

  return data.results.map(item => {
    // DÉTECTION TYPE : K-DRAMA OU ANIME OU SÉRIE/FILM
    let mediaType = type === "movie" ? "movie" : "tv";
    if (originCountry === "KR" || (item.origin_country && item.origin_country.includes("KR"))) {
      mediaType = "kdrama";
    } else if (type === "tv" && item.genre_ids?.includes(16)) {
      mediaType = "anime";
    }

    return {
      id: item.id.toString(),
      title: item.title || item.name,
      poster: item.poster_path ? `${TMDB_IMAGE_URL}${item.poster_path}` : "https://via.placeholder.com/500x750",
      type: mediaType,
      rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : "0.0",
      overview: item.overview || "Pas de description."
    };
  });
}

async function enrichMediaDetails(item) {
  if (!item || !["tv", "anime", "kdrama"].includes(item.type)) return item;

  try {
    const res = await fetch(`${TMDB_BASE_URL}/tv/${item.id}?api_key=${TMDB_API_KEY}&language=fr-FR`);
    if (!res.ok) return item;
    const details = await res.json();
    return {
      ...item,
      totalEpisodes: details.number_of_episodes || 0,
      totalSeasons: details.number_of_seasons || 0,
      seasonEpisodeCounts: (details.seasons || [])
        .filter(season => season.season_number > 0)
        .map(season => ({ season: season.season_number, episodes: season.episode_count || 0 }))
    };
  } catch (err) {
    console.error("Erreur détails TMDB :", err);
    return item;
  }
}

async function fetchSearchResults(queryText, cat) {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&language=fr-FR&query=${encodeURIComponent(queryText)}`);
    const data = await res.json();

    let results = data.results.map(item => {
      let mediaType = item.media_type;
      if (item.origin_country && item.origin_country.includes("KR")) {
        mediaType = "kdrama";
      } else if (mediaType === "tv" && item.genre_ids?.includes(16)) {
        mediaType = "anime";
      }

      return {
        id: item.id.toString(),
        title: item.title || item.name,
        poster: item.poster_path ? `${TMDB_IMAGE_URL}${item.poster_path}` : "https://via.placeholder.com/500x750",
        type: mediaType,
        rating: item.vote_average ? (item.vote_average / 2).toFixed(1) : "0.0",
        overview: item.overview || "Pas de description."
      };
    }).filter(i => i.type === "movie" || i.type === "tv" || i.type === "anime" || i.type === "kdrama");

    if (cat === "movie") results = results.filter(i => i.type === "movie");
    if (cat === "tv") results = results.filter(i => i.type === "tv");
    if (cat === "anime") results = results.filter(i => i.type === "anime");
    if (cat === "kdrama") results = results.filter(i => i.type === "kdrama");

    sectionTitle.textContent = `Résultats pour "${queryText}"`;
    renderGrid(results);
  } catch (err) {
    mediaGrid.innerHTML = "<p>Erreur lors de la recherche.</p>";
  }
}

// ==========================================
// TENDANCES
// ==========================================
async function loadTrending() {
  try {
    const res = await fetch(`${TMDB_BASE_URL}/trending/all/day?api_key=${TMDB_API_KEY}&language=fr-FR`);
    const data = await res.json();
    trendingCarousel.innerHTML = "";

    data.results.slice(0, 10).forEach(item => {
      let mediaType = item.media_type || 'movie';
      if (item.origin_country && item.origin_country.includes("KR")) mediaType = "kdrama";

      const card = document.createElement("div");
      card.className = "trending-card";
      card.innerHTML = `
        <img src="${item.poster_path ? TMDB_IMAGE_URL + item.poster_path : 'https://via.placeholder.com/150x225'}" alt="${item.title || item.name}">
        <div class="trending-info">
          <h4>${item.title || item.name}</h4>
        </div>
      `;
      card.addEventListener("click", () => openModal({
        id: item.id.toString(),
        title: item.title || item.name,
        poster: item.poster_path ? TMDB_IMAGE_URL + item.poster_path : '',
        type: mediaType,
        rating: (item.vote_average / 2).toFixed(1),
        overview: item.overview
      }));
      trendingCarousel.appendChild(card);
    });
  } catch (e) {
    console.error("Erreur tendances :", e);
  }
}

// ==========================================
// AFFICHAGE GRILLE MEDIA
// ==========================================
function renderGrid(items) {
  mediaGrid.innerHTML = "";
  if (!items || items.length === 0) {
    mediaGrid.innerHTML = "<p>Aucun élément trouvé.</p>";
    return;
  }

  items.forEach(item => {
    const userMedia = userWatchlist.find(w => w.id === item.id);
    const card = document.createElement("div");
    card.className = "media-card";

    let badgeHTML = userMedia ? `<span class="card-status-badge">${userMedia.status}</span>` : "";

    card.innerHTML = `
      <img src="${item.poster}" alt="${item.title}">
      <div class="media-info">
        <h3>${item.title}</h3>
        <span class="rating">★ ${item.rating} / 5</span>
        ${badgeHTML}
      </div>
    `;

    card.addEventListener("click", () => openModal(item));
    mediaGrid.appendChild(card);
  });
}

const watchlistStatusLabels = {
  watching: "En cours",
  plan_to_watch: "À voir",
  completed: "Terminé",
  dropped: "Abandonné"
};

function normalizeWatchlistStatus(status) {
  const legacyStatuses = {
    "En cours": "watching",
    "À voir": "plan_to_watch",
    "Terminé": "completed",
    "Abandonné": "dropped"
  };

  return watchlistStatusLabels[status] ? status : legacyStatuses[status] || "plan_to_watch";
}

function renderWatchlistGrid() {
  Object.entries(watchlistContainers).forEach(([status, container]) => {
    if (!container) return;
    container.innerHTML = "";
    const items = userWatchlist.filter(item => normalizeWatchlistStatus(item.status) === status);

    if (items.length === 0) {
      container.innerHTML = `<p class="watchlist-empty-message">Aucun contenu ${status === "watching" ? "en cours" : status === "plan_to_watch" ? "à voir" : status === "completed" ? "terminé" : "abandonné"}.</p>`;
      return;
    }

    items.forEach(item => renderMediaCard(item, container));
  });
}

function renderMediaCard(item, container) {
  const card = document.createElement("div");
  card.className = "media-card";
  const normalizedStatus = normalizeWatchlistStatus(item.status);
  const progressHTML = normalizedStatus === "watching" && ["tv", "anime", "kdrama"].includes(item.type)
    ? `<span class="progress-badge">${formatProgress(item)}</span>`
    : "";
  card.innerHTML = `
    <img src="${item.poster}" alt="${item.title}">
    <div class="media-info">
      <h3>${item.title}</h3>
      <span class="rating">★ ${item.rating} / 5</span>
      <span class="card-status-badge">${watchlistStatusLabels[normalizedStatus]}</span>
      ${progressHTML}
    </div>
  `;
  card.addEventListener("click", () => openModal(item));
  container.appendChild(card);
}

function getAbsoluteEpisode(item) {
  const season = Number(item.currentSeason) || 1;
  const episode = Number(item.currentEpisode) || 0;
  const previousEpisodes = (item.seasonEpisodeCounts || [])
    .filter(entry => Number(entry.season) < season)
    .reduce((total, entry) => total + Number(entry.episodes || 0), 0);
  return previousEpisodes + episode;
}

function formatProgress(item) {
  const season = Number(item.currentSeason) || 1;
  const episode = Number(item.currentEpisode) || 0;
  const total = Number(item.totalEpisodes) || 0;
  const absolute = getAbsoluteEpisode(item);
  return total ? `S${season} E${episode} · Ép. ${absolute}/${total}` : `S${season} E${episode}`;
}

// ==========================================
// MODALE, STREAMING (VOIRDRAMA.TO) ET COMMENTAIRES
// ==========================================
async function openModal(item) {
  item = await enrichMediaDetails(item);
  currentMedia = item;
  currentUserRating = null;
  ratingValueDisplay.textContent = "Note ce contenu";

  modalImg.src = item.poster;
  modalTitle.textContent = item.title;
  modalRating.textContent = `★ ${item.rating} / 5`;
  modalDescription.textContent = item.overview || "Pas de description disponible.";

  renderStreamingLinks(item);

  const inWatchlist = userWatchlist.find(w => w.id === item.id);
  if (inWatchlist) {
    Object.assign(inWatchlist, {
      totalEpisodes: item.totalEpisodes,
      totalSeasons: item.totalSeasons,
      seasonEpisodeCounts: item.seasonEpisodeCounts
    });
  }
  const progressItem = inWatchlist ? { ...item, ...inWatchlist } : item;
  const isEpisodeMedia = ["tv", "anime", "kdrama"].includes(item.type);

  if (inWatchlist) {
    modalAddBtn.textContent = "Retirer de ma liste";
    modalAddBtn.style.backgroundColor = "#da3633";
    userTrackingSection.style.display = "block";
    mediaStatusSelect.value = normalizeWatchlistStatus(inWatchlist.status);

    if (inWatchlist.isFavorite) {
      modalFavBtn.classList.add("active");
      modalFavBtn.textContent = "❤️ En Coup de Cœur";
    } else {
      modalFavBtn.classList.remove("active");
      modalFavBtn.textContent = "❤️ Coup de cœur";
    }
  } else {
    modalAddBtn.textContent = "+ Ajouter à Ma Liste";
    modalAddBtn.style.backgroundColor = "#2563eb";
    userTrackingSection.style.display = "flex";
    mediaStatusSelect.value = "plan_to_watch";
    modalFavBtn.classList.remove("active");
    modalFavBtn.textContent = "❤️ Coup de cœur";
  }

  if (isEpisodeMedia) {
    mediaProgressSection.style.display = "grid";
    currentSeasonInput.value = progressItem.currentSeason || 1;
    currentEpisodeInput.value = progressItem.currentEpisode || 0;
    episodeProgressDisplay.textContent = progressItem.totalEpisodes
      ? formatProgress(progressItem)
      : "Informations d’épisodes indisponibles.";
  } else {
    mediaProgressSection.style.display = "none";
    currentSeasonInput.value = "";
    currentEpisodeInput.value = "";
    episodeProgressDisplay.textContent = "";
  }

  await loadCurrentUserRating(item.id);
  renderRatingStars(currentUserRating || 0);

  loadComments(item.id);
  modal.style.display = "flex";
}

function renderStreamingLinks(item) {
  providerList.innerHTML = "";
  const type = item.type || "movie";

  if (type === "anime") {
    addStreamLink("Anime-Sama", "https://anime-sama.to/", "stream-anime-sama");
    addStreamLink("Crunchyroll", "https://www.crunchyroll.com/", "stream-crunchyroll");
    addStreamLink("Movix", "https://movix.online/", "stream-movix");
  } else if (type === "kdrama") {
    addStreamLink("VoirDrama", "https://voirdrama.to/", "stream-voirdrama");
    addStreamLink("Movix", "https://movix.online/", "stream-movix");
  } else if (type === "tv") {
    addStreamLink("Netflix", "https://www.netflix.com/", "stream-netflix");
    addStreamLink("Movix", "https://movix.online/", "stream-movix");
  } else {
    addStreamLink("Movix", "https://movix.online/", "stream-movix");
  }
}

function addStreamLink(name, url, cssClass) {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.className = `stream-btn ${cssClass}`;
  a.textContent = name;
  providerList.appendChild(a);
}

function renderRatingStars(value) {
  const parsedValue = Number(value) || 0;
  const stars = Array.from(document.querySelectorAll("#user-star-rating .star"));
  stars.forEach(star => {
    const starVal = Number(star.dataset.value);
    star.classList.toggle("active", starVal <= parsedValue);
  });

  if (parsedValue > 0) {
    ratingValueDisplay.textContent = `${parsedValue}/5`;
  } else {
    ratingValueDisplay.textContent = "Note ce contenu";
  }
}

async function loadCurrentUserRating(mediaId) {
  currentUserRating = null;
  if (!currentUser || !mediaId) {
    renderRatingStars(0);
    return;
  }

  try {
    const ratingRef = doc(db, "users", currentUser.uid, "watchlist", mediaId);
    const ratingSnap = await getDoc(ratingRef);
    if (ratingSnap.exists()) {
      const data = ratingSnap.data();
      const rating = Number(data.userRating || data.ratingUser || 0);
      currentUserRating = rating >= 1 && rating <= 5 ? rating : null;
    }

    const localItem = userWatchlist.find(item => item.id === mediaId);
    if (localItem && localItem.userRating && !currentUserRating) {
      currentUserRating = Number(localItem.userRating);
    }
  } catch (err) {
    console.error("Erreur chargement de la note utilisateur :", err);
  }

  renderRatingStars(currentUserRating || 0);
}

async function saveUserRating(value) {
  if (!currentUser || !currentMedia) {
    return alert("Veuillez vous connecter pour noter ce contenu !");
  }

  const mediaDocRef = doc(db, "users", currentUser.uid, "watchlist", currentMedia.id);
  const mediaToSave = {
    ...currentMedia,
    status: "plan_to_watch",
    isFavorite: false,
    userRating: value
  };

  const existing = userWatchlist.find(item => item.id === currentMedia.id);
  if (existing) {
    existing.userRating = value;
    await updateDoc(mediaDocRef, { userRating: value });
  } else {
    await setDoc(mediaDocRef, mediaToSave, { merge: true });
    userWatchlist.push(mediaToSave);
  }

  currentUserRating = value;
  renderRatingStars(currentUserRating);
}

if (userStarRating) {
  userStarRating.addEventListener("mouseover", (e) => {
    const star = e.target.closest(".star");
    if (!star) return;
    const hoverValue = Number(star.dataset.value);
    renderRatingStars(hoverValue);
  });

  userStarRating.addEventListener("mouseleave", () => {
    renderRatingStars(currentUserRating || 0);
  });

  userStarRating.addEventListener("click", async (e) => {
    const star = e.target.closest(".star");
    if (!star) return;

    const value = Number(star.dataset.value);
    await saveUserRating(value);
  });
}

closeModal.addEventListener("click", () => {
  modal.style.display = "none";
  if (commentsUnsubscribe) commentsUnsubscribe();
});

window.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.style.display = "none";
    if (commentsUnsubscribe) commentsUnsubscribe();
  }
});

// GESTION COMMENTAIRES
function loadComments(mediaId) {
  if (commentsUnsubscribe) commentsUnsubscribe();

  const commentsRef = collection(db, "media_comments", mediaId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "desc"));

  commentsUnsubscribe = onSnapshot(q, (snapshot) => {
    commentsList.innerHTML = "";
    if (snapshot.empty) {
      commentsList.innerHTML = "<p class='empty-msg'>Aucun commentaire pour l'instant.</p>";
      return;
    }

    snapshot.forEach((docSnap) => {
      const com = docSnap.data();
      const item = document.createElement("div");
      item.className = "comment-item";

      const showFriendBtn = currentUser && currentUser.uid !== com.userId;

      item.innerHTML = `
        <div class="comment-header">
          <div class="comment-user-info">
            <img src="${com.userPhoto || 'https://via.placeholder.com/24'}" class="comment-avatar" alt="Avatar">
            <span class="comment-author">${com.userName || 'Utilisateur'}</span>
          </div>
          ${showFriendBtn ? `<button class="btn-add-friend-sm" data-uid="${com.userId}">+ Ajouter en ami</button>` : ''}
        </div>
        <p class="comment-text">${escapeHTML(com.text)}</p>
      `;

      if (showFriendBtn) {
        item.querySelector(".btn-add-friend-sm").addEventListener("click", () => {
          sendFriendRequestFromComment(com.userId);
        });
      }

      commentsList.appendChild(item);
    });
  });
}

submitCommentBtn.addEventListener("click", async () => {
  if (!currentUser) return alert("Veuillez vous connecter pour publier un commentaire !");
  const text = commentInput.value.trim();
  if (!text) return;

  try {
    await addDoc(collection(db, "media_comments", currentMedia.id, "comments"), {
      userId: currentUser.uid,
      userName: userProfileData?.displayName || currentUser.displayName || "Utilisateur",
      userPhoto: userProfileData?.photoURL || currentUser.photoURL || "",
      text: text,
      createdAt: new Date()
    });
    commentInput.value = "";
  } catch (err) {
    console.error("Erreur lors de la publication du commentaire :", err);
  }
});

async function sendFriendRequestFromComment(targetUid) {
  if (!currentUser) return alert("Connecte-toi pour ajouter un ami !");
  if (targetUid === currentUser.uid) return;

  try {
    const targetRef = doc(db, "users", targetUid);
    const targetDoc = await getDoc(targetRef);

    if (targetDoc.exists()) {
      const data = targetDoc.data();
      if (data.friends && data.friends.includes(currentUser.uid)) {
        alert("Vous êtes déjà amis !");
        return;
      }
      if (data.friendRequests && data.friendRequests.includes(currentUser.uid)) {
        alert("Demande d'ami déjà envoyée !");
        return;
      }

      await updateDoc(targetRef, { friendRequests: arrayUnion(currentUser.uid) });
      alert("Demande d'ami envoyée avec succès !");
    }
  } catch (e) {
    console.error(e);
  }
}

function escapeHTML(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

function getProgressData(item = currentMedia) {
  if (!item || !["tv", "anime", "kdrama"].includes(item.type)) return {};

  const currentSeason = Math.max(1, Number.parseInt(currentSeasonInput.value, 10) || 1);
  const currentEpisode = Math.max(0, Number.parseInt(currentEpisodeInput.value, 10) || 0);
  return { currentSeason, currentEpisode };
}

function updateProgressDisplay(item) {
  episodeProgressDisplay.textContent = item.totalEpisodes
    ? formatProgress(item)
    : "Informations d’épisodes indisponibles.";
}

// Watchlist & Favoris
modalAddBtn.addEventListener("click", async () => {
  if (!currentUser) return alert("Veuillez vous connecter !");

  const index = userWatchlist.findIndex(w => w.id === currentMedia.id);
  const docRef = doc(db, "users", currentUser.uid, "watchlist", currentMedia.id);

  if (index > -1) {
    await deleteDoc(docRef);
    userWatchlist.splice(index, 1);
    openModal(currentMedia);
  } else {
    const newItem = {
      ...currentMedia,
      ...getProgressData(),
      status: normalizeWatchlistStatus(mediaStatusSelect.value),
      isFavorite: false
    };
    await setDoc(docRef, newItem);
    userWatchlist.push(newItem);
    openModal(currentMedia);
  }
  calculateUserStats();
});

modalFavBtn.addEventListener("click", async () => {
  if (!currentUser) return alert("Veuillez vous connecter !");

  let item = userWatchlist.find(w => w.id === currentMedia.id);
  const docRef = doc(db, "users", currentUser.uid, "watchlist", currentMedia.id);

  if (!item) {
    item = {
      ...currentMedia,
      ...getProgressData(),
      status: normalizeWatchlistStatus(mediaStatusSelect.value),
      isFavorite: true
    };
    await setDoc(docRef, item);
    userWatchlist.push(item);
  } else {
    item.isFavorite = !item.isFavorite;
    await updateDoc(docRef, { isFavorite: item.isFavorite });
  }

  openModal(item);
  renderFavoritesGrid();
});

saveProgressBtn.addEventListener("click", async () => {
  if (!currentUser || !currentMedia) return alert("Veuillez vous connecter !");
  if (!["tv", "anime", "kdrama"].includes(currentMedia.type)) return;

  const progressData = getProgressData();
  let item = userWatchlist.find(w => w.id === currentMedia.id);
  const docRef = doc(db, "users", currentUser.uid, "watchlist", currentMedia.id);

  if (!item) {
    item = {
      ...currentMedia,
      ...progressData,
      status: normalizeWatchlistStatus(mediaStatusSelect.value),
      isFavorite: false
    };
    await setDoc(docRef, item);
    userWatchlist.push(item);
  } else {
    Object.assign(item, progressData);
    await updateDoc(docRef, progressData);
  }

  Object.assign(currentMedia, progressData);
  updateProgressDisplay(currentMedia);
  renderWatchlistGrid();
});

mediaStatusSelect.addEventListener("change", async (e) => {
  if (!currentUser || !currentMedia) return;
  const newStatus = normalizeWatchlistStatus(e.target.value);
  const item = userWatchlist.find(w => w.id === currentMedia.id);
  if (item) {
    item.status = newStatus;
    await updateDoc(doc(db, "users", currentUser.uid, "watchlist", currentMedia.id), { status: newStatus });
    calculateUserStats();
    renderWatchlistGrid();
  }
});

// ==========================================
// GESTION PROFIL ET SCORE/STATS PAR CATÉGORIE
// ==========================================
async function loadUserProfile(uid) {
  viewedProfileUid = uid;
  const userDocRef = doc(db, "users", uid);
  const docSnap = await getDoc(userDocRef);

  let profileData = null;
  if (docSnap.exists()) {
    profileData = docSnap.data();
  } else if (uid === currentUser?.uid) {
    profileData = {
      displayName: currentUser.displayName || "Utilisateur",
      photoURL: currentUser.photoURL || "https://via.placeholder.com/150",
      bio: "Passionné de cinéma, séries et animes.",
      xLink: "",
      discord: "",
      email: currentUser.email,
      friends: [],
      friendRequests: []
    };
    await setDoc(userDocRef, profileData);
  }

  if (uid === currentUser?.uid) {
    userProfileData = profileData;
  }

  renderUserProfile(profileData, uid);
}

function renderUserProfile(data, uid) {
  if (!data) return;

  const isOwnProfile = currentUser && currentUser.uid === uid;
  const isFriend = currentUser && data.friends && data.friends.includes(currentUser.uid);

  if (isOwnProfile) {
    userName.textContent = data.displayName;
    headerAvatar.src = data.photoURL;
  }

  profileDisplayName.textContent = data.displayName;
  profileAvatar.src = data.photoURL;
  profileBio.textContent = data.bio || "Aucune biographie.";

  if (isOwnProfile) {
    editProfileBtn.style.display = "inline-block";
    if (addFriendBtn) addFriendBtn.style.display = "none";
  } else {
    editProfileBtn.style.display = "none";
    if (addFriendBtn) {
      addFriendBtn.style.display = "inline-block";
      updateAddFriendButtonState(data);
    }
  }

  if (isOwnProfile || isFriend) {
    if (data.xLink) {
      profileXBtn.style.display = "inline-flex";
      profileXBtn.onclick = (e) => {
        e.preventDefault();
        openXApp(data.xLink);
      };
    } else {
      profileXBtn.style.display = "none";
    }

    if (data.discord) {
      profileDiscordBtn.style.display = "inline-flex";
      profileDiscordBtn.textContent = `Discord: ${data.discord}`;
      profileDiscordBtn.onclick = (e) => {
        e.preventDefault();
        navigator.clipboard.writeText(data.discord);
        alert(`Pseudo Discord (${data.discord}) copié dans le presse-papier !`);
      };
    } else {
      profileDiscordBtn.style.display = "none";
    }
  } else {
    profileXBtn.style.display = "none";
    profileDiscordBtn.style.display = "none";
  }

  calculateUserStats();
  renderFavoritesGrid();
}

function calculateUserStats() {
  const films = userWatchlist.filter(item => item.type === "movie").length;
  const series = userWatchlist.filter(item => item.type === "tv").length;
  const animes = userWatchlist.filter(item => item.type === "anime").length;
  const kdramas = userWatchlist.filter(item => item.type === "kdrama").length;
  const docs = userWatchlist.filter(item => item.type === "documentary").length;

  document.getElementById("stat-films").textContent = films;
  document.getElementById("stat-series").textContent = series;
  document.getElementById("stat-animes").textContent = animes;
  document.getElementById("stat-kdramas").textContent = kdramas;
  document.getElementById("stat-docs").textContent = docs;
}

function openXApp(xHandleOrUrl) {
  let handle = xHandleOrUrl.replace(/https?:\/\/(www\.)?(twitter|x)\.com\//, '').replace('@', '').trim();
  const appUrl = `twitter://user?screen_name=${handle}`;
  const webUrl = `https://x.com/${handle}`;

  window.location.href = appUrl;
  setTimeout(() => { window.open(webUrl, "_blank"); }, 1000);
}

// ==========================================
// SYSTÈME D'AMIS ET NOTIFICATIONS
// ==========================================
function updateAddFriendButtonState(targetUserData) {
  if (!currentUser) return;

  const hasSentRequest = targetUserData.friendRequests && targetUserData.friendRequests.includes(currentUser.uid);
  const isFriend = targetUserData.friends && targetUserData.friends.includes(currentUser.uid);

  if (isFriend) {
    addFriendBtn.textContent = "✔ Amis";
    addFriendBtn.style.backgroundColor = "#16a34a";
  } else if (hasSentRequest) {
    addFriendBtn.textContent = "Demande envoyée";
    addFriendBtn.style.backgroundColor = "#475569";
  } else {
    addFriendBtn.textContent = "+ Add Friend";
    addFriendBtn.style.backgroundColor = "#2563eb";
  }

  addFriendBtn.onclick = () => handleFriendRequestToggle(targetUserData);
}

async function handleFriendRequestToggle(targetUserData) {
  if (!currentUser) return alert("Connecte-toi pour ajouter un ami !");

  const targetRef = doc(db, "users", viewedProfileUid);
  const isFriend = targetUserData.friends && targetUserData.friends.includes(currentUser.uid);
  const hasSentRequest = targetUserData.friendRequests && targetUserData.friendRequests.includes(currentUser.uid);

  if (isFriend) {
    if (confirm("Retirer cet utilisateur de tes amis ?")) {
      await updateDoc(targetRef, { friends: arrayRemove(currentUser.uid) });
      await updateDoc(doc(db, "users", currentUser.uid), { friends: arrayRemove(viewedProfileUid) });
      alert("Ami retiré.");
      loadUserProfile(viewedProfileUid);
    }
  } else if (!hasSentRequest) {
    await updateDoc(targetRef, { friendRequests: arrayUnion(currentUser.uid) });
    alert("Demande d'ami envoyée !");
    loadUserProfile(viewedProfileUid);
  }
}

async function checkFriendRequests() {
  if (!currentUser) return;
  const userDoc = await getDoc(doc(db, "users", currentUser.uid));
  if (!userDoc.exists()) return;

  const requests = userDoc.data().friendRequests || [];
  if (requests.length > 0) {
    notifBadge.textContent = requests.length;
    notifBadge.style.display = "inline-block";
    renderFriendRequests(requests);
  } else {
    notifBadge.style.display = "none";
    friendRequestsList.innerHTML = "<p class='empty-msg'>Aucune demande en attente.</p>";
  }
}

async function renderFriendRequests(requestUids) {
  friendRequestsList.innerHTML = "";
  for (const uid of requestUids) {
    const senderDoc = await getDoc(doc(db, "users", uid));
    if (!senderDoc.exists()) continue;

    const sender = senderDoc.data();
    const item = document.createElement("div");
    item.className = "friend-request-item";
    item.innerHTML = `
      <span>${sender.displayName}</span>
      <div>
        <button class="btn-accept">Accepter</button>
        <button class="btn-refuse">Refuser</button>
      </div>
    `;

    item.querySelector(".btn-accept").onclick = () => acceptFriendRequest(uid);
    item.querySelector(".btn-refuse").onclick = () => refuseFriendRequest(uid);
    friendRequestsList.appendChild(item);
  }
}

async function acceptFriendRequest(senderUid) {
  await updateDoc(doc(db, "users", currentUser.uid), {
    friends: arrayUnion(senderUid),
    friendRequests: arrayRemove(senderUid)
  });
  await updateDoc(doc(db, "users", senderUid), { friends: arrayUnion(senderUid) });

  alert("Demande d'ami acceptée !");
  checkFriendRequests();
  if (viewedProfileUid === senderUid) loadUserProfile(senderUid);
}

async function refuseFriendRequest(senderUid) {
  await updateDoc(doc(db, "users", currentUser.uid), { friendRequests: arrayRemove(senderUid) });
  checkFriendRequests();
}

if (notifBtn) {
  notifBtn.onclick = () => {
    notifDropdown.style.display = notifDropdown.style.display === "none" ? "block" : "none";
  };
}

// ==========================================
// NAVIGATION ET MASQUAGE DES FILTRES
// ==========================================
function switchTab(tab) {
  navHome.classList.remove("active");
  navWatchlist.classList.remove("active");
  navProfile.classList.remove("active");

  if (tab === "home") {
    navHome.classList.add("active");
    mainContentView.style.display = "block";
    profileView.style.display = "none";
    watchlistView.style.display = "none";
    document.getElementById("popular-section").style.display = "block";
    searchFilterSection.style.display = "flex";
    trendingSection.style.display = "block";
    applyFiltersAndFetch();
  } else if (tab === "watchlist") {
    if (!currentUser) return alert("Connecte-toi pour voir ta liste !");
    navWatchlist.classList.add("active");
    mainContentView.style.display = "block";
    profileView.style.display = "none";
    watchlistView.style.display = "block";
    document.getElementById("popular-section").style.display = "none";
    searchFilterSection.style.display = "flex";
    trendingSection.style.display = "none";
    renderWatchlistGrid();
  } else if (tab === "profile") {
    if (!currentUser) return;
    navProfile.classList.add("active");
    mainContentView.style.display = "none";
    profileView.style.display = "flex";
    watchlistView.style.display = "none";
    document.getElementById("popular-section").style.display = "block";
    searchFilterSection.style.display = "none";
    loadUserProfile(currentUser.uid);
  }
}

navHome.addEventListener("click", () => switchTab("home"));
navWatchlist.addEventListener("click", () => switchTab("watchlist"));
navProfile.addEventListener("click", () => switchTab("profile"));

editProfileBtn.addEventListener("click", () => {
  editUsername.value = userProfileData.displayName || "";
  editPhotoUrl.value = userProfileData.photoURL || "";
  editPhotoFile.value = "";
  editBio.value = userProfileData.bio || "";
  editX.value = userProfileData.xLink || "";
  editDiscord.value = userProfileData.discord || "";

  if (userProfileData.photoURL && userProfileData.photoURL.startsWith("data:image/")) {
    photoSourceTabs.forEach(tab => tab.classList.toggle("active", tab.dataset.photoSource === "file"));
    photoFilePanel.style.display = "block";
    photoUrlPanel.style.display = "none";
  } else {
    photoSourceTabs.forEach(tab => tab.classList.toggle("active", tab.dataset.photoSource === "url"));
    photoFilePanel.style.display = "none";
    photoUrlPanel.style.display = "block";
  }

  editProfileForm.style.display = "block";
});

photoSourceTabs.forEach(tab => {
  tab.addEventListener("click", () => {
    const mode = tab.dataset.photoSource;
    photoSourceTabs.forEach(t => t.classList.toggle("active", t === tab));
    if (mode === "file") {
      photoFilePanel.style.display = "block";
      photoUrlPanel.style.display = "none";
    } else {
      photoFilePanel.style.display = "none";
      photoUrlPanel.style.display = "block";
    }
  });
});

cancelProfileBtn.addEventListener("click", () => editProfileForm.style.display = "none");

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

saveProfileBtn.addEventListener("click", async () => {
  if (!currentUser) return;

  const activeMode = photoSourceTabs.find(tab => tab.classList.contains("active"))?.dataset.photoSource || "file";
  let photoURL = "";

  if (activeMode === "file") {
    const file = editPhotoFile.files && editPhotoFile.files[0];
    if (file) {
      try {
        photoURL = await readFileAsDataURL(file);
      } catch (err) {
        console.error("Erreur lecture image locale", err);
        return alert("Impossible de lire l’image locale choisie.");
      }
    } else {
      photoURL = editPhotoUrl.value.trim() || userProfileData?.photoURL || currentUser.photoURL || "https://via.placeholder.com/150";
    }
  } else {
    photoURL = editPhotoUrl.value.trim() || userProfileData?.photoURL || currentUser.photoURL || "https://via.placeholder.com/150";
  }

  const updatedData = {
    displayName: editUsername.value.trim() || currentUser.displayName || "Utilisateur",
    photoURL: photoURL,
    bio: editBio.value.trim(),
    xLink: editX.value.trim(),
    discord: editDiscord.value.trim()
  };

  await setDoc(doc(db, "users", currentUser.uid), updatedData, { merge: true });
  userProfileData = { ...userProfileData, ...updatedData };
  renderUserProfile(userProfileData, currentUser.uid);
  editProfileForm.style.display = "none";
  alert("Profil mis à jour !");
});

async function loadUserWatchlist() {
  if (!currentUser) return;
  try {
    const q = query(collection(db, "users", currentUser.uid, "watchlist"));
    const querySnapshot = await getDocs(q);
    userWatchlist = [];
    querySnapshot.forEach(docSnap => userWatchlist.push(docSnap.data()));
    calculateUserStats();
  } catch (e) {
    console.error("Erreur watchlist :", e);
  }
}

function renderFavoritesGrid() {
  const favoritesGrid = document.getElementById("favorites-grid");
  if (!favoritesGrid) return;
  favoritesGrid.innerHTML = "";

  const favList = userWatchlist.filter(item => item.isFavorite === true);
  if (favList.length === 0) {
    favoritesGrid.innerHTML = "<p class='empty-msg'>Aucun coup de cœur pour l'instant.</p>";
    return;
  }

  favList.forEach(item => {
    const card = document.createElement("div");
    card.className = "media-card";
    card.innerHTML = `
      <img src="${item.poster}" alt="${item.title}">
      <div class="media-info">
        <h3>${item.title}</h3>
        <span class="rating">★ ${item.rating} / 5</span>
      </div>
    `;
    card.addEventListener("click", () => openModal(item));
    favoritesGrid.appendChild(card);
  });
}