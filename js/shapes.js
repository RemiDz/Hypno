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
// Shape Geometry Functions
// ============================================

/**
 * Orbit (Observer) - Torus/ring shape
 */
function createOrbit() {
    const geometry = new THREE.TorusGeometry(1.5, 0.15, 16, 64);
    return geometry;
}

/**
 * Sphere (Peace) - Perfect icosphere
 */
function createSphere() {
    const geometry = new THREE.IcosahedronGeometry(1.2, 2);
    return geometry;
}

/**
 * Heart (Love) - 3D heart shape using parametric approach
 */
function createHeart() {
    const shape = new THREE.Shape();
    
    // Create a proper heart shape using the heart curve equation
    // x = 16 * sin³(t)
    // y = 13 * cos(t) - 5 * cos(2t) - 2 * cos(3t) - cos(4t)
    const scale = 0.06;
    const segments = 50;
    
    // Start at the bottom point of the heart
    const startX = 0;
    const startY = -16 * scale; // Bottom point
    shape.moveTo(startX, startY);
    
    // Draw the heart shape
    for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 2 - Math.PI / 2;
        const x = 16 * Math.pow(Math.sin(t), 3) * scale;
        const y = (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)) * scale;
        
        if (i === 0) {
            shape.moveTo(x, y);
        } else {
            shape.lineTo(x, y);
        }
    }
    
    shape.closePath();
    
    const extrudeSettings = {
        depth: 0.5,
        bevelEnabled: true,
        bevelThickness: 0.15,
        bevelSize: 0.12,
        bevelOffset: 0,
        bevelSegments: 8,
        curveSegments: 32
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    geometry.scale(1.8, 1.8, 1.8);
    geometry.rotateZ(Math.PI); // Flip so point is at bottom
    
    return geometry;
}

/**
 * Octahedron (Clarity) - Diamond/crystal shape
 */
function createOctahedron() {
    const geometry = new THREE.OctahedronGeometry(1.3, 0);
    return geometry;
}

/**
 * Star (Creativity) - Stellated shape with extended points
 */
function createStar() {
    // Create icosahedron and extend every other vertex
    const geometry = new THREE.IcosahedronGeometry(1, 0);
    const positions = geometry.attributes.position;
    const vertices = [];
    
    // Collect unique vertices
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        vertices.push(new THREE.Vector3(x, y, z));
    }
    
    // Extend vertices outward to create star points
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        const length = Math.sqrt(x * x + y * y + z * z);
        
        // Extend every vertex based on position for spiky look
        const extend = 1 + Math.abs(Math.sin(i * 1.5)) * 0.4;
        positions.setXYZ(i, x * extend, y * extend, z * extend);
    }
    
    geometry.computeVertexNormals();
    geometry.scale(1.2, 1.2, 1.2);
    
    return geometry;
}

/**
 * Spiral (Transcendence) - Helix/DNA-like shape
 */
function createSpiral() {
    class SpiralCurve extends THREE.Curve {
        getPoint(t) {
            const angle = t * Math.PI * 4;
            const radius = 0.8 - t * 0.3;
            return new THREE.Vector3(
                Math.cos(angle) * radius,
                t * 3 - 1.5,
                Math.sin(angle) * radius
            );
        }
    }
    
    const curve = new SpiralCurve();
    const geometry = new THREE.TubeGeometry(curve, 64, 0.12, 8, false);
    
    return geometry;
}

/**
 * Phoenix (Transformation) - Flame-like abstract shape
 */
function createPhoenix() {
    // Create a flame-like shape using multiple merged cones
    const group = new THREE.Group();
    
    // Main flame body
    const mainFlame = new THREE.ConeGeometry(0.6, 2, 8);
    mainFlame.translate(0, 0.5, 0);
    
    // Create variations for organic look
    const positions = mainFlame.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Add waviness
        const wave = Math.sin(y * 3) * 0.15;
        positions.setX(i, x + wave * Math.random());
        positions.setZ(i, z + wave * Math.random());
    }
    
    mainFlame.computeVertexNormals();
    
    return mainFlame;
}

/**
 * Lotus (Healing) - Layered petal flower
 */
