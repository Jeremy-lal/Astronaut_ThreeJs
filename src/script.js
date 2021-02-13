import './style.css'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import * as dat from 'dat.gui'
import { gsap } from 'gsap'


let scrollAmout = window.scrollY;
let scrollSmooth = scrollAmout / 200 - (1 / 2) * Math.PI;
const screenFactor = window.devicePixelRatio;

const raycaster = new THREE.Raycaster();
const mouseVector = new THREE.Vector3();
let selectedObject = null;

/**
 * Base
 */
// Debug
const gui = new dat.GUI()
gui.hide()

// Canvas
const canvas = document.querySelector('canvas.webgl')

/**
 * Loader Manager
 */
const body = document.querySelector('body') 
const loaderElement = document.querySelector('.progress') 
const spaceship = document.querySelector('.spaceship') 
const loadingManager = new THREE.LoadingManager(
    // Loaded
    () =>
    {
        setTimeout(() => {
            gsap.to(overlayMaterial.uniforms.uAlpha, { duration: 3, value: 0 })
            loaderElement.style.opacity = 0
            spaceship.style.opacity = 0
            body.style.overflowY = 'visible'
        }, 500)
    },

    // Progress
    (itemUrl, itemsLoaded, itemsTotal) =>
    {
        loaderElement.style.strokeDashoffset = 100 - (itemsLoaded / itemsTotal) * 100;
    }
)
/**
 * Textures
 */
const texturesLoader = new THREE.TextureLoader(loadingManager)
const background = texturesLoader.load('/textures/moon.jpeg')

// Scene
const scene = new THREE.Scene()
scene.background = background


/**
 * Models
 */

const gltfLoader = new GLTFLoader(loadingManager)
gltfLoader.load(
    '/models/Astronaut/scene.gltf',
    (gltf) => {
        gltf.scene.scale.set(0.06, 0.06, 0.06);
        gltf.scene.position.set(0, (-scrollSmooth / 10) - 6, scrollSmooth / 5 + 1);

        scene.add(gltf.scene)

        window.addEventListener("scroll", () => {
            scrollAmout = window.scrollY;
            scrollSmooth = scrollAmout / 200 - (1 / 2) * Math.PI;

            gltf.scene.rotation.y = (window.scrollY / 630);

            const zPosition = scrollSmooth / 3 + 1;

            if (zPosition <= 10) {
                gltf.scene.position.set(0, (-scrollSmooth / 10) - 6, zPosition);
            }
        });
    }
)

/**
 * Overlay
 */
const overlayGeometry = new THREE.PlaneGeometry(2, 2, 1, 1)
const overlayMaterial = new THREE.ShaderMaterial({
    transparent: true,
    vertexShader: `
        void main()
        {
            gl_Position = vec4(position, 1.0);
        }
    `,
    fragmentShader: `
    uniform float uAlpha;
        void main()
        {
            gl_FragColor = vec4(0.0, 0.0, 0.0, uAlpha);
        }
    `,
    uniforms:
    {
        uAlpha: { value: 1 }
    },
})
const overlay = new THREE.Mesh(overlayGeometry, overlayMaterial)
scene.add(overlay)




/**
 * Thumnails
 */
const distance = 9;
const thumbnailsMesh = [];
const group = new THREE.Group();
scene.add(group);

const thumnailsGeometry = new THREE.PlaneGeometry(3, 1.5, 20, 32);

for (let i = 0; i < 10; i++) {

    const image = new Image();
    image.src = `/textures/thumbnails/thumbnail${i + 1}.jpg`;

    image.onload = function () {
        texture.needsUpdate = true;
    };

    const texture = new THREE.Texture();
    texture.image = image;

    const thumbnailMaterial = new THREE.MeshBasicMaterial({
        opacity: 0.8,
        side: THREE.DoubleSide,
        map: texture
    });
    

    const mesh = new THREE.Mesh(thumnailsGeometry, thumbnailMaterial);
    thumbnailsMesh.push(mesh);
    group.add(mesh);

    mesh.position.set(
        distance * Math.sin((i / 2) * Math.PI - scrollSmooth) * screenFactor,
        5 * ((-i * Math.PI) / 2 + scrollSmooth) * screenFactor,
        distance * Math.cos((i / 2) * Math.PI - scrollSmooth)
    );

    mesh.lookAt(new THREE.Vector3(0, mesh.position.y, 0));
}

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

