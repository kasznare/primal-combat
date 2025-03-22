Primal Combat – 3D Fighting Game
Primal Combat is a single-player 3D fighting game built using Three.js, Cannon‑es, and TypeScript. It is developed using Vite for fast development and hot module replacement. This project demonstrates a modular design where important game features (physics, rendering, input, AI, scene management, etc.) are split into separate, manageable modules.

Key Features & Approaches
1. Game Engine and Architecture
Modular Design:
The project is structured into multiple modules:

Game.ts: The central game loop that ties together rendering, physics, input, AI, and game state.

InputManager: Handles keyboard input (supporting both WASD and arrow keys) and converts these into movement vectors.

AIController: Implements enemy behavior (e.g., a chasing bear).

GameStateManager: Manages game states (playing, paused, game over) and handles restarting the game.

ProceduralScene & SceneSelector: Generate and manage dynamic environmental objects (trees, stones, buildings, rocks) that are both visual and physical (with collision bodies), and allow switching between scene themes (Forest, City, Moon).

MaterialManager (Optional): Centralizes shared Cannon‑es materials for consistent physics behavior.

Physics Integration:
Uses Cannon‑es to simulate physics. All dynamic entities (the player and enemies) and procedural scene objects have corresponding physics bodies. Important decisions include:

Keeping objects upright: Bodies have their rotation fixed to prevent rolling.

Low-friction contacts: A contact material is set up with very low friction between dynamic characters and static environmental objects to avoid “sticky” collisions.

2. Character and Entity Management
Entity Properties:
Entities (such as Human, Bear, Cheetah, and Dragon) have realistic properties: dimensions, mass, maximum velocity/acceleration, and health. These properties are defined in a mapping and chosen via dropdowns in a dynamically created menu.

Collision & Damage:
When entities collide, their health decreases based on the relative velocity and mass ratio, with a visible two‑part health bar (red background with a decreasing green foreground).

Chase Mechanics:
Enemies (e.g., a Bear) use simple AI to chase the player character, with movement that’s computed relative to the player’s position.

3. Rendering Enhancements
Improved Renderer Settings:
The WebGLRenderer is created with antialiasing enabled and configured with:

sRGB output encoding.

ACESFilmic tone mapping for realistic color reproduction.

Shadow mapping (using PCFSoftShadowMap) with high‑resolution maps.

Environment Lighting:
Instead of a hardcoded cube texture, an HDRI is loaded via RGBELoader (or via a locally hosted HDRI file) to provide realistic lighting and reflections. This HDRI is set as both the scene’s background and environment map.

Post‑Processing:
An EffectComposer is used to chain several post‑processing passes:

A RenderPass to render the scene.

An FXAA pass (via ShaderPass and FXAAShader) for antialiasing.

An UnrealBloomPass for a subtle bloom effect.

Camera and Controls:
The camera uses OrbitControls for a third‑person view that remains centered on the player. Controls are constrained (no panning, limits on zoom and vertical angles) to keep the gameplay focused.

4. Game Flow and Interaction
Menu and Character Selection:
The game starts with a dynamically generated menu (created in Menu.ts) that provides dropdowns for selecting the player’s character and opponent. A custom event (or a direct listener) then triggers the character setup after the user clicks “Start Battle.”

Pause/Resume Functionality:
The game can be paused with the Escape key and resumed by pressing any other key. The game loop always runs (so that the scene is still rendered and controls are responsive), but physics and game updates are skipped while paused.

Frame Throttling:
The animate loop is throttled to approximately 60fps using timestamps, ensuring consistent performance regardless of hardware.

Final Thoughts
The project is built with flexibility and extensibility in mind. Key decisions, such as splitting functionality into managers and using procedural generation for the environment, allow for incremental improvements without a complete overhaul of the codebase.

As the project evolves, you can update individual modules (for example, refining the AI behavior, adding more realistic materials, or enhancing post‑processing effects) without disrupting the overall architecture.