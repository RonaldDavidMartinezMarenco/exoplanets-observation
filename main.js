import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { GUI } from 'dat.gui';

let scene, camera, renderer, labelRenderer, controls;
let planets = [];
let labels = [];

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 10000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add stars
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({color: 0xFFFFFF});

    const starsVertices = [];
    for (let i = 0; i < 10000; i++) {
        const x = THREE.MathUtils.randFloatSpread(2000);
        const y = THREE.MathUtils.randFloatSpread(2000);
        const z = THREE.MathUtils.randFloatSpread(2000);
        starsVertices.push(x, y, z);
    }

    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const starField = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(starField);

    console.log("Adding Sun and planets...");
    const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({color: 0xFFFF00});
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    addLabel(sun, "Sun");

    // Add planets
    const planetData = [
        {name: "Mercury", color: 0xC0C0C0, size: 0.383, distance: 30},
        {name: "Venus", color: 0xFFA500, size: 0.949, distance: 40},
        {name: "Earth", color: 0x0000FF, size: 1, distance: 50},
        {name: "Mars", color: 0xFF0000, size: 0.532, distance: 60},
        {name: "Jupiter", color: 0xFFA07A, size: 11.21, distance: 80},
        {name: "Saturn", color: 0xFFD700, size: 9.45, distance: 110},
        {name: "Uranus", color: 0x00CED1, size: 4, distance: 140},
        {name: "Neptune", color: 0x4169E1, size: 3.88, distance: 170}
    ];

    planetData.forEach(planet => {
      const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
      const material = new THREE.MeshBasicMaterial({
        color: planet.color
      });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.set(planet.distance, 0, 0);
      scene.add(sphere);
      planets.push(sphere);
      addLabel(sphere, planet.name);
    });

    camera.position.z = 100;

    // Add OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.25;
    controls.screenSpacePanning = false;
    controls.maxDistance = 500;
    controls.minDistance = 1;

    // Add CSS2DRenderer for labels
    labelRenderer = new CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0px';
    labelRenderer.domElement.id = 'css-renderer';
    document.body.appendChild(labelRenderer.domElement);

    // Add dat.GUI controls
    const gui = new GUI();
    const cameraFolder = gui.addFolder('Camera');
    cameraFolder.add(camera.position, 'x', 10, 500);
    cameraFolder.add(camera.position, 'y', 10, 500);
    cameraFolder.add(camera.position, 'z', 10, 500);
    cameraFolder.open();

    window.addEventListener('resize', onWindowResize, false);
}

function addLabel(object, name) {
  const labelDiv = document.createElement('div');
  labelDiv.className = 'label';
  labelDiv.textContent = name;
  const label = new CSS2DObject(labelDiv);
  label.position.set(0, object.geometry.parameters.radius + 1, 0);
  object.add(label);
  labels.push(label);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
    labelRenderer.render(scene, camera);
}

init();
animate();