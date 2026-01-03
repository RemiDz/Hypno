/* ============================================
   HYPNO - Resonance Connection System
   ============================================ */

import { INTENTIONS, CONNECTION_STYLES } from './config.js';
import { blendColors } from './utils.js';

/**
 * Manages all resonance connections
 */
export class ConnectionManager {
    constructor(scene, usersMap) {
        this.scene = scene;
        this.users = usersMap;
        this.connections = new Map(); // "fromId-toId" -> ConnectionThread
    }
    
    updateConnections(allUsers, selfId) {
        const activeConnections = new Set();
        
        // Build connections from all users' resonatingWith arrays
        allUsers.forEach((userData, userId) => {
            if (userData.resonatingWith && Array.isArray(userData.resonatingWith)) {
                userData.resonatingWith.forEach(targetId => {
                    // Only create connection if target user exists
                    if (!allUsers.has(targetId)) return;
                    
                    const connId = this.getConnectionId(userId, targetId);
                    activeConnections.add(connId);
                    
                    // Create connection if it doesn't exist
                    if (!this.connections.has(connId)) {
                        this.createConnection(userId, targetId);
                    }
                    
                    // Check for mutual resonance
                    const targetData = allUsers.get(targetId);
                    const isMutual = targetData?.resonatingWith?.includes(userId);
                    
                    const thread = this.connections.get(connId);
                    if (thread) {
                        thread.setMutual(isMutual);
                    }
                });
            }
        });
        
        // Remove connections that are no longer active
        const toRemove = [];
        this.connections.forEach((thread, connId) => {
            if (!activeConnections.has(connId)) {
                toRemove.push(connId);
            }
        });
        
        toRemove.forEach(connId => this.removeConnection(connId));
    }
    
    getConnectionId(id1, id2) {
        return [id1, id2].sort().join('-');
    }
    
    createConnection(fromId, toId) {
        const fromUser = this.users.get(fromId);
        const toUser = this.users.get(toId);
        
        if (!fromUser || !toUser) return;
        
        const connId = this.getConnectionId(fromId, toId);
        
        const thread = new ConnectionThread(
            fromUser,
            toUser,
            fromUser.data.intention,
            this.scene
        );
        
        this.connections.set(connId, thread);
    }
    
    removeConnection(connId) {
        const thread = this.connections.get(connId);
        if (thread) {
            thread.fadeOut(() => {
                thread.dispose();
                this.connections.delete(connId);
            });
        }
    }
    
    removeConnectionByIds(fromId, toId) {
        const connId = this.getConnectionId(fromId, toId);
        this.removeConnection(connId);
    }
    
    animate(delta, elapsed) {
        this.connections.forEach(thread => {
            thread.animate(delta, elapsed);
        });
    }
    
    dispose() {
        this.connections.forEach(thread => {
            thread.dispose();
        });
        this.connections.clear();
    }
}

/**
 * Individual connection thread between two users
 */
export class ConnectionThread {
    constructor(fromUser, toUser, fromIntention, scene) {
        this.fromUser = fromUser;
        this.toUser = toUser;
        this.scene = scene;
        this.isMutual = false;
        this.isDisposing = false;
        
        // Get colors
        const intentionData = INTENTIONS[fromIntention];
        this.fromColor = intentionData ? intentionData.colorHex : 0xFFFFFF;
        
        const toIntentionData = INTENTIONS[toUser.data.intention];
        this.toColor = toIntentionData ? toIntentionData.colorHex : 0xFFFFFF;
        
        // Three.js objects
        this.group = new THREE.Group();
        this.line = null;
        this.particles = null;
        this.glowLine = null;
        
        this.create();
    }
    
    create() {
        // Create the curved line
        this.updateCurve();
        
        // Add flowing particles
        this.createParticles();
        
        // Add to scene
        this.scene.add(this.group);
        
        // Fade in
        this.group.traverse(obj => {
            if (obj.material) {
                obj.material.transparent = true;
                const targetOpacity = obj.userData.targetOpacity || obj.material.opacity;
                obj.material.opacity = 0;
                gsap.to(obj.material, {
                    opacity: targetOpacity,
                    duration: 0.5
                });
            }
        });
    }
    
    updateCurve() {
        const startPos = this.fromUser.getPosition();
        const endPos = this.toUser.getPosition();
        
        // Calculate midpoint with offset for curve
        const midpoint = new THREE.Vector3().lerpVectors(startPos, endPos, 0.5);
        const distance = startPos.distanceTo(endPos);
        midpoint.y += distance * 0.2; // Curve upward
        
        // Create curve
        const curve = new THREE.QuadraticBezierCurve3(startPos, midpoint, endPos);
        const points = curve.getPoints(50);
        
        if (this.line) {
            // Update existing geometry
            this.line.geometry.setFromPoints(points);
            this.line.geometry.attributes.position.needsUpdate = true;
        } else {
            // Create new line
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: this.isMutual ? blendColors(this.fromColor, this.toColor) : this.fromColor,
                transparent: true,
                opacity: CONNECTION_STYLES.oneWay.opacity,
                blending: THREE.AdditiveBlending,
                linewidth: CONNECTION_STYLES.oneWay.width
            });
            material.userData.targetOpacity = CONNECTION_STYLES.oneWay.opacity;
            
