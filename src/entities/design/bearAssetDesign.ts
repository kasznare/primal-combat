import * as THREE from "three";

export const BEAR_RIG_NODES = [
  "torso",
  "head",
  "jaw",
  "frontLeftLeg",
  "frontRightLeg",
  "rearLeftLeg",
  "rearRightLeg",
] as const;

export type BearRigNode = (typeof BEAR_RIG_NODES)[number];

export const BEAR_ASSET_DESIGN = {
  version: "1.0.0",
  identity: {
    label: "Heavy Predator",
    role: "Readable quadruped bruiser with obvious paw-strike and bite attack silhouettes.",
    silhouette: [
      "broad shoulder mass with a clear hump to push the front-heavy predator profile",
      "forward-set skull and snout so the bite vector reads before contact",
      "thick front legs and lower paws to support swipe readability",
      "compact rear mass and short tail so the attack focus stays in the head and front quarter",
    ],
  },
  minimumSize: {
    length: 2.1,
    height: 1.1,
    width: 1.1,
  },
  proportions: {
    shoulderHeight: 0.8,
    hindMassRadius: 0.36,
    hindMassLength: 0.62,
    shoulderMassRadius: 0.34,
    shoulderMassLength: 0.5,
    humpRadius: 0.42,
    neckRadius: 0.18,
    neckLength: 0.16,
    skullLength: 0.86,
    skullHeight: 0.54,
    skullWidth: 0.62,
    snoutLength: 0.54,
    snoutHeight: 0.28,
    snoutWidth: 0.4,
    frontLegX: 0.32,
    rearLegX: 0.32,
    frontLegZ: 0.3,
    rearLegZ: 0.28,
    upperLegLength: 0.46,
    lowerLegLength: 0.34,
    pawHeight: 0.12,
  },
  materials: {
    darkFur: 0x5a3420,
    nose: 0x151515,
    tooth: 0xe8dec0,
  },
  rigIntent: {
    primaryAttackLead: ["frontRightLeg", "head"],
    secondaryAttackLead: ["head", "jaw"],
    locomotionNodes: ["frontLeftLeg", "frontRightLeg", "rearLeftLeg", "rearRightLeg"],
    guardNodes: ["head", "frontLeftLeg", "frontRightLeg"],
  },
  assetLabChecklist: [
    "hump, skull, and paw masses remain readable in neutral studio lighting",
    "primary attack reads as a front-paw swipe with head commitment",
    "secondary attack reads as a bite with jaw opening and neck drive",
    "wireframe shows layered shoulder, skull, and snout breakup instead of one long body capsule",
  ],
} as const;

export type BearMaterialSet = {
  fur: THREE.MeshStandardMaterial;
  darkFur: THREE.MeshStandardMaterial;
  noseMat: THREE.MeshStandardMaterial;
  toothMat: THREE.MeshLambertMaterial;
};

export type ResolvedBearDimensions = {
  bodyLength: number;
  bodyHeight: number;
  bodyWidth: number;
  shoulderY: number;
  frontLegX: number;
  rearLegX: number;
  frontLegZ: number;
  rearLegZ: number;
  upperLegLength: number;
  lowerLegLength: number;
  pawHeight: number;
};

export function resolveBearDimensions(dimensions: { width: number; height: number; depth: number }): ResolvedBearDimensions {
  const bodyLength = Math.max(dimensions.depth * 0.95, BEAR_ASSET_DESIGN.minimumSize.length);
  const bodyHeight = Math.max(dimensions.height * 0.9, BEAR_ASSET_DESIGN.minimumSize.height);
  const bodyWidth = Math.max(dimensions.width * 0.92, BEAR_ASSET_DESIGN.minimumSize.width);
  const ratios = BEAR_ASSET_DESIGN.proportions;

  return {
    bodyLength,
    bodyHeight,
    bodyWidth,
    shoulderY: bodyHeight * ratios.shoulderHeight,
    frontLegX: bodyLength * ratios.frontLegX,
    rearLegX: bodyLength * ratios.rearLegX,
    frontLegZ: bodyWidth * ratios.frontLegZ,
    rearLegZ: bodyWidth * ratios.rearLegZ,
    upperLegLength: bodyHeight * ratios.upperLegLength,
    lowerLegLength: bodyHeight * ratios.lowerLegLength,
    pawHeight: bodyHeight * ratios.pawHeight,
  };
}

export function createBearMaterials(furColor: number): BearMaterialSet {
  return {
    fur: new THREE.MeshStandardMaterial({ color: furColor, roughness: 0.98, metalness: 0.02 }),
    darkFur: new THREE.MeshStandardMaterial({ color: BEAR_ASSET_DESIGN.materials.darkFur, roughness: 0.98 }),
    noseMat: new THREE.MeshStandardMaterial({ color: BEAR_ASSET_DESIGN.materials.nose, roughness: 0.88, metalness: 0.06 }),
    toothMat: new THREE.MeshLambertMaterial({ color: BEAR_ASSET_DESIGN.materials.tooth }),
  };
}
