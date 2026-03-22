# Bear Asset Design

## Purpose
The bear is the baseline heavy quadruped. It should read as dangerous from the front quarter, not as a generic brown blob.

## Design goals
- read as front-heavy and predatory at gameplay distance
- make the shoulder hump and skull the dominant silhouette masses
- support two obvious attack stories: paw swipe and bite lunge
- keep the rear body secondary so combat focus stays on the head and front legs

## Silhouette rules
- Large shoulder mass with visible hump.
- Forward skull and snout that project the bite direction clearly.
- Thick front legs and paws that can carry a swipe silhouette.
- Short tail and compact rear so the attack reads stay in the front half.

## Proportion contract
These ratios are the formal procedural recipe.

- minimum body length: `2.10m`
- minimum body height: `1.10m`
- minimum body width: `1.10m`
- shoulder height: `80%` of body height
- hind mass radius: `36%` of body width
- shoulder mass radius: `34%` of body width
- upper leg length: `46%` of body height
- lower leg length: `34%` of body height
- paw height: `12%` of body height
- front leg x offset: `32%` of body length
- rear leg x offset: `32%` of body length

## Material contract
- fur: fighter tint / primary coat color
- dark fur: snout, rib shadow, paw depth separation
- nose: dark wet focal point on the snout tip
- tooth: pale fang material for bite readability

## Rig contract
The bear rig nodes are fixed and are part of the animation contract.

- `torso`
- `head`
- `jaw`
- `frontLeftLeg`
- `frontRightLeg`
- `rearLeftLeg`
- `rearRightLeg`

## Motion intent
- Primary attack is a paw swipe led by the front right leg with visible head commitment.
- Secondary attack is a bite lunge led by the head and jaw with both front legs bracing.
- Block pose tucks the head and loads the front legs, not the rear body.
- Locomotion readability comes from front and rear gait opposition, not body wobble alone.

## Asset Lab review checklist
The bear passes review only if all of these stay true in Asset Lab.

1. Hump, skull, and paws remain separable in `Neutral Studio`.
2. `Primary Attack` reads as a swipe before hit effects appear.
3. `Secondary Attack` reads as a bite before hit effects appear.
4. `Wireframe` shows distinct shoulder, skull, and snout masses.
5. `Hitboxes` feel aligned to the mouth and front paw attack space.

## Implementation
- Procedural recipe: [bearAssetDesign.ts](/Users/kasznarandras/Code/primal-combat/src/entities/design/bearAssetDesign.ts)
- Mesh builder: [Bear.ts](/Users/kasznarandras/Code/primal-combat/src/entities/Bear.ts)
- Review surface: [AssetLab.ts](/Users/kasznarandras/Code/primal-combat/src/asset-lab/AssetLab.ts)
