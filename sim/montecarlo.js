// Monte Carlo simulation of Dragon Forge Link — extracted VERBATIM from
// index.html game logic (strips, paytables, prize menus, H&S/FG mechanics).
// Run: node sim/montecarlo.js [numSpins]
// Produces RTP decomposition, feature frequencies, and H&S session stats.

// ── Symbol IDs ──
const S = { DRAGON:0, PHOENIX:1, TIGER:2, JADE:3, WILD:4, SUITCASE:5, CHIP:6, KING:8, QUEEN:9, JACK:10, TEN:11, NINE:12 };

// ── Base reel strips (index.html lines 720-741) ──
const STRIPS = [
  [2,12,9,0,11,2,12,3,9,11, 6,6,6,8,1,9,11,2,12,1, 8,0,11,3,12,9,5,11,2,10,
   12,1,9,2,6,6,12,11,1,12, 2,11,0,1,9,2,11,12,0,2, 9,1,11,3,12,1,9,5,10,2,
   8,12,1,9,11,0,8,5,12,2,  9,10,1,11,0,8,3,10,0,8, 12,3,9,2,11],
  [10,1,8,4,4,4,4,4,4,4, 10,0,3,8,5,10,1,0,8,10, 3,8,1,9,3,8,6,6,6,8,
   3,12,10,0,3,8,0,9,3,10, 5,11,2,12,3,10,1,0,8,3, 10,6,6,8,11,3,10,11,0,8,
   10,1,12,2],
  [10,2,9,8,4,4,4,4,4,4, 4,4,10,3,1,10,3,8,6,6, 9,1,8,3,12,0,2,8,1,10,
   5,8,10,2,11,6,6,6,10,0, 8,5,9,2,10,0,8,3,1,9,  3,10,2,8,3,10,1,12,10,3,
   8,0,11,3],
  [11,2,3,12,4,4,4,4,4,4, 10,11,2,3,9,10,2,9,1,8, 6,6,6,12,3,9,1,11,2,9,
   3,8,10,5,12,3,10,1,8,2, 9,3,8,6,6,11,1,10,12,0, 3,9,2,11,0,10,3,12,5,9,
   3,0,9,1],
  [9,5,8,4,4,4,4,9,3,12, 8,6,6,6,11,3,8,2,11,3,  8,1,10,2,12,5,9,12,1,10,
   2,9,10,3,8,0,11,2,9,6, 6,12,1,8,11,3,10,0,8,2, 11,1,9,3,10,11,0,8,11,1,
   10,12,2,9],
];

// ── Free Games strips (index.html lines 750-760) ──
const FG_STRIPS = {
  R1: [1,12,9,0,11,10,2,2,12,9, 3,11,10,3,9,8,1,9,9,2, 12,3,11,0,10,3,8,8,0,11,
       9,2,10,3,3,8,11,1,9,12, 2,10,10,1,9,12,2,11,12,0, 8,12,2,11,11,3,9,11,2,12,
       12,1,9,10,10,11,3,10,6,8, 0,12,3,10,6,9,1,11,8,3, 2,10,10,3,12],
  R234: [4,4,4,4,4,4,0,8,1,2, 11,8,6,12,11,5,10,2,8,4, 11,1,10,6,12,3,10,11,1,8,
         4,12,10,2,3,9,6,12,8,3, 11,4,12,0,10,5,9,3,11,0, 10,8,4,12,9,1,11,2,8,3,
         11,2,9,5],
  R5: [9,2,8,10,4,4,4,4,9,12, 3,8,9,1,1,12,11,3,8,2, 11,8,1,10,11,2,9,9,1,10,
       11,3,8,10,1,11,11,12,3,9, 2,12,10,3,8,11,2,12,12,3, 8,2,11,9,3,10,0,0,12,11,
       1,10,12,2,2,9,11,3,8,12, 1,10,8,8,2,12,8,3,9,12],
};

