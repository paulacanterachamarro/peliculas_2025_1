// =======================
//   Configuración TMDb
// =======================
const TMDB = {
  BASE: "https://api.themoviedb.org/3",
  IMG_BASE: "https://image.tmdb.org/t/p/w500",
  // ⚠️ CLAVE API REAL OBTENIDA DEL USUARIO ⚠️
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
            pelicula.release_date ? `<p><strong>Estreno:</strong> ${pelicula.release_date}</p>` : ""
          }
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
            <strong>Nota:</strong> ${r.vote_average?.toFixed(1) || "N/A"}
          </p>
          
          <div class="result-actions mt-2">
            <button class="add-from-api" data-result-idx="${idx}">
              Añadir a mi colección
            </button>
            <button class="keywords secondary"
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
            <li class="keyword-item filter-by-keyword" data-keyword="${k}">
              <span class="keyword-label">${k}</span>
              <button class="secondary" disabled>
                Filtrar colección
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
        <button class="index">Volver al inicio</button>
      </div>
    </section>
  `;
}

function filteredMoviesView(keyword, peliculas) {
  if (!peliculas || peliculas.length === 0) {
    return `
      <section>
        <h2>Resultados para '${keyword}'</h2>
        <p class="warning">
          No se encontró ninguna película en tu colección con esta palabra clave.
        </p>
        <div class="mt-2">
          <button class="index">Volver al inicio</button>
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
        </div>
      </article>
    `
    )
    .join("");

  return `
    <section>
      <h2>Películas en tu colección con la palabra clave: "${keyword}"</h2>
      <p class="info">Mostrando ${peliculas.length} resultado(s).</p>
      <div class="movies-grid">
        ${cards}
      </div>
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
      release_date: r.release_date || "Desconocida",
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
  // CORRECCIÓN: Validamos el movieId antes de llamar a la API
  if (!movieId || isNaN(movieId) || movieId <= 0) {
    elMain().innerHTML = `
      <section class="message warning">
        <h2>Error de Datos</h2>
        <p>La película seleccionada no tiene un identificador TMDb válido para buscar sus palabras clave.</p>
        <button class="index">Volver al inicio</button>
      </section>
    `;
    return;
  }
  
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

function filterByKeywordContr(keyword) {
    const main = elMain();
    main.innerHTML = `
        <section class="message info">
            <h2>Filtrando por "${keyword}"...</h2>
            <p>Buscando en TMDb películas con esta palabra clave para cruzar con tu colección.</p>
        </section>
    `;

    // 1. Buscamos en TMDb películas que contengan la keyword 
    const url = `${TMDB.BASE}/search/movie?query=${encodeURIComponent(
        keyword
    )}&language=es-ES&include_adult=false`;

    fetch(url, TMDB.options())
        .then((res) => {
            if (!res.ok) throw new Error("Respuesta no OK al buscar en TMDb");
            return res.json();
        })
        .then((data) => {
            const tmdb_results = data.results || [];
            const localMovies = loadMovies();
            const localTmdbIds = new Set(localMovies.map(m => m.tmdbId).filter(id => id));

            // 2. Intersectamos: filtramos los resultados de TMDb para quedarnos solo con las películas que
            // están en nuestra colección local (usando el tmdbId).
            const tmdbMatches = tmdb_results.filter(r => localTmdbIds.has(r.id));
            
            // 3. Cruzamos los objetos para mostrar los datos locales (que tienen título, miniatura, etc.)
            const filteredMovies = localMovies.filter(localMovie => 
                tmdbMatches.some(tmdbMovie => tmdbMovie.id === localMovie.tmdbId)
            );

            // 4. Renderizamos la nueva vista con los resultados
            main.innerHTML = filteredMoviesView(keyword, filteredMovies);
        })
        .catch((err) => {
            console.error("Error al filtrar por palabra clave", err);
            main.innerHTML = `
                <section class="message error">
                    <h2>Error al filtrar</h2>
                    <p>Ha ocurrido un error al buscar películas por la palabra clave "${keyword}".</p>
                    <button class="index">Volver al inicio</button>
                </section>
            `;
        });
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
  // --- Rutas de Keywords ---
  else if (matchEvent(ev, ".keywords")) {
    const btn = ev.target.closest(".keywords");
    const movieId = Number(btn.dataset.movieId);
    const movieTitle = btn.dataset.movieTitle || "";
    keywordsContr(movieId, movieTitle);
  } else if (matchEvent(ev, ".filter-by-keyword")) {
    const item = ev.target.closest(".filter-by-keyword");
    const kw = item.dataset.keyword;
    filterByKeywordContr(kw);
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