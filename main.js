import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { setupScene } from './sceneSetup.js';
import { createRoads } from './road.js';
import { setupEnvironment } from './environment.js';
import { setupCarControls, handleCollisions, updateEngineSound } from './carController.js';
import { loadCustomModels } from './loadModels.js';
import { loadEngineSounds } from './audioLoader.js';

// --- INITIALIZE ---
const { scene, camera, renderer, css2DRenderer, controls, listener } = setupScene();

// --- STATE ENTITIES ---
const breakableTrees = [];
const breakableSigns = [];
const houses = [];
const debrisPieces = [];
let carGroup, wheelMeshes = [];
let carSpeed = 0;
let brokenTreeCount = 0;
let idleSound, accelSound, decelSound;
let currentState = 'idle';
let userInteracted = false;
let musicPlaying = false;

// --- DOM ELEMENTS ---
const introOverlay = document.getElementById('intro-overlay');
const music = document.getElementById('bg-music');
const musicBtn = document.getElementById('music-toggle');
const scoreElement = document.getElementById('break-score');

// --- HIDE INTRO ---
setTimeout(() => {
    if (introOverlay.style.opacity !== '0') {
        introOverlay.style.opacity = '0';
        setTimeout(() => introOverlay.style.display = 'none', 1800);
    }
}, 4000);

window.addEventListener('keydown', () => {
    if (introOverlay.style.opacity !== '0') {
        introOverlay.style.opacity = '0';
        setTimeout(() => introOverlay.style.display = 'none', 1800);
    }
    if (!musicPlaying && introOverlay.style.opacity === '0') {
        music.play().catch(e => {});
        userInteracted = true;
        musicPlaying = true;
        musicBtn.textContent = '🎵 indie (on)';
    }
}, { once: true });

// --- MUSIC ---
music.volume = 0.6;
musicBtn.addEventListener('click', () => {
    if (musicPlaying) {
        music.pause();
        musicBtn.textContent = '🎵 indie';
    } else {
        music.play().catch(e => {
            console.log('Playback failed:', e);
            musicBtn.textContent = '🎵 error';
        });
        musicBtn.textContent = '🎵 indie (on)';
    }
    musicPlaying = !musicPlaying;
});

// --- GENERATE WORLD ---
const curve = createRoads(scene);
const { ball } = setupEnvironment(scene, curve, breakableTrees, breakableSigns);
loadCustomModels(scene, curve, houses, breakableTrees);

// --- CAR SETUP ---
const input = setupCarControls();
const loader = new GLTFLoader();

loader.load('models/1985_toyota_sprinter_trueno_ae86.glb',
    (gltf) => {
        const carModel = gltf.scene;
        const box = new THREE.Box3().setFromObject(carModel);
        const center = box.getCenter(new THREE.Vector3());
        carModel.position.sub(center);
        const size = box.getSize(new THREE.Vector3()).length();
        const scaleFactor = 4.5 / size;
        carModel.scale.setScalar(scaleFactor);

        carGroup = new THREE.Group();
        carGroup.add(carModel);
        const startPos = curve.getPoint(0.02);
        carGroup.position.copy(startPos);
        carGroup.position.y = 0.2;
        const startTangent = curve.getTangent(0.02);
        carGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), startTangent);
        scene.add(carGroup);

        // Sounds
        const sounds = loadEngineSounds(listener);
        idleSound = sounds.idleSound;
        accelSound = sounds.accelSound;
        decelSound = sounds.decelSound;

        carGroup.add(idleSound);
        carGroup.add(accelSound);
        carGroup.add(decelSound);

        sounds.ready.then(() => {
            if (userInteracted) idleSound.play();
        });

        // Wheel detection
        carModel.traverse((child) => {
            if (child.isMesh) {
                const name = child.name;
                if (name.includes('AE86Ani_Wheel') || name.includes('AE86Ani_Disc')) {
                    if (!name.includes('Door')) wheelMeshes.push(child);
                }
            }
        });
        if (wheelMeshes.length === 0) {
            let count = 0;
            carModel.traverse((child) => {
                if (child.isMesh && count < 4 && !child.name.toLowerCase().includes('body')) {
                    wheelMeshes.push(child);
                    count++;
                }
            });
        }
    },
    undefined,
    (err) => console.error('Error loading car:', err)
);

// --- UPDATE LOOP ---
function updateCar(delta) {
    if (!carGroup) return;
    const acceleration = 12;
    const maxSpeed = 18;
    const friction = 6;
    const turnSpeed = 2.2;

    if (input.throttle) carSpeed += acceleration * delta;
    if (input.brake) carSpeed -= acceleration * delta;
    carSpeed = Math.max(-maxSpeed/2, Math.min(maxSpeed, carSpeed));

    if (!input.throttle && !input.brake) {
        if (carSpeed > 0) carSpeed = Math.max(0, carSpeed - friction * delta);
        else carSpeed = Math.min(0, carSpeed + friction * delta);
    }

    if (input.left) carGroup.rotation.y += turnSpeed * delta * (carSpeed / maxSpeed);
    if (input.right) carGroup.rotation.y -= turnSpeed * delta * (carSpeed / maxSpeed);

    const forward = new THREE.Vector3(0,0,1).applyQuaternion(carGroup.quaternion);
    carGroup.position.add(forward.multiplyScalar(carSpeed * delta));
    carGroup.position.x = Math.max(-100, Math.min(120, carGroup.position.x));
    carGroup.position.z = Math.max(-100, Math.min(120, carGroup.position.z));
    carGroup.position.y = 0.25;

    wheelMeshes.forEach(w => { w.rotation.x -= carSpeed * delta * 2.5; });

    // Collisions
    const physicsResult = handleCollisions(scene, carGroup, carSpeed, breakableTrees, breakableSigns, houses, ball, debrisPieces, scoreElement, brokenTreeCount, delta);
    carSpeed = physicsResult.carSpeed;
    brokenTreeCount = physicsResult.brokenTreeCount;

    // Sounds
    currentState = updateEngineSound(carSpeed, maxSpeed, input, currentState, idleSound, accelSound, decelSound);
}

// --- ANIMATION LOOP ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.1);

    updateCar(delta);

    if (carGroup) {
        controls.target.copy(carGroup.position.clone().add(new THREE.Vector3(0, 1, 0)));
    }
    controls.update();

    // --- Petal animations for breakable trees (Sakura) ---
    if (breakableTrees && breakableTrees.length > 0) {
        breakableTrees.forEach(tree => {
            if (tree.userData.petals && tree.userData.petalVelocities) {
                const petals = tree.userData.petals;
                const velocities = tree.userData.petalVelocities;
                const positions = petals.geometry.attributes.position.array;
                for (let i = 0; i < velocities.length; i++) {
                    positions[i*3] += velocities[i].vx * delta;
                    positions[i*3+1] += velocities[i].vy * delta;
                    positions[i*3+2] += velocities[i].vz * delta;
                    if (positions[i*3+1] < 0) {
                        const radius = 2 + Math.random() * 4;
                        const angle = Math.random() * Math.PI * 2;
                        positions[i*3] = Math.cos(angle) * radius;
                        positions[i*3+1] = 5 + Math.random() * 3;
                        positions[i*3+2] = Math.sin(angle) * radius;
                    }
                }
                petals.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    renderer.render(scene, camera);
    css2DRenderer.render(scene, camera);
}

animate();

// --- RESIZE ---
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    css2DRenderer.setSize(window.innerWidth, window.innerHeight);
});