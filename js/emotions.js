/* ============================================
   HYPNO - Emotion Particle Systems
   ============================================ */

import { EMOTIONS } from './config.js';

/**
 * Create emotion particle system based on emotion type
 */
export function createEmotionEffect(emotion, parent) {
    const emotionData = EMOTIONS[emotion];
    if (!emotionData || emotionData.effect === 'none') {
        return null;
    }
    
    switch (emotionData.effect) {
        case 'sparkles':
            return createSparkles(parent, emotionData);
        case 'rain':
            return createRain(parent, emotionData);
        case 'static':
            return createStatic(parent, emotionData);
        case 'rising':
            return createRising(parent, emotionData);
        case 'glow':
            return createGlow(parent, emotionData);
        case 'orbiting':
            return createOrbiting(parent, emotionData);
        case 'waves':
            return createWaves(parent, emotionData);
        case 'electricity':
            return createElectricity(parent, emotionData);
        case 'mist':
            return createMist(parent, emotionData);
        default:
            return null;
    }
}

/**
 * Base particle system class
 */
class ParticleEffect {
    constructor(parent, emotionData) {
        this.parent = parent;
        this.color = emotionData.particleColorHex;
        this.pulseSpeed = emotionData.pulseSpeed;
        this.particles = null;
        this.geometry = null;
        this.material = null;
    }
    
    animate(delta, elapsed) {
        // Override in subclass
    }
    
    dispose() {
        if (this.particles) {
            this.parent.remove(this.particles);
        }
        if (this.geometry) {
            this.geometry.dispose();
        }
        if (this.material) {
            this.material.dispose();
        }
    }
}

/**
 * Sparkles (Joyful) - Golden sparkles twinkling
 */
function createSparkles(parent, emotionData) {
    const particleCount = 30;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const offsets = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 6;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
        scales[i] = Math.random();
        offsets[i] = Math.random() * Math.PI * 2;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('scale', new THREE.BufferAttribute(scales, 1));
    geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1));
    
    const material = new THREE.PointsMaterial({
        color: emotionData.particleColorHex,
        size: 0.3,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const particles = new THREE.Points(geometry, material);
    parent.add(particles);
    
    return {
        particles,
        geometry,
        material,
        animate: (delta, elapsed) => {
            const positions = geometry.attributes.position.array;
            const offsets = geometry.attributes.offset.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Twinkle and move
                const offset = offsets[i];
                const t = elapsed * 3 + offset;
                
                // Sparkle opacity effect
                const sparkle = Math.abs(Math.sin(t));
                material.opacity = 0.5 + sparkle * 0.5;
                
                // Gentle floating motion
                positions[i * 3 + 1] += Math.sin(t) * 0.01;
            }
            
            geometry.attributes.position.needsUpdate = true;
            particles.rotation.y += delta * 0.3;
        },
        dispose: () => {
            parent.remove(particles);
            geometry.dispose();
            material.dispose();
        }
    };
}

/**
 * Rain (Sad) - Blue particles falling slowly
 */
function createRain(parent, emotionData) {
    const particleCount = 40;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 5;
        positions[i * 3 + 1] = Math.random() * 6 - 3;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
        velocities[i] = 0.5 + Math.random() * 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: emotionData.particleColorHex,
        size: 0.15,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const particles = new THREE.Points(geometry, material);
    parent.add(particles);
    
    return {
        particles,
        geometry,
        material,
        velocities,
        animate: (delta, elapsed) => {
            const positions = geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3 + 1] -= velocities[i] * delta * 2;
                
                // Reset when fallen below
                if (positions[i * 3 + 1] < -3) {
                    positions[i * 3 + 1] = 3;
                    positions[i * 3] = (Math.random() - 0.5) * 5;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
                }
            }
            
            geometry.attributes.position.needsUpdate = true;
        },
        dispose: () => {
            parent.remove(particles);
            geometry.dispose();
            material.dispose();
        }
    };
}

/**
 * Static (Anxious) - Jittery particles
 */
