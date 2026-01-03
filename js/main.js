/* ============================================
   HYPNO - Main Application Entry Point
   The Cosmic Consciousness Network
   ============================================ */

import { CosmicScene } from './scene.js';
import { FirebaseSync } from './firebase.js';
import { UIManager } from './ui.js';
import { UserShape } from './user.js';
import { ConnectionThread, ConnectionManager } from './connections.js';

// Make classes available globally for scene.js
window.HypnoClasses = {
    UserShape,
    ConnectionThread,
    ConnectionManager
};

class HypnoApp {
    constructor() {
        this.firebase = null;
        this.scene = null;
        this.ui = null;
        this.connectionManager = null;
        
        this.selfId = null;
        this.selfData = null;
        this.users = new Map();
        
        this.isInitialized = false;
    }
    
    async init() {
        console.log('🌌 HYPNO: Initializing cosmic consciousness network...');
        
        try {
            // Initialize Firebase first
            this.firebase = new FirebaseSync();
            await this.firebase.init();
            
            // Initialize Three.js scene
            const container = document.getElementById('universe-container');
            this.scene = new CosmicScene(container);
            await this.scene.init();
            
            // Initialize UI
            this.ui = new UIManager(this.firebase, this.scene);
            this.ui.setOnEnterCallback(this.onEnter.bind(this));
            
            // Initialize connection manager
            this.connectionManager = new ConnectionManager(this.scene.scene, this.scene.users);
            
            // Setup scene callbacks
            this.scene.onUserClicked = this.onUserClicked.bind(this);
            this.scene.onSelfClicked = this.onSelfClicked.bind(this);
            
            // Setup Firebase callbacks
            this.setupFirebaseCallbacks();
            
            // Show welcome screen
            this.ui.showWelcome();
            
            this.isInitialized = true;
            console.log('🌌 HYPNO: Initialization complete');
            
        } catch (error) {
            console.error('🌌 HYPNO: Initialization failed:', error);
            this.showError('Failed to connect to the cosmic field. Please refresh and try again.');
        }
    }
    
    setupFirebaseCallbacks() {
        // User added
        this.firebase.onUserAdded = (userId, userData) => {
            console.log('🌌 Soul joined:', userId);
            this.addUser(userId, userData);
        };
        
        // User changed
        this.firebase.onUserChanged = (userId, userData) => {
            this.updateUser(userId, userData);
        };
        
        // User removed
        this.firebase.onUserRemoved = (userId) => {
            console.log('🌌 Soul departed:', userId);
            this.removeUser(userId);
        };
        
        // Active user count
        this.firebase.onActiveUserCountChanged = (count) => {
            this.ui.updateSoulsCounter(count);
        };
        
        // Connection state
        this.firebase.onConnectionStateChanged = (isConnected) => {
            console.log('🌌 Connection state:', isConnected ? 'Connected' : 'Disconnected');
        };
    }
    
    async onEnter(nickname, note) {
        console.log('🌌 Entering the void as:', nickname);
        
        try {
            // Connect to Firebase with initial data
            this.selfData = await this.firebase.connect({ nickname, note });
            this.selfId = this.firebase.getSessionId();
            
            // Create self representation in scene
            const selfShape = this.scene.addUser(this.selfId, this.selfData, true);
            this.users.set(this.selfId, this.selfData);
            
            // Load existing users
            const existingUsers = await this.firebase.getAllUsers();
            console.log('🌌 Found', existingUsers.length, 'other souls');
            
            existingUsers.forEach(({ id, data }) => {
                this.addUser(id, data);
            });
            
            // Set scene self ID
            this.scene.selfId = this.selfId;
            
        } catch (error) {
            console.error('🌌 Failed to enter:', error);
            this.showError('Failed to join the cosmic field. Please try again.');
        }
    }
    
    addUser(userId, userData) {
        if (userId === this.selfId) return;
        if (this.users.has(userId)) return;
        
        this.users.set(userId, userData);
        this.scene.addUser(userId, userData, false);
        
        // Update connections
        this.updateConnections();
    }
    
    updateUser(userId, userData) {
        this.users.set(userId, userData);
        this.scene.updateUser(userId, userData);
        
        // Update connections (resonance might have changed)
        this.updateConnections();
    }
    
    removeUser(userId) {
        this.users.delete(userId);
        this.scene.removeUser(userId);
        
        // Update connections
        this.updateConnections();
    }
    
    updateConnections() {
        // Build a map for the connection manager
        const allUsers = new Map();
        
        this.users.forEach((userData, oderId) => {
            allUsers.set(oderId, userData);
        });
        
        // Add self data
        if (this.selfId && this.selfData) {
            // Get latest self data from Firebase
            this.firebase.getSelfData().then(selfData => {
                if (selfData) {
                    this.selfData = selfData;
                    allUsers.set(this.selfId, selfData);
                    this.connectionManager.updateConnections(allUsers, this.selfId);
                }
            });
        } else {
            this.connectionManager.updateConnections(allUsers, this.selfId);
        }
    }
    
    onUserClicked(userId) {
        const userData = this.users.get(userId);
        if (userData) {
            this.ui.openUserMenu(userId, userData);
            
            // Highlight the user
            const userShape = this.scene.users.get(userId);
            if (userShape) {
                userShape.highlight(true);
            }
        }
    }
    
    onSelfClicked() {
        this.ui.openSelfMenu();
    }
    
    showError(message) {
        // Simple error display
        const loadingText = document.querySelector('.loading-text');
        if (loadingText) {
            loadingText.textContent = message;
            loadingText.style.color = '#EF4444';
        }
    }
    
    // Cleanup on page unload
    destroy() {
        if (this.firebase) {
            this.firebase.disconnect();
        }
        if (this.scene) {
            this.scene.dispose();
        }
        if (this.connectionManager) {
            this.connectionManager.dispose();
        }
    }
}

// ============================================
// Application Bootstrap
// ============================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', async () => {
    const app = new HypnoApp();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        app.destroy();
    });
    
    // Handle visibility change for mobile
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            // Could pause animations here
        } else {
            // Resume
        }
    });
    
    // Initialize the app
    await app.init();
    
    // Make app available globally for debugging
    window.hypnoApp = app;
});

// Register service worker for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('🌌 Service Worker registered:', registration.scope);
        } catch (error) {
            console.log('🌌 Service Worker registration failed:', error);
        }
    });
}

console.log('🌌 HYPNO: Script loaded');
console.log('🌌 "In the cosmic web of existence, every point of consciousness is connected to every other."');
