export default class UIManager {
    constructor(courseManager, scheduleManager, languageManager, themeManager) {
        this.courseManager = courseManager;
        this.scheduleManager = scheduleManager;
        this.languageManager = languageManager;
        this.themeManager = themeManager;

        this.currentDate = new Date();
        this.currentStartDate = this.formatDate(this.currentDate);
        this.currentEndDate = this.formatDate(this.currentDate);
        this.datePicker = null;
    }

    init() {
        this.datePicker = document.getElementById("date-picker");
        this.bindEvents();
        this.loadCourses();
        this.updateDynamicContent();

        const savedCurriculum = this.courseManager.getCurriculum();
        if (savedCurriculum) {
             document.getElementById("curriculum-container").style.display = "block"; // Assuming we will populate it later or it's handled by fetchCurricula flow
        }
    }

    bindEvents() {
        document.getElementById('language-toggle').addEventListener('click', () => {
            this.languageManager.toggleLanguage();
            this.updateDynamicContent();
        });

        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.themeManager.toggleTheme();
        });

        this.datePicker.addEventListener("change", (e) => {
            const selectedDate = new Date(e.target.value);
            if (!isNaN(selectedDate.getTime())) {
                this.currentDate = selectedDate;
                this.currentStartDate = this.formatDate(selectedDate);
                this.currentEndDate = this.formatDate(selectedDate);
                this.updateDynamicContent();
            }
        });

        // Calendar click
        document.getElementById("selected-day").addEventListener("click", () => {
             this.datePicker.style.display = "block";
             this.datePicker.showPicker();
        });

        // Navigation buttons
        document.getElementById("previous-day").addEventListener("click", () => this.changeDay(-1));
        document.getElementById("next-day").addEventListener("click", () => this.changeDay(1));

        // Course select change
        document.getElementById("course").addEventListener("change", () => this.handleCourseChange());

        // Curriculum container change (delegation or direct if select exists)
        document.getElementById("curriculum-container").addEventListener("change", (e) => {
             if(e.target.tagName === 'SELECT') {
                  this.updateAnnoSelect();
             }
        });

        // Popup buttons
        // Assuming global functions are gone, we need to bind these clicks in init or here.
        // We can expose methods or bind directly if elements exist.
        // For simplicity, let's assume we replace the onclick attributes in HTML with event listeners here
        // or we keep global functions that call this manager.
        // Better approach: remove onclick from HTML and bind here.

        // Settings Button
        const settingsBtn = document.querySelector('button[data-i18n="settings_button"]');
        if(settingsBtn) settingsBtn.addEventListener('click', () => this.openPopup());

        // Guide Button
        const guideBtn = document.querySelector('button[data-i18n="guide_button"]');
        if(guideBtn) guideBtn.addEventListener('click', () => this.openHelp());

        // OK Button in popup
        const okBtn = document.querySelector('#popup button[onclick="updateParams()"]');
        // Note: selector might be fragile if text content changes, better rely on ID or structure or remove onclick from HTML
        // I will replace onclick in HTML later, so I will bind by ID or relative position
        const popupButtons = document.querySelectorAll('#popup .button-container button');
        if (popupButtons.length >= 1) popupButtons[0].addEventListener('click', () => this.updateParams()); // OK
        if (popupButtons.length >= 2) popupButtons[1].addEventListener('click', () => this.clearLocalStorage()); // Reset

        // OK Button in Help
        const helpOkBtn = document.querySelector('#popup-help button');
        if (helpOkBtn) helpOkBtn.addEventListener('click', () => this.closeHelp());

        // Footer links
        // We can leave them as is or bind them
    }

    formatDate(date) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    getDayName(date) {
        const strings = this.languageManager.getStrings();
        const days = strings.days || ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        return days[date.getDay()];
    }

    loadCourses() {
        const courseSelect = document.getElementById("course");
        const coursesData = this.courseManager.getCourseData();
        const strings = this.languageManager.getStrings();

        courseSelect.innerHTML = ''; // Clear existing

        const defaultOption = document.createElement("option");
        defaultOption.value = "";
        defaultOption.disabled = true;
        defaultOption.selected = true;
        defaultOption.textContent = strings.select_course || "Seleziona un corso";
        courseSelect.appendChild(defaultOption);

        for (const [value, data] of Object.entries(coursesData)) {
            if (data.department) {
                const departmentOption = document.createElement("option");
                departmentOption.value = "";
                departmentOption.disabled = true;
                departmentOption.textContent = data.department;
                courseSelect.appendChild(departmentOption);
                continue;
            }
            const option = document.createElement("option");
            option.value = value;
            option.textContent = data.course_name;
            courseSelect.appendChild(option);
        }

        const savedCourse = this.courseManager.getCourse();
        if (savedCourse && coursesData[savedCourse]) {
            courseSelect.value = savedCourse;
        }
    }

    async handleCourseChange() {
        const courseSelect = document.getElementById("course");
        const selectedCourse = courseSelect.value;

        if (this.courseManager.setCourse(selectedCourse)) {
             this.updateAnnoSelect(); // Update years available
             await this.fetchCurricula();
        }
    }

    async fetchCurricula() {
        const curriculumContainer = document.getElementById("curriculum-container");
        curriculumContainer.innerHTML = '';

        const curricula = await this.courseManager.fetchCurricula();

        if (curricula && curricula.length > 1) {
            const curriculumSelect = document.createElement("select");
            curriculumSelect.id = "curriculum";
            curricula.forEach(c => {
                const option = document.createElement("option");
                option.value = c.value;
                const formattedLabel = c.label.charAt(0).toUpperCase() + c.label.slice(1).toLowerCase();
                option.textContent = formattedLabel;
                curriculumSelect.appendChild(option);
            });
            curriculumContainer.appendChild(curriculumSelect);
            curriculumContainer.style.display = "block";

            // Restore saved curriculum if matches
            const savedCurriculum = this.courseManager.getCurriculum();
            if (savedCurriculum) {
                 curriculumSelect.value = savedCurriculum;
            }
        } else {
            curriculumContainer.style.display = "none";
        }
    }

    updateAnnoSelect() {
        const annoSelect = document.getElementById("anno");
        const strings = this.languageManager.getStrings();
        const type = this.courseManager.getType();

        annoSelect.innerHTML = '';

        const defaultOption = document.createElement("option");
        defaultOption.value = 0;
        defaultOption.selected = true;
        defaultOption.disabled = true;
        defaultOption.textContent = strings.select_year || "Seleziona un anno";
        annoSelect.appendChild(defaultOption);

        if (!type) return;

        const isSingleCycle = type.trim().toLowerCase() === "singlecycle" || type.trim().toLowerCase() === "magistralecu";
        const maxYear = isSingleCycle ? 5 : 3;

        const yearTexts = [
            strings.first_year || "Primo",
            strings.second_year || "Secondo",
            strings.third_year || "Terzo",
            "Quarto",
            "Quinto"
        ];

        for (let i = 1; i <= maxYear; i++) {
            const option = document.createElement("option");
            option.value = i;
            option.textContent = `${yearTexts[i-1]}`;
            annoSelect.appendChild(option);
        }

        const savedAnno = this.courseManager.getAnno();
        if (savedAnno && savedAnno <= maxYear) {
             annoSelect.value = savedAnno;
        }
    }

    updateParams() {
        const newCourse = document.getElementById("course").value;
        const newAnno = document.getElementById("anno").value;
        const curriculumSelect = document.getElementById("curriculum");
        const curriculumValue = curriculumSelect ? curriculumSelect.value : null;

        if (newCourse && newAnno && newAnno != 0) {
            this.courseManager.setCourse(newCourse);
            this.courseManager.setAnno(newAnno);
            this.courseManager.setCurriculum(curriculumValue);

            this.updateDynamicContent();
            this.closePopup();
        }
    }

    changeDay(offset) {
        this.currentDate.setDate(this.currentDate.getDate() + offset);
        this.currentStartDate = this.formatDate(this.currentDate);
        this.currentEndDate = this.formatDate(this.currentDate);
        this.updateDynamicContent();
    }

    async updateDynamicContent() {
        const strings = this.languageManager.getStrings();
        const dayName = this.getDayName(this.currentDate);
        const selectedDayElement = document.getElementById("selected-day");
        selectedDayElement.textContent = `${strings.schedule_of} ${dayName} ${this.currentStartDate}`;

        // Re-render lessons
        await this.renderLezioni();
    }

    async renderLezioni() {
        const strings = this.languageManager.getStrings();
        const loader = document.getElementById("loader");
        const container = document.getElementById("lezioni-container");

        try {
            // Check if course is configured
            if (!this.courseManager.getCourse()) {
                container.innerHTML = `<p class='error'>${strings.configure_course || "Configura il tuo corso dalle impostazioni"}</p>`;
                return;
            }

            loader.style.display = "block";
            const lezioni = await this.scheduleManager.getLezioni(this.currentStartDate, this.currentEndDate);
            loader.style.display = "none";

            if (lezioni.length === 0) {
                container.innerHTML = `<p class='warn'>${strings.no_lessons || "Nessuna lezione disponibile"}</p>`;
                return;
            }

            container.innerHTML = '';
            lezioni.forEach(lezione => {
                const title = lezione.title || (strings.title_unavailable || "Titolo non disponibile");
                const time = lezione.time || (strings.time_unavailable || "Orario non disponibile");
                const teacher = lezione.docente || (strings.teacher_unavailable || "Docente non disponibile");
                const aula = lezione.aule[0]?.des_edificio || (strings.classroom_unavailable || "Aula non disponibile");
                const teachingCode = lezione.cod_modulo;
                const teamsUrl = lezione.teams ? lezione.teams : null;
                const lezioneDiv = document.createElement("div");

                lezioneDiv.classList.add("lezione");
                lezioneDiv.innerHTML = `
                    <h2>${title}</h2>
                    <p><strong>${strings.time_label || "Orario:"}</strong> ${time}</p>
                    <p id="docente"><strong>${strings.teacher_label || "Docente:"} </strong>${teacher}</p>
                    <p class="aula"><strong>${strings.classroom_label || "Aula:"}</strong> ${aula}</p>
                    ${teamsUrl ? `<p class="teams" style="color: blue; text-decoration: underline; cursor: pointer;"><strong>${strings.virtual_classroom || "Aula Virtuale"}</strong></p>` : ''}
                `;

                if (teamsUrl) {
                    const teamsElement = lezioneDiv.querySelector(".teams");
                    teamsElement.addEventListener("click", () => {
                        window.open(teamsUrl, "_blank");
                    });
                }

                lezioneDiv.querySelector("h2").addEventListener("click", () => {
                    this.scheduleManager.trovaInsegnamento(teachingCode.split('_')[0], teacher)
                        .then(link => window.location.href = link)
                        .catch(error => alert(error.message));
                });

                lezioneDiv.querySelector("p#docente").addEventListener("click", () => {
                    this.scheduleManager.cercaDocente(teacher)
                        .then(link => window.location.href = link)
                        .catch(error => alert(error.message));
                });

                container.appendChild(lezioneDiv);
            });

        } catch (error) {
            loader.style.display = "none";
            if (error.message === "NO_COURSE_CONFIGURED") {
                container.innerHTML = `<p class='error'>${strings.configure_course || "Configura il tuo corso dalle impostazioni"}</p>`;
            } else {
                container.innerHTML = `<p class='error'>${strings.error_loading || "Errore nel recupero delle lezioni. Riprova più tardi."}</p>`;
            }
        }
    }

    openPopup() {
        document.getElementById("popup").style.display = "flex";
        // Ensure state is synced
        this.loadCourses();
        this.updateAnnoSelect();
        this.fetchCurricula(); // Refresh available curricula if course changed externally? Unlikely but good practice
    }

    closePopup() {
        document.getElementById("popup").style.display = "none";
    }

    openHelp() {
        document.getElementById("popup-help").style.display = "flex";
    }

    closeHelp() {
        document.getElementById("popup-help").style.display = "none";
    }

    clearLocalStorage() {
        this.courseManager.reset();
        location.reload();
    }
}
