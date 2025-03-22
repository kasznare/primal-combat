import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";

export function setupPostProcessing(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera
): EffectComposer {
  // Create a standard WebGLRenderTarget.
  // For best results, ensure renderer has WebGL2 support.
  const renderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, {
    format: THREE.RGBAFormat,
    encoding: THREE.sRGBEncoding,
  });

  // If WebGL2 is available, enable multisampling:
  if (renderer.capabilities.isWebGL2) {
    // 4 or 8 are common sample values; higher = better quality, more GPU cost.
    renderTarget.samples = 4;
  }

  // Pass the render target to the EffectComposer
  const composer = new EffectComposer(renderer, renderTarget);

  // 1) Render pass
  const renderPass = new RenderPass(scene, camera);
  composer.addPass(renderPass);

  // 2) Optional FXAA pass
  const fxaaPass = new ShaderPass(FXAAShader);
  const pixelRatio = renderer.getPixelRatio();
  fxaaPass.material.uniforms["resolution"].value.x = 1 / (window.innerWidth * pixelRatio);
  fxaaPass.material.uniforms["resolution"].value.y = 1 / (window.innerHeight * pixelRatio);
  composer.addPass(fxaaPass);

  // 3) Optional bloom pass
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.5,  // strength
    0.4,  // radius
    0.85  // threshold
  );
  composer.addPass(bloomPass);

  return composer;
}