// ── 25 win lines (index.html lines 765-791) ──
const WIN_LINES = [
  [1,1,1,1,1],[0,0,0,0,0],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2],
  [0,0,1,2,2],[2,2,1,0,0],[1,0,0,0,1],[1,2,2,2,1],[0,1,0,1,0],
  [2,1,2,1,2],[1,0,1,0,1],[1,2,1,2,1],[0,0,0,1,2],[2,2,2,1,0],
  [0,1,2,2,1],[2,1,0,0,1],[0,1,1,1,0],[2,1,1,1,2],[1,1,0,1,1],
  [1,1,2,1,1],[0,0,1,0,0],[2,2,1,2,2],[1,0,2,0,1],[1,2,0,2,1],
];

// ── Paytables (index.html lines 796-830) ──
const PAYTABLE = {
  0: [150,50,10,2], 1: [100,30,5,0], 2: [100,25,5,0], 3: [100,25,5,0],
  5: [100,15,2], 8: [75,20,5,0], 9: [50,10,5,0], 10:[50,10,5,0], 11:[50,10,5,0], 12:[50,10,5,0],
};
const FG_PAYTABLE = {
  0: [75,25,5,1], 1: [50,15,3,0], 2: [50,14,3,0], 3: [50,14,3,0],
  8: [40,10,3,0], 9: [25,5,3,0], 10:[25,5,3,0], 11:[25,5,3,0], 12:[25,5,3,0],
};

// ── Chip prize menus (index.html lines 838-873) ──
const CHIP_PRIZES = [
  { type:'credits', val:1,   weight:40   }, { type:'credits', val:2,   weight:26   },
  { type:'credits', val:3,   weight:14   }, { type:'credits', val:4,   weight:8    },
  { type:'credits', val:5,   weight:7    }, { type:'credits', val:10,  weight:4    },
  { type:'credits', val:15,  weight:2.5  }, { type:'credits', val:20,  weight:1.8  },
  { type:'credits', val:50,  weight:0.7  }, { type:'credits', val:100, weight:0.25 },
  { type:'mini',    val:0,   weight:0.85 }, { type:'minor',   val:0,   weight:0.18 },
  { type:'major',   val:0,   weight:0.012},
];
const CHIP_WEIGHT_TOTAL = CHIP_PRIZES.reduce((a,p)=>a+p.weight,0);
const BIG_CHIP_PRIZES = [
  { type:'credits', val:5,   weight:20  }, { type:'credits', val:10,  weight:16  },
  { type:'credits', val:15,  weight:12  }, { type:'credits', val:20,  weight:9   },
  { type:'credits', val:25,  weight:7   }, { type:'credits', val:30,  weight:5   },
  { type:'credits', val:40,  weight:3   }, { type:'credits', val:50,  weight:2   },
  { type:'credits', val:60,  weight:1.2 }, { type:'credits', val:80,  weight:0.6 },
  { type:'credits', val:100, weight:0.4 }, { type:'mini',    val:0,   weight:1.0 },
  { type:'minor',   val:0,   weight:0.2 }, { type:'major',   val:0,   weight:0.012},
];
const BIG_CHIP_WEIGHT_TOTAL = BIG_CHIP_PRIZES.reduce((a,p)=>a+p.weight,0);

const MINI_BONUS  = 1000;
const MINOR_BONUS = 5000;
const HS_CHIP_RATE = 0.03;            // index.html line 880
const GRAND_SEED = 1500000;           // credits (index.html line 901)
const MAJOR_SEED = 50000;             // credits

// ── Bet config: min bet = 25 lines × 1 mult ──
const numLines = 25;
const mult = 1;
const totalBet = numLines * mult;     // 25 credits
const lineBet = mult;                 // 1

// ── Progressive meters (shared, accrue on base spins only) ──
let meterGrand = GRAND_SEED;
let meterMajor = MAJOR_SEED;

const ri = n => (Math.random() * n) | 0;

// ── pickFromPrizeTable (index.html lines 1047-1055) — faithful, incl. major-held skip ──
function pickFromPrizeTable(table, total, majorHeld) {
  let r = Math.random() * total;
  for (const p of table) {
    r -= p.weight;
    if (r <= 0) {
      if (p.type === 'major' && majorHeld) continue;
      return { ...p };
    }
  }
  return { ...table[0] };
}

