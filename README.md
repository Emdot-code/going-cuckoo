# Going Cuckoo — Find Your Home

The page now shows **Going Cuckoo** (`src/CityApp.jsx`). Pick a character (cube, sphere, cone or pyramid) and you live as the yellow one in an isometric city that grows during the day, from 3 × 3 spots to 7 × 7, with up to 35 other shapes in nine colours. Everyone lives on the roof of their house, so you can always see them. A tiny cuckoo demon lives in the clock tower. Every hour of a five-hour day (13:00–18:00) its lid opens, it pops out and reads out an absurd law like a subway announcement (a ding-dong, then the browser's own voice), which at once hands the houses to new owners and moves them about: everyone starts bouncing on a roof that isn't theirs. It is grocery day: fetch the fifteen things on your list (drawn as flat little shapes in `src/GroceryIcon.jsx`) from the grocery shop with the red and white striped pyramid roof and the SHOP sign (`src/groceries.js`), one at a time, and bring each one home. Hop from roof to roof (arrow keys or W A S D); land on the shop to pick up the next thing, and on your own roof to drop it off. Every law takes your house away, even if you are standing on it, so after every hour you have to find the one you own now. On a tree, the birds get mad. On your own roof you rest; anywhere else you keep bouncing. The shop moves out onto the new land every time the city grows. The sky darkens every hour, and at 18:00 the sun sets, the demon sleeps and every house locks. Home with the whole list, you have a full fridge; home without it, you go to sleep hungry.

To see the older versions again, change `CityApp` in `src/main.jsx` to `TownApp` (the sphere town) or `App` (the studio).

### Plan

1. **The core loop** (done): start screen with the four characters; a 5 × 5 city with 16 plain stone houses (the old town's shapes, `src/BuildingShape.jsx`) that never change their look, and trees with birds on the empty spots; nothing behind the tower; hopping roof to roof; five laws a day, each a clue, made up by the demon on the spot in `src/cityLaws.js` (who: a colour or a shape; where: a kind of house or a part of town; why: a silly reason), about 110 in all, and it avoids the ones from your last few games; the others hopping home; the sunset endings (z z z over the sleepers, or stranded on a lonely tile) on a purple card where the demon gives its verdict.
2. **The demon and the light** (done): the tower's lid opens and the demon pops up with a speech bubble; the law stays on the tower's digital display all hour; the sun sinks every hour.
3. **Halo and sounds** (done): the ring under you is mint while you are home and coral red while you are not; a ping on every hop, crows cawing when you land on a tree, and the clock tower's bells (a four-note chime and one stroke per hour) when the demon pops out (`src/sounds.js`, made by the browser, no sound files). A mute button in the top right corner (or the M key) turns them off.
4. **A growing city** (done): the city starts as 3 × 3 spots with you and 5 neighbours, and from the second law on it grows a strip of land each hour, on the right and the left in turn (4 × 4, 5 × 5, 6 × 6, 7 × 7). New neighbours drop in with their houses on the new land: 6, 11, 18, 26, then all 36 houses, so only about one spot in five has a tree. An hour lasts 30 real seconds. The stages are `STAGES` and `HOUSES_AT` in `src/city.js`.
5. **Next ideas**: phone controls (swipes), more laws, a little map of where you have already knocked.

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
