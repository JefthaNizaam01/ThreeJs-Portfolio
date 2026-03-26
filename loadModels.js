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

  // --- LOAD SAKURA TREE (with realistic pink leaves & brown trunk) ---
  loader.load(
    'models/uploads_files_4808737_Old+Tree.glb',
    (gltf) => {
      const model = gltf.scene;

      // Center and scale
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 28 / size;
      model.scale.setScalar(scaleFactor);

      // Position behind the tofu shop
      const t = 0.03;
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = -1;
      const distance = 18; // Further from the road than the tofu shop
      const pos = roadPos.clone().addScaledVector(perp, side * distance);
      pos.y = 0;
      model.position.copy(pos);

      model.rotation.y = Math.random() * Math.PI * 2;

      // --- Intelligent recoloring: pink for leaves, brown for trunk ---
      model.traverse((child) => {
        if (child.isMesh) {
          // Log material names to help you identify them
          if (Array.isArray(child.material)) {
            child.material.forEach(mat => console.log('Material name:', mat.name));
          } else {
            console.log('Material name:', child.material.name);
          }

          // Determine if this mesh is part of leaves or trunk based on material name
          const materialName = child.material.name ? child.material.name.toLowerCase() : '';

          const isLeaf = materialName.includes('leaf') || materialName.includes('foliage') ||
            materialName.includes('leaves') || materialName.includes('flower') ||
            materialName.includes('petal') || materialName.includes('blossom');
          const isTrunk = materialName.includes('trunk') || materialName.includes('branch') ||
            materialName.includes('bark') || materialName.includes('wood');

          if (isLeaf) {
            // Apply soft pink
            const softPink = 0xffb7c5;
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.color) mat.color.setHex(softPink);
                if (mat.emissive) mat.emissive.setHex(0x331122);
              });
            } else {
              if (child.material.color) child.material.color.setHex(softPink);
              if (child.material.emissive) child.material.emissive.setHex(0x331122);
            }
          } else if (isTrunk) {
            // Apply realistic brown
            const brown = 0x8B5A2B;
            if (Array.isArray(child.material)) {
              child.material.forEach(mat => {
                if (mat.color) mat.color.setHex(brown);
                if (mat.emissive) mat.emissive.setHex(0x000000);
              });
            } else {
              if (child.material.color) child.material.color.setHex(brown);
              if (child.material.emissive) child.material.emissive.setHex(0x000000);
            }
          }
          // For other materials (e.g., ground, shadows) we leave them unchanged
        }
      });

      scene.add(model);
      breakableTrees.push(model);

      // --- Create falling petals effect (same as before) ---
      const petalCount = 200;
      const petalGeometry = new THREE.BufferGeometry();
      const petalPositions = new Float32Array(petalCount * 3);
      const petalVelocities = [];

      const canvas = document.createElement('canvas');
      canvas.width = 16;
      canvas.height = 16;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffb7c5';
      ctx.beginPath();
      ctx.ellipse(8, 8, 6, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff99aa';
      ctx.beginPath();
      ctx.ellipse(8, 6, 2, 1, 0, 0, Math.PI * 2);
      ctx.fill();
      const petalTexture = new THREE.CanvasTexture(canvas);

      const petalMaterial = new THREE.PointsMaterial({
        color: 0xffb7c5,
        size: 0.3,
        map: petalTexture,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending
      });

      const petals = new THREE.Points(petalGeometry, petalMaterial);
      petals.position.copy(model.position);
      petals.position.y += 2;
      scene.add(petals);

      for (let i = 0; i < petalCount; i++) {
        const radius = 2 + Math.random() * 4;
        const angle = Math.random() * Math.PI * 2;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.random() * 5;
        petalPositions[i * 3] = x;
        petalPositions[i * 3 + 1] = y;
        petalPositions[i * 3 + 2] = z;
        petalVelocities.push({
          vx: (Math.random() - 0.5) * 0.2,
          vy: -0.2 - Math.random() * 0.3,
          vz: (Math.random() - 0.5) * 0.2
        });
      }
      petals.geometry.setAttribute('position', new THREE.BufferAttribute(petalPositions, 3));

      model.userData.petals = petals;
      model.userData.petalVelocities = petalVelocities;

      console.log('Sakura tree loaded with realistic colors and falling petals');
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
      const scaleFactor = 11 / size;
      model.scale.setScalar(scaleFactor);
      model.rotation.y = Math.PI / -1.6;

      const t = 0.65;
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = 0.96;
      const distance = -64;
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


  // // --- LOAD Modern JAPANESE STORE ---
  // loader.load(
  //   'models/japanese_store.glb',
  //   (gltf) => {
  //     const model = gltf.scene;

  //     const box = new THREE.Box3().setFromObject(model);
  //     const center = box.getCenter(new THREE.Vector3());
  //     model.position.sub(center);
  //     const size = box.getSize(new THREE.Vector3()).length();
  //     const scaleFactor = 10 / size;
  //     model.scale.setScalar(scaleFactor);
  //     model.rotation.y = Math.PI / -1.6;

  //     const t = 0.85;
  //     const roadPos = curve.getPoint(t);
  //     const tangent = curve.getTangent(t);
  //     const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
  //     const side = 0.76;
  //     const distance = -54;
  //     const pos = roadPos.clone().addScaledVector(perp, side * distance);
  //     pos.y = 0;
  //     model.position.copy(pos);

  //     scene.add(model);
  //     houses.push(model);
  //     console.log('Additional building loaded');
  //   },
  //   undefined,
  //   (err) => console.error('Error loading other building:', err)
  // );
  // --- LOAD Modern JAPANESE Restaurant ---
  loader.load(
    'models/japanese_restaurant.glb',
    (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 10 / size;
      model.scale.setScalar(scaleFactor);
      model.rotation.y = Math.PI / -3.5;

      const t = 1.48;
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = 0.38;
      const distance = -17;
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
  // --- LOAD RX-7 ---
  loader.load(
    'models/mazda_rx7_fd3s/scene.gltf',   // adjust the path/filename to your main .gltf
    (gltf) => {
      const carModel = gltf.scene;

      // Optional: center and scale the model
      const box = new THREE.Box3().setFromObject(carModel);
      const center = box.getCenter(new THREE.Vector3());
      carModel.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 5.5 / size;  // adjust to match your scene scale
      carModel.scale.setScalar(scaleFactor);
      // model.rotation.y = Math.PI / 1;

      // Position it somewhere (e.g., near the road)
      const t = 0.25;  // choose a spot along your main road
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = 1;      // 1 = left, -1 = right (depending on perp direction)
      const distance = 5; // how far from road
      const pos = roadPos.clone().addScaledVector(perp, side * distance);
      pos.y = 0;           // ground level
      carModel.position.copy(pos);
      // --- ADD EXTRA LIGHT FOR GT-R ---
      const carLight = new THREE.PointLight(0xffffff, 10, 50); // intensity 10, range 50
      carLight.position.copy(carModel.position);
      carLight.position.y += 2; // raise slightly above the car
      scene.add(carLight);

      // Optional: add a second light from the front to reduce harsh shadows
      const frontLight = new THREE.PointLight(0xffffff, 5, 30);
      frontLight.position.copy(carModel.position);
      frontLight.position.y += 1.5;
      frontLight.position.z += 3; // move forward relative to car's local orientation
      // Since we haven't rotated the light, this will be in world Z – better to use car's direction.
      // Simpler: just place it in front based on car's rotation:
      const carDir = new THREE.Vector3(0, 0, 1).applyQuaternion(carModel.quaternion);
      frontLight.position.copy(carModel.position.clone().add(carDir.multiplyScalar(3)));
      frontLight.position.y += 1.5;
      scene.add(frontLight);
      // Optional: rotate the car to face the road or any direction
      carModel.rotation.y = Math.PI / 0.75;

      scene.add(carModel);

      // If you want the car to be solid (collide with the player car), add to houses array
      // houses.push(carModel);  // <-- uncomment if you want it as an obstacle

      console.log('RX-7 loaded');
    },
    undefined,
    (err) => console.error('Error loading RX-7:', err)
  );
  // --- LOAD GT-R ---
  loader.load(
    'models/1989_nissan_skyline_gt-r_r32/scene.gltf',   // adjust the path/filename to your main .gltf
    (gltf) => {
      const carModel = gltf.scene;

      // Optional: center and scale the model
      const box = new THREE.Box3().setFromObject(carModel);
      const center = box.getCenter(new THREE.Vector3());
      carModel.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 5.5 / size;  // adjust to match your scene scale
      carModel.scale.setScalar(scaleFactor);
      // model.rotation.y = Math.PI / 1;

      // Position it somewhere (e.g., near the road)
      const t = 0.23;  // choose a spot along your main road
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = 1;      // 1 = left, -1 = right (depending on perp direction)
      const distance = 5; // how far from road
      const pos = roadPos.clone().addScaledVector(perp, side * distance);
      pos.y = 0;           // ground level
      carModel.position.copy(pos);
      // --- ADD EXTRA LIGHT FOR GT-R ---
      const carLight = new THREE.PointLight(0xffffff, 10, 50); // intensity 10, range 50
      carLight.position.copy(carModel.position);
      carLight.position.y += 2; // raise slightly above the car
      scene.add(carLight);

      // Optional: add a second light from the front to reduce harsh shadows
      const frontLight = new THREE.PointLight(0xffffff, 5, 30);
      frontLight.position.copy(carModel.position);
      frontLight.position.y += 1.5;
      frontLight.position.z += 3; // move forward relative to car's local orientation
      // Since we haven't rotated the light, this will be in world Z – better to use car's direction.
      // Simpler: just place it in front based on car's rotation:
      const carDir = new THREE.Vector3(0, 0, 1).applyQuaternion(carModel.quaternion);
      frontLight.position.copy(carModel.position.clone().add(carDir.multiplyScalar(3)));
      frontLight.position.y += 1.5;
      scene.add(frontLight);
      // Optional: rotate the car to face the road or any direction
      carModel.rotation.y = Math.PI / 0.75;

      scene.add(carModel);

      // If you want the car to be solid (collide with the player car), add to houses array
      // houses.push(carModel);  // <-- uncomment if you want it as an obstacle

      console.log('GT-R loaded');
    },
    undefined,
    (err) => console.error('Error loading GT-R:', err)
  );

  // --- LOAD Subaru Impreza  ---
  loader.load(
    'models/1998_subaru_impreza_22b_sti/scene.gltf',   // adjust the path/filename to your main .gltf
    (gltf) => {
      const carModel = gltf.scene;

      // Optional: center and scale the model
      const box = new THREE.Box3().setFromObject(carModel);
      const center = box.getCenter(new THREE.Vector3());
      carModel.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      const scaleFactor = 5.5 / size;  // adjust to match your scene scale
      carModel.scale.setScalar(scaleFactor);
      // model.rotation.y = Math.PI / 1;

      // Position it somewhere (e.g., near the road)
      const t = 0.35;  // choose a spot along your main road
      const roadPos = curve.getPoint(t);
      const tangent = curve.getTangent(t);
      const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const side = 1;      // 1 = left, -1 = right (depending on perp direction)
      const distance = 5; // how far from road
      const pos = roadPos.clone().addScaledVector(perp, side * distance);
      pos.y = 0;           // ground level
      carModel.position.copy(pos);
      // --- ADD EXTRA LIGHT FOR GT-R ---
      const carLight = new THREE.PointLight(0xffffff, 10, 50); // intensity 10, range 50
      carLight.position.copy(carModel.position);
      carLight.position.y += 2; // raise slightly above the car
      scene.add(carLight);

      // Optional: add a second light from the front to reduce harsh shadows
      const frontLight = new THREE.PointLight(0xffffff, 5, 30);
      frontLight.position.copy(carModel.position);
      frontLight.position.y += 1.5;
      frontLight.position.z += 3; // move forward relative to car's local orientation
      // Since we haven't rotated the light, this will be in world Z – better to use car's direction.
      // Simpler: just place it in front based on car's rotation:
      const carDir = new THREE.Vector3(0, 0, 1).applyQuaternion(carModel.quaternion);
      frontLight.position.copy(carModel.position.clone().add(carDir.multiplyScalar(3)));
      frontLight.position.y += 1.5;
      scene.add(frontLight);
      // Optional: rotate the car to face the road or any direction
      carModel.rotation.y = Math.PI / 0.58;

      scene.add(carModel);

      // If you want the car to be solid (collide with the player car), add to houses array
      // houses.push(carModel);  // <-- uncomment if you want it as an obstacle

      console.log('Subaru Impreza loaded');
    },
    undefined,
    (err) => console.error('Error loading Subaru Impreza:', err)
  );
  // --- GRASS PATCH SCATTERING (replace with your actual grass model path) ---
  // loader.load(
  //   'models/realtime_grass/scene.gltf',  // <-- CHANGE THIS TO YOUR GRASS MODEL FILE
  //   (gltf) => {
  //     const originalGrass = gltf.scene;
  //     // Optionally, you can scale the original grass patch to a baseline size
  //     // (the clones will be scaled randomly later)

  //     const instanceCount = 100;      // number of grass patches
  //     const groundRadius = 280;       // slightly smaller than ground circle (radius 300)
  //     const roadStart = 0.01;         // avoid placing grass too close to start?
  //     // We'll generate random positions within a circle
  //     for (let i = 0; i < instanceCount; i++) {
  //       // Random angle and distance
  //       const angle = Math.random() * Math.PI * 2;
  //       const radius = Math.sqrt(Math.random()) * groundRadius; // more density towards center
  //       const x = Math.cos(angle) * radius;
  //       const z = Math.sin(angle) * radius;

  //       // Optional: skip positions very close to the road curve (simple check)
  //       // You can compute the distance to the curve if you want, but it's not necessary

  //       // Clone the grass
  //       const grass = originalGrass.clone();

  //       // Position
  //       grass.position.set(x, 0, z);

  //       // Random scale (0.5 to 1.8)
  //       const scale = 0.6 + Math.random() * 1.2;
  //       grass.scale.set(scale, scale, scale);

  //       // Random rotation
  //       grass.rotation.y = Math.random() * Math.PI * 2;

  //       scene.add(grass);
  //     }
  //     console.log('Grass patches scattered');
  //   },
  //   undefined,
  //   (err) => console.error('Error loading grass model:', err)
  // );

  // (Optional) If you also want to load the lantern/street props, add another loader here.
  // loader.load('models/street-props.glb', ...)

  // --- LOAD PETROL STATION (commented out) ---
  // ...
}