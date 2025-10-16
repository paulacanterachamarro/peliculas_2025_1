// ==============================
// Configuración TMDb
// ==============================
const TMDB = {
  BASE: "https://api.themoviedb.org/3",
  IMG_BASE: "https://image.tmdb.org/t/p/w500",
  // Token proporcionado por el usuario (Bearer)
  BEARER: "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJhMTg1MTMxYWJiMjkzNjQyOTk2YmU5OThjMmU5YTg3MiIsIm5iZiI6MTc2MDYyMTM0MS4wMjU5OTk4LCJzdWIiOiI2OGYwZjMxZGJmMjYxMjBjNTljMjNmNTQiLCJzY29wZXMiOlsiYXBpX3JlYWQiXSwidmVyc2lvbiI6MX0.vQz6DecVBFafynvONFDE_3PMIr6YYMHpiAABYCdvtO4",
  options() {
    return {
      method: "GET",
      headers: {
        accept: "application/json",
        Authorization: `Bearer ${this.BEARER}`,
      },
    };
  }
};

// ==============================
// Persistencia (LocalStorage)
// ==============================
const STORAGE_KEY = "MIS_PELICULAS";
let mis_peliculas = [];

const mis_peliculas_iniciales = [
  { titulo: "Superlópez",    director: "Javier Ruiz Caldera", miniatura: "files/superlopez.png" },
  { titulo: "Jurassic Park", director: "Steven Spielberg",    miniatura: "files/jurassicpark.png" },
  { titulo: "Interstellar",  director: "Christopher Nolan",   miniatura: "files/interstellar.png" }
];

const loadMovies = () => {
  try { const raw = localStorage.getItem(STORAGE_KEY); return raw ? JSON.parse(raw) : []; }
  catch { return []; }
};
const saveMovies = (peliculas) => localStorage.setItem(STORAGE_KEY, JSON.stringify(peliculas));
const ensureInitialized = () => { if (!localStorage.getItem(STORAGE_KEY)) saveMovies(mis_peliculas_iniciales); };

// ==============================
// Estado de búsqueda TMDb
// ==============================
let tmdb_last_results = []; // guardamos el último array de resultados para usarlo en "Añadir"

// ==============================
// Helpers UI
// ==============================
const elMain = () => document.getElementById("main");
const sanitize = (s) => (s ?? "").toString();
const posterUrl = (poster_path) => poster_path ? `${TMDB.IMG_BASE}${poster_path}` : "files/placeholder.png";

const info = (msg) => `<div class="notice info">${msg}</div>`;
const warn = (msg) => `<div class="notice warn">${msg}</div>`;
const errorBox = (msg) => `<div class="notice error">${msg}</div>`;

// ==============================
// Vistas
// ==============================
const indexView = (peliculas) => {
  if (!peliculas || peliculas.length === 0) {
    return `
      <h2>Tu colección</h2>
      ${warn("No hay películas guardadas.")}
      <div class="actions center">
        <button class="new">Añadir</button>
        <button class="reset">Reset</button>
        <button class="open-search">Buscar en TMDb</button>
      </div>
    `;
  }

  const grid = peliculas.map((p, i) => `
    <div class="movie-card">
      <img class="show" data-my-id="${i}" src="${sanitize(p.miniatura)}" onerror="this.src='files/placeholder.png'"/>
      <h3>${sanitize(p.titulo) || "<em>Sin título</em>"}</h3>
      <p>${sanitize(p.director) || "<em>Sin director</em>"}</p>
      <div class="actions">
        <button class="show" data-my-id="${i}">ver</button>
        <button class="edit" data-my-id="${i}">editar</button>
        <button class="delete" data-my-id="${i}">borrar</button>
      </div>
    </div>
  `).join("");

  return `
    <h2>Tu colección</h2>
    <div class="movie-list">${grid}</div>
    <div class="actions center">
      <button class="new">Añadir</button>
      <button class="reset">Reset</button>
      <button class="open-search">Buscar en TMDb</button>
    </div>
  `;
};

