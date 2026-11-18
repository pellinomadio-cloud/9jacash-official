import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { soundFx } from '../../utils/sound.ts';
import {
  Sparkles,
  RotateCcw,
  Lightbulb,
  Volume2,
  VolumeX,
  ArrowRight,
  PartyPopper,
  Maximize2,
  Minimize2,
  Zap,
  Play,
  CheckCircle2,
  Trophy,
  ArrowLeft,
  Settings,
  X,
} from 'lucide-react';
import {
  GRID_SIZE,
  BoardShape,
  LevelConfig,
  getLevelConfig,
} from './candyShapes.ts';
import { CandyAnimatedBackground } from './CandyAnimatedBackground.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';

export type CandyType = 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'lightning';

const FIVE_CLASSIC_COLORS: CandyType[] = ['red', 'blue', 'orange', 'green', 'yellow'];
const SIX_CANDY_COLORS: CandyType[] = ['red', 'blue', 'orange', 'green', 'yellow', 'purple'];

interface CandyItem {
  id: string;
  type: CandyType;
  isSpecial?: 'striped_h' | 'striped_v' | 'lightning';
  isMatched?: boolean;
  isDropping?: boolean;
  dropDelay?: number;
}

interface FloatingScore {
  id: string;
  text: string;
  x: number;
  y: number;
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
  shape: 'star' | 'circle';
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

  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const [currentLevel, setCurrentLevel] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(`${LEVEL_STORAGE_KEY_PREFIX}${user?.id || 'guest'}`);
      const parsed = saved ? parseInt(saved, 10) : 1;
      return isNaN(parsed) || parsed < 1 ? 1 : Math.min(1000, parsed);
    } catch {
      return 1;
    }
  });

  const levelConfig: LevelConfig = useMemo(() => getLevelConfig(currentLevel), [currentLevel]);

  const activeColorPool = useMemo(
    () => (levelConfig.numColors >= 6 ? SIX_CANDY_COLORS : FIVE_CLASSIC_COLORS),
    [levelConfig.numColors]
  );

  useEffect(() => {
    try {
      localStorage.setItem(`${LEVEL_STORAGE_KEY_PREFIX}${user?.id || 'guest'}`, currentLevel.toString());
    } catch {
      // Ignore storage failure
    }
  }, [currentLevel, user?.id]);

  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Board & gameplay state
  const [board, setBoard] = useState<(CandyItem | null)[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [movesLeft, setMovesLeft] = useState<number>(levelConfig.totalMoves);
  const [sessionScore, setSessionScore] = useState<number>(0);
  const [targetCollected, setTargetCollected] = useState<number>(0);
  const [totalEarnedNaira, setTotalEarnedNaira] = useState<number>(0);
  const [highestCombo, setHighestCombo] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [comboBanner, setComboBanner] = useState<{ title: string; subtitle: string; color: string } | null>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [roundCompleteModal, setRoundCompleteModal] = useState<boolean>(false);
  const [levelWinModal, setLevelWinModal] = useState<boolean>(false);
  const [hintCells, setHintCells] = useState<{ r1: number; c1: number; r2: number; c2: number } | null>(null);
  const [gameMessageToast, setGameMessageToast] = useState<string | null>(null);

  const [swapState, setSwapState] = useState<SwapState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [lightningZap, setLightningZap] = useState<LightningZapInfo | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const pointerStartRef = useRef<{ r: number; c: number; x: number; y: number; pointerId: number } | null>(null);
  const hasWonLevelRef = useRef<boolean>(false);
  const isProcessingRef = useRef<boolean>(false);
  const sessionScoreRef = useRef<number>(0);
  const targetCollectedRef = useRef<number>(0);

  useEffect(() => {
    isProcessingRef.current = isProcessing;
  }, [isProcessing]);

  const hasLightningOnBoard = useMemo(
    () => board.some((row) => row.some((cell) => cell?.isSpecial === 'lightning')),
    [board]
  );

  const createRandomCandy = useCallback(
    (excludedTypes: CandyType[] = []): CandyItem => {
      const available = activeColorPool.filter((t) => !excludedTypes.includes(t));
      const pool = available.length > 0 ? available : activeColorPool;
      const type = pool[Math.floor(Math.random() * pool.length)];
      return {
        id: 'c_' + Math.random().toString(36).substring(2, 10),
        type,
      };
    },
    [activeColorPool]
  );

  const checkSwapCreatesMatch = useCallback(
    (b: (CandyItem | null)[][], shape: BoardShape, r1: number, c1: number, r2: number, c2: number): boolean => {
      if (!shape[r1]?.[c1] || !shape[r2]?.[c2] || !b[r1]?.[c1] || !b[r2]?.[c2]) return false;

      if (b[r1][c1]?.isSpecial === 'lightning' || b[r2][c2]?.isSpecial === 'lightning') {
        return true;
      }

      const copy = b.map((row) => [...row]);
      const temp = copy[r1][c1];
      copy[r1][c1] = copy[r2][c2];
      copy[r2][c2] = temp;

      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE - 2; c++) {
          if (!shape[r][c] || !shape[r][c + 1] || !shape[r][c + 2]) continue;
          const type = copy[r][c]?.type;
          if (type && type !== 'lightning' && copy[r][c + 1]?.type === type && copy[r][c + 2]?.type === type) {
            return true;
          }
        }
      }
      for (let c = 0; c < GRID_SIZE; c++) {
        for (let r = 0; r < GRID_SIZE - 2; r++) {
          if (!shape[r][c] || !shape[r + 1][c] || !shape[r + 2][c]) continue;
          const type = copy[r][c]?.type;
          if (type && type !== 'lightning' && copy[r + 1][c]?.type === type && copy[r + 2][c]?.type === type) {
            return true;
          }
        }
      }
      return false;
    },
    []
  );

  const findAvailableMove = useCallback(
    (b: (CandyItem | null)[][], shape: BoardShape): { r1: number; c1: number; r2: number; c2: number } | null => {
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (!shape[r]?.[c] || !b[r]?.[c]) continue;
          if (b[r][c]?.isSpecial === 'lightning') {
            if (c < GRID_SIZE - 1 && shape[r]?.[c + 1] && b[r]?.[c + 1]) {
              return { r1: r, c1: c, r2: r, c2: c + 1 };
            }
            if (r < GRID_SIZE - 1 && shape[r + 1]?.[c] && b[r + 1]?.[c]) {
              return { r1: r, c1: c, r2: r + 1, c2: c };
            }
          }
          if (c < GRID_SIZE - 1 && shape[r]?.[c + 1] && checkSwapCreatesMatch(b, shape, r, c, r, c + 1)) {
            return { r1: r, c1: c, r2: r, c2: c + 1 };
          }
          if (r < GRID_SIZE - 1 && shape[r + 1]?.[c] && checkSwapCreatesMatch(b, shape, r, c, r + 1, c)) {
            return { r1: r, c1: c, r2: r + 1, c2: c };
          }
        }
      }
      return null;
    },
    [checkSwapCreatesMatch]
  );

  const generateInitialBoardForLevel = useCallback(
    (cfg: LevelConfig): (CandyItem | null)[][] => {
      let newBoard: (CandyItem | null)[][] = [];
      let attempts = 0;

      while (attempts < 60) {
        attempts++;
        newBoard = [];
        for (let r = 0; r < GRID_SIZE; r++) {
          const row: (CandyItem | null)[] = [];
          for (let c = 0; c < GRID_SIZE; c++) {
            if (!cfg.shape[r]?.[c]) {
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
    [createRandomCandy, findAvailableMove]
  );

  useEffect(() => {
    const initB = generateInitialBoardForLevel(levelConfig);
    hasWonLevelRef.current = false;
    isProcessingRef.current = false;
    sessionScoreRef.current = 0;
    targetCollectedRef.current = 0;
    setIsProcessing(false);
    setBoard(initB);
    setMovesLeft(levelConfig.totalMoves);
    setSessionScore(0);
    setTargetCollected(0);
    setTotalEarnedNaira(0);
    setRoundCompleteModal(false);
    setLevelWinModal(false);
    setSelectedCell(null);
    setHintCells(null);
    setLightningZap(null);
    setShowSettingsModal(false);
  }, [currentLevel, generateInitialBoardForLevel, levelConfig]);

  useEffect(() => {
    const boardEl = boardRef.current;
    if (!boardEl) return;
    const preventTouchScroll = (e: TouchEvent) => {
      if (e.cancelable) e.preventDefault();
    };
    boardEl.addEventListener('touchmove', preventTouchScroll, { passive: false });
    return () => boardEl.removeEventListener('touchmove', preventTouchScroll);
  }, [isPlaying, isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;
    const originalOverflow = document.body.style.overflow;
    const originalTouchAction = document.body.style.touchAction;
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullscreen(false);
    };
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isFullscreen) setIsFullscreen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.touchAction = originalTouchAction;
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, [isFullscreen]);

  const handleToggleFullscreen = async () => {
    if (!isMuted) soundFx.playClick();
    if (!isFullscreen) {
      setIsFullscreen(true);
      try {
        if (document.documentElement.requestFullscreen) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fallback overlay fullscreen
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

  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.2 + Math.random() * 5.5;
      newParticles.push({
        id: 'p_' + Math.random().toString(36).substring(2, 9),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 5 + Math.random() * 6,
        alpha: 1,
        shape: Math.random() > 0.5 ? 'star' : 'circle',
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  };

  useEffect(() => {
    if (particles.length === 0) return;
    const interval = setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy + 0.45,
            alpha: p.alpha - 0.045,
            size: p.size * 0.96,
          }))
          .filter((p) => p.alpha > 0.05)
      );
    }, 24);
    return () => clearInterval(interval);
  }, [particles.length]);

  const findAllMatches = (
    b: (CandyItem | null)[][],
    shape: BoardShape
  ): {
    coords: Set<string>;
    matchGroups: Array<{
      length: number;
      type: CandyType;
      r: number;
      c: number;
      orientation: 'h' | 'v';
    }>;
  } => {
    const matchedCoords = new Set<string>();
    const matchGroups: Array<{
      length: number;
      type: CandyType;
      r: number;
      c: number;
      orientation: 'h' | 'v';
    }> = [];

    // Horizontal
    for (let r = 0; r < GRID_SIZE; r++) {
      let matchLen = 1;
      for (let c = 0; c < GRID_SIZE; c++) {
        if (!shape[r]?.[c] || !b[r]?.[c]) {
          matchLen = 1;
          continue;
        }
        const currentType = b[r][c]?.type;
        const nextType = c < GRID_SIZE - 1 && shape[r]?.[c + 1] ? b[r][c + 1]?.type : null;
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
              orientation: 'h',
            });
            for (let i = 0; i < matchLen; i++) {
              matchedCoords.add(`${r},${c - i}`);
            }
          }
          matchLen = 1;
        }
      }
    }

    // Vertical
    for (let c = 0; c < GRID_SIZE; c++) {
      let matchLen = 1;
      for (let r = 0; r < GRID_SIZE; r++) {
        if (!shape[r]?.[c] || !b[r]?.[c]) {
          matchLen = 1;
          continue;
        }
        const currentType = b[r][c]?.type;
        const nextType = r < GRID_SIZE - 1 && shape[r + 1]?.[c] ? b[r + 1][c]?.type : null;
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
              orientation: 'v',
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

  const triggerComboBanner = (combo: number, matchMax: number) => {
    let title = 'SWEET!';
    let subtitle = '+₦500 Won';
    let color = 'from-pink-500 to-rose-500';

    if (matchMax >= 6) {
      title = 'DIVINE!';
      subtitle = 'Mega Match 6 · +₦1,000';
      color = 'from-amber-400 via-pink-500 to-purple-600';
    } else if (matchMax === 5) {
      title = 'DELICIOUS!';
      subtitle = 'Color Bomb Created · +₦1,000';
      color = 'from-sky-400 via-pink-500 to-amber-400';
    } else if (matchMax === 4) {
      title = 'TASTY!';
      subtitle = 'Striped Candy · +₦800';
      color = 'from-yellow-400 to-orange-500';
    } else if (combo >= 3) {
      title = 'SUGAR CRUSH!';
      subtitle = `${combo}x Cascade Streak`;
      color = 'from-rose-500 to-pink-600';
    } else if (combo >= 2) {
      title = 'DELICIOUS!';
      subtitle = `${combo}x Cascade Combo`;
      color = 'from-sky-400 to-blue-500';
    }

    setComboBanner({ title, subtitle, color });
    setTimeout(() => setComboBanner(null), 1300);
  };

  const checkLevelCompletion = useCallback(
    (newScore: number, newCollected: number) => {
      if (hasWonLevelRef.current) return;
      if (newCollected >= levelConfig.targetCandyCount || newScore >= levelConfig.targetScore) {
        hasWonLevelRef.current = true;
        if (!isMuted) soundFx.playLevelUp();
        setLevelWinModal(true);
        setTotalEarnedNaira((n) => n + 1500);
        claimCandyMatchReward(0, true);
      }
    },
    [claimCandyMatchReward, isMuted, levelConfig.targetCandyCount, levelConfig.targetScore]
  );

  const dropCandiesAndCascade = useCallback(
    async (currentBoard: (CandyItem | null)[][], coordsToRemove: Set<string>, currentCombo = 1) => {
      const currentShape = levelConfig.shape;
      const newBoard: (CandyItem | null)[][] = Array.from({ length: GRID_SIZE }, () =>
        Array(GRID_SIZE).fill(null)
      );

      for (let c = 0; c < GRID_SIZE; c++) {
        const activeRowsInCol: number[] = [];
        const survivingCandies: CandyItem[] = [];

        for (let r = 0; r < GRID_SIZE; r++) {
          if (currentShape[r]?.[c]) {
            activeRowsInCol.push(r);
            const candy = currentBoard[r][c];
            if (candy && !coordsToRemove.has(`${r},${c}`)) {
              survivingCandies.push({ ...candy, isDropping: false });
            }
          }
        }

        const emptySlots = activeRowsInCol.length - survivingCandies.length;
        const freshCandies: CandyItem[] = [];
        for (let i = 0; i < emptySlots; i++) {
          const fresh = createRandomCandy();
          fresh.isDropping = true;
          fresh.dropDelay = i * 32;
          freshCandies.push(fresh);
        }

        const finalColCandies = [...freshCandies, ...survivingCandies];
        activeRowsInCol.forEach((r, idx) => {
          newBoard[r][c] = finalColCandies[idx];
        });
      }

      setBoard(newBoard);
      await new Promise((res) => setTimeout(res, 320));
      await processMatchesAndCascades(newBoard, currentCombo + 1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [createRandomCandy, levelConfig.shape]
  );

  const processMatchesAndCascades = useCallback(
    async (currentBoard: (CandyItem | null)[][], currentCombo = 1) => {
      setIsProcessing(true);
      setHintCells(null);

      const { coords, matchGroups } = findAllMatches(currentBoard, levelConfig.shape);

      if (coords.size === 0) {
        const nextMove = findAvailableMove(currentBoard, levelConfig.shape);
        if (!nextMove) {
          setGameMessageToast('No more moves! Reshuffling candies...');
          setTimeout(() => {
            setBoard(generateInitialBoardForLevel(levelConfig));
            setGameMessageToast(null);
            isProcessingRef.current = false;
            setIsProcessing(false);
          }, 1000);
          return;
        }
        isProcessingRef.current = false;
        setIsProcessing(false);
        return;
      }

      const coordsToDelete = new Set(coords);

      // Trigger Striped Candies inside matched coordinates to clear their row/column!
      coords.forEach((coordKey) => {
        const [rStr, cStr] = coordKey.split(',');
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        const item = currentBoard[r]?.[c];
        if (item?.isSpecial === 'striped_h') {
          for (let col = 0; col < GRID_SIZE; col++) {
            if (levelConfig.shape[r]?.[col] && currentBoard[r]?.[col]) {
              coordsToDelete.add(`${r},${col}`);
            }
          }
        } else if (item?.isSpecial === 'striped_v') {
          for (let row = 0; row < GRID_SIZE; row++) {
            if (levelConfig.shape[row]?.[c] && currentBoard[row]?.[c]) {
              coordsToDelete.add(`${row},${c}`);
            }
          }
        }
      });

      // Count how many target candies were cleared in this cascade step
      let newlyCollectedTarget = 0;
      coordsToDelete.forEach((coordKey) => {
        const [rStr, cStr] = coordKey.split(',');
        const r = parseInt(rStr, 10);
        const c = parseInt(cStr, 10);
        if (currentBoard[r]?.[c]?.type === levelConfig.targetCandyType) {
          newlyCollectedTarget++;
        }
      });

      let maxMatchLen = 3;
      let roundRewardTotal = 0;

      matchGroups.forEach((group) => {
        if (group.length > maxMatchLen) maxMatchLen = group.length;

        let prizeAmount = 500;
        if (group.length >= 5) prizeAmount = 1000;
        else if (group.length === 4) prizeAmount = 800;
        else prizeAmount = 500;

        roundRewardTotal += prizeAmount;

        // Match 5+ spawns Color Bomb Lightning Candy; Match 4 spawns Striped Candy!
        if (group.length >= 5) {
          coordsToDelete.delete(`${group.r},${group.c}`);
          currentBoard[group.r][group.c] = {
            id: 'lightning_' + Math.random().toString(36).substring(2, 8),
            type: 'lightning',
            isSpecial: 'lightning',
          };
          if (!isMuted) soundFx.playLightningStrike();
        } else if (group.length === 4) {
          coordsToDelete.delete(`${group.r},${group.c}`);
          currentBoard[group.r][group.c] = {
            id: 'striped_' + Math.random().toString(36).substring(2, 8),
            type: group.type,
            isSpecial: group.orientation === 'h' ? 'striped_v' : 'striped_h',
          };
        }

        const posX = ((group.c + 0.5) / GRID_SIZE) * 100;
        const posY = ((group.r + 0.5) / GRID_SIZE) * 100;
        const scoreId = 'sc_' + Math.random().toString(36).substring(2, 8);

        setFloatingScores((prev) => [
          ...prev,
          {
            id: scoreId,
            text: `+₦${prizeAmount.toLocaleString()}`,
            subtext:
              group.length >= 5
                ? 'COLOR BOMB!'
                : group.length === 4
                ? 'STRIPED CANDY!'
                : `${group.length * 60 * currentCombo} pts`,
            x: posX,
            y: posY,
            color: group.length >= 5 ? 'text-sky-200' : group.length === 4 ? 'text-yellow-200' : 'text-white',
          },
        ]);

        setTimeout(() => {
          setFloatingScores((prev) => prev.filter((s) => s.id !== scoreId));
        }, 1050);

        const boardEl = boardRef.current;
        if (boardEl) {
          const rect = boardEl.getBoundingClientRect();
          const pX = (posX / 100) * rect.width;
          const pY = (posY / 100) * rect.height;
          const pColor =
            group.type === 'red'
              ? '#ff2a4b'
              : group.type === 'orange'
              ? '#ff8811'
              : group.type === 'yellow'
              ? '#ffd500'
              : group.type === 'green'
              ? '#18c93e'
              : group.type === 'blue'
              ? '#1b9cff'
              : '#a855f7';
          spawnParticles(pX, pY, pColor, 12);
        }

        claimCandyMatchReward(group.length);
      });

      if (!isMuted) {
        soundFx.playCandyMatch(maxMatchLen);
        if (maxMatchLen >= 5) {
          setTimeout(() => soundFx.playSugarCrush(), 220);
        }
      }

      if (currentCombo > highestCombo) setHighestCombo(currentCombo);

      const pointsWon = coordsToDelete.size * 60 * currentCombo + (maxMatchLen >= 4 ? 180 : 0);

      const nextCollected = targetCollectedRef.current + newlyCollectedTarget;
      targetCollectedRef.current = nextCollected;
      const nextScore = sessionScoreRef.current + pointsWon;
      sessionScoreRef.current = nextScore;

      setTargetCollected(nextCollected);
      setSessionScore(nextScore);
      setTotalEarnedNaira((n) => n + roundRewardTotal);
      checkLevelCompletion(nextScore, nextCollected);

      if (currentCombo >= 2 || maxMatchLen >= 4) {
        triggerComboBanner(currentCombo, maxMatchLen);
      }

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

      await new Promise((res) => setTimeout(res, 260));
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

  const executeLightningOverload = async (lightningPos: { r: number; c: number }, targetColor: CandyType) => {
    setIsProcessing(true);
    if (!isMuted) soundFx.playLightningStrike();

    const targets: Array<{ r: number; c: number }> = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (board[r]?.[c]?.type === targetColor) {
          targets.push({ r, c });
        }
      }
    }

    setLightningZap({ from: lightningPos, targets, color: targetColor });
    const bigWinPrize = 1000;

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
    claimCandyMatchReward(5, false);

    const scoreId = 'sc_' + Math.random().toString(36).substring(2, 7);
    setFloatingScores((prev) => [
      ...prev,
      {
        id: scoreId,
        text: `+₦${bigWinPrize.toLocaleString()}`,
        subtext: `Color Bomb · ${targets.length} cleared!`,
        x: 50,
        y: 42,
        color: 'text-amber-200',
      },
    ]);
    setTimeout(() => setFloatingScores((prev) => prev.filter((s) => s.id !== scoreId)), 1200);

    triggerComboBanner(4, 5);
    const struckTargetCount = targetColor === levelConfig.targetCandyType ? targets.length : 0;
    const nextCollected = targetCollectedRef.current + struckTargetCount;
    targetCollectedRef.current = nextCollected;
    const nextScore = sessionScoreRef.current + targets.length * 120;
    sessionScoreRef.current = nextScore;

    setTargetCollected(nextCollected);
    setTotalEarnedNaira((n) => n + bigWinPrize);
    setSessionScore(nextScore);
    checkLevelCompletion(nextScore, nextCollected);

    const newMoves = movesLeft - 1;
    setMovesLeft(newMoves);

    await new Promise((res) => setTimeout(res, 460));
    setLightningZap(null);

    const coordsToDelete = new Set([
      ...targets.map((t) => `${t.r},${t.c}`),
      `${lightningPos.r},${lightningPos.c}`,
    ]);

    await dropCandiesAndCascade(updatedBoard, coordsToDelete, 1);

    if (newMoves <= 0 && !hasWonLevelRef.current) {
      setTimeout(() => {
        if (!hasWonLevelRef.current) {
          if (!isMuted) soundFx.playSugarCrush();
          setRoundCompleteModal(true);
        }
      }, 650);
    }
  };

  const handleSwap = async (r1: number, c1: number, r2: number, c2: number) => {
    if (isProcessingRef.current || movesLeft <= 0 || hasWonLevelRef.current) return;
    if (!levelConfig.shape[r1]?.[c1] || !levelConfig.shape[r2]?.[c2]) return;

    const candy1 = board[r1]?.[c1];
    const candy2 = board[r2]?.[c2];
    if (!candy1 || !candy2) return;

    const dist = Math.abs(r1 - r2) + Math.abs(c1 - c2);
    if (dist !== 1) {
      setSelectedCell({ r: r2, c: c2 });
      return;
    }

    isProcessingRef.current = true;
    setIsProcessing(true);
    setSelectedCell(null);
    setHintCells(null);
    setDragState(null);

    if (candy1.isSpecial === 'lightning' || candy2.isSpecial === 'lightning') {
      const lightningPos = candy1.isSpecial === 'lightning' ? { r: r1, c: c1 } : { r: r2, c: c2 };
      const otherCandy = candy1.isSpecial === 'lightning' ? candy2 : candy1;
      await executeLightningOverload(lightningPos, otherCandy.type === 'lightning' ? levelConfig.targetCandyType : otherCandy.type);
      return;
    }

    const dr = r2 - r1;
    const dc = c2 - c1;

    setSwapState({ r1, c1, r2, c2, dr, dc, isReverting: false });
    if (!isMuted) soundFx.playCandySwap();

    await new Promise((res) => setTimeout(res, 190));

    const nextBoard = board.map((row) => [...row]);
    const temp = nextBoard[r1][c1];
    nextBoard[r1][c1] = nextBoard[r2][c2];
    nextBoard[r2][c2] = temp;

    const { coords } = findAllMatches(nextBoard, levelConfig.shape);

    if (coords.size === 0) {
      setSwapState({ r1, c1, r2, c2, dr, dc, isReverting: true });
      if (!isMuted) soundFx.playInvalidSwap();
      await new Promise((res) => setTimeout(res, 190));
      setSwapState(null);
      isProcessingRef.current = false;
      setIsProcessing(false);
      return;
    }

    setSwapState(null);
    setBoard(nextBoard);

    const newMoves = movesLeft - 1;
    setMovesLeft(newMoves);

    await processMatchesAndCascades(nextBoard, 1);

    if (newMoves <= 0 && !hasWonLevelRef.current) {
      setTimeout(() => {
        if (!hasWonLevelRef.current) {
          if (!isMuted) soundFx.playSugarCrush();
          setRoundCompleteModal(true);
        }
      }, 650);
    }
  };

  const handleCellSelectOrSwap = (r: number, c: number) => {
    if (isProcessingRef.current || movesLeft <= 0 || !levelConfig.shape[r]?.[c] || !board[r]?.[c]) return;

    if (!selectedCell) {
      if (!isMuted) soundFx.playClick();
      setSelectedCell({ r, c });
      setHintCells(null);
    } else if (selectedCell.r === r && selectedCell.c === c) {
      setSelectedCell(null);
    } else {
      handleSwap(selectedCell.r, selectedCell.c, r, c);
    }
  };

  // Unified Pointer Drag + Tap handlers (works seamlessly on both Mobile Touch & Desktop Mouse!)
  const handlePointerDown = (r: number, c: number, e: React.PointerEvent<HTMLDivElement>) => {
    if (isProcessingRef.current || movesLeft <= 0 || !levelConfig.shape[r]?.[c] || !board[r]?.[c]) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    pointerStartRef.current = { r, c, x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setDragState({
      r,
      c,
      startX: e.clientX,
      startY: e.clientY,
      currentDx: 0,
      currentDy: 0,
      dominantAxis: null,
      targetNeighbor: null,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current || isProcessingRef.current || movesLeft <= 0) return;
    if (e.pointerId !== pointerStartRef.current.pointerId) return;

    const rawDx = e.clientX - pointerStartRef.current.x;
    const rawDy = e.clientY - pointerStartRef.current.y;
    const { r, c } = pointerStartRef.current;

    const absDx = Math.abs(rawDx);
    const absDy = Math.abs(rawDy);
    const maxOffset = 44;

    const dominantAxis: 'x' | 'y' = absDx >= absDy ? 'x' : 'y';
    let targetNeighbor: { r: number; c: number } | null = null;
    let clampedDx = 0;
    let clampedDy = 0;

    if (dominantAxis === 'x' && absDx > 4) {
      const dir = rawDx > 0 ? 1 : -1;
      const targetC = c + dir;
      if (targetC >= 0 && targetC < GRID_SIZE && levelConfig.shape[r]?.[targetC]) {
        clampedDx = Math.max(-maxOffset, Math.min(maxOffset, rawDx));
        targetNeighbor = { r, c: targetC };
      }
    } else if (dominantAxis === 'y' && absDy > 4) {
      const dir = rawDy > 0 ? 1 : -1;
      const targetR = r + dir;
      if (targetR >= 0 && targetR < GRID_SIZE && levelConfig.shape[targetR]?.[c]) {
        clampedDy = Math.max(-maxOffset, Math.min(maxOffset, rawDy));
        targetNeighbor = { r: targetR, c };
      }
    }

    // Auto-trigger immediate swap as soon as swipe reaches threshold for snappy Candy Crush feel
    if ((Math.abs(clampedDx) >= 24 || Math.abs(clampedDy) >= 24) && targetNeighbor) {
      pointerStartRef.current = null;
      setDragState(null);
      handleSwap(r, c, targetNeighbor.r, targetNeighbor.c);
      return;
    }

    setDragState({
      r,
      c,
      startX: pointerStartRef.current.x,
      startY: pointerStartRef.current.y,
      currentDx: clampedDx,
      currentDy: clampedDy,
      dominantAxis,
      targetNeighbor,
    });
  };

  const handlePointerUpOrCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!pointerStartRef.current) return;
    if (e.pointerId !== pointerStartRef.current.pointerId) return;

    const { r, c } = pointerStartRef.current;
    const currentDrag = dragState;
    pointerStartRef.current = null;
    setDragState(null);

    if (isProcessingRef.current || movesLeft <= 0) return;

    if (
      currentDrag &&
      currentDrag.targetNeighbor &&
      (Math.abs(currentDrag.currentDx) >= 16 || Math.abs(currentDrag.currentDy) >= 16)
    ) {
      handleSwap(r, c, currentDrag.targetNeighbor.r, currentDrag.targetNeighbor.c);
    } else {
      handleCellSelectOrSwap(r, c);
    }
  };

  const handleRequestHint = () => {
    if (isProcessingRef.current || movesLeft <= 0) return;
    if (!isMuted) soundFx.playClick();
    setShowSettingsModal(false);
    const move = findAvailableMove(board, levelConfig.shape);
    if (move) {
      setHintCells(move);
      setGameMessageToast('Hint: Swap the glowing candies!');
      setTimeout(() => setGameMessageToast(null), 2600);
    } else {
      setGameMessageToast('Reshuffling board...');
      setTimeout(() => {
        setBoard(generateInitialBoardForLevel(levelConfig));
        setGameMessageToast(null);
      }, 800);
    }
  };

  const handleShuffleBoard = () => {
    if (isProcessingRef.current || movesLeft <= 0) return;
    if (!isMuted) soundFx.playClick();
    setShowSettingsModal(false);
    setBoard(generateInitialBoardForLevel(levelConfig));
    setSelectedCell(null);
    setHintCells(null);
    setGameMessageToast('Board reshuffled with fresh candies!');
    setTimeout(() => setGameMessageToast(null), 2000);
  };

  const advanceToNextLevel = () => {
    if (!isMuted) soundFx.playClick();
    if (currentLevel < 1000) {
      setCurrentLevel((prev) => prev + 1);
    } else {
      setGameMessageToast('Incredible! You conquered all 1,000 Candy Crush levels!');
    }
    setLevelWinModal(false);
  };

  const retryCurrentLevel = () => {
    if (!isMuted) soundFx.playClick();
    hasWonLevelRef.current = false;
    isProcessingRef.current = false;
    sessionScoreRef.current = 0;
    targetCollectedRef.current = 0;
    setIsProcessing(false);
    setShowSettingsModal(false);
    setBoard(generateInitialBoardForLevel(levelConfig));
    setMovesLeft(levelConfig.totalMoves);
    setSessionScore(0);
    setTargetCollected(0);
    setTotalEarnedNaira(0);
    setRoundCompleteModal(false);
    setLevelWinModal(false);
    setSelectedCell(null);
    setHintCells(null);
  };

  // Classic Glossy 3D Candy SVG Graphics matching the exact Candy Crush visual style
  const renderCandySvg = (
    type: CandyType,
    special?: 'striped_h' | 'striped_v' | 'lightning',
    compact = false
  ) => {
    const shadowClass = compact
      ? 'w-full h-full drop-shadow-[0_2px_3px_rgba(0,0,0,0.3)] select-none pointer-events-none'
      : 'w-full h-full drop-shadow-[0_3px_4px_rgba(0,0,0,0.38)] select-none pointer-events-none';

    const stripeOverlay =
      special === 'striped_h' ? (
        <g opacity="0.88">
          <rect x="16" y="34" width="68" height="7" rx="3.5" fill="#ffffff" />
          <rect x="14" y="48" width="72" height="7" rx="3.5" fill="#ffffff" />
          <rect x="16" y="62" width="68" height="7" rx="3.5" fill="#ffffff" />
        </g>
      ) : special === 'striped_v' ? (
        <g opacity="0.88">
          <rect x="34" y="16" width="7" height="68" rx="3.5" fill="#ffffff" />
          <rect x="48" y="14" width="7" height="72" rx="3.5" fill="#ffffff" />
          <rect x="62" y="16" width="7" height="68" rx="3.5" fill="#ffffff" />
        </g>
      ) : null;

    switch (type) {
      case 'lightning':
        return (
          <svg viewBox="0 0 100 100" className={`${shadowClass} animate-lightning-pulse`}>
            <circle cx="50" cy="50" r="39" fill="url(#candyGrad_lightning)" stroke="#ffe59e" strokeWidth="2.5" />
            <circle cx="34" cy="36" r="5" fill="#ff3b5c" />
            <circle cx="64" cy="34" r="5" fill="#2ee55d" />
            <circle cx="32" cy="60" r="5" fill="#ffcf26" />
            <circle cx="66" cy="62" r="5" fill="#35a7ff" />
            <circle cx="50" cy="74" r="4.5" fill="#ff8a1e" />
            <circle cx="50" cy="26" r="4.5" fill="#e879f9" />
            <polygon
              points="53,22 36,50 49,50 43,78 65,46 52,46 60,22"
              fill="#fde047"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <ellipse cx="37" cy="30" rx="8" ry="4" fill="#ffffff" opacity="0.7" transform="rotate(-25 37 30)" />
          </svg>
        );

      case 'red':
        // Classic Curved Red Jelly Bean rotated diagonally like the screenshot
        return (
          <svg viewBox="0 0 100 100" className={shadowClass}>
            <g transform="rotate(-38 50 50)">
              <path
                d="M20 46 C20 26, 40 20, 56 26 C72 32, 82 40, 82 54 C82 69, 68 76, 54 70 C41 64, 34 66, 25 62 C18 59, 20 52, 20 46 Z"
                fill="url(#candyGrad_red)"
                stroke="#ff9aa8"
                strokeWidth="1.6"
              />
              {/* Bottom rich shadow */}
              <path
                d="M23 56 C33 63, 44 61, 56 67 C68 72, 78 66, 80 55 C77 65, 67 70, 55 65 C43 59, 32 61, 23 56 Z"
                fill="#7f0416"
                opacity="0.65"
              />
              {/* Glossy curved top shine */}
              <path
                d="M29 39 C36 30, 52 29, 66 36 C56 36, 42 36, 32 45 Z"
                fill="#ffffff"
                opacity="0.78"
              />
              <ellipse cx="38" cy="36" rx="10" ry="4" fill="#ffffff" opacity="0.88" transform="rotate(-12 38 36)" />
              <circle cx="67" cy="40" r="2.8" fill="#ffffff" opacity="0.82" />
            </g>
            {stripeOverlay}
          </svg>
        );

      case 'blue':
        // Classic Glossy Blue Round Hard Candy with equatorial band
        return (
          <svg viewBox="0 0 100 100" className={shadowClass}>
            <circle
              cx="50"
              cy="50"
              r="37"
              fill="url(#candyGrad_blue)"
              stroke="#93d5ff"
              strokeWidth="1.8"
            />
            {/* Horizontal subtle lollipop band */}
            <path
              d="M14 52 Q 50 61 86 52"
              fill="none"
              stroke="#03489c"
              strokeWidth="4.5"
              opacity="0.45"
              strokeLinecap="round"
            />
            <path
              d="M15 48 Q 50 57 85 48"
              fill="none"
              stroke="#7dd3fc"
              strokeWidth="2.5"
              opacity="0.55"
              strokeLinecap="round"
            />
            {/* Top-left bright glass shine */}
            <ellipse cx="38" cy="32" rx="14" ry="7" fill="#ffffff" opacity="0.82" transform="rotate(-24 38 32)" />
            <ellipse cx="32" cy="29" rx="5.5" ry="2.8" fill="#ffffff" opacity="0.95" transform="rotate(-24 32 29)" />
            <circle cx="58" cy="27" r="3" fill="#ffffff" opacity="0.7" />
            {/* Bottom rim light */}
            <path d="M32 77 Q 50 84 68 77" fill="none" stroke="#bae6fd" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
            {stripeOverlay}
          </svg>
        );

      case 'orange':
        // Classic Vertical Orange Oval Lozenge with inner indented oval ring
        return (
          <svg viewBox="0 0 100 100" className={shadowClass}>
            <ellipse
              cx="50"
              cy="50"
              rx="28"
              ry="38"
              fill="url(#candyGrad_orange)"
              stroke="#ffd08a"
              strokeWidth="1.8"
            />
            {/* Embossed inner oval indentation */}
            <ellipse
              cx="50"
              cy="50"
              rx="16"
              ry="25"
              fill="none"
              stroke="#c2410c"
              strokeWidth="3.5"
              opacity="0.45"
            />
            <ellipse
              cx="50"
              cy="50"
              rx="15"
              ry="24"
              fill="none"
              stroke="#fed7aa"
              strokeWidth="1.6"
              opacity="0.7"
            />
            {/* Glossy top-left shine */}
            <ellipse cx="37" cy="30" rx="6" ry="12" fill="#ffffff" opacity="0.75" transform="rotate(14 37 30)" />
            <circle cx="62" cy="30" r="2.5" fill="#ffffff" opacity="0.75" />
            {stripeOverlay}
          </svg>
        );

      case 'green':
        // Classic Pillowed Emerald Green Square
        return (
          <svg viewBox="0 0 100 100" className={shadowClass}>
            <rect
              x="14"
              y="14"
              width="72"
              height="72"
              rx="16"
              fill="url(#candyGrad_green)"
              stroke="#9ef7ae"
              strokeWidth="1.8"
            />
            {/* Inner soft pillow bevel */}
            <rect
              x="21"
              y="21"
              width="58"
              height="58"
              rx="12"
              fill="none"
              stroke="#ffffff"
              strokeWidth="1.6"
              opacity="0.38"
            />
            {/* Top glossy highlight arc */}
            <path d="M24 25 Q 50 18 76 25 L 72 34 Q 50 28 28 34 Z" fill="#ffffff" opacity="0.52" />
            <circle cx="30" cy="28" r="3.5" fill="#ffffff" opacity="0.88" />
            {/* Bottom deep green bevel */}
            <path d="M22 76 Q 50 83 78 76" stroke="#064e1b" strokeWidth="3.5" strokeLinecap="round" fill="none" opacity="0.55" />
            {stripeOverlay}
          </svg>
        );

      case 'yellow':
        // Classic Yellow Lemon Drop Teardrop (pointed top, plump rounded base)
        return (
          <svg viewBox="0 0 100 100" className={shadowClass}>
            <path
              d="M50 12 C67 30, 82 47, 82 64 A 32 28 0 0 1 18 64 C18 47, 33 30, 50 12 Z"
              fill="url(#candyGrad_yellow)"
              stroke="#fef9c3"
              strokeWidth="1.8"
            />
            {/* Inner sculpted teardrop ridge */}
            <path
              d="M50 23 C62 37, 72 50, 72 62 A 22 19 0 0 1 28 62 C28 50, 38 37, 50 23 Z"
              fill="none"
              stroke="#ca8a04"
              strokeWidth="2.5"
              opacity="0.35"
            />
            {/* Bright curved shine on left shoulder */}
            <path
              d="M47 22 C37 35, 29 49, 30 61 C33 50, 40 37, 49 26 Z"
              fill="#ffffff"
              opacity="0.85"
            />
            <ellipse cx="38" cy="48" rx="4.5" ry="9" fill="#ffffff" opacity="0.82" transform="rotate(24 38 48)" />
            <path d="M35 80 Q 50 87 65 80" stroke="#fef08a" strokeWidth="2.2" strokeLinecap="round" fill="none" opacity="0.7" />
            {stripeOverlay}
          </svg>
        );

      case 'purple':
        return (
          <svg viewBox="0 0 100 100" className={shadowClass}>
            <path
              d="M50 13 L82 42 L68 83 L32 83 L18 42 Z"
              fill="url(#candyGrad_purple)"
              stroke="#e9d5ff"
              strokeWidth="1.8"
            />
            <polygon points="50,24 70,44 61,72 39,72 30,44" fill="none" stroke="#ffffff" strokeWidth="1.4" opacity="0.4" />
            <ellipse cx="40" cy="36" rx="9" ry="4.5" fill="#ffffff" opacity="0.8" transform="rotate(-25 40 36)" />
            {stripeOverlay}
          </svg>
        );
    }
  };

  const scorePct = Math.min(100, Math.round((sessionScore / levelConfig.targetScore) * 100));
  const star1Reached = scorePct >= 33;
  const star2Reached = scorePct >= 66;
  const star3Reached = scorePct >= 100;
  const remainingTargetCount = Math.max(0, levelConfig.targetCandyCount - targetCollected);

  // Classic Candy Crush Gameplay Canvas (shared in embedded & fullscreen modes)
  const renderCandyKingdomViewport = (isFull: boolean) => (
    <div
      ref={containerRef}
      style={{ touchAction: 'none' }}
      className={`relative w-full mx-auto select-none touch-none overscroll-none overflow-hidden flex flex-col justify-between shadow-2xl ${
        isFull
          ? 'fixed inset-0 z-50 rounded-none border-none max-w-none'
          : 'max-w-[540px] rounded-[28px] border-[3px] border-[#ff82ca]'
      }`}
    >
      {/* Sunny Candy Kingdom Sky, Clouds, Hills & Cottage Background */}
      <CandyAnimatedBackground hasLightning={hasLightningOnBoard} />

      {/* SVG Material Gradients for Classic 3D Candies */}
      <svg className="absolute w-0 h-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <defs>
          <radialGradient id="candyGrad_red" cx="35%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#ff94a1" />
            <stop offset="28%" stopColor="#ff1e38" />
            <stop offset="72%" stopColor="#d1001c" />
            <stop offset="100%" stopColor="#7a0010" />
          </radialGradient>
          <radialGradient id="candyGrad_blue" cx="35%" cy="28%" r="70%">
            <stop offset="0%" stopColor="#bfe8ff" />
            <stop offset="26%" stopColor="#26a9ff" />
            <stop offset="68%" stopColor="#0066e6" />
            <stop offset="100%" stopColor="#003594" />
          </radialGradient>
          <radialGradient id="candyGrad_orange" cx="34%" cy="28%" r="72%">
            <stop offset="0%" stopColor="#ffe1a8" />
            <stop offset="25%" stopColor="#ffa21a" />
            <stop offset="70%" stopColor="#ef6c00" />
            <stop offset="100%" stopColor="#9a3400" />
          </radialGradient>
          <radialGradient id="candyGrad_green" cx="32%" cy="26%" r="74%">
            <stop offset="0%" stopColor="#b8ffc4" />
            <stop offset="25%" stopColor="#2de34d" />
            <stop offset="68%" stopColor="#05a31d" />
            <stop offset="100%" stopColor="#025910" />
          </radialGradient>
          <radialGradient id="candyGrad_yellow" cx="36%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="22%" stopColor="#fff380" />
            <stop offset="58%" stopColor="#ffd000" />
            <stop offset="90%" stopColor="#d99200" />
            <stop offset="100%" stopColor="#8c5400" />
          </radialGradient>
          <radialGradient id="candyGrad_purple" cx="35%" cy="30%" r="72%">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="28%" stopColor="#c054ff" />
            <stop offset="70%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#4c097a" />
          </radialGradient>
          <radialGradient id="candyGrad_lightning" cx="36%" cy="30%" r="68%">
            <stop offset="0%" stopColor="#9d6b53" />
            <stop offset="45%" stopColor="#592e1b" />
            <stop offset="100%" stopColor="#2a1106" />
          </radialGradient>
        </defs>
      </svg>

      {/* 1. TOP PINK CANDY HUD BAR (Matches screenshot: Moves | Stars + Score | Target) */}
      <div
        className="relative z-20 px-2.5 sm:px-4 pt-2 pb-2.5 rounded-b-[26px] border-b-[3px] border-[#d93691] shadow-[0_5px_14px_rgba(145,15,84,0.38)]"
        style={{
          background: 'linear-gradient(180deg, #ffc4e8 0%, #ff85cb 45%, #f54da9 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.75), 0 5px 14px rgba(145,15,84,0.35)',
        }}
      >
        <div className="grid grid-cols-12 items-center gap-2 max-w-[520px] mx-auto">
          {/* Left Panel: Moves */}
          <div
            className="col-span-3 rounded-2xl px-2 py-1.5 text-center border border-white/85"
            style={{
              background: 'linear-gradient(180deg, #fff5fb 0%, #ffd5ec 100%)',
              boxShadow: 'inset 0 2px 5px rgba(190,40,120,0.16), 0 2px 4px rgba(130,15,75,0.18)',
            }}
          >
            <div className="text-[11px] sm:text-xs font-extrabold italic text-[#7a124d] leading-none">
              Moves
            </div>
            <div
              className={`text-2xl sm:text-3xl font-black tabular-nums leading-tight mt-0.5 ${
                movesLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-[#630b3e]'
              }`}
            >
              {movesLeft}
            </div>
          </div>

          {/* Center Panel: 3-Star Progress Meter & Score */}
          <div className="col-span-6 flex flex-col items-center gap-1.5">
            {/* 3-Star Progress Track */}
            <div className="relative w-full max-w-[205px] h-5 flex items-center px-1">
              <div className="w-full h-3 rounded-full bg-[#c92882]/75 border border-white/60 overflow-hidden shadow-inner">
                <div
                  style={{ width: `${scorePct}%` }}
                  className="h-full bg-gradient-to-r from-[#ffdf4d] via-[#ffaf19] to-[#ff6db9] transition-all duration-300 rounded-full"
                />
              </div>

              {/* 3 Stars */}
              {[
                { left: '24%', active: star1Reached },
                { left: '50%', active: star2Reached },
                { left: '78%', active: star3Reached },
              ].map((star, idx) => (
                <div
                  key={idx}
                  style={{ left: star.left }}
                  className="absolute -translate-x-1/2 top-1/2 -translate-y-1/2"
                >
                  <svg viewBox="0 0 32 32" className="w-5 h-5 drop-shadow-[0_1px_2px_rgba(95,10,55,0.5)]">
                    <polygon
                      points="16,2 20.3,10.8 30,12.2 23,19 24.6,28.7 16,24.1 7.4,28.7 9,19 2,12.2 11.7,10.8"
                      fill={star.active ? '#ffd426' : '#f472b6'}
                      stroke="#ffffff"
                      strokeWidth="2.2"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              ))}
            </div>

            {/* Score Box */}
            <div
              className="w-full rounded-2xl px-3 py-1 flex items-center justify-between border border-white/85"
              style={{
                background: 'linear-gradient(180deg, #fff5fb 0%, #ffd5ec 100%)',
                boxShadow: 'inset 0 2px 5px rgba(190,40,120,0.16), 0 2px 4px rgba(130,15,75,0.18)',
              }}
            >
              <span className="text-xs sm:text-sm font-extrabold italic text-[#7a124d]">
                Score:
              </span>
              <span className="text-sm sm:text-base font-black tabular-nums text-[#630b3e]">
                {sessionScore.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Right Panel: Target Candy & Remaining Count */}
          <div
            className="col-span-3 rounded-2xl px-2 py-1.5 text-center border border-white/85"
            style={{
              background: 'linear-gradient(180deg, #fff5fb 0%, #ffd5ec 100%)',
              boxShadow: 'inset 0 2px 5px rgba(190,40,120,0.16), 0 2px 4px rgba(130,15,75,0.18)',
            }}
          >
            <div className="text-[11px] sm:text-xs font-extrabold italic text-[#7a124d] leading-none">
              Target:
            </div>
            <div className="flex items-center justify-center gap-1 mt-0.5">
              <div className="w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0">
                {renderCandySvg(levelConfig.targetCandyType, undefined, true)}
              </div>
              <span className="text-base sm:text-lg font-black tabular-nums text-[#630b3e]">
                {remainingTargetCount === 0 ? '✓' : remainingTargetCount}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Optional Toast Message */}
      {gameMessageToast && (
        <div className="relative z-30 mx-auto mt-1.5 px-3 py-1 rounded-full bg-white/95 border border-pink-300 text-[#630b3e] text-xs font-extrabold shadow-md animate-in fade-in">
          {gameMessageToast}
        </div>
      )}

      {/* 2. CLASSIC 8x8 STEEL-BLUE CANDY CRUSH GRID BOARD */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-2.5 sm:px-5 py-3">
        <div
          ref={boardRef}
          style={{ touchAction: 'none' }}
          className={`relative w-full aspect-square rounded-[14px] p-1 border-[3px] border-[#30598a] shadow-[0_12px_28px_rgba(12,38,74,0.45)] overflow-hidden select-none touch-none overscroll-none ${
            isFull ? 'max-w-[min(94vw,490px)]' : 'max-w-[min(92vw,450px)]'
          }`}
        >
          {/* Translucent Steel-Blue Backdrop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: 'rgba(54, 102, 158, 0.84)' }}
          />

          {/* Lightning Zap Rays */}
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
                      stroke="#fde047"
                      strokeWidth="4"
                      strokeLinecap="round"
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

          {/* Combo Celebration Banner */}
          {comboBanner && (
            <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-center p-4 animate-in zoom-in-50 duration-200">
              <div
                className={`px-5 py-3 rounded-3xl bg-gradient-to-r ${comboBanner.color} text-white font-black text-center shadow-2xl border-4 border-white`}
              >
                <div className="text-2xl sm:text-3xl italic tracking-tight drop-shadow-md">
                  {comboBanner.title}
                </div>
                <div className="text-xs font-extrabold text-amber-100 mt-0.5">
                  {comboBanner.subtitle}
                </div>
              </div>
            </div>
          )}

          {/* Floating Naira Rewards */}
          {floatingScores.map((score) => (
            <div
              key={score.id}
              style={{ left: `${score.x}%`, top: `${score.y}%` }}
              className={`absolute z-30 pointer-events-none -translate-x-1/2 -translate-y-1/2 font-black text-xs sm:text-sm animate-score-float ${score.color}`}
            >
              <div className="flex flex-col items-center">
                <span className="px-2 py-0.5 rounded-full bg-[#630b3e]/90 border border-white/60 text-white shadow-md whitespace-nowrap">
                  {score.text}
                </span>
                {score.subtext && (
                  <span className="text-[9px] font-bold text-[#630b3e] bg-amber-300 px-1.5 py-0.2 rounded mt-0.5 whitespace-nowrap shadow">
                    {score.subtext}
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Candy Burst Particles */}
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
                className="absolute pointer-events-none"
              />
            ))}
          </div>

          {/* 8x8 Grid Cells */}
          <div
            style={{ touchAction: 'none' }}
            className="relative z-10 grid grid-cols-8 w-full h-full select-none touch-none overscroll-none"
          >
            {board.map((row, r) =>
              row.map((candy, c) => {
                const isActive = levelConfig.shape[r]?.[c];

                if (!isActive) {
                  return (
                    <div
                      key={`void_${r}_${c}`}
                      className="aspect-square relative opacity-0 pointer-events-none"
                    />
                  );
                }

                if (!candy) {
                  return (
                    <div
                      key={`empty_${r}_${c}`}
                      className="aspect-square relative border border-[#8ac0f4]/25 bg-[#3e72ad]/55"
                    />
                  );
                }

                const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                const isHint =
                  hintCells &&
                  ((hintCells.r1 === r && hintCells.c1 === c) ||
                    (hintCells.r2 === r && hintCells.c2 === c));

                let transformStr = '';
                let transitionStr = '';
                let zIndex = 10;

                if (swapState) {
                  if (swapState.r1 === r && swapState.c1 === c) {
                    zIndex = 25;
                    transitionStr = 'transform 180ms cubic-bezier(0.25, 1, 0.5, 1)';
                    transformStr = swapState.isReverting
                      ? 'translate(0, 0)'
                      : `translate(${swapState.dc * 100}%, ${swapState.dr * 100}%)`;
                  } else if (swapState.r2 === r && swapState.c2 === c) {
                    zIndex = 25;
                    transitionStr = 'transform 180ms cubic-bezier(0.25, 1, 0.5, 1)';
                    transformStr = swapState.isReverting
                      ? 'translate(0, 0)'
                      : `translate(${-swapState.dc * 100}%, ${-swapState.dr * 100}%)`;
                  }
                } else if (dragState && dragState.r === r && dragState.c === c) {
                  zIndex = 35;
                  transformStr = `translate3d(${dragState.currentDx}px, ${dragState.currentDy}px, 0) scale(1.1)`;
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

                return (
                  <div
                    key={`${r}_${c}`}
                    onPointerDown={(e) => handlePointerDown(r, c, e)}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUpOrCancel}
                    onPointerCancel={handlePointerUpOrCancel}
                    style={{ touchAction: 'none' }}
                    className={`aspect-square relative flex items-center justify-center p-[5%] cursor-pointer select-none touch-none border border-[#8ac0f4]/30 transition-colors ${
                      isSelected
                        ? 'bg-[#69a9ec]/55 ring-2 ring-white z-20'
                        : isHint
                        ? 'bg-amber-300/45 ring-2 ring-yellow-300 animate-pulse z-20'
                        : 'bg-[#4274ad]/45 hover:bg-[#5389c4]/55'
                    }`}
                  >
                    <div
                      key={candy.id}
                      style={{
                        transform: transformStr,
                        transition: transitionStr,
                        zIndex,
                      }}
                      className={`relative w-full h-full flex items-center justify-center select-none pointer-events-none ${
                        candy.isMatched
                          ? 'animate-candy-pop'
                          : candy.isDropping
                          ? 'animate-candy-drop'
                          : ''
                      }`}
                    >
                      {renderCandySvg(candy.type, candy.isSpecial)}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* 3. BOTTOM PINK FOOTER BAR & CIRCULAR GEAR SETTINGS BUTTON (Exact match to screenshot) */}
      <div
        className="relative z-20 h-12 sm:h-14 rounded-t-[26px] border-t-[3px] border-[#ffbae3] px-3 sm:px-5 flex items-center justify-between"
        style={{
          background: 'linear-gradient(180deg, #ffa0d6 0%, #ff73c2 55%, #ea439f 100%)',
          boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.65), 0 -4px 12px rgba(150,20,90,0.22)',
        }}
      >
        {/* Bottom-Left Glossy Pink Gear Button */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              if (!isMuted) soundFx.playClick();
              setShowSettingsModal(true);
            }}
            aria-label="Game Settings"
            className="-mt-4 w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-[3.5px] border-[#ffd6ee] shadow-[0_4px_12px_rgba(125,10,70,0.45)] active:scale-95 transition-transform cursor-pointer"
            style={{
              background: 'linear-gradient(180deg, #ff54b5 0%, #e01386 65%, #b80b6a 100%)',
            }}
          >
            <Settings className="w-6 h-6 sm:w-7 sm:h-7 text-white fill-white/15" />
          </button>

          <div className="flex items-center gap-2 text-xs font-extrabold text-[#630b3e]">
            <span>Level {currentLevel}</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums text-white drop-shadow-[0_1px_1px_rgba(110,10,60,0.55)]">
              +{formatNaira(totalEarnedNaira)} Won
            </span>
          </div>
        </div>

        {/* Clean Quick Action Controls on Right */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleRequestHint}
            disabled={isProcessing}
            title="Show Hint"
            className="w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#7a124d] flex items-center justify-center shadow-sm cursor-pointer disabled:opacity-50"
          >
            <Lightbulb className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
            className="w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#7a124d] flex items-center justify-center shadow-sm cursor-pointer"
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? 'Exit Fullscreen' : 'Full Screen'}
            className="w-8 h-8 rounded-full bg-white/85 hover:bg-white text-[#7a124d] flex items-center justify-center shadow-sm cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* SETTINGS MODAL (Triggered by the Pink Gear Button) */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div
            className="w-full max-w-xs rounded-3xl border-[3px] border-white p-5 space-y-3 shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #fff5fb 0%, #ffd8ee 100%)',
            }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-[#630b3e] flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-[#e01386]" />
                <span>Game Options</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="w-8 h-8 rounded-full bg-[#ff85cb]/30 hover:bg-[#ff85cb]/50 text-[#630b3e] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-[#7a124d] font-semibold flex items-center justify-between bg-white/75 px-3 py-2 rounded-xl border border-pink-200">
              <span>Wallet Balance</span>
              <span className="font-black tabular-nums">{formatNaira(user?.balance || 0)}</span>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsMuted(!isMuted);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-[#630b3e] font-bold text-xs flex items-center justify-between cursor-pointer"
              >
                <span>Sound Effects</span>
                <span className="font-extrabold text-[#e01386]">{isMuted ? 'Off' : 'On'}</span>
              </button>

              <button
                type="button"
                onClick={handleShuffleBoard}
                disabled={isProcessing}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-[#630b3e] font-bold text-xs flex items-center justify-between cursor-pointer disabled:opacity-50"
              >
                <span>Shuffle Candies</span>
                <RotateCcw className="w-4 h-4 text-[#e01386]" />
              </button>

              <button
                type="button"
                onClick={retryCurrentLevel}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-[#630b3e] font-bold text-xs flex items-center justify-between cursor-pointer"
              >
                <span>Restart Level {currentLevel}</span>
                <RotateCcw className="w-4 h-4 text-rose-500" />
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowSettingsModal(false);
                  if (isFullscreen) setIsFullscreen(false);
                  setIsPlaying(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-pink-50 border border-pink-200 text-rose-600 font-bold text-xs flex items-center justify-between cursor-pointer"
              >
                <span>Exit to Earn Hub</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="w-full py-3 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-md cursor-pointer"
              style={{
                background: 'linear-gradient(180deg, #ff4fb1 0%, #d91680 100%)',
              }}
            >
              Resume Game
            </button>
          </div>
        </div>
      )}

      {/* LEVEL WON MODAL */}
      {levelWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-sm rounded-3xl border-[3px] border-white p-6 text-center space-y-4 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #fff6fc 0%, #ffd4ec 100%)' }}
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-white flex items-center justify-center text-white shadow-xl animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#d91680]">
                Level {currentLevel} Complete!
              </div>
              <h3 className="text-2xl font-black text-[#630b3e] mt-0.5">
                Sweet Victory!
              </h3>
              <p className="text-xs text-[#7a124d] mt-1">
                Score: {sessionScore.toLocaleString()} pts · Level {currentLevel + 1} unlocked!
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-pink-200 text-center space-y-1 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a124d]">
                Cash Won (Includes +₦1,500 Level Bonus)
              </div>
              <div className="text-3xl font-black text-emerald-600 tabular-nums">
                +{formatNaira(totalEarnedNaira)}
              </div>
              <div className="text-[10px] font-semibold text-emerald-700 flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Credited to your 9jacash wallet</span>
              </div>
            </div>

            <button
              type="button"
              onClick={advanceToNextLevel}
              className="w-full py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ background: 'linear-gradient(180deg, #ff4fb1 0%, #d91680 100%)' }}
            >
              <span>Next Level ({currentLevel + 1})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* OUT OF MOVES ROUND COMPLETE MODAL */}
      {roundCompleteModal && !levelWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div
            className="w-full max-w-sm rounded-3xl border-[3px] border-white p-6 text-center space-y-4 shadow-2xl"
            style={{ background: 'linear-gradient(180deg, #fff6fc 0%, #ffd4ec 100%)' }}
          >
            <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-b from-[#ff60b8] to-[#d91680] border-2 border-white flex items-center justify-center text-white shadow-xl animate-bounce">
              <PartyPopper className="w-8 h-8" />
            </div>

            <div>
              <div className="text-xs font-black uppercase tracking-wider text-[#d91680]">
                Out of Moves
              </div>
              <h3 className="text-2xl font-black text-[#630b3e] mt-0.5">
                Sugar Crush!
              </h3>
              <p className="text-xs text-[#7a124d] mt-1">
                You scored {sessionScore.toLocaleString()} pts ({targetCollected}/{levelConfig.targetCandyCount} target candies).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-pink-200 text-center space-y-1 shadow-sm">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#7a124d]">
                Total Earned This Round
              </div>
              <div className="text-3xl font-black text-emerald-600 tabular-nums">
                +{formatNaira(totalEarnedNaira)}
              </div>
              <div className="text-[10px] font-semibold text-emerald-700">
                Credited directly to your wallet balance
              </div>
            </div>

            <button
              type="button"
              onClick={retryCurrentLevel}
              className="w-full py-3.5 rounded-2xl text-white font-black text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
              style={{ background: 'linear-gradient(180deg, #ff4fb1 0%, #d91680 100%)' }}
            >
              <span>Play Again (Level {currentLevel})</span>
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // 1. LAUNCHER SCREEN: Shown before tapping Play Game
  if (!isPlaying) {
    return (
      <div className="w-full max-w-xl mx-auto space-y-4 animate-in fade-in duration-300">
        <div
          className={`relative overflow-hidden rounded-3xl p-5 sm:p-6 shadow-2xl border-2 ${
            isLight
              ? 'bg-gradient-to-br from-pink-50 via-white to-amber-50/40 border-pink-300 text-slate-800 shadow-pink-500/10'
              : 'bg-gradient-to-br from-[#281224] via-[#17121e] to-[#0f1018] border-pink-500/40 text-white shadow-pink-950/30'
          }`}
        >
          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1.5 border ${
                  isLight
                    ? 'bg-pink-100 text-pink-800 border-pink-300'
                    : 'bg-pink-500/20 text-pink-300 border-pink-400/30'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 fill-pink-500 text-pink-500" />
                <span>Candy Crush Saga · 8×8 Classic</span>
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

            <div>
              <h2 className={`text-2xl sm:text-3xl font-black tracking-tight leading-tight ${isLight ? 'text-slate-900' : 'text-white'}`}>
                Play Candy Crush &amp; <span className="text-pink-500">Earn Real Naira</span>
              </h2>
              <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${isLight ? 'text-slate-600' : 'text-stone-300'}`}>
                Match 3 or more glossy candies on the classic 8×8 Candy Kingdom board, clear your level target in {levelConfig.totalMoves} moves, and earn instant Naira rewards!
              </p>
            </div>

            {/* Level Summary Strip */}
            <div
              className={`p-3 sm:p-4 rounded-2xl flex items-center justify-between gap-3 flex-wrap border ${
                isLight ? 'bg-white border-pink-200 shadow-sm' : 'bg-black/40 border-stone-800'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#ff5ab8] to-[#e01386] text-white font-black flex items-center justify-center text-sm shadow-md">
                  #{currentLevel}
                </div>
                <div>
                  <div className={`text-xs font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                    {levelConfig.worldName} · {levelConfig.shapeName}
                  </div>
                  <div className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
                    Target: <strong>{levelConfig.targetCandyCount} {levelConfig.targetCandyType} candies</strong> · {levelConfig.totalMoves} Moves
                  </div>
                </div>
              </div>
              <div className="w-8 h-8">
                {renderCandySvg(levelConfig.targetCandyType, undefined, true)}
              </div>
            </div>

            {/* Cash Prizes */}
            <div className="grid grid-cols-3 gap-2 text-center font-mono">
              <div className={`p-2 rounded-2xl border ${isLight ? 'bg-white border-emerald-300 shadow-sm' : 'bg-[#0f1015] border-emerald-500/30'}`}>
                <span className={`text-[10px] font-sans font-bold block ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>Match 3</span>
                <span className="text-xs sm:text-sm font-black text-emerald-600 mt-0.5 block">₦500</span>
              </div>
              <div className={`p-2 rounded-2xl border ${isLight ? 'bg-white border-amber-300 shadow-sm' : 'bg-[#0f1015] border-amber-500/30'}`}>
                <span className={`text-[10px] font-sans font-bold block ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>Match 4</span>
                <span className="text-xs sm:text-sm font-black text-amber-600 mt-0.5 block">₦800</span>
              </div>
              <div className={`p-2 rounded-2xl border ${isLight ? 'bg-pink-50 border-pink-300 shadow-sm' : 'bg-[#1f1220] border-pink-500/40'}`}>
                <span className={`text-[10px] font-sans font-bold block ${isLight ? 'text-pink-900' : 'text-pink-300'}`}>Match 5+</span>
                <span className="text-xs sm:text-sm font-black text-pink-500 mt-0.5 block">₦1,000</span>
              </div>
            </div>

            <div className={`p-2.5 rounded-2xl flex items-center justify-between px-3.5 border ${
              isLight ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-amber-500/15 border-amber-500/40 text-amber-300'
            }`}>
              <div className="flex items-center gap-2">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-bold">Level Victory Prize:</span>
              </div>
              <span className="text-sm font-black font-mono text-amber-500">₦1,500</span>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!isMuted) soundFx.playClick();
                setIsPlaying(true);
              }}
              className="w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-wider shadow-xl hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
              style={{
                background: 'linear-gradient(180deg, #ff54b5 0%, #e01386 100%)',
                boxShadow: '0 8px 20px rgba(224,19,134,0.35)',
              }}
            >
              <Play className="w-5 h-5 fill-white" />
              <span>Play Game</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. ACTIVE CANDY CRUSH GAMEPLAY VIEWPORT
  return renderCandyKingdomViewport(isFullscreen);
};
