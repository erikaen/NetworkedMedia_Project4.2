import * as THREE from 'https://cdn.skypack.dev/three@0.133.0/build/three.module.js';
import { GLTFLoader } from 'https://cdn.skypack.dev/three@0.133.0/examples/jsm/loaders/GLTFLoader.js';
import { EffectComposer } from 'https://cdn.skypack.dev/three@0.133.0/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.skypack.dev/three@0.133.0/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.skypack.dev/three@0.133.0/examples/jsm/postprocessing/UnrealBloomPass.js';

document.addEventListener('DOMContentLoaded', () => {
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 4;

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.zIndex = '-1';
    renderer.setClearColor(0x000000); 

    window.addEventListener('resize', onWindowResize, false);

    function onWindowResize(){
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    // Add lights to the scene
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff);
    directionalLight.position.set(10, 10, 20).normalize();
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xffffff, 5, 1);
    pointLight.position.set(10, 10, 20); // Set the position of the light
    scene.add(pointLight);
    
    // New GLTF model loading
    const loader = new GLTFLoader();
    loader.load('/3dmodel/dragon1.glb', function(gltf) {
        const model = gltf.scene;
        scene.add(model);
        model.scale.set(2.8, 2.8, 2.8);
        model.position.set(0, -1.8, 0);
        model.rotation.set(0, 0, 0);

        function animate() {
            requestAnimationFrame(animate);
            // model.rotation.x += 0.001;
            model.rotation.y += 0.003;
            controls.update(); // Only required if controls.enableDamping = true, or if controls.autoRotate = true
            renderer.render(scene, camera);
        }
        animate();
    }, undefined, function(error) {
        console.error('An error happened:', error);
    });


    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    const clickableObjects = [];
    const markerGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

    const torusKnotScale = 0.6; // Adjust the scale factor for the torus knot
    const markerScale = 0.7; // Adjust the scale factor for the markers

    const torusKnot = new THREE.Mesh(
        new THREE.TorusKnotGeometry(10, 3, 15, 2),
        new THREE.MeshBasicMaterial({ color: 0xffffff, wireframe: true })
    );
    torusKnot.scale.set(torusKnotScale, torusKnotScale, torusKnotScale);
    scene.add(torusKnot);

    function createTextSprite(textArray, position) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 1024; // Set canvas width
        canvas.height = textArray.length * 200; // Adjust height based on the number of text lines
        context.font = 'Bold 80px sans-serif';
        context.fillStyle = 'rgba(255, 255, 255, 1.0)';
        context.textAlign = 'center';
        textArray.forEach((line, index) => {
            const x = canvas.width / 2;
            const y = (index + 1) * 100; // Position each line
            context.fillText(line, x, y);
        });
        const texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(material);
        sprite.position.set(...position);
        sprite.scale.set(5, textArray.length * 1.25, 1.0); // Adjust sprite scale based on the number of lines
    
        return sprite;
    }
    
    
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));

    const bloomPass = new UnrealBloomPass();
    composer.addPass(bloomPass);


    // Define positions and labels for your markers
    const markerDetails = [
        { position: [5, 0, 0], text: ["UPLOAD BLESSINGS","[上传祝福]"], url: '/upload' },
        { position: [-5, 0, 0], text: ["VIEW BLESSINGS","[查看祝福]"], url: '/blessings' }
    ];

    markerDetails.forEach(detail => {
        // Create and add marker
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        marker.position.set(...detail.position);
        marker.scale.set(markerScale, markerScale, markerScale); 
        torusKnot.add(marker); // Add marker directly to the scene
        clickableObjects.push(marker);
        marker.userData = { url: detail.url };

        // Create and add text sprite next to each marker
        const textSpritePosition = [detail.position[0], detail.position[1] + 1.3, detail.position[2] + 1]; // Adjust Y position for visibility
        const textSprite = createTextSprite(detail.text, textSpritePosition);
        torusKnot.add(textSprite);
    });

    window.addEventListener('click', event => {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableObjects, true);
    
        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            if (clickedObject.userData.url) {
                window.location.href = clickedObject.userData.url;
            }
        }
    });    

    function updateCursor() {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableObjects);

        // If the mouse intersects with any clickable object, change cursor to pointer
        if (intersects.length > 0) {
            document.body.style.cursor = 'pointer';
        } else {
            document.body.style.cursor = 'default';
        }
    }

    window.addEventListener('mousemove', event => {
        event.preventDefault();
        // Calculate mouse position in normalized device coordinates
        // (-1 to +1) for both components
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        updateCursor();
    });

    window.addEventListener('click', event => {
        event.preventDefault();
        mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(clickableObjects, true);

        if (intersects.length > 0) {
            const clickedObject = intersects[0].object;
            if (clickedObject.userData.url) {
                window.location.href = clickedObject.userData.url;
            }
        }
    });

    function animate() {
        requestAnimationFrame(animate);
        torusKnot.rotation.x += 0.001;
        torusKnot.rotation.y += 0.001;
        renderer.render(scene, camera);
        composer.render();
    }
    animate();
});
