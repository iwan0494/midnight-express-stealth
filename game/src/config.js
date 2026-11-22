// MIDNIGHT EXPRESS — configuration: carriages, conductors, wires, lanterns.
// Tile grid: 26 x 15, tile 40px. Grid chars:
//   '#' wall   '.' floor   'B' berth (low cover: crouch to hide)
//   'L' luggage (blocks sight + movement)   'T' table (blocks sight + movement)
//   'I' shadow pool (hide)   'W' moonlight pool (lit)   'C' creaky boards (loud)
export const TILE = 40;
export const COLS = 26;
export const ROWS = 15;
export const GRID_X = 2;
export const GRID_Y = 58;
export const PLAY_W = 1044; // canvas 1280 - right HUD panel 236
export const PLAY_H = 628;
export const TOP_BAR = 52;
export const BOTTOM_BAR = 40;

export const COLORS = {
  floorA: '#c8a06a', floorB: '#bd955e', floorLine: '#a87f4e',
  wall: '#4a3226', wallTop: '#5d4030', wallTrim: '#c9a227',
  woodDark: '#6b4a2f', brass: '#c9a227', brassLight: '#e8c85a',
  green: '#2e5d43', greenDark: '#234735', cream: '#f2e6c8',
  moon: '#9fc3e8', moonPool: 'rgba(159,195,232,0.30)',
  shadowPool: '#1d3a2e', ink: '#123326',
  guard: '#e07830', guardRing: '#e23b2e', player: '#1fa8a0',
  loot: '#f5c542', prize: '#e8c85a', exit: '#2fae5f',
  wire: '#ff4d6d', lantern: '#ffb347',
  coneCalm: 'rgba(232,178,60,0.30)', coneSusp: 'rgba(240,120,40,0.38)',
  coneAlert: 'rgba(226,59,46,0.45)',
  hudBg: '#141a2e', hudPanel: '#1b2340', hudLine: '#2c3a63',
  text: '#f2e6c8', textDim: '#a9b4d6', accent: '#e8c85a',
};

export function tile(tx, ty) { return { x: GRID_X + tx * TILE + TILE / 2, y: GRID_Y + ty * TILE + TILE / 2 }; }

