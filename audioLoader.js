// audioLoader.js
import * as THREE from 'three';

export function loadEngineSounds(listener) {
    const audioLoader = new THREE.AudioLoader();
    
    const idleSound = new THREE.PositionalAudio(listener);
    const accelSound = new THREE.PositionalAudio(listener);
    const decelSound = new THREE.PositionalAudio(listener);
    
    // Load all three sounds (they load in parallel)
    const idlePromise = new Promise((resolve) => {
        audioLoader.load('sounds/ae86-idle.mp3', (buffer) => {
            idleSound.setBuffer(buffer);
            idleSound.setLoop(false);
            idleSound.setVolume(1.5);
            idleSound.setRefDistance(5);
            idleSound.setRolloffFactor(2);
            resolve();
        });
    });
    
    const accelPromise = new Promise((resolve) => {
        audioLoader.load('sounds/ae86-accel.mp3', (buffer) => {
            accelSound.setBuffer(buffer);
            accelSound.setLoop(true);
            accelSound.setVolume(0.6);
            accelSound.setRefDistance(5);
            accelSound.setRolloffFactor(2);
            resolve();
        });
    });
    
    const decelPromise = new Promise((resolve) => {
        audioLoader.load('sounds/ae86-downshift.mp3', (buffer) => {
            decelSound.setBuffer(buffer);
            decelSound.setLoop(true);
            decelSound.setVolume(0.9);
            decelSound.setRefDistance(5);
            decelSound.setRolloffFactor(2);
            resolve();
        });
    });
    
    // Return sounds and a promise that resolves when all are loaded
    return {
        idleSound,
        accelSound,
        decelSound,
        ready: Promise.all([idlePromise, accelPromise, decelPromise])
    };
}