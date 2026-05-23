const PROXY_URL = 'https://corsproxy.io/?';

/**
 * Searches for a teacher's personal university web page.
 * Uses a CORS proxy to query the official UniBo directory.
 */
export function cercaDocente(teacherName: string): Promise<string> {
  // Single-encode the query parameters
  const targetUrl = `https://www.unibo.it/uniboweb/unibosearch/rubrica.aspx?tab=FullTextPanel&query=${encodeURIComponent(
    teacherName
  )}&tipo=people`;

  // Fetch using the proxy directly without outer double-encoding
  return fetch(PROXY_URL + targetUrl)
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
  // Use the updated redirected teaching search URL for direct speed and reliability
  const targetUrl = `https://www.unibo.it/it/studiare/insegnamenti-competenze-trasversali-moocs/insegnamenti?search=True&codiceMateria=${codiceMateria}&annoAccademico=${academicYear}&CodeInsegnamentoButton=cerca`;

  // Fetch using the proxy directly without outer double-encoding
  return fetch(PROXY_URL + targetUrl)
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

      for (const insegnamento of Array.from(insegnamenti)) {
        // Find all teachers mentioned in this card (both main teachers and sub-teachers)
        const teachers = Array.from(insegnamento.querySelectorAll('.teacher')).map(
          (t) => t.textContent?.trim()
        );

        // If the teacher name matches any teacher in this module card, return the main teaching's syllabus link
        if (teachers.includes(nomeDocente)) {
          const teachingLink = insegnamento.querySelector('.teachingname a') as HTMLAnchorElement | null;
          if (teachingLink && teachingLink.href) {
            return teachingLink.href;
          }
        }
      }

      throw new Error("no_teaching_found");
    });
}
