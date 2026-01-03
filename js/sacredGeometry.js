/* ============================================
   HYPNO - Sacred Geometry & Binaural Beats
   ============================================ */

import { INTENTIONS } from './config.js';

// Intention to frequency mapping (Hz) for binaural beats
const INTENTION_FREQUENCIES = {
    observer: { base: 432, beat: 10 },    // Alpha waves - awareness
    peace: { base: 432, beat: 4 },        // Theta waves - meditation
    love: { base: 528, beat: 7.83 },      // Schumann resonance - heart
    clarity: { base: 440, beat: 14 },     // Beta waves - focus
    creativity: { base: 396, beat: 8 },   // Alpha waves - creativity
    transcendence: { base: 639, beat: 3 }, // Delta waves - transcendence
    transformation: { base: 741, beat: 6 }, // Theta waves - change
    healing: { base: 528, beat: 4 },      // Theta waves - healing
    wisdom: { base: 852, beat: 12 },      // Alpha waves - intuition
    unity: { base: 963, beat: 7.83 },     // Schumann resonance - oneness
    dream: { base: 396, beat: 2 },        // Delta waves - dreams
    strength: { base: 417, beat: 15 },    // Beta waves - power
    flow: { base: 528, beat: 5 },         // Theta waves - flow state
    protection: { base: 285, beat: 10 },  // Alpha waves - grounding
    abundance: { base: 888, beat: 8 }     // Alpha waves - prosperity
};

/**
 * Sacred Geometry Group - Manages the 3D visualization and audio
 */
export class SacredGeometryGroup {
    constructor(geometryId, geometryData, scene) {
        this.id = geometryId;
        this.data = geometryData;
        this.scene = scene;
        this.threeScene = scene.scene;
        
        this.group = new THREE.Group();
        this.geometryMesh = null;
        this.outerGlow = null;
        this.particles = null;
        this.memberPositions = new Map();
        
        // Audio
        this.audioContext = null;
        this.oscillators = [];
        this.gainNodes = [];
        this.isAudioPlaying = false;
        this.masterGain = null;
        
        // Animation
        this.rotationSpeed = 0.0005;
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.complexity = 2; // Will be set based on members
        
        this.init();
    }
    
    init() {
        // Set position at center
        if (this.data.center) {
            this.group.position.set(
                this.data.center.x,
                this.data.center.y,
                this.data.center.z
            );
        }
        
        // Calculate complexity based on members
        const memberCount = Object.keys(this.data.members || {}).length;
        this.complexity = Math.min(memberCount + 1, 8);
        
        // Create the sacred geometry
        this.createGeometry();
        
        // Add to scene
        this.threeScene.add(this.group);
        
        // Animate entry
        this.animateEntry();
    }
    
    createGeometry() {
        // Use the seed for unique but deterministic generation
        const seed = this.data.seed || Math.random() * 10000;
        const random = this.seededRandom(seed);
        
        const memberCount = Object.keys(this.data.members || {}).length;
        
        // Choose geometry type based on seed and member count
        const geometryTypes = [
            () => this.createMerkaba(random, memberCount),
            () => this.createFlowerOfLife(random, memberCount),
            () => this.createMetatronsCube(random, memberCount),
            () => this.createSriYantra(random, memberCount),
            () => this.createTorusKnot(random, memberCount),
            () => this.createPlatonicNested(random, memberCount)
        ];
        
        const typeIndex = Math.floor(random() * geometryTypes.length);
        const geometry = geometryTypes[typeIndex]();
        
        // Get colors from member intentions
        const colors = this.getMemberColors();
        const primaryColor = colors[0] || 0x8B5CF6;
        const secondaryColor = colors[1] || 0xEC4899;
        
        // Create material with gradient effect
        const material = new THREE.MeshStandardMaterial({
            color: primaryColor,
            emissive: primaryColor,
            emissiveIntensity: 0.4,
            metalness: 0.5,
            roughness: 0.3,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        
        this.geometryMesh = new THREE.Mesh(geometry, material);
        this.geometryMesh.scale.setScalar(15 + memberCount * 5);
        this.group.add(this.geometryMesh);
        
        // Create outer glow
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: secondaryColor,
            transparent: true,
            opacity: 0.1,
            side: THREE.BackSide,
            blending: THREE.AdditiveBlending
        });
        
        this.outerGlow = new THREE.Mesh(geometry.clone(), glowMaterial);
        this.outerGlow.scale.setScalar((15 + memberCount * 5) * 1.2);
        this.group.add(this.outerGlow);
        
        // Create particles around geometry
        this.createParticles(colors);
    }
    
