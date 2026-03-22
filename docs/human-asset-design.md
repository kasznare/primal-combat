# Human Asset Design

## Purpose
The human is the baseline reference fighter for the roster. It is not meant to be the most exotic asset. It is meant to be the clearest asset.

## Design goals
- read instantly at gameplay camera distance
- establish the visual quality bar for biped fighters
- support punch, kick, block, dodge, and hit reactions with obvious limb leadership
- keep the silhouette grounded and believable, but still stylized enough for procedural construction

## Silhouette rules
- Upright torso with visible shoulder width and narrower waist.
- Distinct head, neck, and chest separation so facing direction is readable.
- Heavier boots and lower-leg mass so stance reads clearly against dark ground.
- Single bright chest panel to establish the front plane of the body.

## Proportion contract
These ratios are now the formal recipe implemented in code.

- minimum height: `1.70m`
- minimum width: `0.48m`
- minimum depth: `0.34m`
- torso height: `34%` of total height
- upper leg: `23%` of total height
- lower leg: `23%` of total height
- boot height: `6.5%` of total height
- upper arm: `17%` of total height
- lower arm: `15%` of total height
- neck height: `6%` of total height
- head radius: `44%` of total width
- shoulder span: `140%` of total width

## Material contract
- skin: fighter tint / skin tone slot
- hair: dark neutral cap and brow for facial framing
- jacket: desaturated blue major mass
- undershirt: lighter blue accent for chest readability
- pants: dark charcoal lower body
- boots: near-black grounded base
- detail: cool light accent for boot toe breakup

## Rig contract
The human rig nodes are fixed and should not be renamed without updating animation logic.

- `torso`
- `head`
- `leftArm`
- `rightArm`
- `leftForearm`
- `rightForearm`
- `leftLeg`
- `rightLeg`
- `leftShin`
- `rightShin`

## Motion intent
- Primary attack leads from the right arm and should read as a straight punch.
- Secondary attack leads from the right leg and should read as a roundhouse-style kick.
- Block pose is carried by both arms and forearms, not the torso alone.
- Locomotion readability comes from opposing arm/leg swing, not root-body wobble.

## Asset Lab review checklist
The human passes review only if all of these remain true in Asset Lab.

1. Head, chest panel, and boots remain separable in `Neutral Studio`.
2. `Primary Attack` reads as a punch before hit effects appear.
3. `Secondary Attack` reads as a kick before hit effects appear.
4. `Wireframe` shows layered masses, not a single torso block.
5. `Hitboxes` do not visually overshoot the limbs by a distracting amount.

## Implementation
- Procedural recipe: [humanAssetDesign.ts](/Users/kasznarandras/Code/primal-combat/src/entities/design/humanAssetDesign.ts)
- Mesh builder: [Human.ts](/Users/kasznarandras/Code/primal-combat/src/entities/Human.ts)
- Review surface: [AssetLab.ts](/Users/kasznarandras/Code/primal-combat/src/asset-lab/AssetLab.ts)
