// =======================
//   Configuración TMDb
// =======================
const TMDB = {
  BASE: "https://api.themoviedb.org/3",
  IMG_BASE: "https://image.tmdb.org/t/p/w500",
  // ⚠️ IMPORTANTE: Sustituye el texto de abajo por tu token real de TMDb
  BEARER: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzOTgxNWVjZTI4ZjcyNWJlZGRmY2Y3OGE0YzRjZGU0ZiIsIm5iZiI6MTc2MDQ1NjUxNS4xNDcsInN1YiI6IjY4ZWU2ZjQzNDYzMzQ0Yjg0MTlkZjQ3MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ejdXz4pm0dZn0OAVJvJ16R8SwNAa-MBkO_yttUiblLk", 
  options() {
    return {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${this.BEARER}`,
      },
    };
  },
};

// =======================
//   Datos iniciales
// =======================
const MOVIES_STORAGE_KEY = "mis_peliculas_2025";
const KEYWORDS_STORAGE_KEY = "mis_keywords_2025";

const mis_peliculas_iniciales = [
  {
    titulo: "Superlópez",
    director: "Javier Ruiz Caldera",
    miniatura: "files/superlopez.png",
  },
  {
    titulo: "Jurassic Park",
    director: "Steven Spielberg",
    miniatura: "files/jurassicpark.png",
  },
  {
    titulo: "Interstellar",
    director: "Christopher Nolan",
    miniatura: "files/interstellar.png",
  },
];

// Resultados de la última búsqueda en TMDb
let tmdb_last_results = [];

// =======================
//   Helpers de DOM
// =======================
function elMain() {
  return document.getElementById("main");
}

function matchEvent(ev, selector) {
  return ev.target.closest(selector);
}

function myId(ev) {
  const el = ev.target.closest("[data-id]");
  if (!el) return -1;
  return Number(el.dataset.id);
}

// URL del póster
function posterUrl(path) {
  if (!path) {
    // imagen de relleno
    return "https://via.placeholder.com/500x750?text=Sin+imagen";
  }
  return `${TMDB.IMG_BASE}${path}`;
}

// =======================
//   Almacenamiento películas
// =======================
function loadMovies() {
  try {
    const raw = localStorage.getItem(MOVIES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (e) {
    console.error("Error cargando películas", e);
    return [];
  }
}

function saveMovies(list) {
  localStorage.setItem(MOVIES_STORAGE_KEY, JSON.stringify(list));
}

function ensureInitialized() {
  const current = loadMovies();
  if (!current || current.length === 0) {
    saveMovies(mis_peliculas_iniciales);
  }
}

// =======================
//   Almacenamiento keywords
// =======================
function loadMyKeywords() {
  try {
    const raw = localStorage.getItem(KEYWORDS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("Error cargando mis palabras clave", e);
    return [];
  }
}

function saveMyKeywords(list) {
  localStorage.setItem(KEYWORDS_STORAGE_KEY, JSON.stringify(list));
}

// =======================
//   Limpieza / procesado de keywords
// =======================
function cleanKeyword(keyword) {
  return (keyword || "")
    .replace(/[^a-zñáéíóú0-9 ]+/igm, "") // quitar caracteres especiales
    .trim()
    .toLowerCase();
}

function processKeywords(keywords) {
  const result = [];
  if (!Array.isArray(keywords)) return result;

  for (const kw of keywords) {
    const name = kw && kw.name ? kw.name : "";
    const cleaned = cleanKeyword(name);
    if (!cleaned) continue;
    if (!result.includes(cleaned)) {
      result.push(cleaned);
    }
  }
  return result.sort();
}

// =======================
//   Vistas
// =======================
function indexView(peliculas) {
  if (!peliculas || peliculas.length === 0) {
    return `
      <section>
        <h2>Mis películas</h2>
        <p class="warning">
          No hay películas guardadas todavía.
        </p>
        <div class="mt-2">
          <button class="new">Añadir película</button>
          <button class="open-search secondary">Buscar en TMDb</button>
          <button class="my-keywords secondary">Mis palabras clave</button>
        </div>
      </section>
    `;
  }

  const cards = peliculas
    .map(
      (pelicula, i) => `
      <article class="movie-card">
        <img src="${pelicula.miniatura || "https://via.placeholder.com/500x750?text=Sin+imagen"}"
             alt="Póster de ${pelicula.titulo}"
             onerror="this.src='https://via.placeholder.com/500x750?text=Sin+imagen'">
        <div class="movie-card-body">
          <h3 class="movie-card-title">${pelicula.titulo}</h3>
          <p class="movie-card-director">${
            pelicula.director || "<em>Director desconocido</em>"
          }</p>
          <div class="actions">
            <button class="show" data-id="${i}">Ver</button>
            <button class="edit" data-id="${i}">Editar</button>
            <button class="delete danger" data-id="${i}">Borrar</button>
            ${
              pelicula.tmdbId
                ? `<button class="keywords"
                           data-movie-id="${pelicula.tmdbId}"
                           data-movie-title="${pelicula.titulo}">
                     Palabras clave
                   </button>`
                : ""
            }
          </div>
        </div>
      </article>
    `
    )
    .join("");

  return `
    <section>
      <h2>Mis películas</h2>
      <div class="movies-grid">
        ${cards}
      </div>
      <div class="mt-2">
        <button class="new">Añadir película</button>
        <button class="reset secondary">Reset</button>
        <button class="open-search secondary">Buscar en TMDb</button>
        <button class="my-keywords secondary">Mis palabras clave</button>
      </div>
    </section>
  `;
}

function showView(pelicula) {
  return `
    <section>
      <h2>${pelicula.titulo}</h2>
      <div class="movie-detail">
        <div>
          <img src="${pelicula.miniatura || "https://via.placeholder.com/500x750?text=Sin+imagen"}"
               alt="Póster de ${pelicula.titulo}"
               onerror="this.src='https://via.placeholder.com/500x750?text=Sin+imagen'">
        </div>
        <div>
          <p><strong>Director:</strong> ${
            pelicula.director || "Desconocido"
          }</p>
          ${
            pelicula.tmdbId
              ? `<p class="mt-1">
                   <button class="keywords"
                           data-movie-id="${pelicula.tmdbId}"
                           data-movie-title="${pelicula.titulo}">
                     Ver palabras clave
                   </button>
                 </p>`
              : ""
          }
          <p class="mt-2">
            <button class="index">Volver</button>
          </p>
        </div>
      </div>
    </section>
  `;
}

function formTpl(title, submitClass, submitText, pelicula = {}) {
  return `
    <section>
      <h2>${title}</h2>
      <form>
        <div class="form-group">
          <label for="titulo">Título</label>
          <input type="text" id="titulo" value="${pelicula.titulo || ""}">
        </div>
        <div class="form-group">
          <label for="director">Director</label>
          <input type="text" id="director" value="${pelicula.director || ""}">
        </div>
        <div class="form-group">
          <label for="miniatura">Miniatura (URL)</label>
          <input type="text" id="miniatura" value="${pelicula.miniatura || ""}">
        </div>
        <div class="mt-2">
          <button type="button" class="${submitClass}">${submitText}</button>
          <button type="button" class="index secondary">Cancelar</button>
        </div>
      </form>
    </section>
  `;
}

function newView() {
  return formTpl("Nueva película", "create", "Crear");
}

function editView(i, pelicula) {
  return formTpl(
    `Editar película`,
    "update",
    "Actualizar",
    pelicula
  ).replace("<form>", `<form data-id="${i}">`);
}

function searchView() {
  return `
    <section>
      <h2>Buscar películas en TMDb</h2>
      <p>Escribe el título de la película que quieras buscar.</p>
      <div class="form-group mt-2">
        <label for="q">Título</label>
        <input type="text" id="q" placeholder="Ej. Interstellar">
      </div>
      <div class="mt-2">
        <button class="search">Buscar</button>
        <button class="index secondary">Volver al inicio</button>
      </div>
      <div id="results" class="mt-3"></div>
    </section>
  `;
}

function resultsView(resultados) {
  if (!resultados || resultados.length === 0) {
    return `
      <p class="warning mt-2">
        No se han encontrado resultados para esa búsqueda.
      </p>
    `;
  }

  const cards = resultados
    .map(
      (r, idx) => `
      <article class="result-card">
        <img src="${posterUrl(r.poster_path)}"
             alt="Póster de ${r.title}"
             onerror="this.src='https://via.placeholder.com/500x750?text=Sin+imagen'">
        <div class="result-body">
          <h3 class="movie-card-title">${r.title}</h3>
          <p class="meta">
            <strong>Estreno:</strong> ${r.release_date || "desconocido"} ·
            <strong>Nota:</strong> ${r.vote_average?.toFixed(1) || "N/A"}
          </p>
          <p class="overview">${r.overview || "Sin sinopsis disponible."}</p>
          <div class="actions mt-2">
            <button class="add-from-api" data-result-idx="${idx}">
              Añadir a mi colección
            </button>
            <button class="keywords"
                    data-movie-id="${r.id}"
                    data-movie-title="${r.title}">
              Ver palabras clave
            </button>
          </div>
        </div>
      </article>
    `
    )
    .join("");

  return `<div class="results-grid">${cards}</div>`;
}

function keywordsView(movieTitle, keywords) {
  const hasKeywords = keywords && keywords.length > 0;

  return `
    <section class="keywords">
      <h2>Palabras clave de "${movieTitle || "Película"}"</h2>

      ${
        hasKeywords
          ? `
        <ul class="keywords-list">
          ${keywords
            .map(
              (k) => `
            <li class="keyword-item">
              <span class="keyword-label">${k}</span>
              <button class="add-keyword" data-keyword="${k}">
                Agregar a mi lista
              </button>
            </li>
          `
            )
            .join("")}
        </ul>
        `
          : `
        <p class="info mt-2">
          Esta película no tiene palabras clave disponibles en TMDb.
        </p>
        `
      }

      <div class="keywords-actions">
        <button class="my-keywords secondary">Ver mi lista de palabras clave</button>
        <button class="index">Volver al inicio</button>
      </div>
    </section>
  `;
}

function myKeywordsView(keywords) {
  const hasKeywords = keywords && keywords.length > 0;

  return `
    <section class="my-keywords-view">
      <h2>Mis palabras clave</h2>

      ${
        hasKeywords
          ? `
        <ul class="keywords-list mt-2">
          ${keywords
            .map(
              (k, i) => `
            <li class="keyword-item">
              <span class="keyword-label">${k}</span>
              <button class="delete-keyword danger" data-keyword-idx="${i}">
                Eliminar
              </button>
            </li>
          `
            )
            .join("")}
        </ul>
        `
          : `
        <p class="info mt-2">
          Todavía no has añadido ninguna palabra clave a tu lista.
        </p>
        `
      }

      <div class="mt-2">
        <button class="index">Volver al inicio</button>
      </div>
    </section>
  `;
}

// =======================
//   Controladores
// =======================
function indexContr() {
  const peliculas = loadMovies();
  elMain().innerHTML = indexView(peliculas);
}

function showContr(i) {
  const peliculas = loadMovies();
  const pelicula = peliculas[i];
  if (!pelicula) {
    indexContr();
    return;
  }
  elMain().innerHTML = showView(pelicula);
}

function newContr() {
  elMain().innerHTML = newView();
}

function createContr() {
  const titulo = document.getElementById("titulo").value.trim();
  const director = document.getElementById("director").value.trim();
  const miniatura = document.getElementById("miniatura").value.trim();

  if (!titulo) {
    alert("El título es obligatorio.");
    return;
  }

  const peliculas = loadMovies();
  peliculas.push({ titulo, director, miniatura });
  saveMovies(peliculas);
  indexContr();
}

function editContr(i) {
  const peliculas = loadMovies();
  const pelicula = peliculas[i];
  if (!pelicula) {
    indexContr();
    return;
  }
  elMain().innerHTML = editView(i, pelicula);
}

function updateContr(i) {
  const form = document.querySelector("form[data-id]");
  if (!form) return;

  const titulo = document.getElementById("titulo").value.trim();
  const director = document.getElementById("director").value.trim();
  const miniatura = document.getElementById("miniatura").value.trim();

  if (!titulo) {
    alert("El título es obligatorio.");
    return;
  }

  const peliculas = loadMovies();
  if (!peliculas[i]) return;

  peliculas[i].titulo = titulo;
  peliculas[i].director = director;
  peliculas[i].miniatura = miniatura;
  saveMovies(peliculas);
  indexContr();
}

function deleteContr(i) {
  const peliculas = loadMovies();
  const pelicula = peliculas[i];
  if (!pelicula) return;

  if (!confirm(`¿Seguro que quieres borrar "${pelicula.titulo}"?`)) {
    return;
  }

  peliculas.splice(i, 1);
  saveMovies(peliculas);
  indexContr();
}

function resetContr() {
  if (
    !confirm(
      "¿Seguro que quieres restablecer la colección inicial de películas?"
    )
  ) {
    return;
  }
  localStorage.removeItem(MOVIES_STORAGE_KEY);
  ensureInitialized();
  indexContr();
}

// --- Búsqueda TMDb ---
function openSearchContr() {
  elMain().innerHTML = searchView();
  const q = document.getElementById("q");
  if (q) q.focus();
}

function searchContr() {
  const q = document.getElementById("q");
  if (!q) return;

  const term = q.value.trim();
  const resultsEl = document.getElementById("results");
  if (!resultsEl) return;

  if (!term) {
    resultsEl.innerHTML = `
      <p class="warning mt-2">
        Introduce un término de búsqueda.
      </p>
    `;
    return;
  }

  resultsEl.innerHTML = `
    <p class="info mt-2">
      Buscando en TMDb...
    </p>
  `;

  const url = `${TMDB.BASE}/search/movie?query=${encodeURIComponent(
    term
  )}&language=es-ES&include_adult=false`;

  fetch(url, TMDB.options())
    .then((res) => {
      if (!res.ok) throw new Error("Respuesta no OK en búsqueda TMDb");
      return res.json();
    })
    .then((data) => {
      tmdb_last_results = data.results || [];
      resultsEl.innerHTML = resultsView(tmdb_last_results);
    })
    .catch((err) => {
      console.error("Error en búsqueda TMDb", err);
      resultsEl.innerHTML = `
        <p class="error mt-2">
          Ha ocurrido un error al buscar en TMDb.
        </p>
      `;
    });
}

function addFromAPIContr(idx) {
  const btn = document.querySelector(
    `.add-from-api[data-result-idx="${idx}"]`
  );
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Añadiendo...";
  }

  try {
    const r = tmdb_last_results[idx];
    if (!r) {
      alert("No se ha encontrado esa película en los resultados.");
      return;
    }

    const peliculas = loadMovies();
    const miniatura = posterUrl(r.poster_path);

    const exists = peliculas.some((p) => {
      const sameTmdb =
        typeof p.tmdbId === "number" && p.tmdbId === r.id;
      const sameTitle =
        (p.titulo || "").toLowerCase() === (r.title || "").toLowerCase();
      const samePoster = p.miniatura === miniatura;
      return sameTmdb || (sameTitle && samePoster);
    });

    if (exists) {
      alert("Esta película ya está en tu colección.");
      return;
    }

    peliculas.push({
      titulo: r.title,
      director: "",
      miniatura,
      tmdbId: r.id,
    });

    saveMovies(peliculas);
    alert("Película añadida a tu colección.");
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.textContent = "Añadir a mi colección";
    }
  }
}

// --- Keywords ----
function keywordsContr(movieId, movieTitle) {
  const main = elMain();
  main.innerHTML = `
    <section class="message info">
      <h2>Cargando palabras clave...</h2>
      <p>Consultando TMDb para obtener las palabras clave de esta película.</p>
    </section>
  `;

  const url = `${TMDB.BASE}/movie/${movieId}/keywords`;

  fetch(url, TMDB.options())
    .then((res) => {
      if (!res.ok) {
        throw new Error("Respuesta no OK al obtener palabras clave");
      }
      return res.json();
    })
    .then((data) => {
      const processed = processKeywords(data.keywords || []);
      main.innerHTML = keywordsView(movieTitle, processed);
    })
    .catch((err) => {
      console.error("Error al obtener palabras clave", err);
      main.innerHTML = `
        <section class="message error">
          <h2>Error</h2>
          <p>No se han podido cargar las palabras clave de esta película.</p>
          <button class="index">Volver al inicio</button>
        </section>
      `;
    });
}

function myKeywordsContr() {
  const keywords = loadMyKeywords();
  elMain().innerHTML = myKeywordsView(keywords);
}

function addKeywordToList(keywordRaw) {
  const kw = cleanKeyword(keywordRaw || "");
  if (!kw) {
    alert("Palabra clave no válida.");
    return;
  }

  const list = loadMyKeywords();
  if (list.includes(kw)) {
    alert(`La palabra clave "${kw}" ya está en tu lista.`);
    return;
  }

  list.push(kw);
  list.sort();
  saveMyKeywords(list);

  alert(`"${kw}" se ha añadido a tu lista de palabras clave.`);
}

function deleteKeywordContr(idx) {
  const list = loadMyKeywords();
  if (idx < 0 || idx >= list.length) return;

  const kw = list[idx];
  if (!confirm(`¿Eliminar la palabra clave "${kw}" de tu lista?`)) return;

  list.splice(idx, 1);
  saveMyKeywords(list);

  myKeywordsContr();
}

// =======================
//   Inicialización
// =======================
function initContr() {
  ensureInitialized();
  indexContr();
}

// =======================
//   Router (eventos)
// =======================
document.addEventListener("click", (ev) => {
  if (matchEvent(ev, ".index")) {
    indexContr();
  } else if (matchEvent(ev, ".open-search")) {
    openSearchContr();
  } else if (matchEvent(ev, ".search")) {
    searchContr();
  } else if (matchEvent(ev, ".show")) {
    showContr(myId(ev));
  } else if (matchEvent(ev, ".edit")) {
    editContr(myId(ev));
  } else if (matchEvent(ev, ".update")) {
    const form = document.querySelector("form[data-id]");
    if (!form) return;
    const idx = Number(form.dataset.id);
    updateContr(idx);
  } else if (matchEvent(ev, ".new")) {
    newContr();
  } else if (matchEvent(ev, ".create")) {
    createContr();
  } else if (matchEvent(ev, ".delete")) {
    deleteContr(myId(ev));
  } else if (matchEvent(ev, ".reset")) {
    resetContr();
  } else if (matchEvent(ev, ".add-from-api")) {
    const idx = Number(ev.target.dataset.resultIdx);
    addFromAPIContr(idx);
  }
  // --- Nuevas rutas para keywords ---
  else if (matchEvent(ev, ".keywords")) {
    const btn = ev.target.closest(".keywords");
    const movieId = Number(btn.dataset.movieId);
    const movieTitle = btn.dataset.movieTitle || "";
    keywordsContr(movieId, movieTitle);
  } else if (matchEvent(ev, ".add-keyword")) {
    const kw = ev.target.dataset.keyword;
    addKeywordToList(kw);
  } else if (matchEvent(ev, ".my-keywords")) {
    myKeywordsContr();
  } else if (matchEvent(ev, ".delete-keyword")) {
    const idx = Number(ev.target.dataset.keywordIdx);
    deleteKeywordContr(idx);
  }
});

// Enter en el input de búsqueda
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    const q = document.getElementById("q");
    if (q && ev.target === q) {
      ev.preventDefault();
      searchContr();
    }
  }
});

document.addEventListener("DOMContentLoaded", initContr);