let currentDate = new Date();
let currentStartDate = formatDate(currentDate);
let currentEndDate = formatDate(currentDate);

let datePicker

let type = null;
let course = null;  // Parametro corso
let anno = 1;  // Parametro anno
let curriculum = null

window.addEventListener('load', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleButton.textContent = 'Tema chiaro';  // Imposta il testo del pulsante su "Tema chiaro" quando il tema è scuro
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleButton.textContent = 'Tema scuro';  // Imposta il testo del pulsante su "Tema scuro" quando il tema è chiaro
    }
    const savedCourse = localStorage.getItem('selectedCourse');
    const savedAnno = localStorage.getItem('selectedAnno');
    const savedCurriculum = localStorage.getItem('selectedCurriculum')!="null" ? localStorage.getItem('selectedCurriculum') : null;
    // Se ci sono parametri salvati, applicali
    if (savedCourse) {
        course = savedCourse;
        document.getElementById("course").value = savedCourse;
    }
    if (savedAnno) {
        anno = parseInt(savedAnno);
        document.getElementById("anno").value = savedAnno;
    }
    if (savedCurriculum) {
        curriculum = savedCurriculum;
    }
    loadCourses(); // Carica i corsi al caricamento della pagina
    getLezioni(currentStartDate, currentEndDate);


    datePicker = document.getElementById("date-picker");
    // Quando l'utente seleziona una data
    datePicker.addEventListener("change", function () {
        const selectedDate = new Date(this.value);
        if (!isNaN(selectedDate.getTime())) {  // Verifica che la data sia valida
            currentDate = selectedDate;
            currentStartDate = formatDate(selectedDate);
            currentEndDate = formatDate(selectedDate);
            // Aggiorna il titolo con la nuova data
            const dayName = getDayName(selectedDate);
            document.getElementById("selected-day").textContent = `Lezioni del ${dayName} ${currentStartDate}`;
            // Ricarica le lezioni per la nuova data
            getLezioni(currentStartDate, currentEndDate);
        }
    });

    
    // Funzione per cambiare il tema
    themeToggleButton.addEventListener('click', () => {
        // Cambia la classe del body tra dark-mode e la modalità predefinita
        document.body.classList.toggle('dark-mode');

        // Cambia il testo del pulsante
        if (document.body.classList.contains('dark-mode')) {
            themeToggleButton.textContent = 'Tema chiaro';  // Quando il tema è scuro, cambia il testo a "Tema chiaro"
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggleButton.textContent = 'Tema scuro';  // Quando il tema è chiaro, cambia il testo a "Tema scuro"
            localStorage.setItem('theme', 'light');
        }
    });
});

function openDatePicker() {
    datePicker.style.display = "block";  // Mostra il calendario
    datePicker.showPicker();  // Apre direttamente il selettore di data
}

function getDayName(date) {
    const days = ["Domenica", "Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"];
    return days[date.getDay()];
}
function formatDate(date) {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
}
// Popola il menu a tendina dei corsi
function loadCourses() {
    const courseSelect = document.getElementById("course");

    // Aggiungi un'opzione vuota di default
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = "Seleziona un corso";
    courseSelect.appendChild(defaultOption);

    // Popola il menu con i corsi
    for (const [value, data] of Object.entries(coursesData)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = data.course_name; // Accede al nome del corso
        courseSelect.appendChild(option);
    }

    // Se c'è un corso salvato, selezionalo
    const savedCourse = localStorage.getItem('selectedCourse');
    if (savedCourse && coursesData[savedCourse]) {
        courseSelect.value = savedCourse;
        type = coursesData[savedCourse].type; // Memorizza il tipo
    }

    // Aggiungi un listener per salvare il corso selezionato e il suo tipo
    courseSelect.addEventListener("change", function () {
        const selectedValue = courseSelect.value;
        if (coursesData[selectedValue]) {
            type = coursesData[selectedValue].type;
            localStorage.setItem('selectedCourse', selectedValue);
            localStorage.setItem('type', type);
        }
    });
}
function handleCourseChange() {
    // Ottieni il corso selezionato
    const courseSelect = document.getElementById("course");
    const selectedCourse = courseSelect.value;

    // Verifica se è stato selezionato un corso valido
    if (selectedCourse && coursesData[selectedCourse]) {
        // Recupera il tipo di corso
        type = coursesData[selectedCourse].type;
        // Aggiorna la selezione degli anni
        updateAnnoSelect();

        // Memorizza il corso e il tipo nel localStorage
        localStorage.setItem('selectedCourse', selectedCourse);
        localStorage.setItem('selectedCourseType', type);
    }
    fetchCurricula()
}

