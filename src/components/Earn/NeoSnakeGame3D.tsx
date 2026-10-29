import React, { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useAuth } from '../../context/AuthContext.tsx';
import { useTheme } from '../../context/ThemeContext.tsx';
import { soundFx } from '../../utils/sound.ts';
import {
  Sparkles,
  Trophy,
  Coins,
  RotateCcw,
  Volume2,
  VolumeX,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Zap,
  Eye,
  ShieldAlert,
  Flame,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Compass,
} from 'lucide-react';

type CameraViewMode = 'isometric' | 'chase' | 'topdown';

interface GridPosition {
  x: number;
  z: number;
}

const ARENA_SIZE = 16; // Grid from -8 to 8
const CELL_SIZE = 1.6;
const ARENA_BOUNDS = (ARENA_SIZE * CELL_SIZE) / 2;

export const NeoSnakeGame3D: React.FC = () => {
  const { isLight } = useTheme();
  const { user, formatNaira, claimSnakeCoinReward } = useAuth();

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasMountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);

  // React State
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'paused' | 'gameover'>('idle');
  const [score, setScore] = useState<number>(0);
  const [coinsEaten, setCoinsEaten] = useState<number>(0);
  const [sessionEarnings, setSessionEarnings] = useState<number>(0);
  const [highScore, setHighScore] = useState<number>(() => {
    const saved = localStorage.getItem('9jacash_snake3d_highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [cameraView, setCameraView] = useState<CameraViewMode>('isometric');
  const [latestRewardToast, setLatestRewardToast] = useState<string | null>(null);
  const toastTimeoutRef = useRef<number | null>(null);
  const [currentLevel, setCurrentLevel] = useState<number>(1);
  const [isBoosting, setIsBoosting] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // References to keep mutable 3D game loop state without re-creating Three.js scene
  const gameLoopState = useRef<{
    snakeGrid: GridPosition[];
    direction: GridPosition;
    directionQueue: GridPosition[];
    foodGrid: GridPosition;
    isSpecialFood: boolean;
    speedMs: number;
    lastStepTime: number;
    headPosition: THREE.Vector3;
    targetHeadPosition: THREE.Vector3;
    segmentPositions: THREE.Vector3[];
    targetSegmentPositions: THREE.Vector3[];
    isBoosting: boolean;
    isRunning: boolean;
    isPaused: boolean;
  }>({
    snakeGrid: [
      { x: 0, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: 2 },
    ],
    direction: { x: 0, z: -1 },
    directionQueue: [],
    foodGrid: { x: 3, z: -3 },
    isSpecialFood: false,
    speedMs: 160,
    lastStepTime: 0,
    headPosition: new THREE.Vector3(0, 0.45, 0),
    targetHeadPosition: new THREE.Vector3(0, 0.45, 0),
    segmentPositions: [],
    targetSegmentPositions: [],
    isBoosting: false,
    isRunning: false,
    isPaused: false,
  });

  // Three.js instances ref
  const threeRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    snakeHeadGroup: THREE.Group;
    segmentMeshes: THREE.Group[];
    foodGroup: THREE.Group;
    foodLight: THREE.PointLight;
    headEyesLight: THREE.PointLight;
    particleSystem: THREE.Points;
    particleVelocities: Float32Array;
    trailPoints: THREE.Points;
    reqId: number | null;
  } | null>(null);

  // ---------------------------------------------------------------------------
  // Procedural Textures (Zero-404 Asset Compliance)
  // ---------------------------------------------------------------------------
  const createNairaCoinTexture = (isSpecial: boolean): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Golden / Holographic gradient
      const grad = ctx.createRadialGradient(128, 128, 20, 128, 128, 128);
      if (isSpecial) {
        grad.addColorStop(0, '#fff4cc');
        grad.addColorStop(0.3, '#ffaa00');
        grad.addColorStop(0.7, '#ff00aa');
        grad.addColorStop(1, '#6600cc');
      } else {
        grad.addColorStop(0, '#fffbe6');
        grad.addColorStop(0.35, '#facc15');
        grad.addColorStop(0.75, '#d97706');
        grad.addColorStop(1, '#78350f');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(128, 128, 120, 0, Math.PI * 2);
      ctx.fill();

      // Outer gold ring
      ctx.strokeStyle = isSpecial ? '#ffffff' : '#fef08a';
      ctx.lineWidth = 12;
      ctx.stroke();

      // Inner dashed cyber ring
      ctx.strokeStyle = isSpecial ? '#ff66ff' : '#fbbf24';
      ctx.lineWidth = 4;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.arc(128, 128, 96, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // ₦ symbol
      ctx.fillStyle = isSpecial ? '#ffffff' : '#ffffff';
      ctx.shadowColor = isSpecial ? '#ff00aa' : '#b45309';
      ctx.shadowBlur = 14;
      ctx.font = 'bold 118px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('₦', 128, 134);
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  const createCyberGridTexture = (lightMode = false): THREE.CanvasTexture => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Cyber arena floor background - rich dark cyber slate, never white
      ctx.fillStyle = lightMode ? '#1e293b' : '#07090e';
      ctx.fillRect(0, 0, 512, 512);

      // Neon grid lines
      ctx.strokeStyle = lightMode ? 'rgba(52, 211, 153, 0.45)' : 'rgba(16, 185, 129, 0.22)';
      ctx.lineWidth = 2;
      const step = 32;
      for (let x = 0; x <= 512; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 512);
        ctx.stroke();
      }
      for (let y = 0; y <= 512; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      // Secondary cyber accent intersections
      ctx.fillStyle = lightMode ? '#34d399' : '#10b981';
      for (let x = 0; x <= 512; x += step * 2) {
        for (let y = 0; y <= 512; y += step * 2) {
          ctx.beginPath();
          ctx.arc(x, y, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(8, 8);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  };

  // ---------------------------------------------------------------------------
  // Procedural 3-12 Part Cyber Snake Segment Builder
  // ---------------------------------------------------------------------------
  const createSnakeHeadMesh = (lightMode = false): THREE.Group => {
    const group = new THREE.Group();

    // 1. Primary silhouette: Sculpted cyber chassis
    const skullGeo = new THREE.BoxGeometry(1.0, 0.58, 1.15);
    const skullMat = new THREE.MeshPhysicalMaterial({
      color: lightMode ? 0x047857 : 0x0f172a,
      metalness: lightMode ? 0.65 : 0.85,
      roughness: lightMode ? 0.18 : 0.2,
      clearcoat: 0.7,
      clearcoatRoughness: 0.15,
    });
    const skull = new THREE.Mesh(skullGeo, skullMat);
    skull.castShadow = true;
    skull.receiveShadow = true;
    group.add(skull);

    // 2. Head nose wedge / aerokit
    const noseGeo = new THREE.ConeGeometry(0.5, 0.45, 4);
    noseGeo.rotateX(Math.PI / 2);
    noseGeo.rotateY(Math.PI / 4);
    const noseMat = new THREE.MeshStandardMaterial({
      color: lightMode ? 0x065f46 : 0x1e293b,
      metalness: lightMode ? 0.8 : 0.9,
      roughness: 0.25,
    });
    const nose = new THREE.Mesh(noseGeo, noseMat);
    nose.position.set(0, -0.05, -0.68);
    nose.castShadow = true;
    group.add(nose);

    // 3. Cyber Visor (Neon Eyes Glow)
    const visorGeo = new THREE.BoxGeometry(0.88, 0.16, 0.22);
    const visorMat = new THREE.MeshStandardMaterial({
      color: 0x00ffcc,
      emissive: 0x00ffcc,
      emissiveIntensity: 2.2,
      roughness: 0.1,
    });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 0.1, -0.5);
    group.add(visor);

    // 4. Gold Spine Ridge
    const spineGeo = new THREE.BoxGeometry(0.24, 0.14, 0.9);
    const spineMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.95,
      roughness: 0.15,
      emissive: 0xd97706,
      emissiveIntensity: 0.4,
    });
    const spine = new THREE.Mesh(spineGeo, spineMat);
    spine.position.set(0, 0.32, 0.05);
    spine.castShadow = true;
    group.add(spine);

    // 5. Twin Antenna Nodes
    const antGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.35, 6);
    const antMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.9, roughness: 0.2 });
    const antL = new THREE.Mesh(antGeo, antMat);
    antL.position.set(-0.35, 0.38, 0.3);
    antL.rotation.z = -0.25;
    antL.rotation.x = 0.2;
    group.add(antL);

    const antR = antL.clone();
    antR.position.set(0.35, 0.38, 0.3);
    antR.rotation.z = 0.25;
    group.add(antR);

    // 6. Contact Shadow Disc beneath head
    const shadowGeo = new THREE.CircleGeometry(0.65, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.position.y = -0.42;
    group.add(contactShadow);

    return group;
  };

  const isLightRef = useRef<boolean>(isLight);
  isLightRef.current = isLight;

  const createSnakeSegmentMesh = (index: number): THREE.Group => {
    const group = new THREE.Group();
    const lightMode = isLightRef.current;

    // Alternate segment pulse styling
    const isGoldNode = index % 3 === 0;

    // Main module body
    const bodyGeo = new THREE.BoxGeometry(0.92, 0.52, 0.92);
    const bodyMat = new THREE.MeshPhysicalMaterial({
      color: isGoldNode
        ? lightMode
          ? 0xb45309
          : 0x1e1b14
        : lightMode
        ? 0x065f46
        : 0x0b1120,
      metalness: lightMode ? 0.6 : 0.8,
      roughness: lightMode ? 0.2 : 0.25,
      clearcoat: lightMode ? 0.7 : 0.5,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Neon Luminescent Ring Band
    const ringGeo = new THREE.BoxGeometry(0.96, 0.14, 0.96);
    const ringMat = new THREE.MeshStandardMaterial({
      color: isGoldNode ? 0xf59e0b : lightMode ? 0x10b981 : 0x10b981,
      emissive: isGoldNode ? 0xf59e0b : lightMode ? 0x34d399 : 0x10b981,
      emissiveIntensity: lightMode ? 2.2 : 1.8,
      roughness: 0.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    group.add(ring);

    // Top spine node
    const topNodeGeo = new THREE.SphereGeometry(0.12, 8, 8);
    const topNodeMat = new THREE.MeshStandardMaterial({
      color: isGoldNode ? (lightMode ? 0xfef08a : 0xffffff) : lightMode ? 0x0284c7 : 0x38bdf8,
      emissive: isGoldNode ? 0xf59e0b : lightMode ? 0x38bdf8 : 0x38bdf8,
      emissiveIntensity: lightMode ? 1.6 : 1.2,
    });
    const topNode = new THREE.Mesh(topNodeGeo, topNodeMat);
    topNode.position.y = 0.28;
    group.add(topNode);

    // Soft grounded contact shadow
    const shadowGeo = new THREE.CircleGeometry(0.55, 12);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: lightMode ? 0.2 : 0.35,
      depthWrite: false,
    });
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.y = -0.42;
    group.add(shadow);

    return group;
  };

  // ---------------------------------------------------------------------------
  // Procedural 3D Golden Naira Coin Model
  // ---------------------------------------------------------------------------
  const createNairaCoinMesh = (isSpecial: boolean): THREE.Group => {
    const group = new THREE.Group();

    const coinTex = createNairaCoinTexture(isSpecial);

    // Cylindrical Coin Body
    const coinGeo = new THREE.CylinderGeometry(0.68, 0.68, 0.16, 32);
    coinGeo.rotateX(Math.PI / 2);

    // Material with custom texture on faces, golden rim on side
    const rimMat = new THREE.MeshStandardMaterial({
      color: isSpecial ? 0xff00cc : 0xf59e0b,
      metalness: 0.95,
      roughness: 0.12,
      emissive: isSpecial ? 0xaa0066 : 0xd97706,
      emissiveIntensity: 0.5,
    });

    const faceMat = new THREE.MeshStandardMaterial({
      map: coinTex,
      metalness: 0.85,
      roughness: 0.18,
      emissive: isSpecial ? 0x5500aa : 0x78350f,
      emissiveIntensity: 0.35,
    });

    // 0: side, 1: top, 2: bottom
    const coinMesh = new THREE.Mesh(coinGeo, [rimMat, faceMat, faceMat]);
    coinMesh.castShadow = true;
    group.add(coinMesh);

    // Holographic Orbital Ring
    const ringGeo = new THREE.TorusGeometry(0.98, 0.04, 8, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: isSpecial ? 0x00ffff : 0xfde047,
      emissive: isSpecial ? 0x00ffff : 0xfde047,
      emissiveIntensity: 2.0,
      transparent: true,
      opacity: 0.85,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.rotation.x = Math.PI / 3;
    ring.name = 'orbitalRing';
    group.add(ring);

    // Second cross-orbital ring
    const ring2 = ring.clone();
    ring2.rotation.x = -Math.PI / 3;
    ring2.rotation.y = Math.PI / 4;
    ring2.name = 'orbitalRing2';
    group.add(ring2);

    // Grounded Contact Glow Disc
    const groundGlowGeo = new THREE.CircleGeometry(0.9, 16);
    groundGlowGeo.rotateX(-Math.PI / 2);
    const groundGlowMat = new THREE.MeshBasicMaterial({
      color: isSpecial ? 0xff00aa : 0xf59e0b,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    });
    const groundGlow = new THREE.Mesh(groundGlowGeo, groundGlowMat);
    groundGlow.position.y = -0.55;
    group.add(groundGlow);

    return group;
  };

  // ---------------------------------------------------------------------------
  // Initialize Three.js Scene
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!canvasMountRef.current) return;
    const mount = canvasMountRef.current;
    const width = mount.clientWidth || mount.parentElement?.clientWidth || 360;
    const height = mount.clientHeight || Math.min(540, Math.max(380, window.innerHeight * 0.55));

    // 1. Scene & Background Fog - Deep cyber stadium void (NEVER white)
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x0a0f1d);
    scene.fog = new THREE.FogExp2(0x0a0f1d, 0.022);

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.1, 100);
    camera.position.set(0, 18, 17);
    camera.lookAt(0, 0, 0);

    // 3. Renderer
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = isLight ? 1.05 : 1.15;
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      mount.replaceChildren(renderer.domElement);
    } catch (err) {
      console.error('Failed to initialize WebGL in NeoSnakeGame3D:', err);
      return;
    }

    // 4. Procedural Studio Reflection (RoomEnvironment)
    try {
      const pmremGenerator = new THREE.PMREMGenerator(renderer);
      scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
      pmremGenerator.dispose();
    } catch {
      // Graceful fallback
    }

    // 5. Lighting Setup (Key, Fill, Rim)
    const keyLight = new THREE.DirectionalLight(0xfff5e6, isLight ? 2.6 : 2.2);
    keyLight.position.set(10, 20, 12);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 45;
    const d = 16;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0004;
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(
      isLight ? 0xffffff : 0x38bdf8,
      isLight ? 0x94a3b8 : 0x0f172a,
      isLight ? 1.5 : 1.2
    );
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0x00ffcc, 1.4);
    rimLight.position.set(-12, 10, -10);
    scene.add(rimLight);

    // 6. Arena Floor with Procedural Cyber Grid
    const floorGeo = new THREE.PlaneGeometry(ARENA_SIZE * CELL_SIZE, ARENA_SIZE * CELL_SIZE);
    floorGeo.rotateX(-Math.PI / 2);
    const floorTex = createCyberGridTexture(isLight);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.35,
      metalness: 0.4,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.receiveShadow = true;
    scene.add(floor);

    // Outer Perimeter Cyber Boundary Walls (Prominent dark titanium walls with glowing neon emerald rails)
    const bHalf = ARENA_BOUNDS;
    const wallHeight = 1.15;
    const wallThick = 0.36;
    const wallLength = ARENA_SIZE * CELL_SIZE + wallThick;

    // Solid dark cyber titanium armor material - NEVER white
    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      metalness: 0.88,
      roughness: 0.22,
    });

    // Glowing Top Laser Crest Rail
    const laserCrestMat = new THREE.MeshStandardMaterial({
      color: 0x10b981,
      emissive: 0x10b981,
      emissiveIntensity: 2.5,
      metalness: 0.4,
      roughness: 0.1,
    });

    // Inner Glowing Forcefield Warning Strip
    const innerStripeMat = new THREE.MeshStandardMaterial({
      color: 0x059669,
      emissive: 0x10b981,
      emissiveIntensity: 1.8,
    });

    // 1. North Wall (Back)
    const wallNGroup = new THREE.Group();
    const wallNMesh = new THREE.Mesh(new THREE.BoxGeometry(wallLength, wallHeight, wallThick), wallMat);
    wallNMesh.castShadow = true;
    wallNMesh.receiveShadow = true;
    wallNGroup.add(wallNMesh);
    const crestN = new THREE.Mesh(new THREE.BoxGeometry(wallLength, 0.12, wallThick * 1.15), laserCrestMat);
    crestN.position.y = wallHeight / 2 + 0.06;
    wallNGroup.add(crestN);
    const stripeN = new THREE.Mesh(new THREE.BoxGeometry(wallLength, 0.14, 0.04), innerStripeMat);
    stripeN.position.set(0, 0, wallThick / 2 + 0.02);
    wallNGroup.add(stripeN);
    wallNGroup.position.set(0, wallHeight / 2, -bHalf);
    scene.add(wallNGroup);

    // 2. South Wall (Front)
    const wallSGroup = new THREE.Group();
    const wallSMesh = new THREE.Mesh(new THREE.BoxGeometry(wallLength, wallHeight, wallThick), wallMat);
    wallSMesh.castShadow = true;
    wallSMesh.receiveShadow = true;
    wallSGroup.add(wallSMesh);
    const crestS = new THREE.Mesh(new THREE.BoxGeometry(wallLength, 0.12, wallThick * 1.15), laserCrestMat);
    crestS.position.y = wallHeight / 2 + 0.06;
    wallSGroup.add(crestS);
    const stripeS = new THREE.Mesh(new THREE.BoxGeometry(wallLength, 0.14, 0.04), innerStripeMat);
    stripeS.position.set(0, 0, -wallThick / 2 - 0.02);
    wallSGroup.add(stripeS);
    wallSGroup.position.set(0, wallHeight / 2, bHalf);
    scene.add(wallSGroup);

    // 3. West Wall (Left)
    const wallWGroup = new THREE.Group();
    const wallWMesh = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, wallLength), wallMat);
    wallWMesh.castShadow = true;
    wallWMesh.receiveShadow = true;
    wallWGroup.add(wallWMesh);
    const crestW = new THREE.Mesh(new THREE.BoxGeometry(wallThick * 1.15, 0.12, wallLength), laserCrestMat);
    crestW.position.y = wallHeight / 2 + 0.06;
    wallWGroup.add(crestW);
    const stripeW = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, wallLength), innerStripeMat);
    stripeW.position.set(wallThick / 2 + 0.02, 0, 0);
    wallWGroup.add(stripeW);
    wallWGroup.position.set(-bHalf, wallHeight / 2, 0);
    scene.add(wallWGroup);

    // 4. East Wall (Right)
    const wallEGroup = new THREE.Group();
    const wallEMesh = new THREE.Mesh(new THREE.BoxGeometry(wallThick, wallHeight, wallLength), wallMat);
    wallEMesh.castShadow = true;
    wallEMesh.receiveShadow = true;
    wallEGroup.add(wallEMesh);
    const crestE = new THREE.Mesh(new THREE.BoxGeometry(wallThick * 1.15, 0.12, wallLength), laserCrestMat);
    crestE.position.y = wallHeight / 2 + 0.06;
    wallEGroup.add(crestE);
    const stripeE = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.14, wallLength), innerStripeMat);
    stripeE.position.set(-wallThick / 2 - 0.02, 0, 0);
    wallEGroup.add(stripeE);
    wallEGroup.position.set(bHalf, wallHeight / 2, 0);
    scene.add(wallEGroup);

    // Corner Defense Pylons with Glowing Emerald Beacons
    const cornerPylonGeo = new THREE.BoxGeometry(0.55, wallHeight * 1.35, 0.55);
    const cornerBeaconGeo = new THREE.CylinderGeometry(0.2, 0.25, 0.32, 16);
    const corners = [
      [bHalf, bHalf],
      [-bHalf, bHalf],
      [bHalf, -bHalf],
      [-bHalf, -bHalf],
    ];
    corners.forEach(([cx, cz]) => {
      const pylonGroup = new THREE.Group();
      const pylon = new THREE.Mesh(cornerPylonGeo, wallMat);
      pylon.castShadow = true;
      pylonGroup.add(pylon);
      const beacon = new THREE.Mesh(cornerBeaconGeo, laserCrestMat);
      beacon.position.y = (wallHeight * 1.35) / 2 + 0.16;
      pylonGroup.add(beacon);
      pylonGroup.position.set(cx, (wallHeight * 1.35) / 2, cz);
      scene.add(pylonGroup);
    });

    // 7. Snake Head & Group
    const snakeHeadGroup = createSnakeHeadMesh(isLight);
    snakeHeadGroup.position.set(0, 0.5, 0);
    scene.add(snakeHeadGroup);

    const headEyesLight = new THREE.PointLight(isLight ? 0x10b981 : 0x00ffcc, isLight ? 1.8 : 1.5, 5);
    headEyesLight.position.set(0, 0.6, -0.6);
    snakeHeadGroup.add(headEyesLight);

    // 8. 3D Golden Naira Coin
    const foodGroup = createNairaCoinMesh(false);
    foodGroup.position.set(3 * CELL_SIZE, 0.7, -3 * CELL_SIZE);
    scene.add(foodGroup);

    const foodLight = new THREE.PointLight(0xf59e0b, 2.0, 6);
    foodLight.position.set(0, 0.5, 0);
    foodGroup.add(foodLight);

    // 9. Floating Cyber Dust Particle System
    const particleCount = 120;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleVelocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * (ARENA_SIZE * CELL_SIZE);
      particlePositions[i * 3 + 1] = Math.random() * 6 + 0.2;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * (ARENA_SIZE * CELL_SIZE);

      particleVelocities[i * 3] = (Math.random() - 0.5) * 0.02;
      particleVelocities[i * 3 + 1] = Math.random() * 0.015 + 0.005;
      particleVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x34d399,
      size: 0.18,
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
    });
    const particleSystem = new THREE.Points(particleGeo, particleMat);
    scene.add(particleSystem);

    // Snake Turbo Jet Trail Particles
    const trailGeo = new THREE.BufferGeometry();
    const trailPos = new Float32Array(30 * 3);
    trailGeo.setAttribute('position', new THREE.BufferAttribute(trailPos, 3));
    const trailMat = new THREE.PointsMaterial({
      color: 0xf59e0b,
      size: 0.25,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
    });
    const trailPoints = new THREE.Points(trailGeo, trailMat);
    scene.add(trailPoints);

    // Segment meshes array
    const segmentMeshes: THREE.Group[] = [];

    threeRef.current = {
      scene,
      camera,
      renderer,
      snakeHeadGroup,
      segmentMeshes,
      foodGroup,
      foodLight,
      headEyesLight,
      particleSystem,
      particleVelocities,
      trailPoints,
      reqId: null,
    };

    // Resize handler
    const handleResize = () => {
      if (!canvasMountRef.current || !threeRef.current) return;
      const w = canvasMountRef.current.clientWidth || canvasMountRef.current.parentElement?.clientWidth || 360;
      const h = canvasMountRef.current.clientHeight || Math.min(540, Math.max(380, window.innerHeight * 0.55));
      if (w <= 0 || h <= 0) return;
      threeRef.current.camera.aspect = w / h;
      threeRef.current.camera.updateProjectionMatrix();
      threeRef.current.renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(() => {
      handleResize();
    });
    resizeObserver.observe(mount);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (threeRef.current) {
        if (threeRef.current.reqId) cancelAnimationFrame(threeRef.current.reqId);
        threeRef.current.renderer.dispose();
      }
      mount.replaceChildren();
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Spawn New Naira Coin (Handles Standard and 2X Special Golden Coins)
  // ---------------------------------------------------------------------------
  const spawnFood = useCallback(() => {
    const state = gameLoopState.current;
    const occupied = new Set(state.snakeGrid.map((p) => `${p.x},${p.z}`));

    const available: GridPosition[] = [];
    const half = Math.floor(ARENA_SIZE / 2) - 1;

    for (let x = -half; x <= half; x++) {
      for (let z = -half; z <= half; z++) {
        if (!occupied.has(`${x},${z}`)) {
          available.push({ x, z });
        }
      }
    }

    if (available.length === 0) return;

    const chosen = available[Math.floor(Math.random() * available.length)];
    state.foodGrid = chosen;

    // Every few coins has a chance of being a 2X Special Golden Mega Coin
    const isSpecial = Math.random() < 0.28 || state.snakeGrid.length % 5 === 0;
    state.isSpecialFood = isSpecial;

    if (threeRef.current) {
      const { foodGroup, foodLight, scene } = threeRef.current;
      scene.remove(foodGroup);

      // Re-create with new material/texture
      const newFood = createNairaCoinMesh(isSpecial);
      newFood.position.set(chosen.x * CELL_SIZE, 0.7, chosen.z * CELL_SIZE);

      const lightColor = isSpecial ? 0xff00aa : 0xf59e0b;
      foodLight.color.setHex(lightColor);
      newFood.add(foodLight);

      threeRef.current.foodGroup = newFood;
      scene.add(newFood);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Eat Coin & Award Real Dashboard Balance
  // ---------------------------------------------------------------------------
  const handleEatCoin = useCallback(() => {
    const state = gameLoopState.current;
    const isSpecial = state.isSpecialFood;
    const prizeAmount = isSpecial ? 1000 : 500;

    // Play coin synthesis sound
    if (!isMuted) {
      soundFx.playSnakeCoin(isSpecial);
    }

    // Award real cash to dashboard balance via AuthContext
    claimSnakeCoinReward(prizeAmount, isSpecial);

    // Update state
    setScore((prev) => {
      const nextScore = prev + (isSpecial ? 250 : 100);
      if (nextScore > highScore) {
        setHighScore(nextScore);
        localStorage.setItem('9jacash_snake3d_highscore', nextScore.toString());
      }
      return nextScore;
    });

    setCoinsEaten((prev) => {
      const nextCount = prev + 1;
      // Level progression every 5 coins
      if (nextCount % 5 === 0) {
        setCurrentLevel((lvl) => {
          const nextLvl = lvl + 1;
          soundFx.playLevelUp();
          return nextLvl;
        });
        state.speedMs = Math.max(80, state.speedMs - 12);
      }
      return nextCount;
    });

    setSessionEarnings((prev) => prev + prizeAmount);

    // Small win notification portaled to the top-right of the phone screen outside the game page
    if (toastTimeoutRef.current) {
      window.clearTimeout(toastTimeoutRef.current);
    }
    setLatestRewardToast(
      isSpecial ? `+₦${prizeAmount.toLocaleString()} Mega Win!` : `+₦${prizeAmount.toLocaleString()} Won`
    );

    toastTimeoutRef.current = window.setTimeout(() => {
      setLatestRewardToast(null);
      toastTimeoutRef.current = null;
    }, 1400);

    // Grow snake: Add new segment mesh to Three scene
    if (threeRef.current) {
      const { scene, segmentMeshes } = threeRef.current;
      const segMesh = createSnakeSegmentMesh(segmentMeshes.length);
      const lastSeg = state.snakeGrid[state.snakeGrid.length - 1];
      segMesh.position.set(lastSeg.x * CELL_SIZE, 0.45, lastSeg.z * CELL_SIZE);
      scene.add(segMesh);
      segmentMeshes.push(segMesh);
    }

    // Spawn next coin
    spawnFood();
  }, [claimSnakeCoinReward, highScore, isMuted, spawnFood]);

  // ---------------------------------------------------------------------------
  // Game Over
  // ---------------------------------------------------------------------------
  const handleGameOver = useCallback(() => {
    const state = gameLoopState.current;
    state.isRunning = false;
    setGameState('gameover');

    if (!isMuted) {
      soundFx.playSnakeCrash();
    }
  }, [isMuted]);

  // ---------------------------------------------------------------------------
  // Start / Restart / Pause Game
  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // Start / Restart / Pause Game
  // ---------------------------------------------------------------------------
  const startGame = useCallback(() => {
    soundFx.playClick();

    const state = gameLoopState.current;

    // Reset grid
    state.snakeGrid = [
      { x: 0, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: 2 },
    ];
    state.direction = { x: 0, z: -1 };
    state.directionQueue = [];
    state.speedMs = 210;
    state.lastStepTime = performance.now();
    state.isRunning = true;
    state.isPaused = false;
    state.isBoosting = false;
    state.headPosition.set(0, 0.45, 0);
    state.targetHeadPosition.set(0, 0.45, 0);

    // Reset visual segments
    if (threeRef.current) {
      const { scene, segmentMeshes, snakeHeadGroup } = threeRef.current;
      segmentMeshes.forEach((m) => scene.remove(m));
      segmentMeshes.length = 0;

      // Add 2 initial tail segments
      for (let i = 1; i <= 2; i++) {
        const seg = createSnakeSegmentMesh(i);
        seg.position.set(0, 0.45, i * CELL_SIZE);
        scene.add(seg);
        segmentMeshes.push(seg);
      }
      snakeHeadGroup.position.set(0, 0.45, 0);
      snakeHeadGroup.rotation.y = 0;
    }

    setScore(0);
    setCoinsEaten(0);
    setCurrentLevel(1);
    setGameState('playing');
    spawnFood();

    // Trigger instant canvas resize for crisp full screen experience
    const triggerCanvasResize = () => {
      if (!canvasMountRef.current || !threeRef.current) return;
      const mount = canvasMountRef.current;
      const rect = mount.getBoundingClientRect();
      const w = rect.width || window.innerWidth;
      const h = rect.height || (window.innerHeight * 0.55);
      if (w > 0 && h > 0) {
        threeRef.current.camera.aspect = w / h;
        threeRef.current.camera.updateProjectionMatrix();
        threeRef.current.renderer.setSize(w, h);
      }
    };
    setTimeout(triggerCanvasResize, 50);
    setTimeout(triggerCanvasResize, 180);
  }, [spawnFood]);

  const toggleFullscreen = useCallback(() => {
    soundFx.playClick();
    setIsFullscreen((prev) => !prev);
  }, []);

  const togglePause = useCallback(() => {
    soundFx.playClick();
    const state = gameLoopState.current;
    if (gameState === 'playing') {
      state.isPaused = true;
      setGameState('paused');
    } else if (gameState === 'paused') {
      state.isPaused = false;
      state.lastStepTime = performance.now();
      setGameState('playing');
    }
  }, [gameState]);

  // Handle auto resize on fullscreen state toggle
  useEffect(() => {
    const handleResizeNow = () => {
      if (!canvasMountRef.current || !threeRef.current) return;
      const mount = canvasMountRef.current;
      const rect = mount.getBoundingClientRect();
      const w = rect.width || mount.clientWidth || window.innerWidth;
      const h = rect.height || mount.clientHeight || (isFullscreen ? window.innerHeight * 0.6 : 420);
      if (w > 0 && h > 0) {
        threeRef.current.camera.aspect = w / h;
        threeRef.current.camera.updateProjectionMatrix();
        threeRef.current.renderer.setSize(w, h);
      }
    };

    handleResizeNow();
    const timer1 = setTimeout(handleResizeNow, 50);
    const timer2 = setTimeout(handleResizeNow, 200);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [isFullscreen]);

  // ---------------------------------------------------------------------------
  // Direction Controller (Keyboard & Mobile D-Pad) with Smooth Input Queue
  // ---------------------------------------------------------------------------
  const changeDirection = useCallback(
    (dx: number, dz: number) => {
      const state = gameLoopState.current;
      if (gameState === 'idle' || gameState === 'gameover') {
        startGame();
        state.directionQueue = [{ x: dx, z: dz }];
        return;
      }
      if (!state.isRunning || state.isPaused) return;

      // Determine reference direction (last queued or current moving direction)
      const lastDir =
        state.directionQueue.length > 0
          ? state.directionQueue[state.directionQueue.length - 1]
          : state.direction;

      // Prevent 180-degree instant reversal into own neck
      if (dx !== 0 && lastDir.x !== 0 && dx === -lastDir.x) return;
      if (dz !== 0 && lastDir.z !== 0 && dz === -lastDir.z) return;

      // Ignore duplicate direction
      if (dx === lastDir.x && dz === lastDir.z) return;

      // Queue up to 2 pending turns so fast taps are never dropped
      if (state.directionQueue.length < 2) {
        state.directionQueue.push({ x: dx, z: dz });
      }

      if (!isMuted) {
        soundFx.playSnakeTurn();
      }
    },
    [gameState, isMuted, startGame]
  );

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState === 'idle' || gameState === 'gameover') {
        if (['Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'W', 's', 'S', 'a', 'A', 'd', 'D'].includes(e.key)) {
          e.preventDefault();
          startGame();
          return;
        }
      }
      if (gameState !== 'playing') return;

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          changeDirection(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          changeDirection(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          changeDirection(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          changeDirection(1, 0);
          break;
        case ' ':
          // Space bar turbo boost
          e.preventDefault();
          gameLoopState.current.isBoosting = true;
          setIsBoosting(true);
          if (!isMuted) soundFx.playSnakeBoost();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          togglePause();
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        gameLoopState.current.isBoosting = false;
        setIsBoosting(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [changeDirection, gameState, isMuted, startGame, togglePause]);

  // Touch Swipe on 3D Canvas
  const touchStartPos = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStartPos.current = { x: t.clientX, y: t.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStartPos.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartPos.current.x;
    const dy = t.clientY - touchStartPos.current.y;
    const absX = Math.abs(dx);
    const absY = Math.abs(dy);

    if (Math.max(absX, absY) > 24) {
      if (absX > absY) {
        // Horizontal swipe
        changeDirection(dx > 0 ? 1 : -1, 0);
      } else {
        // Vertical swipe
        changeDirection(0, dy > 0 ? 1 : -1);
      }
    }
    touchStartPos.current = null;
  };

  // Keep latest handlers in refs so the 60fps 3D animation loop never restarts when eating a coin
  const eatCoinRef = useRef(handleEatCoin);
  const gameOverRef = useRef(handleGameOver);
  const cameraViewRef = useRef(cameraView);

  useEffect(() => {
    eatCoinRef.current = handleEatCoin;
    gameOverRef.current = handleGameOver;
    cameraViewRef.current = cameraView;
  }, [handleEatCoin, handleGameOver, cameraView]);

  // ---------------------------------------------------------------------------
  // Continuous Three.js Animation & Grid Step Loop
  // ---------------------------------------------------------------------------
  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      animId = requestAnimationFrame(tick);
      const state = gameLoopState.current;
      const three = threeRef.current;
      if (!three) return;

      const {
        scene,
        camera,
        renderer,
        snakeHeadGroup,
        segmentMeshes,
        foodGroup,
        particleSystem,
        particleVelocities,
      } = three;

      // Animate floating rotating Naira coin
      if (foodGroup) {
        foodGroup.rotation.y += 0.035;
        // Sine wave hover
        foodGroup.position.y = 0.75 + Math.sin(now * 0.004) * 0.18;

        const ring1 = foodGroup.getObjectByName('orbitalRing');
        if (ring1) ring1.rotation.z += 0.045;
        const ring2 = foodGroup.getObjectByName('orbitalRing2');
        if (ring2) ring2.rotation.z -= 0.035;
      }

      // Animate ambient cyber particles
      if (particleSystem) {
        const posAttr = particleSystem.geometry.attributes.position;
        const positions = posAttr.array as Float32Array;
        for (let i = 0; i < positions.length / 3; i++) {
          positions[i * 3 + 1] -= particleVelocities[i * 3 + 1];
          if (positions[i * 3 + 1] < 0.1) {
            positions[i * 3 + 1] = 6.0;
          }
        }
        posAttr.needsUpdate = true;
      }

      // -----------------------------------------------------------------------
      // Game Logic Step
      // -----------------------------------------------------------------------
      if (state.isRunning && !state.isPaused) {
        const effectiveSpeed = state.isBoosting ? state.speedMs * 0.55 : state.speedMs;

        if (now - state.lastStepTime >= effectiveSpeed) {
          state.lastStepTime = now;
          if (state.directionQueue.length > 0) {
            state.direction = state.directionQueue.shift()!;
          }

          const head = state.snakeGrid[0];
          const newHead = {
            x: head.x + state.direction.x,
            z: head.z + state.direction.z,
          };

          // Wall collision check
          const half = Math.floor(ARENA_SIZE / 2);
          if (
            newHead.x < -half ||
            newHead.x >= half ||
            newHead.z < -half ||
            newHead.z >= half
          ) {
            gameOverRef.current();
            return;
          }

          // Self collision check (snake needs at least 5 segments to bite itself)
          if (state.snakeGrid.length > 4) {
            for (let i = 1; i < state.snakeGrid.length - 1; i++) {
              if (
                state.snakeGrid[i].x === newHead.x &&
                state.snakeGrid[i].z === newHead.z
              ) {
                gameOverRef.current();
                return;
              }
            }
          }

          // Move snake
          const newGrid = [newHead, ...state.snakeGrid];

          // Check coin eaten
          if (newHead.x === state.foodGrid.x && newHead.z === state.foodGrid.z) {
            eatCoinRef.current();
          } else {
            newGrid.pop();
          }
          state.snakeGrid = newGrid;
        }

        // ---------------------------------------------------------------------
        // Smooth Kinematics & Slithering Interpolation (Three.js Guidelines)
        // ---------------------------------------------------------------------
        const targetHeadX = state.snakeGrid[0].x * CELL_SIZE;
        const targetHeadZ = state.snakeGrid[0].z * CELL_SIZE;

        snakeHeadGroup.position.x = THREE.MathUtils.damp(
          snakeHeadGroup.position.x,
          targetHeadX,
          18,
          0.016
        );
        snakeHeadGroup.position.z = THREE.MathUtils.damp(
          snakeHeadGroup.position.z,
          targetHeadZ,
          18,
          0.016
        );

        // Smooth rotation facing direction
        let targetAngle = 0;
        if (state.direction.z === -1) targetAngle = 0; // North
        else if (state.direction.z === 1) targetAngle = Math.PI; // South
        else if (state.direction.x === -1) targetAngle = Math.PI / 2; // West
        else if (state.direction.x === 1) targetAngle = -Math.PI / 2; // East

        snakeHeadGroup.rotation.y = THREE.MathUtils.damp(
          snakeHeadGroup.rotation.y,
          targetAngle,
          14,
          0.016
        );

        // Smooth segment tracking
        for (let i = 0; i < segmentMeshes.length; i++) {
          const segMesh = segmentMeshes[i];
          const gridPos = state.snakeGrid[i + 1] || state.snakeGrid[state.snakeGrid.length - 1];
          if (gridPos) {
            const targetX = gridPos.x * CELL_SIZE;
            const targetZ = gridPos.z * CELL_SIZE;
            segMesh.position.x = THREE.MathUtils.damp(segMesh.position.x, targetX, 16, 0.016);
            segMesh.position.z = THREE.MathUtils.damp(segMesh.position.z, targetZ, 16, 0.016);
          }
        }
      }

      // -----------------------------------------------------------------------
      // Dynamic Camera View Modes
      // -----------------------------------------------------------------------
      const activeCamMode = cameraViewRef.current;
      const headPos = snakeHeadGroup.position;
      if (activeCamMode === 'isometric') {
        const targetCamX = headPos.x * 0.35;
        const targetCamZ = headPos.z * 0.35 + 17;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, targetCamX, 4, 0.016);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 18, 4, 0.016);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, targetCamZ, 4, 0.016);
        camera.lookAt(headPos.x * 0.3, 0, headPos.z * 0.3);
      } else if (activeCamMode === 'chase') {
        // Third person chase cam right behind the snake head
        const dir = state.direction;
        const chaseCamX = headPos.x - dir.x * 8;
        const chaseCamZ = headPos.z - dir.z * 8;
        camera.position.x = THREE.MathUtils.damp(camera.position.x, chaseCamX, 8, 0.016);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 6.5, 8, 0.016);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, chaseCamZ, 8, 0.016);
        camera.lookAt(headPos.x + dir.x * 4, 0.5, headPos.z + dir.z * 4);
      } else if (activeCamMode === 'topdown') {
        // Overhead tactical arcade view
        camera.position.x = THREE.MathUtils.damp(camera.position.x, 0, 6, 0.016);
        camera.position.y = THREE.MathUtils.damp(camera.position.y, 26, 6, 0.016);
        camera.position.z = THREE.MathUtils.damp(camera.position.z, 0.1, 6, 0.016);
        camera.lookAt(0, 0, 0);
      }

      renderer.render(scene, camera);
    };

    animId = requestAnimationFrame(tick);
    if (threeRef.current) threeRef.current.reqId = animId;

    return () => {
      cancelAnimationFrame(animId);
    };
  }, []);

  // Dynamically update Three.js background and fog when user switches theme
  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.background = new THREE.Color(isLight ? 0xedf2f7 : 0x06080d);
      if (sceneRef.current.fog) {
        sceneRef.current.fog.color = new THREE.Color(isLight ? 0xedf2f7 : 0x06080d);
      }
    }
  }, [isLight]);

  return (
    <>
      {/* Portaled to document.body: Pops strictly at the top-right corner of the phone screen outside the game page */}
      {latestRewardToast &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed top-2.5 right-2.5 z-[99999] pointer-events-none select-none">
            <div className={`px-2.5 py-1 rounded-full backdrop-blur-md border shadow-lg flex items-center gap-1.5 ${
              isLight
                ? 'bg-white/95 border-emerald-400 text-emerald-800 shadow-emerald-500/20'
                : 'bg-[#07130e]/95 border-emerald-400/80 text-emerald-300 shadow-emerald-500/25'
            }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              <span className={`text-[11px] font-black font-mono tracking-tight whitespace-nowrap ${
                isLight ? 'text-emerald-800' : 'text-emerald-300'
              }`}>
                {latestRewardToast}
              </span>
            </div>
          </div>,
          document.body
        )}

      <div
        ref={containerRef}
        className={
          isFullscreen
            ? 'fixed inset-0 z-[100] w-screen h-screen bg-[#070b14] text-white flex flex-col justify-between overflow-hidden select-none'
            : isLight
            ? 'relative w-full rounded-3xl bg-white border-2 border-emerald-400 overflow-hidden shadow-xl select-none text-slate-800'
            : 'relative w-full rounded-3xl bg-[#0b0d13] border border-emerald-500/30 overflow-hidden shadow-2xl select-none text-white'
        }
      >

      {/* Top Cyber Arcade HUD */}
      <div
        className={`relative z-20 flex items-center justify-between p-3 sm:p-4 border-b ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-800 shadow-sm'
            : 'bg-gradient-to-b from-[#0f141f] via-[#0c101a] to-transparent border-stone-800/80 text-white'
        }`}
      >
        <div className="flex items-center gap-2">
          {isFullscreen ? (
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className={`py-1.5 px-3 rounded-xl border text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-lg active:scale-95 transition-all ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
                  : 'bg-stone-800/90 hover:bg-stone-700 text-stone-200 border-stone-700'
              }`}
              title="Exit Fullscreen Mode"
            >
              <Minimize2 className="w-4 h-4 text-amber-500 stroke-[2.5]" />
              <span className="hidden sm:inline">Exit Fullscreen</span>
              <span className="sm:hidden">Exit</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-lg shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
              title="Play Fullscreen"
            >
              <div className={`w-full h-full rounded-[10px] flex items-center justify-center font-black text-xs ${
                isLight ? 'bg-white text-emerald-600' : 'bg-[#0c1018] text-emerald-400'
              }`}>
                3D
              </div>
            </button>
          )}

          <div>
            <div className="flex items-center gap-1.5">
              <h2 className={`text-sm font-black tracking-tight flex items-center gap-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                <span>Neo Snake 3D</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 border border-emerald-500/40 font-bold uppercase tracking-wider">
                  Earn Real ₦
                </span>
                {isFullscreen && (
                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-600 border border-amber-500/40 font-bold uppercase tracking-wider hidden xs:inline">
                    Full Screen
                  </span>
                )}
              </h2>
            </div>
            <p className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              Each coin eaten deposits <strong>₦500 – ₦1,000</strong> straight to your balance
            </p>
          </div>
        </div>

        {/* Live Session Earnings, Account Balance & Level Badge */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="text-right">
            <span className={`text-[9px] uppercase tracking-widest font-bold block ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              Balance
            </span>
            <div className={`text-xs font-black font-mono ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {formatNaira(user?.balance || 0)}
            </div>
          </div>

          <div className="text-right">
            <span className={`text-[9px] uppercase tracking-widest font-bold block ${isLight ? 'text-amber-700' : 'text-amber-400/90'}`}>
              Session Won
            </span>
            <div className="text-xs font-black text-emerald-600 font-mono">
              +₦{sessionEarnings.toLocaleString()}
            </div>
          </div>

          <div className={`px-2 py-1 rounded-xl text-[10px] font-extrabold font-mono flex items-center gap-1 border ${
            isLight
              ? 'bg-amber-100 text-amber-800 border-amber-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}>
            <Flame className="w-3 h-3 text-amber-500" />
            <span>LVL {currentLevel}</span>
          </div>

          {!isFullscreen && (
            <button
              type="button"
              onClick={toggleFullscreen}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-[#141822] hover:bg-[#1c2230] border-stone-800 text-stone-300 hover:text-white'
              }`}
              title="Fullscreen Mode"
            >
              <Maximize2 className="w-4 h-4 text-emerald-500" />
            </button>
          )}
        </div>
      </div>

      {/* Main 3D Canvas & Overlays Viewport - Completely clean gameplay screen without popups */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={
          isFullscreen
            ? 'flex-1 w-full relative cursor-grab active:cursor-grabbing touch-none overflow-hidden min-h-0 bg-[#070b14]'
            : 'w-full relative cursor-grab active:cursor-grabbing touch-none overflow-hidden bg-[#070b14]'
        }
        style={isFullscreen ? undefined : { minHeight: '380px', maxHeight: '540px' }}
      >
        {/* Isolated WebGL Canvas Container - purely dedicated for Three.js (No obstructing popups) */}
        <div ref={canvasMountRef} className="absolute inset-0 w-full h-full pointer-events-auto" />

        {/* Start / Idle Screen Overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-md text-center space-y-4 animate-in fade-in bg-slate-950/80 text-white">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-2xl shadow-emerald-500/40">
              <div className="w-full h-full rounded-3xl flex items-center justify-center text-emerald-400 bg-[#090d16]">
                <Sparkles className="w-8 h-8 text-emerald-400" />
              </div>
            </div>

            <div className="space-y-1">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Neo Snake 3D Cyber Arcade
              </h3>
              <p className="text-xs max-w-sm mx-auto leading-relaxed text-slate-300">
                Slither in 3D full-screen, eat real Naira coins, and earn instant cash deposited directly to your balance!
              </p>
            </div>

            {/* Payout Specs */}
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-xs text-left">
              <div className="p-3 rounded-2xl shadow-md border bg-slate-900/90 border-slate-700/80">
                <span className="text-[9px] uppercase tracking-wider block font-bold text-slate-400">Standard Coin</span>
                <span className="text-sm font-black text-emerald-400 font-mono">+₦500 / Coin</span>
              </div>
              <div className="p-3 rounded-2xl shadow-md border bg-[#1a1426]/90 border-purple-500/40">
                <span className="text-[9px] uppercase tracking-wider block font-bold text-purple-300">Mega Gold 2X</span>
                <span className="text-sm font-black text-amber-400 font-mono">+₦1,000 / Coin</span>
              </div>
            </div>

            {/* Big Colorful Play Full Screen Button */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                startGame();
              }}
              className="w-full max-w-sm py-4 sm:py-5 px-6 sm:px-8 rounded-3xl bg-gradient-to-r from-emerald-400 via-amber-300 to-teal-300 hover:from-emerald-300 hover:via-yellow-300 hover:to-teal-200 text-black font-black text-base sm:text-lg shadow-2xl shadow-emerald-500/60 ring-4 ring-emerald-400/40 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all cursor-pointer relative z-30 border-2 border-white"
            >
              <div className="w-10 h-10 rounded-full bg-black/90 flex items-center justify-center text-amber-300 flex-shrink-0 shadow-md">
                <Play className="w-5 h-5 fill-amber-300 ml-0.5" />
              </div>
              <div className="text-left flex-1 min-w-0">
                <span className="block leading-tight tracking-tight uppercase font-black text-sm sm:text-base">
                  START GAME NOW
                </span>
                <span className="text-[10px] text-black/80 font-bold block truncate">
                  Earn Real ₦ on Every Coin • Tap to Start
                </span>
              </div>
              <Play className="w-5 h-5 stroke-[2.5] flex-shrink-0" />
            </button>
          </div>
        )}

        {/* Game Over Screen Overlay */}
        {gameState === 'gameover' && (
          <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-md text-center space-y-4 animate-in zoom-in-95 bg-slate-950/85 text-white">
            <div className="w-14 h-14 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500">
              <ShieldAlert className="w-7 h-7 text-red-500" />
            </div>

            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-widest text-red-400">
                Cyber Collision Detected
              </span>
              <h3 className="text-xl font-black text-white">Game Over</h3>
              <p className="text-xs text-slate-300">
                You collected <strong className="text-white">{coinsEaten} coins</strong> and scored{' '}
                <strong className="text-amber-400">{score} pts</strong>
              </p>
            </div>

            {/* Total session cash won banner */}
            <div className={`p-3.5 rounded-2xl border w-full max-w-xs space-y-1 ${
              isLight
                ? 'bg-emerald-50 border-emerald-300'
                : 'bg-gradient-to-r from-emerald-500/20 via-[#131b22] to-emerald-500/20 border-emerald-500/40'
            }`}>
              <span className={`text-[10px] uppercase font-bold tracking-wider ${isLight ? 'text-emerald-800' : 'text-emerald-400/90'}`}>
                Total Cash Deposited to Balance
              </span>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                +₦{sessionEarnings.toLocaleString()}
              </div>
            </div>

            <div className="flex gap-2.5 w-full max-w-sm">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="flex-1 py-3.5 sm:py-4 px-6 rounded-3xl bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400 hover:from-emerald-300 hover:to-teal-200 text-black font-black text-sm sm:text-base shadow-xl shadow-emerald-500/40 flex items-center justify-center gap-2 cursor-pointer relative z-30 border-2 border-white/90 active:scale-95 transition-all ring-2 ring-emerald-400/30"
              >
                <RotateCcw className="w-5 h-5 stroke-[2.5]" />
                <span>Play Again</span>
              </button>
              {isFullscreen && (
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className={`py-3.5 sm:py-4 px-5 rounded-3xl font-bold text-xs cursor-pointer relative z-30 border ${
                    isLight
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-800 border-slate-300'
                      : 'bg-stone-800 hover:bg-stone-700 text-stone-200 border-stone-700'
                  }`}
                >
                  Exit
                </button>
              )}
            </div>
          </div>
        )}

        {/* Paused Screen Overlay */}
        {gameState === 'paused' && (
          <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-6 backdrop-blur-sm text-center space-y-3 ${
            isLight ? 'bg-white/90 text-slate-800' : 'bg-black/80 text-white'
          }`}>
            <h3 className={`text-lg font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>Game Paused</h3>
            <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-stone-400'}`}>Take a breath, your cyber cash is safe!</p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                togglePause();
              }}
              className="py-3 px-8 rounded-2xl bg-emerald-400 text-black font-extrabold text-sm flex items-center gap-2 cursor-pointer relative z-30 shadow-xl shadow-emerald-500/30 active:scale-95 transition-transform"
            >
              <Play className="w-5 h-5 fill-black" />
              <span>Resume Game</span>
            </button>
          </div>
        )}
      </div>

      {/* Cyber In-Game Stats Ticker */}
      <div
        className={`grid grid-cols-4 gap-1 p-2 border-t border-b text-center text-xs relative z-20 ${
          isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#0c0e14] border-stone-800/80'
        }`}
      >
        <div className={`p-1 rounded-xl ${isLight ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60' : 'bg-[#121620]'}`}>
          <span className={`text-[9px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Coins Eaten</span>
          <span className="font-mono font-black text-emerald-600">{coinsEaten}</span>
        </div>
        <div className={`p-1 rounded-xl ${isLight ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60' : 'bg-[#121620]'}`}>
          <span className={`text-[9px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Score</span>
          <span className={`font-mono font-black ${isLight ? 'text-slate-900' : 'text-white'}`}>{score}</span>
        </div>
        <div className={`p-1 rounded-xl ${isLight ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60' : 'bg-[#121620]'}`}>
          <span className={`text-[9px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>High Score</span>
          <span className="font-mono font-black text-amber-500">{highScore}</span>
        </div>
        <div className={`p-1 rounded-xl ${isLight ? 'bg-white text-slate-800 shadow-xs border border-slate-200/60' : 'bg-[#121620]'}`}>
          <span className={`text-[9px] uppercase font-bold block ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>Speed</span>
          <span className={`font-mono font-black ${isLight ? 'text-sky-600' : 'text-sky-400'}`}>{isBoosting ? 'TURBO 2X' : 'NORMAL'}</span>
        </div>
      </div>

      {/* Unified Big Arcade Controller Deck */}
      <div
        className={`p-3 sm:p-4 space-y-3 relative z-20 border-t ${
          isLight ? 'bg-slate-50 border-slate-200 text-slate-800' : 'bg-[#0a0d13] border-stone-900 text-white'
        }`}
      >
        {/* Camera Views & Audio Dock Row */}
        <div className="flex items-center justify-between gap-2 max-w-lg mx-auto">
          {/* Camera View Switcher */}
          <div
            className={`flex items-center gap-1 p-1 rounded-xl border text-[11px] font-bold ${
              isLight ? 'bg-white border-slate-200 text-slate-700 shadow-xs' : 'bg-[#141822] border-stone-800'
            }`}
          >
            <span className={`pl-1 text-[10px] flex items-center gap-1 ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>
              <Eye className="w-3 h-3 text-stone-400" />
              <span>Cam:</span>
            </span>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setCameraView('isometric');
              }}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                cameraView === 'isometric'
                  ? 'bg-emerald-500/20 text-emerald-600 font-extrabold border border-emerald-500/40'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              3D
            </button>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setCameraView('chase');
              }}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                cameraView === 'chase'
                  ? 'bg-emerald-500/20 text-emerald-600 font-extrabold border border-emerald-500/40'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Chase
            </button>
            <button
              type="button"
              onClick={() => {
                soundFx.playClick();
                setCameraView('topdown');
              }}
              className={`px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                cameraView === 'topdown'
                  ? 'bg-emerald-500/20 text-emerald-600 font-extrabold border border-emerald-500/40'
                  : isLight
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-stone-400 hover:text-white'
              }`}
            >
              Top
            </button>
          </div>

          {/* Sound & Pause Controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setIsMuted((prev) => !prev)}
              className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
                  : 'bg-[#141822] border-stone-800 text-stone-300 hover:text-white'
              }`}
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-emerald-500" />}
            </button>

            {gameState === 'playing' && (
              <button
                type="button"
                onClick={togglePause}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 shadow-xs'
                    : 'bg-[#141822] border-stone-800 text-stone-300 hover:text-white'
                }`}
                title="Pause Game"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}

            {gameState === 'paused' && (
              <button
                type="button"
                onClick={togglePause}
                className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-600 font-bold transition-colors cursor-pointer"
                title="Resume Game"
              >
                <Play className="w-4 h-4 fill-emerald-600" />
              </button>
            )}
          </div>
        </div>

        {/* Big Colorful Arcade Controller Deck (Instant Smooth Touch & Click) */}
        <div className="flex items-center justify-center sm:justify-around gap-3 sm:gap-6 max-w-lg mx-auto pt-1 pb-1">
          {/* Big Colorful Directional D-Pad */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 select-none touch-none">
            {/* Top Row: UP */}
            <div />
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                changeDirection(0, -1);
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
              }}
              style={{ touchAction: 'none' }}
              className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-b from-emerald-300 via-emerald-500 to-emerald-800 text-black border-2 border-emerald-100 shadow-xl shadow-emerald-500/50 flex flex-col items-center justify-center transition-all hover:brightness-110 active:scale-90 active:brightness-125 cursor-pointer mx-auto ring-2 ring-emerald-400/30"
              aria-label="Up"
            >
              <ArrowUp className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3.5] text-black" />
              <span className="text-[9px] font-black uppercase tracking-wider -mt-1 text-black/90">UP</span>
            </button>
            <div />

            {/* Middle Row: LEFT, STATUS HUB, RIGHT */}
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                changeDirection(-1, 0);
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
              }}
              style={{ touchAction: 'none' }}
              className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-r from-cyan-300 via-sky-500 to-blue-700 text-black border-2 border-cyan-100 shadow-xl shadow-cyan-500/50 flex flex-col items-center justify-center transition-all hover:brightness-110 active:scale-90 active:brightness-125 cursor-pointer mx-auto ring-2 ring-cyan-400/30"
              aria-label="Left"
            >
              <ArrowLeft className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3.5] text-black" />
              <span className="text-[9px] font-black uppercase tracking-wider -mt-1 text-black/90">LEFT</span>
            </button>

            {/* Center Status Hub */}
            <div
              className={`w-18 h-18 sm:w-22 sm:h-22 rounded-3xl border flex flex-col items-center justify-center shadow-inner p-1 ${
                isLight ? 'bg-white border-slate-200 text-slate-800 shadow-xs' : 'bg-[#090d15] border-stone-800 text-emerald-400'
              }`}
            >
              <Compass className={`w-5 h-5 stroke-[2.2] ${isLight ? 'text-emerald-600' : 'text-emerald-400'}`} />
              <span className="text-[8px] font-mono font-black text-amber-500 mt-0.5">3D NEO</span>
              <span className={`text-[8px] font-mono ${isLight ? 'text-slate-500' : 'text-stone-400'}`}>PTS:{score}</span>
            </div>

            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                changeDirection(1, 0);
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
              }}
              style={{ touchAction: 'none' }}
              className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-l from-amber-300 via-yellow-400 to-orange-600 text-black border-2 border-yellow-100 shadow-xl shadow-amber-500/50 flex flex-col items-center justify-center transition-all hover:brightness-110 active:scale-90 active:brightness-125 cursor-pointer mx-auto ring-2 ring-yellow-400/30"
              aria-label="Right"
            >
              <ArrowRight className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3.5] text-black" />
              <span className="text-[9px] font-black uppercase tracking-wider -mt-1 text-black/90">RIGHT</span>
            </button>

            {/* Bottom Row: DOWN */}
            <div />
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                changeDirection(0, 1);
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
              }}
              style={{ touchAction: 'none' }}
              className="w-18 h-18 sm:w-22 sm:h-22 rounded-3xl bg-gradient-to-t from-fuchsia-300 via-purple-500 to-purple-800 text-white border-2 border-purple-100 shadow-xl shadow-purple-500/50 flex flex-col items-center justify-center transition-all hover:brightness-110 active:scale-90 active:brightness-125 cursor-pointer mx-auto ring-2 ring-purple-400/30"
              aria-label="Down"
            >
              <ArrowDown className="w-8 h-8 sm:w-10 sm:h-10 stroke-[3.5] text-white" />
              <span className="text-[9px] font-black uppercase tracking-wider -mt-1 text-white/95">DOWN</span>
            </button>
            <div />
          </div>

          {/* Big Colorful Turbo Speed Boost Button */}
          <div className="flex flex-col items-center justify-center">
            <button
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                gameLoopState.current.isBoosting = true;
                setIsBoosting(true);
                if (!isMuted) soundFx.playSnakeBoost();
                if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(25);
              }}
              onPointerUp={(e) => {
                e.preventDefault();
                gameLoopState.current.isBoosting = false;
                setIsBoosting(false);
              }}
              onPointerLeave={() => {
                gameLoopState.current.isBoosting = false;
                setIsBoosting(false);
              }}
              onPointerCancel={() => {
                gameLoopState.current.isBoosting = false;
                setIsBoosting(false);
              }}
              style={{ touchAction: 'none' }}
              className={`w-22 h-22 sm:w-26 sm:h-26 rounded-3xl border-2 flex flex-col items-center justify-center gap-1 shadow-2xl transition-all active:scale-90 cursor-pointer ${
                isBoosting
                  ? 'bg-gradient-to-tr from-yellow-300 via-amber-400 to-orange-500 text-black border-white shadow-yellow-400/80 scale-105 ring-4 ring-yellow-400/60'
                  : 'bg-gradient-to-tr from-amber-400 via-orange-500 to-yellow-300 text-black border-amber-100 hover:brightness-110 shadow-orange-500/50 ring-2 ring-amber-400/30'
              }`}
            >
              <Zap className={`w-10 h-10 sm:w-12 sm:h-12 ${isBoosting ? 'fill-black text-black animate-bounce' : 'fill-black text-black stroke-[2.5]'}`} />
              <span className="text-[11px] font-black uppercase tracking-wider leading-none text-black">
                {isBoosting ? 'TURBO!' : 'BOOST'}
              </span>
            </button>
            <span className={`text-[9px] font-extrabold mt-1 tracking-wider uppercase ${isLight ? 'text-amber-800' : 'text-amber-400'}`}>
              Hold for 2X
            </span>
          </div>
        </div>

        {/* Desktop Controls Hint */}
        <p className={`text-[10px] text-center pt-2 border-t ${isLight ? 'text-slate-600 border-slate-200' : 'text-stone-500 border-stone-900'}`}>
          Desktop: Use <kbd className={`px-1.5 py-0.5 rounded font-mono border ${isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>W</kbd>
          <kbd className={`px-1.5 py-0.5 rounded font-mono border ${isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>A</kbd>
          <kbd className={`px-1.5 py-0.5 rounded font-mono border ${isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>S</kbd>
          <kbd className={`px-1.5 py-0.5 rounded font-mono border ${isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>D</kbd> or Arrow Keys • Hold <kbd className={`px-1.5 py-0.5 rounded font-mono border ${isLight ? 'bg-slate-200 text-slate-800 border-slate-300' : 'bg-stone-800 text-stone-300 border-stone-700'}`}>Space</kbd> for Turbo
        </p>
        </div>
      </div>
    </>
  );
};