// ── generateGrid (index.html lines 1025-1038) ──
function generateGrid() {
  const g = [];
  for (let r = 0; r < 5; r++) {
    const L = STRIPS[r].length;
    const pos = ri(L);
    g.push([0,1,2].map(row => STRIPS[r][(pos + row) % L]));
  }
  return g;
}

// ── generateFreeGameGrid (index.html lines 1165-1177) ──
function generateFreeGameGrid() {
  const g = [];
  const L1 = FG_STRIPS.R1.length, L5 = FG_STRIPS.R5.length;
  const p1 = ri(L1), p5 = ri(L5);
  const big = FG_STRIPS.R234[ri(FG_STRIPS.R234.length)];
  g.push([0,1,2].map(row => FG_STRIPS.R1[(p1 + row) % L1]));
  for (let r = 1; r <= 3; r++) g.push([big, big, big]);
  g.push([0,1,2].map(row => FG_STRIPS.R5[(p5 + row) % L5]));
  return g;
}

// ── evaluateWins (index.html lines 1068-1138) ──
function evaluateWins(g, isFG) {
  const res = { scatterWin: 0, chipCount: 0, freeGames: false, holdSpin: false, bigSuitcase: false, lineWin: 0 };

  if (isFG) {
    if (g[1][0] === S.SUITCASE) { res.scatterWin = totalBet; res.freeGames = true; res.bigSuitcase = true; }
  } else {
    let suitcaseCount = 0;
    for (let r = 0; r < 5; r++) for (let row = 0; row < 3; row++) if (g[r][row] === S.SUITCASE) suitcaseCount++;
    if (suitcaseCount >= 3 && PAYTABLE[5]) {
      const idx = Math.min(5 - suitcaseCount, 2);
      const pay = PAYTABLE[5][idx] * totalBet;
      if (pay > 0) res.scatterWin = pay;
    }
    if (suitcaseCount >= 3) res.freeGames = true;
  }

  let chipCount = 0;
  for (let r = 0; r < 5; r++) for (let row = 0; row < 3; row++) if (g[r][row] === S.CHIP) chipCount++;
  res.chipCount = chipCount;
  if (chipCount >= 6) res.holdSpin = true;

  const table = isFG ? FG_PAYTABLE : PAYTABLE;
  for (let l = 0; l < WIN_LINES.length && l < numLines; l++) {
    const line = WIN_LINES[l];
    let firstSym = g[0][line[0]];
    if (firstSym === S.WILD) {
      for (let r = 1; r < 5; r++) {
        const s = g[r][line[r]];
        if (s !== S.WILD && s !== S.SUITCASE && s !== S.CHIP) { firstSym = s; break; }
      }
    }
    if (firstSym === S.SUITCASE || firstSym === S.CHIP || firstSym === S.WILD) continue;
    let count = 0;
    for (let r = 0; r < 5; r++) {
      const s = g[r][line[r]];
      if (s === firstSym || s === S.WILD) count++; else break;
    }
    if (count >= 2 && table[firstSym]) {
      const base = table[firstSym][5 - count];
      if (base > 0) res.lineWin += base * lineBet;
    }
  }
  return res;
}

