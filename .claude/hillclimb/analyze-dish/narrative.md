| round | change (one line) | kcal_ok | in_range | kcal_err | macro_err g | range_width | s/call | out toks | $/run |
|-------|-------------------|---------|----------|----------|-------------|-------------|--------|----------|-------|
| 0 | baseline (effort low) | 0.891 | 0.782 | 0.059 | 1.68 | 0.164 | 2.73 | 146 | $0.73 |
| 1 | SYSTEM_PROMPT: sum components separately (reverted) | 0.862 | 0.691 (-9, significant) | 0.066 | 1.74 | 0.150 | 2.55 | 161 | $0.78 |
| 2 | `items` field: each component with weight and kcal | **0.971** (+8.1) | **0.933** (+15.2) | **0.028** | **1.26** | 0.162 | 2.75 | 167 | $0.84 |

Fresh held-out set (15 cases x 3 reps, never seen by the loop): baseline 0.867 -> v2 1.000 kcal_ok, in_range 0.641 -> 0.923, kcal_err 0.074 -> 0.029, macro_err 4.17 -> 1.25, $/call 0.0042 -> 0.0048. Spend on evals: $3.12 of the $6 ceiling.

## Recommended change
[TUNE] In `server/src/claude.ts`, the `items` field description of `ANALYZE_SCHEMA` now asks for each component with weight and kcal ("авокадо 70 г — 112 ккал"). Nothing else changed in the app (field name/type, sentinel, SYSTEM_PROMPT, effort low untouched). It also makes the `items` text shown in the UI longer and costs about 15% more per call.

## Versus baseline
Main set (58 cases x 3 reps, directional): kcal_ok 89.1% -> 97.1%, paired +8.1 points (95% CI +1.0..+15.1); in_range +15.2 (CI +6.2..+24.1); kcal_err 5.9% -> 2.8%. Fresh set (15 x 3): kcal_ok 86.7% -> 100% (paired +13.3, CI -2.0..+28.7, so not significant on its own), in_range +28.2 (CI +3.8..+52.6, significant), kcal_err -4.6 points (significant). macro_err on the fresh set is dominated by one baseline answer with nonsense macros (f01: protein 243 g, fat 0, carbs 0) - read it as an outlier, not a trend.

## Why trust this
Mechanism: structured output emits fields in schema order, so `items` (before `cal_min`) works as a scratchpad; the transcripts show component kcal listed before totals and the totals matching their sum. The grader never reads `items`, so the field cannot be gamed. Round 1 (a rule with no place to show the work) failed on the same cases, which is what the mechanism predicts. No change refers to specific cases. Caveats: references are mine (USDA/labels), approximate; the main set had no held-out split and the fresh set has 15 cases, so the kcal_ok gain is plausible rather than proven independently; x01's reference (chicken thigh 209 kcal/100 g) is uncertain.

## What else was tried
effort medium vs low (28 cases, +2.4, CI -3.4..+8.1: no difference, tokens equal); round 1 prompt rule (reverted).