export const CARRIAGES = [
  {
    name: 'CARRIAGE 1 — THE SLEEPER CAR',
    short: 'Sleeper Car',
    grid: [
      '##########################',
      '#B...W.....W.....W....B..#',
      '#....#.....#.....#.......#',
      '#....#..L..#..B..#.......#',
      '#....#.....#.....#.......#',
      '#.C........C........C....#',
      '#....#.....#.....#.......#',
      '#.B..#..T..#..L..#..B....#',
      '#....#.....#.....#.......#',
      '#....#.....#.....#.......#',
      '#....#.....#.....#.......#',
      '#.I..W.....W.....W...I...#',
      '#.B..#.....#.....#..B....#',
      '#.......................E#',
      '##########################',
    ],
    player: tile(1, 13),
    exit: tile(24, 13),
    prize: tile(22, 3),
    loot: [[3, 1], [8, 1], [14, 1], [20, 1], [5, 5], [12, 5], [19, 5], [3, 11], [9, 11], [16, 11], [22, 11], [12, 13]].map(([x, y]) => tile(x, y)),
    guards: [
      { start: tile(3, 5), waypoints: [[3, 5], [22, 5]], waits: [2, 2] },
      { start: tile(22, 9), waypoints: [[22, 9], [3, 9]], waits: [1, 2] },
      { start: tile(13, 1), waypoints: [[13, 1], [13, 13]], waits: [2, 1] },
      { start: tile(8, 11), waypoints: [[8, 11], [20, 11]], waits: [2, 2] },
      { start: tile(20, 1), waypoints: [[20, 1], [20, 13]], waits: [1, 1] },
    ],
    wires: [
      { x1: GRID_X + 5 * TILE, y1: GRID_Y + 5 * TILE, x2: GRID_X + 5 * TILE, y2: GRID_Y + 6 * TILE, period: 3.2, phase: 0 },
      { x1: GRID_X + 11 * TILE, y1: GRID_Y + 5 * TILE, x2: GRID_X + 11 * TILE, y2: GRID_Y + 6 * TILE, period: 3.2, phase: 1.1 },
      { x1: GRID_X + 17 * TILE, y1: GRID_Y + 5 * TILE, x2: GRID_X + 17 * TILE, y2: GRID_Y + 6 * TILE, period: 3.2, phase: 2.2 },
    ],
    lanterns: [
      { pos: tile(13, 6), baseAngle: Math.PI / 2, sweep: 0.9, arc: 1.1, range: 250 },
    ],
    lamps: [
      { pos: tile(6, 1), r: 150 }, { pos: tile(19, 1), r: 150 },
      { pos: tile(6, 13), r: 150 }, { pos: tile(19, 13), r: 150 },
    ],
    switches: [
      { pos: tile(1, 6), lamp: 2 }, { pos: tile(24, 6), lamp: 3 },
    ],
    blindSpots: [
      { tx: 9, ty: 8, w: 4, h: 3 },
    ],
  },
  {
    name: 'CARRIAGE 2 — THE DINING CAR',
    short: 'Dining Car',
    grid: [
      '##########################',
      '#..W.....W.....W.....W...#',
      '#....T.......T.......T...#',
      '#....T.......T.......T...#',
      '#........................#',
      '#.C....L..........L...C..#',
      '#........................#',
      '#....T.......T.......T...#',
      '#....T.......T.......T...#',
      '#........................#',
      '#.I....B..........B...I..#',
      '#..W.....W.....W.....W...#',
      '#....L.......L.......L...#',
      '#.......................E#',
      '##########################',
    ],
    player: tile(1, 13),
    exit: tile(24, 13),
    prize: tile(22, 2),
    loot: [[2, 1], [8, 1], [14, 1], [20, 1], [4, 4], [12, 4], [21, 4], [3, 6], [13, 6], [22, 6], [4, 12], [17, 12]].map(([x, y]) => tile(x, y)),
    guards: [
      { start: tile(2, 4), waypoints: [[2, 4], [23, 4]], waits: [2, 1] },
      { start: tile(23, 6), waypoints: [[23, 6], [2, 6]], waits: [1, 2] },
      { start: tile(12, 2), waypoints: [[12, 2], [12, 12]], waits: [2, 2] },
      { start: tile(6, 9), waypoints: [[6, 9], [19, 9]], waits: [1, 1] },
      { start: tile(19, 11), waypoints: [[19, 11], [6, 11]], waits: [2, 1] },
      { start: tile(12, 6), waypoints: [[12, 6], [12, 2], [12, 10]], waits: [1, 1, 1] },
    ],
    wires: [
      { x1: GRID_X + 8 * TILE, y1: GRID_Y + 4 * TILE, x2: GRID_X + 9 * TILE, y2: GRID_Y + 4 * TILE, period: 2.8, phase: 0 },
      { x1: GRID_X + 16 * TILE, y1: GRID_Y + 9 * TILE, x2: GRID_X + 17 * TILE, y2: GRID_Y + 9 * TILE, period: 2.8, phase: 1.4 },
    ],
    lanterns: [
      { pos: tile(13, 5), baseAngle: 0, sweep: 0.7, arc: 1.2, range: 260 },
      { pos: tile(6, 8), baseAngle: Math.PI, sweep: 0.8, arc: 1.0, range: 230 },
    ],
    lamps: [
      { pos: tile(5, 2), r: 150 }, { pos: tile(13, 2), r: 150 },
      { pos: tile(21, 2), r: 150 }, { pos: tile(13, 12), r: 150 },
    ],
    switches: [
      { pos: tile(1, 7), lamp: 0 }, { pos: tile(24, 7), lamp: 3 },
    ],
    blindSpots: [
      { tx: 10, ty: 9, w: 5, h: 3 },
    ],
  },
  {
    name: 'CARRIAGE 3 — THE LUGGAGE CAR',
    short: 'Luggage Car',
    grid: [
      '##########################',
      '#..W.....W.....W.....W...#',
      '#..L...L.....L.....L..L..#',
      '#........................#',
      '#.L...L..#.......#..L..L.#',
      '#........#.......#.......#',
      '#..C.....#.......#....C..#',
      '#........#.......#.......#',
      '#.I..L...#...L...#..L..I.#',
      '#........................#',
      '#..L...L.....L.....L..L..#',
      '#..W.....W.....W.....W...#',
      '#....B.......B.......B...#',
      '#.......................E#',
      '##########################',
    ],
    player: tile(1, 13),
    exit: tile(24, 13),
    prize: tile(13, 4),
    loot: [[2, 1], [9, 1], [16, 1], [23, 1], [4, 3], [21, 3], [2, 6], [23, 6], [5, 9], [13, 9], [20, 9], [8, 12]].map(([x, y]) => tile(x, y)),
    guards: [
      { start: tile(2, 3), waypoints: [[2, 3], [23, 3]], waits: [2, 1] },
      { start: tile(23, 9), waypoints: [[23, 9], [2, 9]], waits: [1, 2] },
      { start: tile(12, 10), waypoints: [[12, 10], [12, 1]], waits: [2, 2] },
      { start: tile(2, 6), waypoints: [[2, 6], [8, 6]], waits: [1, 1] },
      { start: tile(19, 12), waypoints: [[19, 12], [6, 12]], waits: [2, 1] },
    ],
    wires: [
      { x1: GRID_X + 10 * TILE, y1: GRID_Y + 3 * TILE, x2: GRID_X + 10 * TILE, y2: GRID_Y + 4 * TILE, period: 3.0, phase: 0 },
      { x1: GRID_X + 15 * TILE, y1: GRID_Y + 7 * TILE, x2: GRID_X + 15 * TILE, y2: GRID_Y + 8 * TILE, period: 3.0, phase: 1.5 },
      { x1: GRID_X + 13 * TILE, y1: GRID_Y + 9 * TILE, x2: GRID_X + 14 * TILE, y2: GRID_Y + 9 * TILE, period: 3.0, phase: 0.7 },
    ],
    lanterns: [
      { pos: tile(13, 5), baseAngle: Math.PI / 2, sweep: 0.6, arc: 1.3, range: 270 },
    ],
    lamps: [
      { pos: tile(6, 1), r: 150 }, { pos: tile(19, 1), r: 150 },
      { pos: tile(6, 11), r: 150 }, { pos: tile(19, 11), r: 150 },
    ],
    switches: [
      { pos: tile(1, 6), lamp: 2 }, { pos: tile(24, 6), lamp: 3 },
    ],
    blindSpots: [
      { tx: 9, ty: 5, w: 4, h: 3 },
      { tx: 15, ty: 10, w: 4, h: 2 },
    ],
  },
];

export const GAME = {
  title: 'MIDNIGHT EXPRESS',
  subtitle: 'Steal the Brass Key',
  pebbles: 5,
  steam: 2,
  guardRange: 270,
  guardConeHalf: 0.61, // ~35 degrees
  guardPatrolSpeed: 55,
  guardChaseSpeed: 100,
  guardInvestigateSpeed: 72,
  playerSpeed: 150,
  playerSneakSpeed: 82,
  catchDistance: 26,
};
