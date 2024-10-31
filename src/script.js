import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls.js';
import GUI from 'lil-gui'

const globeObjects = [];
const globeObjectNames = {
    coffin: 'coffin',
    caldron: 'kessel',
    pumpkin: 'pumpkin',
    witchHat: 'witch_hat',
};
/**
 * Base
 */
// Debug
const gui = new GUI()

const debugObject = {
    color: 0x808080,
    coffin: false,
    caldron: false,
    pumpkin: false,
    witchHat: false,
};

gui.add(debugObject, 'coffin').name('Coffin').onChange(() => {
    toggleGlobeObject(globeObjectNames.coffin);
});

gui.add(debugObject, 'caldron').name('Caldron').onChange(() => {
    toggleGlobeObject(globeObjectNames.caldron);
});

gui.add(debugObject, 'pumpkin').name('Pumpkin').onChange(() => {
    toggleGlobeObject(globeObjectNames.pumpkin);
});

gui.add(debugObject, 'witchHat').name('Witch hat').onChange(() => {
    toggleGlobeObject(globeObjectNames.witchHat);
});

function toggleGlobeObject(objectName) {
    globeObjects.forEach((object) => {
        if (object.name === objectName) {
            object.visible = !object.visible;
        }
    }
    );
}

// Canvas
const canvas = document.querySelector('canvas.webgl')
canvas.castShadow = true;

// Scene
const scene = new THREE.Scene()

// Loader
const loadingManager = new THREE.LoadingManager(
    () => {
        console.log('Loading complete');
        document.querySelector('.loading-text').style.display = 'none';
        document.querySelector('.loading-screen').style.display = 'none';

    },
    (item, loaded, total) => {
    },
    (error) => {
    }
);
const textureLoader = new THREE.TextureLoader(loadingManager);
const gltfLoader = new GLTFLoader(loadingManager);
const rgbeLoader = new RGBELoader(loadingManager);

const stoneNormal = textureLoader.load('/textures/stone/stone-normal.jpg');
const stoneRoughness = textureLoader.load('/textures/stone/stone-rough.jpg');
const stoneDif = textureLoader.load('/textures/stone/stone-diff.jpg');
stoneDif.colorSpace = THREE.SRGBColorSpace;

const slimeDiff = textureLoader.load('/textures/slime/slime-diff.jpeg');
const slimeNormal = textureLoader.load('/textures/slime/slime-normal.jpeg');
slimeDiff.colorSpace = THREE.SRGBColorSpace;

rgbeLoader.load('/textures/night_no_lamp.hdr', (environmentMap) => {
    environmentMap.mapping = THREE.EquirectangularReflectionMapping;

    scene.environment = environmentMap;
})

gltfLoader.load('/models/coffin_norm.glb', (gltf) => {
    gltf.scene.scale.set(0.3, 0.3, 0.3);
    gltf.scene.position.set(0, 0.4, 0);
    const coffin = gltf.scene;
    coffin.visible = false;
    coffin.name = globeObjectNames.coffin;
    globeObjects.push(coffin);
    scene.add(coffin);
});

gltfLoader.load('/models/kessel_norm.glb', (gltf) => {
    gltf.scene.scale.set(0.3, 0.3, 0.3);
    gltf.scene.position.set(0, 0.25, 0);
    const kessel = gltf.scene;
    kessel.visible = false;
    kessel.name = globeObjectNames.caldron;
    globeObjects.push(kessel);
    scene.add(kessel);
});

gltfLoader.load('/models/pumpkin_norm.glb', (gltf) => {
    gltf.scene.scale.set(0.3, 0.3, 0.3);
    gltf.scene.position.set(0, 0.25, 0);
    const pumpkin = gltf.scene;
    pumpkin.visible = false;
    pumpkin.name = globeObjectNames.pumpkin;
    globeObjects.push(pumpkin);
    scene.add(pumpkin);
});

gltfLoader.load('/models/witch_hat_norm.glb', (gltf) => {
    gltf.scene.scale.set(0.3, 0.3, 0.3);
    gltf.scene.position.set(0, 0.25, 0);
    const witchHat = gltf.scene;
    witchHat.visible = false;
    witchHat.name = globeObjectNames.witchHat;
    globeObjects.push(witchHat);
    scene.add(witchHat);    
});

gltfLoader.load('/models/tree.glb', (gltf) => {
    gltf.scene.scale.set(0.6, 0.6, 0.6);
    gltf.scene.position.set(-0.2, 0.25, 0);
    const tree = gltf.scene;
    tree.visible = true;
    tree.name = 'tree';
    scene.add(gltf.scene);
});

/**
 * Raycaster
 */
const raycaster = new THREE.Raycaster();
let currentIntersect = null;

/**
 * Mouse
 */
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / sizes.width) * 2 - 1;
    mouse.y = -(event.clientY / sizes.height) * 2 + 1;
});

window.addEventListener('click', () => {
    if (currentIntersect) {
        console.log(currentIntersect);
        const object = currentIntersect.object.parent;
        if (object.visible) {
            transformControls.attach(object);
            scene.add(transformControls);
        }
    } else {
        transformControls.detach();
    }
});

/**
 * Halloween globe
 */

// Slime particles
const parameters = {};
parameters.count = 200;
parameters.width = 20;
parameters.height = 20;
const slime = [];

