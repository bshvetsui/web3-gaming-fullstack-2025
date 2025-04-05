import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

/**
 * Three.js scene setup utility
 * Used for 3D game environments
 */
export class ThreeGameSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls?: OrbitControls;

  private animationFrameId?: number;
  private updateCallbacks: ((delta: number) => void)[] = [];

  constructor(container: HTMLElement, options: {
    enableControls?: boolean;
    backgroundColor?: number;
    cameraPosition?: [number, number, number];
  } = {}) {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.backgroundColor || 0x000000);

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    const cameraPos = options.cameraPosition || [0, 5, 10];
    this.camera.position.set(...cameraPos);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.appendChild(this.renderer.domElement);

    // Setup controls if enabled
    if (options.enableControls) {
      this.controls = new OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.05;
    }

    // Setup lights
    this.setupLights();

    // Handle window resize
    window.addEventListener('resize', () => this.handleResize(container));
  }

  private setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    this.scene.add(ambientLight);

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    directionalLight.castShadow = true;

    // Configure shadow properties
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 500;

    this.scene.add(directionalLight);
  }

  private handleResize(container: HTMLElement) {
    const width = container.clientWidth;
    const height = container.clientHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
  }

  /**
   * Add a callback to be called on each animation frame
   */
  onUpdate(callback: (delta: number) => void) {
    this.updateCallbacks.push(callback);
  }

  /**
   * Start the animation loop
   */
  start() {
    let lastTime = performance.now();

    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      const currentTime = performance.now();
      const delta = (currentTime - lastTime) / 1000; // Convert to seconds
      lastTime = currentTime;

      // Update controls
      if (this.controls) {
        this.controls.update();
      }

      // Call update callbacks
      this.updateCallbacks.forEach(callback => callback(delta));

      // Render scene
      this.renderer.render(this.scene, this.camera);
    };

    animate();
  }

  /**
   * Stop the animation loop
   */
  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.stop();
    this.renderer.dispose();
    this.scene.clear();

    // Remove event listeners
    window.removeEventListener('resize', () => this.handleResize);
  }
}

/**
 * Create a basic player mesh
 */
export function createPlayerMesh(color: number = 0x00ff00): THREE.Mesh {
  const geometry = new THREE.CapsuleGeometry(0.5, 1, 4, 8);
  const material = new THREE.MeshStandardMaterial({
    color,
    metalness: 0.3,
    roughness: 0.7,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/**
 * Create a simple ground plane
 */
export function createGroundPlane(size: number = 100): THREE.Mesh {
  const geometry = new THREE.PlaneGeometry(size, size);
  const material = new THREE.MeshStandardMaterial({
    color: 0x808080,
    roughness: 0.8,
    metalness: 0.2,
  });

  const ground = new THREE.Mesh(geometry, material);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;

  return ground;
}
