# Going Cuckoo

My demon wakes up once every hour and decides new ownership laws for the city, while a resident tries to do his daily groceries.

## Author and course

- **Author:** Mominah Arif
- **Studio:** Pandaemonium: Daemons for Weimar
- **Course:** M.Sc. Digital Technologies in Architecture and Design (DTAD), WiSe 2026/27
- **Chair:** Informatics in Architecture and Urbanism (InfAU), Faculty of Architecture and Urbanism, Bauhaus-Universität Weimar
- **Teaching staff:** Reinhard König, Martin Bielik, Egor Gaydukov, Egor Gavrilov, Jan Willmann, Michael Braun, Thomas Pearce
- **Exercise:** Nonsense Project, 15.10. to 29.10.2026
- **Submission date:** 12.11.2026

## Links

- **Live demo:** https://emdot-code.github.io/going-cuckoo/
- **Source repo:** https://github.com/Emdot-code/going-cuckoo
- **Miro frame:** https://miro.com/app/board/uXjVHn1RS88=/?moveToWidget=3458764689890764744
- **60-second showreel:** on the Miro frame, and in this repo as [`showreel_GoingCuckoo_26-11-12.mp4`](showreel_GoingCuckoo_26-11-12.mp4)

## The task

The Nonsense Project is the two-week, individual start of the studio. I drew one theme, a strange situation in a city where things have spirits, and one constraint, a limit on the daemon I imagined for it. With a coding agent I built a prototype that shows what my daemon would do. Sensors and AI services could be faked, as long as the result was specific and believable. A daemon is not a script, so even a fake one had to decide for itself.

## Theme and constraint

- **Theme:** Nobody knows who owns what.
- **Constraint:** Your demon is awake one minute every hour and sleeps the rest.

In the game, a day runs from 13:00 to 18:00 and one city hour lasts 30 real seconds. At every full hour the demon pops out of its tower, talks for about 9 seconds, and goes back to sleep until the next hour. Whatever it decided stays in force while it sleeps.

## The daemon

### Concept

Going Cuckoo grows out of the cuckoo clock in my childhood home. Its bird slept through the whole hour, only to burst out without warning and often make me jump. In this game it becomes a tiny demon living in a town's clock tower. Every hour it wakes and rewrites the laws of ownership, unleashing havoc among the residents. In a town where nobody knows where home is, the simple task of fetching fifteen things from the shop becomes a whole mission. By sunset you have to find your home, or you are on the streets for the night.

### Perceive, think, act

- **It perceives:** who owns which house. It also sees what every house looks like (round or boxy, tall or short, flat roof or not), where each one stands in town, who is in town, where the shop is, and which roof you are standing on.
- **It thinks:** my demon makes absurd laws based on its own made-up reasons. Each law is built on the spot from three parts: **who** it is about (a colour, a shape, "pointy heads"…), **where** they must live now (a kind of house or a part of town) and **why** (a silly reason, such as "A pigeon told me."). It never repeats a law from today or from your last few games, and it only passes laws that affect at least two residents.
- **It acts:** it not only rearranges the urban setting of the town, it also changes property ownership. The houses get new owners and move to new spots, and everyone is suddenly standing on someone else's roof. Every hour the city also grows by a strip of land, and new neighbours drop in.
- **Real or faked:** the demon really decides on its own who owns what. Nothing is scripted: the laws, the reasons and the new owners are chosen while you play, so no two games are the same. It always takes your house away, even when you are standing on it.

### One visitor

Greenie is a brand-new resident of Cuckoo City. He moved into this small town of wonder with big hopes and dreams, unaware of the tyrant demon who lives in the clock tower. He has finally moved into his new home and is planning his first grocery run when, all of a sudden, a loud bell rings. Suddenly every resident of the town is outdoors and running door to door. Confused and worried, he steps outside to get answers, only to find himself locked out of his house. *"All residents with green skin now live closer to the sun because… photosynthesis!"* The announcement leaves him perplexed, and he starts running towards the sunny side of town to find his house. The new location, new house and new neighbours are surely exciting, but the demon will wake up again in an hour. Will Greenie finish his groceries and get home before the sun sets and home becomes impossible to find?

## How to use it

1. Open the live link (on a computer with a keyboard, with the sound on).
2. Select your character: a cube, sphere, cone or pyramid. You are the yellow one.
3. Find your house (the mint ring under you means you are home) and the grocery shop with the red and white striped roof.
4. Hop from roof to roof with the arrow keys or W, A, S, D. Land on the shop to pick up the next thing on your list, and on your own roof to drop it off. You can carry one thing at a time.
5. Listen closely to the new law every hour: it has clues to where your new home could be. Landing on a wrong roof tells you whose house it is.
6. Be home by 18:00. M turns the sound off and on.

## Technical implementation

- **Frontend:** React 19 in JavaScript, with the 3D city drawn in Three.js through React Three Fiber. The panels (grocery list, speech bubble, notes, sunset card) are HTML and CSS laid over the 3D scene. Everything is built in code: no 3D models or image files.
- **Hosting:** GitHub Pages. The site is static, so it needs no server. It is free, and the workflow in `.github/workflows/deploy.yml` builds and publishes the game by itself on every push to `main`.
- **Data sources and APIs:** no outside data or online services. It uses three browser features: the **Web Audio API** for every sound effect, the **Web Speech API** (`speechSynthesis`) for the demon's voice, which uses whatever English voice the device has, and **localStorage** to remember the mute button and the demon's recent laws.
- **Models while it runs:** none. The demon's mind is a rule-based generator (`src/cityLaws.js`), not an AI model:
  - 15 "who" × 11 "where" = 165 made-up laws, plus 3 special laws, and 15 general reasons plus jokes that only fit one group.
  - It picks at random among the laws that are new today, new for your last 40 laws, and about at least two residents.
  - To hand out the houses, it deals them up to 40 times and keeps the deal in which the fewest residents keep their old house, and never you.
  - The other residents find their way home with a shortest-path search, with pauses and wrong turns so you can't simply follow them.
