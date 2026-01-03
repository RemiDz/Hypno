/* ============================================
   HYPNO - Configuration & Constants
   ============================================ */

// Firebase Configuration
export const firebaseConfig = {
    apiKey: "AIzaSyBLOVe2SLGqyMBJRu7eLBzC7o0jf5Raaj4",
    authDomain: "hypno-consciousness.firebaseapp.com",
    databaseURL: "https://hypno-consciousness-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "hypno-consciousness",
    storageBucket: "hypno-consciousness.firebasestorage.app",
    messagingSenderId: "55958423638",
    appId: "1:55958423638:web:6df5e7afe75124488b93f7"
};

// Intentions - defines shapes and colors
export const INTENTIONS = {
    observer: {
        shape: 'orbit',
        color: '#FFFFFF',
        colorHex: 0xFFFFFF,
        icon: '◯',
        description: 'Watching, learning, being present'
    },
    peace: {
        shape: 'sphere',
        color: '#8B5CF6',
        colorHex: 0x8B5CF6,
        icon: '●',
        description: 'Seeking tranquility and calm'
    },
    love: {
        shape: 'heart',
        color: '#EC4899',
        colorHex: 0xEC4899,
        icon: '♥',
        description: 'Radiating and seeking love'
    },
    clarity: {
        shape: 'octahedron',
        color: '#3B82F6',
        colorHex: 0x3B82F6,
        icon: '◆',
        description: 'Pursuing truth and understanding'
    },
    creativity: {
        shape: 'star',
        color: '#F59E0B',
        colorHex: 0xF59E0B,
        icon: '★',
        description: 'Channeling creative energy'
    },
    transcendence: {
        shape: 'spiral',
        color: '#10B981',
        colorHex: 0x10B981,
        icon: '∿',
        description: 'Rising beyond the ordinary'
    },
    transformation: {
        shape: 'phoenix',
        color: '#EF4444',
        colorHex: 0xEF4444,
        icon: '🔥',
        description: 'Embracing change and rebirth'
    },
    healing: {
        shape: 'lotus',
        color: '#06B6D4',
        colorHex: 0x06B6D4,
        icon: '✿',
        description: 'Restoring and nurturing'
    },
    wisdom: {
        shape: 'pyramid',
        color: '#A855F7',
        colorHex: 0xA855F7,
        icon: '△',
        description: 'Seeking deeper knowledge'
    },
    unity: {
        shape: 'infinity',
        color: '#FBBF24',
        colorHex: 0xFBBF24,
        icon: '∞',
        description: 'Connecting all as one'
    }
};

// Emotions - defines visual effects
export const EMOTIONS = {
    neutral: {
        effect: 'none',
        particleColor: null,
        particleColorHex: null,
        pulseSpeed: 1.0,
        icon: '😐',
        description: 'Balanced, centered'
    },
    joyful: {
        effect: 'sparkles',
        particleColor: '#FFD700',
        particleColorHex: 0xFFD700,
        pulseSpeed: 1.3,
        icon: '😊',
        description: 'Radiating happiness'
    },
    sad: {
        effect: 'rain',
        particleColor: '#6366F1',
        particleColorHex: 0x6366F1,
        pulseSpeed: 0.6,
        icon: '😢',
        description: 'Processing sorrow'
    },
    anxious: {
        effect: 'static',
        particleColor: '#FCD34D',
        particleColorHex: 0xFCD34D,
        pulseSpeed: 2.0,
        icon: '😰',
        description: 'Feeling unsettled'
    },
    hopeful: {
        effect: 'rising',
        particleColor: '#34D399',
        particleColorHex: 0x34D399,
        pulseSpeed: 1.1,
        icon: '🌱',
        description: 'Looking toward light'
    },
    grateful: {
        effect: 'glow',
        particleColor: '#FB923C',
        particleColorHex: 0xFB923C,
        pulseSpeed: 0.8,
        icon: '🙏',
        description: 'Filled with thanks'
    },
    curious: {
        effect: 'orbiting',
        particleColor: '#60A5FA',
        particleColorHex: 0x60A5FA,
        pulseSpeed: 1.2,
        icon: '🤔',
        description: 'Seeking to understand'
    },
    peaceful: {
        effect: 'waves',
        particleColor: '#A78BFA',
        particleColorHex: 0xA78BFA,
        pulseSpeed: 0.7,
        icon: '😌',
        description: 'Deep serenity'
    },
    energized: {
        effect: 'electricity',
        particleColor: '#FACC15',
        particleColorHex: 0xFACC15,
        pulseSpeed: 1.8,
        icon: '⚡',
        description: 'Charged with vitality'
    },
    contemplative: {
        effect: 'mist',
        particleColor: '#94A3B8',
        particleColorHex: 0x94A3B8,
        pulseSpeed: 0.5,
        icon: '💭',
        description: 'Deep in thought'
    }
};

// Connection Thread Styles
export const CONNECTION_STYLES = {
    oneWay: {
        opacity: 0.4,
        particleSpeed: 1.0,
        particleDirection: 'toReceiver',
        width: 2
    },
    mutual: {
        opacity: 0.8,
        particleSpeed: 1.5,
        particleDirection: 'bidirectional',
        width: 4,
        glowIntensity: 2.0
    }
};

// Scene Settings
export const SCENE_CONFIG = {
    cameraFov: 60,
    cameraNear: 0.1,
    cameraFar: 10000,
    initialCameraZ: 100,
    
    // Starfield
    starCount: 5000,
    starFieldSize: 3000,
    
    // Fog
    fogColor: 0x000510,
    fogNear: 100,
    fogFar: 2000,
    
    // User spawn area
    spawnRadius: 400,
    
    // Shape sizes
    shapeScale: 2.5,
    labelScale: 0.5,
    
    // Controls
    minDistance: 20,
    maxDistance: 800,
    rotateSpeed: 0.5,
    zoomSpeed: 1.0,
    panSpeed: 0.5,
    
    // Animation
    pulseSpeed: 1.0,
    orbitSpeed: 0.001
};

// Default User Data
export const DEFAULT_USER = {
    nickname: 'Anonymous Wanderer',
    note: '',
    intention: 'observer',
    emotion: 'neutral',
    resonatingWith: []
};
