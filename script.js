// MODELO DE DATOS

// API Key de TMDb
const TMDB_API_KEY = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiIzOTgxNWVjZTI4ZjcyNWJlZGRmY2Y3OGE0YzRjZGU0ZiIsIm5iZiI6MTc2MDQ1NjUxNS4xNDcsInN1YiI6IjY4ZWU2ZjQzNDYzMzQ0Yjg0MTlkZjQ3MCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.ejdXz4pm0dZn0OAVJvJ16R8SwNAa-MBkO_yttUiblLk';

let mis_peliculas_iniciales = [
    {titulo: "Superlópez",   director: "Javier Ruiz Caldera", "miniatura": "files/superlopez.png"},
    {titulo: "Jurassic Park", director: "Steven Spielberg", "miniatura": "files/jurassicpark.png"},
    {titulo: "Interstellar",  director: "Christopher Nolan", "miniatura": "files/interstellar.png"}
];

let mis_peliculas = [];

// Guardar y leer películas usando solo localStorage
const postAPI = async (peliculas) => {
    localStorage.setItem('mis_peliculas', JSON.stringify(peliculas));
    return true;
}
const getAPI = async () => {
    const pelis = localStorage.getItem('mis_peliculas');
    if (!pelis) return [];
    try {
        return JSON.parse(pelis);
    } catch {
        return [];
    }
}
const updateAPI = async (peliculas) => {
    localStorage.setItem('mis_peliculas', JSON.stringify(peliculas));
    return true;
}

// VISTAS

const indexView = (peliculas) => {
    let i=0;
    let view = "";

    if (peliculas.length === 0) {
        view += `<div style='color:#888; margin:20px 0;'>No hay películas</div>`;
    }

    while(i < peliculas.length) {
        view += `
        <div class="movie">
             <div class="movie-img">
                <img src="${peliculas[i].miniatura}" onerror="this.src='files/placeholder.png'"/>
             </div>
             <div class="title">
                     ${peliculas[i].titulo || "<em>Sin título</em>"}
             </div>
             <div class="actions">
                     <button class="show" data-my-id="${i}">ver</button>
                     <button class="edit" data-my-id="${i}">editar</button>
                     <button class="delete" data-my-id="${i}">borrar</button>
                </div>
        </div>\n`;
        i = i + 1;
    }

    return view;
}

const editView = (i, pelicula) => {
    return `
    <div class="modal-bg">
      <div class="modal">
        <h2>Editar Película</h2>
        <div class="field" style="width:100%; margin-bottom:10px;">
            Título <br>
            <input type="text" id="titulo" placeholder="Título" value="${pelicula.titulo}" style="width:100%;">
        </div>
        <div class="field" style="width:100%; margin-bottom:10px;">
            Director <br>
            <input type="text" id="director" placeholder="Director" value="${pelicula.director}" style="width:100%;">
        </div>
        <div class="field" style="width:100%; margin-bottom:10px;">
            Miniatura <br>
            <input type="text" id="miniatura" placeholder="URL de la miniatura" value="${pelicula.miniatura}" style="width:100%;">
        </div>
        <div class="actions" style="width:100%; display:flex; justify-content:center; gap:10px;">
            <button class="update" data-my-id="${i}">Actualizar</button>
            <button class="index">Volver</button>
        </div>
      </div>
    </div>`;
}

const showView = (pelicula) => {
    return `
    <div class="modal-bg">
        <div class="modal">
            <h2 style="margin-bottom:15px;">${pelicula.titulo || "<em>Sin título</em>"}</h2>
            <img src="${pelicula.miniatura}" onerror="this.src='files/placeholder.png'" />
            <p><strong>Director:</strong> ${pelicula.director || "<em>Sin director</em>"}</p>
            ${pelicula.rating ? `<p><strong>Calificación:</strong> ${pelicula.rating} / 10</p>` : ''}
            ${pelicula.generos && pelicula.generos.length > 0 ? `<p><strong>Géneros:</strong> ${pelicula.generos.join(', ')}</p>` : ''}
            ${pelicula.resumen ? `<p style='margin:10px 0; color:var(--secondary-text); font-size:13px;'><strong>Resumen:</strong> ${pelicula.resumen}</p>` : ''}
            <div class="actions">
                ${(pelicula.id ? `<button class="keywords" data-movie-id="${pelicula.id}">Palabras clave</button>` : '')}
                <button class="index">Volver</button>
            </div>
        </div>
    </div>`;
}

