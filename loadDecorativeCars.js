import * as THREE from 'three';
import { assetLoader } from './assetLoader.js';

export function loadDecorativeCars(scene, curve) {
  const cars = [
    { url: 'models/mazda_rx7_fd3s/scene.gltf', t: 0.25, rot: Math.PI/0.75, dist: 5, side: 1, scale: 5.5 },
    { url: 'models/1989_nissan_skyline_gt-r_r32/scene.gltf', t: 0.23, rot: Math.PI/0.75, dist: 5, side: 1, scale: 5.5 },
    { url: 'models/1998_subaru_impreza_22b_sti/scene.gltf', t: 0.35, rot: Math.PI/0.58, dist: 5, side: 1, scale: 5.5 },
    { url: 'models/2014_toyota_gt86_zn6/scene.gltf', t: 0.45, rot: Math.PI/0.70, dist: 37, side: 1, scale: 5.5 },
    //  { url: 'models/toyota_corolla_ae86_trueno.glb', t: 0.45, rot: Math.PI/0.70, dist: 34, side: 1, scale: 5.5 },
    { url: 'models/2000_honda_civic_type_r_ek9-compressed.glb', t: 0.465, rot: Math.PI/3.6, dist: 39, side: 1, scale: 5.5 },
    { url: 'models/honda_integra_db8_type-r.glb', t: 0.465, rot: Math.PI/3.6, dist: 42, side: 1, scale: 5.5 },
    { url: 'models/2004_honda_s2000_ap2_eri_version-compressed.glb', t: 0.465, rot: Math.PI/3.6,dist: 45, side: 1, scale: 5.5 }
  ];

  cars.forEach(car => {
    assetLoader.load(car.url, (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const center = box.getCenter(new THREE.Vector3());
      model.position.sub(center);
      const size = box.getSize(new THREE.Vector3()).length();
      model.scale.setScalar(car.scale / size);

      const roadPos = curve.getPoint(car.t);
      const tan = curve.getTangent(car.t);
      const perp = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      model.position.copy(roadPos.clone().addScaledVector(perp, car.side * car.dist));
      model.position.y = 0;
      model.rotation.y = car.rot;

      // Add extra light for decorative cars
      const light = new THREE.PointLight(0xffffff, 10, 50);
      light.position.copy(model.position);
      light.position.y += 2;
      scene.add(light);

      const carDir = new THREE.Vector3(0, 0, 1).applyQuaternion(model.quaternion);
      const frontLight = new THREE.PointLight(0xffffff, 5, 30);
      frontLight.position.copy(model.position.clone().add(carDir.multiplyScalar(3)));
      frontLight.position.y += 1.5;
      scene.add(frontLight);

      scene.add(model);
      console.log('Decorative car loaded:', car.url);
    });
  });
}