    seededRandom(seed) {
        let s = seed;
        return function() {
            s = Math.sin(s * 9999) * 10000;
            return s - Math.floor(s);
        };
    }
    
    getMemberColors() {
        const colors = [];
        const members = this.data.members || {};
        
        Object.values(members).forEach(member => {
            if (member.intention && INTENTIONS[member.intention]) {
                colors.push(INTENTIONS[member.intention].colorHex);
            }
        });
        
        return colors.length > 0 ? colors : [0x8B5CF6];
    }
    
    // Sacred Geometry Shapes
    
    createMerkaba(random, memberCount) {
        // Two interlocking tetrahedra
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        const size = 1;
        const rotation = random() * Math.PI;
        
        // First tetrahedron (pointing up)
        const tet1 = [
            [0, size, 0],
            [size * 0.943, -size * 0.333, 0],
            [-size * 0.471, -size * 0.333, size * 0.816],
            [-size * 0.471, -size * 0.333, -size * 0.816]
        ];
        
        // Second tetrahedron (pointing down, rotated)
        const tet2 = tet1.map(v => [-v[0], -v[1], v[2]]);
        
        // Add vertices
        [...tet1, ...tet2].forEach(v => {
            const x = v[0] * Math.cos(rotation) - v[2] * Math.sin(rotation);
            const z = v[0] * Math.sin(rotation) + v[2] * Math.cos(rotation);
            vertices.push(x, v[1], z);
        });
        
        // Add faces for both tetrahedra
        const faces = [
            [0, 1, 2], [0, 2, 3], [0, 3, 1], [1, 3, 2],
            [4, 6, 5], [4, 7, 6], [4, 5, 7], [5, 6, 7]
        ];
        
        faces.forEach(face => indices.push(...face));
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    createFlowerOfLife(random, memberCount) {
        // Overlapping circles forming the flower of life pattern
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        const layers = Math.min(2 + memberCount, 4);
        const circleSegments = 32;
        const radius = 0.3;
        
        // Create circles in hexagonal pattern
        const circles = [[0, 0]];
        
        for (let layer = 1; layer <= layers; layer++) {
            for (let i = 0; i < 6 * layer; i++) {
                const angle = (i / (6 * layer)) * Math.PI * 2;
                const dist = layer * radius * 2 * 0.866;
                circles.push([
                    Math.cos(angle) * dist,
                    Math.sin(angle) * dist
                ]);
            }
        }
        
        // Create torus for each circle position
        const torusGeometry = new THREE.TorusGeometry(radius, 0.03, 8, circleSegments);
        const mergedGeometry = new THREE.BufferGeometry();
        
        circles.slice(0, 7 + memberCount * 3).forEach(([cx, cy], idx) => {
            const torus = torusGeometry.clone();
            torus.rotateX(Math.PI / 2);
            torus.translate(cx, 0, cy);
            
            // Merge into main geometry
            const positions = torus.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                vertices.push(positions[i], positions[i + 1], positions[i + 2]);
            }
            
            const torusIndices = torus.index.array;
            const offset = idx * (torusGeometry.attributes.position.count);
            for (let i = 0; i < torusIndices.length; i++) {
                indices.push(torusIndices[i] + offset);
            }
        });
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        geometry.scale(2, 2, 2);
        
        return geometry;
    }
    
    createMetatronsCube(random, memberCount) {
        // 13 circles connected by lines - using icosahedron as base
        const geometry = new THREE.IcosahedronGeometry(1, memberCount > 4 ? 1 : 0);
        
        // Add connecting lines
        const wireframe = new THREE.WireframeGeometry(geometry);
        
        return geometry;
    }
    
