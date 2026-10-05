# Shorter `items` description (cost)

Goal: recover part of round 2's +15% cost per call. The `items` description is shortened from "каждый компонент блюда через запятую с весом и калориями, например 'авокадо 70 г — 112 ккал'; вес — указанный или оценённый; по-русски" to "компоненты с весом и ккал через запятую, напр. 'авокадо 70 г — 112 ккал'; по-русски". Same mechanism (per-component weight and kcal shown before totals). Must hold kcal_ok within noise of v2 (0.971); expected saving is small (the description is ~25 tokens), so the measurement decides.
