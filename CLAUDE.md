# Project guidelines

I study architecture or design and don't write code. Explain each step in a sentence or two of plain words. After a change, say which files you changed and what I should check on the page.

Build the game in small steps (see the plan in `README.md`). Don't add several features at once, and don't rebuild what already works.

## Stack

Same as my Bauhaus city project: Vite, React in JavaScript, npm, Three.js / React Three Fiber for 3D. Don't add TypeScript or switch frameworks.

## Look

Minimal and architectural, inspired by Monument Valley, Alto's Adventure, TwoDots and Journey: soft sunset pastels (peach, sand, lavender), plum instead of black, rounded cards and dots, with pops of coral red, mint green and yellow. All colours live in `src/palette.js`.

## Hosting

GitHub Pages publishes every push to `main` at `https://<user>.github.io/<repo>/`, through the workflow in `.github/workflows/`. Load every file in `public/` through `import.meta.env.BASE_URL`: a path that starts with `/` works on localhost and breaks on Pages.