function createStatic(parent, emotionData) {
    const particleCount = 50;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const origPositions = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount; i++) {
        const x = (Math.random() - 0.5) * 5;
        const y = (Math.random() - 0.5) * 5;
        const z = (Math.random() - 0.5) * 5;
        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;
        origPositions[i * 3] = x;
        origPositions[i * 3 + 1] = y;
        origPositions[i * 3 + 2] = z;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: emotionData.particleColorHex,
        size: 0.12,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const particles = new THREE.Points(geometry, material);
    parent.add(particles);
    
    return {
        particles,
        geometry,
        material,
        origPositions,
        animate: (delta, elapsed) => {
            const positions = geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                // Jitter around original position
                const jitterAmount = 0.3;
                positions[i * 3] = origPositions[i * 3] + (Math.random() - 0.5) * jitterAmount;
                positions[i * 3 + 1] = origPositions[i * 3 + 1] + (Math.random() - 0.5) * jitterAmount;
                positions[i * 3 + 2] = origPositions[i * 3 + 2] + (Math.random() - 0.5) * jitterAmount;
            }
            
            geometry.attributes.position.needsUpdate = true;
            
            // Flicker opacity
            material.opacity = 0.5 + Math.random() * 0.3;
        },
        dispose: () => {
            parent.remove(particles);
            geometry.dispose();
            material.dispose();
        }
    };
}

/**
 * Rising (Hopeful) - Particles floating upward
 */
function createRising(parent, emotionData) {
    const particleCount = 35;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 5;
        positions[i * 3 + 1] = Math.random() * 6 - 3;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
        velocities[i] = 0.3 + Math.random() * 0.4;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: emotionData.particleColorHex,
        size: 0.2,
        transparent: true,
        opacity: 0.8,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const particles = new THREE.Points(geometry, material);
    parent.add(particles);
    
    return {
        particles,
        geometry,
        material,
        velocities,
        animate: (delta, elapsed) => {
            const positions = geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                positions[i * 3 + 1] += velocities[i] * delta * 2;
                
                // Gentle spiral as rising
                const angle = elapsed + i * 0.1;
                positions[i * 3] += Math.sin(angle) * 0.005;
                positions[i * 3 + 2] += Math.cos(angle) * 0.005;
                
                // Reset when risen above
                if (positions[i * 3 + 1] > 4) {
                    positions[i * 3 + 1] = -3;
                    positions[i * 3] = (Math.random() - 0.5) * 5;
                    positions[i * 3 + 2] = (Math.random() - 0.5) * 5;
                }
            }
            
            geometry.attributes.position.needsUpdate = true;
        },
        dispose: () => {
            parent.remove(particles);
            geometry.dispose();
            material.dispose();
        }
    };
}

/**
 * Glow (Grateful) - Warm expanding aura
 */
