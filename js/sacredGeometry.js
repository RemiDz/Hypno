/* ============================================
   HYPNO - Sacred Geometry & Binaural Beats
   Beautiful, authentic sacred geometric patterns
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

// Golden ratio
const PHI = 1.618033988749895;

/**
 * Sacred Geometry Group - Beautiful, authentic sacred geometry
 */
export class SacredGeometryGroup {
    constructor(geometryId, geometryData, scene) {
        this.id = geometryId;
        this.data = geometryData;
        this.scene = scene;
        this.threeScene = scene.scene;
        
        this.group = new THREE.Group();
        this.layers = []; // Multiple layers of geometry
        this.particles = null;
        this.innerGlow = null;
        this.pointLight = null;
        this.outerRings = [];
        
        // Audio
        this.audioContext = null;
        this.oscillators = [];
        this.gainNodes = [];
        this.isAudioPlaying = false;
        this.masterGain = null;
        
        // Animation
        this.rotationSpeed = 0.0003;
        this.pulsePhase = Math.random() * Math.PI * 2;
        
        // Orbital animation for members
        this.orbitSpeed = 0.15; // Radians per second
        this.orbitRadius = 35;
        this.orbitAngle = 0;
        this.memberIds = []; // Track member user IDs for orbital animation
        
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
        
        // Store geometry ID for click detection
        this.group.userData.sacredGeometryId = this.id;
        this.group.userData.isSacredGeometry = true;
        
        // Initialize member list for orbital animation
        this.updateMemberList();
        this.orbitRadius = 35 + this.memberIds.length * 5;
        
        // Create the sacred geometry
        this.createSacredPattern();
        
        // Create clickable hitbox
        this.createHitbox();
        
        // Add to scene
        this.threeScene.add(this.group);
        
        // Animate entry
        this.animateEntry();
    }
    
    createHitbox() {
        // Small sphere at center for click detection (only center is clickable)
        const radius = 8; // Small fixed radius for center-only click
        
        const geometry = new THREE.SphereGeometry(radius, 16, 16);
        const material = new THREE.MeshBasicMaterial({
            transparent: true,
            opacity: 0,
            depthWrite: false
        });
        
        this.hitbox = new THREE.Mesh(geometry, material);
        this.hitbox.userData.sacredGeometryId = this.id;
        this.hitbox.userData.isSacredGeometry = true;
        this.group.add(this.hitbox);
    }
    
    getMemberColors() {
        const colors = [];
        const members = this.data.members || {};
        
        Object.values(members).forEach(member => {
            if (member.intention && INTENTIONS[member.intention]) {
                colors.push(INTENTIONS[member.intention].colorHex);
            }
        });
        
        return colors.length > 0 ? colors : [0x8B5CF6, 0xEC4899];
    }
    
    createSacredPattern() {
        const seed = this.data.seed || Math.random() * 10000;
        const random = this.seededRandom(seed);
        const memberCount = Object.keys(this.data.members || {}).length;
        const colors = this.getMemberColors();
        const primaryColor = colors[0];
        const secondaryColor = colors[1] || colors[0];
        
        // Choose pattern type based on seed
        const patternTypes = [
            () => this.createFlowerOfLife(memberCount, colors),
            () => this.createMetatronsCube(memberCount, colors),
            () => this.createSeedOfLife(memberCount, colors),
            () => this.createSriYantra(memberCount, colors),
            () => this.createGoldenSpiral(memberCount, colors),
            () => this.createMerkaba(memberCount, colors)
        ];
        
        const typeIndex = Math.floor(random() * patternTypes.length);
        patternTypes[typeIndex]();
        
        // Add central glow sphere
        this.createCentralGlow(primaryColor);
        
        // Add outer decorative rings
        this.createOuterRings(colors);
        
        // Add ethereal particles
        this.createEtherealParticles(colors);
        
        // Scale the whole group
        const scale = 1.5 + memberCount * 0.3;
        this.group.scale.setScalar(scale);
    }
    