// Funzione che viene chiamata quando un corso viene selezionato
async function fetchCurricula() {
    const courseValue = document.getElementById("course").value;
    const curriculumContainer = document.getElementById("curriculum-container");
    
    // Se non è selezionato nessun corso, esci dalla funzione
    if (!courseValue) return;

    // Pulisce il contenitore del curriculum (rimuove la select esistente)
    curriculumContainer.innerHTML = '';
    
    // Definiamo gli URL da tentare
    const urls = [
        `https://corsi.unibo.it/${type}/${courseValue}/orario-lezioni/@@available_curricula`,
        `https://corsi.unibo.it/${type}/${courseValue}/timetable/@@available_curricula`
    ];

    let curricula = null;

    // Proviamo entrambi gli URL, partendo dal primo
    for (let url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                curricula = await response.json();
                break; // Se la risposta è ok, esci dal ciclo
            }
        } catch (error) {}
    }
    // Se curricula è ancora null, significa che entrambi gli URL hanno fallito
    if (curricula === null) {
        console.error("Errore nel caricamento dei curricula da entrambi gli URL.");
        return;
    }

    // Se ci sono più di un curriculum, crea un nuovo menu a tendina
    if (curricula.length > 1) {
        const curriculumSelect = document.createElement("select");
        curriculumSelect.id = "curriculum";
        curricula.forEach(curriculum => {
            const option = document.createElement("option");
            option.value = curriculum.value;
            // Modifica il label per avere la prima lettera maiuscola e il resto minuscolo
            const formattedLabel = curriculum.label.charAt(0).toUpperCase() + curriculum.label.slice(1).toLowerCase();
            option.textContent = formattedLabel;
            curriculumSelect.appendChild(option);
        });
        curriculumContainer.appendChild(curriculumSelect);
        curriculumContainer.style.display = "block"; // Rendi visibile il contenitore
    } else if (curricula.length === 1) {
        // Se c'è solo un curriculum, lo nascondiamo
        curriculumContainer.style.display = "none"; // Nascondiamo la select
    } else {
        // Se non ci sono curricula, non mostrare la select
        curriculumContainer.style.display = "none"; // Nascondiamo il contenitore
    }
}

