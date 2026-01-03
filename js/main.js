/* ============================================
   HYPNO - Main Application Entry Point
   The Cosmic Consciousness Network
   ============================================ */

import { CosmicScene } from './scene.js';
import { FirebaseSync } from './firebase.js';
import { UIManager } from './ui.js';
import { UserShape } from './user.js';
import { ConnectionThread, ConnectionManager } from './connections.js';
import { SacredGeometryManager } from './sacredGeometry.js';
import { throttle } from './utils.js';

// Make classes available globally for scene.js
window.HypnoClasses = {
    UserShape,
    ConnectionThread,
    ConnectionManager,
    SacredGeometryManager
};

class HypnoApp {
    constructor() {
        this.firebase = null;
        this.scene = null;
        this.ui = null;
        this.connectionManager = null;
        this.sacredGeometryManager = null;
        
        this.selfId = null;
        this.selfData = null;
        this.users = new Map();
        this.currentSacredGeometry = null;
        
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
            
            // Initialize sacred geometry manager
            this.sacredGeometryManager = new SacredGeometryManager(this.scene);
            
            // Give scene a reference to connection manager for animation
            this.scene.connectionManager = this.connectionManager;
            this.scene.sacredGeometryManager = this.sacredGeometryManager;
            
            // Setup scene callbacks
            this.scene.onUserClicked = this.onUserClicked.bind(this);
            this.scene.onSelfClicked = this.onSelfClicked.bind(this);
            
            // Throttled position update (every 100ms)
            this.scene.onPositionChanged = throttle((newPos) => {
                this.firebase.updatePosition(newPos.x, newPos.y, newPos.z);
                // Update local data
                if (this.selfData) {
                    this.selfData.position = newPos;
                }
            }, 100);
            
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
        
        // Disconnection handler
        this.firebase.onDisconnected = () => {
            this.showMessage('Lost connection to the cosmic field. Attempting to reconnect...');
        };
        
        // Capacity warning
        this.firebase.onCapacityWarning = (count, max) => {
            console.warn(`🌌 Cosmic field nearing capacity: ${count}/${max}`);
        };
        
        // Capacity reached
        this.firebase.onCapacityReached = (count, max) => {
            this.showMessage(`The cosmic field is at capacity (${count}/${max} souls). Some features may be limited.`);
        };
        
        // Sacred Geometry callbacks
        this.firebase.onSacredGeometryCreated = (geometryId, geometryData) => {
            console.log('🌌 Sacred Geometry created:', geometryId);
            this.onSacredGeometryCreated(geometryId, geometryData);
        };
        
        this.firebase.onSacredGeometryUpdated = (geometryId, geometryData) => {
            this.onSacredGeometryUpdated(geometryId, geometryData);
        };
        
        this.firebase.onSacredGeometryRemoved = (geometryId) => {
            console.log('🌌 Sacred Geometry removed:', geometryId);
            this.onSacredGeometryRemoved(geometryId);
        };
    }
    
    // ========================
    // Sacred Geometry Methods
    // ========================
    
    async initSacredGeometry() {
        // Load existing sacred geometries
        const geometries = await this.firebase.getAllSacredGeometries();
        geometries.forEach(geo => {
            this.sacredGeometryManager.addGeometry(geo.id, geo);
        });
        
        // Setup listeners
        this.firebase.setupSacredGeometryListeners();
        
        // Setup UI for sacred geometry
        this.setupSacredGeometryUI();
    }
    
