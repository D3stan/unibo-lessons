let currentDate = new Date();
let currentStartDate = formatDate(currentDate);
let currentEndDate = formatDate(currentDate);

let course = null;  // Parametro corso
let anno = 1;  // Parametro anno
let curriculum = null
function openDatePicker() {
    const datePicker = document.getElementById("date-picker");
    datePicker.style.display = "block";  // Mostra il calendario
    datePicker.showPicker();  // Apre direttamente il selettore di data
}
// Quando l'utente seleziona una data
document.getElementById("date-picker").addEventListener("change", function () {
    const selectedDate = new Date(this.value);
    if (!isNaN(selectedDate.getTime())) {  // Verifica che la data sia valida
        currentDate = selectedDate;
        currentStartDate = formatDate(selectedDate);
        currentEndDate = formatDate(selectedDate);
        // Aggiorna il titolo con la nuova data
        const dayName = getDayName(selectedDate);
        document.getElementById("selected-day").textContent = `Lezioni del ${dayName}, ${currentStartDate}`;
        // Ricarica le lezioni per la nuova data
        getLezioni(currentStartDate, currentEndDate);
    }
});
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
    defaultOption.disabled = true;  // Impedisce la selezione
    defaultOption.selected = true;  // Imposta questa opzione come predefinita
    defaultOption.textContent = "Seleziona un corso";
    courseSelect.appendChild(defaultOption);
    // Popola il menu con i corsi
    for (const [value, label] of Object.entries(coursesData)) {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        courseSelect.appendChild(option);
    }
    // Se c'è un corso salvato, selezionalo
    const savedCourse = localStorage.getItem('selectedCourse');
    if (savedCourse) {
        courseSelect.value = savedCourse;
    }
}
// Funzione che viene chiamata quando un corso viene selezionato
async function fetchCurricula() {
    const courseValue = document.getElementById("course").value;
    const curriculumContainer = document.getElementById("curriculum-container");
    // Se non è selezionato nessun corso, esci dalla funzione
    curriculum = null;
    if (!courseValue) return;
    // Pulisce il contenitore del curriculum (rimuove la select esistente)
    curriculumContainer.innerHTML = '';
    const url = `https://corsi.unibo.it/laurea/${courseValue}/orario-lezioni/@@available_curricula`;
    try {
        const response = await fetch(url);
        const curricula = await response.json();
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
    } catch (error) {
        console.error("Errore nel caricamento dei curricula:", error);
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
            console.log("Curriculum selezionato correttamente");
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
        return
    }
    // Costruzione dell'URL
    let url = `https://corsi.unibo.it/laurea/${course}/orario-lezioni/@@orario_reale_json?start=${startDate}&end=${endDate}&anno=${anno}`;
    // Se c'è un curriculum selezionato, aggiungilo all'URL
    try{
        if (curriculum) {
            url += `&curricula=${curriculum}`;
        }
    } catch (error) {
        console.log(error)
    }
    console.log(url)
    try {
        const response = await fetch(url);
        const lezioni = await response.json();
        const selectedDayElement = document.getElementById("selected-day");
        const dayName = getDayName(currentDate);
        selectedDayElement.textContent = `Lezioni del ${dayName}, ${startDate}`;
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
            const aula = lezione.aule[0]?.des_edificio || "Aula non disponibile";
            const lezioneDiv = document.createElement("div");
            lezioneDiv.classList.add("lezione");
            lezioneDiv.innerHTML = `
                <h2>${title}</h2>
                <p><strong>Orario:</strong> ${time}</p>
                <p class="aula"><strong>Aula:</strong> ${aula}</p>
            `;
            lezioniContainer.appendChild(lezioneDiv);
        });
    } catch (error) {
        document.getElementById("loader").style.display = "none";
        document.getElementById("lezioni-container").innerHTML = "<p class='error'>Errore nel recupero delle lezioni. Riprova più tardi.</p>";
    }
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
window.onload = function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    } else {
        document.body.classList.remove('dark-theme');
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
};
const themeToggleButton = document.getElementById('theme-toggle');
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
// Carica la preferenza del tema dall'archiviazione locale all'avvio della pagina
window.addEventListener('load', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleButton.textContent = 'Tema chiaro';  // Imposta il testo del pulsante su "Tema chiaro" quando il tema è scuro
    } else {
        themeToggleButton.textContent = 'Tema scuro';  // Imposta il testo del pulsante su "Tema scuro" quando il tema è chiaro
    }
});
function clearLocalStorage() {
    localStorage.removeItem('selectedCourse');
    localStorage.removeItem('selectedAnno');
    localStorage.removeItem('selectedCurriculum');
    let course = null;  // Parametro corso
    let anno = 1;  // Parametro anno
    let curriculum = null
    // Ricarica la pagina per riflettere i cambiamenti
    location.reload();
}

