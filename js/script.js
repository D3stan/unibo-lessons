let currentDate = new Date();
let currentStartDate = formatDate(currentDate);
let currentEndDate = formatDate(currentDate);

let datePicker

let type = null;
let course = null;  // Course parameter
let anno = 1;  // Year parameter
let curriculum = null

window.addEventListener('load', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeToggleButton.textContent = 'Tema chiaro';  // Set button text to "Light theme" when theme is dark
    } else {
        document.body.classList.remove('dark-mode');
        themeToggleButton.textContent = 'Tema scuro';  // Set button text to "Dark theme" when theme is light
    }
    const savedCourse = localStorage.getItem('selectedCourse');
    const savedAnno = localStorage.getItem('selectedAnno');
    const savedCurriculum = localStorage.getItem('selectedCurriculum')!="null" ? localStorage.getItem('selectedCurriculum') : null;
    // If there are saved parameters, apply them
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
    loadCourses(); // Load courses when page loads
    getLezioni(currentStartDate, currentEndDate);


    datePicker = document.getElementById("date-picker");
    // When user selects a date
    datePicker.addEventListener("change", function () {
        const selectedDate = new Date(this.value);
        if (!isNaN(selectedDate.getTime())) {  // Verify that date is valid
            currentDate = selectedDate;
            currentStartDate = formatDate(selectedDate);
            currentEndDate = formatDate(selectedDate);
            // Update title with new date
            const dayName = getDayName(selectedDate);
            document.getElementById("selected-day").textContent = `Lezioni del ${dayName} ${currentStartDate}`;
            // Reload classes for the new date
            getLezioni(currentStartDate, currentEndDate);
        }
    });

    
    // Function to change theme
    themeToggleButton.addEventListener('click', () => {
        // Toggle body class between dark-mode and default mode
        document.body.classList.toggle('dark-mode');

        // Change button text
        if (document.body.classList.contains('dark-mode')) {
            themeToggleButton.textContent = 'Tema chiaro';  // When theme is dark, change text to "Light theme"
            localStorage.setItem('theme', 'dark');
        } else {
            themeToggleButton.textContent = 'Tema scuro';  // When theme is light, change text to "Dark theme"
            localStorage.setItem('theme', 'light');
        }
    });
});

function openDatePicker() {
    datePicker.style.display = "block";  // Show calendar
    datePicker.showPicker();  // Directly open date picker
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
// Populate course dropdown menu
function loadCourses() {
    const courseSelect = document.getElementById("course");

    // Add an empty default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.disabled = true;
    defaultOption.selected = true;
    defaultOption.textContent = "Seleziona un corso";
    courseSelect.appendChild(defaultOption);

    // Populate menu with courses
    for (const [value, data] of Object.entries(coursesData)) {
        if (data.department) {
            const departmentOption = document.createElement("option");
            departmentOption.value = "";  // Value can be empty since it's just a label
            departmentOption.disabled = true;  // Disable entry to make it not clickable
            departmentOption.textContent = data.department;  // Set text of entry to department name
            courseSelect.appendChild(departmentOption);
            continue; // Skip the next part that creates another empty option
        }
        const option = document.createElement("option");
        option.value = value;
        option.textContent = data.course_name; // Access course name
        courseSelect.appendChild(option);
    }

    // If there's a saved course, select it
    const savedCourse = localStorage.getItem('selectedCourse');
    if (savedCourse && coursesData[savedCourse]) {
        courseSelect.value = savedCourse;
        type = coursesData[savedCourse].type; // Store type
    }

    // Add listener to save selected course and its type
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
    // Get selected course
    const courseSelect = document.getElementById("course");
    const selectedCourse = courseSelect.value;

    // Check if a valid course has been selected
    if (selectedCourse && coursesData[selectedCourse]) {
        // Retrieve course type
        type = coursesData[selectedCourse].type;
        // Update year selection
        updateAnnoSelect();

        // Store course and type in localStorage
        localStorage.setItem('selectedCourse', selectedCourse);
        localStorage.setItem('selectedCourseType', type);
    }
    fetchCurricula()
}

// Function called when a course is selected
async function fetchCurricula() {
    const courseValue = document.getElementById("course").value;
    const curriculumContainer = document.getElementById("curriculum-container");
    
    // If no course is selected, exit function
    if (!courseValue) return;

    // Clear curriculum container (remove existing select)
    curriculumContainer.innerHTML = '';
    
    // Define URLs to try
    const urls = [
        `https://corsi.unibo.it/${type}/${courseValue}/orario-lezioni/@@available_curricula`,
        `https://corsi.unibo.it/${type}/${courseValue}/timetable/@@available_curricula`
    ];

    let curricula = null;

    // Try both URLs, starting with the first
    for (let url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                curricula = await response.json();
                break; // If response is ok, exit loop
            }
        } catch (error) {}
    }
    // If curricula is still null, both URLs failed
    if (curricula === null) {
        console.error("Error loading curricula from both URLs.");
        return;
    }

    // If there's more than one curriculum, create a new dropdown
    if (curricula.length > 1) {
        const curriculumSelect = document.createElement("select");
        curriculumSelect.id = "curriculum";
        curricula.forEach(curriculum => {
            const option = document.createElement("option");
            option.value = curriculum.value;
            // Modify label to have first letter uppercase and rest lowercase
            const formattedLabel = curriculum.label.charAt(0).toUpperCase() + curriculum.label.slice(1).toLowerCase();
            option.textContent = formattedLabel;
            curriculumSelect.appendChild(option);
        });
        curriculumContainer.appendChild(curriculumSelect);
        curriculumContainer.style.display = "block"; // Make container visible
    } else if (curricula.length === 1) {
        // If there's only one curriculum, hide it
        curriculumContainer.style.display = "none"; // Hide select
    } else {
        // If there are no curricula, don't show select
        curriculumContainer.style.display = "none"; // Hide container
    }
}

