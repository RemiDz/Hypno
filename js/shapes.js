/* ============================================
   HYPNO - Shape Geometries for Intentions
   ============================================ */

import { INTENTIONS, SCENE_CONFIG } from './config.js';

/**
 * Create shape geometry based on intention type
 */
export function createShapeGeometry(intention) {
    const intentionData = INTENTIONS[intention];
    if (!intentionData) return createOrbit();
    
    switch (intentionData.shape) {
        case 'orbit':
            return createOrbit();
        case 'sphere':
            return createSphere();
        case 'heart':
            return createHeart();
        case 'octahedron':
            return createOctahedron();
        case 'star':
            return createStar();
        case 'spiral':
            return createSpiral();
        case 'phoenix':
            return createPhoenix();
        case 'lotus':
            return createLotus();
        case 'pyramid':
            return createPyramid();
        case 'infinity':
            return createInfinity();
        // NEW SHAPES
        case 'cloud':
            return createCloud();
        case 'cube':
            return createCube();
        case 'wave':
            return createWave();
        case 'shield':
            return createShield();
        case 'dodecahedron':
            return createDodecahedron();
        default:
            return createOrbit();
    }
}

/**
 * Create material for shapes
 */
export function createShapeMaterial(color, emissiveIntensity = 0.3) {
    return new THREE.MeshStandardMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: emissiveIntensity,
        metalness: 0.3,
        roughness: 0.4,
        transparent: true,
        opacity: 0.95
    });
}

/**
 * Create glow material for outer layer
 */
export function createGlowMaterial(color) {
    return new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.15,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending
    });
}

// ============================================
// Shape Geometry Functions - All Symmetrical & Beautiful
// ============================================

/**
 * Orbit (Observer) - Elegant triple-ring orbital system
 */
function createOrbit() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const ringCount = 3;
    const segments = 64;
    const tubeRadius = 0.08;
    const tubeSegments = 8;
    
    for (let ring = 0; ring < ringCount; ring++) {
        const ringRadius = 1.0 + ring * 0.15;
        const tiltAngle = (ring * Math.PI) / ringCount;
        
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            
            // Ring center point
            const cx = Math.cos(angle) * ringRadius;
            const cy = Math.sin(angle) * Math.sin(tiltAngle) * ringRadius * 0.3;
            const cz = Math.sin(angle) * Math.cos(tiltAngle) * ringRadius;
            
            // Create tube around ring
            for (let j = 0; j <= tubeSegments; j++) {
                const tubeAngle = (j / tubeSegments) * Math.PI * 2;
                const nx = Math.cos(angle);
                const nz = Math.sin(angle);
                
                const x = cx + Math.cos(tubeAngle) * tubeRadius * nx;
                const y = cy + Math.sin(tubeAngle) * tubeRadius;
                const z = cz + Math.cos(tubeAngle) * tubeRadius * nz;
                
                vertices.push(x, y, z);
            }
        }
    }
    
    // Use torus for simplicity and perfect symmetry
    const torus = new THREE.TorusGeometry(1.2, 0.1, 16, 64);
    return torus;
}

/**
 * Sphere (Peace) - Perfect smooth sphere with subtle facets
 */
function createSphere() {
    const geometry = new THREE.IcosahedronGeometry(1.2, 3);
    return geometry;
}

/**
 * Heart (Love) - Perfectly symmetrical 3D heart
 */
