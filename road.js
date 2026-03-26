import * as THREE from 'three';

export function createRoads(scene) {
    const points = [
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(12, 0.02, 8),
        new THREE.Vector3(25, 0.02, 5),
        new THREE.Vector3(35, 0.02, -5),
        new THREE.Vector3(30, 0.02, -20),
        new THREE.Vector3(15, 0.02, -30),
        new THREE.Vector3(-5, 0.02, -25),
        new THREE.Vector3(-20, 0.02, -10),
        new THREE.Vector3(-15, 0.02, 10),
        new THREE.Vector3(5, 0.02, 20),
        new THREE.Vector3(20, 0.02, 25),
        new THREE.Vector3(30, 0.02, 35),
    ];

    const curve = new THREE.CatmullRomCurve3(points);
    
    const roadWidth = 4.2;
    const roadSegmentLength = 1.8;
    const totalCurveLength = curve.getLength();
    const numSegments = Math.floor(totalCurveLength / roadSegmentLength);
    
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const orangeLineMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const whiteLineMaterial = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });

    for (let i = 0; i < numSegments; i++) {
        const t1 = i / numSegments;
        const t2 = (i + 1) / numSegments;
        const p1 = curve.getPoint(t1);
        const p2 = curve.getPoint(t2);
        const direction = new THREE.Vector3().subVectors(p2, p1);
        const length = direction.length();
        if (length < 0.01) continue;
        const center = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
        const tile = new THREE.Mesh(new THREE.BoxGeometry(roadWidth, 0.1, length + 0.05), roadMaterial);
        tile.position.copy(center); tile.position.y = 0.05;
        tile.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), direction.clone().normalize());
        tile.receiveShadow = true; 
        scene.add(tile);
        
        const centerLine = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, length), orangeLineMaterial);
        centerLine.position.copy(center); centerLine.position.y = 0.06;
        centerLine.quaternion.copy(tile.quaternion);
        scene.add(centerLine);
        
        const perp = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
        if (i % 3 < 2) {
            const leftLine = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.11, length), whiteLineMaterial);
            leftLine.position.copy(center); leftLine.position.y = 0.06;
            leftLine.position.addScaledVector(perp, roadWidth/2 - 0.15);
            leftLine.quaternion.copy(tile.quaternion);
            scene.add(leftLine);
            const rightLine = leftLine.clone();
            rightLine.position.addScaledVector(perp, -roadWidth + 0.3);
            scene.add(rightLine);
        }

        const curbLeft = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.2, length), shoulderMaterial);
        curbLeft.position.copy(center); curbLeft.position.y = 0.1;
        curbLeft.position.addScaledVector(perp, roadWidth/2 + 0.2);
        curbLeft.quaternion.copy(tile.quaternion);
        scene.add(curbLeft);
        const curbRight = curbLeft.clone();
        curbRight.position.addScaledVector(perp, -roadWidth - 0.4);
        scene.add(curbRight);

        if (i % 30 === 15) {
            addVendingMachine(scene, center, perp, roadWidth, tile.quaternion, i);
        }
    }

    addSideRoads(scene, curve, roadWidth);

    return curve;
}

function addVendingMachine(scene, center, perp, roadWidth, quaternion, i) {
    const vmGroup = new THREE.Group();
    const vmColor = (i % 60 === 15) ? 0x0044cc : 0xcc0000;
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.8, 0.7), new THREE.MeshStandardMaterial({ color: vmColor }));
    body.position.y = 0.9;
    vmGroup.add(body);
    const light = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 }));
    light.position.set(0, 1.3, 0.36);
    vmGroup.add(light);
    vmGroup.position.copy(center);
    vmGroup.position.addScaledVector(perp, roadWidth/2 + 0.8);
    vmGroup.quaternion.copy(quaternion);
    scene.add(vmGroup);
}

function addSideRoads(scene, curve, roadWidth) {
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 0.9 });
    const orangeLineMaterial = new THREE.MeshStandardMaterial({ color: 0xffa500 });
    const shoulderMaterial = new THREE.MeshStandardMaterial({ color: 0x555555 });
    const mainRoadHalfWidth = roadWidth / 2;
    const gap = 0.2;

    const tS = 0.4, tE = 0.48, lDist = 20, lWidth = 3.5;
    const pS = curve.getPoint(tS), tanS = curve.getTangent(tS);
    const pE = curve.getPoint(tE), tanE = curve.getTangent(tE);
    const perp1 = new THREE.Vector3(-tanS.z, 0, tanS.x).normalize();
    const perp2 = new THREE.Vector3(-tanE.z, 0, tanE.x).normalize();
    const sLoop = pS.clone().addScaledVector(perp1, mainRoadHalfWidth + gap);
    const eLoop = pE.clone().addScaledVector(perp2, mainRoadHalfWidth + gap);
    const c1 = sLoop.clone().addScaledVector(perp1, lDist), c2 = eLoop.clone().addScaledVector(perp2, lDist);
    const lPoints = [sLoop, sLoop.clone().addScaledVector(perp1, 4), c1, c2, eLoop.clone().addScaledVector(perp2, 4), eLoop];
    const lCurve = new THREE.CatmullRomCurve3(lPoints, false, 'chordal'); 
    const lLen = lCurve.getLength(), lSegments = Math.floor(lLen / 0.8);

    for (let i = 0; i < lSegments; i++) {
        const t1 = i / lSegments, t2 = (i + 1) / lSegments;
        const pt1 = lCurve.getPoint(t1), pt2 = lCurve.getPoint(t2);
        const dir = pt2.clone().sub(pt1), len = dir.length();
        if (len < 0.05) continue;
        const center = pt1.clone().add(pt2).multiplyScalar(0.5);
        const tile = new THREE.Mesh(new THREE.BoxGeometry(lWidth, 0.1, len + 0.1), roadMaterial);
        tile.position.copy(center); tile.position.y = 0.05;
        tile.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1), dir.clone().normalize());
        scene.add(tile);
        if (i % 2 === 0) {
            const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, len * 0.8), orangeLineMaterial);
            stripe.position.copy(center); stripe.position.y = 0.08;
            stripe.quaternion.copy(tile.quaternion);
            scene.add(stripe);
        }
        const p = new THREE.Vector3(-dir.z, 0, dir.x).normalize();
        const curb = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, len), shoulderMaterial);
        curb.position.copy(center); curb.position.y = 0.1;
        curb.position.addScaledVector(p, lWidth/2 + 0.2);
        curb.quaternion.copy(tile.quaternion);
        scene.add(curb);
        const curb2 = curb.clone();
        curb2.position.addScaledVector(p, -lWidth - 0.4);
        scene.add(curb2);
    }
}
