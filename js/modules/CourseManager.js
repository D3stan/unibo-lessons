import StorageManager from './StorageManager.js';
import coursesData from './coursesData.js';

export default class CourseManager {
    constructor() {
        this.course = StorageManager.getItem('selectedCourse') || null;
        this.type = StorageManager.getItem('selectedCourseType') || null;
        this.anno = parseInt(StorageManager.getItem('selectedAnno')) || 1;
        this.curriculum = StorageManager.getItem('selectedCurriculum');
        if (this.curriculum === "null") this.curriculum = null;

        // If type is missing but course exists, try to recover it from coursesData
        if (this.course && !this.type && coursesData[this.course]) {
             this.type = coursesData[this.course].type;
        }
    }

    getCourseData() {
        return coursesData;
    }

    setCourse(courseValue) {
        if (coursesData[courseValue]) {
            this.course = courseValue;
            this.type = coursesData[courseValue].type;
            StorageManager.setItem('selectedCourse', this.course);
            StorageManager.setItem('selectedCourseType', this.type);
            return true;
        }
        return false;
    }

    setAnno(annoValue) {
        this.anno = parseInt(annoValue);
        StorageManager.setItem('selectedAnno', this.anno);
    }

    setCurriculum(curriculumValue) {
        this.curriculum = curriculumValue;
        StorageManager.setItem('selectedCurriculum', this.curriculum);
    }

    getType() {
        return this.type;
    }

    getCourse() {
        return this.course;
    }

    getAnno() {
        return this.anno;
    }

    getCurriculum() {
        return this.curriculum;
    }

    reset() {
        this.course = null;
        this.type = null;
        this.anno = 1;
        this.curriculum = null;
        StorageManager.removeItem('selectedCourse');
        StorageManager.removeItem('selectedCourseType');
        StorageManager.removeItem('selectedAnno');
        StorageManager.removeItem('selectedCurriculum');
    }

    async fetchCurricula() {
        if (!this.course || !this.type) return null;

        const urls = [
            `https://corsi.unibo.it/${this.type}/${this.course}/orario-lezioni/@@available_curricula`,
            `https://corsi.unibo.it/${this.type}/${this.course}/timetable/@@available_curricula`
        ];

        let curricula = null;

        for (let url of urls) {
            try {
                const response = await fetch(url);
                if (response.ok) {
                    curricula = await response.json();
                    break;
                }
            } catch (error) {}
        }
        return curricula;
    }
}