    setupSacredGeometryUI() {
        // Sacred geometry button in user menu
        const sgBtn = document.getElementById('sacred-geometry-btn');
        if (sgBtn) {
            sgBtn.addEventListener('click', () => this.onCreateSacredGeometry());
        }
        
        // Invite accept/decline buttons
        const acceptBtn = document.getElementById('sg-accept-btn');
        const declineBtn = document.getElementById('sg-decline-btn');
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => this.onAcceptSacredGeometry());
        }
        if (declineBtn) {
            declineBtn.addEventListener('click', () => this.onDeclineSacredGeometry());
        }
        
        // Leave button
        const leaveBtn = document.getElementById('sg-leave-btn');
        if (leaveBtn) {
            leaveBtn.addEventListener('click', () => this.onLeaveSacredGeometry());
        }
        
        // Audio toggle
        const audioBtn = document.getElementById('sg-audio-btn');
        if (audioBtn) {
            audioBtn.addEventListener('click', () => this.toggleSacredGeometryAudio());
        }
    }
    
    async onCreateSacredGeometry() {
        const targetUserId = this.ui.selectedUserId;
        if (!targetUserId) return;
        
        // Check if already in a sacred geometry
        if (this.selfData && this.selfData.sacredGeometryId) {
            alert('You are already in a Sacred Geometry. Leave it first to create a new one.');
            return;
        }
        
        console.log('🌌 Creating Sacred Geometry with:', targetUserId);
        
        try {
            const geometryId = await this.firebase.createSacredGeometry(targetUserId);
            if (geometryId) {
                // Update self data
                this.selfData = await this.firebase.getSelfData();
                this.showSacredGeometryPanel();
                
                // Close user menu
                this.ui.closeModal('user-menu');
            }
        } catch (error) {
            console.error('Failed to create sacred geometry:', error);
        }
    }
    
    async onAcceptSacredGeometry() {
        if (!this.selfData || !this.selfData.sacredGeometryInvite) return;
        
        const geometryId = this.selfData.sacredGeometryInvite;
        
        try {
            await this.firebase.acceptSacredGeometryInvite(geometryId);
            
            // Update self data
            this.selfData = await this.firebase.getSelfData();
            
            // Hide invite modal
            const modal = document.getElementById('sg-invite-modal');
            if (modal) modal.classList.add('hidden');
            
            // Show active panel
            this.showSacredGeometryPanel();
            
            // Move self to sacred geometry position
            await this.moveSelfToSacredGeometry(geometryId);
            
        } catch (error) {
            console.error('Failed to accept sacred geometry:', error);
        }
    }
    
    async onDeclineSacredGeometry() {
        try {
            await this.firebase.declineSacredGeometryInvite();
            
            // Update self data
            this.selfData = await this.firebase.getSelfData();
            
            // Hide invite modal
            const modal = document.getElementById('sg-invite-modal');
            if (modal) modal.classList.add('hidden');
            
        } catch (error) {
            console.error('Failed to decline sacred geometry:', error);
        }
    }
    
    async onLeaveSacredGeometry() {
        try {
            // Stop audio if playing
            if (this.currentSacredGeometry) {
                this.currentSacredGeometry.stopBinauralBeats();
            }
            
            await this.firebase.leaveSacredGeometry();
            
            // Update self data
            this.selfData = await this.firebase.getSelfData();
            
            // Hide panel
            this.hideSacredGeometryPanel();
            
            this.currentSacredGeometry = null;
            
        } catch (error) {
            console.error('Failed to leave sacred geometry:', error);
        }
    }
    
    toggleSacredGeometryAudio() {
        if (!this.currentSacredGeometry) return;
        
        const audioBtn = document.getElementById('sg-audio-btn');
        
        if (this.currentSacredGeometry.isAudioPlaying) {
            this.currentSacredGeometry.stopBinauralBeats();
            if (audioBtn) {
                audioBtn.classList.remove('active');
                audioBtn.querySelector('.audio-text').textContent = 'Enable Binaural Beats';
                audioBtn.querySelector('.audio-icon').textContent = '🔇';
            }
        } else {
            this.currentSacredGeometry.startBinauralBeats();
            if (audioBtn) {
                audioBtn.classList.add('active');
                audioBtn.querySelector('.audio-text').textContent = 'Disable Binaural Beats';
                audioBtn.querySelector('.audio-icon').textContent = '🔊';
            }
        }
    }
    
    async moveSelfToSacredGeometry(geometryId) {
        const geometryData = await this.firebase.getSacredGeometry(geometryId);
        if (!geometryData || !geometryData.center) return;
        
        const members = Object.keys(geometryData.members || {});
        const myIndex = members.indexOf(this.selfId);
        
        // Calculate position around the geometry center
        const sacredGeo = this.sacredGeometryManager.getGeometry(geometryId);
        if (sacredGeo) {
            const newPos = sacredGeo.getMemberPosition(myIndex, members.length);
            
            // Animate self to new position
            const selfShape = this.scene.users.get(this.selfId);
            if (selfShape) {
                gsap.to(selfShape.group.position, {
                    x: newPos.x,
                    y: newPos.y,
                    z: newPos.z,
                    duration: 2,
                    ease: 'power2.inOut'
                });
                
                // Update in Firebase
                this.firebase.updatePosition(newPos.x, newPos.y, newPos.z);
            }
        }
    }
    
    onSacredGeometryCreated(geometryId, geometryData) {
        // Add the 3D visualization
        this.sacredGeometryManager.addGeometry(geometryId, geometryData);
        
        // Check if we're a member
        const members = geometryData.members || {};
        if (members[this.selfId]) {
            const myData = members[this.selfId];
            
            if (myData.pending) {
                // Show invite modal
                this.showSacredGeometryInvite(geometryId, geometryData);
            } else {
                // We're an active member
                this.currentSacredGeometry = this.sacredGeometryManager.getGeometry(geometryId);
                this.showSacredGeometryPanel();
            }
        }
    }
    
    onSacredGeometryUpdated(geometryId, geometryData) {
        // Update the 3D visualization
        this.sacredGeometryManager.updateGeometry(geometryId, geometryData);
        
        // Update panel if this is our geometry
        if (this.selfData && this.selfData.sacredGeometryId === geometryId) {
            this.updateSacredGeometryPanel(geometryData);
            
            // Update current reference
            this.currentSacredGeometry = this.sacredGeometryManager.getGeometry(geometryId);
        }
        
        // Check for pending invite
        const members = geometryData.members || {};
        if (members[this.selfId] && members[this.selfId].pending) {
            this.showSacredGeometryInvite(geometryId, geometryData);
        }
    }
    
    onSacredGeometryRemoved(geometryId) {
        // Remove the 3D visualization
        this.sacredGeometryManager.removeGeometry(geometryId);
        
        // If this was our geometry, clean up
        if (this.selfData && this.selfData.sacredGeometryId === geometryId) {
            this.currentSacredGeometry = null;
            this.hideSacredGeometryPanel();
        }
    }
    
    showSacredGeometryInvite(geometryId, geometryData) {
        const modal = document.getElementById('sg-invite-modal');
        const fromSpan = document.getElementById('sg-invite-from');
        
        if (!modal) return;
        
        // Find who invited us
        const creatorId = geometryData.createdBy;
        const members = geometryData.members || {};
        const creatorData = members[creatorId];
        const creatorName = creatorData ? creatorData.nickname : 'Someone';
        
        if (fromSpan) {
            fromSpan.textContent = creatorName;
        }
        
        modal.classList.remove('hidden');
        modal.classList.add('visible');
    }
    
    showSacredGeometryPanel() {
        const panel = document.getElementById('sg-active-panel');
        if (panel) {
            panel.classList.remove('hidden');
        }
        
        // Update with current data
        if (this.selfData && this.selfData.sacredGeometryId) {
            this.firebase.getSacredGeometry(this.selfData.sacredGeometryId).then(data => {
                if (data) {
                    this.updateSacredGeometryPanel(data);
                }
            });
        }
    }
    
    hideSacredGeometryPanel() {
        const panel = document.getElementById('sg-active-panel');
        if (panel) {
            panel.classList.add('hidden');
        }
    }
    
    updateSacredGeometryPanel(geometryData) {
        const membersContainer = document.getElementById('sg-panel-members');
        if (!membersContainer) return;
        
        const members = geometryData.members || {};
        membersContainer.innerHTML = '';
        
        Object.entries(members).forEach(([memberId, memberData]) => {
            const memberEl = document.createElement('div');
            memberEl.className = 'sg-member' + (memberData.pending ? ' pending' : '');
            memberEl.innerHTML = `
                <span class="sg-member-icon"></span>
                <span>${memberData.nickname || 'Soul'}${memberData.pending ? ' (pending)' : ''}</span>
            `;
            membersContainer.appendChild(memberEl);
        });
    }
    
    async onEnter(nickname, note) {
        console.log('🌌 Entering the void as:', nickname);
        
        try {
            // Get session ID first
            this.selfId = this.firebase.getSessionId();
            
            // Set scene self ID early to prevent duplicates
            this.scene.selfId = this.selfId;
            
            // Load existing users BEFORE connecting (to avoid race condition)
            const existingUsers = await this.firebase.getAllUsers();
            console.log('🌌 Found', existingUsers.length, 'other souls');
            
            existingUsers.forEach(({ id, data }) => {
                // Skip if it's somehow our old session
                if (id === this.selfId) return;
                this.addUser(id, data);
            });
            
            // Connect to Firebase with initial data
            this.selfData = await this.firebase.connect({ nickname, note });
            
            // Create self representation in scene
            const selfShape = this.scene.addUser(this.selfId, this.selfData, true);
            this.users.set(this.selfId, this.selfData);
            
            // Initialize sacred geometry system
            await this.initSacredGeometry();
            
            // Check if we were in a sacred geometry
            if (this.selfData.sacredGeometryId) {
                this.currentSacredGeometry = this.sacredGeometryManager.getGeometry(this.selfData.sacredGeometryId);
                this.showSacredGeometryPanel();
            }
            
            // Check for pending invites
            if (this.selfData.sacredGeometryInvite) {
                const geoData = await this.firebase.getSacredGeometry(this.selfData.sacredGeometryInvite);
                if (geoData) {
                    this.showSacredGeometryInvite(this.selfData.sacredGeometryInvite, geoData);
                }
            }
            
        } catch (error) {
            console.error('🌌 Failed to enter:', error);
            
            // Check if it's a capacity error
            if (error.message && error.message.includes('capacity')) {
                this.showError(error.message);
            } else {
                this.showError('Failed to join the cosmic field. Please try again.');
            }
        }
    }
    
    addUser(userId, userData) {
        // Skip self
        if (userId === this.selfId) {
            console.log('🌌 Skipping self user:', userId);
            return;
        }
        
        // Skip if already exists
        if (this.users.has(userId)) {
            console.log('🌌 User already exists, updating:', userId);
            this.updateUser(userId, userData);
            return;
        }
        
        // Skip if already in scene
        if (this.scene.users.has(userId)) {
            console.log('🌌 User already in scene:', userId);
            return;
        }
        
        console.log('🌌 Adding new user:', userId, userData.nickname);
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
    
    showMessage(message, type = 'info') {
        // Create or reuse toast notification
        let toast = document.getElementById('hypno-toast');
        
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'hypno-toast';
            toast.className = 'hypno-toast';
            document.body.appendChild(toast);
        }
        
        // Set content and type
        toast.textContent = message;
        toast.className = `hypno-toast ${type}`;
        toast.classList.add('visible');
        
        // Auto-hide after 5 seconds
        clearTimeout(this.toastTimeout);
        this.toastTimeout = setTimeout(() => {
            toast.classList.remove('visible');
        }, 5000);
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
        if (this.sacredGeometryManager) {
            this.sacredGeometryManager.dispose();
        }
        if (this.currentSacredGeometry) {
            this.currentSacredGeometry.stopBinauralBeats();
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
