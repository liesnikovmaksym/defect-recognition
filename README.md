# Розпізнавання дефектів фігур

Лабораторна, варіант 8: є суцільний круг (квадрат тощо) і також зображення з цією фігурою і з зайвою (зайвими) маленькою висячою поверхнею. Розробити застосунок розпізнавання цих зображень з дефектами. Використати перший спосіб класифікації зображень за кумулятивною гістограмою (дивись фрагмент статті ANN_defects). Кількість даних можна обмежити.

Стек: React 19, Redux Toolkit, SCSS + CSS Modules, Vite, Brain.js 1.6.1 (у Web Worker), Recharts (графіки), ExcelJS (експорт в Excel, підвантажується за потреби), шрифти IBM Plex Sans і Mono (``@fontsource``). Архітектура — FSD.

## Запуск

```bash
npm install
npm run dev
npm run build
```

## Структура (FSD)
Структура проекту реалізованна за допомогою методології FSD, де імпорти йдуть лише вниз по шарах (`pages → widgets → features → entities → shared`), назовні — через `index.js` слайсу.
```
src/
  app/         store, провайдери, глобальні стилі
  pages/       home
  widgets/     navbar, workspace, result-panel, history-panel, log-panel
  features/    train-model, upload-image, draw-shape, generate-sample, recognize-image, save-image, export-results
  entities/    image, model, recognition, log (slice + ui)
  shared/      ui, lib (ml, image, format), api/ml (воркери), config, styles
```