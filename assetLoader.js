import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const manager = new THREE.LoadingManager();
const dracoLoader = new DRACOLoader();
// Standard CDN path for Draco decoder
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');

const gltfLoader = new GLTFLoader(manager);
gltfLoader.setDRACOLoader(dracoLoader);

export const assetLoader = gltfLoader;
export const loadingManager = manager;

// Optional: Global loading progress tracking
manager.onProgress = (url, itemsLoaded, itemsTotal) => {
    const progress = (itemsLoaded / itemsTotal) * 100;
    console.log(`Loading: ${Math.round(progress)}% (${url})`);
    
    // Update UI if needed
    const footer = document.getElementById('intro-footer');
    if (footer) {
        footer.textContent = `loading assets: ${Math.round(progress)}%`;
    }
};

manager.onLoad = () => {
    console.log('All assets loaded!');
    const footer = document.getElementById('intro-footer');
    if (footer) {
        footer.textContent = 'press any key to drive';
    }
};

manager.onError = (url) => {
    console.error('Error loading:', url);
};