function updateAnnoSelect() {
    const annoSelect = document.getElementById("anno");

    // Remove all current options (except first)
    annoSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement("option");
    defaultOption.value = 0;
    defaultOption.selected = true;
    defaultOption.disabled = true;
    defaultOption.textContent = "Seleziona un anno";
    annoSelect.appendChild(defaultOption);

    // Check course type
    const isSingleCycle = type.trim().toLowerCase() === "singlecycle" || type.trim().toLowerCase() === "magistralecu";
    // Add year options based on course type
    const maxYear = isSingleCycle ? 5 : 3;
    for (let i = 1; i <= maxYear; i++) {
        const option = document.createElement("option");
        option.value = i;
        option.textContent = `Anno ${i}`;
        annoSelect.appendChild(option);
    }
}
// Function to update parameters and reload classes
function updateParams() {
    const newCourse = document.getElementById("course").value;
    const newAnno = document.getElementById("anno").value;
    const curriculumValue = document.getElementById("curriculum") ? document.getElementById("curriculum").value : null;
    if (newCourse && newAnno && newAnno!=0) {
        course = newCourse;
        anno = parseInt(newAnno);
        // If a curriculum is selected, use it to update URL or other parameters
        if (curriculumValue) {
            curriculum=curriculumValue  
        }
        // Save parameters in localStorage
        localStorage.setItem('selectedCourse', course);
        localStorage.setItem('selectedAnno', anno);
        localStorage.setItem('selectedCurriculum', curriculum);
        getLezioni(currentStartDate, currentEndDate);
        closePopup();
    }
}
// Function to load classes
async function getLezioni(startDate, endDate) {
    if(!course){
        document.getElementById("loader").style.display = "none";
        document.getElementById("lezioni-container").innerHTML = "<p class='error'>Configura il tuo corso dalle impostazioni</p>";
        return;
    }

    // URL construction
    let urls = [
        `https://corsi.unibo.it/${type}/${course}/orario-lezioni/@@orario_reale_json?start=${startDate}&end=${endDate}&anno=${anno}`,
        `https://corsi.unibo.it/${type}/${course}/timetable/@@orario_reale_json?start=${startDate}&end=${endDate}&anno=${anno}`
    ];

    // Add curriculum if present
    try {
        if (curriculum) {
            urls = urls.map(url => url + `&curricula=${curriculum}`);
        }
    } catch (error) {
        console.log(error);
    }

    let lezioni = null;

    // Try both URLs
    for (let url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                lezioni = await response.json();
                break; // If response is ok, exit loop
            }
        } catch (error) {}
    }

    // If lezioni is still null, both URLs failed
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
        lezioniContainer.innerHTML = "<p class='warn'>Nessuna lezione disponibile</p>";
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

        // Create lesson div without link immediately
        lezioneDiv.classList.add("lezione");
        lezioneDiv.innerHTML = `
            <h2>${title}</h2>
            <p><strong>Orario:</strong> ${time}</p>
            <p id="docente"><strong>Docente: </strong>${teacher}</p>
            <p class="aula"><strong>Aula:</strong> ${aula}</p>
            ${teamsUrl ? `<p class="teams" style="color: blue; text-decoration: underline; cursor: pointer;"><strong>Aula Virtuale</strong></p>` : ''}
        `;
        
        // If Teams link exists, add event to open link on click
        if (teamsUrl) {
            const teamsElement = lezioneDiv.querySelector(".teams");
            teamsElement.addEventListener("click", () => {
                window.open(teamsUrl, "_blank"); // Open link in new tab
            });
        }

        // Add click event on title to get link
        lezioneDiv.querySelector("h2").addEventListener("click", function() {
            trovaInsegnamento(teachingCode.split('_')[0], teacher)
                .then(link => {
                    console.log("Link found:", link);

                    // Redirect user to found link
                    window.location.href = link;
                })
                .catch(error => {
                    console.log(error.message);
                    // Error handling if not found
                    alert("Insegnamento non trovato.");
                });
        });

        lezioneDiv.querySelector("p#docente").addEventListener("click", function() {
            cercaDocente(teacher)
                .then(link => {
                    console.log("Link found:", link);

                    // Redirect user to found link
                    window.location.href = link;
                })
                .catch(error => {
                    console.log(error.message);
                    // Error handling if not found
                    alert("Docente non trovato.");
                });
        });

        // Add lesson div to container
        lezioniContainer.appendChild(lezioneDiv);
    });
}

