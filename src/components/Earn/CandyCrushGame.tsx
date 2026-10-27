import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { soundFx } from '../../utils/sound.ts';
import {
  Sparkles,
  RotateCcw,
  Lightbulb,
  Volume2,
  VolumeX,
  Award,
  ArrowRight,
  PartyPopper,
  Maximize2,
  Minimize2,
  Zap,
  Play,
  Flame,
  CheckCircle2,
  Coins,
  ChevronRight,
  Shield,
  Trophy,
  ArrowLeft,
} from 'lucide-react';
import {
  GRID_SIZE,
  BoardShape,
  LevelConfig,
  getLevelConfig,
  getWorldName,
} from './candyShapes.ts';
import { CandyAnimatedBackground } from './CandyAnimatedBackground.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';

// Candy Color / Type Definitions (including special Lightning candy)
export type CandyType = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'lightning';

const REGULAR_CANDY_TYPES: CandyType[] = ['red', 'orange', 'yellow', 'green', 'blue', 'purple'];

interface CandyItem {
  id: string;
  type: CandyType;
  isSpecial?: 'striped_h' | 'striped_v' | 'bomb' | 'lightning';
  isMatched?: boolean;
  isHinted?: boolean;
  isDropping?: boolean;
  dropDelay?: number;
}

interface FloatingScore {
  id: string;
  text: string;
  x: number; // percentage
  y: number; // percentage
  color: string;
  subtext?: string;
}

interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  shape: 'star' | 'circle' | 'spark';
}

interface SwapState {
  r1: number;
  c1: number;
  r2: number;
  c2: number;
  dr: number;
  dc: number;
  isReverting: boolean;
}

interface DragState {
  r: number;
  c: number;
  startX: number;
  startY: number;
  currentDx: number;
  currentDy: number;
  dominantAxis: 'x' | 'y' | null;
  targetNeighbor: { r: number; c: number } | null;
}

interface LightningZapInfo {
  from: { r: number; c: number };
  targets: Array<{ r: number; c: number }>;
  color: CandyType;
}

const LEVEL_STORAGE_KEY_PREFIX = 'candy_crush_level_';

