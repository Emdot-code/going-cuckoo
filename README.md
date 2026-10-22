# Going Cuckoo — Find Your Home

The page now shows **Going Cuckoo** (`src/CityApp.jsx`). Pick a character (cube, sphere, cone or pyramid) and you live as the yellow one in an isometric city of 5 × 5 spots, with 15 other shapes. Everyone lives on the roof of their house, so you can always see them. A tiny cuckoo demon lives in the clock tower. Every hour of a six-hour day (12:00–18:00) its lid opens, it pops out and announces an absurd law, which at once hands the houses to new owners and moves them about: everyone starts bouncing on a roof that isn't theirs. Hop from roof to roof (arrow keys or W A S D) and find the house you own now; on a tree, the birds get mad. On your own roof you rest and work; anywhere else you keep bouncing. The sky darkens every hour, and at 18:00 the sun sets, the demon sleeps and every house locks.

To see the older versions again, change `CityApp` in `src/main.jsx` to `TownApp` (the sphere town) or `App` (the studio).

### Plan

1. **The core loop** (done): start screen with the four characters; a 5 × 5 city with 16 plain stone houses (the old town's shapes, `src/BuildingShape.jsx`) that never change their look, and trees with birds on the empty spots; nothing behind the tower; hopping roof to roof; six laws a day out of eight in `src/cityLaws.js`, each a clue; the others hopping home; work and search time; the sunset endings (z z z over the sleepers, or stranded on a lonely tile) on a purple card where the demon gives its verdict.
2. **The demon and the light** (done): the tower's lid opens and the demon pops up with a speech bubble; the law stays on the tower's digital display all hour; the sun sinks every hour.
3. **Next ideas**: sounds (a cuckoo, a boing), phone controls (swipes), more laws, a little map of where you have already knocked.

---

# going cuckoo (the studio)

A small, funny browser game set in an open-plan architecture studio. You are a student who must finish a floor-plan drawing, but you may only use your own tools, books and drafting equipment. A tiny daemon lives in the cuckoo clock on the wall. Every simulated hour it wakes up for one minute, invents a new and absurd law of ownership (hair colour, height, age, shoe size, arrival time…), and rearranges everyone's desks and belongings. Then it forgets the law again.

## Run it

```
npm install
npm run dev
```

Then open the address it prints (usually http://localhost:5173).

## Plan

1. **The studio** (done): a small, tall, cube-like studio floating in a sunset, with six big desks, tall sunny windows, a drafting table, a bookshelf, plants and art; the cuckoo clock; you walking around; 5 fellow students (Noor, Isa, Roy, Nari, Tuk) wandering.
2. **Clock and task** (done): a sped-up day from 09:00 to 18:00 (1 real second = 1 studio minute) with a digital clock panel; a floor-plan task that draws itself while you stand at your desk; every full hour the daemon wakes (time stands still, it springs out of the clock, yawns and mumbles) and goes back to sleep; an end-of-day card.
3. **Belongings** (done): everyone has pencils, a set square, a scale ruler and a reference book on their desk; yours glow mint, theirs are faded and locked (point at anything to see whose it is). You only draw while all four of your own things are on your desk; the task panel shows what is missing.
   A tray along the bottom shows your four things: bright when you own one, locked with the new owner's name when you don't.
4. **The daemon** (done): every hour it forgets the last law and announces a new absurd one in a speech bubble under the cuckoo close-up, which stays up until the next hour. Each of the 12 laws in `src/laws.js` is a silly test (odd shoe size, prime-number age, an "o" in your name…): whoever fails hands over one or two kinds of tools, shared out among those who pass. Seven laws catch you. Things float in an arc to their new owners' desks and pile up there, and desk laws send everyone, you included, to a new desk.
   The work is split into three tasks (`src/tasks.js`), each at its own coloured ring with its own pair of tools: the floor plan at your desk (pencils + scale ruler), a section at the drafting table (set square + scale ruler) and a precedent study in the reading corner (book + pencils). Losing a tool locks only the tasks that need it. Each task takes 90 studio minutes; finish all three before 18:00.
5. **Polish**: win/lose screen, funnier announcements, sounds, phone controls, publishing online.

## Cuckoo City (the town version)

The studio grows into a town. A square of plots floats in the sunset, with the demon's clock tower in the middle. Every hour the demon wakes, invents an absurd rule of ownership (hair colour, shoe size, forgotten dreams, who sneezed last…) and rearranges the town: buildings change owner, jump to other plots, turn, float, hang upside down or change shape. The demon forgets the rule when it sleeps, but what the rule did stays.

The page now shows the town (`src/TownApp.jsx`). To see the studio again, change `TownApp` back to `App` in `src/main.jsx`.

1. **The town** (done): 20 buildings in 7 shapes on 24 plots, the clock tower with the studio's cuckoo clock on it, a coloured dot above every building for its owner (yours are yellow), point at a building to see whose it is, 15 rules in `src/rules.js` (8 of them each day), a residents panel with everyone's buildings, sneezing (space bar or button; the others sneeze too), and an end-of-day card at 18:00.
2. **Find your home before night falls** (done): a 6-hour day, 12:00 to 18:00, so the demon strikes 5 times. The residents are spheres; each has one home, and the demon owns the other 10 houses. Every time the demon strikes it makes its rule and then moves all the houses to new plots, under the spheres, so every sphere is suddenly on someone else's house; they are all bounced up and out. Nothing marks whose house is whose: hop onto a roof next door (click it) and if it isn't yours you are bounced away onto a roof nearby; if it is, you stay and a dialogue box says "This is your home!". The others search the same way. The sun sets in the last hour; at 18:00 night falls, the demon stays asleep, and whoever isn't home sleeps in the street.
3. **More ways to play the rules**: swap shoes, "remember" a dream, so you can try to outwit the next rule.
4. **Stranger architecture**: buildings that stack, merge, split, grow stairs or bridges.
5. **Polish**: sounds, phone controls, publishing online.
