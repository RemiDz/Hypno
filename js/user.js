/* ============================================
   HYPNO - User Shape Representation
   ============================================ */

import { INTENTIONS, EMOTIONS, SCENE_CONFIG } from './config.js';
import { createShapeGeometry, createShapeMaterial, createGlowMaterial } from './shapes.js';
import { createEmotionEffect } from './emotions.js';
import { createLabelTexture } from './utils.js';

export class UserShape {
    constructor(userId, userData, isSelf, scene, camera) {
        this.id = userId;
        this.data = { ...userData };
        this.isSelf = isSelf;
        this.scene = scene;
        this.camera = camera;
        
        // Three.js objects
        this.group = new THREE.Group();
        this.mesh = null;
        this.glowMesh = null;
        this.label = null;
        this.emotionEffect = null;
        
        // Animation state
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.baseScale = SCENE_CONFIG.shapeScale;
        this.isHighlighted = false;
        this.isDisposing = false;
        
        this.init();
    }
    
    init() {
        // Set position
        if (this.data.position) {
            this.group.position.set(
                this.data.position.x,
                this.data.position.y,
                this.data.position.z
            );
        }
        
        // Create shape
        this.createShape();
        
        // Create label
        this.createLabel();
        
        // Create emotion effect
        if (this.data.emotion && this.data.emotion !== 'neutral') {
            this.createEmotionEffect();
        }
        
        // Add to scene
        this.scene.add(this.group);
        
        // Entry animation
        this.animateEntry();
    }
    
    createShape() {
        const intention = this.data.intention || 'observer';
        const intentionData = INTENTIONS[intention];
        const color = intentionData ? intentionData.colorHex : 0xFFFFFF;
        
        // Main mesh
        const geometry = createShapeGeometry(intention);
        const material = createShapeMaterial(color, this.isSelf ? 0.5 : 0.3);
        
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.scale.setScalar(this.baseScale);
        this.group.add(this.mesh);
        
        // Glow mesh
        const glowGeometry = geometry.clone();
        const glowMaterial = createGlowMaterial(color);
        
        this.glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
        this.glowMesh.scale.setScalar(this.baseScale * 1.3);
        this.group.add(this.glowMesh);
        
        // Store references for disposal
        this.geometry = geometry;
        this.material = material;
        this.glowGeometry = glowGeometry;
        this.glowMaterial = glowMaterial;
    }
    