export const CandyCrushGame: React.FC = () => {
  const { isLight } = useTheme();
  const { user, formatNaira, claimCandyMatchReward } = useAuth();

  // Launcher state: whether user has clicked "( Play Game )"
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  // Level Progression: Level 1 to 1,000 (starts at Level 1 for new users)
  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${LEVEL_STORAGE_KEY_PREFIX}${user?.id || 'guest'}`);
      const parsed = saved ? parseInt(saved, 10) : 1;
      return isNaN(parsed) || parsed < 1 ? 1 : Math.min(1000, parsed);
    } catch {
      return 1;
    }
  });

  // Get current level configuration (board shape, target score, moves, world name)
  const levelConfig: LevelConfig = useMemo(() => getLevelConfig(currentLevel), [currentLevel]);

  // Save level progress whenever currentLevel changes
  useEffect(() => {
    try {
      localStorage.setItem(`${LEVEL_STORAGE_KEY_PREFIX}${user?.id || 'guest'}`, currentLevel.toString());
    } catch {
      // Ignore
    }
  }, [currentLevel, user?.id]);

  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Game board & state
  const [board, setBoard] = useState<(CandyItem | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [movesLeft, setMovesLeft] = useState<number>(levelConfig.totalMoves);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [totalEarnedNaira, setTotalEarnedNaira] = useState<number>(0);
  const [comboCount, setComboCount] = useState<number>(0);
  const [highestCombo, setHighestCombo] = useState<number>(0);
  const [totalMatchesMade, setTotalMatchesMade] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [comboBanner, setComboBanner] = useState<{ title: string; subtitle: string; color: string } | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [roundCompleteModal, setRoundCompleteModal] = useState<boolean>(false);
  const [levelWinModal, setLevelWinModal] = useState<boolean>(false);
  const [hintCells, setHintCells] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);
  const [gameMessageToast, setGameMessageToast] = useState<string | null>(null);

  // Movement & Lightning animations
  const [swapState, setSwapState] = useState<SwapState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [lightningZap, setLightningZap] = useState<LightningZapInfo | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ r: number; c: number; x: number; y: number } | null>(null);

  // Has any lightning candy on the board
  const hasLightningOnBoard = useMemo(() => {
    return board.some((row) => row.some((cell) => cell?.isSpecial === 'lightning'));
  }, [board]);

  // Helper to create random candy (never lightning randomly; lightning comes from Match 5)
  const createRandomCandy = (excludedTypes: CandyType[] = []): CandyItem => {
    const available = REGULAR_CANDY_TYPES.filter((t) => !excludedTypes.includes(t));
    const pool = available.length > 0 ? available : REGULAR_CANDY_TYPES;
    const type = pool[Math.floor(Math.random() * pool.length)];
    return {
      id: 'c_' + Math.random().toString(36).substring(2, 9),
      type,
    };
  };

  // Helper: check if swapping creates a match on active cells of this level shape
  const checkSwapCreatesMatch = useCallback(
    (b: (CandyItem | null)[][], shape: BoardShape, r1: number, c1: number, r2: number, c2: number): boolean => {
      if (!shape[r1]?.[c1] || !shape[r2]?.[c2] || !b[r1]?.[c1] || !b[r2]?.[c2]) return false;

      // Special lightning candy always creates a valid move
      if (b[r1][c1]?.isSpecial === 'lightning' || b[r2][c2]?.isSpecial === 'lightning') {
        return true;
      }

      // Clone board and swap
      const copy = b.map((row) => [...row]);
      const temp = copy[r1][c1];
      copy[r1][c1] = copy[r2][c2];
      copy[r2][c2] = temp;

      // Check horizontal matches (3+ identical)
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE - 2; c++) {
          if (!shape[r][c] || !shape[r][c + 1] || !shape[r][c + 2]) continue;
          const type = copy[r][c]?.type;
          if (type && copy[r][c + 1]?.type === type && copy[r][c + 2]?.type === type) {
            return true;
          }
        }
      }
      // Check vertical matches (3+ identical)
      for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = 0; r < GRID_SIZE - 2; r++) {
          if (!shape[r][c] || !shape[r + 1][c] || !shape[r + 2][c]) continue;
          const type = copy[r][c]?.type;
          if (type && copy[r + 1][c]?.type === type && copy[r + 2][c]?.type === type) {
            return true;
          }
        }
      }
      return false;
    },
    []
  );

  // Find any available move on the level's shape
  const findAvailableMove = useCallback(
    (b: (CandyItem | null)[][], shape: BoardShape): { r1: number; c1: number; r2: number; c2: number } | null => {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!shape[r][c] || !b[r][c]) continue;
          // If already a lightning candy, can swap with any neighbor
          if (b[r][c]?.isSpecial === 'lightning') {
            if (c < GRID_SIZE - 1 && shape[r][c + 1] && b[r][c + 1]) {
              return { r1: r, c1: c, r2: r, c2: c + 1 };
            }
            if (r < GRID_SIZE - 1 && shape[r + 1][c] && b[r + 1][c]) {
              return { r1: r, c1: c, r2: r + 1, c2: c };
            }
          }
          // Try right swap
          if (c < GRID_SIZE - 1 && shape[r][c + 1] && checkSwapCreatesMatch(b, shape, r, c, r, c + 1)) {
            return { r1: r, c1: c, r2: r, c2: c + 1 };
          }
          // Try down swap
          if (r < GRID_SIZE - 1 && shape[r + 1][c] && checkSwapCreatesMatch(b, shape, r, c, r + 1, c)) {
            return { r1: r, c1: c, r2: r + 1, c2: c };
          }
        }
      }
      return null;
    },
    [checkSwapCreatesMatch]
  );

  // Generate board conforming to current level's custom shape
  const generateInitialBoardForLevel = useCallback(
    (cfg: LevelConfig): (CandyItem | null)[][] => {
      let newBoard: (CandyItem | null)[][] = [];
      let attempts = 0;

      while (attempts < 50) {
        attempts++;
        newBoard = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          const row: (CandyItem | null)[] = [];
          for (let c = 0; c < GRID_SIZE; c++) {
            if (!cfg.shape[r][c]) {
              row.push(null);
              continue;
            }
            const excluded: CandyType[] = [];
            if (c >= 2 && row[c - 1] && row[c - 2] && row[c - 1]?.type === row[c - 2]?.type) {
              excluded.push(row[c - 1]!.type);
            }
            if (
              r >= 2 &&
              newBoard[r - 1][c] &&
              newBoard[r - 2][c] &&
              newBoard[r - 1][c]?.type === newBoard[r - 2][c]?.type
            ) {
              excluded.push(newBoard[r - 1][c]!.type);
            }
            row.push(createRandomCandy(excluded));
          }
          newBoard.push(row);
        }

        if (findAvailableMove(newBoard, cfg.shape)) {
          return newBoard;
        }
      }
      return newBoard;
    },
    [findAvailableMove]
  );

  // Reset board whenever current level changes
  useEffect(() => {
    const initB = generateInitialBoardForLevel(levelConfig);
    setBoard(initB);
    setMovesLeft(levelConfig.totalMoves);
    setSessionScore(0);
    setTotalEarnedNaira(0);
    setComboCount(0);
    setRoundCompleteModal(false);
    setLevelWinModal(false);
    setSelectedCell(null);
    setHintCells(null);
    setLightningZap(null);
  }, [currentLevel, generateInitialBoardForLevel, levelConfig]);

  // Touch move prevention: prevent screen from moving up and down while swiping candies
  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl) return;

    const preventTouchScroll = (e: TouchEvent) => {
      if (e.cancelable) {
        e.preventDefault();
      }
    };

    boardEl.addEventListener('touchmove', preventTouchScroll, { passive: false });
    return () => {
      boardEl.removeEventListener('touchmove', preventTouchScroll);
    };
  }, [isPlaying, isFullscreen]);

  // Lock body scroll in fullscreen
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'none';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFullscreen(false);
        }
      };

      const handleFullscreenChange = () => {
        if (!document.fullscreenElement && isFullscreen) {
          setIsFullscreen(false);
        }
      };

      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('fullscreenchange', handleFullscreenChange);

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
        window.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
      };
    }
  }, [isFullscreen]);

  // Toggle fullscreen
  const handleToggleFullscreen = async () => {
    soundFx.playClick();
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fallback
      }
    } else {
      setIsFullscreen(false);
      try {
        if (document.fullscreenElement && document.exitFullscreen) {
          await document.exitFullscreen();
        }
      } catch {
        // Ignore
      }
    }
  };

  // Particle explosion spawner
  const spawnParticles = (x: number, y: number, color: string, count = 14) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 6;
      newParticles.push({
        id: 'p_' + Math.random().toString(36).substring(2, 8),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 4 + Math.random() * 6,
        alpha: 1,
        shape: Math.random() > 0.5 ? 'star' : 'circle',
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  // Particle loop
  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy + 0.5,
            alpha: p.alpha - 0.04,
            size: p.size * 0.96,
          }))
          .filter((p) => p.alpha > 0.05)
      );
    }, 24);
    return () => clearInterval(interval);
  }, [particles.length]);

  // Find all matches on active shape cells
  const findAllMatches = (
    b: (CandyItem | null)[][],
    shape: BoardShape
  ): {
    coords: Set<string>;
    matchGroups: Array<{ length: number; type: CandyType; r: number; c: number }>;
  } => {
    const matchedCoords = new Set<string>();
    const matchGroups: Array<{ length: number; type: CandyType; r: number; c: number }> = [];

    // Horizontal check
    for (let r = 0; r < GRID_SIZE; r++) {
      let matchLen = 1;
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!shape[r][c] || !b[r][c]) {
          matchLen = 1;
          continue;
        }

        const currentType = b[r][c]?.type;
        const nextType = c < GRID_SIZE - 1 && shape[r][c + 1] ? b[r][c + 1]?.type : null;
        const isSame = nextType && currentType === nextType && currentType !== 'lightning';

        if (isSame) {
          matchLen++;
        } else {
          if (matchLen >= 3 && currentType) {
            matchGroups.push({
              length: matchLen,
              type: currentType,
              r,
              c: c - Math.floor(matchLen / 2),
            });
            for (let i = 0; i < matchLen; i++) {
              matchedCoords.add(`${r},${c - i}`);
            }
          }
          matchLen = 1;
        }
      }
    }

    // Vertical check
    for (let c = 0; c < GRID_SIZE; c++) {
      let matchLen = 1;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (!shape[r][c] || !b[r][c]) {
          matchLen = 1;
          continue;
        }

        const currentType = b[r][c]?.type;
        const nextType = r < GRID_SIZE - 1 && shape[r + 1][c] ? b[r + 1][c]?.type : null;
        const isSame = nextType && currentType === nextType && currentType !== 'lightning';

        if (isSame) {
          matchLen++;
        } else {
          if (matchLen >= 3 && currentType) {
            matchGroups.push({
              length: matchLen,
              type: currentType,
              r: r - Math.floor(matchLen / 2),
              c,
            });
            for (let i = 0; i < matchLen; i++) {
              matchedCoords.add(`${r - i},${c}`);
            }
          }
          matchLen = 1;
        }
      }
    }

    return { coords: matchedCoords, matchGroups };
  };

  // Combo banner trigger
  const triggerComboBanner = (combo: number, matchMax: number) => {
    let title = 'SWEET! 🍬';
    let subtitle = `+₦500 WON!`;
    let color = 'from-emerald-400 to-teal-500';

    if (matchMax >= 6) {
      title = 'DIVINE MEGA MATCH! 🌟';
      subtitle = 'MATCH 6! +₦1,000 (MAX MOVE PRIZE)!';
      color = 'from-amber-400 via-rose-500 to-purple-600';
    } else if (matchMax === 5) {
      title = '⚡ LIGHTNING CANDY CREATED!';
      subtitle = 'MATCH 5! +₦1,000 (MAX MOVE PRIZE) · Lightning Ready!';
      color = 'from-sky-400 via-blue-500 to-amber-400';
    } else if (matchMax === 4) {
      title = 'TASTY! ✨';
      subtitle = 'MATCH 4! +₦800 NAIRA!';
      color = 'from-yellow-400 to-orange-500';
    } else if (combo >= 4) {
      title = 'UNBELIEVABLE COMBO! 🔥';
      subtitle = `${combo}x CASCADE STREAK (+₦1,000)!`;
      color = 'from-orange-500 to-red-500';
    } else if (combo >= 2) {
      title = 'DELICIOUS COMBO! 🎯';
      subtitle = `Cascade Streak! (+₦500)`;
      color = 'from-sky-400 to-blue-500';
    }

    setComboBanner({ title, subtitle, color });
    setTimeout(() => {
      setComboBanner(null);
    }, 1900);
  };

  // Check if level target score is achieved
  const checkLevelCompletion = useCallback(
    (newScore: number) => {
      if (newScore >= levelConfig.targetScore && !levelWinModal) {
        soundFx.playLevelUp();
        setLevelWinModal(true);
        // Bonus for clearing the level is ₦1,500
        setTotalEarnedNaira((n) => n + 1500);
        claimCandyMatchReward(0, true);
      }
    },
    [claimCandyMatchReward, levelConfig.targetScore, levelWinModal]
  );

  // Gravity cascade drop algorithm supporting arbitrary level shapes
  const dropCandiesAndCascade = useCallback(
    async (currentBoard: (CandyItem | null)[][], coordsToRemove: Set<string>, currentCombo = 1) => {
      const currentShape = levelConfig.shape;
      const newBoard: (CandyItem | null)[][] = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(null));

      for (let c = 0; c < GRID_SIZE; c++) {
        const activeRowsInCol: number[] = [];
        const survivingCandies: CandyItem[] = [];

        for (let r = 0; r < GRID_SIZE; r++) {
          if (currentShape[r][c]) {
            activeRowsInCol.push(r);
            const candy = currentBoard[r][c];
            if (candy && !coordsToRemove.has(`${r},${c}`)) {
              survivingCandies.push(candy);
            }
          }
        }

        const emptySlots = activeRowsInCol.length - survivingCandies.length;
        const freshCandies: CandyItem[] = [];
        for (let i = 0; i < emptySlots; i++) {
          const fresh = createRandomCandy();
          fresh.isDropping = true;
          fresh.dropDelay = i * 40;
          freshCandies.push(fresh);
        }

        const finalColCandies = [...freshCandies, ...survivingCandies];
        activeRowsInCol.forEach((r, idx) => {
          newBoard[r][c] = finalColCandies[idx];
        });
      }

      setBoard(newBoard);

      // Wait for drop bounce animation
      await new Promise((res) => setTimeout(res, 350));

      // Recursive cascade check
      await processMatchesAndCascades(newBoard, currentCombo + 1);
    },
    [levelConfig.shape]
  );

  // Process matches and cascading drops
  const processMatchesAndCascades = useCallback(
    async (currentBoard: (CandyItem | null)[][], currentCombo = 1) => {
      setIsProcessing(true);
      setHintCells(null);

      const { coords, matchGroups } = findAllMatches(currentBoard, levelConfig.shape);

      if (coords.size === 0) {
        const nextMove = findAvailableMove(currentBoard, levelConfig.shape);
        if (!nextMove) {
          setGameMessageToast('No moves available! Reshuffling shape 🎲');
          setTimeout(() => {
            setBoard(generateInitialBoardForLevel(levelConfig));
            setGameMessageToast(null);
            setIsProcessing(false);
          }, 1200);
          return;
        }
        setIsProcessing(false);
        return;
      }

      let maxMatchLen = 3;
      let roundRewardTotal = 0;
      const coordsToDelete = new Set(coords);

      matchGroups.forEach((group) => {
        if (group.length > maxMatchLen) maxMatchLen = group.length;

        // Move match rewards: strictly capped at ₦1,000 maximum even for 5 candies
        // Match 3 = ₦500; Match 4 = ₦800; Match 5+ = ₦1,000
        let prizeAmount = 500;
        if (group.length >= 5) prizeAmount = 1000;
        else if (group.length === 4) prizeAmount = 800;
        else prizeAmount = 500;

        prizeAmount = Math.min(1000, prizeAmount);
        roundRewardTotal += prizeAmount;

        // If Match 5 was formed, SPAWN A LIGHTNING CANDY at the center position!
        if (group.length >= 5) {
          const centerR = group.r;
          const centerC = group.c;
          coordsToDelete.delete(`${centerR},${centerC}`);

          currentBoard[centerR][centerC] = {
            id: 'lightning_' + Math.random().toString(36).substring(2, 7),
            type: 'lightning',
            isSpecial: 'lightning',
          };
          soundFx.playLightningStrike();
        }

        // Spawn floating score over match coordinate
        const posX = ((group.c + 0.5) / GRID_SIZE) * 100;
        const posY = ((group.r + 0.5) / GRID_SIZE) * 100;
        const scoreId = 'sc_' + Math.random().toString(36).substring(2, 7);

        setFloatingScores((prev) => [
          ...prev,
          {
            id: scoreId,
            text: `+₦${prizeAmount.toLocaleString()}`,
            subtext:
              group.length >= 6
                ? 'MEGA 6! 🌟'
                : group.length === 5
                ? '⚡ LIGHTNING CANDY CREATED!'
                : group.length === 4
                ? 'MATCH 4! ⚡'
                : 'MATCH 3 🍬',
            x: posX,
            y: posY,
            color:
              group.length >= 6
                ? 'text-amber-300'
                : group.length === 5
                ? 'text-sky-300'
                : group.length === 4
                ? 'text-yellow-300'
                : 'text-emerald-300',
          },
        ]);

        setTimeout(() => {
          setFloatingScores((prev) => prev.filter((s) => s.id !== scoreId));
        }, 1200);

        // Spawn particles
        const boardEl = boardRef.current;
        if (boardEl) {
          const rect = boardEl.getBoundingClientRect();
          const pX = (posX / 100) * rect.width;
          const pY = (posY / 100) * rect.height;
          const pColor =
            group.type === 'red'
              ? '#ef4444'
              : group.type === 'orange'
              ? '#f97316'
              : group.type === 'yellow'
              ? '#eab308'
              : group.type === 'green'
              ? '#22c55e'
              : group.type === 'blue'
              ? '#3b82f6'
              : '#a855f7';
          spawnParticles(pX, pY, pColor, 14);
        }

        // Real wallet credit
        claimCandyMatchReward(group.length);
      });

      if (!isMuted) {
        soundFx.playCandyMatch(maxMatchLen);
        if (maxMatchLen >= 6) {
          setTimeout(() => soundFx.playSugarCrush(), 250);
        }
      }

      setComboCount((c) => {
        const nextC = c + 1;
        if (nextC > highestCombo) setHighestCombo(nextC);
        return nextC;
      });

      setTotalMatchesMade((m) => m + matchGroups.length);
      const pointsWon = roundRewardTotal * currentCombo;
      setSessionScore((s) => {
        const updated = s + pointsWon;
        checkLevelCompletion(updated);
        return updated;
      });
      setTotalEarnedNaira((n) => n + roundRewardTotal);

      triggerComboBanner(currentCombo, maxMatchLen);

      // Step 1: Mark matching candies for explosion animation (excluding newly spawned lightning candy)
      const boardWithMatches = currentBoard.map((row, r) =>
        row.map((item, c) => {
          if (!item) return null;
          return {
            ...item,
            isMatched: coordsToDelete.has(`${r},${c}`),
          };
        })
      );
      setBoard(boardWithMatches);

      // Wait for burst
      await new Promise((res) => setTimeout(res, 300));

      // Step 2: Gravity drop into shape
      await dropCandiesAndCascade(currentBoard, coordsToDelete, currentCombo);
    },
    [
      checkLevelCompletion,
      claimCandyMatchReward,
      dropCandiesAndCascade,
      findAvailableMove,
      generateInitialBoardForLevel,
      highestCombo,
      isMuted,
      levelConfig,
    ]
  );

  // LIGHTNING OVERLOAD: when lightning candy is swiped into any candy of color X!
  const executeLightningOverload = async (lightningPos: { r: number; c: number }, targetColor: CandyType) => {
    setIsProcessing(true);
    soundFx.playLightningStrike();

    // Find all active candies of this target color on the board
    const targets: Array<{ r: number; c: number }> = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r][c]?.type === targetColor) {
          targets.push({ r, c });
        }
      }
    }

    const totalStruck = targets.length + 1;

    // Set lightning zap beams
    setLightningZap({
      from: lightningPos,
      targets,
      color: targetColor,
    });

    // Lightning Overload Move Win: strictly capped at ₦1,000 maximum per move
    const bigWinPrize = 1000;

    // Mark all target candies + lightning candy as matched for bursting
    const updatedBoard = board.map((row, r) =>
      row.map((item, c) => {
        if (!item) return null;
        if (item.type === targetColor || (r === lightningPos.r && c === lightningPos.c)) {
          return { ...item, isMatched: true };
        }
        return item;
      })
    );
    setBoard(updatedBoard);

    // Credit real wallet reward (capped at ₦1,000)
    claimCandyMatchReward(5, false);

    // Floating mega score
    const scoreId = 'sc_' + Math.random().toString(36).substring(2, 7);
    setFloatingScores((prev) => [
      ...prev,
      {
        id: scoreId,
        text: `+₦${bigWinPrize.toLocaleString()}`,
        subtext: `⚡ COLOR BOMB! All ${targetColor.toUpperCase()} wiped!`,
        x: 50,
        y: 42,
        color: 'text-amber-300',
      },
    ]);

    triggerComboBanner(4, 5);
    setTotalEarnedNaira((n) => n + bigWinPrize);
    setSessionScore((s) => {
      const updated = s + 5000;
      checkLevelCompletion(updated);
      return updated;
    });
    setTotalMatchesMade((m) => m + totalStruck);

    const newMoves = movesLeft - 1;
    setMovesLeft(newMoves);

    // Let the lightning flash and explode candies
    await new Promise((res) => setTimeout(res, 520));
    setLightningZap(null);

    // Gravity drop into cleared holes
    const coordsToDelete = new Set([
      ...targets.map((t) => `${t.r},${t.c}`),
      `${lightningPos.r},${lightningPos.c}`,
    ]);

    await dropCandiesAndCascade(updatedBoard, coordsToDelete, 1);

    if (newMoves <= 0) {
      setTimeout(() => {
        if (!isMuted) soundFx.playSugarCrush();
        setRoundCompleteModal(true);
      }, 1000);
    }
  };

  // Swap handler with animated movement
  const handleSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isProcessing) return;

    // Both must be active shape cells
    if (!levelConfig.shape[r1]?.[c1] || !levelConfig.shape[r2]?.[c2]) return;

    const candy1 = board[r1][c1];
    const candy2 = board[r2][c2];
    if (!candy1 || !candy2) return;

    // Adjacency check
    const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
    if (dist !== 1) {
      setSelectedCell({ r: r2, c: c2 });
      return;
    }

    setIsProcessing(true);
    setSelectedCell(null);
    setHintCells(null);
    setDragState(null);

    // Check if one of them is LIGHTNING CANDY!
    if (candy1.isSpecial === 'lightning' || candy2.isSpecial === 'lightning') {
      const lightningPos = candy1.isSpecial === 'lightning' ? { r: r1, c: c1 } : { r: r2, c: c2 };
      const otherCandy = candy1.isSpecial === 'lightning' ? candy2 : candy1;

      // Swipe lightning candy onto any candy!
      await executeLightningOverload(lightningPos, otherCandy.type);
      return;
    }

    const dr = r2 - r1;
    const dc = c2 - c1;

    // Slide forward animation
    setSwapState({
      r1,
      c1,
      r2,
      c2,
      dr,
      dc,
      isReverting: false,
    });

    if (!isMuted) soundFx.playCandySwap();

    await new Promise((res) => setTimeout(res, 220));

    // Evaluate hypothetical swapped board
    const nextBoard = board.map((row) => [...row]);
    const temp = nextBoard[r1][c1];
    nextBoard[r1][c1] = nextBoard[r2][c2];
    nextBoard[r2][c2] = temp;

    const { coords } = findAllMatches(nextBoard, levelConfig.shape);

    if (coords.size === 0) {
      // Invalid swap: recoil shake and slide back
      setSwapState({
        r1,
        c1,
        r2,
        c2,
        dr,
        dc,
        isReverting: true,
      });

      if (!isMuted) soundFx.playInvalidSwap();

      await new Promise((res) => setTimeout(res, 220));
      setSwapState(null);
      setIsProcessing(false);
      return;
    }

    // Valid swap!
    setSwapState(null);
    setBoard(nextBoard);

    const newMoves = movesLeft - 1;
    setMovesLeft(newMoves);
    setComboCount(1);

    await processMatchesAndCascades(nextBoard, 1);

    if (newMoves <= 0) {
      setTimeout(() => {
        if (!isMuted) soundFx.playSugarCrush();
        setRoundCompleteModal(true);
      }, 1000);
    }
  };

  // Cell click handler
  const handleCellClick = (r: number, c: number) => {
    if (isProcessing || movesLeft <= 0 || !levelConfig.shape[r]?.[c] || !board[r]?.[c]) return;

    if (!selectedCell) {
      if (!isMuted) soundFx.playClick();
      setSelectedCell({ r, c });
      setHintCells(null);
    } else {
      if (selectedCell.r === r && selectedCell.c === c) {
        setSelectedCell(null);
      } else {
        handleSwap(selectedCell.r, selectedCell.c, r, c);
      }
    }
  };

  // Touch Swipe Handlers for responsive candy movement
  const handleTouchStart = (r: number, c: number, e: React.TouchEvent) => {
    if (isProcessing || movesLeft <= 0 || !levelConfig.shape[r]?.[c] || !board[r]?.[c]) return;
    const touch = e.touches[0];
    touchStartRef.current = { r, c, x: touch.clientX, y: touch.clientY };
    setDragState({
      r,
      c,
      startX: touch.clientX,
      startY: touch.clientY,
      currentDx: 0,
      currentDy: 0,
      dominantAxis: null,
      targetNeighbor: null,
    });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || isProcessing || movesLeft <= 0) return;
    const touch = e.touches[0];
    const rawDx = touch.clientX - touchStartRef.current.x;
    const rawDy = touch.clientY - touchStartRef.current.y;
    const { r, c } = touchStartRef.current;

    const absDx = Math.abs(rawDx);
    const absDy = Math.abs(rawDy);
    const maxOffset = 52;

    let dominantAxis: 'x' | 'y' = absDx >= absDy ? 'x' : 'y';
    let targetNeighbor: { r: number; c: number } | null = null;
    let clampedDx = 0;
    let clampedDy = 0;

    if (dominantAxis === 'x') {
      const dir = rawDx > 0 ? 1 : -1;
      const targetC = c + dir;
      if (targetC >= 0 && targetC < GRID_SIZE && levelConfig.shape[r]?.[targetC]) {
        clampedDx = Math.max(-maxOffset, Math.min(maxOffset, rawDx));
        targetNeighbor = { r, c: targetC };
      }
    } else {
      const dir = rawDy > 0 ? 1 : -1;
      const targetR = r + dir;
      if (targetR >= 0 && targetR < GRID_SIZE && levelConfig.shape[targetR]?.[c]) {
        clampedDy = Math.max(-maxOffset, Math.min(maxOffset, rawDy));
        targetNeighbor = { r: targetR, c };
      }
    }

    setDragState({
      r,
      c,
      startX: touchStartRef.current.x,
      startY: touchStartRef.current.y,
      currentDx: clampedDx,
      currentDy: clampedDy,
      dominantAxis,
      targetNeighbor,
    });
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || isProcessing || movesLeft <= 0) {
      setDragState(null);
      touchStartRef.current = null;
      return;
    }

    const { r, c } = touchStartRef.current;
    const currentDrag = dragState;
    touchStartRef.current = null;
    setDragState(null);

    if (!currentDrag) {
      handleCellClick(r, c);
      return;
    }

    const absDx = Math.abs(currentDrag.currentDx);
    const absDy = Math.abs(currentDrag.currentDy);
    const minThreshold = 22;

    if (absDx < minThreshold && absDy < minThreshold) {
      handleCellClick(r, c);
      return;
    }

    if (currentDrag.targetNeighbor) {
      handleSwap(r, c, currentDrag.targetNeighbor.r, currentDrag.targetNeighbor.c);
    }
  };

  // Hint button
  const handleRequestHint = () => {
    if (isProcessing || movesLeft <= 0) return;
    soundFx.playClick();
    const move = findAvailableMove(board, levelConfig.shape);
    if (move) {
      setHintCells(move);
      setGameMessageToast('💡 Hint found! Swap the glowing candies to match!');
      setTimeout(() => setGameMessageToast(null), 3000);
    } else {
      setGameMessageToast('No moves available! Reshuffling shape...');
      setTimeout(() => {
        setBoard(generateInitialBoardForLevel(levelConfig));
        setGameMessageToast(null);
      }, 1000);
    }
  };

  // Shuffle board
  const handleShuffleBoard = () => {
    if (isProcessing || movesLeft <= 0) return;
    soundFx.playClick();
    setBoard(generateInitialBoardForLevel(levelConfig));
    setSelectedCell(null);
    setHintCells(null);
    setGameMessageToast('Shape reshuffled with fresh juicy candies! 🍭');
    setTimeout(() => setGameMessageToast(null), 2500);
  };

  // Advance to Next Level (Up to Level 1,000)
  const advanceToNextLevel = () => {
    soundFx.playClick();
    if (currentLevel < 1000) {
      setCurrentLevel((prev) => prev + 1);
    } else {
      // Reached Level 1,000 Grandmaster!
      setGameMessageToast('🏆 Incredible! You have conquered all 1,000 Candy Crush levels!');
    }
    setLevelWinModal(false);
  };

  // Replay / Retry Level
  const retryCurrentLevel = () => {
    soundFx.playClick();
    setBoard(generateInitialBoardForLevel(levelConfig));
    setMovesLeft(levelConfig.totalMoves);
    setSessionScore(0);
    setTotalEarnedNaira(0);
    setComboCount(0);
    setRoundCompleteModal(false);
    setLevelWinModal(false);
    setSelectedCell(null);
    setHintCells(null);
  };

  // Render Realistic 3D Candy SVG graphics
  const renderCandySvg = (type: CandyType) => {
    switch (type) {
      case 'lightning':
        return (
          <svg
            viewBox="0 0 100 100"
            className="w-full h-full drop-shadow-[0_0_16px_rgba(56,189,248,0.95)] select-none pointer-events-none animate-lightning-pulse"
          >
            {/* Outer revolving electric corona */}
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeDasharray="8 5"
              opacity="0.85"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#facc15"
              strokeWidth="1.5"
              strokeDasharray="4 6"
              opacity="0.75"
            />
            {/* 3D Cosmic Color-Bomb Orb */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="url(#candyGrad_lightning)"
              stroke="#bae6fd"
              strokeWidth="2"
            />
            {/* Glowing multi-color sprinkle gems */}
            <circle cx="32" cy="38" r="3" fill="#ef4444" className="drop-shadow-[0_0_4px_#ef4444]" />
            <circle cx="66" cy="36" r="2.8" fill="#22c55e" className="drop-shadow-[0_0_4px_#22c55e]" />
            <circle cx="36" cy="64" r="2.8" fill="#facc15" className="drop-shadow-[0_0_4px_#facc15]" />
            <circle cx="64" cy="62" r="3" fill="#a855f7" className="drop-shadow-[0_0_4px_#a855f7]" />
            <circle cx="50" cy="72" r="2.5" fill="#f97316" className="drop-shadow-[0_0_4px_#f97316]" />
            {/* Central Electric Zig-Zag Lightning Bolt */}
            <polygon
              points="53,16 33,48 48,48 41,84 69,44 54,44 63,16"
              fill="#facc15"
              stroke="#ffffff"
              strokeWidth="2"
              className="drop-shadow-[0_0_12px_rgba(250,204,21,1)]"
            />
            {/* Glass lens flare reflection */}
            <ellipse cx="36" cy="32" rx="7" ry="4" fill="#ffffff" opacity="0.9" transform="rotate(-30 36 32)" />
          </svg>
        );

      case 'red':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_7px_rgba(0,0,0,0.7)] select-none pointer-events-none transition-transform">
            {/* Underside soft shadow */}
            <ellipse cx="50" cy="88" rx="26" ry="6" fill="#000000" opacity="0.45" />
            {/* Main 3D Jelly Bean Body */}
            <path
              d="M50 84 C26 68, 13 50, 13 34 A21 21 0 0 1 50 23 A21 21 0 0 1 87 34 C87 50, 74 68, 50 84 Z"
              fill="url(#candyGrad_red)"
              stroke="#ffe4e6"
              strokeWidth="1.2"
              strokeOpacity="0.55"
            />
            {/* Deep underside shadow bevel */}
            <path
              d="M26 56 C34 72, 45 78, 50 81 C55 78, 66 72, 74 56 C68 67, 58 73, 50 73 C42 73, 32 67, 26 56 Z"
              fill="#4c0519"
              opacity="0.6"
            />
            {/* 3D Curved Specular Glass Highlight */}
            <path
              d="M32 28 C38 24, 48 24, 54 26 C48 30, 36 34, 30 38 C28 34, 30 30, 32 28 Z"
              fill="url(#candyShine_top)"
            />
            {/* Oval glossy lens hotspot */}
            <ellipse cx="36" cy="36" rx="8" ry="4.5" fill="#ffffff" opacity="0.85" transform="rotate(-25 36 36)" />
            {/* Secondary specular glint */}
            <circle cx="62" cy="34" r="3" fill="#ffffff" opacity="0.9" />
            <circle cx="68" cy="42" r="1.5" fill="#ffffff" opacity="0.75" />
            {/* Ambient bottom bounce light */}
            <path
              d="M36 74 C45 78, 55 78, 64 74"
              stroke="#fda4af"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.55"
            />
          </svg>
        );

      case 'orange':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_7px_rgba(0,0,0,0.7)] select-none pointer-events-none transition-transform">
            <ellipse cx="50" cy="80" rx="30" ry="6" fill="#000000" opacity="0.45" />
            {/* Outer beveled body */}
            <rect
              x="14"
              y="24"
              width="72"
              height="50"
              rx="25"
              fill="url(#candyGrad_orange)"
              stroke="#ffedd5"
              strokeWidth="1.2"
              strokeOpacity="0.55"
            />
            {/* Inner 3D dome ridge */}
            <rect
              x="18"
              y="28"
              width="64"
              height="42"
              rx="21"
              fill="none"
              stroke="#ffffff"
              strokeWidth="0.8"
              strokeOpacity="0.3"
            />
            {/* Underbelly ambient shadow */}
            <path
              d="M24 64 C35 72, 65 72, 76 64 C70 69, 58 72, 50 72 C42 72, 30 69, 24 64 Z"
              fill="#431407"
              opacity="0.6"
            />
            {/* Primary curved glass highlight */}
            <ellipse cx="38" cy="37" rx="16" ry="6" fill="#ffffff" opacity="0.85" transform="rotate(-8 38 37)" />
            {/* Secondary sparkling glint */}
            <circle cx="64" cy="38" r="3" fill="#ffffff" opacity="0.8" />
            {/* Bottom luminous citrus reflection */}
            <path
              d="M30 68 C42 73, 58 73, 70 68"
              stroke="#fed7aa"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
          </svg>
        );

      case 'yellow':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_7px_rgba(0,0,0,0.7)] select-none pointer-events-none transition-transform">
            <ellipse cx="50" cy="86" rx="24" ry="5.5" fill="#000000" opacity="0.45" />
            {/* Jewel star/drop body */}
            <polygon
              points="50,14 62,37 87,41 68,58 73,83 50,71 27,83 32,58 13,41 38,37"
              fill="url(#candyGrad_yellow)"
              stroke="#fef9c3"
              strokeWidth="1.2"
              strokeOpacity="0.65"
            />
            {/* Facet lines */}
            <line x1="50" y1="14" x2="50" y2="71" stroke="#ffffff" strokeWidth="1" strokeOpacity="0.4" />
            <line x1="13" y1="41" x2="50" y2="52" stroke="#ffffff" strokeWidth="0.8" strokeOpacity="0.3" />
            <line x1="87" y1="41" x2="50" y2="52" stroke="#713f12" strokeWidth="0.8" strokeOpacity="0.4" />
            <line x1="27" y1="83" x2="50" y2="52" stroke="#713f12" strokeWidth="0.8" strokeOpacity="0.4" />
            <line x1="73" y1="83" x2="50" y2="52" stroke="#713f12" strokeWidth="0.8" strokeOpacity="0.5" />
            {/* Top-left sparkling 4-point star highlight */}
            <path
              d="M44 34 Q44 38 48 38 Q44 38 44 42 Q44 38 40 38 Q44 38 44 34 Z"
              fill="#ffffff"
              opacity="0.95"
            />
            <circle cx="44" cy="38" r="1.5" fill="#ffffff" />
            <ellipse cx="38" cy="48" rx="5" ry="2.5" fill="#ffffff" opacity="0.75" transform="rotate(-30 38 48)" />
          </svg>
        );

      case 'green':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_7px_rgba(0,0,0,0.7)] select-none pointer-events-none transition-transform">
            <ellipse cx="50" cy="84" rx="28" ry="6" fill="#000000" opacity="0.45" />
            {/* 3D Pillowed Beveled Square Body */}
            <rect
              x="18"
              y="18"
              width="64"
              height="64"
              rx="18"
              fill="url(#candyGrad_green)"
              stroke="#dcfce7"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />
            {/* 3D chamfer pillow ring */}
            <rect
              x="22"
              y="22"
              width="56"
              height="56"
              rx="14"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1"
              strokeOpacity="0.3"
            />
            {/* Bottom bevel dark shadow */}
            <path
              d="M24 66 C35 76, 65 76, 76 66 L80 72 C68 82, 32 82, 20 72 Z"
              fill="#052e16"
              opacity="0.6"
            />
            {/* Glossy diagonal sheen stripe */}
            <path
              d="M26 26 L68 26 L56 42 L26 42 Z"
              fill="#ffffff"
              opacity="0.45"
            />
            {/* Specular circle glint */}
            <circle cx="34" cy="34" r="4" fill="#ffffff" opacity="0.9" />
            <circle cx="46" cy="32" r="2" fill="#ffffff" opacity="0.7" />
            {/* Bottom mint backlight glow */}
            <path
              d="M30 72 C42 77, 58 77, 70 72"
              stroke="#86efac"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              opacity="0.5"
            />
          </svg>
        );

      case 'blue':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_7px_rgba(0,0,0,0.7)] select-none pointer-events-none transition-transform">
            <ellipse cx="50" cy="86" rx="26" ry="6" fill="#000000" opacity="0.45" />
            {/* Perfectly shaded 3D Sphere */}
            <circle
              cx="50"
              cy="50"
              r="36"
              fill="url(#candyGrad_blue)"
              stroke="#e0f2fe"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />
            {/* Depth rim shadow */}
            <circle
              cx="52"
              cy="52"
              r="34"
              fill="none"
              stroke="#082f49"
              strokeWidth="3"
              strokeOpacity="0.5"
            />
            {/* High specular glass oval glint */}
            <ellipse cx="38" cy="36" rx="14" ry="7" fill="#ffffff" opacity="0.85" transform="rotate(-35 38 36)" />
            <ellipse cx="34" cy="33" rx="6" ry="3" fill="#ffffff" opacity="0.95" transform="rotate(-35 34 33)" />
            {/* Secondary pinpoint shine */}
            <circle cx="58" cy="46" r="3" fill="#ffffff" opacity="0.75" />
            {/* Bottom ambient blue bounce reflection */}
            <path
              d="M35 74 C45 79, 55 79, 65 74"
              stroke="#7dd3fc"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.6"
            />
          </svg>
        );

      case 'purple':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_4px_7px_rgba(0,0,0,0.7)] select-none pointer-events-none transition-transform">
            <ellipse cx="50" cy="88" rx="26" ry="5.5" fill="#000000" opacity="0.45" />
            {/* Teardrop Gem Body */}
            <path
              d="M50 15 C33 36, 21 54, 21 68 A29 29 0 0 0 79 68 C79 54, 67 36, 50 15 Z"
              fill="url(#candyGrad_purple)"
              stroke="#f3e8ff"
              strokeWidth="1.2"
              strokeOpacity="0.6"
            />
            {/* Deep purple base shadow */}
            <path
              d="M30 75 C42 85, 58 85, 70 75 C65 80, 58 83, 50 83 C42 83, 35 80, 30 75 Z"
              fill="#3b0764"
              opacity="0.7"
            />
            {/* Curved gloss highlight down the shoulder */}
            <path
              d="M48 24 C40 38, 32 52, 32 64 C32 54, 38 42, 46 30 Z"
              fill="#ffffff"
              opacity="0.6"
            />
            <ellipse cx="40" cy="48" rx="10" ry="5" fill="#ffffff" opacity="0.85" transform="rotate(-35 40 48)" />
            <circle cx="54" cy="64" r="3" fill="#ffffff" opacity="0.8" />
            {/* Bottom violet glow */}
            <path
              d="M36 78 C45 82, 55 82, 64 78"
              stroke="#e9d5ff"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.55"
            />
          </svg>
        );
    }
  };

  // Reusable Level-Shaped Board Renderer
  const renderGameBoard = (isFull: boolean) => (
    <div
      ref={boardRef}
      style={{ touchAction: 'none' }}
      className={`relative p-2 sm:p-3 rounded-3xl ${
        isLight
          ? 'bg-gradient-to-b from-white/95 via-amber-50/40 to-slate-100/95 border-4 border-amber-400 shadow-xl shadow-amber-500/10'
          : 'bg-gradient-to-b from-[#1b171f]/80 via-[#12131a]/85 to-[#0b0c11]/90 border-4 border-amber-500/40 shadow-2xl shadow-black/90'
      } backdrop-blur-md overflow-hidden select-none touch-none overscroll-none mx-auto w-full ${
        isFull ? 'max-w-[min(94vw,430px)] aspect-square my-auto' : 'max-w-xl'
      }`}
    >
      {/* SHARED 3D CANDY SVG FILTERS & GRADIENTS */}
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <defs>
          {/* Top Specular Glaze */}
          <linearGradient id="candyShine_top" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.88" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Red Candy Material */}
          <radialGradient id="candyGrad_red" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ff8fa3" />
            <stop offset="25%" stopColor="#f43f5e" />
            <stop offset="60%" stopColor="#e11d48" />
            <stop offset="85%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#4c0519" />
          </radialGradient>

          {/* Orange Candy Material */}
          <radialGradient id="candyGrad_orange" cx="35%" cy="28%" r="68%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="25%" stopColor="#fb923c" />
            <stop offset="65%" stopColor="#ea580c" />
            <stop offset="88%" stopColor="#9a3412" />
            <stop offset="100%" stopColor="#431407" />
          </radialGradient>

          {/* Yellow Candy Material */}
          <radialGradient id="candyGrad_yellow" cx="35%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="22%" stopColor="#fef08a" />
            <stop offset="55%" stopColor="#facc15" />
            <stop offset="85%" stopColor="#ca8a04" />
            <stop offset="100%" stopColor="#713f12" />
          </radialGradient>

          {/* Green Candy Material */}
          <radialGradient id="candyGrad_green" cx="32%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#bbf7d0" />
            <stop offset="25%" stopColor="#4ade80" />
            <stop offset="62%" stopColor="#16a34a" />
            <stop offset="88%" stopColor="#15803d" />
            <stop offset="100%" stopColor="#052e16" />
          </radialGradient>

          {/* Blue Candy Material */}
          <radialGradient id="candyGrad_blue" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="25%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#0284c7" />
            <stop offset="85%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#082f49" />
          </radialGradient>

          {/* Purple Candy Material */}
          <radialGradient id="candyGrad_purple" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="25%" stopColor="#c084fc" />
            <stop offset="60%" stopColor="#9333ea" />
            <stop offset="85%" stopColor="#6b21a8" />
            <stop offset="100%" stopColor="#3b0764" />
          </radialGradient>

          {/* Lightning Color Bomb Material */}
          <radialGradient id="candyGrad_lightning" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="25%" stopColor="#7dd3fc" />
            <stop offset="55%" stopColor="#0284c7" />
            <stop offset="85%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0a0a14" />
          </radialGradient>
        </defs>
      </svg>

      {/* Dynamic Lightning Zap Rays Overlay */}
      {lightningZap && (
        <svg className="absolute inset-0 pointer-events-none z-40 w-full h-full">
          {lightningZap.targets.map((t, idx) => {
            const fromX = ((lightningZap.from.c + 0.5) / GRID_SIZE) * 100;
            const fromY = ((lightningZap.from.r + 0.5) / GRID_SIZE) * 100;
            const toX = ((t.c + 0.5) / GRID_SIZE) * 100;
            const toY = ((t.r + 0.5) / GRID_SIZE) * 100;
            const midX = (fromX + toX) / 2 + Math.sin(idx * 2) * 5;
            const midY = (fromY + toY) / 2 + Math.cos(idx * 2) * 5;
            return (
              <g key={idx}>
                <path
                  d={`M ${fromX}% ${fromY}% Q ${midX}% ${midY}% ${toX}% ${toY}%`}
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  className="animate-zap"
                />
                <path
                  d={`M ${fromX}% ${fromY}% Q ${midX}% ${midY}% ${toX}% ${toY}%`}
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </g>
            );
          })}
        </svg>
      )}

      {/* Combo Banner Overlay */}
      {comboBanner && (
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center p-4 animate-in zoom-in-50 duration-200">
          <div
            className={`p-4 rounded-3xl bg-gradient-to-r ${comboBanner.color} text-black font-black text-center shadow-2xl shadow-black/80 border-4 border-white/90 scale-105 animate-bounce`}
          >
            <div className="text-xl sm:text-2xl tracking-tight uppercase drop-shadow-md">
              {comboBanner.title}
            </div>
            <div className="text-xs sm:text-sm tracking-wide font-extrabold text-white drop-shadow-md mt-0.5">
              {comboBanner.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* Floating Scores */}
      {floatingScores.map((score) => (
        <div
          key={score.id}
          style={{ left: `${score.x}%`, top: `${score.y}%` }}
          className={`absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2 font-black font-mono text-xs sm:text-sm animate-score-float drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] ${score.color}`}
        >
          <div className="flex flex-col items-center">
            <span className="tracking-tight bg-black/80 px-2 py-0.5 rounded-full border border-white/20">
              {score.text}
            </span>
            {score.subtext && (
              <span className="text-[9px] uppercase font-bold text-white bg-black/80 px-1.5 py-0.5 rounded-md mt-0.5">
                {score.subtext}
              </span>
            )}
          </div>
        </div>
      ))}

      {/* Particles Layer */}
      <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
        {particles.map((p) => (
          <div
            key={p.id}
            style={{
              left: `${p.x}px`,
              top: `${p.y}px`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              backgroundColor: p.color,
              opacity: p.alpha,
              borderRadius: p.shape === 'circle' ? '50%' : '2px',
              transform: p.shape === 'star' ? 'rotate(45deg)' : 'none',
            }}
            className="absolute pointer-events-none shadow-sm"
          />
        ))}
      </div>

      {/* DYNAMIC SHAPED 7x7 GRID */}
      <div
        style={{ touchAction: 'none' }}
        className={`relative grid grid-cols-7 gap-1 sm:gap-1.5 p-1.5 sm:p-2 rounded-2xl border shadow-inner select-none touch-none overscroll-none ${
          isLight ? 'bg-slate-100/95 border-slate-300' : 'bg-[#0a0a0e]/95 border-stone-800'
        }`}
      >
        {board.map((row, r) =>
          row.map((candy, c) => {
            const isActive = levelConfig.shape[r]?.[c];

            // If this cell is cut out in this level's shape, render as transparent void space
            if (!isActive) {
              return (
                <div
                  key={`void_${r}_${c}`}
                  className="aspect-square relative rounded-xl sm:rounded-2xl opacity-10 pointer-events-none"
                />
              );
            }

            if (!candy) return null;

            const isSelected = selectedCell?.r === r && selectedCell?.c === c;
            const isHint =
              hintCells &&
              ((hintCells.r1 === r && hintCells.c1 === c) || (hintCells.r2 === r && hintCells.c2 === c));

            // Dynamic candy movement calculation:
            let transformStr = '';
            let transitionStr = '';
            let zIndex = 10;

            // 1. Swap slide animation
            if (swapState) {
              if (swapState.r1 === r && swapState.c1 === c) {
                zIndex = 25;
                transitionStr = 'transform 220ms cubic-bezier(0.25, 1, 0.5, 1)';
                transformStr = swapState.isReverting
                  ? 'translate(0, 0)'
                  : `translate(${swapState.dc * 100}%, ${swapState.dr * 100}%)`;
              } else if (swapState.r2 === r && swapState.c2 === c) {
                zIndex = 25;
                transitionStr = 'transform 220ms cubic-bezier(0.25, 1, 0.5, 1)';
                transformStr = swapState.isReverting
                  ? 'translate(0, 0)'
                  : `translate(${-swapState.dc * 100}%, ${-swapState.dr * 100}%)`;
              }
            }
            // 2. Touch dragging real-time animation
            else if (dragState && dragState.r === r && dragState.c === c) {
              zIndex = 35;
              transformStr = `translate3d(${dragState.currentDx}px, ${dragState.currentDy}px, 0) scale(1.12)`;
              transitionStr = 'none';
            } else if (
              dragState &&
              dragState.targetNeighbor &&
              dragState.targetNeighbor.r === r &&
              dragState.targetNeighbor.c === c
            ) {
              zIndex = 15;
              transformStr = `translate3d(${-dragState.currentDx * 0.45}px, ${-dragState.currentDy * 0.45}px, 0)`;
              transitionStr = 'none';
            }

            const isEven = (r + c) % 2 === 0;
            const tileBg = isLight
              ? (isEven ? 'bg-white' : 'bg-slate-50')
              : (isEven ? 'bg-[#191b28]/95' : 'bg-[#11121d]/95');

            return (
              <div
                key={candy.id}
                onClick={() => handleCellClick(r, c)}
                onTouchStart={(e) => handleTouchStart(r, c, e)}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'none' }}
                className={`aspect-square relative rounded-xl sm:rounded-2xl flex items-center justify-center p-0.5 sm:p-1 cursor-pointer select-none touch-none overscroll-none border transition-all ${
                  isLight
                    ? 'border-slate-200/90 shadow-[inset_0_2px_4px_rgba(0,0,0,0.05)]'
                    : 'border-stone-800/80 shadow-[inset_0_2.5px_4px_rgba(0,0,0,0.9),inset_0_-1px_1px_rgba(255,255,255,0.06)]'
                } ${
                  candy.isMatched
                    ? 'animate-candy-pop'
                    : isSelected
                    ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-black bg-amber-400/20 shadow-xl shadow-amber-400/50 scale-105 z-20'
                    : isHint
                    ? 'ring-2 ring-yellow-400 animate-pulse bg-yellow-400/20'
                    : `${tileBg} ${isLight ? 'hover:bg-amber-50/50' : 'hover:bg-[#222436]'}`
                }`}
              >
                {/* Tile recessed waffle bevel */}
                <div className={`absolute inset-1 rounded-lg sm:rounded-xl pointer-events-none ${isLight ? 'bg-slate-200/35' : 'bg-black/40'}`} />
                <div className={`absolute inset-x-2 bottom-1 h-2 rounded-full blur-[2px] pointer-events-none ${isLight ? 'bg-slate-300/30' : 'bg-black/60'}`} />

                {/* Animated Candy Container */}
                <div
                  style={{
                    transform: transformStr,
                    transition: transitionStr,
                    zIndex,
                  }}
                  className={`relative w-full h-full flex items-center justify-center select-none pointer-events-none ${
                    candy.isDropping ? 'animate-candy-drop' : ''
                  }`}
                >
                  {renderCandySvg(candy.type)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  // 1. LAUNCHER SCREEN: Displayed on Earn Page when user hasn't clicked "( Play Game )"
  if (!isPlaying) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-4 animate-in fade-in duration-300">
        <div
          className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-2xl border-2 ${
            isLight
              ? 'bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 border-amber-300 text-slate-800 shadow-amber-500/10'
              : 'bg-gradient-to-br from-[#211a14] via-[#16141a] to-[#0d0e14] border-amber-500/40 text-white shadow-amber-950/30'
          }`}
        >
          {/* Animated background bubbles in lobby card */}
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className={`absolute -top-12 -left-12 w-48 h-48 rounded-full blur-[80px] ${isLight ? 'bg-pink-300' : 'bg-pink-500'}`} />
            <div className={`absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-[80px] ${isLight ? 'bg-amber-300' : 'bg-amber-500'}`} />
          </div>

          <div className="relative z-10 space-y-4">
            {/* Header badges */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${
                  isLight
                    ? 'bg-amber-100 text-amber-800 border-amber-300'
                    : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                <span>Candy Crush Saga · 1,000 Levels</span>
              </span>

              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                  isLight
                    ? 'bg-slate-100 text-slate-700 border-slate-300'
                    : 'text-stone-300 bg-stone-900/80 border-stone-800'
                }`}
              >
                Level {currentLevel} of 1,000
              </span>
            </div>

            {/* Title & Description */}
            <div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Play Candy Crush &amp; <span className="text-amber-500">Earn Real Naira</span>
              </h2>
              <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                Start at <strong>Level 1</strong> and journey through <strong>1,000 unique levels</strong>!
                Each level the playing box changes shape. Match 5 to create the <strong>⚡ Lightning Candy</strong>!
              </p>
            </div>

            {/* Current Level Box Preview Card */}
            <div
              className={`p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 flex-wrap border ${
                isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-black/40 border-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 text-black font-black flex items-center justify-center text-sm shadow-md shadow-amber-500/20">
                  #{currentLevel}
                </div>
                <div>
                  <div className={`text-xs font-extrabold flex items-center gap-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    <span>{levelConfig.worldName}</span>
                    <span className="text-[10px] text-amber-600 font-bold">({levelConfig.shapeName})</span>
                  </div>
                  <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                    Box Shape: <strong>{levelConfig.shapeName}</strong> · Target: <strong>{levelConfig.targetScore.toLocaleString()} pts</strong>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`text-[10px] block font-semibold ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Moves Allowed</span>
                <span className="text-xs font-mono font-black text-emerald-600">{levelConfig.totalMoves} Moves</span>
              </div>
            </div>

            {/* PRIZE PAYTABLE BANNER */}
            <div className="space-y-2">
              <div className="grid grid-cols-3 gap-2 text-center font-mono">
                <div className={`p-2 sm:p-2.5 rounded-2xl border ${isLight ? 'bg-white border-emerald-300 shadow-sm' : 'bg-[#0f1015] border-emerald-500/30'}`}>
                  <span className={`text-[10px] font-sans font-bold block ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>Match 3 🍬</span>
                  <span className="text-xs sm:text-sm font-black text-emerald-600 mt-0.5 block">₦500</span>
                </div>
                <div className={`p-2 sm:p-2.5 rounded-2xl border ${isLight ? 'bg-white border-amber-300 shadow-sm' : 'bg-[#0f1015] border-amber-500/30'}`}>
                  <span className={`text-[10px] font-sans font-bold block ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>Match 4 ✨</span>
                  <span className="text-xs sm:text-sm font-black text-amber-600 mt-0.5 block">₦800</span>
                </div>
                <div className={`p-2 sm:p-2.5 rounded-2xl border ${isLight ? 'bg-purple-50/70 border-purple-300 shadow-sm' : 'bg-gradient-to-b from-[#1f1624] to-[#120f18] border border-purple-500/50'}`}>
                  <span className={`text-[10px] font-sans font-bold block ${isLight ? 'text-purple-900' : 'text-purple-300'}`}>Match 5+ (Max) ⚡</span>
                  <span className="text-xs sm:text-sm font-black text-purple-600 mt-0.5 block">₦1,000</span>
                </div>
              </div>

              {/* LEVEL VICTORY PRIZE BANNER */}
              <div
                className={`p-2.5 rounded-2xl flex items-center justify-between px-3.5 border ${
                  isLight
                    ? 'bg-amber-100/70 border-amber-300 text-amber-900'
                    : 'bg-gradient-to-r from-amber-500/15 via-yellow-500/20 to-amber-500/15 border-amber-500/40 text-amber-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-500" />
                  <span className="text-xs font-bold">Level Victory Prize:</span>
                </div>
                <span className="text-sm font-black font-mono text-amber-600">₦1,500</span>
              </div>
            </div>

            {/* LIGHTNING CANDY FEATURE BANNER */}
            <div
              className={`p-3 rounded-2xl flex items-start gap-2.5 text-xs border ${
                isLight
                  ? 'bg-sky-50 border-sky-300 text-slate-700'
                  : 'bg-sky-500/10 border-sky-500/30 text-stone-300'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 border ${
                  isLight
                    ? 'bg-sky-100 border-sky-300 text-sky-600'
                    : 'bg-sky-500/20 border-sky-500/40 text-sky-400'
                }`}
              >
                <Zap className="w-4 h-4 fill-current" />
              </div>
              <div>
                <strong className={`block font-bold ${isLight ? 'text-sky-900' : 'text-sky-300'}`}>
                  Match 5 = ⚡ Lightning Candy (+₦1,000)
                </strong>
                <span className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                  Swipe the Lightning Candy into any color to vaporize every candy of that color across the board and trigger cascade sweeps!
                </span>
              </div>
            </div>

            {/* THE ( PLAY GAME ) BUTTON */}
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsPlaying(true);
              }}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-sm uppercase tracking-wider shadow-xl shadow-amber-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>( Play Game )</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN GAME SCREEN: Opened once user clicks "( Play Game )" with Animated Background
  return (
    <div
      ref={containerRef}
      style={{ touchAction: 'none' }}
      className={`relative w-full max-w-xl mx-auto space-y-3.5 select-none touch-none overscroll-none overflow-hidden rounded-3xl p-3 sm:p-5 shadow-2xl ${
        isFullscreen
          ? isLight
            ? 'fixed inset-0 z-50 bg-[#f8fafc] text-slate-800 flex flex-col justify-between p-2 sm:p-4 rounded-none border-none max-w-none'
            : 'fixed inset-0 z-50 bg-[#090a0f] text-white flex flex-col justify-between p-2 sm:p-4 rounded-none border-none max-w-none'
          : isLight
          ? 'bg-slate-50/95 border-2 border-amber-300 shadow-amber-500/10'
          : 'bg-[#101016] border border-amber-500/30'
      }`}
    >
      {/* BEAUTIFUL ANIMATED BACKGROUND (Floating bubbles, nebula aurora, sparkles) */}
      <CandyAnimatedBackground hasLightning={hasLightningOnBoard} />

      {/* TOP HUD: LEVEL PROGRESSION, TARGET SCORE & CONTROLS */}
      <div
        className={`relative z-10 p-3 sm:p-4 rounded-2xl backdrop-blur-md shadow-lg space-y-2.5 border ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-slate-200/50'
            : 'bg-[#14151f]/85 border-amber-500/30 text-white'
        }`}
      >
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setIsPlaying(false);
              }}
              className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
              title="Back to Earn Hub"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div>
              <div className="flex items-center gap-1.5">
                <span className={`text-xs sm:text-sm font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  Level {currentLevel}
                </span>
                <span className={`text-[10px] font-bold ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>/ 1,000</span>
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-md font-bold uppercase tracking-wider border ${
                    isLight
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : 'bg-amber-400/20 text-amber-300 border-amber-400/30'
                  }`}
                >
                  {levelConfig.shapeName}
                </span>
              </div>
              <div className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>{levelConfig.worldName}</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                isLight
                  ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-900'
                  : 'bg-amber-500/15 hover:bg-amber-500/25 border-amber-500/40 text-amber-300'
              }`}
              title={isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}
            >
              {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isFullscreen ? 'Exit' : 'Full Screen'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={handleRequestHint}
              disabled={isProcessing}
              className={`px-2.5 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors ${
                isLight
                  ? 'bg-amber-100/80 hover:bg-amber-200 border-amber-300 text-amber-800'
                  : 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300'
              }`}
            >
              <Lightbulb className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hint</span>
            </button>

            <button
              type="button"
              onClick={handleShuffleBoard}
              disabled={isProcessing}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200'
                  : 'bg-stone-900 border-stone-800 text-stone-400 hover:text-white hover:bg-stone-800'
              }`}
              title="Shuffle Candies"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Level Goal Progress Bar */}
        <div className="space-y-1">
          <div className={`flex items-center justify-between text-[10px] font-bold ${isLight ? 'text-slate-700' : 'text-stone-300'}`}>
            <span>Score Goal: {sessionScore.toLocaleString()} / {levelConfig.targetScore.toLocaleString()} pts</span>
            <span className={isLight ? 'text-amber-800' : 'text-amber-300'}>
              {Math.min(100, Math.floor((sessionScore / levelConfig.targetScore) * 100))}% Cleared
            </span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden border ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-stone-900 border-stone-800'}`}>
            <div
              style={{ width: `${Math.min(100, (sessionScore / levelConfig.targetScore) * 100)}%` }}
              className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-purple-500 transition-all duration-300 rounded-full"
            />
          </div>
        </div>

        {/* Moves Left & Earnings Stats */}
        <div
          className={`flex items-center justify-between p-2 rounded-xl border text-xs ${
            isLight ? 'bg-slate-100 border-slate-200 text-slate-800' : 'bg-[#0c0d12] border-stone-800 text-white'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Moves:</span>
            <span
              className={`text-sm font-black font-mono ${
                movesLeft <= 5 ? 'text-red-500 animate-pulse' : (isLight ? 'text-slate-900' : 'text-white')
              }`}
            >
              {movesLeft} / {levelConfig.totalMoves}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Won:</span>
            <span className="text-sm font-black text-emerald-600 font-mono">
              +{formatNaira(totalEarnedNaira)}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className={`text-[10px] font-semibold ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Wallet:</span>
            <span className="text-xs font-bold text-amber-600 font-mono">
              {formatNaira(user?.balance || 0)}
            </span>
          </div>
        </div>
      </div>

      {/* GAME TOAST NOTIFICATION */}
      {gameMessageToast && (
        <div
          className={`relative z-10 p-2.5 rounded-xl border text-xs text-center font-bold animate-in fade-in shadow-lg ${
            isLight
              ? 'bg-amber-100/90 border-amber-300 text-amber-900'
              : 'bg-amber-500/20 border-amber-500/40 text-amber-300'
          }`}
        >
          {gameMessageToast}
        </div>
      )}

      {/* DYNAMIC LEVEL-SHAPED BOARD */}
      <div className="relative z-10">
        {renderGameBoard(isFullscreen)}
      </div>

      {/* BOTTOM FOOTER: RULES & SHAPE INFO */}
      <div
        className={`relative z-10 p-2.5 rounded-2xl backdrop-blur-md border text-[11px] flex items-center justify-between gap-2 ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-700 shadow-sm'
            : 'bg-[#14151f]/80 border-stone-800/80 text-stone-300'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-amber-500 font-bold">⚡ Match 5:</span>
          <span>Creates Lightning Candy. Swipe with any candy to clear that entire color!</span>
        </div>
        <span className={`text-[9px] font-mono shrink-0 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Level {currentLevel}/1000</span>
      </div>

      {/* LEVEL WON CELEBRATION MODAL */}
      {levelWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div
            className={`w-full max-w-sm rounded-3xl border-2 p-6 text-center space-y-4 shadow-2xl ${
              isLight
                ? 'bg-gradient-to-b from-white via-amber-50/30 to-white border-amber-400 text-slate-900 shadow-amber-500/20'
                : 'bg-gradient-to-b from-[#211a14] via-[#14151b] to-[#101015] border-amber-500/50 text-white shadow-amber-950/50'
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/20 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-500">
                Level {currentLevel} Cleared!
              </div>
              <h3 className={`text-2xl font-black tracking-tight mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Victory Complete! 🌟
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                You reached the target score for {levelConfig.worldName} and unlocked Level {currentLevel + 1}!
              </p>
            </div>

            {/* Total Won Badge */}
            <div
              className={`p-4 rounded-2xl border text-center space-y-1 ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/25 to-teal-500/15 border-emerald-500/40'
              }`}
            >
              <div className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                Cash Won This Level (Includes +₦1,500 Victory Prize)
              </div>
              <div className="text-3xl font-black text-emerald-600 tracking-tight font-mono">
                +{formatNaira(totalEarnedNaira)}
              </div>
              <div className={`text-[10px] font-semibold flex items-center justify-center gap-1 ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Credited directly to your 9jacash wallet!</span>
              </div>
            </div>

            <button
              type="button"
              onClick={advanceToNextLevel}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Play Level {currentLevel + 1} ({getLevelConfig(currentLevel + 1).shapeName})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* MOVES EXHAUSTED ROUND COMPLETE MODAL */}
      {roundCompleteModal && !levelWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div
            className={`w-full max-w-sm rounded-3xl border-2 p-6 text-center space-y-4 shadow-2xl ${
              isLight
                ? 'bg-gradient-to-b from-white via-amber-50/30 to-white border-amber-400 text-slate-900 shadow-amber-500/20'
                : 'bg-gradient-to-b from-[#1c1813] via-[#14151b] to-[#101015] border-amber-500/50 text-white shadow-amber-950/50'
            }`}
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-500/20 border-2 border-amber-500/50 flex items-center justify-center text-amber-500 shadow-xl shadow-amber-500/20 animate-bounce">
              <PartyPopper className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-wider text-amber-500">
                Moves Finished
              </div>
              <h3 className={`text-2xl font-black tracking-tight mt-0.5 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Sugar Crush! 🍬
              </h3>
              <p className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>
                You scored {sessionScore.toLocaleString()} / {levelConfig.targetScore.toLocaleString()} pts.
              </p>
            </div>

            {/* Total Won Badge */}
            <div
              className={`p-4 rounded-2xl border text-center space-y-1 ${
                isLight
                  ? 'bg-emerald-50 border-emerald-300'
                  : 'bg-gradient-to-r from-emerald-500/15 via-emerald-500/25 to-teal-500/15 border-emerald-500/40'
              }`}
            >
              <div className={`text-[10px] font-bold uppercase tracking-wider ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                Total Earned This Round
              </div>
              <div className="text-3xl font-black text-emerald-600 tracking-tight font-mono">
                +{formatNaira(totalEarnedNaira)}
              </div>
              <div className={`text-[10px] font-semibold ${isLight ? 'text-emerald-700' : 'text-emerald-300'}`}>
                Credited directly to your wallet balance
              </div>
            </div>

            <button
              type="button"
              onClick={retryCurrentLevel}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-black font-black text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Retry Level {currentLevel}</span>
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
