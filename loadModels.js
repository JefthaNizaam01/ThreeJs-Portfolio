// loadModels.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function loadCustomModels(scene, curve, houses, breakableTrees) {
  const loader = new GLTFLoader();

  // --- LOAD TOFU SHOP ---
  loader.load(
    'models/fujiwara_tofu_shop.glb',
    (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 14 / size;
      model.scale.setScalar(scaleFactor);
      model.rotation.y = Math.PI / -1.4;

      const t = 0.015;
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = -2;
      const distance = 2.5;
      const pos = roadPos.clone().addScaledVector(perp, side * distance);
      pos.y = 0.4;
      model.position.copy(pos);

      scene.add(model);
      houses.push(model);
      console.log('Tofu shop loaded');
    },
    undefined,
    (err) => console.error('Error loading tofu shop:', err)
  );

  // --- LOAD CUSTOM TREE ---
  loader.load(
    'models/mystical-x-tree-ii.glb',
    (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 8 / size;
      model.scale.setScalar(scaleFactor);

      const t = 0.55;
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = -1;
      const distance = 8;
      const pos = roadPos.clone().addScaledVector(perp, side * distance);
      pos.y = 0;
      model.position.copy(pos);

      model.rotation.y = Math.random() * Math.PI * 2;

      scene.add(model);
      breakableTrees.push(model);
      console.log('Custom tree loaded');
    },
    undefined,
    (err) => console.error('Error loading tree:', err)
  );

  // --- LOAD OLD JAPANESE STORE ---
  loader.load(
    'models/old_japanese_store.glb',
    (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 10 / size;
      model.scale.setScalar(scaleFactor);
      model.rotation.y = Math.PI / 2;

      const t = 0.6;
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = 1;
      const distance = 18;
      const pos = roadPos.clone().addScaledVector(perp, side * distance);
      pos.y = 0;
      model.position.copy(pos);

      scene.add(model);
      houses.push(model);
      console.log('Additional building loaded');
    },
    undefined,
    (err) => console.error('Error loading other building:', err)
  );

  // --- LOAD CONCRETE BUILDING ---
  loader.load(
    'models/old_concete_building_pack__lowpoly.glb',
    (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 12 / size;
      model.scale.setScalar(scaleFactor);
      model.rotation.y = Math.PI / 2;

      const t = 0.3;
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = 1;
      const distance = 20;
      const pos = roadPos.clone().addScaledVector(perp, side * distance);
      pos.y = 0;
      model.position.copy(pos);

      scene.add(model);
      houses.push(model);
      console.log('Building loaded');
    },
    undefined,
    (err) => console.error('Error loading building:', err)
  );

  // --- LOAD TRADITIONAL JAPANESE HOUSE (NEW) ---
  loader.load(
    'models/japanese-house.glb', // Update with your actual filename
    (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 12 / size; // Adjust as needed
      model.scale.setScalar(scaleFactor);
      model.rotation.y = Math.PI / 2; // Face the road

      const t = 0.2; // Position along the road
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = -1; // Left side
      const distance = 45;
      const pos = roadPos.clone().addScaledVector(perp, side * distance);
      pos.y = 2; // Slight elevation if needed
      model.position.copy(pos);

      scene.add(model);
      houses.push(model);
      console.log('Japanese house loaded');
    },
    undefined,
    (err) => console.error('Error loading Japanese house:', err)
  );

  // --- LOAD THREE-STORY PAGODA (NEW) ---
  loader.load(
    'models/pagoda.glb', // Update with your actual filename
    (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 15 / size; // Pagodas are often tall, adjust
      model.scale.setScalar(scaleFactor);
      model.rotation.y = 0; // As needed

      const t = 0.5; // Midpoint along the road
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = 1; // Right side
      const distance = 25; // Place a bit further back
      const pos = roadPos.clone().addScaledVector(perp, side * distance);
      pos.y = 0.2;
      model.position.copy(pos);

      scene.add(model);
      houses.push(model);
      console.log('Pagoda loaded');
    },
    undefined,
    (err) => console.error('Error loading pagoda:', err)
  );

  // (Optional) If you also want to load the lantern/street props, add another loader here.
  // loader.load('models/street-props.glb', ...)

  // --- LOAD PETROL STATION (commented out) ---
  // ...
}