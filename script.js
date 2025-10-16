// === Persistencia ===
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

// === Vistas ===
const indexView = (peliculas) => {
  if (peliculas.length === 0) {
    return `
      <p class="empty">No hay películas guardadas.</p>
      <div class="actions" style="width:100%; justify-content:center;">
        <button class="new">Añadir</button>
        <button class="reset">Reset</button>
      </div>
    `;
  }

  let view = peliculas.map((p, i) => `
    <div class="movie">
      <div class="movie-img">
        <img class="show" data-my-id="${i}" src="${p.miniatura}" onerror="this.src='files/placeholder.png'"/>
      </div>
      <div class="title">${p.titulo || "<em>Sin título</em>"}</div>
      <div class="actions">
        <button class="show" data-my-id="${i}">ver</button>
        <button class="edit" data-my-id="${i}">editar</button>
        <button class="delete" data-my-id="${i}">borrar</button>
      </div>
    </div>
  `).join("");

  view += `
    <div class="actions" style="width:100%; justify-content:center;">
      <button class="new">Añadir</button>
      <button class="reset">Reset</button>
    </div>
  `;
  return view;
};

const formTpl = (tituloForm, botonesHtml, values = {titulo:"", director:"", miniatura:""}) => `
  <div class="form-container">
    <h2>${tituloForm}</h2>
    <div class="field">
      <label>Título</label>
      <input type="text" id="titulo" value="${values.titulo || ""}" placeholder="Título">
    </div>
    <div class="field">
      <label>Director</label>
      <input type="text" id="director" value="${values.director || ""}" placeholder="Director">
    </div>
    <div class="field">
      <label>Miniatura</label>
      <input type="text" id="miniatura" value="${values.miniatura || ""}" placeholder="URL de la miniatura">
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
  <div class="form-container" style="width:360px">
    <h2>${pelicula.titulo || "<em>Sin título</em>"}</h2>
    <div style="display:flex; justify-content:center;">
      <img src="${pelicula.miniatura}" onerror="this.src='files/placeholder.png'" style="width:220px; height:330px; object-fit:cover; border-radius:6px;"/>
    </div>
    <p><strong>Director:</strong> ${pelicula.director || "<em>Sin director</em>"}</p>
    <div class="actions">
      <button class="index">Volver</button>
    </div>
  </div>
`;

// === Controladores ===
const initContr = () => { ensureInitialized(); indexContr(); };

const indexContr = () => {
  mis_peliculas = loadMovies();
  document.getElementById("main").innerHTML = indexView(mis_peliculas);
};

const showContr = (i) => {
  document.getElementById("main").innerHTML = showView(mis_peliculas[i]);
};

const newContr = () => {
  document.getElementById("main").innerHTML = newView();
};

const createContr = () => {
  const titulo   = document.getElementById("titulo").value.trim();
  const director = document.getElementById("director").value.trim();
  const miniatura= document.getElementById("miniatura").value.trim();

  mis_peliculas = loadMovies();
  mis_peliculas.push({ titulo, director, miniatura });
  saveMovies(mis_peliculas);
  indexContr();
};

const editContr = (i) => {
  document.getElementById("main").innerHTML = editView(i, mis_peliculas[i]);
};

const updateContr = (i) => {
  const titulo   = document.getElementById("titulo").value.trim();
  const director = document.getElementById("director").value.trim();
  const miniatura= document.getElementById("miniatura").value.trim();
  mis_peliculas = loadMovies();
  mis_peliculas[i] = { titulo, director, miniatura };
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
  if (confirm("¿Seguro que quieres borrar TODAS las películas?")) {
    localStorage.removeItem(STORAGE_KEY); // borra todo
    mis_peliculas = [];                   // limpia en memoria
    indexContr();                         // vista vacía
  }
};

// === Router de eventos ===
const matchEvent = (ev, sel) => ev.target.matches(sel);
const myId = (ev) => Number(ev.target.dataset.myId);

document.addEventListener("click", (ev) => {
  if      (matchEvent(ev, ".index"))  indexContr();
  else if (matchEvent(ev, ".show"))   showContr(myId(ev));
  else if (matchEvent(ev, ".edit"))   editContr(myId(ev));
  else if (matchEvent(ev, ".update")) updateContr(myId(ev));
  else if (matchEvent(ev, ".new"))    newContr();
  else if (matchEvent(ev, ".create")) createContr();
  else if (matchEvent(ev, ".delete")) deleteContr(myId(ev));
  else if (matchEvent(ev, ".reset"))  resetContr();
});

document.addEventListener("DOMContentLoaded", initContr);
