# Per-component work shown in the `items` field

Round 1 (a SYSTEM_PROMPT rule to sum components) did not move the target cases (x01/x04/x10/x11 stayed 0/3) and narrowed ranges (in_range -9). Reading: the model underestimates component values and has no place to work them out before committing to totals; with structured output the properties are emitted in schema order, so `items` (before `cal_min`) can act as a scratchpad. Change: `items` description now asks for each component with weight and kcal ("авокадо 70 г — 112 ккал"). Field name/type unchanged. Reverts round 1.

Cost: a longer `items` string (more output tokens, longer text shown in the UI) - a [TUNE] the user may decline.
