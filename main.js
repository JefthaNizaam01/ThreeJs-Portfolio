// main.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.162.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'https://cdn.jsdelivr.net/npm/three@0.162.0/examples/jsm/controls/OrbitControls.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xffffff);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 5, 12);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.08;

// Lights
const dirLight = new THREE.DirectionalLight(0xffffff, 2);
dirLight.position.set(5, 8, 5);
scene.add(dirLight);
scene.add(new THREE.AmbientLight(0xffffff, 1));

// Ground
const ground = new THREE.Mesh(
  new THREE.PlaneGeometry(500, 500),
  new THREE.MeshStandardMaterial({ color: 0xdddddd })
);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Car
let carGroup, wheelMeshes = [];
let carSpeed = 0;

// Input
const input = { throttle:false, brake:false, left:false, right:false };
window.addEventListener('keydown', (e) => {
  if (['w','W','ArrowUp'].includes(e.key)) input.throttle = true;
  if (['s','S','ArrowDown'].includes(e.key)) input.brake = true;
  if (['a','A','ArrowLeft'].includes(e.key)) input.left = true;
  if (['d','D','ArrowRight'].includes(e.key)) input.right = true;
});
window.addEventListener('keyup', (e) => {
  if (['w','W','ArrowUp'].includes(e.key)) input.throttle = false;
  if (['s','S','ArrowDown'].includes(e.key)) input.brake = false;
  if (['a','A','ArrowLeft'].includes(e.key)) input.left = false;
  if (['d','D','ArrowRight'].includes(e.key)) input.right = false;
});

// Load car
const loader = new GLTFLoader();
loader.load('models/1985_toyota_sprinter_trueno_ae86.glb',
  (gltf) => {
    const carModel = gltf.scene;

    // Center & scale
    const box = new THREE.Box3().setFromObject(carModel);
    const center = box.getCenter(new THREE.Vector3());
    carModel.position.sub(center);
    const size = box.getSize(new THREE.Vector3()).length();
    const scaleFactor = 6 / size;
    carModel.scale.setScalar(scaleFactor);

    // Create parent group for movement
    carGroup = new THREE.Group();
    carGroup.add(carModel);
    scene.add(carGroup);

    // Pick wheels
    carModel.traverse((child) => {
      if (child.isMesh && (child.name.toLowerCase().includes('wheel') || child.name.toLowerCase().includes('tyre'))) {
        wheelMeshes.push(child);
      }
    });
    if (wheelMeshes.length === 0) {
      // fallback: pick first 4 meshes
      let count = 0;
      carModel.traverse((child) => {
        if (child.isMesh && count < 4) {
          wheelMeshes.push(child);
          count++;
        }
      });
    }

    console.log('Car loaded');
    console.log('Wheels:', wheelMeshes.map(w => w.name));
  },
  undefined,
  (err) => console.error(err)
);

// Driving with boundaries
function updateCar(delta) {
  if (!carGroup) return;

  const acceleration = 15;
  const maxSpeed = 20;
  const friction = 5;
  const turnSpeed = 2.5;

  if (input.throttle) carSpeed += acceleration * delta;
  if (input.brake) carSpeed -= acceleration * delta;
  carSpeed = Math.max(-maxSpeed/2, Math.min(maxSpeed, carSpeed));

  if (!input.throttle && !input.brake) {
    if (carSpeed > 0) carSpeed = Math.max(0, carSpeed - friction * delta);
    else carSpeed = Math.min(0, carSpeed + friction * delta);
  }

  // Steering
  if (input.left) carGroup.rotation.y += turnSpeed * delta * (carSpeed / maxSpeed);
  if (input.right) carGroup.rotation.y -= turnSpeed * delta * (carSpeed / maxSpeed);

  // Move forward
  const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(carGroup.quaternion);
  carGroup.position.add(forward.multiplyScalar(carSpeed * delta));

  // 🔥 Boundaries
  const minX = -500, maxX = 800;
  const minZ = -500, maxZ = 800;
  carGroup.position.x = Math.max(minX, Math.min(maxX, carGroup.position.x));
  carGroup.position.z = Math.max(minZ, Math.min(maxZ, carGroup.position.z));

  // Rotate wheels
  wheelMeshes.forEach(w => {
    w.rotation.x -= carSpeed * delta * 2;
  });
}

// Animate
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  updateCar(delta);

  controls.update();
  renderer.render(scene, camera);
}

// Resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth/window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();