/* ============================================
   HYPNO - Three.js Scene Management
   ============================================ */

import { SCENE_CONFIG, INTENTIONS } from './config.js';
import { isMobile } from './utils.js';

export class CosmicScene {
    constructor(container) {
        this.container = container;
        this.renderer = null;
        this.camera = null;
        this.scene = null;
        this.controls = null;
        this.clock = new THREE.Clock();
        
        this.users = new Map();           // userId -> UserShape
        this.connections = new Map();     // connectionId -> ConnectionThread
        this.connectionManager = null;    // Set by main.js
        
        this.selfId = null;
        this.selfShape = null;
        
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.selectedUser = null;
        
        this.isInitialized = false;
        this.animationId = null;
        
        // Callbacks
        this.onUserClicked = null;
        this.onSelfClicked = null;
        this.onPositionChanged = null;
        
        // Performance optimization
        this.isMobile = isMobile();
        this.particleCount = this.isMobile ? 2000 : 5000;
        
        // Movement controls
        this.moveState = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false
        };
        this.moveSpeed = 50; // Units per second
        this.joystickInput = null; // For mobile joystick
    }
    
    async init() {
        this.initRenderer();
        this.initCamera();
        this.initScene();
        this.initLighting();
        this.initStarfield();
        this.initControls();
        this.initEventListeners();
        
        this.isInitialized = true;
        this.animate();
        
        return this;
    }
    
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: !this.isMobile,
            alpha: true,
            powerPreference: 'high-performance'
        });
        
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x000000, 1);
        this.renderer.sortObjects = true;
        
        this.container.appendChild(this.renderer.domElement);
    }
    
    initCamera() {
        this.camera = new THREE.PerspectiveCamera(
            SCENE_CONFIG.cameraFov,
            window.innerWidth / window.innerHeight,
            SCENE_CONFIG.cameraNear,
            SCENE_CONFIG.cameraFar
        );
        
        this.camera.position.set(0, 0, SCENE_CONFIG.initialCameraZ);
        this.camera.lookAt(0, 0, 0);
    }
    
    initScene() {
        this.scene = new THREE.Scene();
        
        // Add fog for depth
        this.scene.fog = new THREE.Fog(
            SCENE_CONFIG.fogColor,
            SCENE_CONFIG.fogNear,
            SCENE_CONFIG.fogFar
        );
    }
    
    initLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404060, 0.5);
        this.scene.add(ambientLight);
        
        // Main directional light
        const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
        dirLight.position.set(50, 50, 50);
        this.scene.add(dirLight);
        
        // Subtle colored point lights for atmosphere
        const purpleLight = new THREE.PointLight(0x8B5CF6, 0.5, 500);
        purpleLight.position.set(-100, 50, -100);
        this.scene.add(purpleLight);
        
        const blueLight = new THREE.PointLight(0x3B82F6, 0.5, 500);
        blueLight.position.set(100, -50, 100);
        this.scene.add(blueLight);
    }
    
    initStarfield() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);
        const sizes = new Float32Array(this.particleCount);
        
        for (let i = 0; i < this.particleCount; i++) {
            // Position
            positions[i * 3] = (Math.random() - 0.5) * SCENE_CONFIG.starFieldSize;
            positions[i * 3 + 1] = (Math.random() - 0.5) * SCENE_CONFIG.starFieldSize;
            positions[i * 3 + 2] = (Math.random() - 0.5) * SCENE_CONFIG.starFieldSize;
            
            // Color - slight variations for realism
            const colorVariation = 0.8 + Math.random() * 0.2;
            colors[i * 3] = colorVariation;
            colors[i * 3 + 1] = colorVariation;
            colors[i * 3 + 2] = colorVariation + Math.random() * 0.1; // Slight blue tint
            
            // Size
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Create circular star texture
        const starTexture = this.createStarTexture();
        
        const material = new THREE.PointsMaterial({
            size: 1.5,
            map: starTexture,
            vertexColors: true,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true,
            depthWrite: false
        });
        
        this.starfield = new THREE.Points(geometry, material);
        this.scene.add(this.starfield);
    }
    
    createStarTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        
        const ctx = canvas.getContext('2d');
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2;
        
        // Create radial gradient for soft circular star
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.4, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        return texture;
    }
    
    initControls() {
        // Simple orbit controls implementation
        this.controls = {
            target: new THREE.Vector3(0, 0, 0),
            spherical: new THREE.Spherical(SCENE_CONFIG.initialCameraZ, Math.PI / 2, 0),
            isDragging: false,
            lastMouseX: 0,
            lastMouseY: 0,
            autoRotate: true,
            autoRotateSpeed: 0.1
        };
        
        this.updateCameraFromControls();
    }
    
    updateCameraFromControls() {
        const offset = new THREE.Vector3();
        offset.setFromSpherical(this.controls.spherical);
        this.camera.position.copy(this.controls.target).add(offset);
        this.camera.lookAt(this.controls.target);
    }
    
    initEventListeners() {
        // Resize
        window.addEventListener('resize', this.onResize.bind(this));
        
        // Mouse/Touch events for camera control
        this.renderer.domElement.addEventListener('mousedown', this.onPointerDown.bind(this));
        this.renderer.domElement.addEventListener('mousemove', this.onPointerMove.bind(this));
        this.renderer.domElement.addEventListener('mouseup', this.onPointerUp.bind(this));
        this.renderer.domElement.addEventListener('wheel', this.onWheel.bind(this));
        
        // Touch events
        this.renderer.domElement.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.renderer.domElement.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.renderer.domElement.addEventListener('touchend', this.onTouchEnd.bind(this));
        
        // Click for selection
        this.renderer.domElement.addEventListener('click', this.onClick.bind(this));
        
        // Visibility change for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimation();
            } else {
                this.resumeAnimation();
            }
        });
        
        // Keyboard controls for movement
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Mobile joystick
        this.initMobileJoystick();
    }
    
    initMobileJoystick() {
        const joystick = document.getElementById('mobile-joystick');
        const stick = document.getElementById('joystick-stick');
        
        if (!joystick || !stick) return;
        
        let isDragging = false;
        let startX = 0;
        let startY = 0;
        const maxDistance = 35; // Max distance stick can move from center
        
        const handleStart = (e) => {
            e.preventDefault();
            isDragging = true;
            const touch = e.touches ? e.touches[0] : e;
            const rect = joystick.querySelector('.joystick-base').getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
        };
        
        const handleMove = (e) => {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = e.touches ? e.touches[0] : e;
            let deltaX = touch.clientX - startX;
            let deltaY = touch.clientY - startY;
            
            // Clamp to max distance
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            if (distance > maxDistance) {
                deltaX = (deltaX / distance) * maxDistance;
                deltaY = (deltaY / distance) * maxDistance;
            }
            
            // Move the stick
            stick.style.transform = `translate(${deltaX}px, ${deltaY}px)`;
            
            // Calculate normalized movement (-1 to 1)
            const normalizedX = deltaX / maxDistance;
            const normalizedY = deltaY / maxDistance;
            
            // Update move state based on joystick position
            const threshold = 0.3;
            this.moveState.forward = normalizedY < -threshold;
            this.moveState.backward = normalizedY > threshold;
            this.moveState.left = normalizedX < -threshold;
            this.moveState.right = normalizedX > threshold;
            
            // Store joystick values for smooth movement
            this.joystickInput = { x: normalizedX, y: normalizedY };
            
            this.controls.autoRotate = false;
        };
        
        const handleEnd = () => {
            isDragging = false;
            stick.style.transform = 'translate(0, 0)';
            
            // Reset move state
            this.moveState.forward = false;
            this.moveState.backward = false;
            this.moveState.left = false;
            this.moveState.right = false;
            this.joystickInput = null;
        };
        
        // Touch events
        joystick.addEventListener('touchstart', handleStart, { passive: false });
        document.addEventListener('touchmove', handleMove, { passive: false });
        document.addEventListener('touchend', handleEnd);
        document.addEventListener('touchcancel', handleEnd);
        
        // Mouse events for testing on desktop
        joystick.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }
    
    onKeyDown(event) {
        // Ignore if typing in input
        if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveState.forward = true;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveState.backward = true;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveState.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveState.right = true;
                break;
            case 'KeyQ':
            case 'Space':
                this.moveState.up = true;
                break;
            case 'KeyE':
            case 'ShiftLeft':
            case 'ShiftRight':
                this.moveState.down = true;
                break;
        }
        
        // Stop auto-rotate when user is controlling
        if (Object.values(this.moveState).some(v => v)) {
            this.controls.autoRotate = false;
        }
    }
    
    onKeyUp(event) {
        switch (event.code) {
            case 'KeyW':
            case 'ArrowUp':
                this.moveState.forward = false;
                break;
            case 'KeyS':
            case 'ArrowDown':
                this.moveState.backward = false;
                break;
            case 'KeyA':
            case 'ArrowLeft':
                this.moveState.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.moveState.right = false;
                break;
            case 'KeyQ':
            case 'Space':
                this.moveState.up = false;
                break;
            case 'KeyE':
            case 'ShiftLeft':
            case 'ShiftRight':
                this.moveState.down = false;
                break;
        }
    }
    
    updateMovement(delta) {
        if (!this.selfShape) return;
        
        const isMoving = Object.values(this.moveState).some(v => v) || this.joystickInput;
        if (!isMoving) return;
        
        // Get camera direction (ignoring Y for horizontal movement)
        const cameraDirection = new THREE.Vector3();
        this.camera.getWorldDirection(cameraDirection);
        cameraDirection.y = 0;
        cameraDirection.normalize();
        
        // Get right vector
        const rightVector = new THREE.Vector3();
        rightVector.crossVectors(cameraDirection, new THREE.Vector3(0, 1, 0)).normalize();
        
        // Calculate movement
        const movement = new THREE.Vector3();
        const speed = this.moveSpeed * delta;
        
        // Use joystick input for smooth analog movement on mobile
        if (this.joystickInput) {
            // Forward/backward based on joystick Y (inverted)
            movement.add(cameraDirection.clone().multiplyScalar(-this.joystickInput.y * speed));
            // Left/right based on joystick X
            movement.add(rightVector.clone().multiplyScalar(this.joystickInput.x * speed));
        } else {
            // Keyboard input (digital)
            if (this.moveState.forward) {
                movement.add(cameraDirection.clone().multiplyScalar(speed));
            }
            if (this.moveState.backward) {
                movement.add(cameraDirection.clone().multiplyScalar(-speed));
            }
            if (this.moveState.left) {
                movement.add(rightVector.clone().multiplyScalar(-speed));
            }
            if (this.moveState.right) {
                movement.add(rightVector.clone().multiplyScalar(speed));
            }
        }
        
        if (this.moveState.up) {
            movement.y += speed;
        }
        if (this.moveState.down) {
            movement.y -= speed;
        }
        
        // Apply movement to self shape
        const currentPos = this.selfShape.getPosition();
        const newPos = {
            x: currentPos.x + movement.x,
            y: currentPos.y + movement.y,
            z: currentPos.z + movement.z
        };
        
        // Update self shape position
        this.selfShape.group.position.set(newPos.x, newPos.y, newPos.z);
        this.selfShape.data.position = newPos;
        
        // Move camera target to follow
        this.controls.target.set(newPos.x, newPos.y, newPos.z);
        this.updateCameraFromControls();
        
        // Notify position change (throttled in main.js)
        if (this.onPositionChanged) {
            this.onPositionChanged(newPos);
        }
    }
    
    onPointerDown(event) {
        this.controls.isDragging = true;
        this.controls.lastMouseX = event.clientX;
        this.controls.lastMouseY = event.clientY;
        this.controls.autoRotate = false;
    }
    
    onPointerMove(event) {
        if (!this.controls.isDragging) return;
        
        const deltaX = event.clientX - this.controls.lastMouseX;
        const deltaY = event.clientY - this.controls.lastMouseY;
        
        this.controls.spherical.theta -= deltaX * 0.005;
        this.controls.spherical.phi -= deltaY * 0.005;
        
        // Clamp phi to prevent flipping
        this.controls.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.controls.spherical.phi));
        
        this.updateCameraFromControls();
        
        this.controls.lastMouseX = event.clientX;
        this.controls.lastMouseY = event.clientY;
    }
    
    onPointerUp() {
        this.controls.isDragging = false;
    }
    
    onWheel(event) {
        event.preventDefault();
        
        const delta = event.deltaY > 0 ? 1.1 : 0.9;
        this.controls.spherical.radius *= delta;
        
        // Clamp zoom
        this.controls.spherical.radius = Math.max(
            SCENE_CONFIG.minDistance,
            Math.min(SCENE_CONFIG.maxDistance, this.controls.spherical.radius)
        );
        
        this.updateCameraFromControls();
    }
    
    onTouchStart(event) {
        if (event.touches.length === 1) {
            this.controls.isDragging = true;
            this.controls.lastMouseX = event.touches[0].clientX;
            this.controls.lastMouseY = event.touches[0].clientY;
            this.controls.autoRotate = false;
        } else if (event.touches.length === 2) {
            this.controls.pinchDistance = this.getPinchDistance(event.touches);
        }
    }
    
    onTouchMove(event) {
        event.preventDefault();
        
        if (event.touches.length === 1 && this.controls.isDragging) {
            const deltaX = event.touches[0].clientX - this.controls.lastMouseX;
            const deltaY = event.touches[0].clientY - this.controls.lastMouseY;
            
            this.controls.spherical.theta -= deltaX * 0.005;
            this.controls.spherical.phi -= deltaY * 0.005;
            
            this.controls.spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, this.controls.spherical.phi));
            
            this.updateCameraFromControls();
            
            this.controls.lastMouseX = event.touches[0].clientX;
            this.controls.lastMouseY = event.touches[0].clientY;
        } else if (event.touches.length === 2) {
            const newDistance = this.getPinchDistance(event.touches);
            const delta = this.controls.pinchDistance / newDistance;
            
            this.controls.spherical.radius *= delta;
            this.controls.spherical.radius = Math.max(
                SCENE_CONFIG.minDistance,
                Math.min(SCENE_CONFIG.maxDistance, this.controls.spherical.radius)
            );
            
            this.updateCameraFromControls();
            this.controls.pinchDistance = newDistance;
        }
    }
    
    onTouchEnd() {
        this.controls.isDragging = false;
    }
    
    getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    onClick(event) {
        // Calculate mouse position in normalized device coordinates
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        
        this.raycaster.setFromCamera(this.mouse, this.camera);
        
        // Get all user meshes
        const userMeshes = [];
        this.users.forEach((userShape, userId) => {
            if (userShape.group) {
                userShape.group.userData.userId = userId;
                userMeshes.push(userShape.group);
            }
        });
        
        const intersects = this.raycaster.intersectObjects(userMeshes, true);
        
        if (intersects.length > 0) {
            // Find the parent group with userId
            let object = intersects[0].object;
            while (object && !object.userData.userId) {
                object = object.parent;
            }
            
            if (object && object.userData.userId) {
                const userId = object.userData.userId;
                
                if (userId === this.selfId) {
                    if (this.onSelfClicked) {
                        this.onSelfClicked();
                    }
                } else {
                    this.selectedUser = userId;
                    if (this.onUserClicked) {
                        this.onUserClicked(userId);
                    }
                }
            }
        }
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    // User management
    addUser(userId, userData, isSelf = false) {
        // Prevent duplicates
        if (this.users.has(userId)) {
            console.log('🌌 Scene: User already exists, skipping:', userId);
            return this.users.get(userId);
        }
        
        const { UserShape } = window.HypnoClasses;
        const userShape = new UserShape(userId, userData, isSelf, this.scene, this.camera);
        
        this.users.set(userId, userShape);
        
        if (isSelf) {
            this.selfId = userId;
            this.selfShape = userShape;
            this.centerOnUser(userId);
        }
        
        return userShape;
    }
    
    updateUser(userId, userData) {
        const userShape = this.users.get(userId);
        if (userShape) {
            userShape.update(userData);
        }
    }
    
    removeUser(userId) {
        const userShape = this.users.get(userId);
        if (userShape) {
            userShape.fadeOut(() => {
                userShape.dispose();
                this.users.delete(userId);
            });
        }
    }
    
    getUserData(userId) {
        const userShape = this.users.get(userId);
        return userShape ? userShape.data : null;
    }
    
    // Camera controls
    centerOnUser(userId) {
        const userShape = this.users.get(userId);
        if (!userShape) return;
        
        const targetPos = userShape.getPosition();
        
        gsap.to(this.controls.target, {
            x: targetPos.x,
            y: targetPos.y,
            z: targetPos.z,
            duration: 1,
            ease: 'power2.out',
            onUpdate: () => this.updateCameraFromControls()
        });
    }
    
    returnToSelf() {
        if (this.selfId) {
            this.centerOnUser(this.selfId);
        }
    }
    
    // Connection management
    addConnection(fromId, toId) {
        const { ConnectionThread } = window.HypnoClasses;
        const connId = this.getConnectionId(fromId, toId);
        
        if (this.connections.has(connId)) return;
        
        const fromUser = this.users.get(fromId);
        const toUser = this.users.get(toId);
        
        if (!fromUser || !toUser) return;
        
        const thread = new ConnectionThread(
            fromUser,
            toUser,
            fromUser.data.intention,
            this.scene
        );
        
        this.connections.set(connId, thread);
    }
    
    removeConnection(fromId, toId) {
        const connId = this.getConnectionId(fromId, toId);
        const thread = this.connections.get(connId);
        
        if (thread) {
            thread.fadeOut(() => {
                thread.dispose();
                this.connections.delete(connId);
            });
        }
    }
    
    updateConnectionMutuality(fromId, toId, isMutual) {
        const connId = this.getConnectionId(fromId, toId);
        const thread = this.connections.get(connId);
        
        if (thread) {
            thread.setMutual(isMutual);
        }
    }
    
    getConnectionId(id1, id2) {
        return [id1, id2].sort().join('-');
    }
    
    // Animation
    animate() {
        if (!this.isInitialized) return;
        
        this.animationId = requestAnimationFrame(this.animate.bind(this));
        
        const delta = this.clock.getDelta();
        const elapsed = this.clock.getElapsedTime();
        
        // Auto-rotate starfield slowly
        if (this.starfield) {
            this.starfield.rotation.y += 0.0001;
        }
        
        // Auto-rotate camera if enabled
        if (this.controls.autoRotate && !this.controls.isDragging) {
            this.controls.spherical.theta += this.controls.autoRotateSpeed * delta;
            this.updateCameraFromControls();
        }
        
        // Handle user movement (WASD/arrows)
        this.updateMovement(delta);
        
        // Update all user shapes
        this.users.forEach(userShape => {
            userShape.animate(delta, elapsed);
        });
        
        // Update all connections (from connection manager)
        if (this.connectionManager) {
            this.connectionManager.animate(delta, elapsed);
        }
        
        // Also update any scene-level connections
        this.connections.forEach(connection => {
            connection.animate(delta, elapsed);
        });
        
        // Update label orientations to face camera
        this.users.forEach(userShape => {
            if (userShape.label) {
                userShape.label.lookAt(this.camera.position);
            }
        });
        
        this.renderer.render(this.scene, this.camera);
    }
    
    pauseAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    resumeAnimation() {
        if (!this.animationId && this.isInitialized) {
            this.clock.getDelta(); // Reset delta
            this.animate();
        }
    }
    
    dispose() {
        this.pauseAnimation();
        
        // Dispose all users
        this.users.forEach(userShape => userShape.dispose());
        this.users.clear();
        
        // Dispose all connections
        this.connections.forEach(connection => connection.dispose());
        this.connections.clear();
        
        // Dispose starfield
        if (this.starfield) {
            this.starfield.geometry.dispose();
            this.starfield.material.dispose();
        }
        
        // Dispose renderer
        this.renderer.dispose();
        this.container.removeChild(this.renderer.domElement);
        
        this.isInitialized = false;
    }
}
