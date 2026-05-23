const PROXY_URL = 'https://corsproxy.io/?';

/**
 * Searches for a teacher's personal university web page.
 * Uses a CORS proxy to query the official UniBo directory.
 */
export function cercaDocente(teacherName: string): Promise<string> {
  const targetUrl = `https://www.unibo.it/uniboweb/unibosearch/rubrica.aspx?tab=FullTextPanel&query=${encodeURIComponent(
    teacherName
  )}&tipo=people`;

  return fetch(PROXY_URL + encodeURIComponent(targetUrl))
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text();
    })
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Find the card/table containing teacher information
      const docenteInfo = doc.querySelector('table.contact.vcard');
      if (docenteInfo) {
        const webLinkElement = docenteInfo.querySelector('a.url');
        if (webLinkElement) {
          const link = webLinkElement.textContent?.trim();
          if (link) {
            return link;
          }
        }
        throw new Error("no_website");
      } else {
        throw new Error("teacher_not_found");
      }
    });
}

/**
 * Searches for the official syllabus page for a specific module code and teacher.
 * Uses a CORS proxy and dynamic academic year.
 */
export function trovaInsegnamento(
  codiceMateria: string,
  nomeDocente: string,
  academicYear: number
): Promise<string> {
  const targetUrl = `https://www.unibo.it/it/studiare/dottorati-master-specializzazioni-e-altra-formazione/insegnamenti?search=True&codiceMateria=${codiceMateria}&annoAccademico=${academicYear}&CodeInsegnamentoButton=cerca`;

  return fetch(PROXY_URL + encodeURIComponent(targetUrl))
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.text();
    })
    .then((html) => {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Find all main teaching cards
      const insegnamenti = doc.querySelectorAll('.mainteaching');
      let trovato = false;
      let insegnamentoLink = '';

      // Helper function to search recursively
      function cercaDocenteInsegnamento(insegnamento: Element): boolean {
        const docente = insegnamento.querySelector('.teacher');
        if (docente && docente.textContent?.trim() === nomeDocente) {
          const teachingLink = insegnamento.querySelector('.teachingname a') as HTMLAnchorElement | null;
          if (teachingLink) {
            insegnamentoLink = teachingLink.href;
            trovato = true;
            return true;
          }
        }

        // Search in sub-items
        const figli = insegnamento.querySelectorAll('ul > li');
        for (const figlio of Array.from(figli)) {
          if (cercaDocenteInsegnamento(figlio)) {
            return true;
          }

          // Search in grandchildren
          const nipoti = figlio.querySelectorAll('ul.alphabetlist > li');
          if (nipoti.length > 0) {
            const teachingLink = figlio.querySelector('.teachingname a') as HTMLAnchorElement | null;
            if (teachingLink) {
              insegnamentoLink = teachingLink.href;
              trovato = true;
              return true;
            }
          }
        }

        return false;
      }

      for (const insegnamento of Array.from(insegnamenti)) {
        if (cercaDocenteInsegnamento(insegnamento)) {
          break;
        }
      }

      if (trovato && insegnamentoLink) {
        return insegnamentoLink;
      } else {
        throw new Error("no_teaching_found");
      }
    });
}
