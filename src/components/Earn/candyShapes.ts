// Candy Crush Level Shapes and Level Configurations (Levels 1 to 1,000)

export const GRID_SIZE = 7;

export type BoardShape = boolean[][];

export interface LevelConfig {
  level: number;
  worldName: string;
  shapeName: string;
  shape: BoardShape;
  targetScore: number;
  totalMoves: number;
  themeColor: string;
}

// 12 Distinctive Level Shapes for Levels 1 to 1,000
const SHAPE_DEFINITIONS: Array<{ name: string; generator: () => BoardShape }> = [
  // Shape 0: Classic Full Square 7x7 (Level 1, 13, 25...)
  {
    name: 'Classic Meadow',
    generator: () => Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true)),
  },
  // Shape 1: Plus / Cross Shape (Level 2, 14, 26...) - 4 corners cut
  {
    name: 'Crossroads Valley',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      // Cut 2x2 in each of the 4 corners
      for (const r of [0, 1, 5, 6]) {
        for (const c of [0, 1, 5, 6]) {
          b[r][c] = false;
        }
      }
      return b;
    },
  },
  // Shape 2: Diamond / Octagon (Level 3, 15, 27...) - Beveled edges
  {
    name: 'Diamond Peak',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      b[0][0] = false;
      b[0][1] = false;
      b[0][5] = false;
      b[0][6] = false;
      b[1][0] = false;
      b[1][6] = false;
      b[5][0] = false;
      b[5][6] = false;
      b[6][0] = false;
      b[6][1] = false;
      b[6][5] = false;
      b[6][6] = false;
      return b;
    },
  },
  // Shape 3: Donut Ring (Level 4, 16, 28...) - Center hollow orbital
  {
    name: 'Jelly Ring Lagoon',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      // Inactive 3x3 center
      for (let r = 2; r <= 4; r++) {
        for (let c = 2; c <= 4; c++) {
          b[r][c] = false;
        }
      }
      return b;
    },
  },
  // Shape 4: Hourglass / Butterfly (Level 5, 17, 29...)
  {
    name: 'Hourglass Canyon',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      // Rows 1 and 5: cut corners
      b[1][0] = false;
      b[1][6] = false;
      b[5][0] = false;
      b[5][6] = false;
      // Rows 2 and 4: cut 2 on sides
      b[2][0] = false;
      b[2][1] = false;
      b[2][5] = false;
      b[2][6] = false;
      b[4][0] = false;
      b[4][1] = false;
      b[4][5] = false;
      b[4][6] = false;
      // Row 3 (center waist): keep center 3
      b[3][0] = false;
      b[3][1] = false;
      b[3][5] = false;
      b[3][6] = false;
      return b;
    },
  },
  // Shape 5: Stepped Castle / Pyramid (Level 6, 18, 30...)
  {
    name: 'Sugar Castle',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      // Row 0 has only center 3
      b[0][0] = false;
      b[0][1] = false;
      b[0][5] = false;
      b[0][6] = false;
      // Row 1 has center 5
      b[1][0] = false;
      b[1][6] = false;
      return b;
    },
  },
  // Shape 6: Twin Channels / Double Pillars (Level 7, 19, 31...)
  {
    name: 'Twin Pillars',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      // Center column has barrier in rows 2, 3, 4
      b[2][3] = false;
      b[3][3] = false;
      b[4][3] = false;
      return b;
    },
  },
  // Shape 7: Candy Heart (Level 8, 20, 32...)
  {
    name: 'Sweet Heart Oasis',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      // Top dip
      b[0][0] = false;
      b[0][3] = false;
      b[0][6] = false;
      // Bottom taper
      b[5][0] = false;
      b[5][1] = false;
      b[5][5] = false;
      b[5][6] = false;
      b[6][0] = false;
      b[6][1] = false;
      b[6][2] = false;
      b[6][4] = false;
      b[6][5] = false;
      b[6][6] = false;
      return b;
    },
  },
  // Shape 8: Hexagon Honeycomb (Level 9, 21, 33...)
  {
    name: 'Honey Beehive',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      b[0][0] = false;
      b[0][1] = false;
      b[0][5] = false;
      b[0][6] = false;
      b[1][0] = false;
      b[1][6] = false;
      b[5][0] = false;
      b[5][6] = false;
      b[6][0] = false;
      b[6][1] = false;
      b[6][5] = false;
      b[6][6] = false;
      return b;
    },
  },
  // Shape 9: Star Nexus / X-Wing (Level 10, 22, 34...)
  {
    name: 'Star Nexus',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      // Cut top and bottom center edges
      b[0][3] = false;
      b[6][3] = false;
      // Cut left and right center edges
      b[3][0] = false;
      b[3][6] = false;
      return b;
    },
  },
  // Shape 10: Knight Shield (Level 11, 23, 35...)
  {
    name: 'Knight Shield',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      // Bottom pointy taper
      b[5][0] = false;
      b[5][6] = false;
      b[6][0] = false;
      b[6][1] = false;
      b[6][5] = false;
      b[6][6] = false;
      return b;
    },
  },
  // Shape 11: Cosmic Yin-Yang (Level 12, 24, 36...)
  {
    name: 'Cosmic Orbit',
    generator: () => {
      const b = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(true));
      b[1][2] = false;
      b[1][3] = false;
      b[5][3] = false;
      b[5][4] = false;
      return b;
    },
  },
];

// Returns world theme name based on level
export const getWorldName = (level: number): string => {
  if (level <= 25) return 'Sugar Meadow';
  if (level <= 50) return 'Jelly Lagoon';
  if (level <= 100) return 'Caramel Coast';
  if (level <= 200) return 'Lollipop Peak';
  if (level <= 350) return 'Electric Soda Springs';
  if (level <= 500) return 'Chocolate Castle';
  if (level <= 700) return 'Lightning Galaxy';
  if (level <= 850) return 'Sugar Divine Realm';
  return 'Grandmaster League 1,000';
};

// Generates complete configuration for any Level 1 to 1,000
export const getLevelConfig = (levelInput: number): LevelConfig => {
  const level = Math.max(1, Math.min(1000, levelInput));
  const shapeIndex = (level - 1) % SHAPE_DEFINITIONS.length;
  const def = SHAPE_DEFINITIONS[shapeIndex];

  // Base target score scales with level
  // Level 1: 5,000 | Level 2: 7,500 | Level 10: 22,000 ...
  const targetScore = 5000 + (level - 1) * 1500;
  const totalMoves = level <= 5 ? 22 : level <= 20 ? 20 : 18;

  const THEMES = [
    'from-pink-500/20 via-purple-500/20 to-amber-500/20',
    'from-blue-500/20 via-teal-500/20 to-emerald-500/20',
    'from-amber-500/20 via-orange-500/20 to-rose-500/20',
    'from-purple-500/20 via-pink-500/20 to-sky-500/20',
    'from-emerald-500/20 via-yellow-500/20 to-teal-500/20',
  ];
  const themeColor = THEMES[(level - 1) % THEMES.length];

  return {
    level,
    worldName: getWorldName(level),
    shapeName: def.name,
    shape: def.generator(),
    targetScore,
    totalMoves,
    themeColor,
  };
};