    seededRandom(seed) {
        let s = seed;
        return function() {
            s = Math.sin(s * 9999) * 10000;
            return s - Math.floor(s);
        };
    }
    
    // ========================
    // Sacred Patterns
    // ========================
    
    createFlowerOfLife(memberCount, colors) {
        const circleCount = 7 + memberCount * 6; // 7, 13, 19, etc.
        const radius = 8;
        const lineWidth = 0.15;
        
        // Central circle
        this.addCircle(0, 0, radius, colors[0], lineWidth);
        
        // First ring of 6 circles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            this.addCircle(x, y, radius, colors[i % colors.length], lineWidth);
        }
        
        // Additional rings for more members
        if (circleCount > 7) {
            // Second layer
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
                const x = Math.cos(angle) * radius * 1.732;
                const y = Math.sin(angle) * radius * 1.732;
                this.addCircle(x, y, radius, colors[(i + 1) % colors.length], lineWidth * 0.8);
            }
            
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const x = Math.cos(angle) * radius * 2;
                const y = Math.sin(angle) * radius * 2;
                this.addCircle(x, y, radius, colors[i % colors.length], lineWidth * 0.8);
            }
        }
        
        if (circleCount > 19) {
            // Third layer for 3+ members
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                const dist = radius * 2.65;
                const x = Math.cos(angle) * dist;
                const y = Math.sin(angle) * dist;
                this.addCircle(x, y, radius, colors[i % colors.length], lineWidth * 0.6);
            }
        }
        
        // Add outer containing circle
        this.addCircle(0, 0, radius * 3.5, colors[0], lineWidth * 0.4, true);
    }
    
    createSeedOfLife(memberCount, colors) {
        const radius = 10;
        const lineWidth = 0.2;
        
        // Central circle
        this.addCircle(0, 0, radius, colors[0], lineWidth);
        
        // 6 surrounding circles
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * radius;
            const y = Math.sin(angle) * radius;
            this.addCircle(x, y, radius, colors[i % colors.length], lineWidth);
        }
        
        // Outer containing circle
        this.addCircle(0, 0, radius * 2, colors[0], lineWidth * 0.5, true);
        
        // Add vesica piscis highlights (intersections)
        this.addVesicaPiscis(radius, colors);
    }
    
    createMetatronsCube(memberCount, colors) {
        const size = 15;
        
        // 13 circles of Fruit of Life
        const positions = [
            [0, 0], // Center
        ];
        
        // Inner ring of 6
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            positions.push([
                Math.cos(angle) * size * 0.5,
                Math.sin(angle) * size * 0.5
            ]);
        }
        
        // Outer ring of 6
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2 + Math.PI / 6;
            positions.push([
                Math.cos(angle) * size,
                Math.sin(angle) * size
            ]);
        }
        
        // Draw circles at each position
        positions.forEach(([x, y], i) => {
            this.addCircle(x, y, 3, colors[i % colors.length], 0.15);
        });
        
        // Connect all circles with lines (Metatron's Cube)
        this.connectAllPoints(positions, colors[0], 0.08);
        
        // Outer hexagram
        this.addHexagram(0, 0, size * 1.3, colors[1] || colors[0], 0.12);
    }
    
    createSriYantra(memberCount, colors) {
        const size = 20;
        
        // Outer square (Bhupura)
        this.addSquareFrame(0, 0, size * 1.5, colors[0], 0.15);
        
        // Outer circle
        this.addCircle(0, 0, size * 1.2, colors[0], 0.12, true);
        
        // Lotus petals (16 outer, 8 inner)
        this.addLotusPetals(0, 0, size, 16, colors[1] || colors[0], 0.1);
        this.addLotusPetals(0, 0, size * 0.7, 8, colors[0], 0.1);
        
        // 9 interlocking triangles
        this.addSriYantraTriangles(0, 0, size * 0.5, colors);
        
        // Central bindu (point)
        this.addCentralBindu(colors[0]);
    }
    
    createGoldenSpiral(memberCount, colors) {
        const spiralCount = 2 + memberCount;
        
        // Create multiple golden spirals
        for (let s = 0; s < spiralCount; s++) {
            const rotation = (s / spiralCount) * Math.PI * 2;
            this.addGoldenSpiral(rotation, colors[s % colors.length], 0.12);
        }
        
        // Add golden rectangles
        this.addGoldenRectangles(colors[0], 0.08);
        
        // Outer circle
        this.addCircle(0, 0, 25, colors[0], 0.1, true);
    }
    
    createMerkaba(memberCount, colors) {
        const size = 15;
        
        // Two interlocking tetrahedra form the 3D Merkaba
        // We'll show the 2D projection - Star of David with depth
        
        // Upward triangle
        this.addTriangle(0, 0, size, true, colors[0], 0.2);
        
        // Downward triangle
        this.addTriangle(0, 0, size, false, colors[1] || colors[0], 0.2);
        
        // Inner triangles (smaller, offset in Z)
        const innerSize = size * 0.6;
        this.addTriangle(0, 0, innerSize, true, colors[0], 0.15, 2);
        this.addTriangle(0, 0, innerSize, false, colors[1] || colors[0], 0.15, -2);
        
        // Central hexagon
        this.addHexagon(0, 0, size * 0.35, colors[0], 0.1);
        
        // Outer circle
        this.addCircle(0, 0, size * 1.3, colors[0], 0.1, true);
    }
    
    // ========================
    // Geometry Helpers
    // ========================
    
    addCircle(x, y, radius, color, lineWidth, isDashed = false) {
        const segments = 128;
        const points = [];
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            points.push(new THREE.Vector3(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                0
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        
        let material;
        if (isDashed) {
            material = new THREE.LineDashedMaterial({
                color: color,
                transparent: true,
                opacity: 0.6,
                dashSize: 1,
                gapSize: 0.5,
                linewidth: lineWidth
            });
        } else {
            material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.8,
                linewidth: lineWidth
            });
        }
        
        const circle = new THREE.Line(geometry, material);
        if (isDashed) {
            circle.computeLineDistances();
        }
        
        this.group.add(circle);
        this.layers.push(circle);
        
        // Add glow effect
        this.addLineGlow(points, color, radius * 0.05);
    }
    
    addLineGlow(points, color, intensity) {
        const glowGeometry = new THREE.BufferGeometry().setFromPoints(points);
        const glowMaterial = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Line(glowGeometry, glowMaterial);
        glow.scale.setScalar(1.02);
        this.group.add(glow);
        this.layers.push(glow);
    }
    
    addTriangle(x, y, size, pointUp, color, lineWidth, zOffset = 0) {
        const points = [];
        const direction = pointUp ? 1 : -1;
        const height = size * Math.sqrt(3) / 2;
        
        // Three vertices
        points.push(new THREE.Vector3(x, y + height * 0.67 * direction, zOffset));
        points.push(new THREE.Vector3(x - size / 2, y - height * 0.33 * direction, zOffset));
        points.push(new THREE.Vector3(x + size / 2, y - height * 0.33 * direction, zOffset));
        points.push(points[0].clone()); // Close the triangle
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            linewidth: lineWidth
        });
        
        const triangle = new THREE.Line(geometry, material);
        this.group.add(triangle);
        this.layers.push(triangle);
        
        // Add fill with low opacity
        const fillGeometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
            points[0].x, points[0].y, points[0].z,
            points[1].x, points[1].y, points[1].z,
            points[2].x, points[2].y, points[2].z
        ]);
        fillGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
        
        const fillMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.1,
            side: THREE.DoubleSide,
            blending: THREE.AdditiveBlending
        });
        
        const fill = new THREE.Mesh(fillGeometry, fillMaterial);
        this.group.add(fill);
        this.layers.push(fill);
    }
    
    addHexagon(x, y, size, color, lineWidth) {
        const points = [];
        
        for (let i = 0; i <= 6; i++) {
            const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
            points.push(new THREE.Vector3(
                x + Math.cos(angle) * size,
                y + Math.sin(angle) * size,
                0
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.8,
            linewidth: lineWidth
        });
        
        const hexagon = new THREE.Line(geometry, material);
        this.group.add(hexagon);
        this.layers.push(hexagon);
    }
    
    addHexagram(x, y, size, color, lineWidth) {
        // Star of David - two overlapping triangles
        this.addTriangle(x, y, size, true, color, lineWidth);
        this.addTriangle(x, y, size, false, color, lineWidth);
    }
    
    addSquareFrame(x, y, size, color, lineWidth) {
        const halfSize = size / 2;
        const points = [
            new THREE.Vector3(x - halfSize, y - halfSize, 0),
            new THREE.Vector3(x + halfSize, y - halfSize, 0),
            new THREE.Vector3(x + halfSize, y + halfSize, 0),
            new THREE.Vector3(x - halfSize, y + halfSize, 0),
            new THREE.Vector3(x - halfSize, y - halfSize, 0)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            linewidth: lineWidth
        });
        
        const square = new THREE.Line(geometry, material);
        this.group.add(square);
        this.layers.push(square);
        
        // Gate openings (T-shapes on each side)
        this.addGateOpening(x, y - halfSize, size * 0.15, 0, color, lineWidth);
        this.addGateOpening(x, y + halfSize, size * 0.15, Math.PI, color, lineWidth);
        this.addGateOpening(x - halfSize, y, size * 0.15, Math.PI / 2, color, lineWidth);
        this.addGateOpening(x + halfSize, y, size * 0.15, -Math.PI / 2, color, lineWidth);
    }
    
    addGateOpening(x, y, size, rotation, color, lineWidth) {
        const points = [
            new THREE.Vector3(-size, 0, 0),
            new THREE.Vector3(-size, size, 0),
            new THREE.Vector3(-size * 0.3, size, 0),
            new THREE.Vector3(-size * 0.3, size * 0.4, 0),
            new THREE.Vector3(size * 0.3, size * 0.4, 0),
            new THREE.Vector3(size * 0.3, size, 0),
            new THREE.Vector3(size, size, 0),
            new THREE.Vector3(size, 0, 0)
        ];
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            linewidth: lineWidth
        });
        
        const gate = new THREE.Line(geometry, material);
        gate.position.set(x, y, 0);
        gate.rotation.z = rotation;
        this.group.add(gate);
        this.layers.push(gate);
    }
    
    addLotusPetals(x, y, radius, petalCount, color, lineWidth) {
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            this.addPetal(x, y, radius, angle, color, lineWidth);
        }
    }
    
    addPetal(cx, cy, radius, angle, color, lineWidth) {
        const points = [];
        const petalLength = radius * 0.25;
        const petalWidth = Math.PI / 16;
        
        // Petal shape using bezier-like curve
        const segments = 20;
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const petalAngle = angle - petalWidth + t * petalWidth * 2;
            const r = radius + Math.sin(t * Math.PI) * petalLength;
            
            points.push(new THREE.Vector3(
                cx + Math.cos(petalAngle) * r,
                cy + Math.sin(petalAngle) * r,
                0
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.6,
            linewidth: lineWidth
        });
        
        const petal = new THREE.Line(geometry, material);
        this.group.add(petal);
        this.layers.push(petal);
    }
    
    addSriYantraTriangles(x, y, size, colors) {
        // Simplified Sri Yantra - 4 upward + 5 downward triangles
        const upScales = [1, 0.75, 0.5, 0.25];
        const downScales = [0.9, 0.65, 0.45, 0.3, 0.15];
        
        upScales.forEach((scale, i) => {
            this.addTriangle(x, y, size * scale, true, colors[i % colors.length], 0.12);
        });
        
        downScales.forEach((scale, i) => {
            this.addTriangle(x, y, size * scale, false, colors[(i + 1) % colors.length], 0.12);
        });
    }
    
    addCentralBindu(color) {
        // Central point/sphere
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9
        });
        
        const bindu = new THREE.Mesh(geometry, material);
        this.group.add(bindu);
        this.layers.push(bindu);
        
        // Glow around bindu
        const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });
        
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        this.group.add(glow);
        this.layers.push(glow);
    }
    
    addGoldenSpiral(rotation, color, lineWidth) {
        const points = [];
        const turns = 4;
        const segments = turns * 64;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * turns * Math.PI * 2 + rotation;
            const r = Math.pow(PHI, t * turns * 2) * 0.5;
            
            points.push(new THREE.Vector3(
                Math.cos(angle) * r,
                Math.sin(angle) * r,
                0
            ));
        }
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const material = new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.7,
            linewidth: lineWidth
        });
        
        const spiral = new THREE.Line(geometry, material);
        this.group.add(spiral);
        this.layers.push(spiral);
    }
    
    addGoldenRectangles(color, lineWidth) {
        // Nested golden rectangles
        const rects = 6;
        let w = 20;
        let h = w / PHI;
        let x = 0;
        let y = 0;
        
        for (let i = 0; i < rects; i++) {
            const halfW = w / 2;
            const halfH = h / 2;
            
            const points = [
                new THREE.Vector3(x - halfW, y - halfH, 0),
                new THREE.Vector3(x + halfW, y - halfH, 0),
                new THREE.Vector3(x + halfW, y + halfH, 0),
                new THREE.Vector3(x - halfW, y + halfH, 0),
                new THREE.Vector3(x - halfW, y - halfH, 0)
            ];
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.4 + (rects - i) * 0.1,
                linewidth: lineWidth
            });
            
            const rect = new THREE.Line(geometry, material);
            this.group.add(rect);
            this.layers.push(rect);
            
            // Prepare for next rectangle
            const newW = h;
            const newH = w - h;
            
            // Offset for next rectangle
            const dir = i % 4;
            if (dir === 0) x += (w - newW) / 2;
            else if (dir === 1) y += (h - newH) / 2;
            else if (dir === 2) x -= (w - newW) / 2;
            else y -= (h - newH) / 2;
            
            w = newW;
            h = newH;
        }
    }
    
    addVesicaPiscis(radius, colors) {
        // Highlight the vesica piscis (intersections)
        for (let i = 0; i < 6; i++) {
            const angle1 = (i / 6) * Math.PI * 2;
            const angle2 = ((i + 1) / 6) * Math.PI * 2;
            
            // Midpoint between adjacent circles
            const mx = (Math.cos(angle1) + Math.cos(angle2)) * radius / 2;
            const my = (Math.sin(angle1) + Math.sin(angle2)) * radius / 2;
            
            // Small glowing point at intersection
            const dotGeometry = new THREE.CircleGeometry(0.3, 16);
            const dotMaterial = new THREE.MeshBasicMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 0.8
            });
            
            const dot = new THREE.Mesh(dotGeometry, dotMaterial);
            dot.position.set(mx, my, 0.1);
            this.group.add(dot);
            this.layers.push(dot);
        }
    }
    
    connectAllPoints(positions, color, lineWidth) {
        // Draw lines connecting all points (Metatron's Cube)
        for (let i = 0; i < positions.length; i++) {
            for (let j = i + 1; j < positions.length; j++) {
                const points = [
                    new THREE.Vector3(positions[i][0], positions[i][1], 0),
                    new THREE.Vector3(positions[j][0], positions[j][1], 0)
                ];
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: color,
                    transparent: true,
                    opacity: 0.3,
                    linewidth: lineWidth
                });
                
                const line = new THREE.Line(geometry, material);
                this.group.add(line);
                this.layers.push(line);
            }
        }
    }
    
    // ========================
    // Effects
    // ========================
    
    createCentralGlow(color) {
        // Create a small bright point at center (no solid sphere)
        const dotGeometry = new THREE.CircleGeometry(1.5, 32);
        const dotMaterial = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        });
        
        this.innerGlow = new THREE.Mesh(dotGeometry, dotMaterial);
        this.group.add(this.innerGlow);
        
        // Add point light for actual glow effect
        this.pointLight = new THREE.PointLight(color, 0.5, 100);
        this.pointLight.position.set(0, 0, 0);
        this.group.add(this.pointLight);
        
        // Add concentric glowing rings instead of solid spheres
        for (let i = 1; i <= 4; i++) {
            const ringRadius = 2 + i * 1.5;
            const ringGeometry = new THREE.RingGeometry(ringRadius - 0.1, ringRadius + 0.1, 64);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.3 / i,
                side: THREE.DoubleSide,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Mesh(ringGeometry, ringMaterial);
            this.group.add(ring);
            this.layers.push(ring);
        }
    }
    
    createOuterRings(colors) {
        const ringCount = 3;
        
        for (let i = 0; i < ringCount; i++) {
            const radius = 28 + i * 6;
            // Use thin line rings instead of mesh rings
            const points = [];
            const segments = 128;
            
            for (let j = 0; j <= segments; j++) {
                const angle = (j / segments) * Math.PI * 2;
                points.push(new THREE.Vector3(
                    Math.cos(angle) * radius,
                    Math.sin(angle) * radius,
                    0
                ));
            }
            
            const geometry = new THREE.BufferGeometry().setFromPoints(points);
            const material = new THREE.LineBasicMaterial({
                color: colors[i % colors.length],
                transparent: true,
                opacity: 0.25 - i * 0.05,
                blending: THREE.AdditiveBlending
            });
            
            const ring = new THREE.Line(geometry, material);
            this.group.add(ring);
            this.outerRings.push(ring);
        }
    }
    
    createEtherealParticles(colors) {
        const memberCount = Object.keys(this.data.members || {}).length;
        const particleCount = 150 + memberCount * 50;
        
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colorArray = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            // Distribute in a ring pattern (avoid center)
            const minRadius = 8;
            const maxRadius = 35;
            const r = minRadius + Math.random() * (maxRadius - minRadius);
            const theta = Math.random() * Math.PI * 2;
            
            positions[i * 3] = Math.cos(theta) * r;
            positions[i * 3 + 1] = Math.sin(theta) * r;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 3;
            
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
            size: 0.6,
            vertexColors: true,
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.group.add(this.particles);
    }
    
    animateEntry() {
        this.group.scale.setScalar(0);
        
        // Each layer fades in with delay
        this.layers.forEach((layer, i) => {
            if (layer.material) {
                const targetOpacity = layer.material.opacity;
                layer.material.opacity = 0;
                
                gsap.to(layer.material, {
                    opacity: targetOpacity,
                    duration: 1.5,
                    delay: i * 0.05,
                    ease: 'power2.out'
                });
            }
        });
        
        gsap.to(this.group.scale, {
            x: 1,
            y: 1,
            z: 1,
            duration: 2,
            ease: 'elastic.out(1, 0.5)'
        });
        
        gsap.from(this.group.rotation, {
            z: Math.PI,
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
            
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.15;
            this.masterGain.connect(this.audioContext.destination);
            
            const members = this.data.members || {};
            const activeMembers = Object.values(members).filter(m => !m.pending);
            
            if (activeMembers.length === 0) return;
            
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
            
            const leftOsc = this.audioContext.createOscillator();
            const rightOsc = this.audioContext.createOscillator();
            
            leftOsc.type = 'sine';
            rightOsc.type = 'sine';
            
            leftOsc.frequency.value = baseFreq;
            rightOsc.frequency.value = baseFreq + beatFreq;
            
            const leftPan = this.audioContext.createStereoPanner();
            const rightPan = this.audioContext.createStereoPanner();
            
            leftPan.pan.value = -1;
            rightPan.pan.value = 1;
            
            const leftGain = this.audioContext.createGain();
            const rightGain = this.audioContext.createGain();
            
            leftGain.gain.value = 0.5;
            rightGain.gain.value = 0.5;
            
            leftOsc.connect(leftGain);
            leftGain.connect(leftPan);
            leftPan.connect(this.masterGain);
            
            rightOsc.connect(rightGain);
            rightGain.connect(rightPan);
            rightPan.connect(this.masterGain);
            
            leftOsc.start();
            rightOsc.start();
            
            this.oscillators = [leftOsc, rightOsc];
            this.gainNodes = [leftGain, rightGain];
            this.isAudioPlaying = true;
            
            this.masterGain.gain.setValueAtTime(0, this.audioContext.currentTime);
            this.masterGain.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 2);
            
            console.log(`🎵 Binaural beats: ${baseFreq}Hz base, ${beatFreq}Hz beat frequency`);
            
        } catch (error) {
            console.error('Error starting binaural beats:', error);
        }
    }
    
    stopBinauralBeats() {
        if (!this.isAudioPlaying || !this.audioContext) return;
        
        if (this.masterGain) {
            this.masterGain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1);
        }
        
        setTimeout(() => {
            this.oscillators.forEach(osc => {
                try { osc.stop(); } catch (e) {}
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
        
        // Update member list for orbital animation
        this.updateMemberList();
        
        // Update orbit radius based on member count
        this.orbitRadius = 35 + newMemberCount * 5;
        
        if (newMemberCount !== oldMemberCount) {
            this.rebuildGeometry();
            
            if (this.isAudioPlaying) {
                this.updateBinauralBeats();
            }
        }
        
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
        // Remove old layers
        this.layers.forEach(layer => {
            this.group.remove(layer);
            if (layer.geometry) layer.geometry.dispose();
            if (layer.material) layer.material.dispose();
        });
        this.layers = [];
        
        this.outerRings.forEach(ring => {
            this.group.remove(ring);
            if (ring.geometry) ring.geometry.dispose();
            if (ring.material) ring.material.dispose();
        });
        this.outerRings = [];
        
        if (this.particles) {
            this.group.remove(this.particles);
            this.particles.geometry.dispose();
            this.particles.material.dispose();
            this.particles = null;
        }
        
        if (this.innerGlow) {
            this.group.remove(this.innerGlow);
            this.innerGlow.geometry.dispose();
            this.innerGlow.material.dispose();
            this.innerGlow = null;
        }
        
        if (this.pointLight) {
            this.group.remove(this.pointLight);
            this.pointLight.dispose();
            this.pointLight = null;
        }
        
        // Recreate
        this.createSacredPattern();
    }
    
    animate(delta, elapsed) {
        // Gentle rotation of the whole pattern
        this.group.rotation.z += this.rotationSpeed;
        
        // Update orbit angle
        this.orbitAngle += this.orbitSpeed * delta;
        
        // Animate members orbiting around the geometry
        this.animateMemberOrbits(elapsed);
        
        // Counter-rotate particles
        if (this.particles) {
            this.particles.rotation.z -= this.rotationSpeed * 2;
            
            // Gentle floating motion
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 2] = Math.sin(elapsed * 0.5 + i) * 2;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Pulse outer rings
        this.outerRings.forEach((ring, i) => {
            const pulse = 1 + Math.sin(elapsed * 0.3 + i * 0.5) * 0.02;
            ring.scale.setScalar(pulse);
        });
        
        // Pulse inner glow and point light
        if (this.innerGlow) {
            const glowPulse = 1 + Math.sin(elapsed * 0.5) * 0.2;
            this.innerGlow.scale.setScalar(glowPulse);
            
            // Also pulse the material opacity
            const opacityPulse = 0.7 + Math.sin(elapsed * 0.5) * 0.2;
            this.innerGlow.material.opacity = opacityPulse;
        }
        
        if (this.pointLight) {
            const lightPulse = 0.4 + Math.sin(elapsed * 0.5) * 0.2;
            this.pointLight.intensity = lightPulse;
        }
        
        // Subtle opacity pulse on layers
        this.layers.forEach((layer, i) => {
            if (layer.material && layer.material.opacity !== undefined) {
                const baseOpacity = layer.userData?.baseOpacity || layer.material.opacity;
                if (!layer.userData) layer.userData = {};
                layer.userData.baseOpacity = baseOpacity;
                
                const pulse = Math.sin(elapsed * 0.4 + i * 0.1) * 0.1;
                layer.material.opacity = Math.max(0.05, Math.min(1, baseOpacity + pulse));
            }
        });
    }
    
    animateMemberOrbits(elapsed) {
        if (!this.scene || !this.scene.users || !this.data.center) return;
        
        // Get active member IDs from geometry data
        const members = this.data.members || {};
        const activeMemberIds = Object.keys(members).filter(id => !members[id].pending);
        
        if (activeMemberIds.length === 0) return;
        
        const center = this.data.center;
        const memberCount = activeMemberIds.length;
        
        // Calculate orbit radius based on member count
        const radius = this.orbitRadius + memberCount * 5;
        
        // Animate each member
        activeMemberIds.forEach((memberId, index) => {
            const userShape = this.scene.users.get(memberId);
            if (!userShape || !userShape.group) return;
            
            // Calculate position on orbit
            // Each member is evenly spaced, plus the global orbit angle
            const angleOffset = (index / memberCount) * Math.PI * 2;
            const angle = this.orbitAngle + angleOffset;
            
            // Add gentle vertical oscillation for cinematic effect
            const verticalOffset = Math.sin(elapsed * 0.3 + index * 1.5) * 3;
            
            // Calculate target position
            const targetX = center.x + Math.cos(angle) * radius;
            const targetY = center.y + verticalOffset;
            const targetZ = center.z + Math.sin(angle) * radius;
            
            // Smoothly interpolate to target position
            const currentPos = userShape.group.position;
            const lerpFactor = 0.05; // Smooth interpolation
            
            userShape.group.position.x += (targetX - currentPos.x) * lerpFactor;
            userShape.group.position.y += (targetY - currentPos.y) * lerpFactor;
            userShape.group.position.z += (targetZ - currentPos.z) * lerpFactor;
            
            // Update data position as well
            userShape.data.position = {
                x: userShape.group.position.x,
                y: userShape.group.position.y,
                z: userShape.group.position.z
            };
        });
    }
    
    // Update member list when geometry data changes
    updateMemberList() {
        const members = this.data.members || {};
        this.memberIds = Object.keys(members).filter(id => !members[id].pending);
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
        
        this.threeScene.remove(this.group);
        
        this.layers.forEach(layer => {
            if (layer.geometry) layer.geometry.dispose();
            if (layer.material) layer.material.dispose();
        });
        
        this.outerRings.forEach(ring => {
            if (ring.geometry) ring.geometry.dispose();
            if (ring.material) ring.material.dispose();
        });
        
        if (this.particles) {
            this.particles.geometry.dispose();
            this.particles.material.dispose();
        }
        
        if (this.innerGlow) {
            this.innerGlow.geometry.dispose();
            this.innerGlow.material.dispose();
        }
        
        if (this.pointLight) {
            this.pointLight.dispose();
        }
    }
    
    // ========================
    // Member Position Management
    // ========================
    
    getMemberPosition(index, total) {
        const radius = 35 + total * 5;
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