// ── Hold & Spin session (index.html triggerHoldSpin/doHSSpin/endHoldSpin) ──
// Returns { hsCredits, progressive, chips } so callers can bucket the payout.
function runHoldSpin(grid, isBigChip) {
  const held = {};               // key -> prize
  const majorHeld = () => Object.values(held).some(p => p.type === 'major');

  if (isBigChip) {
    for (let r = 1; r <= 3; r++) for (let row = 0; row < 3; row++) {
      held[`${r},${row}`] = (r === 2 && row === 1)
        ? pickFromPrizeTable(BIG_CHIP_PRIZES, BIG_CHIP_WEIGHT_TOTAL, majorHeld())
        : { type: 'partOfBig', val: 0 };
    }
  }
  // Lock existing chips on the grid
  for (let r = 0; r < 5; r++) for (let row = 0; row < 3; row++) {
    if (grid[r][row] === S.CHIP && !held[`${r},${row}`]) {
      held[`${r},${row}`] = pickFromPrizeTable(CHIP_PRIZES, CHIP_WEIGHT_TOTAL, majorHeld());
    }
  }

  const countHeld = () => Object.keys(held).length;
  let spinsLeft = 3;
  while (spinsLeft > 0 && countHeld() < 15) {
    const free = [];
    for (let r = 0; r < 5; r++) for (let row = 0; row < 3; row++) if (!held[`${r},${row}`]) free.push([r, row]);
    let anyNew = false;
    free.forEach(([r, row]) => {
      if (Math.random() < HS_CHIP_RATE) {
        held[`${r},${row}`] = pickFromPrizeTable(CHIP_PRIZES, CHIP_WEIGHT_TOTAL, majorHeld());
        anyNew = true;
      }
    });
    if (anyNew) spinsLeft = 3;
    spinsLeft--;
  }

  // Tally (endHoldSpin)
  let hsCredits = 0, progressive = 0, majorWon = false, grandWon = false;
  Object.values(held).forEach(prize => {
    if (prize.type === 'credits') hsCredits += prize.val * totalBet;
    else if (prize.type === 'major') { progressive += meterMajor; meterMajor = MAJOR_SEED; majorWon = true; }
    else if (prize.type === 'minor') hsCredits += MINOR_BONUS;
    else if (prize.type === 'mini')  hsCredits += MINI_BONUS;
  });
  if (countHeld() === 15) { progressive += meterGrand; meterGrand = GRAND_SEED; grandWon = true; }

  return { hsCredits, progressive, chips: countHeld(), majorWon, grandWon };
}

// ── Free Games session (index.html doFreeGameSpin loop) ──
// Returns { fgPays, hsCredits, progressive, hsCount } separating buckets.
function runFreeGames() {
  let freeGamesLeft = 6;
  let fgPays = 0, hsCredits = 0, progressive = 0, hsCount = 0;
  while (freeGamesLeft > 0) {
    freeGamesLeft--;
    const g = generateFreeGameGrid();
    const res = evaluateWins(g, true);
    fgPays += res.scatterWin + res.lineWin;
    if (res.bigSuitcase) freeGamesLeft += 3;
    if (res.holdSpin) {           // BIG CHIP -> H&S inside FG
      const hs = runHoldSpin(g, true);
      hsCredits += hs.hsCredits; progressive += hs.progressive; hsCount++;
      if (hs.majorWon) fgMajorHits++;
      if (hs.grandWon) fgGrandHits++;
    }
  }
  return { fgPays, hsCredits, progressive, hsCount };
}
let fgMajorHits = 0, fgGrandHits = 0;   // jackpots won inside FG big-chip H&S

// ═══════════════════════════════════════════════════════════
// MAIN SIMULATION
// ═══════════════════════════════════════════════════════════
const N = parseInt(process.argv[2] || '2000000', 10);

let turnover = 0;
let baseLineScatter = 0;   // base line + scatter pays
let fgPaysTotal = 0;       // FG line+scatter+bigSuitcase pays
let hsCreditsTotal = 0;    // H&S credit/mini/minor prizes (base + FG-originated)
let progressiveTotal = 0;  // major + grand meter pays

let fgTriggers = 0;        // base spins that trigger FG (3+ suitcase)
let hsTriggers = 0;        // base spins that trigger H&S (6+ chips)
let anyFeatureSpins = 0;
let immediateHits = 0;     // base spins with line/scatter pay > 0
let anyReturnSpins = 0;    // base spins returning >0 to player (incl. features)

// H&S session stats (base-originated sessions)
let hsSessions = 0, hsChipsSum = 0, hsWinSum = 0;
let hsChipsHist = {};      // chips -> count
let grandHits = 0, majorHits = 0;
// FG session stats
let fgSessions = 0, fgWinSum = 0;

