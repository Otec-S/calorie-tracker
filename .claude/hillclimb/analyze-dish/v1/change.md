# Per-component estimation for multi-ingredient dishes

Hypothesis: baseline underestimates multi-ingredient dishes by 15-27% (multi kcal_ok 77% vs 98-100% elsewhere; e.g. x11, x04, x10, x01) because the model sizes the plate as a whole. Added one SYSTEM_PROMPT rule: estimate each component's kcal and macros separately from its stated or visible weight, then sum. No change to the schema, the unrecognized sentinel, effort, or weight-as-eaten assumptions.

Expected to recover: x11, x04, x10, x01, t02. Expected risk: m01 and t05 (already overestimated) must not get worse.