const formTpl = (tituloForm, botonesHtml, values = {titulo:"", director:"", miniatura:""}) => `
  <div class="form-container">
    <h2>${tituloForm}</h2>
    <div class="field">
      <label>Título</label>
      <input type="text" id="titulo" value="${sanitize(values.titulo)}" placeholder="Título">
    </div>
    <div class="field">
      <label>Director</label>
      <input type="text" id="director" value="${sanitize(values.director)}" placeholder="Director">
    </div>
    <div class="field">
      <label>Miniatura</label>
      <input type="text" id="miniatura" value="${sanitize(values.miniatura)}" placeholder="URL de la miniatura">
    </div>
    <div class="actions">
      ${botonesHtml}
      <button class="index">Volver</button>
    </div>
  </div>
`;

const editView = (i, pelicula) =>
  formTpl("Editar Película", `<button class="update" data-my-id="${i}">Actualizar</button>`, pelicula);

const newView = () =>
  formTpl("Crear Película", `<button class="create">Crear</button>`);

const showView = (pelicula) => `
  <div class="form-container" style="max-width:560px">
    <h2>${sanitize(pelicula.titulo) || "<em>Sin título</em>"}</h2>
    <div class="poster-wrap">
      <img src="${sanitize(pelicula.miniatura)}" onerror="this.src='files/placeholder.png'" />
    </div>
    <p><strong>Director:</strong> ${sanitize(pelicula.director) || "<em>Sin director</em>"}</p>
    <div class="actions">
      <button class="index">Volver</button>
    </div>
  </div>
`;

const searchView = () => `
  <div class="form-container">
    <h2>Buscar en TMDb</h2>
    <div class="field">
      <label>Título de la película</label>
      <input type="text" id="q" placeholder="Ej: Inception, Matrix..." />
    </div>
    <div class="actions">
      <button class="search">Buscar</button>
      <button class="index">Volver</button>
    </div>
    <div id="results"></div>
  </div>
`;

const resultsView = (resultados) => {
  if (!resultados || resultados.length === 0) {
    return warn("No se encontraron resultados para tu búsqueda.");
  }

  const list = resultados.map((r, idx) => `
    <div class="movie-card">
      <img src="${posterUrl(r.poster_path)}" onerror="this.src='files/placeholder.png'"/>
      <h3>${sanitize(r.title)}</h3>
      <p>${r.release_date ? `Estreno: ${sanitize(r.release_date)}` : ""}</p>
      <p class="overview">${sanitize(r.overview) || "<em>Sin sinopsis</em>"}</p>
      <div class="actions">
        <button class="add-from-api" data-result-idx="${idx}">Añadir</button>
      </div>
    </div>
  `).join("");

  return `
    <h3>Resultados</h3>
    <div class="movie-list">${list}</div>
  `;
};

// ==============================
// Controladores
// ==============================
const initContr = () => { ensureInitialized(); indexContr(); };

const indexContr = () => {
  mis_peliculas = loadMovies();
  elMain().innerHTML = indexView(mis_peliculas);
};

const openSearchContr = () => {
  elMain().innerHTML = searchView();
  // foco en el buscador
  const q = document.getElementById("q");
  if (q) q.focus();
};

const showContr = (i) => {
  mis_peliculas = loadMovies();
  if (i >= 0 && i < mis_peliculas.length) {
    elMain().innerHTML = showView(mis_peliculas[i]);
  }
};

const newContr = () => {
  elMain().innerHTML = newView();
};

const createContr = () => {
  const titulo   = document.getElementById("titulo").value.trim();
  const director = document.getElementById("director").value.trim();
  const miniatura= document.getElementById("miniatura").value.trim();

  if (!titulo) {
    alert("El título es obligatorio.");
    return;
  }

  mis_peliculas = loadMovies();
  mis_peliculas.push({ titulo, director, miniatura });
  saveMovies(mis_peliculas);
  indexContr();
};

const editContr = (i) => {
  mis_peliculas = loadMovies();
  elMain().innerHTML = editView(i, mis_peliculas[i]);
};

const updateContr = (i) => {
  const titulo   = document.getElementById("titulo").value.trim();
  const director = document.getElementById("director").value.trim();
  const miniatura= document.getElementById("miniatura").value.trim();

  if (!titulo) {
    alert("El título es obligatorio.");
    return;
  }

  mis_peliculas = loadMovies();
  // Conservamos cualquier info adicional como tmdbId si existiera
  const previo = mis_peliculas[i] || {};
  mis_peliculas[i] = { ...previo, titulo, director, miniatura };
  saveMovies(mis_peliculas);
  indexContr();
};

