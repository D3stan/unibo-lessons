# UniBo Lessons

This project scrapes the official University of Bologna (UniBo) course timetables and presents them in a user-friendly web interface. Data is retrieved at API level, so any changes in the front-end should not represent a problem.

## 🌐 Website Purpose

The goal is to simplify access to UniBo timetables for students. Instead of navigating the university's official site manually, students can:

- Quickly view their lesson schedules
- Select their course and year once — the site remembers this using browser local storage
- Enjoy a cleaner, more responsive interface

## ✨ Features

- ✅ Scrapes real-time timetable data from the official UniBo website
- 💾 Remembers your selected course and year using local storage
- 📱 Mobile-friendly and easy to use
- ⚡ Fast and lightweight
- 🌙 Dark theme compatible

## 🛠️ Technologies Used

- JavaScript (Vanilla)
- HTML & CSS
- Browser localStorage
- Fetch-based scraping logic

## 🚀 How to Use

1. Visit the [site](d3stan.github.io/unibo-lessons/) or run it locally (🤓)
2. Select your **degree program** and **year**
3. View your timetable instantly
4. The next time you open the site, your selection is remembered

**Bonus:** add the website to your smartphone's homescreen for a smoother experience

## 📁 Project Structure

- `index.html` – Main HTML page
- `script.js` – Logic for fetching, scraping, and rendering timetable data
- `style.css` – Styles for layout and responsiveness
- `courses.json` and `coursesData.js` – Manual listing of the courses (Unibo does not expose an API for fetching them easily)

## ⚠️ Disclaimer

This tool is unofficial and not affiliated with the University of Bologna. Data is pulled directly from their public site, so if they change the layout or structure, the scraper may break (this shouldn't happen because of the API level scraping).
**Some** courses might not be present, open a [issue](https://github.com/D3stan/unibo-lessons/issues) to flag yours. Also, this website was design because of the issues with the myUnibo mobile app (timetables not showing correctly). Educational purpose only.
