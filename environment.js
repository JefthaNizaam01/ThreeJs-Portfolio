import * as THREE from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export function createPortfolioLabel(title, description, color = '#2a6f97') {
    const div = document.createElement('div');
    div.className = 'label-css';
    div.style.borderLeftColor = color;
    div.innerHTML = `<strong>${title}</strong><small>${description}</small>`;
    return new CSS2DObject(div);
}

export function setupEnvironment(scene, curve, breakableTrees, breakableSigns) {
    const signInfos = [
        { t: 0.02, title: "🚀 WELCOME", desc: "Nizaam's portfolio", color: "#f1c40f" },
        { t: 0.95, title: "🏁 FINISH", desc: "Thanks for exploring!", color: "#f39c12" }
    ];

    signInfos.forEach((item) => {
        const pos = curve.getPoint(item.t);
        const tangent = curve.getTangent(item.t);
        const perp = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
        const side = Math.sin(item.t * Math.PI * 8) > 0 ? 1 : -1;
        const signPos = pos.clone().addScaledVector(perp, side * 3.5);
        signPos.y = 0;
        const sign = createSign(scene, signPos, item.title, item.desc, item.color);
        breakableSigns.push(sign);
    });

    // --- BOUNCY BALL ---
    const ballGeometry = new THREE.SphereGeometry(0.7, 32, 32);
    const ballMaterial = new THREE.MeshStandardMaterial({ color: 0xffaa33, emissive: 0x442200 });
    const ball = new THREE.Mesh(ballGeometry, ballMaterial);
    ball.position.set(10, 1.0, 5);
    ball.castShadow = true; ball.receiveShadow = true;
    scene.add(ball);
    const ballLines = new THREE.LineSegments(new THREE.EdgesGeometry(ballGeometry), new THREE.LineBasicMaterial({ color: 0x000000 }));
    ball.add(ballLines);
    ball.userData.velocity = new THREE.Vector3(0, 0, 0);
    ball.userData.gravity = -9.8;
    ball.userData.bounce = 0.8;
    ball.userData.radius = 0.7;

    return { ball };
}

function createSign(scene, pos, title, desc, color) {
    const group = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.15, 2.5), new THREE.MeshStandardMaterial({ color: 0xaaaaaa }));
    pole.position.y = 1.25; pole.castShadow = true; pole.receiveShadow = true;
    group.add(pole);
    const board = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 0.2), new THREE.MeshStandardMaterial({ color: 0xecf0f1 }));
    board.position.y = 2.0; board.castShadow = true; board.receiveShadow = true;
    group.add(board);
    group.position.copy(pos);
    scene.add(group);
    
    const label = createPortfolioLabel(title, desc, color);
    label.position.copy(pos.clone().add(new THREE.Vector3(0, 2.8, 0)));
    scene.add(label);
    
    return { group, label };
}

export function spawnTreeDebris(scene, pos, debrisPieces) {
    for (let i = 0; i < 4; i++) {
        const log = new THREE.Mesh(
            new THREE.CylinderGeometry(0.2, 0.2, 0.6 + Math.random()*0.4),
            new THREE.MeshStandardMaterial({ color: 0x8B5A2B })
        );
        log.position.copy(pos.clone().add(new THREE.Vector3(
            (Math.random()-0.5)*1.5, 0.5 + Math.random()*1.5, (Math.random()-0.5)*1.5
        )));
        log.userData.velocity = new THREE.Vector3(
            (Math.random()-0.5)*6, Math.random()*5, (Math.random()-0.5)*6
        );
        log.userData.angularVelocity = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.1);
        log.castShadow = true; log.receiveShadow = true;
        scene.add(log);
        debrisPieces.push(log);
    }
    for (let i = 0; i < 6; i++) {
        const leaf = new THREE.Mesh(
            new THREE.BoxGeometry(0.3, 0.2, 0.3),
            new THREE.MeshStandardMaterial({ color: 0x2E7D32 })
        );
        leaf.position.copy(pos.clone().add(new THREE.Vector3(
            (Math.random()-0.5)*2, 1.5 + Math.random()*2, (Math.random()-0.5)*2
        )));
        leaf.userData.velocity = new THREE.Vector3(
            (Math.random()-0.5)*7, Math.random()*6, (Math.random()-0.5)*7
        );
        leaf.userData.angularVelocity = new THREE.Vector3(Math.random(), Math.random(), Math.random()).multiplyScalar(0.2);
        leaf.castShadow = true; leaf.receiveShadow = true;
        scene.add(leaf);
        debrisPieces.push(leaf);
    }
}
