import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { soundFx } from '../../utils/sound.ts';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  HelpCircle,
  X,
  Trophy,
  Settings,
  Play,
} from 'lucide-react';

// ==========================================
// CLASSIC BLOCK BLAST 5 JEWEL COLORS (MATCHING SCREENSHOT)
// ==========================================
export interface BlockColorTheme {
  id: 'blue' | 'yellow' | 'green' | 'red' | 'purple';
  mainBg: string;
  topHighlight: string;
  bottomShade: string;
  innerFace: string;
  hex: string;
}

const BLOCK_COLORS: Record<BlockColorTheme['id'], BlockColorTheme> = {
  blue: {
    id: 'blue',
    mainBg: '#1c74f5',
    topHighlight: '#63a8ff',
    bottomShade: '#0d47a8',
    innerFace: 'linear-gradient(180deg, #3288ff 0%, #1766e0 100%)',
    hex: '#257bf7',
  },
  yellow: {
    id: 'yellow',
    mainBg: '#ffc812',
    topHighlight: '#ffe875',
    bottomShade: '#c98e00',
    innerFace: 'linear-gradient(180deg, #ffd633 0%, #f5b400 100%)',
    hex: '#ffcc14',
  },
  green: {
    id: 'green',
    mainBg: '#24d424',
    topHighlight: '#72f572',
    bottomShade: '#118f11',
    innerFace: 'linear-gradient(180deg, #35e035 0%, #1bb81b 100%)',
    hex: '#28d928',
  },
  red: {
    id: 'red',
    mainBg: '#eb2d23',
    topHighlight: '#ff7a73',
    bottomShade: '#a3130b',
    innerFace: 'linear-gradient(180deg, #f73e34 0%, #d42017 100%)',
    hex: '#ed3026',
  },
  purple: {
    id: 'purple',
    mainBg: '#9e33ff',
    topHighlight: '#ce8aff',
    bottomShade: '#6612b8',
    innerFace: 'linear-gradient(180deg, #ad4dff 0%, #8922eb 100%)',
    hex: '#a238ff',
  },
};

const COLOR_KEYS: BlockColorTheme['id'][] = ['blue', 'yellow', 'green', 'red', 'purple'];

export interface BlockPiece {
  id: string;
  name: string;
  matrix: number[][];
  color: BlockColorTheme['id'];
}

// Easy, fun, compact shapes (matching screenshot tray: small L-corner, 2x2 square, 1x4 bar, etc.)
const EASY_SHAPES: { name: string; matrix: number[][]; preferredColor?: BlockColorTheme['id'] }[] = [
  // 3-block L-Corners (like the blue piece on the left of screenshot)
  {
    name: 'Corner BL',
    matrix: [
      [1, 0],
      [1, 1],
    ],
    preferredColor: 'blue',
  },
  {
    name: 'Corner BR',
    matrix: [
      [0, 1],
      [1, 1],
    ],
    preferredColor: 'blue',
  },
  {
    name: 'Corner TL',
    matrix: [
      [1, 1],
      [1, 0],
    ],
    preferredColor: 'purple',
  },
  {
    name: 'Corner TR',
    matrix: [
      [1, 1],
      [0, 1],
    ],
    preferredColor: 'red',
  },
  // 2x2 Square (like the yellow piece in the middle of screenshot)
  {
    name: 'Square 2x2',
    matrix: [
      [1, 1],
      [1, 1],
    ],
    preferredColor: 'yellow',
  },
  // 1x4 Horizontal Bar (like the green piece on the right of screenshot)
  {
    name: 'Bar 4H',
    matrix: [[1, 1, 1, 1]],
    preferredColor: 'green',
  },
  // 4x1 Vertical Bar
  {
    name: 'Bar 4V',
    matrix: [[1], [1], [1], [1]],
    preferredColor: 'green',
  },
  // 1x3 Horizontal & Vertical Bars
  {
    name: 'Bar 3H',
    matrix: [[1, 1, 1]],
    preferredColor: 'red',
  },
  {
    name: 'Bar 3V',
    matrix: [[1], [1], [1]],
    preferredColor: 'blue',
  },
  // 1x2 Dominoes (super easy gap fillers)
  {
    name: 'Domino H',
    matrix: [[1, 1]],
    preferredColor: 'yellow',
  },
  {
    name: 'Domino V',
    matrix: [[1], [1]],
    preferredColor: 'purple',
  },
  // Single Dot (rescues tight boards)
  {
    name: 'Dot',
    matrix: [[1]],
    preferredColor: 'yellow',
  },
  // Small T-Shape
  {
    name: 'Mini T',
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    preferredColor: 'purple',
  },
];