function updateAnnoSelect() {
    const annoSelect = document.getElementById("anno");

    // Rimuove tutte le opzioni attuali (tranne la prima)
    annoSelect.innerHTML = '';
    
    // Aggiungi l'opzione di default
    const defaultOption = document.createElement("option");
    defaultOption.value = 0;
    defaultOption.selected = true;
    defaultOption.disabled = true;
    defaultOption.textContent = "Seleziona un anno";
    annoSelect.appendChild(defaultOption);

    // Controlla il tipo di corso
    const isSingleCycle = type.trim().toLowerCase() === "singlecycle" || type.trim().toLowerCase() === "magistralecu";
    console.log(isSingleCycle)
    // Aggiungi le opzioni degli anni in base al tipo di corso
    const maxYear = isSingleCycle ? 5 : 3;
    for (let i = 1; i <= maxYear; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `Anno ${i}`;
        annoSelect.appendChild(option);
    }
}
// Funzione per aggiornare i parametri e ricaricare le lezioni
function updateParams() {
    const newCourse = document.getElementById("course").value;
    const newAnno = document.getElementById("anno").value;
    const curriculumValue = document.getElementById("curriculum") ? document.getElementById("curriculum").value : null;
    if (newCourse && newAnno && newAnno!=0) {
        course = newCourse;
        anno = parseInt(newAnno);
        // Se è selezionato un curriculum, puoi usarlo per aggiornare la URL o altri parametri
        if (curriculumValue) {
            curriculum=curriculumValue  
        }
        // Salvataggio dei parametri nel localStorage
        localStorage.setItem('selectedCourse', course);
        localStorage.setItem('selectedAnno', anno);
        localStorage.setItem('selectedCurriculum', curriculum);
        getLezioni(currentStartDate, currentEndDate);
        closePopup();
    }
}
// Funzione per caricare le lezioni
async function getLezioni(startDate, endDate) {
    if(!course){
        document.getElementById("loader").style.display = "none";
        document.getElementById("lezioni-container").innerHTML = "<p class='error'>Configura il tuo corso dalle impostazioni</p>";
        return;
    }

    // Costruzione degli URL
    let urls = [
        `https://corsi.unibo.it/${type}/${course}/orario-lezioni/@@orario_reale_json?start=${startDate}&end=${endDate}&anno=${anno}`,
        `https://corsi.unibo.it/${type}/${course}/timetable/@@orario_reale_json?start=${startDate}&end=${endDate}&anno=${anno}`
    ];

    // Aggiungi il curriculum se è presente
    try {
        if (curriculum) {
            urls = urls.map(url => url + `&curricula=${curriculum}`);
        }
    } catch (error) {
        console.log(error);
    }

    let lezioni = null;

    // Proviamo entrambi gli URL
    for (let url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                lezioni = await response.json();
                break; // Se la risposta è ok, esci dal ciclo
            }
        } catch (error) {}
    }

    // Se lezioni è ancora null, significa che entrambi gli URL hanno fallito
    if (lezioni === null) {
        document.getElementById("loader").style.display = "none";
        document.getElementById("lezioni-container").innerHTML = "<p class='error'>Errore nel recupero delle lezioni. Riprova più tardi.</p>";
        return;
    }

    const selectedDayElement = document.getElementById("selected-day");
    const dayName = getDayName(currentDate);
    selectedDayElement.textContent = `Lezioni del ${dayName} ${startDate}`;
    document.getElementById("loader").style.display = "none";
    const lezioniContainer = document.getElementById("lezioni-container");

    if (lezioni.length === 0) {
        lezioniContainer.innerHTML = "<p class='error'>Nessuna lezione trovata per questa data.</p>";
        return;
    }

    lezioniContainer.innerHTML = '';
    lezioni.forEach(lezione => {
        const title = lezione.title || "Titolo non disponibile";
        const time = lezione.time || "Orario non disponibile";
        const teacher = lezione.docente || "Docente non disponibile";
        const aula = lezione.aule[0]?.des_edificio || "Aula non disponibile";
        const teachingCode = lezione.cod_modulo;
        const teamsUrl = lezione.teams ? lezione.teams : null;
        const lezioneDiv = document.createElement("div");

        // Crea il div della lezione senza il link subito
        lezioneDiv.classList.add("lezione");
        lezioneDiv.innerHTML = `
            <h2>${title}</h2>
            <p><strong>Orario:</strong> ${time}</p>
            <p id="docente"><strong>Docente: </strong>${teacher}</p>
            <p class="aula"><strong>Aula:</strong> ${aula}</p>
            ${teamsUrl ? `<p class="teams" style="color: blue; text-decoration: underline; cursor: pointer;"><strong>Aula Virtuale</strong></p>` : ''}
        `;
        
        // Se esiste un link a Teams, aggiunge l'evento per aprire il link al click
        if (teamsUrl) {
            const teamsElement = lezioneDiv.querySelector(".teams");
            teamsElement.addEventListener("click", () => {
                window.open(teamsUrl, "_blank"); // Apre il link in una nuova scheda
            });
        }

        // Aggiungi l'evento click sul titolo per ottenere il link
        lezioneDiv.querySelector("h2").addEventListener("click", function() {
            trovaInsegnamento(teachingCode.split('_')[0], teacher)
                .then(link => {
                    console.log("Link trovato:", link);

                    // Redireziona l'utente al link trovato
                    window.location.href = link;
                })
                .catch(error => {
                    console.log(error.message);
                    // Eventuale gestione dell'errore se non trovato
                    alert("Insegnamento non trovato.");
                });
        });

        lezioneDiv.querySelector("p#docente").addEventListener("click", function() {
            cercaDocente(teacher)
                .then(link => {
                    console.log("Link trovato:", link);

                    // Redireziona l'utente al link trovato
                    window.location.href = link;
                })
                .catch(error => {
                    console.log(error.message);
                    // Eventuale gestione dell'errore se non trovato
                    alert("Docente non trovato.");
                });
        });

        // Aggiungi il div della lezione nel container
        lezioniContainer.appendChild(lezioneDiv);
    });
}

// Funzione per cambiare il giorno
function changeDay(offset) {
    currentDate.setDate(currentDate.getDate() + offset);
    currentStartDate = formatDate(currentDate);
    currentEndDate = formatDate(currentDate);
    getLezioni(currentStartDate, currentEndDate);
}
// Funzione per gestire il popup
function openPopup() {
    document.getElementById("popup").style.display = "flex";
}
function closePopup() {
    document.getElementById("popup").style.display = "none";
}