const newView = () => {
    return `
    <div class="modal-bg">
      <div class="modal">
        <h2>Crear Película</h2>
        <div class="field">
            Título <br>
            <input type="text" id="titulo" placeholder="Título">
        </div>
        <div class="field">
            Director <br>
            <input type="text" id="director" placeholder="Director">
        </div>
        <div class="field">
            Miniatura <br>
            <input type="text" id="miniatura" placeholder="URL de la miniatura">
        </div>
        <div class="actions">
            <button class="create">Crear</button>
            <button class="index">Volver</button>
        </div>
      </div>
    </div>`;
}

// VISTA DE BÚSQUEDA MODIFICADA
const searchView = () => {
    return `
    <div class="modal-bg">
      <div class="modal">
        <h2>Buscar en TMDb</h2>
        <div class="field">
            Término de búsqueda <br>
            <input type="text" id="search-query" placeholder="Ej: Alien">
        </div>
        <div class="actions">
            <button class="search">Buscar Película</button>
            <button class="search-keyword-btn">Buscar Keyword</button>
            <button class="index">Volver</button>
        </div>
      </div>
    </div>`;
}

// Nueva vista para mostrar resultados de keywords
const keywordSearchResultsView = (keywords, query) => {
    let html = `
    <div class="modal-bg">
        <div class="modal">
            <h2>Keywords encontradas para: "${query}"</h2>
            <p style="font-size:12px; margin-bottom:15px;">Selecciona una keyword para ver películas relacionadas</p>
            <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin: 20px 0;">
                ${keywords.length > 0 
                    ? keywords.map(kw => `<button class="keyword-tag search-by-keyword" data-keyword-id="${kw.id}" data-keyword-name="${kw.name}">${kw.name}</button>`).join('')
                    : '<p>No se encontraron coincidencias.</p>'}
            </div>
            <div class="actions">
                <button class="search-view">Volver a buscar</button>
                <button class="index">Volver al inicio</button>
            </div>
        </div>
    </div>`;
    return html;
}

const resultsView = (resultados, tituloPagina = "Resultados de la búsqueda") => {
    let view = `
    <div style="width: 100%; padding: 20px;">
        <h2 style="text-align: center; color: var(--primary);">${tituloPagina}</h2>`;
    
    if (!resultados || resultados.length === 0) {
        view += `<div style='color:#888; margin:20px 0; text-align: center;'>No se encontraron películas</div>`;
    } else {
        view += `<div style="display: flex; flex-wrap: wrap; gap: 16px; justify-content: center;">`;
        resultados.forEach(pelicula => {
            const posterUrl = pelicula.poster_path 
                ? `https://image.tmdb.org/t/p/w500${pelicula.poster_path}`
                : 'files/placeholder.png';
            const releaseYear = pelicula.release_date ? pelicula.release_date.split('-')[0] : 'N/A';
            
            view += `
            <div class="movie">
                <div class="movie-img">
                    <img src="${posterUrl}" onerror="this.src='files/placeholder.png'"/>
                </div>
                <div class="title">${pelicula.title || "<em>Sin título</em>"}</div>
                <p style="font-size: 11px; margin: 5px 0; color: var(--secondary-text);">Año: ${releaseYear}</p>
                <div class="actions">
                    <button class="add-from-api" data-movie='${JSON.stringify(pelicula).replace(/'/g, "&apos;")}'>Añadir</button>
                    <button class="keywords" data-movie-id="${pelicula.id}">Palabras clave</button>
                </div>
            </div>`;
        });
        view += `</div>`;
    }
    
    view += `
        <div style="text-align: center; margin-top: 20px;">
            <button class="index">Volver al inicio</button>
        </div>
    </div>`;
    
    return view;
}

// CONTROLADORES 

const initContr = async () => {
    if (!localStorage.getItem('mis_peliculas')) {
        await postAPI(mis_peliculas_iniciales);
    }
    indexContr();
}

const indexContr = async () => {
    let pelis = await getAPI();
    if (!Array.isArray(pelis)) pelis = [];
    if (typeof pelis === 'object' && pelis !== null && Object.keys(pelis).length === 0) pelis = [];
    mis_peliculas = pelis;
    document.getElementById('main').innerHTML = indexView(mis_peliculas);
}

const showContr = (i) => {
    document.getElementById('main').innerHTML = showView(mis_peliculas[i]);
}

const newContr = () => {
    document.getElementById('main').innerHTML = newView();
}

const createContr = async () => {
    const titulo = document.getElementById('titulo').value;
    const director = document.getElementById('director').value;
    const miniatura = document.getElementById('miniatura').value;
    mis_peliculas.push({titulo, director, miniatura});
    await updateAPI(mis_peliculas);
    indexContr();
}