const coursesData = {
    "EconomiaAziendale": "Economia aziendale",
    "clei": "Economia dell'impresa",
    "EconomiaCommercio": "Economia e commercio",
    "EconomiaMercatiIstituzioni": "Economia, mercati e istituzioni",
    "clet": "Economics of tourism and cities",
    "ManagementMarketing": "Management e marketing",
    "Biotecnologie": "Biotecnologie",
    "ScienzeFarmaceutiche": "Scienze farmaceutiche applicate",
    "ConsulenteLavoroRelazioniAziendali": "Consulente del lavoro e delle relazioni aziendali",
    "GiuristaImpresa": "Giurista per le imprese e per la pubblica amministrazione",
    "ArchitetturaIngegneria": "Architettura-ingegneria",
    "MaterialiCompositiPolimerici": "Compositi polimerici",
    "DesignProdottoIndustriale": "Design del prodotto industriale",
    "IngegneriaAerospaziale": "Ingegneria aerospaziale",
    "IngegneriaBiomedica": "Ingegneria biomedica",
    "IngegneriaChimicaBiochimica": "Ingegneria chimica e biochimica",
    "IngegneriaCivile": "Ingegneria civile",
    "IngegneriaAutomazione": "Ingegneria dell'automazione",
    "elettrica": "Ingegneria dell'energia elettrica",
    "IngegneriaScienzeInformatiche": "Ingegneria e scienze informatiche",
    "IngegneriaElettronicaEnergiaInformazione": "Ingegneria elettronica",
    "ElettronicaTelecomunicazioni": "Ingegneria elettronica e telecomunicazioni",
    "IngegneriaEnergetica": "Ingegneria energetica",
    "IngegneriaGestionale": "Ingegneria gestionale",
    "IngegneriaInformatica": "Ingegneria informatica",
    "IngegneriaMeccanicaForli": "Ingegneria meccanica (Forli)",
    "IngegneriaMeccanica-Bologna": "Ingegneria meccanica (Bologna)",
    "IngegneriAmbienTerritorio": "Ingegneria per l'ambiente e il territorio",
    "meccatronica": "Meccatronica",
    "TecnicheEdiliziaTerritorio": "Tecniche per l'edilizia e il territorio",
    "TecnologieSistemiInformatici": "Tecnologie dei sistemi informatici",
    "LingueLetteratureStraniere": "Lingue e letterature straniere",
    "LingueTecnologieComunicazioneInterculturale": "Lingue e tecnologie per la comunicazione interculturale",
    "LingueMercatiCultureAsia": "Lingue, mercati e culture dell'asia e dell'africa mediterranea",
    "Dietistica": "Dietistica (abilitante alla professione sanitaria di dietista)",
    "EducazioneProfessionale": "Educazione professionale (abilitante alla professione sanitaria di educatore professionale)",
    "fisioterapia": "Fisioterapia (abilitante alla professione sanitaria di fisioterapista)",
    "IgieneDentale": "Igiene dentale (abilitante alla professione sanitaria di igienista dentale)",
    "Infermieristica": "Infermieristica (Bologna)",
    "Infermieristica-Ravenna": "Infermieristica (Ravenna)",
    "Infermieristica-Rimini": "Infermieristica (Rimini)",
    "Logopedia": "Logopedia (abilitante alla professione sanitaria di logopedista)",
    "ostetricia": "Ostetricia (abilitante alla professione sanitaria di ostetrica/o)",
    "Podologia": "Podologia (abilitante alla professione sanitaria di podologo)",
    "PrevenzioneAmbienteLavoro": "Tecniche della prevenzione nell'ambiente e nei luoghi di lavoro (abilitante alla professione sanitaria di tecnico della prevenzione nell'ambiente e nei luoghi di lavoro)",
    "tlb-bologna": "Tecniche di laboratorio biomedico (abilitante alla professione sanitaria di tecnico di laboratorio biomedico)",
    "Neurofisiopatologia": "Tecniche di neurofisiopatologia (abilitante alla professione sanitaria di tecnico di neurofisiopatologia)",
    "TecnicheRadiologiaMedica": "Tecniche di radiologia medica, per immagini e radioterapia (abilitante alla professione sanitaria di tecnico di radiologia medica)",
    "TecnicheOrtopediche": "Tecniche ortopediche (abilitante alla professione sanitaria di tecnico ortopedico)",
    "acquacoltura": "Acquacoltura e igiene delle produzioni ittiche",
    "ScienzeTecnichePsicologiche": "Scienze e tecniche psicologiche",
    "Astronomia": "Astronomia",
    "chimica": "Chimica e chimica dei materiali",
    "ChimicaAmbiente": "Chimica e tecnologie per l'ambiente e per i materiali (Ambiente)",
    "ChimicaMateriali": "Chimica e tecnologie per l'ambiente e per i materiali (Materiali)",
    "ChimicaIndustriale": "Chimica industriale",
    "fisica": "Fisica",
    "informatica": "Informatica",
    "InformaticaManagement": "Informatica per il management",
    "matematica": "Matematica",
    "MetodologieChimicheProdottiProcessi": "Metodologie chimiche per prodotti e processi",
    "ScienzaMateriali": "Scienza dei materiali",
    "ScienzeAmbientali": "Scienze ambientali",
    "ScienzeBiologiche": "Scienze biologiche",
    "ScienzeGeologiche": "Scienze geologiche",
    "ScienzeNaturali": "Scienze naturali",
    "ScienzeStatistiche": "Scienze statistiche",
    "EconomiaMarketingAgroIndustriale": "Economia e mercati agro-alimentari",
    "ProduzioniAnimali": "Produzioni animali",
    "ScienzeCulturaGastronomia": "Scienze e cultura della gastronomia",
    "verdepaesaggio": "Scienze e tecnologie per il verde e il paesaggio",
    "TecnologieAgrarie": "Tecnologie agrarie",
    "TecnologieAlimentari": "Tecnologie alimentari",
    "ScienzeTerritorioAmbiente": "Tecnologie per il territorio e l'ambiente agro-forestale",
    "ViticolturaEnologia": "Viticoltura ed enologia",
    "EducatoreServiziInfanzia": "Educatore nei servizi per l'infanzia",
    "EducatoreSocialeCulturaleBologna": "Educatore sociale e culturale (Bologna)",
    "EducatoreSocialeCulturale-Rimini": "Educatore sociale e culturale (Rimini)",
    "ScienzeFormazionePrimaria": "Scienze della formazione primaria",
    "ScienzeMotorieSportive": "Scienze delle attività motorie e sportive (Bologna)",
    "ScienzeMotorieSportive-Rimini": "Scienze delle attività motorie e sportive (Rimini)",
    "ScienzeInternazionaliDiplomatiche": "Scienze internazionali e diplomatiche",
    "ScienzePoliticheSocialiInternazionali": "Scienze politiche, sociali e internazionali",
    "SviluppoCooperazioneInternazionale": "Sviluppo e cooperazione internazionale",
    "StatisticaFinanzaAssicurazioni": "Statistica, finanza e assicurazioni",
    "ServizioSociale": "Servizio sociale",
    "SociologiaForli": "Sociologia",
    "ScienzeAntropologiche": "Antropologia, religioni, civiltà orientali",
    "BeniCulturali": "Beni culturali",
    "CulturePraticheModa": "Culture e pratiche della moda",
    "DAMS": "Dams - discipline delle arti, della musica e dello spettacolo",
    "Filosofia": "Filosofia",
    "lettere": "Lettere",
    "ScienzeComunicazione": "Scienze della comunicazione",
    "storia": "Storia"
};