const deleteContr = (i) => {
  if (confirm("¿Seguro que quieres borrar esta película?")) {
    mis_peliculas = loadMovies();
    mis_peliculas.splice(i, 1);
    saveMovies(mis_peliculas);
    indexContr();
  }
};

const resetContr = () => {
  if (confirm("¿Seguro que quieres restablecer la colección inicial?")) {
    localStorage.removeItem(STORAGE_KEY);
    mis_peliculas = [];
    ensureInitialized();
    indexContr();
  }
};

// -------- Búsqueda TMDb --------
const searchContr = async () => {
  const input = document.getElementById("q");
  const raw = input ? input.value : "";
  const query = raw.trim();

  const resultsNode = document.getElementById("results");
  if (!query) {
    if (resultsNode) resultsNode.innerHTML = warn("Introduce un término de búsqueda.");
    return;
  }

  try {
    if (resultsNode) resultsNode.innerHTML = info("Buscando en TMDb…");

    const url = `${TMDB.BASE}/search/movie?query=${encodeURIComponent(query)}&language=es-ES&include_adult=false`;
    const res = await fetch(url, TMDB.options());
    if (!res.ok) {
      throw new Error(`TMDb respondió ${res.status} ${res.statusText}`);
    }
    const data = await res.json();
    tmdb_last_results = Array.isArray(data.results) ? data.results : [];
    if (resultsNode) resultsNode.innerHTML = resultsView(tmdb_last_results);
  } catch (err) {
    if (resultsNode) resultsNode.innerHTML = errorBox(`Error al buscar: ${sanitize(err.message)}`);
  }
};

const addFromAPIContr = (idx) => {
  const btn = document.querySelector(`.add-from-api[data-result-idx="${idx}"]`);
  if (!tmdb_last_results || !tmdb_last_results[idx]) return;

  // Deshabilitar el botón mientras procesamos
  if (btn) {
    btn.disabled = true;
    btn.textContent = "Añadiendo…";
  }

  const r = tmdb_last_results[idx];

  // Construimos nuestro objeto local
  const pelicula = {
    titulo: r.title || "",
    director: "", // la búsqueda de TMDb no trae director; se podría ampliar consultando /movie/{id}/credits
    miniatura: posterUrl(r.poster_path),
    tmdbId: r.id
  };

  // Evitar duplicados por tmdbId o por título + miniatura
  mis_peliculas = loadMovies();
  const existe = mis_peliculas.some(p =>
    (p.tmdbId && p.tmdbId === pelicula.tmdbId) ||
    (p.titulo?.toLowerCase() === pelicula.titulo.toLowerCase() && p.miniatura === pelicula.miniatura)
  );

  if (existe) {
    alert("Esta película ya está en tu colección.");
  } else {
    mis_peliculas.push(pelicula);
    saveMovies(mis_peliculas);
    alert("Película añadida a tu colección.");
  }

  // Rehabilitar botón
  if (btn) {
    btn.disabled = false;
    btn.textContent = "Añadir";
  }
};

// ==============================
// Router de eventos
// ==============================
const matchEvent = (ev, sel) => ev.target.matches(sel);
const myId = (ev) => Number(ev.target.dataset.myId);

document.addEventListener("click", (ev) => {
  if      (matchEvent(ev, ".index"))        indexContr();
  else if (matchEvent(ev, ".open-search"))  openSearchContr();
  else if (matchEvent(ev, ".search"))       searchContr();
  else if (matchEvent(ev, ".show"))         showContr(myId(ev));
  else if (matchEvent(ev, ".edit"))         editContr(myId(ev));
  else if (matchEvent(ev, ".update"))       updateContr(myId(ev));
  else if (matchEvent(ev, ".new"))          newContr();
  else if (matchEvent(ev, ".create"))       createContr();
  else if (matchEvent(ev, ".delete"))       deleteContr(myId(ev));
  else if (matchEvent(ev, ".reset"))        resetContr();
  else if (matchEvent(ev, ".add-from-api")) addFromAPIContr(Number(ev.target.dataset.resultIdx));
});

// Buscar con Enter en el campo de texto
document.addEventListener("keydown", (ev) => {
  if (ev.key === "Enter") {
    const target = ev.target;
    if (target && target.id === "q") {
      ev.preventDefault();
      searchContr();
    }
  }
});

// Inicialización
document.addEventListener("DOMContentLoaded", initContr);
