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
            this.scene.onSacredGeometryClicked = this.onSacredGeometryClicked.bind(this);
            
            // Setup UI callbacks
            this.ui.onUserNavigate = this.navigateToUser.bind(this);
            
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
            this.refreshActiveUsersList();
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
        
        const center = geometryData.center;
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
            
            // Cinematic zoom: Center camera on the sacred geometry
            this.zoomToSacredGeometry(center, members.length);
        }
    }
    
    zoomToSacredGeometry(center, memberCount) {
        if (!this.scene || !this.scene.controls) return;
        
        // Calculate zoom distance based on member count (further out for more members)
        const baseDistance = 80;
        const distancePerMember = 15;
        const targetDistance = baseDistance + memberCount * distancePerMember;
        
        // Animate camera target to geometry center
        gsap.to(this.scene.controls.target, {
            x: center.x,
            y: center.y,
            z: center.z,
            duration: 2.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.scene.updateCameraFromControls();
            }
        });
        
        // Animate zoom distance
        gsap.to(this.scene.controls.spherical, {
            radius: targetDistance,
            duration: 2.5,
            ease: 'power2.inOut',
            onUpdate: () => {
                this.scene.updateCameraFromControls();
            }
        });
        
        // Disable auto-rotate during the cinematic zoom
        this.scene.controls.autoRotate = false;
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
    
    async onEnter(nickname, note, intention = 'observer', emotion = 'neutral') {
        console.log('🌌 Entering the void as:', nickname, 'with intention:', intention);
        
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
            
            // Connect to Firebase with initial data including intention and emotion
            this.selfData = await this.firebase.connect({ nickname, note, intention, emotion });
            
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
        
        // Update connections and active users list
        this.updateConnections();
        this.refreshActiveUsersList();
    }
    
    updateUser(userId, userData) {
        this.users.set(userId, userData);
        this.scene.updateUser(userId, userData);
        
        // Update connections (resonance might have changed)
        this.updateConnections();
        this.refreshActiveUsersList();
    }
    
    removeUser(userId) {
        this.users.delete(userId);
        this.scene.removeUser(userId);
        
        // Update connections and active users list
        this.updateConnections();
        this.refreshActiveUsersList();
    }
    
    refreshActiveUsersList() {
        // Build full users map including self
        const allUsers = new Map();
        
        this.users.forEach((userData, userId) => {
            allUsers.set(userId, userData);
        });
        
        // Add self
        if (this.selfId && this.selfData) {
            allUsers.set(this.selfId, this.selfData);
        }
        
        // Update UI
        this.ui.updateActiveUsersList(allUsers, this.selfId);
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
    
    navigateToUser(userId) {
        // Find the user's position and animate camera to it
        let userShape;
        
        if (userId === this.selfId) {
            userShape = this.scene.users.get(this.selfId);
        } else {
            userShape = this.scene.users.get(userId);
        }
        
        if (userShape) {
            const pos = userShape.getPosition();
            
            // Animate camera to look at this user
            this.scene.animateCameraTo(pos.x, pos.y, pos.z, 60);
        }
    }
    
    async onSacredGeometryClicked(geometryId) {
        console.log('🌌 Sacred Geometry clicked:', geometryId);
        
        // Get the geometry data from Firebase
        const geometryData = await this.firebase.getSacredGeometry(geometryId);
        if (!geometryData) {
            console.log('🌌 Sacred Geometry not found');
            return;
        }
        
        // Open the info modal
        this.openSacredGeometryInfo(geometryId, geometryData);
    }
    
    openSacredGeometryInfo(geometryId, geometryData) {
        const modal = document.getElementById('sg-info-modal');
        if (!modal) return;
        
        // Get main intention data
        const mainIntention = geometryData.mainIntention || 'observer';
        const intentionData = window.HypnoClasses?.INTENTIONS?.[mainIntention] || 
                              { icon: '◯', color: '#FFFFFF' };
        
        // Import INTENTIONS from config
        import('./config.js').then(({ INTENTIONS }) => {
            const intention = INTENTIONS[mainIntention] || INTENTIONS.observer;
            
            // Set intention icon and name
            const intentionIcon = document.getElementById('sg-info-intention-icon');
            const intentionName = document.getElementById('sg-info-intention-name');
            
            if (intentionIcon) {
                intentionIcon.textContent = intention.icon;
                intentionIcon.style.color = intention.color;
            }
            if (intentionName) {
                intentionName.textContent = mainIntention.charAt(0).toUpperCase() + mainIntention.slice(1);
                intentionName.style.color = intention.color;
            }
            
            // Set age
            const ageEl = document.getElementById('sg-info-age');
            if (ageEl && geometryData.createdAt) {
                ageEl.textContent = this.formatTimeAgo(geometryData.createdAt);
            }
            
            // Set member counts
            const members = geometryData.members || {};
            const activeMembers = Object.values(members).filter(m => !m.pending);
            
            const activeMembersEl = document.getElementById('sg-info-active-members');
            const totalMembersEl = document.getElementById('sg-info-total-members');
            
            if (activeMembersEl) {
                activeMembersEl.textContent = activeMembers.length;
            }
            if (totalMembersEl) {
                totalMembersEl.textContent = geometryData.totalMembersEver || activeMembers.length;
            }
            
            // Set members list
            const membersList = document.getElementById('sg-info-members-list');
            if (membersList) {
                membersList.innerHTML = '';
                activeMembers.forEach(member => {
                    const memberIntention = INTENTIONS[member.intention] || INTENTIONS.observer;
                    const memberEl = document.createElement('div');
                    memberEl.className = 'sg-info-member';
                    memberEl.innerHTML = `
                        <span class="sg-info-member-icon" style="color: ${memberIntention.color}">${memberIntention.icon}</span>
                        <span>${member.nickname || 'Anonymous'}</span>
                    `;
                    membersList.appendChild(memberEl);
                });
            }
            
            // Set creator
            const creatorEl = document.getElementById('sg-info-creator-name');
            if (creatorEl) {
                creatorEl.textContent = geometryData.creatorNickname || 'Anonymous';
            }
            
            // Configure join button
            const joinBtn = document.getElementById('sg-join-btn');
            const joinNote = document.getElementById('sg-join-note');
            
            if (joinBtn && joinNote) {
                // Check if user is already in this geometry
                const isInThisGeometry = this.selfData?.sacredGeometryId === geometryId;
                // Check if user is in any other geometry
                const isInAnotherGeometry = this.selfData?.sacredGeometryId && this.selfData.sacredGeometryId !== geometryId;
                
                if (isInThisGeometry) {
                    joinBtn.disabled = true;
                    joinBtn.querySelector('.button-text').textContent = '✧ YOU ARE HERE ✧';
                    joinNote.textContent = 'You are a member of this Sacred Geometry';
                } else {
                    joinBtn.disabled = false;
                    joinBtn.querySelector('.button-text').textContent = '✧ JOIN THIS GEOMETRY ✧';
                    joinNote.textContent = isInAnotherGeometry ? 'You will leave your current geometry' : '';
                    
                    // Set up click handler
                    joinBtn.onclick = async () => {
                        // If in another geometry, leave it first
                        if (isInAnotherGeometry) {
                            // Stop audio if playing
                            if (this.currentSacredGeometry) {
                                this.currentSacredGeometry.stopBinauralBeats();
                            }
                            await this.firebase.leaveSacredGeometry();
                        }
                        
                        // Join the new geometry
                        await this.firebase.joinSacredGeometry(geometryId);
                        this.selfData = await this.firebase.getSelfData();
                        this.currentSacredGeometry = this.sacredGeometryManager.getGeometry(geometryId);
                        this.showSacredGeometryPanel();
                        
                        // Close modal
                        modal.classList.remove('visible');
                        modal.classList.add('hidden');
                        
                        // Move to geometry
                        await this.moveSelfToSacredGeometry(geometryId);
                    };
                }
            }
            
            // Show modal
            modal.classList.remove('hidden');
            modal.classList.add('visible');
        });
    }
    
    formatTimeAgo(timestamp) {
        const now = Date.now();
        const diff = now - timestamp;
        
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (days > 0) {
            return days === 1 ? '1 day ago' : `${days} days ago`;
        } else if (hours > 0) {
            return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        } else if (minutes > 0) {
            return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
        } else {
            return 'Just now';
        }
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
