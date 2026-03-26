import * as THREE from 'three';
import { spawnTreeDebris } from './environment.js';

export function setupCarControls() {
    const input = { throttle: false, brake: false, left: false, right: false };
    
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

    return input;
}

export function handleCollisions(scene, carGroup, carSpeed, breakableTrees, breakableSigns, houses, ball, debrisPieces, scoreElement, brokenTreeCount, delta) {
    if (!carGroup) return { carSpeed, brokenTreeCount };
    const carPos = carGroup.position.clone();
    const carRadius = 1.5;
    const speedMagnitude = Math.abs(carSpeed);

    for (let i = breakableTrees.length - 1; i >= 0; i--) {
        const tree = breakableTrees[i];
        const dist = carPos.distanceTo(tree.position);
        if (dist < carRadius + 1.0) {
            if (speedMagnitude > 3) {
                spawnTreeDebris(scene, tree.position.clone(), debrisPieces);
                scene.remove(tree);
                breakableTrees.splice(i, 1);
                brokenTreeCount++;
                scoreElement.innerText = `🌳 trees smashed: ${brokenTreeCount}`;
            } else {
                carSpeed *= 0.7;
            }
        }
    }

    for (let i = breakableSigns.length - 1; i >= 0; i--) {
        const sign = breakableSigns[i];
        const dist = carPos.distanceTo(sign.group.position);
        if (dist < carRadius + 1.0 && speedMagnitude > 2) {
            for (let j = 0; j < 4; j++) {
                const piece = new THREE.Mesh(new THREE.BoxGeometry(0.2,0.2,0.2), new THREE.MeshStandardMaterial({ color: 0xecf0f1 }));
                piece.position.copy(sign.group.position.clone().add(new THREE.Vector3(
                    (Math.random()-0.5)*1.5, Math.random()*2, (Math.random()-0.5)*1.5
                )));
                piece.userData.velocity = new THREE.Vector3((Math.random()-0.5)*8, Math.random()*6, (Math.random()-0.5)*8);
                piece.castShadow = true;
                scene.add(piece);
                debrisPieces.push(piece);
            }
            scene.remove(sign.group);
            scene.remove(sign.label);
            breakableSigns.splice(i, 1);
        }
    }

    houses.forEach(house => {
        const dist = carPos.distanceTo(house.position);
        if (dist < carRadius + 1.5) {
            const dir = carPos.clone().sub(house.position).normalize();
            carGroup.position.copy(house.position.clone().add(dir.multiplyScalar(carRadius + 1.5)));
            carSpeed = 0;
        }
    });

    const ballPos = ball.position;
    const ballVel = ball.userData.velocity;
    const ballRadius = ball.userData.radius;
    const distToCar = carPos.distanceTo(ballPos);
    if (distToCar < carRadius + ballRadius) {
        const dir = ballPos.clone().sub(carPos).normalize();
        ballVel.copy(dir.multiplyScalar(speedMagnitude * 1.8));
        ballVel.y += 6;
    }
    ballVel.y += ball.userData.gravity * delta;
    ball.position.add(ballVel.clone().multiplyScalar(delta));
    if (ball.position.y < ballRadius) {
        ball.position.y = ballRadius;
        ballVel.y = Math.abs(ballVel.y) * ball.userData.bounce;
        ballVel.x *= 0.95; ballVel.z *= 0.95;
    }
    if (Math.abs(ball.position.x) > 80) ballVel.x *= -0.5;
    if (Math.abs(ball.position.z) > 80) ballVel.z *= -0.5;

    for (let i = debrisPieces.length - 1; i >= 0; i--) {
        const piece = debrisPieces[i];
        piece.userData.velocity.y += ball.userData.gravity * delta * 0.5;
        piece.position.add(piece.userData.velocity.clone().multiplyScalar(delta));
        if (piece.userData.angularVelocity) {
            piece.rotation.x += piece.userData.angularVelocity.x;
            piece.rotation.y += piece.userData.angularVelocity.y;
            piece.rotation.z += piece.userData.angularVelocity.z;
        }
        if (piece.position.y < -2 || Math.abs(piece.position.x) > 100 || Math.abs(piece.position.z) > 100) {
            scene.remove(piece);
            debrisPieces.splice(i, 1);
        }
    }

    return { carSpeed, brokenTreeCount };
}

export function updateEngineSound(carSpeed, maxSpeed, input, currentState, idleSound, accelSound, decelSound) {
    if (!idleSound || !accelSound || !decelSound) return currentState;

    const speedAbs = Math.abs(carSpeed);
    const speedRatio = Math.min(speedAbs / maxSpeed, 1.0);

    let desiredState = 'idle';
    if (speedAbs > 0.5) {
        if (input.throttle) {
            desiredState = 'accel';
        } else if (input.brake) {
            desiredState = 'decel';
        } else {
            desiredState = speedAbs > 2 ? 'decel' : 'idle';
        }
    } else {
        desiredState = 'idle';
    }

    if (desiredState !== currentState) {
        idleSound.stop();
        accelSound.stop();
        decelSound.stop();
        currentState = desiredState;
        if (currentState === 'idle' && idleSound.buffer) idleSound.play();
        else if (currentState === 'accel' && accelSound.buffer) accelSound.play();
        else if (currentState === 'decel' && decelSound.buffer) decelSound.play();
    }

    if (currentState === 'accel' && accelSound.isPlaying) {
        accelSound.setPlaybackRate(0.8 + speedRatio * 0.8);
    } else if (currentState === 'decel' && decelSound.isPlaying) {
        decelSound.setPlaybackRate(0.8 + speedRatio * 0.4);
    }

    return currentState;
}