function clearLocalStorage() {
    localStorage.removeItem('selectedCourse');
    localStorage.removeItem('selectedAnno');
    localStorage.removeItem('selectedCurriculum');
    // Ricarica la pagina per riflettere i cambiamenti
    location.reload();
}

function trovaInsegnamento(codiceMateria, nomeDocente) {
    // Usa il proxy di CORS Proxy
    var proxyUrl = 'https://corsproxy.io/?';
    var targetUrl = `https://www.unibo.it/it/studiare/dottorati-master-specializzazioni-e-altra-formazione/insegnamenti?search=True&codiceMateria=${codiceMateria}&annoAccademico=2024&CodeInsegnamentoButton=cerca`;

    // Codifica l'URL di destinazione per evitare errori con caratteri speciali
    var encodedUrl = encodeURIComponent(targetUrl);

    // Esegui la richiesta HTTP attraverso CORS Proxy
    return fetch(proxyUrl + encodedUrl)
        .then(response => response.text())  // Ottieni la risposta come testo (HTML)
        .then(html => {
            // Crea un elemento temporaneo per fare il parsing dell'HTML
            var doc = new DOMParser().parseFromString(html, 'text/html');

            // Trova tutti gli elementi con la classe "mainteaching"
            var insegnamenti = doc.querySelectorAll('.mainteaching');
            var trovato = false;
            var insegnamentoLink = "";

            // Funzione ricorsiva per cercare in insegnamenti, figli e nipoti
            function cercaDocenteInsegnamento(insegnamento) {
                // Trova il docente nel nodo corrente
                var docente = insegnamento.querySelector('.teacher');
                if (docente && docente.textContent.trim() === nomeDocente) {
                    // Trova il link dell'insegnamento principale
                    var teachingLink = insegnamento.querySelector('.teachingname a');
                    if (teachingLink) {
                        insegnamentoLink = teachingLink.href;
                        trovato = true;
                        return true;  // Fermiamo la ricerca una volta trovato
                    }
                }

                // Cerca nei figli (ul all'interno di insegnamento)
                var figli = insegnamento.querySelectorAll('ul > li');
                for (let figlio of figli) {
                    if (cercaDocenteInsegnamento(figlio)) {
                        return true;
                    }

                    // Cerca nei "nipoti" (ul con la classe "alphabetlist" dentro il figlio)
                    var nipoti = figlio.querySelectorAll('ul.alphabetlist > li');
                    for (let nipote of nipoti) {
                        // Quando troviamo un nipote, risaliamo al figlio (insegnamento principale)
                        var teachingLink = figlio.querySelector('.teachingname a');
                        if (teachingLink) {
                            insegnamentoLink = teachingLink.href;
                            trovato = true;
                            return true;
                        }
                    }
                }

                return false;
            }

            // Cerca tra gli insegnamenti principali
            for (let insegnamento of insegnamenti) {
                if (cercaDocenteInsegnamento(insegnamento)) {
                    break; // Esci dal ciclo se il docente è stato trovato
                }
            }

            // Restituisci il link dell'insegnamento trovato, altrimenti restituisci un messaggio
            if (trovato) {
                return insegnamentoLink;
            } else {
                throw new Error("Nessun insegnamento trovato per il docente specificato.");
            }
        })
        .catch(error => {
            console.error(error);
            throw new Error("Si è verificato un errore durante la ricerca.");
        });
}

function cercaDocente(docenteNome) {
    const corsProxy = "https://corsproxy.io/?";  // CORS Proxy che bypassa il blocco CORS
    const url = `https://www.unibo.it/uniboweb/unibosearch/rubrica.aspx?tab=FullTextPanel&query=${encodeURIComponent(docenteNome)}&tipo=people`;

    return new Promise((resolve, reject) => {  // Restituiamo una Promise
        fetch(corsProxy + url)
            .then(response => response.text())
            .then(html => {
                // Creiamo un oggetto DOM per poterlo scorrere
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Troviamo la riga contenente l'URL del docente
                const docenteInfo = doc.querySelector('table.contact.vcard');
                if (docenteInfo) {
                    const webLinkElement = docenteInfo.querySelector('a.url');
                    if (webLinkElement) {
                        console.log(webLinkElement)
                        const docenteWebLink = webLinkElement.textContent.trim();
                        resolve(docenteWebLink);  // Risolviamo la Promise con il link
                    } else {
                        reject("Il docente non ha un sito web disponibile.");
                    }
                } else {
                    reject("Docente non trovato.");
                }
            })
            .catch(error => {
                reject("Errore nel recupero dei dati: " + error);
            });
    });
}
