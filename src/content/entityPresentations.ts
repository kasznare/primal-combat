import { Bear } from "../entities/Bear";
import { Bicycle } from "../entities/Bicycle";
import { Cheetah } from "../entities/Cheetah";
import { Dragon } from "../entities/Dragon";
import { GiantFly } from "../entities/GiantFly";
import { Housefly } from "../entities/HouseFly";
import { Human } from "../entities/Human";
import { HumanoidRobot } from "../entities/HumanoidRobot";
import { MallardDuck } from "../entities/MallardDuck";
import { SedanCar } from "../entities/SedanCar";
import { SentientVolcano } from "../entities/SentientVolcano";
import { SportMotorcycle } from "../entities/SportMotorcycle";
import { WalkingPencil } from "../entities/WalkingPencil";
import type { CharacterClass } from "../game/roster/types";

export type EntityPresentation = {
  type: "procedural";
  classRef: CharacterClass;
};

export const ENTITY_PRESENTATIONS: Record<string, EntityPresentation> = {
  Human: { type: "procedural", classRef: Human },
  Bear: { type: "procedural", classRef: Bear },
  MallardDuck: { type: "procedural", classRef: MallardDuck },
  Cheetah: { type: "procedural", classRef: Cheetah },
  Housefly: { type: "procedural", classRef: Housefly },
  SedanCar: { type: "procedural", classRef: SedanCar },
  SportMotorcycle: { type: "procedural", classRef: SportMotorcycle },
  Bicycle: { type: "procedural", classRef: Bicycle },
  GiantFly: { type: "procedural", classRef: GiantFly },
  SentientVolcano: { type: "procedural", classRef: SentientVolcano },
  WalkingPencil: { type: "procedural", classRef: WalkingPencil },
  HumanoidRobot: { type: "procedural", classRef: HumanoidRobot },
  Dragon: { type: "procedural", classRef: Dragon },
};