/**
 * Light
 */
const directionalLIght = new THREE.DirectionalLight('#ffffff', 4.4)
directionalLIght.position.set(0.25, 2, 2)
scene.add(directionalLIght)

gui.add(directionalLIght, 'intensity').min(0).max(10).step(0.001).name('light intensity')
gui.add(directionalLIght.position, 'x').min(-5).max(5).step(0.001).name('light x')
gui.add(directionalLIght.position, 'y').min(-5).max(5).step(0.001).name('light y')
gui.add(directionalLIght.position, 'z').min(-5).max(5).step(0.001).name('light z')

directionalLIght.shadow.camera.far = 15
directionalLIght.shadow.mapSize.set(1024, 1024)
directionalLIght.shadow.normalBias = 0.05

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.z = 14;
scene.add(camera)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true,
    alpha: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
renderer.physicallyCorrectLights = true
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

/**
 * EventListener
 */
document.addEventListener('scroll', onScroll, false);
window.addEventListener('resize', onWindowResize, false);
document.addEventListener('mousemove', onMouseMove, false);

/**
 * Animate
 */

function onScroll() {
    scrollAmout = window.scrollY;
    scrollSmooth = scrollAmout / 250 - (1 / 2) * Math.PI;

    for (let i = 0; i < 10; i++) {
        thumbnailsMesh[i].position.set(
            distance * Math.sin((i / 2) * Math.PI - scrollSmooth) * screenFactor,
            5 * ((-i * Math.PI) / 2 + scrollSmooth) * screenFactor,
            distance * Math.cos((i / 2) * Math.PI - scrollSmooth)
        );

        thumbnailsMesh[i].lookAt(new THREE.Vector3(0, thumbnailsMesh[i].position.y, 0));
        thumbnailsMesh[i].rotateZ(0.5 * Math.pow(Math.abs(Math.sin(i * 0.5 * Math.PI - scrollSmooth)), 2));
    }
}

function onWindowResize() {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
}

function onMouseMove(event) {
    event.preventDefault();
    if (selectedObject) {

        selectedObject.material.opacity = 0.8;
        selectedObject = null;
        
    }
    
    const intersects = getIntersects(event.layerX, event.layerY);
    
    if (intersects.length > 0) {
        
        const res = intersects.filter(function (res) {
            
            return res && res.object;
            
        })[0];
        
        if (res && res.object) {
            
            selectedObject = res.object;
            selectedObject.material.opacity = 1;

        }

    }
}

function getIntersects(x, y) {

    x = (x / window.innerWidth) * 2 - 1;
    y = - (y / window.innerHeight) * 2 + 1;

    mouseVector.set(x, y, 0.5);
    raycaster.setFromCamera(mouseVector, camera);

    return raycaster.intersectObject(group, true);
}

const clock = new THREE.Clock()

const tick = () => {

    const elapstime = clock.getElapsedTime();

    for (let thumbnail of thumbnailsMesh) {
        thumbnail.geometry.vertices.map((v) => {
            const waveX1 = 0.05 * Math.sin(v.x * 3 + elapstime * 1);
            const waveX2 = 0.05 * Math.sin(v.x * 3 + elapstime * 3);
            const waveY1 = 0.05 * Math.sin(v.y * 3 + elapstime * 0.5);

            v.z = waveX1 + waveX2 + waveY1;
        });
        thumbnail.geometry.verticesNeedUpdate = true;
    }

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()