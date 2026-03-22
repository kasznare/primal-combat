import * as THREE from "three";

export const HUMAN_RIG_NODES = [
  "torso",
  "head",
  "leftArm",
  "rightArm",
  "leftForearm",
  "rightForearm",
  "leftLeg",
  "rightLeg",
  "leftShin",
  "rightShin",
] as const;

export type HumanRigNode = (typeof HUMAN_RIG_NODES)[number];

export const HUMAN_ASSET_DESIGN = {
  version: "1.0.0",
  identity: {
    label: "Baseline Brawler",
    role: "Readable human reference fighter for the whole roster.",
    silhouette: [
      "upright torso with narrow waist and distinct shoulder cap breakup",
      "clear head-neck separation so the gaze line reads at gameplay distance",
      "boot-heavy lower body for grounded stance readability",
      "single accent chest panel so the torso front is obvious in motion",
    ],
  },
  minimumSize: {
    height: 1.7,
    width: 0.48,
    depth: 0.34,
  },
  proportions: {
    upperLegLength: 0.23,
    lowerLegLength: 0.23,
    bootHeight: 0.065,
    torsoHeight: 0.34,
    shoulderSpan: 1.4,
    upperArmLength: 0.17,
    lowerArmLength: 0.15,
    neckHeight: 0.06,
    headRadius: 0.44,
    hipOffset: 0.22,
  },
  materials: {
    hair: 0x2b231e,
    jacket: 0x2c436d,
    undershirt: 0x8fa8c7,
    pants: 0x2b3138,
    boots: 0x191c20,
    detail: 0xc5cbd4,
  },
  rigIntent: {
    primaryAttackLead: "rightArm",
    secondaryAttackLead: "rightLeg",
    blockGuardNodes: ["leftArm", "rightArm", "leftForearm", "rightForearm"],
    locomotionNodes: ["leftArm", "rightArm", "leftLeg", "rightLeg", "leftShin", "rightShin"],
  },
  assetLabChecklist: [
    "head, chest panel, and boots must remain separable in neutral studio lighting",
    "primary attack must read as a right-side punch without relying on hit effects",
    "secondary attack must read as a right-leg kick with clear extension silhouette",
    "wireframe should show layered masses rather than one undifferentiated torso block",
  ],
} as const;

export type HumanMaterialSet = {
  skin: THREE.MeshLambertMaterial;
  hair: THREE.MeshLambertMaterial;
  jacket: THREE.MeshStandardMaterial;
  undershirt: THREE.MeshLambertMaterial;
  pants: THREE.MeshStandardMaterial;
  boots: THREE.MeshStandardMaterial;
  detail: THREE.MeshLambertMaterial;
};

export type ResolvedHumanDimensions = {
  totalHeight: number;
  totalWidth: number;
  totalDepth: number;
  upperLegLength: number;
  lowerLegLength: number;
  bootHeight: number;
  torsoHeight: number;
  shoulderSpan: number;
  upperArmLength: number;
  lowerArmLength: number;
  neckHeight: number;
  headRadius: number;
  hipOffset: number;
};

export function resolveHumanDimensions(dimensions: { width: number; height: number; depth: number }): ResolvedHumanDimensions {
  const totalHeight = Math.max(dimensions.height, HUMAN_ASSET_DESIGN.minimumSize.height);
  const totalWidth = Math.max(dimensions.width, HUMAN_ASSET_DESIGN.minimumSize.width);
  const totalDepth = Math.max(dimensions.depth, HUMAN_ASSET_DESIGN.minimumSize.depth);
  const ratios = HUMAN_ASSET_DESIGN.proportions;

  return {
    totalHeight,
    totalWidth,
    totalDepth,
    upperLegLength: totalHeight * ratios.upperLegLength,
    lowerLegLength: totalHeight * ratios.lowerLegLength,
    bootHeight: totalHeight * ratios.bootHeight,
    torsoHeight: totalHeight * ratios.torsoHeight,
    shoulderSpan: totalWidth * ratios.shoulderSpan,
    upperArmLength: totalHeight * ratios.upperArmLength,
    lowerArmLength: totalHeight * ratios.lowerArmLength,
    neckHeight: totalHeight * ratios.neckHeight,
    headRadius: totalWidth * ratios.headRadius,
    hipOffset: totalWidth * ratios.hipOffset,
  };
}

export function createHumanMaterials(skinColor: number): HumanMaterialSet {
  return {
    skin: new THREE.MeshLambertMaterial({ color: skinColor }),
    hair: new THREE.MeshLambertMaterial({ color: HUMAN_ASSET_DESIGN.materials.hair }),
    jacket: new THREE.MeshStandardMaterial({ color: HUMAN_ASSET_DESIGN.materials.jacket, roughness: 0.9, metalness: 0.05 }),
    undershirt: new THREE.MeshLambertMaterial({ color: HUMAN_ASSET_DESIGN.materials.undershirt }),
    pants: new THREE.MeshStandardMaterial({ color: HUMAN_ASSET_DESIGN.materials.pants, roughness: 0.96 }),
    boots: new THREE.MeshStandardMaterial({ color: HUMAN_ASSET_DESIGN.materials.boots, roughness: 0.95, metalness: 0.05 }),
    detail: new THREE.MeshLambertMaterial({ color: HUMAN_ASSET_DESIGN.materials.detail }),
  };
}
