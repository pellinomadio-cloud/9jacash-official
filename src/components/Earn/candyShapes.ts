// Candy Crush Level Shapes and Level Configurations (Levels 1 to 1,000)
// Classic 8x8 Candy Crush grid layout

export const GRID_SIZE = 8;

export type BoardShape = boolean[][];
export type TargetCandyColor = 'red' | 'blue' | 'orange' | 'green' | 'yellow';

export interface LevelConfig {
  level: number;
  worldName: string;
  shapeName: string;
  shape: BoardShape;
  targetScore: number;
  totalMoves: number;
  targetCandyType: TargetCandyColor;
  targetCandyCount: number;
  numColors: 5 | 6;
  themeColor: string;
}

const TARGET_CANDY_CYCLE: TargetCandyColor[] = ['red', 'blue', 'orange', 'green', 'yellow'];

// Classic 8x8 level board definitions (Level 1 is the iconic full 8x8 square)
const SHAPE_DEFINITIONS: Array<{ name: string; generator: () => BoardShape }> = [
  // Shape 0: Classic Full 8x8 Square (Level 1 and classic boards)
  {
    name: 'Candy Town',
    generator: () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true)),
  },
  // Shape 1: Beveled Meadow (1-cell corner bevels on 8x8)
  {
    name: 'Lemonade Lake',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      b[0][0] = false;
      b[0][7] = false;
      b[7][0] = false;
      b[7][7] = false;
      return b;
    },
  },
  // Shape 2: Crossroads Valley (2x2 corner cutouts on 8x8)
  {
    name: 'Sugar Meadow',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      for (const r of [0, 1, 6, 7]) {
        for (const c of [0, 1, 6, 7]) {
          b[r][c] = false;
        }
      }
      return b;
    },
  },
  // Shape 3: Diamond Peak (Octagon bevel on 8x8)
  {
    name: 'Diamond Peak',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      b[0][0] = false; b[0][1] = false; b[0][6] = false; b[0][7] = false;
      b[1][0] = false; b[1][7] = false;
      b[6][0] = false; b[6][7] = false;
      b[7][0] = false; b[7][1] = false; b[7][6] = false; b[7][7] = false;
      return b;
    },
  },
  // Shape 4: Jelly Ring Lagoon (2x2 center island cutout)
  {
    name: 'Jelly Lagoon',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      for (const r of [3, 4]) {
        for (const c of [3, 4]) {
          b[r][c] = false;
        }
      }
      return b;
    },
  },
  // Shape 5: Twin Sugar Pillars
  {
    name: 'Caramel Bridge',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      b[3][2] = false;
      b[4][2] = false;
      b[3][5] = false;
      b[4][5] = false;
      return b;
    },
  },
  // Shape 6: Candy Castle Arch
  {
    name: 'Minty Castle',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      b[0][0] = false; b[0][1] = false; b[0][6] = false; b[0][7] = false;
      b[1][0] = false; b[1][7] = false;
      return b;
    },
  },
  // Shape 7: Sweet Heart Valley
  {
    name: 'Strawberry Fields',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      b[0][0] = false; b[0][3] = false; b[0][4] = false; b[0][7] = false;
      b[6][0] = false; b[6][7] = false;
      b[7][0] = false; b[7][1] = false; b[7][6] = false; b[7][7] = false;
      return b;
    },
  },
];

// Returns world theme name based on level
export const getWorldName = (level: number): string => {
  if (level <= 25) return 'Candy Kingdom';
  if (level <= 50) return 'Lemonade Lake';
  if (level <= 100) return 'Caramel Coast';
  if (level <= 200) return 'Lollipop Peak';
  if (level <= 350) return 'Soda Springs';
  if (level <= 500) return 'Chocolate Castle';
  if (level <= 700) return 'Starlight Lagoon';
  if (level <= 850) return 'Sugar Divine Realm';
  return 'Grandmaster League';
};

// Generates complete configuration for any Level 1 to 1,000
export const getLevelConfig = (levelInput: number): LevelConfig => {
  const level = Math.max(1, Math.min(1000, levelInput));
  // Keep full classic 8x8 square on Level 1, 2 and every 3rd level for crisp classic play
  const shapeIndex = level === 1 ? 0 : (level - 1) % SHAPE_DEFINITIONS.length;
  const def = SHAPE_DEFINITIONS[shapeIndex];

  const targetScore = 3000 + (level - 1) * 900;
  const totalMoves = level <= 5 ? 25 : level <= 25 ? 24 : 22;
  const targetCandyType = TARGET_CANDY_CYCLE[(level - 1) % TARGET_CANDY_CYCLE.length];
  const targetCandyCount = Math.min(80, 20 + Math.floor((level - 1) * 2.5));
  const numColors: 5 | 6 = level >= 4 ? 6 : 5;

  const THEMES = [
    'from-pink-500/20 via-rose-500/20 to-amber-500/20',
    'from-sky-500/20 via-blue-500/20 to-pink-500/20',
    'from-amber-500/20 via-orange-500/20 to-rose-500/20',
  ];
  const themeColor = THEMES[(level - 1) % THEMES.length];

  return {
    level,
    worldName: getWorldName(level),
    shapeName: def.name,
    shape: def.generator(),
    targetScore,
    totalMoves,
    targetCandyType,
    targetCandyCount,
    numColors,
    themeColor,
  };
};