for (let i = 0; i < N; i++) {
  turnover += totalBet;
  meterGrand += totalBet * 0.002;     // accrueJackpots
  meterMajor += totalBet * 0.0075;

  const g = generateGrid();
  const res = evaluateWins(g, false);
  const immediate = res.scatterWin + res.lineWin;
  baseLineScatter += immediate;
  if (immediate > 0) immediateHits++;

  let spinReturn = immediate;

  const fgTrig = res.freeGames, hsTrig = res.holdSpin;
  if (fgTrig) fgTriggers++;
  if (hsTrig) hsTriggers++;
  if (fgTrig || hsTrig) anyFeatureSpins++;

  // Precedence (handleResults): H&S first, then FG (pendingFreeGames)
  if (hsTrig) {
    const hs = runHoldSpin(g, false);
    hsCreditsTotal += hs.hsCredits;
    progressiveTotal += hs.progressive;
    hsSessions++; hsChipsSum += hs.chips; hsWinSum += hs.hsCredits + hs.progressive;
    hsChipsHist[hs.chips] = (hsChipsHist[hs.chips] || 0) + 1;
    if (hs.grandWon) grandHits++;
    if (hs.majorWon) majorHits++;
    spinReturn += hs.hsCredits + hs.progressive;
  }
  if (fgTrig) {
    const fg = runFreeGames();
    fgPaysTotal += fg.fgPays;
    hsCreditsTotal += fg.hsCredits;
    progressiveTotal += fg.progressive;
    fgSessions++; fgWinSum += fg.fgPays + fg.hsCredits + fg.progressive;
    spinReturn += fg.fgPays + fg.hsCredits + fg.progressive;
  }

  if (spinReturn > 0) anyReturnSpins++;
}

// ── RTP decomposition ──
const pct = x => (100 * x / turnover);
const rtpBase = pct(baseLineScatter);
const rtpFG   = pct(fgPaysTotal);
const rtpHS   = pct(hsCreditsTotal);
const rtpProg = pct(progressiveTotal);
const rtpTotal = rtpBase + rtpFG + rtpHS + rtpProg;

const out = {
  spins: N,
  bet: { numLines, mult, totalBetCredits: totalBet },
  rtp: {
    baseGame_lineScatter: +rtpBase.toFixed(3),
    freeGames: +rtpFG.toFixed(3),
    holdSpin: +rtpHS.toFixed(3),
    progressive: +rtpProg.toFixed(3),
    total: +rtpTotal.toFixed(3),
  },
  frequencies: {
    freeGames_oneIn: +(N / fgTriggers).toFixed(1),
    holdSpin_oneIn: +(N / hsTriggers).toFixed(1),
    anyFeature_oneIn: +(N / anyFeatureSpins).toFixed(1),
    freeGames_pct: +(100 * fgTriggers / N).toFixed(4),
    holdSpin_pct: +(100 * hsTriggers / N).toFixed(4),
  },
  hitFrequency: {
    immediateLineScatter_pct: +(100 * immediateHits / N).toFixed(2),
    anyReturnInclFeatures_pct: +(100 * anyReturnSpins / N).toFixed(2),
  },
  holdSpinSessions: {
    sessions: hsSessions,
    avgChips: +(hsChipsSum / hsSessions).toFixed(3),
    avgWinCredits: +(hsWinSum / hsSessions).toFixed(1),
    grandHits_base: grandHits, majorHits_base: majorHits,
    grandHits_fg: fgGrandHits, majorHits_fg: fgMajorHits,
    grandHits_total: grandHits + fgGrandHits,
    majorHits_total: majorHits + fgMajorHits,
    grand_oneInSpins: (grandHits + fgGrandHits) ? +(N / (grandHits + fgGrandHits)).toFixed(0) : null,
    major_oneInSpins: (majorHits + fgMajorHits) ? +(N / (majorHits + fgMajorHits)).toFixed(0) : null,
    chipsHistogramPct: Object.fromEntries(
      Object.entries(hsChipsHist).sort((a,b)=>a[0]-b[0]).map(([k,v])=>[k, +(100*v/hsSessions).toFixed(2)])),
  },
  freeGamesSessions: {
    sessions: fgSessions,
    avgWinCredits: +(fgWinSum / fgSessions).toFixed(1),
  },
  meters_endState_credits: { grand: Math.round(meterGrand), major: Math.round(meterMajor) },
};

console.log(JSON.stringify(out, null, 2));
