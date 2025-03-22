
// Import Cheetah and Dragon similarly.
import * as THREE from 'three';
import { PhysicsEngine } from '../physics/PhysicsEngine';
import { MovementType } from '../entities/Character';
import { Bear } from '../entities/Bear';
import { Human } from '../entities/Human';
import { Cheetah } from '../entities/Cheetah';
import { Housefly } from '../entities/HouseFly';
import { GiantFly } from '../entities/GiantFly';
import { SentientVolcano } from '../entities/SentientVolcano';
import { SportMotorcycle } from '../entities/SportMotorcycle';
import { SedanCar } from '../entities/SedanCar';
import { WalkingPencil } from '../entities/WalkingPencil';
import { MallardDuck } from '../entities/MallardDuck';
import entityData from '../entities/source.json'; // adjust the path as needed

const entityClasses: Record<string, any> = {
  Human,
  Bear,
  Cheetah, 
  Housefly, 
  GiantFly, 
  SentientVolcano,
  SportMotorcycle,
  SedanCar, 
  WalkingPencil,
  MallardDuck
  // Cheetah, Dragon, etc.
};

export function setupCharacters(
  scene: THREE.Scene,
  physicsEngine: PhysicsEngine
): { playerCharacter: any; opponentCharacter: any } {
  const charSelectElem = document.getElementById("character-select") as HTMLSelectElement;
  console.log(charSelectElem?.value, 'Selected value')
  const selectedCharacter = charSelectElem?.value || "Human";
  const OpponentSelectElem = document.getElementById("opponent-select") as HTMLSelectElement;
  console.log(OpponentSelectElem?.value, 'Selected opponent value')

  const selectedOpponent = OpponentSelectElem?.value || "Bear";

  const PlayerClass = entityClasses[selectedCharacter] || Human;
  const OpponentClass = entityClasses[selectedOpponent] || Bear;
  console.log('playerClass', PlayerClass)

   // Find matching JSON data for the selected entities.
   const characterData = entityData.find((entity: any) => entity.name === selectedCharacter);
   const opponentData = entityData.find((entity: any) => entity.name === selectedOpponent);

   // For dimensions, we use the JSON's size_m (you might want to adjust this mapping)
  
   const playerCharacter = new PlayerClass(
    {
      name: characterData?.name || selectedCharacter,
      color: 0xfad6a5, // Adjust as needed or set up a color map.
      weight: characterData?.weight_kg || 70,
      dimensions: characterData
        ? { 
            width: characterData.width_m, 
            height: characterData.height_m, 
            depth: characterData.depth_m 
          }
        : { width: 0.5, height: 1.8, depth: 0.5 },
      maxVelocity: characterData?.max_velocity_m_per_s || 10,
      maxAcceleration: characterData?.max_acceleration_m_per_s2 || 3,
      movementType: MovementType.Grounded,
      health: characterData?.power_score || 100,
    },
    physicsEngine
  );
  
  const opponentCharacter = new OpponentClass(
    {
      name: opponentData?.name || selectedOpponent,
      color: 0x8b4513, // Adjust as needed.
      weight: opponentData?.weight_kg || 350,
      dimensions: opponentData
        ? { 
            width: opponentData.width_m, 
            height: opponentData.height_m, 
            depth: opponentData.depth_m 
          }
        : { width: 1.2, height: 1.0, depth: 2.0 },
      maxVelocity: opponentData?.max_velocity_m_per_s || 15,
      maxAcceleration: opponentData?.max_acceleration_m_per_s2 || 5,
      movementType: MovementType.Grounded,
      health: opponentData?.power_score || 200,
    },
    physicsEngine
  );
  


  // Position, add to scene, etc.
  playerCharacter.body.position.set(0, playerCharacter.dimensions.height, 0);
  opponentCharacter.body.position.set(20, opponentCharacter.dimensions.height, 0);
  scene.add(playerCharacter.mesh);
  scene.add(opponentCharacter.mesh);
  physicsEngine.world.addBody(playerCharacter.body);
  physicsEngine.world.addBody(opponentCharacter.body);

  return { playerCharacter, opponentCharacter };
}
