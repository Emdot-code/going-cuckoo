// The groceries, each drawn as a few flat, solid shapes on a 24 × 24 grid: no outlines, no
// detail, just enough to tell a lemon from an egg. Used on the list, over your head when you
// carry something, and on the sunset card.

import { FOOD as F } from './palette.js'

const SHAPES = {
  milk: (
    <>
      <path d="M7 9 L9 4 H15 L17 9 V21 H7 Z" fill={F.sky} />
      <rect x="7" y="12" width="10" height="5" fill={F.blue} />
    </>
  ),
  bread: (
    <>
      <path d="M4 20 V11 Q4 5 12 5 Q20 5 20 11 V20 Z" fill={F.crust} />
      <path d="M6.5 18 V11.5 Q6.5 7.5 12 7.5 Q17.5 7.5 17.5 11.5 V18 Z" fill={F.sand} />
    </>
  ),
  eggs: (
    <>
      <ellipse cx="9" cy="13" rx="4.5" ry="6" fill={F.sand} />
      <ellipse cx="16" cy="15" rx="4" ry="5.2" fill={F.crust} />
    </>
  ),
  apples: (
    <>
      <path d="M12 8 C6 5 3 11 5 16 C7 21 10 21 12 20 C14 21 17 21 19 16 C21 11 18 5 12 8 Z" fill={F.red} />
      <rect x="11.2" y="3" width="1.6" height="5" rx="0.8" fill={F.brown} />
      <ellipse cx="15.5" cy="5" rx="2.6" ry="1.2" transform="rotate(-30 15.5 5)" fill={F.leaf} />
    </>
  ),
  cheese: (
    <>
      <path d="M3 17 L21 8 V19 H3 Z" fill={F.yellow} />
      <circle cx="15" cy="15" r="1.6" fill={F.lemon} />
      <circle cx="9" cy="17" r="1" fill={F.lemon} />
    </>
  ),
  carrots: (
    <>
      <path d="M7 8 H17 L12 22 Z" fill={F.orange} />
      <path d="M12 8 L8 2 L12 5 L16 2 Z" fill={F.leaf} />
    </>
  ),
  bananas: <path d="M4 7 Q5 19 18 18 Q21 17.5 20.5 15 Q10 16 7.5 6 Z" fill={F.yellow} />,
  tomatoes: (
    <>
      <circle cx="12" cy="14" r="8" fill={F.red} />
      <path d="M12 5 L13 8 L17 7 L13.5 9.5 L12 12 L10.5 9.5 L7 7 L11 8 Z" fill={F.leaf} />
    </>
  ),
  fish: (
    <>
      <path d="M2 12 Q9 4 16 12 Q9 20 2 12 Z" fill={F.blue} />
      <path d="M15 12 L22 6 V18 Z" fill={F.blue} />
      <circle cx="6.5" cy="11" r="1.1" fill={F.cream} />
    </>
  ),
  broccoli: (
    <>
      <path d="M10 13 H14 L15 22 H9 Z" fill={F.leaf} />
      <circle cx="7.5" cy="11" r="4" fill={F.leafDark} />
      <circle cx="16.5" cy="11" r="4" fill={F.leafDark} />
      <circle cx="12" cy="7" r="4.5" fill={F.leafDark} />
    </>
  ),
  honey: (
    <>
      <rect x="5" y="8" width="14" height="13" rx="4" fill={F.yellow} />
      <rect x="6" y="4" width="12" height="4" rx="1.5" fill={F.brown} />
    </>
  ),
  coffee: (
    <>
      <path d="M16 10.5 H18.5 A2.75 2.75 0 0 1 18.5 16 H16 V14 H18.5 A0.75 0.75 0 0 0 18.5 12.5 H16 Z" fill={F.brown} />
      <path d="M4 9 H17 V14 A6 6 0 0 1 11 20 H10 A6 6 0 0 1 4 14 Z" fill={F.brown} />
      <rect x="6" y="3" width="2" height="4" rx="1" fill={F.sand} />
      <rect x="11" y="3" width="2" height="4" rx="1" fill={F.sand} />
    </>
  ),
  lemons: (
    <>
      <ellipse cx="12" cy="13" rx="8" ry="6" fill={F.lemon} />
      <circle cx="3.8" cy="13" r="1.6" fill={F.lemon} />
      <circle cx="20.2" cy="13" r="1.6" fill={F.lemon} />
      <ellipse cx="14" cy="5.5" rx="3" ry="1.3" transform="rotate(-20 14 5.5)" fill={F.leaf} />
    </>
  ),
  butter: (
    <>
      <path d="M3 11 L7 7 H21 L17 11 Z" fill={F.lemon} />
      <path d="M3 11 H17 V19 H3 Z" fill={F.yellow} />
      <path d="M17 11 L21 7 V15 L17 19 Z" fill={F.crust} />
    </>
  ),
  rice: (
    <>
      <path d="M5 12 A7 5.5 0 0 1 19 12 Z" fill={F.cream} />
      <path d="M3 12 H21 A9 8 0 0 1 3 12 Z" fill={F.blue} />
    </>
  ),
  cookies: (
    <>
      <circle cx="12" cy="12" r="9" fill={F.crust} />
      <circle cx="9" cy="9" r="1.4" fill={F.chocolate} />
      <circle cx="15" cy="11" r="1.4" fill={F.chocolate} />
      <circle cx="10" cy="15" r="1.4" fill={F.chocolate} />
      <circle cx="15" cy="16" r="1" fill={F.chocolate} />
    </>
  ),
  pasta: (
    <>
      <path d="M2 6 L12 11 V13 L2 18 Z" fill={F.yellow} />
      <path d="M22 6 L12 11 V13 L22 18 Z" fill={F.yellow} />
      <rect x="10" y="9" width="4" height="6" rx="2" fill={F.crust} />
    </>
  ),
  potatoes: (
    <>
      <ellipse cx="12" cy="13" rx="9" ry="6.5" transform="rotate(-15 12 13)" fill={F.crust} />
      <circle cx="9" cy="12" r="0.9" fill={F.brown} />
      <circle cx="15" cy="11" r="0.9" fill={F.brown} />
      <circle cx="13" cy="16" r="0.9" fill={F.brown} />
    </>
  ),
  onions: (
    <>
      <path d="M12 2 Q13 7 18 10.5 A7 7 0 1 1 6 10.5 Q11 7 12 2 Z" fill={F.onion} />
      <rect x="10" y="20" width="4" height="2" rx="1" fill={F.brown} />
    </>
  ),
  grapes: (
    <>
      <rect x="11.2" y="2" width="1.6" height="4" rx="0.8" fill={F.brown} />
      <circle cx="8" cy="8.5" r="3" fill={F.grape} />
      <circle cx="16" cy="8.5" r="3" fill={F.grape} />
      <circle cx="12" cy="9" r="3" fill={F.grape} />
      <circle cx="10" cy="13.5" r="3" fill={F.grape} />
      <circle cx="14" cy="13.5" r="3" fill={F.grape} />
      <circle cx="12" cy="18" r="3" fill={F.grape} />
    </>
  ),
  strawberries: (
    <>
      <path d="M4 9 Q12 6 20 9 Q19 18 12 22 Q5 18 4 9 Z" fill={F.red} />
      <path d="M6 9 L8.5 4.5 L12 7.5 L15.5 4.5 L18 9 Z" fill={F.leaf} />
      <circle cx="9" cy="13" r="0.8" fill={F.lemon} />
      <circle cx="15" cy="13" r="0.8" fill={F.lemon} />
      <circle cx="12" cy="17" r="0.8" fill={F.lemon} />
    </>
  ),
  avocados: (
    <>
      <path d="M12 2 C16 2 20 14 18.5 18 A7 5.5 0 0 1 5.5 18 C4 14 8 2 12 2 Z" fill={F.leafDark} />
      <ellipse cx="12" cy="15" rx="4.6" ry="5.4" fill={F.avocado} />
      <circle cx="12" cy="16" r="2.5" fill={F.brown} />
    </>
  ),
  corn: (
    <>
      <ellipse cx="12" cy="10" rx="4.5" ry="8.5" fill={F.yellow} />
      <path d="M12 22 Q3.5 18 6 8 Q8.5 16 12 22 Z" fill={F.leaf} />
      <path d="M12 22 Q20.5 18 18 8 Q15.5 16 12 22 Z" fill={F.leaf} />
    </>
  ),
  peppers: (
    <>
      <path d="M5 9 Q12 6 19 9 Q20 20 15.5 21 Q12 19 8.5 21 Q4 20 5 9 Z" fill={F.leaf} />
      <rect x="11" y="3" width="2" height="5" rx="1" fill={F.leafDark} />
    </>
  ),
  chocolate: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" fill={F.chocolate} />
      {[0, 1, 2].map((r) =>
        [0, 1].map((c) => <rect key={`${r}${c}`} x={6.5 + c * 6} y={4.5 + r * 5.5} width="5" height="4.5" rx="0.8" fill={F.brown} />),
      )}
    </>
  ),
  tea: (
    <>
      <path d="M16 10.5 H18.5 A2.75 2.75 0 0 1 18.5 16 H16 V14 H18.5 A0.75 0.75 0 0 0 18.5 12.5 H16 Z" fill={F.mint} />
      <path d="M4 9 H17 V14 A6 6 0 0 1 11 20 H10 A6 6 0 0 1 4 14 Z" fill={F.mint} />
      <rect x="9.6" y="3" width="0.8" height="7" fill={F.ink} />
      <rect x="8.2" y="2" width="3.6" height="3" rx="0.5" fill={F.yellow} />
    </>
  ),
}

// One grocery, by its name ('milk', 'bread', …), as a little solid drawing.
export default function GroceryIcon({ name, size = 18 }) {
  return (
    <svg className="grocery-icon" viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      {SHAPES[name]}
    </svg>
  )
}