// Board dimensions matching the screenshot: 6 rows x 8 columns (compact, fast & fun!)
const GRID_ROWS = 6;
const GRID_COLS = 8;

interface CellState {
  filled: boolean;
  color?: BlockColorTheme['id'];
}

// Empty 6x8 board so the player always starts with a clean board and lays the first block themselves
const createEmptyGrid = (): CellState[][] =>
  Array.from({ length: GRID_ROWS }, () =>
    Array.from({ length: GRID_COLS }, () => ({ filled: false }))
  );

// Initial 3 pieces matching the screenshot tray: Blue L-corner, Yellow 2x2 square, Green 1x4 bar
const createScreenshotStarterTray = (): (BlockPiece | null)[] => [
  {
    id: 'init_0',
    name: 'Corner BL',
    matrix: [
      [1, 0],
      [1, 1],
    ],
    color: 'blue',
  },
  {
    id: 'init_1',
    name: 'Square 2x2',
    matrix: [
      [1, 1],
      [1, 1],
    ],
    color: 'yellow',
  },
  {
    id: 'init_2',
    name: 'Bar 4H',
    matrix: [[1, 1, 1, 1]],
    color: 'green',
  },
];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

// Reusable 3D Beveled Glossy Block Tile (matches screenshot blocks)
const GlossyBlockTile: React.FC<{
  color: BlockColorTheme['id'];
  isClearing?: boolean;
  isGhost?: boolean;
  isInvalidGhost?: boolean;
  sizeClass?: string;
}> = ({ color, isClearing = false, isGhost = false, isInvalidGhost = false, sizeClass = 'w-full h-full' }) => {
  const theme = BLOCK_COLORS[color] || BLOCK_COLORS.blue;

  if (isInvalidGhost) {
    return (
      <div
        className={`${sizeClass} rounded-[6px] bg-rose-500/35 border-2 border-dashed border-rose-300/80 animate-pulse`}
      />
    );
  }

  return (
    <div
      className={`relative ${sizeClass} rounded-[6px] select-none overflow-hidden transition-transform duration-150 ${
        isClearing ? 'scale-110 brightness-150 animate-ping' : ''
      } ${isGhost ? 'opacity-65 scale-95 ring-2 ring-white/80 animate-pulse' : ''}`}
      style={{
        backgroundColor: theme.mainBg,
        boxShadow: isGhost
          ? 'none'
          : `inset 0 3px 0 ${theme.topHighlight}, inset 3px 0 0 ${theme.topHighlight}88, inset 0 -3.5px 0 ${theme.bottomShade}, inset -3px 0 0 ${theme.bottomShade}aa, 0 2px 4px rgba(0,0,0,0.45)`,
      }}
    >
      {/* Inner recessed glossy face */}
      <div
        className="absolute inset-[3px] rounded-[3.5px]"
        style={{
          background: theme.innerFace,
          boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.4)',
        }}
      />
      {/* Top specular highlight bar */}
      <div
        className="absolute top-[3.5px] left-[5px] right-[5px] h-[3px] rounded-full opacity-55 pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, rgba(255,255,255,0.7), rgba(255,255,255,0.15))',
        }}
      />
    </div>
  );
};

