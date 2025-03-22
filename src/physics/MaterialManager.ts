// src/physics/MaterialManager.ts
import * as CANNON from 'cannon-es';

// Create and export shared Cannon materials.
export const characterMaterial = new CANNON.Material('characterMaterial');
export const staticMaterial = new CANNON.Material('staticMaterial');
