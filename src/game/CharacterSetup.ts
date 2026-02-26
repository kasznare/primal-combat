import * as THREE from "three";
import { PhysicsEngine } from "../physics/PhysicsEngine";
import { Character, ICharacterOptions, MovementType } from "../entities/Character";
import { Bear } from "../entities/Bear";
import { Human } from "../entities/Human";
import { Cheetah } from "../entities/Cheetah";
import { Housefly } from "../entities/HouseFly";
import { GiantFly } from "../entities/GiantFly";
import { SentientVolcano } from "../entities/SentientVolcano";
import { SportMotorcycle } from "../entities/SportMotorcycle";
import { SedanCar } from "../entities/SedanCar";
import { WalkingPencil } from "../entities/WalkingPencil";
import { MallardDuck } from "../entities/MallardDuck";
import { Bicycle } from "../entities/Bicycle";
import entityData from "../entities/source.json";

type CharacterClass = new (...args: any[]) => Character;

type CharacterConfig = {
  key: string;
  label: string;
  classRef: CharacterClass;
  dataName: string;
  presetCtor: boolean;
  fallback: ICharacterOptions;
};

export const AVAILABLE_CHARACTERS: { key: string; label: string }[] = [
  { key: "Human", label: "Human" },
  { key: "Bear", label: "Bear" },
  { key: "MallardDuck", label: "Mallard Duck" },
  { key: "Cheetah", label: "Cheetah" },
  { key: "Housefly", label: "Housefly" },
  { key: "SedanCar", label: "Sedan Car" },
  { key: "SportMotorcycle", label: "Sport Motorcycle" },
  { key: "Bicycle", label: "Bicycle" },
  { key: "GiantFly", label: "Giant Fly" },
  { key: "SentientVolcano", label: "Sentient Volcano" },
  { key: "WalkingPencil", label: "Walking Pencil" },
];

const CHARACTER_CONFIGS: Record<string, CharacterConfig> = {
  Human: {
    key: "Human",
    label: "Human",
    classRef: Human,
    dataName: "Human (Average Adult)",
    presetCtor: false,
    fallback: {
      name: "Human",
      color: 0xfad6a5,
      weight: 70,
      dimensions: { width: 0.5, height: 1.8, depth: 0.5 },
      maxVelocity: 10,
      maxAcceleration: 3,
      movementType: MovementType.Grounded,
      health: 100,
    },
  },
  Bear: {
    key: "Bear",
    label: "Bear",
    classRef: Bear,
    dataName: "Grizzly Bear",
    presetCtor: false,
    fallback: {
      name: "Bear",
      color: 0x8b4513,
      weight: 350,
      dimensions: { width: 1.2, height: 1.0, depth: 2.0 },
      maxVelocity: 15,
      maxAcceleration: 5,
      movementType: MovementType.Grounded,
      health: 200,
    },
  },
  MallardDuck: {
    key: "MallardDuck",
    label: "Mallard Duck",
    classRef: MallardDuck,
    dataName: "Mallard Duck",
    presetCtor: true,
    fallback: {
      name: "Mallard Duck",
      color: 0x668c44,
      weight: 1.2,
      dimensions: { width: 0.5, height: 0.3, depth: 0.6 },
      maxVelocity: 20,
      maxAcceleration: 5,
      movementType: MovementType.Grounded,
      health: 24,
    },
  },
  Cheetah: {
    key: "Cheetah",
    label: "Cheetah",
    classRef: Cheetah,
    dataName: "Cheetah",
    presetCtor: true,
    fallback: {
      name: "Cheetah",
      color: 0xd2b48c,
      weight: 50,
      dimensions: { width: 1.5, height: 1.0, depth: 0.8 },
      maxVelocity: 30,
      maxAcceleration: 9,
      movementType: MovementType.Grounded,
      health: 80,
    },
  },
  Housefly: {
    key: "Housefly",
    label: "Housefly",
    classRef: Housefly,
    dataName: "Housefly",
    presetCtor: true,
    fallback: {
      name: "Housefly",
      color: 0x111111,
      weight: 0.00002,
      dimensions: { width: 0.005, height: 0.005, depth: 0.005 },
      maxVelocity: 2,
      maxAcceleration: 20,
      movementType: MovementType.Grounded,
      health: 1,
    },
  },
  SedanCar: {
    key: "SedanCar",
    label: "Sedan Car",
    classRef: SedanCar,
    dataName: "Sedan Car",
    presetCtor: true,
    fallback: {
      name: "Sedan Car",
      color: 0x0000ff,
      weight: 1500,
      dimensions: { width: 4.5, height: 1.5, depth: 2.0 },
      maxVelocity: 50,
      maxAcceleration: 5,
      movementType: MovementType.Grounded,
      health: 200,
    },
  },
  SportMotorcycle: {
    key: "SportMotorcycle",
    label: "Sport Motorcycle",
    classRef: SportMotorcycle,
    dataName: "Sport Motorcycle",
    presetCtor: true,
    fallback: {
      name: "Sport Motorcycle",
      color: 0xff0000,
      weight: 200,
      dimensions: { width: 2.1, height: 1.0, depth: 1.5 },
      maxVelocity: 75,
      maxAcceleration: 10,
      movementType: MovementType.Grounded,
      health: 100,
    },
  },
  Bicycle: {
    key: "Bicycle",
    label: "Bicycle",
    classRef: Bicycle,
    dataName: "Bicycle",
    presetCtor: true,
    fallback: {
      name: "Bicycle",
      color: 0x00ff00,
      weight: 15,
      dimensions: { width: 1.8, height: 1.0, depth: 1.0 },
      maxVelocity: 15,
      maxAcceleration: 3,
      movementType: MovementType.Grounded,
      health: 50,
    },
  },
  GiantFly: {
    key: "GiantFly",
    label: "Giant Fly",
    classRef: GiantFly,
    dataName: "Giant Fly",
    presetCtor: true,
    fallback: {
      name: "Giant Fly",
      color: 0x88ff88,
      weight: 50,
      dimensions: { width: 1.0, height: 1.0, depth: 1.0 },
      maxVelocity: 15,
      maxAcceleration: 5,
      movementType: MovementType.Grounded,
      health: 150,
    },
  },
  SentientVolcano: {
    key: "SentientVolcano",
    label: "Sentient Volcano",
    classRef: SentientVolcano,
    dataName: "Sentient Volcano",
    presetCtor: true,
    fallback: {
      name: "Sentient Volcano",
      color: 0xff5500,
      weight: 10000,
      dimensions: { width: 8.0, height: 8.0, depth: 8.0 },
      maxVelocity: 2,
      maxAcceleration: 0.5,
      movementType: MovementType.Grounded,
      health: 500,
    },
  },
  WalkingPencil: {
    key: "WalkingPencil",
    label: "Walking Pencil",
    classRef: WalkingPencil,
    dataName: "Walking Pencil",
    presetCtor: true,
    fallback: {
      name: "Walking Pencil",
      color: 0xffdd55,
      weight: 0.01,
      dimensions: { width: 0.19, height: 0.19, depth: 0.19 },
      maxVelocity: 1,
      maxAcceleration: 2,
      movementType: MovementType.Grounded,
      health: 10,
    },
  },
};

