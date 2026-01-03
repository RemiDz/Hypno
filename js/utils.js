/* ============================================
   HYPNO - Utility Functions
   ============================================ */

/**
 * Generate a random UUID
 */
export function generateUUID() {
    if (crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}

/**
 * Format connection time from timestamp
 */
export function formatConnectionTime(connectedAt) {
    const now = Date.now();
    const diff = now - connectedAt;
    
    const seconds = Math.floor(diff / 1000) % 60;
    const minutes = Math.floor(diff / 60000) % 60;
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) {
        return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds}s`;
    } else {
        return `${seconds}s`;
    }
}

/**
 * Generate random position within spawn radius
 */
export function randomPosition(radius = 400) {
    return {
        x: (Math.random() - 0.5) * radius,
        y: (Math.random() - 0.5) * radius,
        z: (Math.random() - 0.5) * radius
    };
}

/**
 * Lerp between two values
 */
export function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Clamp a value between min and max
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * Map a value from one range to another
 */
export function map(value, inMin, inMax, outMin, outMax) {
    return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
}

/**
 * Convert hex color string to hex number
 */
export function hexToNumber(hex) {
    return parseInt(hex.replace('#', ''), 16);
}

/**
 * Blend two hex colors
 */
export function blendColors(color1, color2, factor = 0.5) {
    const r1 = (color1 >> 16) & 0xFF;
    const g1 = (color1 >> 8) & 0xFF;
    const b1 = color1 & 0xFF;
    
    const r2 = (color2 >> 16) & 0xFF;
    const g2 = (color2 >> 8) & 0xFF;
    const b2 = color2 & 0xFF;
    
    const r = Math.round(lerp(r1, r2, factor));
    const g = Math.round(lerp(g1, g2, factor));
    const b = Math.round(lerp(b1, b2, factor));
    
    return (r << 16) | (g << 8) | b;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Ease in out quad
 */
export function easeInOutQuad(t) {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/**
 * Ease out cubic
 */
export function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

/**
 * Check if on mobile device
 */
export function isMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

/**
 * Get distance between two 3D points
 */
export function distance3D(p1, p2) {
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const dz = p2.z - p1.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Create canvas texture for label
 */
export function createLabelTexture(text, options = {}) {
    const {
        fontSize = 32,
        fontFamily = 'Outfit, sans-serif',
        color = '#FFFFFF',
        backgroundColor = 'rgba(10, 10, 26, 0.7)',
        padding = 16
    } = options;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    // Set font and measure text
    ctx.font = `300 ${fontSize}px ${fontFamily}`;
    const metrics = ctx.measureText(text);
    const textWidth = metrics.width;
    const textHeight = fontSize;
    
    // Set canvas size
    canvas.width = textWidth + padding * 2;
    canvas.height = textHeight + padding * 2;
    
    // Draw background
    ctx.fillStyle = backgroundColor;
    ctx.roundRect(0, 0, canvas.width, canvas.height, 8);
    ctx.fill();
    
    // Draw text
    ctx.font = `300 ${fontSize}px ${fontFamily}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    
    return canvas;
}

/**
 * Show/hide element with animation
 */
export function showElement(element, show = true) {
    if (show) {
        element.classList.remove('hidden');
        element.classList.add('visible');
    } else {
        element.classList.remove('visible');
        element.classList.add('hidden');
    }
}

/**
 * Format plural correctly
 */
export function pluralize(count, singular, plural = null) {
    if (count === 1) {
        return singular;
    }
    return plural || `${singular}s`;
}