// Function to change day
function changeDay(offset) {
    currentDate.setDate(currentDate.getDate() + offset);
    currentStartDate = formatDate(currentDate);
    currentEndDate = formatDate(currentDate);
    getLezioni(currentStartDate, currentEndDate);
}
// Function to handle popup
function openPopup() {
    document.getElementById("popup").style.display = "flex";
}
function closePopup() {
    document.getElementById("popup").style.display = "none";
}

// Function to handle help popup
function openHelp() {
    document.getElementById("popup-help").style.display = "flex";
}
function closeHelp() {
    document.getElementById("popup-help").style.display = "none";
}

function clearLocalStorage() {
    localStorage.removeItem('selectedCourse');
    localStorage.removeItem('selectedAnno');
    localStorage.removeItem('selectedCurriculum');
    // Reload page to reflect changes
    location.reload();
}

function trovaInsegnamento(codiceMateria, nomeDocente) {
    // Use CORS Proxy
    var proxyUrl = 'https://corsproxy.io/?';
    var targetUrl = `https://www.unibo.it/it/studiare/dottorati-master-specializzazioni-e-altra-formazione/insegnamenti?search=True&codiceMateria=${codiceMateria}&annoAccademico=2024&CodeInsegnamentoButton=cerca`;

    // Encode destination URL to avoid errors with special characters
    var encodedUrl = encodeURIComponent(targetUrl);

    // Execute HTTP request through CORS Proxy
    return fetch(proxyUrl + encodedUrl)
        .then(response => response.text())  // Get response as text (HTML)
        .then(html => {
            // Create temporary element to parse HTML
            var doc = new DOMParser().parseFromString(html, 'text/html');

            // Find all elements with class "mainteaching"
            var insegnamenti = doc.querySelectorAll('.mainteaching');
            var trovato = false;
            var insegnamentoLink = "";

            // Recursive function to search in teachings, children and grandchildren
            function cercaDocenteInsegnamento(insegnamento) {
                // Find teacher in current node
                var docente = insegnamento.querySelector('.teacher');
                if (docente && docente.textContent.trim() === nomeDocente) {
                    // Find main teaching link
                    var teachingLink = insegnamento.querySelector('.teachingname a');
                    if (teachingLink) {
                        insegnamentoLink = teachingLink.href;
                        trovato = true;
                        return true;  // Stop search once found
                    }
                }

                // Search in children (ul inside insegnamento)
                var figli = insegnamento.querySelectorAll('ul > li');
                for (let figlio of figli) {
                    if (cercaDocenteInsegnamento(figlio)) {
                        return true;
                    }

                    // Search in "grandchildren" (ul with class "alphabetlist" inside child)
                    var nipoti = figlio.querySelectorAll('ul.alphabetlist > li');
                    for (let nipote of nipoti) {
                        // When we find a grandchild, go up to child (main teaching)
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

            // Search among main teachings
            for (let insegnamento of insegnamenti) {
                if (cercaDocenteInsegnamento(insegnamento)) {
                    break; // Exit loop if teacher was found
                }
            }

            // Return found teaching link, otherwise return a message
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
    const corsProxy = "https://corsproxy.io/?";  // CORS Proxy to bypass CORS block
    const url = `https://www.unibo.it/uniboweb/unibosearch/rubrica.aspx?tab=FullTextPanel&query=${encodeURIComponent(docenteNome)}&tipo=people`;

    return new Promise((resolve, reject) => {  // Return a Promise
        fetch(corsProxy + url)
            .then(response => response.text())
            .then(html => {
                // Create DOM object to parse
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Find row containing teacher URL
                const docenteInfo = doc.querySelector('table.contact.vcard');
                if (docenteInfo) {
                    const webLinkElement = docenteInfo.querySelector('a.url');
                    if (webLinkElement) {
                        console.log(webLinkElement)
                        const docenteWebLink = webLinkElement.textContent.trim();
                        resolve(docenteWebLink);  // Resolve Promise with link
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