function createHeart() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const segments = 64;
    const rings = 32;
    
    // Parametric heart surface
    for (let i = 0; i <= rings; i++) {
        const v = (i / rings) * Math.PI;
        
        for (let j = 0; j <= segments; j++) {
            const u = (j / segments) * Math.PI * 2;
            
            // Heart surface equations
            const x = Math.sin(v) * (15 * Math.sin(u) - 4 * Math.sin(3 * u));
            const y = 8 * Math.cos(v);
            const z = Math.sin(v) * (15 * Math.cos(u) - 5 * Math.cos(2 * u) - 2 * Math.cos(3 * u) - Math.cos(4 * u));
            
            vertices.push(x * 0.06, y * 0.06, z * 0.06);
        }
    }
    
    // Create indices
    for (let i = 0; i < rings; i++) {
        for (let j = 0; j < segments; j++) {
            const a = i * (segments + 1) + j;
            const b = a + segments + 1;
            
            indices.push(a, b, a + 1);
            indices.push(b, b + 1, a + 1);
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.center();
    geometry.scale(1.3, 1.3, 1.3);
    
    return geometry;
}

/**
 * Octahedron (Clarity) - Perfect crystal diamond
 */
function createOctahedron() {
    const geometry = new THREE.OctahedronGeometry(1.3, 0);
    return geometry;
}

/**
 * Star (Creativity) - Beautiful 12-pointed star
 */
function createStar() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const points = 12;
    const innerRadius = 0.5;
    const outerRadius = 1.3;
    const depth = 0.4;
    
    // Create star points
    for (let i = 0; i < points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const nextAngle = ((i + 1) / points) * Math.PI * 2;
        const midAngle = angle + Math.PI / points;
        
        // Outer point
        const ox = Math.cos(angle) * outerRadius;
        const oz = Math.sin(angle) * outerRadius;
        
        // Inner points
        const ix = Math.cos(midAngle) * innerRadius;
        const iz = Math.sin(midAngle) * innerRadius;
        
        const baseIdx = vertices.length / 3;
        
        // Front face vertices
        vertices.push(ox, 0, oz);           // outer point
        vertices.push(ix, depth, iz);       // inner top
        vertices.push(ix, -depth, iz);      // inner bottom
        vertices.push(0, 0, 0);             // center
        
        // Front triangles
        indices.push(baseIdx, baseIdx + 1, baseIdx + 3);
        indices.push(baseIdx, baseIdx + 3, baseIdx + 2);
        indices.push(baseIdx + 1, baseIdx + 2, baseIdx + 3);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
}

/**
 * Spiral (Transcendence) - Elegant double helix
 */
function createSpiral() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const turns = 2;
    const segments = 100;
    const tubeRadius = 0.1;
    const tubeSegments = 8;
    const helixRadius = 0.6;
    const height = 2.5;
    
    // Create two intertwined helixes
    for (let helix = 0; helix < 2; helix++) {
        const offset = helix * Math.PI;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 2 * turns + offset;
            
            const cx = Math.cos(angle) * helixRadius;
            const cy = (t - 0.5) * height;
            const cz = Math.sin(angle) * helixRadius;
            
            // Tangent for tube orientation
            const tx = -Math.sin(angle);
            const tz = Math.cos(angle);
            
            for (let j = 0; j <= tubeSegments; j++) {
                const tubeAngle = (j / tubeSegments) * Math.PI * 2;
                
                const x = cx + Math.cos(tubeAngle) * tubeRadius * tx;
                const y = cy + Math.sin(tubeAngle) * tubeRadius;
                const z = cz + Math.cos(tubeAngle) * tubeRadius * tz;
                
                vertices.push(x, y, z);
                
                if (i < segments && j < tubeSegments) {
                    const a = (helix * (segments + 1) + i) * (tubeSegments + 1) + j;
                    const b = a + tubeSegments + 1;
                    
                    indices.push(a, b, a + 1);
                    indices.push(b, b + 1, a + 1);
                }
            }
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
}

/**
 * Phoenix (Transformation) - Symmetrical flame with wings
 */
function createPhoenix() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const flameSegments = 8;
    const flameRings = 16;
    
    // Create symmetrical flame body
    for (let i = 0; i <= flameRings; i++) {
        const t = i / flameRings;
        const y = t * 2.5 - 0.5;
        
        // Flame profile - wider at bottom, pointed at top
        const radius = Math.sin(t * Math.PI) * (1 - t * 0.5) * 0.8;
        
        for (let j = 0; j <= flameSegments; j++) {
            const angle = (j / flameSegments) * Math.PI * 2;
            
            // Add gentle wave for flame effect
            const wave = Math.sin(angle * 3 + t * 4) * 0.1 * (1 - t);
            const r = radius + wave;
            
            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            
            vertices.push(x, y, z);
            
            if (i < flameRings && j < flameSegments) {
                const a = i * (flameSegments + 1) + j;
                const b = a + flameSegments + 1;
                
                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
            }
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.center();
    
    return geometry;
}

/**
 * Lotus (Healing) - Beautiful layered flower with many petals
 */
function createLotus() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const petalCount = 12;
    const layers = 4;
    
    // Center dome
    const domeSegments = 16;
    const domeRadius = 0.25;
    
    for (let i = 0; i <= domeSegments / 2; i++) {
        const phi = (i / (domeSegments / 2)) * Math.PI / 2;
        
        for (let j = 0; j <= domeSegments; j++) {
            const theta = (j / domeSegments) * Math.PI * 2;
            
            const x = Math.cos(theta) * Math.sin(phi) * domeRadius;
            const y = Math.cos(phi) * domeRadius + 0.1;
            const z = Math.sin(theta) * Math.sin(phi) * domeRadius;
            
            vertices.push(x, y, z);
            
            if (i < domeSegments / 2 && j < domeSegments) {
                const a = i * (domeSegments + 1) + j;
                const b = a + domeSegments + 1;
                
                indices.push(a, b, a + 1);
                indices.push(b, b + 1, a + 1);
            }
        }
    }
    
    // Create petals in layers
    for (let layer = 0; layer < layers; layer++) {
        const layerScale = 1 - layer * 0.15;
        const layerHeight = layer * 0.12;
        const layerRotation = (layer * Math.PI) / petalCount;
        const petalLength = 1.1 * layerScale;
        const petalWidth = 0.35 * layerScale;
        const curlAmount = 0.3 + layer * 0.1;
        
        for (let p = 0; p < petalCount; p++) {
            const baseAngle = (p / petalCount) * Math.PI * 2 + layerRotation;
            const petalSegments = 8;
            const baseIdx = vertices.length / 3;
            
            // Create curved petal
            for (let i = 0; i <= petalSegments; i++) {
                const t = i / petalSegments;
                const dist = t * petalLength;
                const width = Math.sin(t * Math.PI) * petalWidth;
                const curl = t * t * curlAmount;
                
                // Left edge
                const lAngle = baseAngle - Math.atan2(width, dist);
                const lDist = Math.sqrt(dist * dist + width * width) * 0.5;
                vertices.push(
                    Math.cos(lAngle) * (0.2 + dist),
                    layerHeight + curl,
                    Math.sin(lAngle) * (0.2 + dist)
                );
                
                // Right edge
                const rAngle = baseAngle + Math.atan2(width, dist);
                vertices.push(
                    Math.cos(rAngle) * (0.2 + dist),
                    layerHeight + curl,
                    Math.sin(rAngle) * (0.2 + dist)
                );
            }
            
            // Create triangles
            for (let i = 0; i < petalSegments; i++) {
                const a = baseIdx + i * 2;
                
                indices.push(a, a + 2, a + 1);
                indices.push(a + 1, a + 2, a + 3);
            }
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.scale(1.2, 1.2, 1.2);
    
    return geometry;
}

/**
 * Pyramid (Wisdom) - Perfect 4-sided pyramid
 */
function createPyramid() {
    const geometry = new THREE.ConeGeometry(1.2, 2, 4);
    geometry.rotateY(Math.PI / 4); // Align edges
    return geometry;
}

/**
 * Infinity (Unity) - Smooth figure-8 torus knot
 */
function createInfinity() {
    // Lemniscate of Bernoulli (figure 8)
    class InfinityCurve extends THREE.Curve {
        getPoint(t) {
            const a = 1.2;
            const angle = t * Math.PI * 2;
            const denom = 1 + Math.sin(angle) * Math.sin(angle);
            
            return new THREE.Vector3(
                (a * Math.cos(angle)) / denom,
                0,
                (a * Math.sin(angle) * Math.cos(angle)) / denom
            );
        }
    }
    
    const curve = new InfinityCurve();
    const geometry = new THREE.TubeGeometry(curve, 128, 0.15, 16, true);
    geometry.scale(1.5, 1.5, 1.5);
    
    return geometry;
}

// ============================================
// NEW SHAPES - All Symmetrical & Beautiful
// ============================================

/**
 * Cloud (Dream) - Soft symmetrical cloud orbs
 */
function createCloud() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    // Create multiple merged spheres for cloud effect
    const spheres = [
        { x: 0, y: 0, z: 0, r: 0.7 },
        { x: 0.5, y: 0.1, z: 0.3, r: 0.5 },
        { x: -0.5, y: 0.1, z: 0.3, r: 0.5 },
        { x: 0.3, y: 0.1, z: -0.4, r: 0.45 },
        { x: -0.3, y: 0.1, z: -0.4, r: 0.45 },
        { x: 0, y: 0.3, z: 0, r: 0.4 }
    ];
    
    const segments = 16;
    
    spheres.forEach((sphere, sIdx) => {
        const baseIdx = vertices.length / 3;
        
        for (let i = 0; i <= segments; i++) {
            const phi = (i / segments) * Math.PI;
            
            for (let j = 0; j <= segments; j++) {
                const theta = (j / segments) * Math.PI * 2;
                
                const x = sphere.x + Math.cos(theta) * Math.sin(phi) * sphere.r;
                const y = sphere.y + Math.cos(phi) * sphere.r;
                const z = sphere.z + Math.sin(theta) * Math.sin(phi) * sphere.r;
                
                vertices.push(x, y, z);
                
                if (i < segments && j < segments) {
                    const a = baseIdx + i * (segments + 1) + j;
                    const b = a + segments + 1;
                    
                    indices.push(a, b, a + 1);
                    indices.push(b, b + 1, a + 1);
                }
            }
        }
    });
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.scale(1.3, 1.3, 1.3);
    
    return geometry;
}

/**
 * Cube (Strength) - Perfect beveled cube
 */
function createCube() {
    const geometry = new THREE.BoxGeometry(1.4, 1.4, 1.4, 1, 1, 1);
    return geometry;
}

/**
 * Wave (Flow) - Symmetrical flowing ribbon
 */
function createWave() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const segments = 64;
    const width = 0.4;
    const amplitude = 0.5;
    const length = 3;
    
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        const x = (t - 0.5) * length;
        const y = Math.sin(t * Math.PI * 2) * amplitude;
        const z = Math.cos(t * Math.PI * 2) * 0.2;
        
        // Create ribbon width
        const tangentX = 1;
        const tangentY = Math.cos(t * Math.PI * 2) * amplitude * Math.PI * 2 / length;
        const tangentZ = -Math.sin(t * Math.PI * 2) * 0.2 * Math.PI * 2 / length;
        
        // Normalize and get perpendicular
        const len = Math.sqrt(tangentX * tangentX + tangentY * tangentY + tangentZ * tangentZ);
        const perpY = width / 2;
        
        vertices.push(x, y - perpY, z);
        vertices.push(x, y + perpY, z);
        
        if (i < segments) {
            const a = i * 2;
            indices.push(a, a + 2, a + 1);
            indices.push(a + 1, a + 2, a + 3);
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
}

/**
 * Shield (Protection) - Symmetrical emblem shield
 */
function createShield() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const segments = 32;
    const depth = 0.25;
    
    // Shield profile points (half, will mirror)
    const profile = [];
    for (let i = 0; i <= segments; i++) {
        const t = i / segments;
        let x, y;
        
        if (t < 0.3) {
            // Top curved part
            const angle = (t / 0.3) * Math.PI / 2;
            x = Math.sin(angle) * 0.8;
            y = 1 - (1 - Math.cos(angle)) * 0.3;
        } else {
            // Bottom pointed part
            const bt = (t - 0.3) / 0.7;
            x = 0.8 * (1 - bt);
            y = 1 - 0.3 - bt * 1.7;
        }
        
        profile.push({ x, y });
    }
    
    // Create front and back faces
    const baseVertCount = vertices.length / 3;
    
    // Front face
    for (let i = 0; i < profile.length; i++) {
        vertices.push(profile[i].x, profile[i].y, depth);
        vertices.push(-profile[i].x, profile[i].y, depth);
    }
    
    // Back face
    for (let i = 0; i < profile.length; i++) {
        vertices.push(profile[i].x, profile[i].y, -depth);
        vertices.push(-profile[i].x, profile[i].y, -depth);
    }
    
    // Create triangles
    for (let i = 0; i < profile.length - 1; i++) {
        const f = i * 2;
        const b = profile.length * 2 + i * 2;
        
        // Front face
        indices.push(f, f + 2, f + 1);
        indices.push(f + 1, f + 2, f + 3);
        
        // Back face
        indices.push(b, b + 1, b + 2);
        indices.push(b + 1, b + 3, b + 2);
        
        // Sides
        indices.push(f, b, f + 2);
        indices.push(b, b + 2, f + 2);
        
        indices.push(f + 1, f + 3, b + 1);
        indices.push(b + 1, f + 3, b + 3);
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.center();
    geometry.scale(1.0, 1.0, 1.0);
    
    return geometry;
}

/**
 * Dodecahedron (Abundance) - Perfect 12-faced sacred geometry
 */
function createDodecahedron() {
    const geometry = new THREE.DodecahedronGeometry(1.2, 0);
    return geometry;
}

/**
 * Create a complete shape mesh with material
 */
export function createShapeMesh(intention) {
    const geometry = createShapeGeometry(intention);
    const intentionData = INTENTIONS[intention];
    const color = intentionData ? intentionData.colorHex : 0xFFFFFF;
    
    const material = createShapeMaterial(color);
    const mesh = new THREE.Mesh(geometry, material);
    
    mesh.scale.setScalar(SCENE_CONFIG.shapeScale);
    
    return mesh;
}

/**
 * Create outer glow mesh
 */
export function createGlowMesh(geometry, color) {
    const glowGeometry = geometry.clone();
    const glowMaterial = createGlowMaterial(color);
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    
    glowMesh.scale.setScalar(1.2);
    
    return glowMesh;
}
