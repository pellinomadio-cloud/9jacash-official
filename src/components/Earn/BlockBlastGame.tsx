import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { soundFx } from '../../utils/sound.ts';
import {
  Sparkles,
  Trophy,
  RotateCcw,
  Volume2,
  VolumeX,
  Zap,
  Flame,
  Award,
  HelpCircle,
  X,
  Crown,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

// ==========================================
// BLOCK SHAPES DEFINITION
// ==========================================

export interface BlockShape {
  id: string;
  name: string;
  matrix: number[][]; // 2D array of 0s and 1s
  colorId: string;
  colorName: string;
  gradient: string;
  borderColor: string;
  shadowColor: string;
  lightGradient: string;
}

// 7 Vibrant, Jewel-Tone Block Palettes
const BLOCK_THEMES = [
  {
    id: 'emerald',
    name: 'Emerald',
    gradient: 'from-emerald-400 via-emerald-500 to-teal-600',
    lightGradient: 'from-emerald-400 via-emerald-500 to-teal-600',
    borderColor: 'border-emerald-300',
    shadowColor: 'rgba(16, 185, 129, 0.45)',
    fillHex: '#10b981',
  },
  {
    id: 'amber',
    name: 'Gold Amber',
    gradient: 'from-amber-300 via-amber-400 to-yellow-600',
    lightGradient: 'from-amber-400 via-yellow-500 to-amber-600',
    borderColor: 'border-amber-200',
    shadowColor: 'rgba(245, 158, 11, 0.45)',
    fillHex: '#f59e0b',
  },
  {
    id: 'cyan',
    name: 'Electric Cyan',
    gradient: 'from-cyan-400 via-sky-500 to-blue-600',
    lightGradient: 'from-cyan-400 via-sky-500 to-blue-600',
    borderColor: 'border-cyan-200',
    shadowColor: 'rgba(6, 182, 212, 0.45)',
    fillHex: '#06b6d4',
  },
  {
    id: 'pink',
    name: 'Ruby Pink',
    gradient: 'from-pink-400 via-rose-500 to-rose-600',
    lightGradient: 'from-pink-400 via-rose-500 to-rose-600',
    borderColor: 'border-pink-200',
    shadowColor: 'rgba(244, 63, 94, 0.45)',
    fillHex: '#f43f5e',
  },
  {
    id: 'violet',
    name: 'Amethyst',
    gradient: 'from-purple-400 via-violet-500 to-indigo-600',
    lightGradient: 'from-purple-400 via-violet-500 to-indigo-600',
    borderColor: 'border-violet-200',
    shadowColor: 'rgba(139, 92, 246, 0.45)',
    fillHex: '#8b5cf6',
  },
  {
    id: 'orange',
    name: 'Solar Flare',
    gradient: 'from-orange-400 via-orange-500 to-red-600',
    lightGradient: 'from-orange-400 via-orange-500 to-red-600',
    borderColor: 'border-orange-200',
    shadowColor: 'rgba(249, 115, 22, 0.45)',
    fillHex: '#f97316',
  },
  {
    id: 'lime',
    name: 'Neon Lime',
    gradient: 'from-lime-300 via-lime-500 to-emerald-600',
    lightGradient: 'from-lime-400 via-lime-500 to-emerald-600',
    borderColor: 'border-lime-200',
    shadowColor: 'rgba(132, 204, 22, 0.45)',
    fillHex: '#84cc16',
  },
];

// Block Shape Templates
const RAW_SHAPES: { name: string; matrix: number[][] }[] = [
  // 1x1 Single
  { name: 'Dot', matrix: [[1]] },

  // 1x2, 2x1
  { name: 'Domino H', matrix: [[1, 1]] },
  { name: 'Domino V', matrix: [[1], [1]] },

  // 1x3, 3x1
  { name: 'Trio H', matrix: [[1, 1, 1]] },
  { name: 'Trio V', matrix: [[1], [1], [1]] },

  // 1x4, 4x1
  { name: 'Tetra H', matrix: [[1, 1, 1, 1]] },
  { name: 'Tetra V', matrix: [[1], [1], [1], [1]] },

  // 1x5, 5x1
  { name: 'Penta H', matrix: [[1, 1, 1, 1, 1]] },
  { name: 'Penta V', matrix: [[1], [1], [1], [1], [1]] },

  // 2x2 Square
  {
    name: 'Square 2x2',
    matrix: [
      [1, 1],
      [1, 1],
    ],
  },

  // 3x3 Big Square (rare rewarding piece)
  {
    name: 'Big Square 3x3',
    matrix: [
      [1, 1, 1],
      [1, 1, 1],
      [1, 1, 1],
    ],
  },

  // Corner Small (2x2 with 1 missing)
  {
    name: 'Corner Top-Left',
    matrix: [
      [1, 1],
      [1, 0],
    ],
  },
  {
    name: 'Corner Top-Right',
    matrix: [
      [1, 1],
      [0, 1],
    ],
  },
  {
    name: 'Corner Bottom-Left',
    matrix: [
      [1, 0],
      [1, 1],
    ],
  },
  {
    name: 'Corner Bottom-Right',
    matrix: [
      [0, 1],
      [1, 1],
    ],
  },

  // 3x3 Big Corner
  {
    name: 'Big Corner TL',
    matrix: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
    ],
  },
  {
    name: 'Big Corner BR',
    matrix: [
      [0, 0, 1],
      [0, 0, 1],
      [1, 1, 1],
    ],
  },

  // L-Shapes (3x2)
  {
    name: 'L-Shape Normal',
    matrix: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
  },
  {
    name: 'J-Shape Normal',
    matrix: [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
  },
  {
    name: 'L-Shape Rotated',
    matrix: [
      [1, 1, 1],
      [1, 0, 0],
    ],
  },
  {
    name: 'J-Shape Rotated',
    matrix: [
      [1, 1, 1],
      [0, 0, 1],
    ],
  },

  // T-Shapes
  {
    name: 'T-Shape Up',
    matrix: [
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
  {
    name: 'T-Shape Down',
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
    ],
  },

  // Z and S Shapes
  {
    name: 'Z-Shape',
    matrix: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
  {
    name: 'S-Shape',
    matrix: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },

  // Plus Shape
  {
    name: 'Plus Shape',
    matrix: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
  },
];

// Helper to generate a random shape
const generateRandomPiece = (slotIndex: number): BlockShape => {
  const template = RAW_SHAPES[Math.floor(Math.random() * RAW_SHAPES.length)];
  const theme = BLOCK_THEMES[Math.floor(Math.random() * BLOCK_THEMES.length)];
  return {
    id: `piece_${Date.now()}_${slotIndex}_${Math.random().toString(36).substring(2, 7)}`,
    name: template.name,
    matrix: template.matrix,
    colorId: theme.id,
    colorName: theme.name,
    gradient: theme.gradient,
    lightGradient: theme.lightGradient,
    borderColor: theme.borderColor,
    shadowColor: theme.shadowColor,
  };
};

// Generates 3 pieces for the tray
const generatePieceTray = (): (BlockShape | null)[] => {
  return [generateRandomPiece(0), generateRandomPiece(1), generateRandomPiece(2)];
};

// 8x8 Grid
const GRID_SIZE = 8;

interface CellState {
  filled: boolean;
  colorId?: string;
  gradient?: string;
  borderColor?: string;
  shadowColor?: string;
}

// Particle for blast bursts
interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

interface ToastNotification {
  id: number;
  text: string;
  subtext?: string;
  type: 'blast' | 'combo' | 'cash';
}

export const BlockBlastGame: React.FC = () => {
  const { isLight } = useTheme();
  const { user, formatNaira, claimBlockBlastReward } = useAuth();

  // Grid state: 8x8
  const [grid, setGrid] = useState<CellState[][]>(() => {
    return Array.from({ length: GRID_SIZE }, () =>
      Array.from({ length: GRID_SIZE }, () => ({ filled: false }))
    );
  });

  // 3 Pieces in Tray
  const [trayPieces, setTrayPieces] = useState<(BlockShape | null)[]>(() => generatePieceTray());

  // Selected piece for Tap-to-Place or active drag
  const [selectedPieceIndex, setSelectedPieceIndex] = useState<number | null>(null);

  // Hover position on grid [row, col] (top-left offset of the piece)
  const [hoverPos, setHoverPos] = useState<[number, number] | null>(null);

  // Game Stats
  const [score, setScore] = useState<number>(0);
  const [combo, setCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [linesClearedTotal, setLinesClearedTotal] = useState<number>(0);
  const [sessionEarnings, setSessionEarnings] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('9jacash_blockblast_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });

  // Game Over state
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [showHowToPlay, setShowHowToPlay] = useState<boolean>(false);

  // Active clearing animation lines: indices of rows and columns being blasted
  const [clearingRows, setClearingRows] = useState<number[]>([]);
  const [clearingCols, setClearingCols] = useState<number[]>([]);

  // Floating notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const toastIdRef = useRef(1);

  // Canvas for 60fps explosion particle effects
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);

  // Dragging state tracking
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragPieceIndexRef = useRef<number | null>(null);
  const boardContainerRef = useRef<HTMLDivElement | null>(null);

  // -------------------------------------------------------------
  // Particle System Animation Loop
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      if (!running) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15; // gentle gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Spawn blast particles from cell coordinates
  const triggerCellBlastParticles = useCallback((row: number, col: number, colorHex: string) => {
    const canvas = canvasRef.current;
    const board = boardContainerRef.current;
    if (!canvas || !board) return;

    const rect = board.getBoundingClientRect();
    const cellWidth = rect.width / GRID_SIZE;
    const cellHeight = rect.height / GRID_SIZE;

    const centerX = col * cellWidth + cellWidth / 2;
    const centerY = row * cellHeight + cellHeight / 2;

    const particleCount = 14;
    for (let i = 0; i < particleCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      particlesRef.current.push({
        id: Math.random(),
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colorHex,
        size: 3 + Math.random() * 3.5,
        alpha: 1,
        decay: 0.02 + Math.random() * 0.025,
      });
    }
  }, []);

  const addToast = (text: string, subtext?: string, type: 'blast' | 'combo' | 'cash' = 'blast') => {
    const id = toastIdRef.current++;
    setToasts((prev) => [...prev.slice(-3), { id, text, subtext, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2400);
  };

  // -------------------------------------------------------------
  // Shape Validation & Placement Checks
  // -------------------------------------------------------------
  const canPlacePiece = useCallback(
    (board: CellState[][], shape: BlockShape, startRow: number, startCol: number): boolean => {
      const matrix = shape.matrix;
      const rows = matrix.length;
      const cols = matrix[0].length;

      // Check bounds
      if (startRow < 0 || startCol < 0 || startRow + rows > GRID_SIZE || startCol + cols > GRID_SIZE) {
        return false;
      }

      // Check overlapping with filled cells
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (matrix[r][c] === 1) {
            if (board[startRow + r][startCol + c].filled) {
              return false;
            }
          }
        }
      }

      return true;
    },
    []
  );

  // Check if a piece can fit ANYWHERE on the board
  const canPieceFitAnywhere = useCallback(
    (board: CellState[][], piece: BlockShape): boolean => {
      const rows = piece.matrix.length;
      const cols = piece.matrix[0].length;

      for (let r = 0; r <= GRID_SIZE - rows; r++) {
        for (let c = 0; c <= GRID_SIZE - cols; c++) {
          if (canPlacePiece(board, piece, r, c)) {
            return true;
          }
        }
      }
      return false;
    },
    [canPlacePiece]
  );

  // Check if any available pieces in tray can still fit on board
  const checkGameOverCondition = useCallback(
    (board: CellState[][], pieces: (BlockShape | null)[]) => {
      const activePieces = pieces.filter((p): p is BlockShape => p !== null);
      if (activePieces.length === 0) return false;

      const hasValidMove = activePieces.some((piece) => canPieceFitAnywhere(board, piece));
      if (!hasValidMove) {
        if (!isMuted) soundFx.playBlockGameOver();
        setIsGameOver(true);
        return true;
      }
      return false;
    },
    [canPieceFitAnywhere, isMuted]
  );

  // -------------------------------------------------------------
  // Place Piece on Grid Logic
  // -------------------------------------------------------------
  const placePieceAt = (pieceIndex: number, targetRow: number, targetCol: number) => {
    const piece = trayPieces[pieceIndex];
    if (!piece) return;

    if (!canPlacePiece(grid, piece, targetRow, targetCol)) {
      if (!isMuted) soundFx.playLoseSound();
      return;
    }

    // Play tactile placement snap sound
    if (!isMuted) soundFx.playBlockPlace();

    // 1. Create updated grid with new piece filled
    const nextGrid = grid.map((row) => row.map((cell) => ({ ...cell })));
    const matrix = piece.matrix;
    let placedCellCount = 0;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          nextGrid[targetRow + r][targetCol + c] = {
            filled: true,
            colorId: piece.colorId,
            gradient: piece.gradient,
            borderColor: piece.borderColor,
            shadowColor: piece.shadowColor,
          };
          placedCellCount++;
        }
      }
    }

    // Add points for placing piece (10 points per cell)
    const placePoints = placedCellCount * 10;
    const newScore = score + placePoints;
    setScore(newScore);

    // 2. Consume piece from tray
    const nextTray = [...trayPieces];
    nextTray[pieceIndex] = null;

    // Reset selection and hover
    setSelectedPieceIndex(null);
    setHoverPos(null);

    // 3. Check for full rows and full columns
    const fullRows: number[] = [];
    const fullCols: number[] = [];

    // Check rows
    for (let r = 0; r < GRID_SIZE; r++) {
      if (nextGrid[r].every((cell) => cell.filled)) {
        fullRows.push(r);
      }
    }

    // Check columns
    for (let c = 0; c < GRID_SIZE; c++) {
      let isColFull = true;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (!nextGrid[r][c].filled) {
          isColFull = false;
          break;
        }
      }
      if (isColFull) {
        fullCols.push(c);
      }
    }

    const totalLinesCleared = fullRows.length + fullCols.length;

    if (totalLinesCleared > 0) {
      // Line Clears!
      setClearingRows(fullRows);
      setClearingCols(fullCols);

      const nextCombo = combo + 1;
      setCombo(nextCombo);
      if (nextCombo > maxCombo) {
        setMaxCombo(nextCombo);
      }

      // Audio feedback
      if (!isMuted) {
        soundFx.playBlockBlastClear(totalLinesCleared, nextCombo);
        if (nextCombo >= 2) {
          setTimeout(() => soundFx.playComboFanfare(nextCombo), 120);
        }
      }

      // Trigger particle explosions for all cleared cells
      const clearedSet = new Set<string>();
      fullRows.forEach((r) => {
        for (let c = 0; c < GRID_SIZE; c++) {
          clearedSet.add(`${r},${c}`);
        }
      });
      fullCols.forEach((c) => {
        for (let r = 0; r < GRID_SIZE; r++) {
          clearedSet.add(`${r},${c}`);
        }
      });

      clearedSet.forEach((key) => {
        const [r, c] = key.split(',').map(Number);
        const cell = nextGrid[r][c];
        const theme = BLOCK_THEMES.find((t) => t.id === cell.colorId) || BLOCK_THEMES[0];
        triggerCellBlastParticles(r, c, theme.fillHex);
      });

      // Score calculation: 100 points per line + combo bonus
      const lineScore = totalLinesCleared * 100 * (1 + nextCombo * 0.5);
      const totalScoreWithLines = Math.floor(newScore + lineScore);
      setScore(totalScoreWithLines);
      setLinesClearedTotal((prev) => prev + totalLinesCleared);

      // Update High Score
      if (totalScoreWithLines > highScore) {
        setHighScore(totalScoreWithLines);
        localStorage.setItem('9jacash_blockblast_highscore', totalScoreWithLines.toString());
      }

      // Credit real 9jacash reward
      const rewardResult = claimBlockBlastReward(totalLinesCleared, nextCombo, totalScoreWithLines);
      if (rewardResult && rewardResult.success) {
        setSessionEarnings((prev) => prev + rewardResult.amount);
        addToast(
          `+${formatNaira(rewardResult.amount)} Won!`,
          `${totalLinesCleared} ${totalLinesCleared > 1 ? 'Lines' : 'Line'} Blasted${nextCombo > 1 ? ` • x${nextCombo} Streak` : ''}`,
          'cash'
        );
      } else {
        addToast(
          `💥 ${totalLinesCleared} ${totalLinesCleared > 1 ? 'Lines' : 'Line'} Blasted!`,
          nextCombo > 1 ? `Combo Streak x${nextCombo} 🔥` : undefined,
          'blast'
        );
      }

      // Delay clearing to allow blast animation to play
      setTimeout(() => {
        // Clear cells on grid
        clearedSet.forEach((key) => {
          const [r, c] = key.split(',').map(Number);
          nextGrid[r][c] = { filled: false };
        });

        setGrid(nextGrid);
        setClearingRows([]);
        setClearingCols([]);

        // Check if tray is empty -> refill
        handleTrayReplenishAndCheck(nextGrid, nextTray);
      }, 350);
    } else {
      // No lines cleared this turn, reset combo streak
      setCombo(0);
      setGrid(nextGrid);

      // Update High Score for placed piece
      if (newScore > highScore) {
        setHighScore(newScore);
        localStorage.setItem('9jacash_blockblast_highscore', newScore.toString());
      }

      handleTrayReplenishAndCheck(nextGrid, nextTray);
    }
  };

  // Helper to refill tray when all 3 pieces are used & check game over
  const handleTrayReplenishAndCheck = (currentGrid: CellState[][], currentTray: (BlockShape | null)[]) => {
    let activeTray = currentTray;
    if (currentTray.every((p) => p === null)) {
      activeTray = generatePieceTray();
      setTrayPieces(activeTray);
      if (!isMuted) soundFx.playWheelPegTick(1.2);
    } else {
      setTrayPieces(activeTray);
    }

    // Check if player has any legal moves left
    setTimeout(() => {
      checkGameOverCondition(currentGrid, activeTray);
    }, 150);
  };

  // -------------------------------------------------------------
  // Drag & Drop Handlers (Touch + Mouse)
  // -------------------------------------------------------------
  const handlePieceTouchStart = (pieceIdx: number, e: React.TouchEvent | React.MouseEvent) => {
    if (isGameOver || !trayPieces[pieceIdx]) return;
    dragPieceIndexRef.current = pieceIdx;
    setSelectedPieceIndex(pieceIdx);
    setIsDragging(true);
    updateHoverFromPointer(e, pieceIdx);
  };

  const updateHoverFromPointer = (e: React.TouchEvent | React.MouseEvent, pieceIdxOverride?: number) => {
    const pieceIdx = pieceIdxOverride ?? dragPieceIndexRef.current ?? selectedPieceIndex;
    if (pieceIdx === null || !trayPieces[pieceIdx]) return;

    const board = boardContainerRef.current;
    if (!board) return;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      // Apply vertical touch offset (60px above finger) so the piece isn't hidden under user's thumb
      clientY = e.touches[0].clientY - 60;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = board.getBoundingClientRect();
    if (
      clientX < rect.left - 20 ||
      clientX > rect.right + 20 ||
      clientY < rect.top - 20 ||
      clientY > rect.bottom + 20
    ) {
      setHoverPos(null);
      return;
    }

    const cellWidth = rect.width / GRID_SIZE;
    const cellHeight = rect.height / GRID_SIZE;

    const shape = trayPieces[pieceIdx];
    if (!shape) return;

    // Center the piece around pointer
    const shapeRows = shape.matrix.length;
    const shapeCols = shape.matrix[0].length;

    const targetCol = Math.floor((clientX - rect.left) / cellWidth - shapeCols / 2 + 0.5);
    const targetRow = Math.floor((clientY - rect.top) / cellHeight - shapeRows / 2 + 0.5);

    const clampedRow = Math.max(0, Math.min(GRID_SIZE - shapeRows, targetRow));
    const clampedCol = Math.max(0, Math.min(GRID_SIZE - shapeCols, targetCol));

    setHoverPos([clampedRow, clampedCol]);
  };

  const handlePointerMove = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDragging) return;
    updateHoverFromPointer(e);
  };

  const handlePointerEnd = () => {
    if (!isDragging) return;
    setIsDragging(false);

    const pieceIdx = dragPieceIndexRef.current;
    if (pieceIdx !== null && hoverPos !== null && trayPieces[pieceIdx]) {
      const shape = trayPieces[pieceIdx]!;
      if (canPlacePiece(grid, shape, hoverPos[0], hoverPos[1])) {
        placePieceAt(pieceIdx, hoverPos[0], hoverPos[1]);
      } else {
        setHoverPos(null);
      }
    } else {
      setHoverPos(null);
    }

    dragPieceIndexRef.current = null;
  };

  // -------------------------------------------------------------
  // Tap-to-Place Logic (Mobile & Desktop friendly alternative)
  // -------------------------------------------------------------
  const handleBoardCellClick = (r: number, c: number) => {
    if (isGameOver) return;
    if (selectedPieceIndex === null || !trayPieces[selectedPieceIndex]) {
      return;
    }

    const shape = trayPieces[selectedPieceIndex];
    if (!shape) return;

    // Place piece with top-left anchor at clicked cell or adjusted center
    const shapeRows = shape.matrix.length;
    const shapeCols = shape.matrix[0].length;

    // Test exact cell first
    if (canPlacePiece(grid, shape, r, c)) {
      placePieceAt(selectedPieceIndex, r, c);
      return;
    }

    // If exact doesn't fit, test centered around clicked cell
    const centeredRow = Math.max(0, Math.min(GRID_SIZE - shapeRows, r - Math.floor(shapeRows / 2)));
    const centeredCol = Math.max(0, Math.min(GRID_SIZE - shapeCols, c - Math.floor(shapeCols / 2)));
    if (canPlacePiece(grid, shape, centeredRow, centeredCol)) {
      placePieceAt(selectedPieceIndex, centeredRow, centeredCol);
      return;
    }

    if (!isMuted) soundFx.playLoseSound();
  };

  // -------------------------------------------------------------
  // Restart Game
  // -------------------------------------------------------------
  const handleRestartGame = () => {
    if (!isMuted) soundFx.playClick();
    setGrid(
      Array.from({ length: GRID_SIZE }, () =>
        Array.from({ length: GRID_SIZE }, () => ({ filled: false }))
      )
    );
    setTrayPieces(generatePieceTray());
    setSelectedPieceIndex(null);
    setHoverPos(null);
    setScore(0);
    setCombo(0);
    setIsGameOver(false);
    setClearingRows([]);
    setClearingCols([]);
    addToast('🎮 Fresh Game Started!', 'Fill rows & columns to blast blocks', 'blast');
  };

  // -------------------------------------------------------------
  // Compute Ghost Preview Cells
  // -------------------------------------------------------------
  const ghostCellsMap = useMemo(() => {
    const map = new Map<string, { isValid: boolean; colorId: string }>();
    if (selectedPieceIndex === null || hoverPos === null) return map;

    const piece = trayPieces[selectedPieceIndex];
    if (!piece) return map;

    const [startR, startC] = hoverPos;
    const isValid = canPlacePiece(grid, piece, startR, startC);

    const matrix = piece.matrix;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c] === 1) {
          const boardR = startR + r;
          const boardC = startC + c;
          if (boardR >= 0 && boardR < GRID_SIZE && boardC >= 0 && boardC < GRID_SIZE) {
            map.set(`${boardR},${boardC}`, { isValid, colorId: piece.colorId });
          }
        }
      }
    }

    return map;
  }, [selectedPieceIndex, hoverPos, trayPieces, grid, canPlacePiece]);

  return (
    <div
      className="space-y-4 select-none touch-none animate-in fade-in duration-200"
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerEnd}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerEnd}
    >
      {/* ================= TOP SCORE BAR ================= */}
      <div
        className={`p-3.5 rounded-3xl border shadow-xl flex items-center justify-between gap-2 ${
          isLight
            ? 'bg-gradient-to-r from-amber-50/80 via-white to-pink-50/60 border-amber-300 shadow-amber-500/10'
            : 'bg-gradient-to-r from-[#171322] via-[#14151f] to-[#121c24] border-stone-800 shadow-2xl'
        }`}
      >
        {/* Score & High Score */}
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 p-0.5 shadow-md flex-shrink-0">
            <div
              className={`w-full h-full rounded-[14px] flex items-center justify-center ${
                isLight ? 'bg-white' : 'bg-[#15121c]'
              }`}
            >
              <Trophy className="w-5 h-5 text-amber-500" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                Score
              </span>
              {combo > 1 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-gradient-to-r from-orange-500 to-amber-500 text-white animate-pulse">
                  x{combo} Streak 🔥
                </span>
              )}
            </div>
            <div className={`text-2xl font-black font-mono tracking-tight leading-none ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {score.toLocaleString()}
            </div>
            <div className={`text-[10px] font-medium flex items-center gap-1 mt-0.5 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              <span>Best:</span>
              <span className="font-mono font-bold text-amber-500">{highScore.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Live Earnings & Controls */}
        <div className="flex items-center gap-2">
          {/* Real Wallet Balance Earned */}
          <div
            className={`px-3 py-1.5 rounded-2xl border text-right ${
              isLight
                ? 'bg-emerald-50 border-emerald-300 shadow-sm'
                : 'bg-emerald-500/15 border-emerald-500/30'
            }`}
          >
            <span className={`text-[9px] uppercase font-black block tracking-wider ${isLight ? 'text-emerald-700' : 'text-emerald-400'}`}>
              Cash Won
            </span>
            <span className={`text-sm font-black font-mono leading-none ${isLight ? 'text-emerald-800' : 'text-emerald-300'}`}>
              +{formatNaira(sessionEarnings)}
            </span>
          </div>

          {/* Audio Mute Button */}
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-300'
            }`}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-amber-500" />}
          </button>

          {/* How to play */}
          <button
            type="button"
            onClick={() => setShowHowToPlay(true)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-300'
            }`}
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4 text-sky-500" />
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={handleRestartGame}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer border ${
              isLight
                ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                : 'bg-stone-800/80 hover:bg-stone-700 border-stone-700 text-stone-300'
            }`}
            title="Restart Game"
          >
            <RotateCcw className="w-4 h-4 text-emerald-500" />
          </button>
        </div>
      </div>

      {/* ================= FLOATING TOASTS ================= */}
      {toasts.length > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-1.5 pointer-events-none">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              className={`px-4 py-2 rounded-2xl shadow-2xl border text-center animate-in fade-in zoom-in-95 duration-200 backdrop-blur-md ${
                toast.type === 'cash'
                  ? 'bg-emerald-600/95 text-white border-emerald-300 shadow-emerald-500/30'
                  : toast.type === 'combo'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black border-amber-300 shadow-amber-500/30'
                  : 'bg-gradient-to-r from-pink-600 to-violet-600 text-white border-pink-300 shadow-pink-500/30'
              }`}
            >
              <div className="text-sm font-black tracking-tight">{toast.text}</div>
              {toast.subtext && <div className="text-[11px] opacity-90 font-medium">{toast.subtext}</div>}
            </div>
          ))}
        </div>
      )}

      {/* ================= MAIN 8x8 BOARD CONTAINER ================= */}
      <div className="relative mx-auto max-w-[390px] w-full">
        {/* Explosion Canvas Overlay */}
        <canvas
          ref={canvasRef}
          width={390}
          height={390}
          className="absolute inset-0 z-20 pointer-events-none rounded-3xl"
        />

        {/* Board Surface */}
        <div
          ref={boardContainerRef}
          className={`relative p-3 rounded-3xl border-2 shadow-2xl transition-all ${
            isLight
              ? 'bg-slate-100/90 border-slate-300/80 shadow-slate-300/60'
              : 'bg-[#101118] border-stone-800 shadow-black'
          }`}
        >
          {/* 8x8 Grid Cells */}
          <div className="grid grid-cols-8 gap-1.5 aspect-square w-full">
            {grid.map((row, r) =>
              row.map((cell, c) => {
                const ghost = ghostCellsMap.get(`${r},${c}`);
                const isClearingRow = clearingRows.includes(r);
                const isClearingCol = clearingCols.includes(c);
                const isClearing = isClearingRow || isClearingCol;

                // Color Theme lookup
                const cellTheme = BLOCK_THEMES.find((t) => t.id === cell.colorId) || BLOCK_THEMES[0];
                const ghostTheme = ghost ? BLOCK_THEMES.find((t) => t.id === ghost.colorId) || BLOCK_THEMES[0] : null;

                return (
                  <div
                    key={`${r}-${c}`}
                    onClick={() => handleBoardCellClick(r, c)}
                    onMouseEnter={() => {
                      if (selectedPieceIndex !== null && !isDragging) {
                        setHoverPos([r, c]);
                      }
                    }}
                    className={`relative rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer overflow-hidden ${
                      // 1. Filled Cell
                      cell.filled
                        ? `bg-gradient-to-br ${
                            isLight ? cellTheme.lightGradient : cellTheme.gradient
                          } border-t-2 border-l border-white/50 border-b-2 border-r border-black/40 shadow-sm ${
                            isClearing ? 'scale-110 brightness-150 animate-ping' : ''
                          }`
                        : // 2. Ghost Preview Cell (Hovering / Dragging)
                        ghost
                        ? ghost.isValid
                          ? `bg-gradient-to-br ${
                              isLight ? ghostTheme?.lightGradient : ghostTheme?.gradient
                            } opacity-60 border-2 border-dashed border-white animate-pulse`
                          : 'bg-rose-500/30 border-2 border-dashed border-rose-400 opacity-70'
                        : // 3. Empty Board Cell
                        isLight
                        ? 'bg-white/80 hover:bg-white border border-slate-200/90 shadow-inner'
                        : 'bg-[#181924] hover:bg-[#1f2030] border border-stone-800/80'
                    }`}
                  >
                    {/* Inner 3D Gloss Sheen on Filled Cell */}
                    {cell.filled && (
                      <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute top-0.5 left-0.5 right-0.5 h-1/3 bg-white/30 rounded-t-lg backdrop-blur-xs" />
                        <div className="absolute bottom-1 right-1 w-1.5 h-1.5 rounded-full bg-white/40" />
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* ================= TRAY: 3 SHAPES SELECTION ================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <span className={`text-[11px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
            {selectedPieceIndex !== null ? 'Tap Board to Place or Drag Block' : 'Choose a Block to Place'}
          </span>
          <span className={`text-[11px] font-mono ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
            Lines Cleared: <strong className="text-amber-500">{linesClearedTotal}</strong>
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2.5">
          {trayPieces.map((piece, idx) => {
            if (!piece) {
              return (
                <div
                  key={`empty_${idx}`}
                  className={`h-28 rounded-2xl border-2 border-dashed flex items-center justify-center opacity-30 ${
                    isLight ? 'border-slate-300 bg-slate-50' : 'border-stone-800 bg-[#12131b]'
                  }`}
                >
                  <Sparkles className="w-5 h-5 text-stone-500" />
                </div>
              );
            }

            const isSelected = selectedPieceIndex === idx;
            const pieceTheme = BLOCK_THEMES.find((t) => t.id === piece.colorId) || BLOCK_THEMES[0];
            const canFit = canPieceFitAnywhere(grid, piece);

            return (
              <div
                key={piece.id}
                onTouchStart={(e) => handlePieceTouchStart(idx, e)}
                onMouseDown={(e) => handlePieceTouchStart(idx, e)}
                onClick={() => {
                  if (selectedPieceIndex === idx) {
                    setSelectedPieceIndex(null);
                    setHoverPos(null);
                  } else {
                    setSelectedPieceIndex(idx);
                    if (!isMuted) soundFx.playClick();
                  }
                }}
                className={`h-28 rounded-2xl border-2 flex flex-col items-center justify-center p-2 cursor-pointer transition-all active:scale-95 group relative ${
                  !canFit
                    ? 'opacity-40 grayscale cursor-not-allowed border-rose-500/40'
                    : isSelected
                    ? isLight
                      ? 'bg-amber-50 border-amber-400 shadow-lg shadow-amber-500/20 scale-105 ring-2 ring-amber-400'
                      : 'bg-[#201c2b] border-amber-400 shadow-xl shadow-amber-500/25 scale-105 ring-2 ring-amber-400'
                    : isLight
                    ? 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-md hover:border-amber-400/60'
                    : 'bg-[#151622] hover:bg-[#1a1b2a] border-stone-800 shadow-lg hover:border-stone-700'
                }`}
              >
                {/* Visual Mini Matrix of the Block */}
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${piece.matrix[0].length}, minmax(0, 1fr))`,
                  }}
                >
                  {piece.matrix.map((row, r) =>
                    row.map((val, c) => (
                      <div
                        key={`${r}-${c}`}
                        className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md transition-all ${
                          val === 1
                            ? `bg-gradient-to-br ${
                                isLight ? pieceTheme.lightGradient : pieceTheme.gradient
                              } border-t border-l border-white/60 border-b border-r border-black/30 shadow-sm`
                            : 'opacity-0'
                        }`}
                      />
                    ))
                  )}
                </div>

                {/* Status indicator badge */}
                <div className="mt-1.5 flex items-center gap-1">
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider ${
                      isSelected ? 'text-amber-500' : isLight ? 'text-slate-500' : 'text-stone-400'
                    }`}
                  >
                    {isSelected ? 'Ready' : piece.name.split(' ')[0]}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= EARNINGS INFO FOOTER ================= */}
      <div
        className={`p-3.5 rounded-2xl border flex items-center justify-between text-xs ${
          isLight
            ? 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-sm'
            : 'bg-[#181622] border-amber-500/30 text-amber-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            Blasts credit up to <strong>₦3,500</strong> per multi-line clear + streak bonuses straight to your wallet.
          </span>
        </div>
        <span className="font-mono font-bold text-amber-500 whitespace-nowrap">₦500/Line</span>
      </div>

      {/* ================= GAME OVER MODAL ================= */}
      {isGameOver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 border-2 text-center space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 ${
              isLight
                ? 'bg-white border-amber-300 text-slate-900'
                : 'bg-gradient-to-b from-[#1e1728] via-[#141520] to-[#101018] border-amber-500/50 text-white'
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-tr from-rose-500 via-amber-500 to-yellow-400 p-0.5 shadow-xl shadow-amber-500/30 flex items-center justify-center">
              <div
                className={`w-full h-full rounded-3xl flex items-center justify-center ${
                  isLight ? 'bg-amber-50' : 'bg-[#14111d]'
                }`}
              >
                <Trophy className="w-8 h-8 text-amber-500" />
              </div>
            </div>

            <div className="space-y-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30">
                No Moves Left
              </span>
              <h2 className="text-2xl font-black tracking-tight">Game Complete!</h2>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                Great puzzle run! Here are your block blast achievements:
              </p>
            </div>

            {/* Score & Rewards Breakdown */}
            <div
              className={`p-4 rounded-2xl border text-left space-y-2.5 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#191924] border-stone-800'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Final Score</span>
                <span className="text-base font-black font-mono text-amber-500">{score.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Total Lines Blasted</span>
                <span className="text-xs font-bold font-mono">{linesClearedTotal} lines</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className={`text-xs ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Highest Combo Streak</span>
                <span className="text-xs font-bold text-orange-400">x{maxCombo} Streak 🔥</span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <span className={`text-xs font-bold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Cash Credited to Wallet
                </span>
                <span className="text-base font-black font-mono text-emerald-500">
                  +{formatNaira(sessionEarnings)}
                </span>
              </div>
            </div>

            {/* Play Again Button */}
            <button
              type="button"
              onClick={handleRestartGame}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-500 hover:from-amber-300 hover:to-yellow-400 text-black font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4 stroke-[2.5]" />
              <span>Play Again</span>
            </button>
          </div>
        </div>
      )}

      {/* ================= HOW TO PLAY MODAL ================= */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 border-2 space-y-4 shadow-2xl animate-in zoom-in-95 duration-200 ${
              isLight
                ? 'bg-white border-sky-300 text-slate-900'
                : 'bg-gradient-to-b from-[#151c28] via-[#121620] to-[#0f1118] border-sky-500/50 text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-black flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-sky-400" />
                How to Play Block Blast
              </h3>
              <button
                type="button"
                onClick={() => setShowHowToPlay(false)}
                className={`w-8 h-8 rounded-full flex items-center justify-center cursor-pointer ${
                  isLight ? 'bg-slate-100 hover:bg-slate-200' : 'bg-stone-800 hover:bg-stone-700'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className={`space-y-3 text-xs leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                  1
                </div>
                <span>
                  <strong>Pick a block:</strong> Tap or drag any of the 3 polyomino shapes from the tray below onto the 8x8 grid.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                  2
                </div>
                <span>
                  <strong>Blast Rows &amp; Columns:</strong> Fill complete horizontal rows or vertical columns to blast them off the board.
                </span>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 font-bold text-[10px]">
                  3
                </div>
                <span>
                  <strong>Combos &amp; Real Cash:</strong> Clear consecutive lines or multiple lines together for explosive combo multipliers and instant Naira cash credited to your balance!
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowHowToPlay(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-bold text-xs cursor-pointer shadow-lg"
            >
              Got it, Let's Play!
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
