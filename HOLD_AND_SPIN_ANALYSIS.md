# Hold & Spin — Math Analysis

All figures simulated over **200,000,000 base spins** at min bet (25 lines × 1 = 25
credits) by running the actual game logic extracted into [`sim/montecarlo.js`](sim/montecarlo.js).
Raw output: [`sim/results.json`](sim/results.json).

## 1. How does Hold & Spin trigger?

- **Base game:** 6 or more `CHIP` symbols anywhere on the 5×3 grid in a single spin
  ([index.html:1103](index.html) — `if (chipCount >= 6) results.holdSpin = true`).
- **Free Games:** a **BIG CHIP** (the linked reels 2-3-4 land on `CHIP`) fills the middle
  window with 9 chips, which is ≥6 → triggers H&S inside the feature
  ([index.html:1520](index.html)).
- **Measured probability (base):** **0.827% = 1 in 121 spins.**

## 2. Odds of landing ADDITIONAL chips on each respin

- Hardcoded constant **`HS_CHIP_RATE = 0.03`** ([index.html:880](index.html)) — each
  **empty** cell independently has a **3%** chance of becoming a chip on each respin
  ([index.html:1599](index.html)).
- This rate is **not** derived from the reel strips. The strip chip frequency (5 chips per
  reel) only governs the *trigger*; once in H&S the respin uses the flat 3% constant.
- Starting from the most common 6-chip trigger → **9 empty cells**:
  - Expected new chips per respin = 9 × 0.03 = **0.27**
  - P(at least one new chip) = 1 − 0.97⁹ = **≈ 24%**

## 3. How many respins do you start with?

- **3** (`hsSpinsLeft = 3`, [index.html:1513](index.html)).

## 4. What resets the respin counter?

- Landing **any** new chip on a respin resets it back to **3**
  ([index.html:1617](index.html) — `hsSpinsLeft = 3`). The session ends only after 3
  consecutive respins with no new chip, or when all 15 cells are filled.

## 5. Average total chips at the end of an H&S session

- **7.34 chips** (base-triggered sessions). End-of-session distribution:

  | Chips | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 |
  |---|---|---|---|---|---|---|---|---|---|---|
  | % of sessions | 30.5 | 31.7 | 20.7 | 10.5 | 4.4 | 1.6 | 0.45 | 0.10 | 0.02 | ~0.001 |

  On average a session collects only **~1.3 chips beyond the trigger**.

## 6. Average total payout from an H&S session

- **852.9 credits** per base session = **34.1× the 25-credit bet**.
  (Includes credit chips, MINI/MINOR/MAJOR labels and any GRAND.)

## 7. Chip prize weights and distribution

From `CHIP_PRIZES` ([index.html:838](index.html)), total weight = 105.292:

| Prize | Weight | Probability |
|---|---|---|
| 1× total bet | 40 | 37.99% |
| 2× | 26 | 24.69% |
| 3× | 14 | 13.30% |
| 4× | 8 | 7.60% |
| 5× | 7 | 6.65% |
| 10× | 4 | 3.80% |
| 15× | 2.5 | 2.37% |
| 20× | 1.8 | 1.71% |
| 50× | 0.7 | 0.665% |
| 100× | 0.25 | 0.237% |
| **MINI** (1,000 cr) | 0.85 | 0.807% |
| **MINOR** (5,000 cr) | 0.18 | 0.171% |
| **MAJOR** (progressive) | 0.012 | 0.0114% |

`MAJOR` is capped at one per session (`majorAlreadyHeld`, [index.html:1050](index.html)).

## 8. GRAND jackpot trigger (15 chips)

- GRAND is **not** a chip label — it is awarded only by **filling all 15 cells**
  ([index.html:1665](index.html)).
- **Measured: ~1 in 3.85M spins.** Crucially, it is won **mostly via Free Games**: 37 of 52
  GRAND hits in 200M spins came from the FG **BIG CHIP** path (which starts at 9 chips, only
  6 cells to fill). From a base 6-chip trigger it is **~1 in 13M spins** — effectively never.

## 9. Comparison to the par sheet spec

| Metric | Code comment / par target | Measured (200M) |
|---|---|---|
| Feature (H&S) RTP | 32.146% | **30.89%** |
| Progressive RTP | 3.950% | **3.98%** ✓ |
| Adjusted base (base+FG) | 55.209% | 54.91% |
| Total RTP | 91.305% | **89.78%** |

H&S is running **~1.3% light** vs the 32.146% target, and total RTP is ~1.5% under the
91.3% design point. The gap traces to the H&S credit menu + the 3% chip rate being slightly
conservative, plus the **Free Games paytable being calibrated, not par-exact**
([index.html:816-830](index.html) explicitly flags this).

## Is the extra-chip landing rate too low? — Yes, and here's exactly why

The respin chip rate is the flat constant **`HS_CHIP_RATE = 0.03`**. It has **nothing to do
with the reel strips** — the strips only matter for the trigger. With it:

- A 6-chip start has 9 open cells → only **0.27 expected new chips** and **~24%** chance of
  *any* new chip per respin, so sessions stall almost immediately (avg end = 7.34 chips).
- Reaching 15 from 6 requires 9 more chips before three quiet respins — astronomically
  unlikely, which is why a base GRAND is ~1 in 13M. The feature feels "dead" after one or
  two respins most of the time.

**What would need to change** to make chips accumulate more (more excitement, reachable
GRAND from base):

1. **Raise `HS_CHIP_RATE`** — e.g. 0.03 → 0.06–0.08. At 0.06, P(any new chip from a 6-chip
   start) ≈ 1 − 0.94⁹ ≈ **42%**, roughly doubling session length and lifting avg chips.
2. **Compensate RTP.** Raising the rate increases Feature RTP, so the chip **credit menu
   would have to be trimmed** (shift weight toward 1×/2×) to hold Feature RTP at the 32.146%
   target. The two knobs (`HS_CHIP_RATE` and `CHIP_PRIZES` weights) must be re-balanced
   together.
3. Alternatively, **scale the rate by open cells** (real Dragon-Link-style games often use a
   dedicated H&S reel strip with higher chip density per position) so persistence feels
   consistent rather than collapsing to ~24%.

Bottom line: the low accumulation is a deliberate consequence of the 3% constant chosen to
hit the target Feature RTP — it is a **math-balance choice, not a strip bug**. Changing it
requires a paired prize-weight recalibration.
