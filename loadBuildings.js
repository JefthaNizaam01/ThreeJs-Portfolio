import * as THREE from 'three';
import { assetLoader } from './assetLoader.js';

export function loadBuildings(scene, curve, houses, breakableTrees) {
  // --- LOAD TOFU SHOP ---
  assetLoader.load('models/fujiwara_tofu_shop-compressed.glb', (gltf) => {
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
  });

  // --- LOAD SAKURA TREE ---
  assetLoader.load('models/uploads_files_4808737_Old+Tree.glb', (gltf) => {
    const model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
    const size = box.getSize(new THREE.Vector3()).length();
    const scaleFactor = 28 / size;
    model.scale.setScalar(scaleFactor);

    const t = 0.03;
    const roadPos = curve.getPoint(t);
    const tangent = curve.getTangent(t);
    const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
    const side = -1;
    const distance = 18;
    const pos = roadPos.clone().addScaledVector(perp, side * distance);
    pos.y = 0;
    model.position.copy(pos);
    model.rotation.y = Math.random() * Math.PI * 2;

    // Recoloring logic for tree
    model.traverse((child) => {
      if (child.isMesh) {
        const matName = child.material.name ? child.material.name.toLowerCase() : '';
        const isLeaf = matName.includes('leaf') || matName.includes('foliage') || matName.includes('leaves') || matName.includes('flower') || matName.includes('petal') || matName.includes('blossom');
        const isTrunk = matName.includes('trunk') || matName.includes('branch') || matName.includes('bark') || matName.includes('wood');
        if (isLeaf) {
          if (Array.isArray(child.material)) child.material.forEach(m => { if (m.color) m.color.setHex(0xffb7c5); if (m.emissive) m.emissive.setHex(0x331122); });
          else { if (child.material.color) child.material.color.setHex(0xffb7c5); if (child.material.emissive) child.material.emissive.setHex(0x331122); }
        } else if (isTrunk) {
          if (Array.isArray(child.material)) child.material.forEach(m => { if (m.color) m.color.setHex(0x8B5A2B); if (m.emissive) m.emissive.setHex(0x000000); });
          else { if (child.material.color) child.material.color.setHex(0x8B5A2B); if (child.material.emissive) child.material.emissive.setHex(0x000000); }
        }
      }
    });

    scene.add(model);
    breakableTrees.push(model);

    // Falling petals effect initialization (rest of the code stays same)
    const petalCount = 200;
    const petalGeometry = new THREE.BufferGeometry();
    const petalPositions = new Float32Array(petalCount * 3);
    const petalVelocities = [];
    const canvas = document.createElement('canvas');
    canvas.width = 16, canvas.height = 16;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffb7c5'; ctx.beginPath(); ctx.ellipse(8, 8, 6, 4, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ff99aa'; ctx.beginPath(); ctx.ellipse(8, 6, 2, 1, 0, 0, Math.PI * 2); ctx.fill();
    const petalTexture = new THREE.CanvasTexture(canvas);
    const petalMaterial = new THREE.PointsMaterial({ color: 0xffb7c5, size: 0.3, map: petalTexture, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
    const petals = new THREE.Points(petalGeometry, petalMaterial);
    petals.position.copy(model.position); petals.position.y += 2;
    scene.add(petals);
    for (let i = 0; i < petalCount; i++) {
      const r = 2 + Math.random() * 4, a = Math.random() * Math.PI * 2;
      petalPositions[i * 3] = Math.cos(a) * r; petalPositions[i * 3 + 1] = Math.random() * 5; petalPositions[i * 3 + 2] = Math.sin(a) * r;
      petalVelocities.push({ vx: (Math.random() - 0.5) * 0.2, vy: -0.2 - Math.random() * 0.3, vz: (Math.random() - 0.5) * 0.2 });
    }
    petals.geometry.setAttribute('position', new THREE.BufferAttribute(petalPositions, 3));
    model.userData.petals = petals;
    model.userData.petalVelocities = petalVelocities;
    console.log('Sakura tree and petals loaded');
  });

  // --- LOAD OTHER BUILDINGS ---
  const buildings = [
    { url: 'models/old_japanese_store.glb', t: 0.65, scale: 11, rot: Math.PI / -1.6, side: 0.96, dist: -64 },
    { url: 'models/japanese_restaurant.glb', t: 1.48, scale: 10, rot: Math.PI / -3.5, side: 0.38, dist: -17 },
    { url: 'models/lowpoly_gas_station.glb', t: 1.8, scale: 24, rot: -1.8, side: 1, dist: -86, y: 0 }
  ];

  buildings.forEach(b => {
    assetLoader.load(b.url, (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      model.scale.setScalar(b.scale / size);
      model.rotation.y = b.rot;

      const roadPos = curve.getPoint(b.t);
      const tan = curve.getTangent(b.t);
      const perp = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      const worldPos = roadPos.clone().addScaledVector(perp, b.side * b.dist);
      worldPos.y = b.y || 0;

      model.position.copy(worldPos);

      // --- Create a Rectangular "Natural Tar" Pad for Gas Stations ---
      if (b.url.includes('gas_station')) {
        const padWidth = 31, padDepth = 38;
        const padGeom = new THREE.PlaneGeometry(padWidth, padDepth);
        const padMat = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.95 });
        const pad = new THREE.Mesh(padGeom, padMat);
        pad.rotation.x = -Math.PI / 2;
        pad.rotation.z = b.rot;
        pad.position.copy(worldPos);
        pad.position.y = 0.02;
        pad.receiveShadow = true;
        scene.add(pad);

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            const materials = Array.isArray(child.material) ? child.material : [child.material];
            materials.forEach(mat => {
              if (mat.color) {
                const c = mat.color;
                if (c.r > 0.8 && c.g > 0.8 && c.b > 0.8) {
                  mat.color.setHex(0xdddddd);
                }
              }
            });
          }
        });
      }

      scene.add(model);
      houses.push(model);
    });
  });
}