const generateSlime = () => {
    const slimeMaterial = new THREE.MeshStandardMaterial({
        transparent: true,
        normalMap: slimeNormal,
        map: slimeDiff,
    });
    for(let i = 0; i < parameters.count; i++) {
        const slimeSphere = new THREE.SphereGeometry(Math.random() * 0.1 + 0.05);
        const velocity = new THREE.Vector3(
            (Math.random() * 6 - 3) * 0.003,
            Math.random() * 0.02 + 0.01,
            (Math.random() * 6 - 3) * 0.003,
        );
        const slimeMesh = new THREE.Mesh(slimeSphere, slimeMaterial);
        slimeMesh.velocity = velocity;
        slimeMesh.position.set(
            (Math.random() - 0.5) * parameters.width,
            5,
            (Math.random() - 0.5) * parameters.height,
        );
        slime.push(slimeMesh);
        scene.add(slimeMesh);
    }
};
// generateSlime();
const resetSlime = () => {
    slime.forEach((slimeMesh) => {
        scene.remove(slimeMesh);
    });
    slime = [];
};

// Add Button to generate slime
gui.add({ generateSlime: generateSlime }, 'generateSlime').name('Generate slime');
gui.add({ resetSlime: resetSlime }, 'resetSlime').name('Reset slime');

// Plattforms
const physicsMaterial = new THREE.MeshPhysicalMaterial({
    envMapIntensity: 0,
    normalMap: stoneNormal,
    normalScale: new THREE.Vector2(0.25, 0.25),
    roughnessMap: stoneRoughness,
    dithering: true,
    map: stoneDif,
    color: debugObject.color,
    roughness: 0.4,
    transmission: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.3,
    metalness: 0.3,
});

const plattformTop = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.5, 32), physicsMaterial);
const plattformBottom = new THREE.Mesh(new THREE.CylinderGeometry(2.1, 2.1, 0.25, 32), physicsMaterial);
plattformBottom.position.y = -0.25;

scene.add(plattformTop, plattformBottom);

// Glas Globe
const globeMaterial = new THREE.MeshPhysicalMaterial({
    roughness: 0,
    metalness: 1,
    // transmission: 1,
    clearcoat: 1,
    clearcoatRoughness: 0.1,
    color: 0x000000,
    dithering: true,
    envMap: scene.environment,
    reflectivity: 1,
    transparent: true,
    opacity: 0.3,
    thickness: 0.1,
    ior: 1.0,
    attenuationDistance: 0.5,             // How far light penetrates
    attenuationColor: new THREE.Color("#854bbe"),  // Attenuation color
    color: new THREE.Color("#5e2ab2"),
    iridescence: 0.9,
});

const globe = new THREE.Mesh(new THREE.SphereGeometry(2, 64, 64), globeMaterial);
globe.position.set(0, 1.2, 0);

scene.add(globe);

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(50, sizes.width / sizes.height, 0.1, 100)
camera.position.set(7, 3, 0)
scene.add(camera)

/**
 * Controls
*/

// Orbit controls
const controls = new OrbitControls(camera, canvas)
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.maxPolarAngle = 1.45;
controls.enableZoom = false;
// controls.enabled = false;

// Transform controls
const transformControls = new TransformControls(camera, canvas);

transformControls.addEventListener('dragging-changed', (event) => {
    controls.enabled = !event.value;
});

window.addEventListener('keydown', (event) => {
    switch (event.key) {
        case 'g':
            transformControls.setMode('translate');
            transformControls.showZ = true;
            transformControls.showX = true;
            break;
        case 'r':
            transformControls.setMode('rotate');
            transformControls.showZ = false;
            transformControls.showY = true;
            transformControls.showX = false;
            break;
        case 's':
            transformControls.setMode('scale');
            transformControls.showZ = true;
            transformControls.showX = true;
            break;
    }
});

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight();

// Sppotlights
const spotLight = new THREE.SpotLight(new THREE.Color(0.15, 0.1, 0.3), 1.5);
spotLight.angle = 0.6;
spotLight.penumbra = 0.5;
spotLight.position.set(5, 5, 0);
spotLight.castShadow = true;
spotLight.shadow.bias = -0.0001;

const spotLight2 = new THREE.SpotLight(new THREE.Color(0.14, 0.5, 1), 2);
spotLight2.angle = 0.6;
spotLight2.penumbra = 0.5;
spotLight2.position.set(-5, 5, 0);
spotLight2.castShadow = true;
spotLight2.shadow.bias = -0.0001;

// Add the spotlight to the scene
scene.add(ambientLight, spotLight, spotLight2);

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true,
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;

/**
 * Animate
 */
const clock = new THREE.Clock()
const tick = () =>
{
    // Raycaster
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(globeObjects);

    if (intersects.length) {
        intersects.forEach((intersect) => {
            if (intersect.object.visible && intersect.object.parent.visible) {
                currentIntersect = intersect;
                return;
            }
        });
    } else {
        currentIntersect = null;
    }

    // Time
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Update slime
    slime.forEach((slimeMesh) => {
        slimeMesh.position.x += slimeMesh.velocity.x;
        slimeMesh.position.y -= slimeMesh.velocity.y;
        slimeMesh.position.z += slimeMesh.velocity.z;
        if (slimeMesh.position.y < -5) {
            slimeMesh.position.set(
                (Math.random() - 0.5) * parameters.width,
                5,
                (Math.random() - 0.5) * parameters.height,
            );
        }
    });

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()