function createGlow(parent, emotionData) {
    const geometry = new THREE.SphereGeometry(3, 16, 16);
    
    const material = new THREE.MeshBasicMaterial({
        color: emotionData.particleColorHex,
        transparent: true,
        opacity: 0.15,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    parent.add(mesh);
    
    return {
        particles: mesh,
        geometry,
        material,
        animate: (delta, elapsed) => {
            // Pulsing aura
            const pulse = 1 + Math.sin(elapsed * emotionData.pulseSpeed) * 0.15;
            mesh.scale.setScalar(pulse);
            material.opacity = 0.1 + Math.sin(elapsed * emotionData.pulseSpeed) * 0.05;
        },
        dispose: () => {
            parent.remove(mesh);
            geometry.dispose();
            material.dispose();
        }
    };
}

/**
 * Orbiting (Curious) - Particles orbiting the shape
 */
function createOrbiting(parent, emotionData) {
    const particleCount = 20;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const orbits = [];
    
    for (let i = 0; i < particleCount; i++) {
        const radius = 2.5 + Math.random() * 1.5;
        const speed = 0.5 + Math.random() * 0.5;
        const phase = Math.random() * Math.PI * 2;
        const tilt = (Math.random() - 0.5) * Math.PI * 0.5;
        
        orbits.push({ radius, speed, phase, tilt });
        
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: emotionData.particleColorHex,
        size: 0.25,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const particles = new THREE.Points(geometry, material);
    parent.add(particles);
    
    return {
        particles,
        geometry,
        material,
        orbits,
        animate: (delta, elapsed) => {
            const positions = geometry.attributes.position.array;
            
            for (let i = 0; i < particleCount; i++) {
                const orbit = orbits[i];
                const angle = elapsed * orbit.speed + orbit.phase;
                
                positions[i * 3] = Math.cos(angle) * orbit.radius;
                positions[i * 3 + 1] = Math.sin(angle) * Math.sin(orbit.tilt) * orbit.radius * 0.5;
                positions[i * 3 + 2] = Math.sin(angle) * orbit.radius;
            }
            
            geometry.attributes.position.needsUpdate = true;
        },
        dispose: () => {
            parent.remove(particles);
            geometry.dispose();
            material.dispose();
        }
    };
}

/**
 * Waves (Peaceful) - Gentle wave ripples
 */
function createWaves(parent, emotionData) {
    const ringCount = 3;
    const rings = [];
    
    for (let i = 0; i < ringCount; i++) {
        const geometry = new THREE.RingGeometry(2, 2.1, 32);
        const material = new THREE.MeshBasicMaterial({
            color: emotionData.particleColorHex,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2;
        ring.userData.phase = i * (Math.PI * 2 / ringCount);
        ring.userData.baseScale = 0.5 + i * 0.3;
        
        parent.add(ring);
        rings.push({ mesh: ring, geometry, material });
    }
    
    return {
        rings,
        animate: (delta, elapsed) => {
            rings.forEach((ring, i) => {
                const wave = (Math.sin(elapsed * 0.8 + ring.mesh.userData.phase) + 1) * 0.5;
                const scale = ring.mesh.userData.baseScale + wave * 1.5;
                ring.mesh.scale.setScalar(scale);
                ring.material.opacity = 0.3 - wave * 0.25;
            });
        },
        dispose: () => {
            rings.forEach(ring => {
                parent.remove(ring.mesh);
                ring.geometry.dispose();
                ring.material.dispose();
            });
        }
    };
}

/**
 * Electricity (Energized) - Electric arcs/lightning
 */
function createElectricity(parent, emotionData) {
    const arcCount = 6;
    const arcs = [];
    
    for (let i = 0; i < arcCount; i++) {
        const points = [];
        const segments = 8;
        
        for (let j = 0; j <= segments; j++) {
            const t = j / segments;
            const angle = i * (Math.PI * 2 / arcCount);
            const x = Math.cos(angle) * t * 3;
            const y = (Math.random() - 0.5) * 0.5;
            const z = Math.sin(angle) * t * 3;
            points.push(new THREE.Vector3(x, y, z));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: emotionData.particleColorHex,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const line = new THREE.Line(geometry, material);
        parent.add(line);
        arcs.push({ line, geometry, material, points, segments });
    }
    
    return {
        arcs,
        animate: (delta, elapsed) => {
            arcs.forEach((arc, i) => {
                // Randomize arc positions for lightning effect
                const positions = arc.geometry.attributes.position.array;
                const angle = i * (Math.PI * 2 / arcCount);
                
                for (let j = 0; j <= arc.segments; j++) {
                    const t = j / arc.segments;
                    const jitter = j > 0 && j < arc.segments ? 0.3 : 0;
                    
                    positions[j * 3] = Math.cos(angle + Math.sin(elapsed * 10) * 0.1) * t * 3 + (Math.random() - 0.5) * jitter;
                    positions[j * 3 + 1] = (Math.random() - 0.5) * jitter;
                    positions[j * 3 + 2] = Math.sin(angle + Math.sin(elapsed * 10) * 0.1) * t * 3 + (Math.random() - 0.5) * jitter;
                }
                
                arc.geometry.attributes.position.needsUpdate = true;
                arc.material.opacity = 0.3 + Math.random() * 0.5;
            });
        },
        dispose: () => {
            arcs.forEach(arc => {
                parent.remove(arc.line);
                arc.geometry.dispose();
                arc.material.dispose();
            });
        }
    };
}

/**
 * Mist (Contemplative) - Soft misty aura
 */
function createMist(parent, emotionData) {
    const particleCount = 60;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.random() * Math.PI;
        const radius = 2 + Math.random() * 2;
        
        positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
        positions[i * 3 + 1] = Math.cos(phi) * radius * 0.5;
        positions[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * radius;
        sizes[i] = 0.5 + Math.random() * 0.5;
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        color: emotionData.particleColorHex,
        size: 0.8,
        transparent: true,
        opacity: 0.2,
        blending: THREE.AdditiveBlending,
        sizeAttenuation: true
    });
    
    const particles = new THREE.Points(geometry, material);
    parent.add(particles);
    
    return {
        particles,
        geometry,
        material,
        animate: (delta, elapsed) => {
            // Gentle swirling motion
            particles.rotation.y += delta * 0.1;
            particles.rotation.x = Math.sin(elapsed * 0.3) * 0.1;
            
            // Fade in and out
            material.opacity = 0.15 + Math.sin(elapsed * 0.5) * 0.05;
        },
        dispose: () => {
            parent.remove(particles);
            geometry.dispose();
            material.dispose();
        }
    };
}
