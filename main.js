//Importamos librerias para visualizacion 3D usando JS
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer, CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import index, { GUI } from 'dat.gui'
//Variables del programa
let scene, camera, renderer, labelRenderer, controls,textureLoader;
let planets = [];
let labels = [];
let planetsObservable = [];
let planetsChar = []; //Planetas caracterizables
let diameter = 6;
const SNR_THRESHOLD = 5;
const snr0 = 100; // Valor base de SNR Telescopio
const charPlanetDropdown = document.getElementById('charPlanetDropdown');

//Llamamos al archivo json que determine los planetas observables
function callingJson(){
  fetch('./output.json')
  .then(response => response.json())
  .then(data => {
      console.log(data);  // Esto te mostrará toda la estructura del archivo JSON
      updateObservable(data);
      console.log("Exoplanetas observables y caracterizables:", planetsChar);
      console.log("Exoplanetas observales: ", planetsObservable);
      // Renderizamos solo los planetas observables
      renderPlanets(planetsChar);
      //renderPlanets(planetsObservable); no lo renderizo ya que al aumentar el diametro puede generar mas planetas.
  })
  .catch(error => console.error('Error al cargar el archivo JSON:', error));
}
//Muestra los planetas al iniciar al iniciar.
callingJson();

//Mostrar valores delimitados por el diametro
document.getElementById('diameterRange').addEventListener('input', function (event) {
  diameter = event.target.value;
  document.getElementById('diameterValue').innerText = diameter;
  console.log("Nuevo diámetro:", diameter);

  callingJson();
})
function updateCharacterizablePlanets() {
  // Vacía el dropdown actual
  charPlanetDropdown.innerHTML = '<option value="">Select Exoplanet</option>';
  
  // Rellena el dropdown con los planetas caracterizables
  planetsChar.forEach((planet, index) => {
      const option = document.createElement('option');
      option.value = index;  // Guardamos el índice para acceder al planeta en el array
      option.textContent = planet.Nombre_planeta;
      charPlanetDropdown.appendChild(option);
  });
}

charPlanetDropdown.addEventListener('change', function(event) {
  const selectedIndex = event.target.value;
  console.log("entre");
  if (selectedIndex !== "") {
      const selectedPlanet = planetsChar[selectedIndex];
      console.log("hola");
      // Busca el planeta en la escena
      const planetMesh = planets.find(p => p.name === selectedPlanet.Nombre_planeta);
      
      if (planetMesh) {
          controls.target.copy(planetMesh.position);
          camera.position.set(
              planetMesh.position.x + 200,
              planetMesh.position.y + 50,
              planetMesh.position.z + 200
          );
      }
  }
});

  function updateObservable(data){
    planetsChar = [];

    data.forEach(planet => {
        const nombrePlaneta = planet.Nombre_planeta;
        const RStar = planet.R; // R* [Rsun]
        const RP = planet.RP; // RP [REarth]
        const PS = planet.PS; // PS [AU]
        const ES = planet.ES; // ES [pc]

        // Cálculo de la SNR para determinar si es observable
        const snr = (snr0 * ((RStar * RP * (diameter / 6)) /((ES / 10) * PS)));

        // Cálculo de la separabilidad para determinar si es caracterizable
        const ES_max = 15 * (diameter / 6) / PS;
        const isCharacterizable = ES <= ES_max;

        if(snr > SNR_THRESHOLD && ES<5){
          planetsObservable.push(planet);
        }
        // Si cumple ambas condiciones, es observable y caracterizable
        if (snr > SNR_THRESHOLD && isCharacterizable && ES < 5) {
            planetsChar.push(planet);
        }

     });
     updateCharacterizablePlanets();
}
  function renderPlanets(planets) {

    planets.forEach((planet, index) => {
        const distance = planet.R * 5000; // Ajustamos la distancia al sol (escala arbitraria)
        const size = planet.RP * 0.5; // Ajustamos el tamaño del planeta

        const angleStep = Math.PI / 5;
        const angle = angleStep * index;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;

        // Aquí puedes asignar una textura genérica o específica si existe (decidimos textura de prueba por el tiempo)
        const texture = textureLoader.load('./image/muestraExoplaneta.png');
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const sphere = new THREE.Mesh(geometry, material);
        
        sphere.position.set(x, 0, z);
        scene.add(sphere);
        addLabel(sphere, planet.Nombre_planeta);
    });
}

function loadTexture(planetName) {
  const textures = {
      "Sun": './image/sun.jpg',
      "Mercury": '/image/mercury.jpg',
      "Venus": '/image/venus.jpg',
      "Earth": '/image/earth.jpg',
      "Mars": '/image/mars.jpg',
      "Jupiter": '/image/jupiter.jpg',
      "Saturn": '/image/saturn.jpg',
      "Uranus": '/image/uranus.jpg',
      "Neptune": '/image/neptune.jpg'
  };
  return textureLoader.load(textures[planetName]);
}
// Crea las orbitas para cada respectivo planeta
function createOrbit(distance) {
  const geometry = new THREE.RingGeometry(distance, distance + 0.1, 64);
  const material = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
  const orbit = new THREE.Mesh(geometry, material);
  orbit.rotation.x = Math.PI / 2; // Orienta la órbita horizontalmente
  return orbit;
}

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 10, 10000);
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    textureLoader = new THREE.TextureLoader();
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
    const Suntexture = loadTexture("Sun");
    const sunGeometry = new THREE.SphereGeometry(20, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({map:Suntexture});
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);
    addLabel(sun, "Sun");

    // Add planets
    const scaleFactor = 0.1; // Factor de escala para reducir las distancias en caso tal de escalarlo, color en caso tal de no tener texturas
    const planetData = [
        {name: "Mercury", color: 0xC0C0C0, size: 3.2, distance: 28},
        {name: "Venus", color: 0xFFA500, size: 5.8, distance: 44},
        {name: "Earth", color: 0x0000FF, size: 6, distance: 62},
        {name: "Mars", color: 0xFF0000, size: 4, distance: 78},
        {name: "Jupiter", color: 0xFFA07A, size: 12, distance: 100},
        {name: "Saturn", color: 0xFFD700, size: 10, distance: 138},
        {name: "Uranus", color: 0x00CED1, size: 7, distance: 176},
        {name: "Neptune", color: 0x4169E1, size: 7, distance: 200}      
    ];

    planetData.forEach((planet,index) => {
      
      const orbit = createOrbit(planet.distance); // Crea la órbita
      scene.add(orbit); // Añade la órbita a la escena
      
      const angleStep = Math.PI / 5; // Ajusta este valor para espaciar más o menos
      const angle = angleStep * index; // Aumenta el ángulo con el índice
      const x = Math.cos(angle) * planet.distance // Calcula la posición en x
      const z = Math.sin(angle) * planet.distance // Calcula la posición en z
     
      const texture = loadTexture(planet.name);
      const material = new THREE.MeshBasicMaterial({ map: texture });
      const geometry = new THREE.SphereGeometry(planet.size, 32, 32);
      const sphere = new THREE.Mesh(geometry, material);
      
      sphere.position.set(x, 0, z);
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
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

//Centrar planeta y realizar zoom
window.addEventListener('click', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
        const selectedPlanet = intersects[0].object;
        controls.target.copy(selectedPlanet.position);
        camera.position.set(selectedPlanet.position.x + 50, selectedPlanet.position.y + 50, selectedPlanet.position.z + 50);
    }
});
animate();
