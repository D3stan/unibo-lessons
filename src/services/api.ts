export interface Curriculum {
  value: string;
  label: string;
}

export interface Lesson {
  title?: string;
  time?: string;
  docente?: string;
  cod_modulo?: string;
  teams?: string | null;
  aule: Array<{
    des_edificio?: string;
  }>;
}

/**
 * Helper to fetch with fallback across multiple URLs.
 */
async function fetchWithFallback<T>(urls: string[]): Promise<T> {
  let lastError: Error | null = null;

  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return await response.json() as T;
      }
      lastError = new Error(`HTTP status ${response.status}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }
  }

  throw lastError || new Error("Fetch failed on all fallback endpoints");
}

/**
 * Fetches the available curricula for a given course.
 */
export async function fetchCurricula(type: string, course: string): Promise<Curriculum[]> {
  const sanitizedType = type.trim();
  const sanitizedCourse = course.trim();

  const urls = [
    `https://corsi.unibo.it/${sanitizedType}/${sanitizedCourse}/orario-lezioni/@@available_curricula`,
    `https://corsi.unibo.it/${sanitizedType}/${sanitizedCourse}/timetable/@@available_curricula`
  ];

  try {
    return await fetchWithFallback<Curriculum[]>(urls);
  } catch (error) {
    console.error("Failed to load curricula:", error);
    return []; // Return empty array on failure as some courses have no curricula
  }
}

/**
 * Fetches scheduled lessons for a course, year, and date range.
 */
export async function fetchLessons(
  type: string,
  course: string,
  year: number,
  startDate: string,
  endDate: string,
  curriculum: string | null
): Promise<Lesson[]> {
  const sanitizedType = type.trim();
  const sanitizedCourse = course.trim();

  let urls = [
    `https://corsi.unibo.it/${sanitizedType}/${sanitizedCourse}/orario-lezioni/@@orario_reale_json?start=${startDate}&end=${endDate}&anno=${year}`,
    `https://corsi.unibo.it/${sanitizedType}/${sanitizedCourse}/timetable/@@orario_reale_json?start=${startDate}&end=${endDate}&anno=${year}`
  ];

  if (curriculum) {
    urls = urls.map(url => `${url}&curricula=${encodeURIComponent(curriculum)}`);
  }

  return await fetchWithFallback<Lesson[]>(urls);
}