function createLotus() {
    const geometry = new THREE.BufferGeometry();
    const vertices = [];
    const indices = [];
    
    const petalCount = 8;
    const layers = 3;
    
    // Create petals in layers
    for (let layer = 0; layer < layers; layer++) {
        const layerOffset = layer * 0.15;
        const layerScale = 1 - layer * 0.2;
        const layerRotation = layer * (Math.PI / petalCount);
        
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2 + layerRotation;
            const baseIndex = vertices.length / 3;
            
            // Petal shape points
            const tipX = Math.cos(angle) * 1.2 * layerScale;
            const tipZ = Math.sin(angle) * 1.2 * layerScale;
            const tipY = 0.5 + layerOffset;
            
            const leftX = Math.cos(angle - 0.15) * 0.5 * layerScale;
            const leftZ = Math.sin(angle - 0.15) * 0.5 * layerScale;
            
            const rightX = Math.cos(angle + 0.15) * 0.5 * layerScale;
            const rightZ = Math.sin(angle + 0.15) * 0.5 * layerScale;
            
            const baseY = layerOffset;
            
            // Add vertices for this petal
            vertices.push(
                tipX, tipY, tipZ,           // tip
                leftX, baseY, leftZ,         // left base
                rightX, baseY, rightZ,       // right base
                0, baseY, 0                  // center
            );
            
            // Add triangles
            indices.push(
                baseIndex, baseIndex + 1, baseIndex + 3,
                baseIndex, baseIndex + 3, baseIndex + 2,
                baseIndex, baseIndex + 1, baseIndex + 2
            );
        }
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.scale(1.2, 1.2, 1.2);
    
    return geometry;
}

/**
 * Pyramid (Wisdom) - Tetrahedron shape
 */
function createPyramid() {
    const geometry = new THREE.TetrahedronGeometry(1.5, 0);
    return geometry;
}

/**
 * Infinity (Unity) - Figure-8/Möbius style
 */
function createInfinity() {
    class InfinityCurve extends THREE.Curve {
        getPoint(t) {
            const angle = t * Math.PI * 2;
            const scale = 2 / (3 - Math.cos(2 * angle));
            return new THREE.Vector3(
                scale * Math.cos(angle) * 1.2,
                scale * Math.sin(2 * angle) / 2 * 0.8,
                Math.sin(angle) * 0.3
            );
        }
    }
    
    const curve = new InfinityCurve();
    const geometry = new THREE.TubeGeometry(curve, 100, 0.12, 8, true);
    
    return geometry;
}

// ============================================
// NEW SHAPES
// ============================================

/**
 * Cloud (Dream) - Soft cloud-like shape
 */
function createCloud() {
    const geometry = new THREE.SphereGeometry(1, 16, 16);
    
    // Combine multiple spheres to create cloud effect
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const z = positions.getZ(i);
        
        // Add lumpy cloud-like deformation
        const noise = Math.sin(x * 3) * Math.cos(y * 3) * Math.sin(z * 3) * 0.3;
        const scale = 1 + noise + Math.abs(Math.sin(i * 0.5)) * 0.2;
        
        positions.setXYZ(i, x * scale, y * 0.7 * scale, z * scale);
    }
    
    geometry.computeVertexNormals();
    geometry.scale(1.5, 1, 1.5);
    
    return geometry;
}

/**
 * Cube (Strength) - Solid cube shape
 */
function createCube() {
    const geometry = new THREE.BoxGeometry(1.5, 1.5, 1.5, 2, 2, 2);
    return geometry;
}

/**
 * Wave (Flow) - Flowing wave shape
 */
function createWave() {
    class WaveCurve extends THREE.Curve {
        getPoint(t) {
            const x = (t - 0.5) * 4;
            const y = Math.sin(t * Math.PI * 3) * 0.5;
            const z = Math.cos(t * Math.PI * 2) * 0.3;
            return new THREE.Vector3(x, y, z);
        }
    }
    
    const curve = new WaveCurve();
    const geometry = new THREE.TubeGeometry(curve, 64, 0.15, 8, false);
    
    return geometry;
}

/**
 * Shield (Protection) - Protective shield shape
 */
function createShield() {
    const shape = new THREE.Shape();
    
    // Shield outline
    shape.moveTo(0, 1.2);
    shape.quadraticCurveTo(0.8, 1, 0.8, 0.3);
    shape.quadraticCurveTo(0.8, -0.5, 0, -1);
    shape.quadraticCurveTo(-0.8, -0.5, -0.8, 0.3);
    shape.quadraticCurveTo(-0.8, 1, 0, 1.2);
    
    const extrudeSettings = {
        depth: 0.3,
        bevelEnabled: true,
        bevelThickness: 0.1,
        bevelSize: 0.05,
        bevelSegments: 3
    };
    
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    geometry.center();
    geometry.scale(1.5, 1.5, 1.5);
    
    return geometry;
}

/**
 * Dodecahedron (Abundance) - 12-faced sacred geometry
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