const editContr = (i) => {
    document.getElementById('main').innerHTML = editView(i,  mis_peliculas[i]);
}

const updateContr = async (i) => {
    mis_peliculas[i].titulo   = document.getElementById('titulo').value;
    mis_peliculas[i].director = document.getElementById('director').value;
    mis_peliculas[i].miniatura = document.getElementById('miniatura').value;
    await updateAPI(mis_peliculas);
    indexContr();
}

const deleteContr = async (i) => {
    if (confirm("¿Seguro que quieres borrar esta película?")) {
        mis_peliculas.splice(i, 1);
        await updateAPI(mis_peliculas);
        indexContr();
    }
}

const resetContr = async () => {
    if (confirm("¿Seguro que quieres eliminar todas las películas?")) {
        await updateAPI([]);
        indexContr();
    }
}

const searchViewContr = () => {
    document.getElementById('main').innerHTML = searchView();
}

const searchContr = async () => {
    const query = document.getElementById('search-query').value.trim();
    
    if (!query) {
        alert('Por favor, ingresa un término de búsqueda');
        return;
    }

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_API_KEY}`
        }
    };

    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&language=es-ES`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.results) {
            document.getElementById('main').innerHTML = resultsView(data.results);
        } else {
            alert('No se encontraron resultados');
        }
    } catch (err) {
        console.error(err);
        alert('Error al buscar películas. Por favor, intenta de nuevo.');
    }
}

// NUEVO: Controlador para buscar Keywords
const searchKeywordContr = async () => {
    const query = document.getElementById('search-query').value.trim();
    
    if (!query) {
        alert('Por favor, ingresa un término para buscar palabras clave');
        return;
    }

    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_API_KEY}`
        }
    };

    try {
        const response = await fetch(`https://api.themoviedb.org/3/search/keyword?query=${encodeURIComponent(query)}&page=1`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Mostramos las keywords encontradas usando una vista específica
        document.getElementById('main').innerHTML = keywordSearchResultsView(data.results, query);
        
    } catch (err) {
        console.error(err);
        alert('Error al buscar palabras clave.');
    }
}

const addFromAPIContr = async (ev) => {
    try {
        const movieData = JSON.parse(ev.target.dataset.movie.replace(/&apos;/g, "'"));
        const posterUrl = movieData.poster_path 
            ? `https://image.tmdb.org/t/p/w500${movieData.poster_path}`
            : 'files/placeholder.png';

        const yaExiste = mis_peliculas.some(p => p.titulo === movieData.title);
        if (yaExiste) {
            alert('Esta película ya está en tu lista');
            return;
        }

        let director = 'Desconocido';
        try {
            const options = {
                method: 'GET',
                headers: {
                    accept: 'application/json',
                    Authorization: `Bearer ${TMDB_API_KEY}`
                }
            };
            const creditsRes = await fetch(`https://api.themoviedb.org/3/movie/${movieData.id}/credits?language=es-ES`, options);
            if (creditsRes.ok) {
                const creditsData = await creditsRes.json();
                if (creditsData.crew && Array.isArray(creditsData.crew)) {
                    const directorObj = creditsData.crew.find(persona => persona.job === 'Director');
                    if (directorObj) {
                        director = directorObj.name;
                    }
                }
            }
        } catch (err) {
            console.warn('No se pudo obtener el director:', err);
        }

        const GENRE_MAP = {
            28: 'Acción', 12: 'Aventura', 16: 'Animación', 35: 'Comedia', 80: 'Crimen', 99: 'Documental',
            18: 'Drama', 10751: 'Familiar', 14: 'Fantasía', 36: 'Historia', 27: 'Terror', 10402: 'Música',
            9648: 'Misterio', 10749: 'Romance', 878: 'Ciencia ficción', 10770: 'Película de TV',
            53: 'Suspense', 10752: 'Bélica', 37: 'Western'
        };

        let generos = [];
        if (Array.isArray(movieData.genre_ids) && movieData.genre_ids.length > 0) {
            generos = movieData.genre_ids.map(id => GENRE_MAP[id] || id);
        } else if (movieData.genres) {
            generos = movieData.genres.map(g => g.name);
        }
        const rating = typeof movieData.vote_average === 'number' ? movieData.vote_average : '';

        const nuevaPelicula = {
            id: movieData.id,
            titulo: movieData.title,
            director: director,
            miniatura: posterUrl,
            resumen: movieData.overview || '',
            rating: rating,
            generos: generos
        };

        mis_peliculas.push(nuevaPelicula);
        await updateAPI(mis_peliculas);

        alert(`"${movieData.title}" ha sido añadida a tu lista`);
        indexContr();
    } catch (err) {
        console.error('Error al añadir película:', err);
        alert('Error al añadir la película. Por favor, intenta de nuevo.');
    }
}

