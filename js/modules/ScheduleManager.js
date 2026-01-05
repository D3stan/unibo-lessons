export default class ScheduleManager {
    constructor(courseManager, languageManager) {
        this.courseManager = courseManager;
        this.languageManager = languageManager;
    }

    async getLezioni(startDate, endDate) {
        const course = this.courseManager.getCourse();
        const type = this.courseManager.getType();
        const anno = this.courseManager.getAnno();
        const curriculum = this.courseManager.getCurriculum();

        if (!course) {
            throw new Error("NO_COURSE_CONFIGURED");
        }

        let urls = [
            `https://corsi.unibo.it/${type}/${course}/orario-lezioni/@@orario_reale_json?start=${startDate}&end=${endDate}&anno=${anno}`,
            `https://corsi.unibo.it/${type}/${course}/timetable/@@orario_reale_json?start=${startDate}&end=${endDate}&anno=${anno}`
        ];

        if (curriculum) {
            urls = urls.map(url => url + `&curricula=${curriculum}`);
        }

        let lezioni = null;

        for (let url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    lezioni = await response.json();
                    break;
                }
            } catch (error) {}
        }

        if (lezioni === null) {
            throw new Error("FETCH_ERROR");
        }

        return lezioni;
    }

    async trovaInsegnamento(codiceMateria, nomeDocente) {
        const strings = this.languageManager.getStrings();
        var proxyUrl = 'https://corsproxy.io/?';
        var targetUrl = `https://www.unibo.it/it/studiare/dottorati-master-specializzazioni-e-altra-formazione/insegnamenti?search=True&codiceMateria=${codiceMateria}&annoAccademico=2024&CodeInsegnamentoButton=cerca`;

        var encodedUrl = encodeURIComponent(targetUrl);

        try {
            const response = await fetch(proxyUrl + encodedUrl);
            const html = await response.text();

            var doc = new DOMParser().parseFromString(html, 'text/html');
            var insegnamenti = doc.querySelectorAll('.mainteaching');
            var insegnamentoLink = "";
            let trovato = false;

            function cercaDocenteInsegnamento(insegnamento) {
                var docente = insegnamento.querySelector('.teacher');
                if (docente && docente.textContent.trim() === nomeDocente) {
                    var teachingLink = insegnamento.querySelector('.teachingname a');
                    if (teachingLink) {
                        insegnamentoLink = teachingLink.href;
                        trovato = true;
                        return true;
                    }
                }

                var figli = insegnamento.querySelectorAll('ul > li');
                for (let figlio of figli) {
                    if (cercaDocenteInsegnamento(figlio)) {
                        return true;
                    }

                    var nipoti = figlio.querySelectorAll('ul.alphabetlist > li');
                    for (let nipote of nipoti) {
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

            for (let insegnamento of insegnamenti) {
                if (cercaDocenteInsegnamento(insegnamento)) {
                    break;
                }
            }

            if (trovato) {
                return insegnamentoLink;
            } else {
                throw new Error(strings.no_teaching_found || "Nessun insegnamento trovato per il docente specificato.");
            }
        } catch (error) {
            console.error(error);
            throw new Error(strings.error_searching || "Si è verificato un errore durante la ricerca.");
        }
    }

    async cercaDocente(docenteNome) {
        const strings = this.languageManager.getStrings();
        const corsProxy = "https://corsproxy.io/?";
        const url = `https://www.unibo.it/uniboweb/unibosearch/rubrica.aspx?tab=FullTextPanel&query=${encodeURIComponent(docenteNome)}&tipo=people`;

        try {
            const response = await fetch(corsProxy + url);
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const docenteInfo = doc.querySelector('table.contact.vcard');
            if (docenteInfo) {
                const webLinkElement = docenteInfo.querySelector('a.url');
                if (webLinkElement) {
                    return webLinkElement.textContent.trim();
                } else {
                    throw new Error(strings.no_website || "Il docente non ha un sito web disponibile.");
                }
            } else {
                throw new Error(strings.teacher_not_found || "Docente non trovato.");
            }
        } catch (error) {
            throw new Error(strings.error_searching + " " + error || "Errore nel recupero dei dati: " + error);
        }
    }
}