    createLabel() {
        const nickname = this.data.nickname || 'Anonymous';
        const displayName = this.isSelf ? `${nickname} (You)` : nickname;
        
        // Create canvas texture
        const canvas = createLabelTexture(displayName, {
            fontSize: 24,
            color: '#FFFFFF',
            backgroundColor: 'rgba(10, 10, 26, 0.75)'
        });
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            depthTest: false,  // Always render on top
            depthWrite: false
        });
        
        this.label = new THREE.Sprite(spriteMaterial);
        this.label.scale.set(canvas.width / 50, canvas.height / 50, 1);
        
        // Calculate label height based on shape bounding box
        this.updateLabelPosition();
        
        this.label.renderOrder = 999;  // Ensure it renders on top
        
        this.group.add(this.label);
        
        // Store for disposal
        this.labelTexture = texture;
        this.labelMaterial = spriteMaterial;
    }
    
    updateLabelPosition() {
        if (!this.label || !this.mesh) return;
        
        // Get the bounding box of the mesh
        if (!this.mesh.geometry.boundingBox) {
            this.mesh.geometry.computeBoundingBox();
        }
        
        const box = this.mesh.geometry.boundingBox;
        const shapeHeight = (box.max.y - box.min.y) * this.baseScale;
        
        // Position label just above the shape (consistent 5 units above top)
        this.label.position.y = shapeHeight / 2 + 5;
    }
    
    updateLabel() {
        if (!this.label) return;
        
        const nickname = this.data.nickname || 'Anonymous';
        const displayName = this.isSelf ? `${nickname} (You)` : nickname;
        
        // Create new canvas texture
        const canvas = createLabelTexture(displayName, {
            fontSize: 24,
            color: '#FFFFFF',
            backgroundColor: 'rgba(10, 10, 26, 0.75)'
        });
        
        // Update texture
        if (this.labelTexture) {
            this.labelTexture.dispose();
        }
        
        this.labelTexture = new THREE.CanvasTexture(canvas);
        this.labelTexture.minFilter = THREE.LinearFilter;
        this.labelTexture.magFilter = THREE.LinearFilter;
        
        this.label.material.map = this.labelTexture;
        this.label.scale.set(canvas.width / 40, canvas.height / 40, 1);
    }
    
    createEmotionEffect() {
        if (this.emotionEffect) {
            this.emotionEffect.dispose();
            this.emotionEffect = null;
        }
        
        const emotion = this.data.emotion || 'neutral';
        if (emotion !== 'neutral') {
            this.emotionEffect = createEmotionEffect(emotion, this.group);
        }
    }
    
    animateEntry() {
        // Start invisible and small
        this.group.scale.setScalar(0);
        this.group.traverse(obj => {
            if (obj.material && obj.material.opacity !== undefined) {
                obj.material.transparent = true;
            }
        });
        
        // Animate in
        gsap.to(this.group.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 0.8,
            ease: 'back.out(1.7)'
        });
    }
    
    update(newData) {
        const oldIntention = this.data.intention;
        const oldEmotion = this.data.emotion;
        const oldNickname = this.data.nickname;
        
        // Update data
        Object.assign(this.data, newData);
        
        // Update position if changed
        if (newData.position) {
            gsap.to(this.group.position, {
                x: newData.position.x,
                y: newData.position.y,
                z: newData.position.z,
                duration: 0.5,
                ease: 'power2.out'
            });
        }
        
        // Update shape if intention changed
        if (newData.intention && newData.intention !== oldIntention) {
            this.morphToIntention(newData.intention);
        }
        
        // Update emotion effect if changed
        if (newData.emotion && newData.emotion !== oldEmotion) {
            this.createEmotionEffect();
        }
        
        // Update label if nickname changed
        if (newData.nickname && newData.nickname !== oldNickname) {
            this.updateLabel();
        }
    }
    
    morphToIntention(intention) {
        const intentionData = INTENTIONS[intention];
        if (!intentionData) return;
        
        const color = intentionData.colorHex;
        
        // Animate color change
        gsap.to(this.mesh.material.color, {
            r: ((color >> 16) & 255) / 255,
            g: ((color >> 8) & 255) / 255,
            b: (color & 255) / 255,
            duration: 0.5
        });
        
        gsap.to(this.mesh.material.emissive, {
            r: ((color >> 16) & 255) / 255,
            g: ((color >> 8) & 255) / 255,
            b: (color & 255) / 255,
            duration: 0.5
        });
        
        gsap.to(this.glowMesh.material.color, {
            r: ((color >> 16) & 255) / 255,
            g: ((color >> 8) & 255) / 255,
            b: (color & 255) / 255,
            duration: 0.5
        });
        
        // Morph geometry with scale animation
        gsap.to(this.mesh.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                // Replace geometry
                const newGeometry = createShapeGeometry(intention);
                
                this.mesh.geometry.dispose();
                this.mesh.geometry = newGeometry;
                
                this.glowMesh.geometry.dispose();
                this.glowMesh.geometry = newGeometry.clone();
                
                // Animate back
                gsap.to(this.mesh.scale, {
                    x: this.baseScale,
                    y: this.baseScale,
                    z: this.baseScale,
                    duration: 0.4,
                    ease: 'back.out(1.7)'
                });
            }
        });
        
        gsap.to(this.glowMesh.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.3,
            ease: 'power2.in',
            onComplete: () => {
                gsap.to(this.glowMesh.scale, {
                    x: this.baseScale * 1.3,
                    y: this.baseScale * 1.3,
                    z: this.baseScale * 1.3,
                    duration: 0.4,
                    ease: 'back.out(1.7)'
                });
            }
        });
    }
    
    animate(delta, elapsed) {
        if (this.isDisposing) return;
        
        // Pulse animation (breathing)
        const pulseSpeed = EMOTIONS[this.data.emotion]?.pulseSpeed || 1.0;
        const pulse = 1 + Math.sin(elapsed * pulseSpeed + this.pulsePhase) * 0.05;
        
        if (this.mesh) {
            this.mesh.scale.setScalar(this.baseScale * pulse);
        }
        
        if (this.glowMesh) {
            this.glowMesh.scale.setScalar(this.baseScale * 1.3 * pulse);
            this.glowMesh.material.opacity = 0.1 + Math.sin(elapsed * pulseSpeed + this.pulsePhase) * 0.05;
        }
        
        // Rotate shape slowly
        if (this.mesh) {
            this.mesh.rotation.y += delta * 0.2;
        }
        
        // Animate emotion effect
        if (this.emotionEffect && this.emotionEffect.animate) {
            this.emotionEffect.animate(delta, elapsed);
        }
    }
    
    highlight(enabled) {
        this.isHighlighted = enabled;
        
        if (enabled) {
            gsap.to(this.mesh.material, {
                emissiveIntensity: 0.8,
                duration: 0.3
            });
            gsap.to(this.glowMesh.material, {
                opacity: 0.4,
                duration: 0.3
            });
        } else {
            gsap.to(this.mesh.material, {
                emissiveIntensity: this.isSelf ? 0.5 : 0.3,
                duration: 0.3
            });
            gsap.to(this.glowMesh.material, {
                opacity: 0.15,
                duration: 0.3
            });
        }
    }
    
    getPosition() {
        return this.group.position.clone();
    }
    
    fadeOut(callback) {
        this.isDisposing = true;
        
        gsap.to(this.group.scale, {
            x: 0,
            y: 0,
            z: 0,
            duration: 0.5,
            ease: 'power2.in',
            onComplete: () => {
                if (callback) callback();
            }
        });
    }
    
    dispose() {
        this.isDisposing = true;
        
        // Remove from scene
        this.scene.remove(this.group);
        
        // Dispose geometries
        if (this.mesh && this.mesh.geometry) {
            this.mesh.geometry.dispose();
        }
        if (this.glowMesh && this.glowMesh.geometry) {
            this.glowMesh.geometry.dispose();
        }
        
        // Dispose materials
        if (this.mesh && this.mesh.material) {
            this.mesh.material.dispose();
        }
        if (this.glowMesh && this.glowMesh.material) {
            this.glowMesh.material.dispose();
        }
        
        // Dispose label
        if (this.labelTexture) {
            this.labelTexture.dispose();
        }
        if (this.labelMaterial) {
            this.labelMaterial.dispose();
        }
        
        // Dispose emotion effect
        if (this.emotionEffect) {
            this.emotionEffect.dispose();
        }
    }
}
