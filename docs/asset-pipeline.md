# Asset Pipeline

## Goal
Build better character assets without manual modeling by using a repeatable preview-and-approval loop.

## Subprogram: Asset Lab
The React app now includes an Asset Lab mode. It is the neutral review surface for any fighter asset before it goes into live combat.

## What Asset Lab verifies
- silhouette readability at gameplay distance
- absolute scale against stage markers
- material separation under multiple lighting rigs
- rig response for idle, locomotion, guard, dodge, and attack poses
- authored hurtbox and attack-space overlays

## Recommended workflow
1. Start in Asset Lab, not the battle scene.
2. Select a fighter and cycle through `Idle`, `Locomotion`, `Primary Attack`, and `Secondary Attack`.
3. Check the asset in `Neutral Studio`, `Warm Key`, and `Moonlit Contrast`.
4. Toggle `Wireframe` to inspect shape density and part breakup.
5. Toggle `Hitboxes` to verify the visual model matches gameplay reach.
6. If the asset still reads poorly, revise the procedural recipe or replace the presentation class.
7. Only move the asset into balance/playtest work after it passes the lab review.

## Next extension points
- screenshot capture from Asset Lab for side-by-side comparisons
- procedural part-parameter editing for heads, torsos, limbs, wings, and materials
- imported GLTF preview path for externally generated assets
- automated screenshot diffing for asset regressions