    createSriYantra(random, memberCount) {
        // Interlocking triangles forming Sri Yantra
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        const layers = 4 + Math.floor(memberCount / 2);
        
        for (let layer = 0; layer < layers; layer++) {
            const scale = 1 - layer * 0.15;
            const rotation = layer * Math.PI / layers + random() * 0.1;
            const points = 3 + Math.floor(layer / 2);
            const isInverted = layer % 2 === 1;
            
            const baseIdx = vertices.length / 3;
            
            // Create polygon
            for (let i = 0; i < points; i++) {
                const angle = (i / points) * Math.PI * 2 + rotation;
                const y = isInverted ? -0.1 * layer : 0.1 * layer;
                
                vertices.push(
                    Math.cos(angle) * scale,
                    y,
                    Math.sin(angle) * scale
                );
            }
            
            // Add center
            vertices.push(0, isInverted ? -0.1 * layer : 0.1 * layer, 0);
            const centerIdx = vertices.length / 3 - 1;
            
            // Create triangles
            for (let i = 0; i < points; i++) {
                indices.push(
                    baseIdx + i,
                    baseIdx + ((i + 1) % points),
                    centerIdx
                );
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        return geometry;
    }
    
    createTorusKnot(random, memberCount) {
        // Complex torus knot - more complex with more members
        const p = 2 + Math.floor(random() * 3);
        const q = 3 + Math.floor(random() * 4);
        
        return new THREE.TorusKnotGeometry(
            0.6,
            0.15,
            64 + memberCount * 16,
            8 + memberCount * 2,
            p,
            q
        );
    }
    
    createPlatonicNested(random, memberCount) {
        // Nested platonic solids
        const geometries = [
            new THREE.TetrahedronGeometry(0.5, 0),
            new THREE.OctahedronGeometry(0.7, 0),
            new THREE.IcosahedronGeometry(0.9, 0),
            new THREE.DodecahedronGeometry(1.1, 0)
        ];
        
        // Combine based on member count
        const useCount = Math.min(memberCount, geometries.length);
        const combined = new THREE.BufferGeometry();
        const vertices = [];
        const indices = [];
        
        for (let i = 0; i < useCount; i++) {
            const geo = geometries[i];
            const rotation = i * Math.PI / 6;
            
            const positions = geo.attributes.position.array;
            const geoIndices = geo.index ? geo.index.array : [];
            const offset = vertices.length / 3;
            
            for (let j = 0; j < positions.length; j += 3) {
                const x = positions[j];
                const y = positions[j + 1];
                const z = positions[j + 2];
                
                // Rotate
                const rx = x * Math.cos(rotation) - z * Math.sin(rotation);
                const rz = x * Math.sin(rotation) + z * Math.cos(rotation);
                
                vertices.push(rx, y, rz);
            }
            
            for (let j = 0; j < geoIndices.length; j++) {
                indices.push(geoIndices[j] + offset);
            }
        }
        
        combined.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        combined.setIndex(indices);
        combined.computeVertexNormals();
        
        return combined;
    }
    
    createParticles(colors) {
        const memberCount = Object.keys(this.data.members || {}).length;
        const particleCount = 100 + memberCount * 50;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Distribute on sphere
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const radius = 20 + memberCount * 8 + Math.random() * 10;
            
            positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
            positions[i * 3 + 1] = Math.cos(phi) * radius;
            positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
            
            // Color from member intentions
            const colorHex = colors[i % colors.length];
            const color = new THREE.Color(colorHex);
            colorArray[i * 3] = color.r;
            colorArray[i * 3 + 1] = color.g;
            colorArray[i * 3 + 2] = color.b;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
        
        const material = new THREE.PointsMaterial({
            size: 0.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.group.add(this.particles);
    }
    
    animateEntry() {
        this.group.scale.setScalar(0);
        
        gsap.to(this.group.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 2,
            ease: 'elastic.out(1, 0.5)'
        });
        
        gsap.from(this.group.rotation, {
            y: Math.PI * 2,
            duration: 3,
            ease: 'power2.out'
        });
    }
    
    // ========================
    // Binaural Beats Audio
    // ========================
    
    async startBinauralBeats() {
        if (this.isAudioPlaying) return;
        
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume if suspended (iOS requirement)
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            // Master gain (volume control)
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.15; // Low volume
            this.masterGain.connect(this.audioContext.destination);
            
            // Get member intentions and calculate frequencies
            const members = this.data.members || {};
            const activeMembers = Object.values(members).filter(m => !m.pending);
            
            if (activeMembers.length === 0) return;
            
            // Calculate combined frequency from all intentions
            let totalBaseFreq = 0;
            let totalBeatFreq = 0;
            
            activeMembers.forEach(member => {
                const freqs = INTENTION_FREQUENCIES[member.intention] || 
                              INTENTION_FREQUENCIES.observer;
                totalBaseFreq += freqs.base;
                totalBeatFreq += freqs.beat;
            });
            
            const baseFreq = totalBaseFreq / activeMembers.length;
            const beatFreq = totalBeatFreq / activeMembers.length;
            
            // Create left and right oscillators for binaural effect
            const leftOsc = this.audioContext.createOscillator();
            const rightOsc = this.audioContext.createOscillator();
            
            leftOsc.type = 'sine';
            rightOsc.type = 'sine';
            
            leftOsc.frequency.value = baseFreq;
            rightOsc.frequency.value = baseFreq + beatFreq;
            
            // Create stereo panner for each
            const leftPan = this.audioContext.createStereoPanner();
            const rightPan = this.audioContext.createStereoPanner();
            
            leftPan.pan.value = -1; // Full left
            rightPan.pan.value = 1;  // Full right
            
            // Individual gains
            const leftGain = this.audioContext.createGain();
            const rightGain = this.audioContext.createGain();
            
            leftGain.gain.value = 0.5;
            rightGain.gain.value = 0.5;
            
            // Connect
            leftOsc.connect(leftGain);
            leftGain.connect(leftPan);
            leftPan.connect(this.masterGain);
            
            rightOsc.connect(rightGain);
            rightGain.connect(rightPan);
            rightPan.connect(this.masterGain);
            
            // Start
            leftOsc.start();
            rightOsc.start();
            
            this.oscillators = [leftOsc, rightOsc];
            this.gainNodes = [leftGain, rightGain];
            this.isAudioPlaying = true;
            
            // Fade in
            this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.masterGain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 2);
            
            console.log(`🎵 Binaural beats: ${baseFreq}Hz base, ${beatFreq}Hz beat frequency`);
            
        } catch (error) {
            console.error('Error starting binaural beats:', error);
        }
    }
    
    stopBinauralBeats() {
        if (!this.isAudioPlaying || !this.audioContext) return;
        
        // Fade out
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
        }
        
        // Stop after fade
        setTimeout(() => {
            this.oscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {}
            });
            
            if (this.audioContext) {
                this.audioContext.close();
            }
            
            this.oscillators = [];
            this.gainNodes = [];
            this.audioContext = null;
            this.isAudioPlaying = false;
        }, 1100);
    }
    
    updateBinauralBeats() {
        if (!this.isAudioPlaying || this.oscillators.length < 2) return;
        
        const members = this.data.members || {};
        const activeMembers = Object.values(members).filter(m => !m.pending);
        
        if (activeMembers.length === 0) {
            this.stopBinauralBeats();
            return;
        }
        
        // Recalculate frequencies
        let totalBaseFreq = 0;
        let totalBeatFreq = 0;
        
        activeMembers.forEach(member => {
            const freqs = INTENTION_FREQUENCIES[member.intention] || 
                          INTENTION_FREQUENCIES.observer;
            totalBaseFreq += freqs.base;
            totalBeatFreq += freqs.beat;
        });
        
        const baseFreq = totalBaseFreq / activeMembers.length;
        const beatFreq = totalBeatFreq / activeMembers.length;
        
        // Smoothly transition frequencies
        const now = this.audioContext.currentTime;
        this.oscillators[0].frequency.linearRampToValueAtTime(baseFreq, now + 0.5);
        this.oscillators[1].frequency.linearRampToValueAtTime(baseFreq + beatFreq, now + 0.5);
    }
    
    // ========================
    // Update & Animation
    // ========================
    
    update(geometryData) {
        const oldMemberCount = Object.keys(this.data.members || {}).length;
        this.data = geometryData;
        const newMemberCount = Object.keys(geometryData.members || {}).length;
        
        // If member count changed, rebuild geometry
        if (newMemberCount !== oldMemberCount) {
            this.rebuildGeometry();
            
            if (this.isAudioPlaying) {
                this.updateBinauralBeats();
            }
        }
        
        // Update center position
        if (geometryData.center) {
            gsap.to(this.group.position, {
                x: geometryData.center.x,
                y: geometryData.center.y,
                z: geometryData.center.z,
                duration: 1,
                ease: 'power2.out'
            });
        }
    }
    
    rebuildGeometry() {
        // Remove old geometry
        if (this.geometryMesh) {
            this.group.remove(this.geometryMesh);
            this.geometryMesh.geometry.dispose();
            this.geometryMesh.material.dispose();
        }
        
        if (this.outerGlow) {
            this.group.remove(this.outerGlow);
            this.outerGlow.geometry.dispose();
            this.outerGlow.material.dispose();
        }
        
        if (this.particles) {
            this.group.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
        
        // Recreate
        this.createGeometry();
        
        // Animate the change
        gsap.from(this.geometryMesh.scale, {
            x: 0.5,
            y: 0.5,
            z: 0.5,
            duration: 1,
            ease: 'elastic.out(1, 0.5)'
        });
    }
    
    animate(delta, elapsed) {
        // Rotate geometry
        if (this.geometryMesh) {
            this.geometryMesh.rotation.y += this.rotationSpeed;
            this.geometryMesh.rotation.x += this.rotationSpeed * 0.3;
        }
        
        if (this.outerGlow) {
            this.outerGlow.rotation.y -= this.rotationSpeed * 0.5;
        }
        
        // Pulse effect
        const pulse = 1 + Math.sin(elapsed * 0.5 + this.pulsePhase) * 0.05;
        if (this.geometryMesh) {
            const baseScale = 15 + Object.keys(this.data.members || {}).length * 5;
            this.geometryMesh.scale.setScalar(baseScale * pulse);
        }
        
        // Animate particles
        if (this.particles) {
            this.particles.rotation.y += delta * 0.1;
            
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                // Gentle floating motion
                positions[i + 1] += Math.sin(elapsed + i) * 0.01;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    fadeOut(callback) {
        this.stopBinauralBeats();
        
        gsap.to(this.group.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 1,
            ease: 'power2.in',
            onComplete: () => {
                if (callback) callback();
            }
        });
    }
    
    dispose() {
        this.stopBinauralBeats();
        
        // Remove from scene
        this.threeScene.remove(this.group);
        
        // Dispose geometries
        if (this.geometryMesh) {
            this.geometryMesh.geometry.dispose();
            this.geometryMesh.material.dispose();
        }
        
        if (this.outerGlow) {
            this.outerGlow.geometry.dispose();
            this.outerGlow.material.dispose();
        }
        
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
    }
    
    // ========================
    // Member Position Management
    // ========================
    
    getMemberPosition(index, total) {
        // Arrange members in a circle around the geometry center
        const radius = 25 + total * 3;
        const angle = (index / total) * Math.PI * 2;
        
        return {
            x: this.data.center.x + Math.cos(angle) * radius,
            y: this.data.center.y,
            z: this.data.center.z + Math.sin(angle) * radius
        };
    }
}

/**
 * Sacred Geometry Manager - Handles all sacred geometry groups
 */
export class SacredGeometryManager {
    constructor(scene) {
        this.scene = scene;
        this.geometries = new Map();
    }
    
    addGeometry(geometryId, geometryData) {
        if (this.geometries.has(geometryId)) return;
        
        const sacredGeometry = new SacredGeometryGroup(geometryId, geometryData, this.scene);
        this.geometries.set(geometryId, sacredGeometry);
        
        return sacredGeometry;
    }
    
    updateGeometry(geometryId, geometryData) {
        const geometry = this.geometries.get(geometryId);
        if (geometry) {
            geometry.update(geometryData);
        }
    }
    
    removeGeometry(geometryId) {
        const geometry = this.geometries.get(geometryId);
        if (geometry) {
            geometry.fadeOut(() => {
                geometry.dispose();
                this.geometries.delete(geometryId);
            });
        }
    }
    
    getGeometry(geometryId) {
        return this.geometries.get(geometryId);
    }
    
    animate(delta, elapsed) {
        this.geometries.forEach(geometry => {
            geometry.animate(delta, elapsed);
        });
    }
    
    dispose() {
        this.geometries.forEach(geometry => geometry.dispose());
        this.geometries.clear();
    }
}