- **Notable libraries:** Three.js 0.186, @react-three/fiber 9, @react-three/drei 10, React 19, Vite 6.
- **Run locally:** needs Node.js (20 or newer).

  ```
  npm install
  npm run dev
  ```

  Then open the address it prints (usually http://localhost:5173). `npm run build` makes the published version in `dist/`.

### Where things are

| File | What it does |
| --- | --- |
| `src/CityApp.jsx` | The page: the 3D city, the panels and the keys |
| `src/cityGame.js` | The day: the clock, hopping, the shop, the hourly strike, sunset |
| `src/cityLaws.js` | The demon's mind: the law maker, the new owners, its words and verdicts |
| `src/city.js` | The grid, how the city grows, the 36 residents and 36 houses |
| `src/CityScene.jsx` | The 3D scene: tower, houses, trees, residents, sky and light |
| `src/CityHud.jsx` | The panels: start screen, speech bubble, grocery list, sunset card |
| `src/sounds.js` | The sounds, made by the browser, and the demon's voice |
| `src/groceries.js`, `src/GroceryIcon.jsx` | The grocery list and its little drawings |
| `src/palette.js`, `src/index.css` | All the colours and the look |

### The showreel

The showreel was recorded by a script rather than by hand. It played the game by itself in Chrome at 1920 × 1080 (Playwright), captured every frame, laid captions over it and joined everything into an MP4 with FFmpeg. The game's own sounds were recorded straight from the browser. The demon's lines were read by the Windows voice "Microsoft Zira" at the moments the game spoke them, since the browser's speech can't be recorded directly. These tools are not part of the game.

## Working with AI

- **Coding agents used:** Claude Code only, model Claude Opus 5.5 (`claude-opus-5-5`), in every session from 17.10. to 12.11.2026.
- **Key prompts** (in the order they moved the project; typos fixed, long ones shortened):
  1. **From studio to town:** "Transform my existing game into a surreal, abstract architectural town controlled by a demon living inside a giant clock tower. Every hour, the demon wakes up, invents a completely absurd rule of ownership, and rearranges the town…"
  2. **The core mechanic:** "The homes should also be relocated, so that all the residents are sitting in someone else's home when the demon strikes. They are all bounced out and they all find their own home. The home doesn't have to be marked: you only know it's your home if you are not bounced away from it."
  3. **A demon that thinks for itself:** "The demon gives the same laws over and over again, every time the game is played. Let the demon give out new absurd laws, and don't make the sentences too long. Short and funny, easy to read."
  4. **The everyday task:** "Remove the concept of working from home. Now it's a normal grocery day for the player… it needs to pick up groceries from the store and bring them back home, one by one. It can only carry one item at a time, and its house may switch when it's not there."
  5. **No safe place:** "I don't want the rule that if you are home, your home doesn't change. I want the home to change regardless. Make the grocery list a lot longer, maybe 15 items. Also, make the demon read out its law."
- **Reflection** (150 words at most): Working in small steps unlocked progress: one change at a time, checked on the page, then the next. The biggest leap was dropping the studio for the town, because it turned "nobody knows who owns what" into something you can see and play. The agent got stuck on things a player notices instantly. The arrow keys stopped working twice after changes, the page sometimes would not open, and the studio took many rounds of "bigger, now smaller again". It also built a demon that repeated its laws until I asked for one that invents new ones, which is when it began to feel like a daemon rather than a script. Next time I would write the concept and the core loop before building anything, so the first version would already be the town. I would also test the controls after every change.

## Credits, assets, licenses

- **Fonts:** Nunito and Cinzel, from Google Fonts, SIL Open Font License 1.1.
- **Data:** none.
- **Images and sounds:** all drawn and made in code for this project. The sounds are synthesised in the browser (`src/sounds.js`), with no sound files. The demon's voice is the device's own text-to-speech voice. `ref images/` holds one reference image used only for inspiration; it is not shown in the game.
- **Third-party code:** React, Three.js, React Three Fiber, drei and Vite, all under the MIT License.
- **This repo:** [choose a license, e.g. MIT for the code or CC BY 4.0 for the content, and add a LICENSE file]

## Development history

The game was built in small steps, and two earlier versions are still in the code. To see them, change `CityApp` in `src/main.jsx` to `App` (a studio where a cuckoo-clock daemon takes away students' drawing tools) or `TownApp` (a town of spheres searching for their houses).

1. **The core loop:** start screen, the city, the clock tower, hopping roof to roof, the law maker, the others hopping home, the sunset endings.
2. **The demon and the light:** the tower's lid opens, the demon pops up with a speech bubble, the law stays on the tower's display, the sun sinks every hour.
3. **Halo and sounds:** a mint ring at home and coral elsewhere, the ping, the crows, the tower bells and a mute button.
4. **A growing city:** 3 × 3 spots at 13:00, up to 7 × 7 by 17:00, with new neighbours arriving.
5. **Grocery day:** the shop, the fifteen-item list and the hungry ending.
6. **Next ideas:** phone controls (swipes), more laws, a little map of where you have already knocked.