const keywordsView = async (movieId) => {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_API_KEY}`
        }
    };
    
    try {
        const response = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/keywords`, options);
        if (!response.ok) throw new Error('Error al obtener palabras clave');
        
        const data = await response.json();
        const keywords = data.keywords || [];
        
        let html = `
        <div class="modal-bg">
            <div class="modal">
                <h2>Palabras Clave</h2>
                <p style="font-size:12px; margin-bottom:15px;">Haz clic en una etiqueta para ver películas similares</p>
                <div style="display:flex; flex-wrap:wrap; gap:8px; justify-content:center; margin: 20px 0;">
                    ${keywords.length > 0 
                        ? keywords.map(kw => `<button class="keyword-tag search-by-keyword" data-keyword-id="${kw.id}" data-keyword-name="${kw.name}">${kw.name}</button>`).join('')
                        : '<p>No hay palabras clave disponibles.</p>'}
                </div>
                <div class="actions">
                    <button class="index">Volver</button>
                </div>
            </div>
        </div>`;
        
        document.getElementById('main').innerHTML = html;
    } catch (err) {
        console.error(err);
        alert('No se pudieron cargar las palabras clave.');
    }
}

const searchByKeywordContr = async (keywordId, keywordName) => {
    const options = {
        method: 'GET',
        headers: {
            accept: 'application/json',
            Authorization: `Bearer ${TMDB_API_KEY}`
        }
    };

    try {
        const response = await fetch(`https://api.themoviedb.org/3/discover/movie?with_keywords=${keywordId}&language=es-ES&sort_by=popularity.desc`, options);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        document.getElementById('main').innerHTML = resultsView(data.results, `Películas sobre: "${keywordName}"`);
        
    } catch (err) {
        console.error(err);
        alert('Error al buscar películas por palabra clave.');
    }
}

const addKeywordToList = (kw) => { console.log("Añadir palabra clave:", kw); }
const myKeywordsView = () => { console.log("Ver mis palabras clave"); }
const removeKeywordFromList = (kw) => { console.log("Eliminar palabra clave:", kw); }


// ROUTER de eventos
const matchEvent = (ev, sel) => ev.target.matches(sel)
const myId = (ev) => Number(ev.target.dataset.myId)

document.addEventListener('click', ev => {
    if      (matchEvent(ev, '.index'))        indexContr       ();
    else if (matchEvent(ev, '.edit'))         editContr        (myId(ev));
    else if (matchEvent(ev, '.update'))       updateContr      (myId(ev));
    else if (matchEvent(ev, '.show'))         showContr        (myId(ev));
    else if (matchEvent(ev, '.new'))          newContr         ();
    else if (matchEvent(ev, '.create'))       createContr      ();
    else if (matchEvent(ev, '.delete'))       deleteContr      (myId(ev));
    else if (matchEvent(ev, '.reset'))        resetContr       ();
    else if (matchEvent(ev, '.search-view'))  searchViewContr  ();
    else if (matchEvent(ev, '.search'))       searchContr      ();
    else if (matchEvent(ev, '.search-keyword-btn')) searchKeywordContr(); // NUEVO BOTÓN
    else if (matchEvent(ev, '.add-from-api')) addFromAPIContr  (ev);
    else if (matchEvent(ev, '.keywords')) {
        const movieId = ev.target.dataset.movieId;
        if (movieId) keywordsView(movieId);
    }
    else if (matchEvent(ev, '.search-by-keyword')) {
        const kwId = ev.target.dataset.keywordId;
        const kwName = ev.target.dataset.keywordName;
        if (kwId) searchByKeywordContr(kwId, kwName);
    }
    else if (matchEvent(ev, '.add-keyword')) {
        const kw = ev.target.dataset.keyword;
        if (kw) addKeywordToList(kw);
    }
    else if (matchEvent(ev, '.my-keywords')) {
        myKeywordsView();
    }
    else if (matchEvent(ev, '.remove-keyword')) {
        const kw = ev.target.dataset.keyword;
        if (kw) removeKeywordFromList(kw);
    }
})

document.addEventListener('keypress', ev => {
    if (ev.key === 'Enter' && ev.target.id === 'search-query') {
        // Por defecto hace búsqueda normal al dar Enter, 
        // pero el usuario puede hacer clic en el botón de keyword si prefiere
        searchContr();
    }
})

// Inicialización        
document.addEventListener('DOMContentLoaded', initContr);