            this.line = new THREE.Line(geometry, material);
            this.group.add(this.line);
            
            // Create glow line (thicker, more transparent)
            const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
            const glowMaterial = new THREE.LineBasicMaterial({
                color: this.fromColor,
                transparent: true,
                opacity: 0.1,
                blending: THREE.AdditiveBlending
            });
            glowMaterial.userData.targetOpacity = 0.1;
            
            this.glowLine = new THREE.Line(glowGeometry, glowMaterial);
            this.glowLine.scale.setScalar(1.5);
            this.group.add(this.glowLine);
        }
        
        // Store curve for particle animation
        this.curve = curve;
    }
    
    createParticles() {
        const particleCount = 20;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const progress = new Float32Array(particleCount);
        const speeds = new Float32Array(particleCount);
        
        for (let i = 0; i < particleCount; i++) {
            progress[i] = i / particleCount;
            speeds[i] = 0.2 + Math.random() * 0.3;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('progress', new THREE.BufferAttribute(progress, 1));
        geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
        
        const material = new THREE.PointsMaterial({
            color: this.fromColor,
            size: 0.4,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        material.userData.targetOpacity = 0.8;
        
        this.particles = new THREE.Points(geometry, material);
        this.particleProgress = progress;
        this.particleSpeeds = speeds;
        
        this.group.add(this.particles);
    }
    
    setMutual(isMutual) {
        if (this.isMutual === isMutual) return;
        this.isMutual = isMutual;
        
        const style = isMutual ? CONNECTION_STYLES.mutual : CONNECTION_STYLES.oneWay;
        const color = isMutual ? blendColors(this.fromColor, this.toColor) : this.fromColor;
        
        if (this.line) {
            gsap.to(this.line.material, {
                opacity: style.opacity,
                duration: 0.3
            });
            gsap.to(this.line.material.color, {
                r: ((color >> 16) & 255) / 255,
                g: ((color >> 8) & 255) / 255,
                b: (color & 255) / 255,
                duration: 0.3
            });
        }
        
        if (this.particles) {
            gsap.to(this.particles.material.color, {
                r: ((color >> 16) & 255) / 255,
                g: ((color >> 8) & 255) / 255,
                b: (color & 255) / 255,
                duration: 0.3
            });
            
            // Increase particle size for mutual
            gsap.to(this.particles.material, {
                size: isMutual ? 0.6 : 0.4,
                duration: 0.3
            });
        }
        
        if (this.glowLine) {
            gsap.to(this.glowLine.material, {
                opacity: isMutual ? 0.25 : 0.1,
                duration: 0.3
            });
        }
    }
    
    animate(delta, elapsed) {
        if (this.isDisposing) return;
        
        // Update curve positions (users might have moved)
        this.updateCurve();
        
        // Animate particles along the curve
        if (this.particles && this.curve) {
            const positions = this.particles.geometry.attributes.position.array;
            const particleCount = this.particleProgress.length;
            
            for (let i = 0; i < particleCount; i++) {
                // Update progress
                const speed = this.particleSpeeds[i] * delta * (this.isMutual ? 1.5 : 1.0);
                this.particleProgress[i] = (this.particleProgress[i] + speed) % 1;
                
                // Get position on curve
                let t = this.particleProgress[i];
                
                // For mutual connections, some particles go the other direction
                if (this.isMutual && i >= particleCount / 2) {
                    t = 1 - t;
                }
                
                const point = this.curve.getPoint(t);
                positions[i * 3] = point.x;
                positions[i * 3 + 1] = point.y;
                positions[i * 3 + 2] = point.z;
            }
            
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Pulse effect
        if (this.line) {
            const pulse = 1 + Math.sin(elapsed * 2) * 0.1;
            this.line.material.opacity = (this.isMutual ? CONNECTION_STYLES.mutual.opacity : CONNECTION_STYLES.oneWay.opacity) * pulse;
        }
    }
    
    fadeOut(callback) {
        this.isDisposing = true;
        
        this.group.traverse(obj => {
            if (obj.material) {
                gsap.to(obj.material, {
                    opacity: 0,
                    duration: 0.3,
                    onComplete: () => {
                        if (callback && obj === this.line) {
                            callback();
                        }
                    }
                });
            }
        });
    }
    
    dispose() {
        this.isDisposing = true;
        
        // Remove from scene
        this.scene.remove(this.group);
        
        // Dispose geometries and materials
        if (this.line) {
            this.line.geometry.dispose();
            this.line.material.dispose();
        }
        
        if (this.glowLine) {
            this.glowLine.geometry.dispose();
            this.glowLine.material.dispose();
        }
        
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
    }
}