export const BlockBlastGame: React.FC = () => {
  const { formatNaira, claimBlockBlastReward } = useAuth();

  // Game Board State (6 rows x 8 cols) — starts completely empty
  const [grid, setGrid] = useState<CellState[][]>(() => createEmptyGrid());

  // 3 Tray Pieces
  const [trayPieces, setTrayPieces] = useState<(BlockPiece | null)[]>(() => createScreenshotStarterTray());

  // Selected piece index (for tap or drag)
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<[number, number] | null>(null);

  // Score & Best Score
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [sessionEarnings, setSessionEarnings] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('9jacash_blockblast_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // UI Modals & Audio
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  // Clearing rows/cols animation
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [clearingCols, setClearingCols] = useState<number[]>([]);

  // Floating Praise / Cash Popups
  const [floatingBanner, setFloatingBanner] = useState<{
    id: number;
    title: string;
    cashText?: string;
  } | null>(null);

  // Particle Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animRef = useRef<number | null>(null);

  // Dragging refs
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragPieceIndexRef = useRef<number | null>(null);
  const boardRef = useRef<HTMLDivElement | null>(null);

  // -------------------------------------------------------------
  // Particle Explosion Loop
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let active = true;
    const render = () => {
      if (!active) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const list = particlesRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.16;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          list.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size, 2);
        ctx.fill();
        ctx.restore();
      }

      animRef.current = requestAnimationFrame(render);
    };

    animRef.current = requestAnimationFrame(render);
    return () => {
      active = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  const spawnCellParticles = useCallback((r: number, c: number, colorId?: BlockColorTheme['id']) => {
    const board = boardRef.current;
    if (!board) return;
    const rect = board.getBoundingClientRect();
    const cellW = rect.width / GRID_COLS;
    const cellH = rect.height / GRID_ROWS;

    const cx = c * cellW + cellW / 2;
    const cy = r * cellH + cellH / 2;
    const hex = colorId ? BLOCK_COLORS[colorId].hex : '#ffd633';

    for (let i = 0; i < 10; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.8 + Math.random() * 4.5;
      particlesRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: hex,
        size: 5 + Math.random() * 4,
        alpha: 1,
        decay: 0.025 + Math.random() * 0.02,
      });
    }
  }, []);

  // -------------------------------------------------------------
  // Placement Validation Helpers
  // -------------------------------------------------------------
  const canPlacePiece = useCallback(
    (board: CellState[][], piece: BlockPiece, startR: number, startC: number): boolean => {
      const rows = piece.matrix.length;
      const cols = piece.matrix[0].length;

      if (startR < 0 || startC < 0 || startR + rows > GRID_ROWS || startC + cols > GRID_COLS) {
        return false;
      }

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (piece.matrix[r][c] === 1 && board[startR + r][startC + c].filled) {
            return false;
          }
        }
      }
      return true;
    },
    []
  );

  const canPieceFitAnywhere = useCallback(
    (board: CellState[][], piece: BlockPiece): boolean => {
      const rows = piece.matrix.length;
      const cols = piece.matrix[0].length;
      for (let r = 0; r <= GRID_ROWS - rows; r++) {
        for (let c = 0; c <= GRID_COLS - cols; c++) {
          if (canPlacePiece(board, piece, r, c)) return true;
        }
      }
      return false;
    },
    [canPlacePiece]
  );

  // Smart, easy-mode tray generator: ensures pieces fit on the current board so gameplay stays fun!
  const generateSmartTray = useCallback(
    (board: CellState[][]): (BlockPiece | null)[] => {
      const fittingTemplates = EASY_SHAPES.filter((tpl) => {
        const testPiece: BlockPiece = {
          id: 'test',
          name: tpl.name,
          matrix: tpl.matrix,
          color: 'blue',
        };
        return canPieceFitAnywhere(board, testPiece);
      });

      const pool = fittingTemplates.length > 0 ? fittingTemplates : EASY_SHAPES;

      return [0, 1, 2].map((slot) => {
        // Guarantee at least the first two pieces come from the fitting pool
        const sourcePool = slot < 2 ? pool : EASY_SHAPES;
        const tpl = sourcePool[Math.floor(Math.random() * sourcePool.length)];
        const color =
          tpl.preferredColor && Math.random() > 0.35
            ? tpl.preferredColor
            : COLOR_KEYS[Math.floor(Math.random() * COLOR_KEYS.length)];

        return {
          id: `piece_${Date.now()}_${slot}_${Math.random().toString(36).substring(2, 6)}`,
          name: tpl.name,
          matrix: tpl.matrix,
          color,
        };
      });
    },
    [canPieceFitAnywhere]
  );

  // Find nearest valid position around clicked cell for effortless tap-to-place
  const findBestPlacementNear = useCallback(
    (board: CellState[][], piece: BlockPiece, clickR: number, clickC: number): [number, number] | null => {
      const pRows = piece.matrix.length;
      const pCols = piece.matrix[0].length;

      // 1. Try centered on clicked cell
      const centerR = Math.max(0, Math.min(GRID_ROWS - pRows, clickR - Math.floor(pRows / 2)));
      const centerC = Math.max(0, Math.min(GRID_COLS - pCols, clickC - Math.floor(pCols / 2)));
      if (canPlacePiece(board, piece, centerR, centerC)) {
        return [centerR, centerC];
      }

      // 2. Try exact top-left at clicked cell
      if (canPlacePiece(board, piece, clickR, clickC)) {
        return [clickR, clickC];
      }

      // 3. Search within 1-cell radius for forgiving placement
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = centerR + dr;
          const nc = centerC + dc;
          if (canPlacePiece(board, piece, nr, nc)) {
            return [nr, nc];
          }
        }
      }

      return null;
    },
    [canPlacePiece]
  );

  // -------------------------------------------------------------
  // Execute Piece Placement & Line Blast
  // -------------------------------------------------------------
  const placePieceAt = (pieceIdx: number, startR: number, startC: number) => {
    const piece = trayPieces[pieceIdx];
    if (!piece) return;

    if (!canPlacePiece(grid, piece, startR, startC)) {
      if (!isMuted) soundFx.playLoseSound();
      return;
    }

    if (!isMuted) soundFx.playBlockPlace();

    const nextGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    let blocksPlaced = 0;

    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] === 1) {
          nextGrid[startR + r][startC + c] = {
            filled: true,
            color: piece.color,
          };
          blocksPlaced++;
        }
      }
    }

    const basePoints = blocksPlaced * 10;
    const updatedScoreAfterPlace = score + basePoints;
    setScore(updatedScoreAfterPlace);

    const nextTray = [...trayPieces];
    nextTray[pieceIdx] = null;
    setSelectedPieceIndex(null);
    setHoverPos(null);

    // Check completed rows & columns
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    for (let r = 0; r < GRID_ROWS; r++) {
      if (nextGrid[r].every((cell) => cell.filled)) {
        fullRows.push(r);
      }
    }

    for (let c = 0; c < GRID_COLS; c++) {
      let colComplete = true;
      for (let r = 0; r < GRID_ROWS; r++) {
        if (!nextGrid[r][c].filled) {
          colComplete = false;
          break;
        }
      }
      if (colComplete) fullCols.push(c);
    }

    const linesCount = fullRows.length + fullCols.length;

    if (linesCount > 0) {
      setClearingRows(fullRows);
      setClearingCols(fullCols);

      const newCombo = combo + 1;
      setCombo(newCombo);

      if (!isMuted) {
        soundFx.playBlockBlastClear(linesCount, newCombo);
        if (newCombo >= 2) {
          setTimeout(() => soundFx.playComboFanfare(newCombo), 100);
        }
      }

      const cellsToClear = new Set<string>();
      fullRows.forEach((r) => {
        for (let c = 0; c < GRID_COLS; c++) cellsToClear.add(`${r},${c}`);
      });
      fullCols.forEach((c) => {
        for (let r = 0; r < GRID_ROWS; r++) cellsToClear.add(`${r},${c}`);
      });

      cellsToClear.forEach((key) => {
        const [r, c] = key.split(',').map(Number);
        spawnCellParticles(r, c, nextGrid[r][c].color);
      });

      const blastBonus = linesCount * 120 * newCombo;
      const finalScore = updatedScoreAfterPlace + blastBonus;
      setScore(finalScore);

      if (finalScore > highScore) {
        setHighScore(finalScore);
        localStorage.setItem('9jacash_blockblast_highscore', finalScore.toString());
      }

      // Credit real 9jacash balance
      const reward = claimBlockBlastReward(linesCount, newCombo, finalScore);
      const praiseWords = [' SWEET!', 'GREAT!', 'AMAZING!', 'UNBELIEVABLE!', 'SUPER BLAST!'];
      const praise = praiseWords[Math.min(praiseWords.length - 1, linesCount + newCombo - 2)];

      if (reward && reward.success) {
        setSessionEarnings((prev) => prev + reward.amount);
        setFloatingBanner({
          id: Date.now(),
          title: `${praise} ${newCombo > 1 ? `x${newCombo}` : ''}`,
          cashText: `+${formatNaira(reward.amount)}`,
        });
      } else {
        setFloatingBanner({
          id: Date.now(),
          title: `${praise}! +${blastBonus}`,
        });
      }

      setTimeout(() => setFloatingBanner(null), 1600);

      setTimeout(() => {
        cellsToClear.forEach((key) => {
          const [r, c] = key.split(',').map(Number);
          nextGrid[r][c] = { filled: false };
        });

        setGrid(nextGrid);
        setClearingRows([]);
        setClearingCols([]);
        finishTurn(nextGrid, nextTray);
      }, 300);
    } else {
      setCombo(0);
      setGrid(nextGrid);
      if (updatedScoreAfterPlace > highScore) {
        setHighScore(updatedScoreAfterPlace);
        localStorage.setItem('9jacash_blockblast_highscore', updatedScoreAfterPlace.toString());
      }
      finishTurn(nextGrid, nextTray);
    }
  };

  const finishTurn = (currentGrid: CellState[][], currentTray: (BlockPiece | null)[]) => {
    let activeTray = currentTray;
    if (currentTray.every((p) => p === null)) {
      activeTray = generateSmartTray(currentGrid);
      setTrayPieces(activeTray);
    } else {
      setTrayPieces(activeTray);
    }

    // Check if any remaining piece fits
    setTimeout(() => {
      const remaining = activeTray.filter((p): p is BlockPiece => p !== null);
      if (remaining.length > 0 && !remaining.some((p) => canPieceFitAnywhere(currentGrid, p))) {
        if (!isMuted) soundFx.playBlockGameOver();
        setIsGameOver(true);
      }
    }, 120);
  };

  // -------------------------------------------------------------
  // Pointer / Touch Dragging & Tap-to-Place
  // -------------------------------------------------------------
  const handleTrayPieceStart = (idx: number, e: React.TouchEvent | React.MouseEvent) => {
    if (isGameOver || !trayPieces[idx]) return;
    dragPieceIndexRef.current = idx;
    setSelectedPieceIndex(idx);
    setIsDragging(true);
    updateHoverFromPointer(e, idx);
  };

  const updateHoverFromPointer = (e: React.TouchEvent | React.MouseEvent, idxOverride?: number) => {
    const idx = idxOverride ?? dragPieceIndexRef.current ?? selectedPieceIndex;
    if (idx === null || !trayPieces[idx]) return;

    const board = boardRef.current;
    if (!board) return;

    let clientX = 0;
    let clientY = 0;
    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY - 55; // Slight lift above finger
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = board.getBoundingClientRect();
    if (
      clientX < rect.left - 16 ||
      clientX > rect.right + 16 ||
      clientY < rect.top - 16 ||
      clientY > rect.bottom + 16
    ) {
      setHoverPos(null);
      return;
    }

    const cellW = rect.width / GRID_COLS;
    const cellH = rect.height / GRID_ROWS;
    const piece = trayPieces[idx]!;
    const pRows = piece.matrix.length;
    const pCols = piece.matrix[0].length;

    const rawC = Math.floor((clientX - rect.left) / cellW - pCols / 2 + 0.5);
    const rawR = Math.floor((clientY - rect.top) / cellH - pRows / 2 + 0.5);

    const clampedR = Math.max(0, Math.min(GRID_ROWS - pRows, rawR));
    const clampedC = Math.max(0, Math.min(GRID_COLS - pCols, rawC));

    setHoverPos([clampedR, clampedC]);
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    updateHoverFromPointer(e);
  };

  const handlePointerEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const idx = dragPieceIndexRef.current;
    if (idx !== null && hoverPos !== null && trayPieces[idx]) {
      const piece = trayPieces[idx]!;
      if (canPlacePiece(grid, piece, hoverPos[0], hoverPos[1])) {
        placePieceAt(idx, hoverPos[0], hoverPos[1]);
      } else {
        setHoverPos(null);
      }
    } else {
      setHoverPos(null);
    }
    dragPieceIndexRef.current = null;
  };

  const handleCellClick = (r: number, c: number) => {
    if (isGameOver) return;
    // Auto-select first available piece if user taps board directly
    let activeIdx = selectedPieceIndex;
    if (activeIdx === null || !trayPieces[activeIdx]) {
      const firstAvailable = trayPieces.findIndex((p) => p !== null);
      if (firstAvailable === -1) return;
      activeIdx = firstAvailable;
      setSelectedPieceIndex(activeIdx);
    }

    const piece = trayPieces[activeIdx];
    if (!piece) return;

    const bestSpot = findBestPlacementNear(grid, piece, r, c);
    if (bestSpot) {
      placePieceAt(activeIdx, bestSpot[0], bestSpot[1]);
    } else {
      if (!isMuted) soundFx.playLoseSound();
    }
  };

  const handleRestart = () => {
    if (!isMuted) soundFx.playClick();
    const freshGrid = createEmptyGrid();
    setGrid(freshGrid);
    setTrayPieces(generateSmartTray(freshGrid));
    setSelectedPieceIndex(null);
    setHoverPos(null);
    setScore(0);
    setCombo(0);
    setIsGameOver(false);
    setShowSettingsModal(false);
    setClearingRows([]);
    setClearingCols([]);
  };

  // Compute Ghost cells map
  const ghostMap = useMemo(() => {
    const map = new Map<string, { valid: boolean; color: BlockColorTheme['id'] }>();
    if (selectedPieceIndex === null || hoverPos === null) return map;
    const piece = trayPieces[selectedPieceIndex];
    if (!piece) return map;

    const [sr, sc] = hoverPos;
    const valid = canPlacePiece(grid, piece, sr, sc);

    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] === 1) {
          const br = sr + r;
          const bc = sc + c;
          if (br >= 0 && br < GRID_ROWS && bc >= 0 && bc < GRID_COLS) {
            map.set(`${br},${bc}`, { valid, color: piece.color });
          }
        }
      }
    }
    return map;
  }, [selectedPieceIndex, hoverPos, trayPieces, grid, canPlacePiece]);

  return (
    <div
      className="mx-auto max-w-[345px] w-full select-none touch-none"
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerEnd}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerEnd}
    >
      {/* ================= ROYAL BLUE ARCADE CABINET CARD (MATCHING SCREENSHOT) ================= */}
      <div
        className="relative overflow-hidden rounded-[28px] p-3.5 shadow-2xl border-2 border-[#3b62d9]/60"
        style={{
          background: 'linear-gradient(165deg, #2145bd 0%, #1b38a3 55%, #162d87 100%)',
        }}
      >
        {/* Subtle decorative background wave shapes like screenshot */}
        <div
          className="
            pointer-events-none absolute -top-12 -right-12 w-40 h-40 rounded-full opacity-25
          "
          style={{ background: '#112473' }}
        />
        <div
          className="
            pointer-events-none absolute -bottom-16 -left-12 w-44 h-44 rounded-full opacity-25
          "
          style={{ background: '#2c54db' }}
        />

        {/* ================= TOP HEADER (LOGO + CROWN SCORE + SETTINGS GEAR) ================= */}
        <div className="relative z-10 flex items-center justify-between mb-3 px-1">
          {/* Left: BLOCK BLAST 3D Cartoon Logo with Crown */}
          <div className="flex flex-col items-start leading-none">
            <div className="relative flex items-center tracking-tighter font-black text-[22px] drop-shadow-[0_3px_0_#0b1646]">
              <span className="text-[#ff6a1a] -rotate-6 inline-block">B</span>
              <span className="text-[#36e024] -rotate-2 inline-block">L</span>
              <span className="relative text-[#ffc812] inline-block mx-0.5">
                {/* Little Golden Crown perched above the O */}
                <svg
                  viewBox="0 0 24 18"
                  className="w-4 h-3.5 absolute -top-3 left-1/2 -translate-x-1/2 -rotate-6 drop-shadow-[0_1px_1px_rgba(0,0,0,0.6)]"
                >
                  <path
                    d="M2 15L4 5L9 10L12 3L15 10L20 5L22 15H2Z"
                    fill="#ffd426"
                    stroke="#b87d00"
                    strokeWidth="1.5"
                  />
                </svg>
                O
              </span>
              <span className="text-[#ff4791] rotate-3 inline-block">C</span>
              <span className="text-[#b042ff] rotate-6 inline-block">K</span>
            </div>
            <div
              className="text-[14px] font-black tracking-wider uppercase -mt-1 px-1 rounded"
              style={{
                color: '#2be4ff',
                textShadow: '0 2px 0 #091340, 0 0 6px rgba(43,228,255,0.4)',
              }}
            >
              BLAST
            </div>
          </div>

          {/* Center: Golden Crown + Big Score + Best */}
          <div className="flex flex-col items-center">
            {/* Golden Crown SVG */}
            <svg
              viewBox="0 0 32 24"
              className="w-7 h-5 mb-0.5 drop-shadow-[0_0_8px_rgba(255,200,18,0.6)]"
            >
              <path
                d="M3 20L6 7L12 13L16 4L20 13L26 7L29 20H3Z"
                fill="url(#crownGrad)"
                stroke="#d48800"
                strokeWidth="1.5"
              />
              <circle cx="6" cy="5.5" r="2" fill="#ffe66d" />
              <circle cx="16" cy="2.5" r="2.2" fill="#fff099" />
              <circle cx="26" cy="5.5" r="2" fill="#ffe66d" />
              <defs>
                <linearGradient id="crownGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffe34d" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>

            <div className="text-[28px] font-black text-white leading-none tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.45)]">
              {score}
            </div>
            <div className="text-[11px] font-extrabold mt-0.5 tracking-tight">
              <span className="text-[#ffc812]">Best: </span>
              <span className="text-white">{highScore}</span>
            </div>
          </div>

          {/* Right: Cash Won Badge + Settings Gear */}
          <div className="flex flex-col items-end gap-1.5">
            <button
              type="button"
              onClick={() => {
                if (!isMuted) soundFx.playClick();
                setShowSettingsModal(true);
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-[#cfe0ff] hover:text-white hover:bg-white/10 transition-transform active:scale-90 cursor-pointer"
              title="Game Settings"
            >
              <Settings className="w-6 h-6 stroke-[2.2]" />
            </button>

            <div className="px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/50 text-[10px] font-black text-emerald-300 font-mono">
              +{formatNaira(sessionEarnings)}
            </div>
          </div>
        </div>

        {/* ================= FLOATING PRAISE / CASH BANNER ================= */}
        {floatingBanner && (
          <div className="pointer-events-none absolute top-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center animate-in zoom-in-90 fade-in duration-150">
            <div
              className="px-3.5 py-1 rounded-2xl font-black text-base tracking-wide text-white shadow-xl border border-amber-300/80"
              style={{
                background: 'linear-gradient(90deg, #f59e0b, #ef4444, #ec4899)',
                textShadow: '0 2px 0 rgba(0,0,0,0.4)',
              }}
            >
              {floatingBanner.title}
            </div>
            {floatingBanner.cashText && (
              <div className="mt-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-black font-black text-xs shadow-lg">
                {floatingBanner.cashText}
              </div>
            )}
          </div>
        )}

        {/* ================= COMPACT 6x8 PUZZLE GRID (MATCHING SCREENSHOT) ================= */}
        <div className="relative z-10">
          {/* Particle Canvas Overlay */}
          <canvas
            ref={canvasRef}
            width={320}
            height={240}
            className="pointer-events-none absolute inset-0 w-full h-full z-20"
          />

          <div
            ref={boardRef}
            className="p-2 rounded-[16px] border-[3px] border-[#263f9c] shadow-[inset_0_4px_10px_rgba(0,0,0,0.65)]"
            style={{ backgroundColor: '#0b1542' }}
          >
            <div
              className="grid grid-cols-8 gap-[3.5px] w-full"
              style={{ aspectRatio: '8 / 6' }}
            >
              {grid.map((row, r) =>
                row.map((cell, c) => {
                  const ghost = ghostMap.get(`${r},${c}`);
                  const isClearing = clearingRows.includes(r) || clearingCols.includes(c);

                  return (
                    <div
                      key={`${r}-${c}`}
                      onClick={() => handleCellClick(r, c)}
                      onMouseEnter={() => {
                        if (selectedPieceIndex !== null && !isDragging) {
                          const piece = trayPieces[selectedPieceIndex];
                          if (piece) {
                            const best = findBestPlacementNear(grid, piece, r, c);
                            setHoverPos(best || [r, c]);
                          }
                        }
                      }}
                      className="relative rounded-[6px] p-[0.5px] cursor-pointer transition-colors"
                      style={{
                        backgroundColor: '#12205c',
                        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.55)',
                      }}
                    >
                      {cell.filled && cell.color ? (
                        <GlossyBlockTile color={cell.color} isClearing={isClearing} />
                      ) : ghost ? (
                        <GlossyBlockTile
                          color={ghost.color}
                          isGhost={ghost.valid}
                          isInvalidGhost={!ghost.valid}
                        />
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ================= BOTTOM UNIFIED PIECE TRAY (MATCHING SCREENSHOT) ================= */}
        <div
          className="relative z-10 mt-3 rounded-[18px] px-2 py-3 border border-[#3252bd]/60 shadow-[inset_0_2px_6px_rgba(0,0,0,0.45)]"
          style={{
            background: 'linear-gradient(180deg, #162b82 0%, #12236e 100%)',
          }}
        >
          <div className="grid grid-cols-3 items-center justify-items-center min-h-[74px]">
            {trayPieces.map((piece, idx) => {
              if (!piece) {
                return <div key={`empty_${idx}`} className="w-16 h-16" />;
              }

              const isSelected = selectedPieceIndex === idx;
              const fits = canPieceFitAnywhere(grid, piece);

              return (
                <div
                  key={piece.id}
                  onTouchStart={(e) => handleTrayPieceStart(idx, e)}
                  onMouseDown={(e) => handleTrayPieceStart(idx, e)}
                  onClick={() => {
                    if (selectedPieceIndex === idx) {
                      setSelectedPieceIndex(null);
                      setHoverPos(null);
                    } else {
                      setSelectedPieceIndex(idx);
                      if (!isMuted) soundFx.playClick();
                    }
                  }}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-xl cursor-pointer transition-transform duration-150 ${
                    !fits
                      ? 'opacity-35 grayscale'
                      : isSelected
                      ? 'scale-110 ring-2 ring-[#ffc812] bg-white/10 shadow-lg'
                      : 'hover:scale-105 active:scale-95'
                  }`}
                >
                  <div
                    className="grid gap-[2.5px]"
                    style={{
                      gridTemplateColumns: `repeat(${piece.matrix[0].length}, 18px)`,
                      gridAutoRows: '18px',
                    }}
                  >
                    {piece.matrix.map((row, r) =>
                      row.map((val, c) => (
                        <div key={`${r}-${c}`} className="w-[18px] h-[18px]">
                          {val === 1 ? <GlossyBlockTile color={piece.color} /> : null}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Subtle helper hint */}
          <div className="text-center text-[10px] font-bold text-[#9cb8ff] mt-1">
            {selectedPieceIndex !== null
              ? 'Tap any spot on the board to place block!'
              : 'Tap or drag a block above onto the board'}
          </div>
        </div>
      </div>

      {/* ================= SETTINGS / PAUSE MODAL (FROM GEAR ICON) ================= */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-[300px] rounded-3xl p-5 border-2 border-[#3b62d9] text-white space-y-3.5 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #1e3fae 0%, #132878 100%)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black tracking-wide uppercase text-[#ffc812]">
                Game Menu
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => setIsMuted(!isMuted)}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-[#102061] hover:bg-[#162b80] border border-white/15 flex items-center justify-between text-xs font-bold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  {isMuted ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-emerald-400" />
                  )}
                  Sound Effects
                </span>
                <span className={isMuted ? 'text-rose-400' : 'text-emerald-400'}>
                  {isMuted ? 'OFF' : 'ON'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  setShowHowToPlay(true);
                }}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-[#102061] hover:bg-[#162b80] border border-white/15 flex items-center justify-between text-xs font-bold cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-sky-400" />
                  How to Play
                </span>
                <span className="text-white/60">View</span>
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="w-full py-2.5 px-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 stroke-[2.5]" />
                Restart Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= HOW TO PLAY MODAL ================= */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div
            className="w-full max-w-[310px] rounded-3xl p-5 border-2 border-[#3b62d9] text-white space-y-3.5 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #1e3fae 0%, #132878 100%)' }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#ffc812]">How to Play</h3>
              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs text-blue-100 leading-relaxed">
              <p>
                <strong>1. Place Blocks:</strong> Drag or tap any of the 3 blocks at the bottom onto the grid.
              </p>
              <p>
                <strong>2. Blast Full Lines:</strong> Fill any horizontal row (8 blocks) or vertical column (6 blocks) to blast it!
              </p>
              <p>
                <strong>3. Earn Instant Naira:</strong> Every line blast credits <strong>₦500 – ₦3,500+</strong> straight to your 9jacash wallet!
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-2.5 rounded-2xl bg-[#ffc812] text-black font-black text-xs cursor-pointer"
            >
              Let's Play!
            </button>
          </div>
        </div>
      )}

      {/* ================= GAME OVER MODAL ================= */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-[310px] rounded-3xl p-6 border-2 border-[#ffc812] text-center text-white space-y-4 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #1e3fae 0%, #112266 100%)' }}
          >
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#ffc812] flex items-center justify-center shadow-lg">
              <Trophy className="w-8 h-8 text-black" />
            </div>

            <div>
              <h2 className="text-xl font-black text-white">Round Complete!</h2>
              <p className="text-xs text-blue-200 mt-0.5">No more spaces left for remaining blocks</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#0b1542] border border-white/15 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-blue-200">Score</span>
                <span className="font-black text-[#ffc812]">{score}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Best Score</span>
                <span className="font-bold text-white">{highScore}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-white/10">
                <span className="text-emerald-300 font-bold">Cash Won</span>
                <span className="font-black text-emerald-400">+{formatNaira(sessionEarnings)}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRestart}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#ffc812] to-[#ff9900] text-black font-black text-sm flex items-center justify-center gap-2 shadow-xl cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
