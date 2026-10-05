# analyze-dish metrics

- **kcal_ok** (headline, binary): midpoint of cal_min..cal_max within +-15% of the reference kcal (+-30% for `approx` cases). Not-food: title "Не удалось распознать" and cal 0/0. Zero-calorie drink: cal_max <= 10, not "unrecognized".
- **in_range** (binary): the reference kcal lies inside cal_min..cal_max.
- **kcal_err** (lower is better): |midpoint - ref| / max(ref, 50).
- **macro_err** (lower is better): mean abs error in grams over protein/fat/carbs.
- **range_width** (lower is better): (cal_max - cal_min) / max(midpoint, 50); guards against winning by widening the range.

References are computed from stated weights and standard nutrition tables (USDA, labels quoted in the case text); they are approximate. Rounds run on all 58 cases x 3 reps with no held-out split, so round scores are directional; the winner is checked on fresh cases at the end.