export function resolveCharacterKey(value: string | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }
  return CHARACTER_CONFIGS[value] ? value : fallback;
}

function getOptionsFromData(config: CharacterConfig): ICharacterOptions {
  const row = entityData.find((entity: any) => entity.name === config.dataName);
  if (!row) {
    return config.fallback;
  }

  return {
    name: row.name || config.fallback.name,
    color: config.fallback.color,
    weight: row.weight_kg ?? config.fallback.weight,
    dimensions: {
      width: row.width_m ?? config.fallback.dimensions?.width ?? 1,
      height: row.height_m ?? config.fallback.dimensions?.height ?? 1,
      depth: row.depth_m ?? config.fallback.dimensions?.depth ?? 1,
    },
    maxVelocity: row.max_velocity_m_per_s ?? config.fallback.maxVelocity,
    maxAcceleration: row.max_acceleration_m_per_s2 ?? config.fallback.maxAcceleration,
    movementType: config.fallback.movementType,
    health: row.power_score ?? config.fallback.health,
  };
}

function createCharacter(config: CharacterConfig, physicsEngine: PhysicsEngine): Character {
  if (config.presetCtor) {
    return new config.classRef(physicsEngine);
  }
  const options = getOptionsFromData(config);
  return new config.classRef(options, physicsEngine);
}

export function setupCharacters(
  scene: THREE.Scene,
  physicsEngine: PhysicsEngine,
  selectedPlayer?: string,
  selectedOpponent?: string
): { playerCharacter: Character; opponentCharacter: Character } {
  const playerKey = resolveCharacterKey(selectedPlayer, "Human");
  const opponentKey = resolveCharacterKey(selectedOpponent, "Bear");
  const playerConfig = CHARACTER_CONFIGS[playerKey];
  const opponentConfig = CHARACTER_CONFIGS[opponentKey];

  const playerCharacter = createCharacter(playerConfig, physicsEngine);
  const opponentCharacter = createCharacter(opponentConfig, physicsEngine);

  playerCharacter.body.position.set(0, playerCharacter.dimensions.height, 0);
  opponentCharacter.body.position.set(20, opponentCharacter.dimensions.height, 0);
  scene.add(playerCharacter.mesh);
  scene.add(opponentCharacter.mesh);
  physicsEngine.world.addBody(playerCharacter.body);
  physicsEngine.world.addBody(opponentCharacter.body);

  return { playerCharacter, opponentCharacter };
}
