/* ============================================
   HYPNO - Firebase Sync & Presence
   ============================================ */

import { firebaseConfig, DEFAULT_USER, INTENTIONS } from './config.js';
import { generateUUID, randomPosition } from './utils.js';

export class FirebaseSync {
    constructor() {
        this.db = null;
        this.sessionId = null;
        this.userRef = null;
        this.usersRef = null;
        this.sacredGeometryRef = null;
        this.isConnected = false;
        this.heartbeatInterval = null;
        
        // Callbacks
        this.onUserAdded = null;
        this.onUserChanged = null;
        this.onUserRemoved = null;
        this.onActiveUserCountChanged = null;
        this.onConnectionStateChanged = null;
        this.onCapacityWarning = null;
        this.onCapacityReached = null;
        this.onDisconnected = null;
        
        // Sacred Geometry callbacks
        this.onSacredGeometryCreated = null;
        this.onSacredGeometryUpdated = null;
        this.onSacredGeometryRemoved = null;
        
        // Connection limits
        this.MAX_CONNECTIONS = 100;
        this.WARNING_THRESHOLD = 90;
        this.currentUserCount = 0;
    }
    
    async init() {
        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }
        
        this.db = firebase.database();
        this.sessionId = generateUUID();
        this.usersRef = this.db.ref('users');
        this.sacredGeometryRef = this.db.ref('sacredGeometry');
        
        // Listen for connection state with graceful handling
        this.db.ref('.info/connected').on('value', (snapshot) => {
            const wasConnected = this.isConnected;
            this.isConnected = snapshot.val() === true;
            
            if (this.isConnected) {
                console.log('🌌 Connected to cosmic field');
                if (this.onConnectionStateChanged) {
                    this.onConnectionStateChanged(true);
                }
            } else {
                console.log('🌌 Disconnected from cosmic field');
                if (wasConnected && this.onDisconnected) {
                    this.onDisconnected();
                }
                if (this.onConnectionStateChanged) {
                    this.onConnectionStateChanged(false);
                }
            }
        });
        
        // Monitor connection capacity
        this.startCapacityMonitoring();
        
        return this;
    }
    
    startCapacityMonitoring() {
        // Monitor total connections for capacity limits
        this.usersRef.on('value', (snapshot) => {
            const count = snapshot.numChildren();
            this.currentUserCount = count;
            
            // Warn when approaching limit
            if (count >= this.WARNING_THRESHOLD && count < this.MAX_CONNECTIONS) {
                console.warn(`🌌 Approaching connection limit: ${count}/${this.MAX_CONNECTIONS}`);
                if (this.onCapacityWarning) {
                    this.onCapacityWarning(count, this.MAX_CONNECTIONS);
                }
            }
            
            // At capacity
            if (count >= this.MAX_CONNECTIONS) {
                console.error(`🌌 Cosmic field at capacity: ${count}/${this.MAX_CONNECTIONS}`);
                if (this.onCapacityReached) {
                    this.onCapacityReached(count, this.MAX_CONNECTIONS);
                }
            }
        });
    }
    
    async checkCapacity() {
        // Check if there's room before connecting
        const snapshot = await this.usersRef.once('value');
        const count = snapshot.numChildren();
        
        if (count >= this.MAX_CONNECTIONS) {
            return {
                canConnect: false,
                currentCount: count,
                maxCount: this.MAX_CONNECTIONS,
                message: 'The cosmic field is at capacity. Please try again soon.'
            };
        }
        
        return {
            canConnect: true,
            currentCount: count,
            maxCount: this.MAX_CONNECTIONS,
            spotsRemaining: this.MAX_CONNECTIONS - count
        };
    }
    
    getSessionId() {
        return this.sessionId;
    }
    
    async connect(initialData = {}) {
        // Check capacity before connecting
        const capacity = await this.checkCapacity();
        if (!capacity.canConnect) {
            throw new Error(capacity.message);
        }
        
        // Use provided intention/emotion or defaults
        const intention = initialData.intention || DEFAULT_USER.intention;
        const emotion = initialData.emotion || DEFAULT_USER.emotion;
        const intentionData = INTENTIONS[intention] || INTENTIONS[DEFAULT_USER.intention];
        
        const userData = {
            nickname: initialData.nickname || DEFAULT_USER.nickname,
            note: initialData.note || DEFAULT_USER.note,
            intention: intention,
            emotion: emotion,
            shape: intentionData.shape,
            color: intentionData.color,
            position: randomPosition(),
            connectedAt: firebase.database.ServerValue.TIMESTAMP,
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            resonatingWith: []
        };
        
        this.userRef = this.db.ref(`users/${this.sessionId}`);
        
        // Set initial data
        await this.userRef.set(userData);
        
        // Setup disconnect cleanup - CRITICAL for presence
        await this.userRef.onDisconnect().remove();
        
        // Start heartbeat to keep lastSeen updated
        this.startHeartbeat();
        
        // Setup listeners for other users
        this.setupListeners();
        
        return userData;
    }
    
    startHeartbeat() {
        // Update lastSeen every 30 seconds
        this.heartbeatInterval = setInterval(() => {
            if (this.userRef && this.isConnected) {
                this.userRef.update({
                    lastSeen: firebase.database.ServerValue.TIMESTAMP
                });
            }
        }, 30000);
        
        // Clean up stale users every 60 seconds
        this.staleCleanupInterval = setInterval(() => {
            this.cleanupStaleUsers();
        }, 60000);
        
        // Run initial cleanup
        this.cleanupStaleUsers();
    }
    
    async cleanupStaleUsers() {
        // Remove users who haven't been seen in 2 minutes
        const staleThreshold = Date.now() - (2 * 60 * 1000);
        
        try {
            const snapshot = await this.usersRef.once('value');
            const users = snapshot.val() || {};
            
            Object.entries(users).forEach(([userId, userData]) => {
                // Don't clean up self
                if (userId === this.sessionId) return;
                
                const lastSeen = userData.lastSeen || 0;
                if (lastSeen < staleThreshold) {
                    console.log('🌌 Cleaning up stale user:', userId);
                    this.db.ref(`users/${userId}`).remove();
                }
            });
        } catch (error) {
            console.error('Error cleaning up stale users:', error);
        }
    }
    
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
        if (this.staleCleanupInterval) {
            clearInterval(this.staleCleanupInterval);
            this.staleCleanupInterval = null;
        }
    }
    
    setupListeners() {
        // Listen for new users
        this.usersRef.on('child_added', (snapshot) => {
            const userId = snapshot.key;
            const userData = snapshot.val();
            
            // Don't trigger for self
            if (userId === this.sessionId) return;
            
            if (this.onUserAdded) {
                this.onUserAdded(userId, userData);
            }
        });
        
        // Listen for user changes
        this.usersRef.on('child_changed', (snapshot) => {
            const userId = snapshot.key;
            const userData = snapshot.val();
            
            if (this.onUserChanged) {
                this.onUserChanged(userId, userData);
            }
        });
        
        // Listen for user removals (disconnects)
        this.usersRef.on('child_removed', (snapshot) => {
            const userId = snapshot.key;
            
            if (this.onUserRemoved) {
                this.onUserRemoved(userId);
            }
        });
        
        // Listen to total user count
        this.usersRef.on('value', (snapshot) => {
            const users = snapshot.val() || {};
            const count = Object.keys(users).length;
            
            if (this.onActiveUserCountChanged) {
                this.onActiveUserCountChanged(count);
            }
        });
    }
    
    // Get all current users (for initial load)
    async getAllUsers() {
        const snapshot = await this.usersRef.once('value');
        const users = snapshot.val() || {};
        
        // Convert to array, excluding self
        const userList = [];
        Object.entries(users).forEach(([userId, userData]) => {
            if (userId !== this.sessionId) {
                userList.push({ id: userId, data: userData });
            }
        });
        
        return userList;
    }
    
    // Get self data
    async getSelfData() {
        if (!this.userRef) return null;
        
        const snapshot = await this.userRef.once('value');
        return snapshot.val();
    }
    
    // Update methods
    updateNickname(nickname) {
        if (!this.userRef) return;
        return this.userRef.update({ nickname });
    }
    
    updateNote(note) {
        if (!this.userRef) return;
        return this.userRef.update({ note });
    }
    
    updateIntention(intention) {
        if (!this.userRef) return;
        const intentionData = INTENTIONS[intention];
        return this.userRef.update({
            intention,
            shape: intentionData.shape,
            color: intentionData.color
        });
    }
    
    updateEmotion(emotion) {
        if (!this.userRef) return;
        return this.userRef.update({ emotion });
    }
    
    updatePosition(x, y, z) {
        if (!this.userRef) return;
        return this.userRef.update({
            position: { x, y, z },
            lastSeen: firebase.database.ServerValue.TIMESTAMP
        });
    }
    
    // Resonance methods
    async addResonance(targetId) {
        if (!this.userRef) return;
        
        const snapshot = await this.userRef.child('resonatingWith').once('value');
        const currentResonance = snapshot.val() || [];
        
        if (!currentResonance.includes(targetId)) {
            currentResonance.push(targetId);
            await this.userRef.update({ resonatingWith: currentResonance });
        }
        
        return currentResonance;
    }
    
    async removeResonance(targetId) {
        if (!this.userRef) return;
        
        const snapshot = await this.userRef.child('resonatingWith').once('value');
        const currentResonance = snapshot.val() || [];
        
        const index = currentResonance.indexOf(targetId);
        if (index > -1) {
            currentResonance.splice(index, 1);
            await this.userRef.update({ resonatingWith: currentResonance });
        }
        
        return currentResonance;
    }
    
    async isResonatingWith(targetId) {
        if (!this.userRef) return false;
        
        const snapshot = await this.userRef.child('resonatingWith').once('value');
        const currentResonance = snapshot.val() || [];
        
        return currentResonance.includes(targetId);
    }
    
    // ========================
    // Sacred Geometry Methods
    // ========================
    
    setupSacredGeometryListeners() {
        // Listen for new sacred geometries
        this.sacredGeometryRef.on('child_added', (snapshot) => {
            const geometryId = snapshot.key;
            const geometryData = snapshot.val();
            
            if (this.onSacredGeometryCreated) {
                this.onSacredGeometryCreated(geometryId, geometryData);
            }
        });
        
        // Listen for updates
        this.sacredGeometryRef.on('child_changed', (snapshot) => {
            const geometryId = snapshot.key;
            const geometryData = snapshot.val();
            
            if (this.onSacredGeometryUpdated) {
                this.onSacredGeometryUpdated(geometryId, geometryData);
            }
        });
        
        // Listen for removals
        this.sacredGeometryRef.on('child_removed', (snapshot) => {
            const geometryId = snapshot.key;
            
            if (this.onSacredGeometryRemoved) {
                this.onSacredGeometryRemoved(geometryId);
            }
        });
    }
    
    async getAllSacredGeometries() {
        const snapshot = await this.sacredGeometryRef.once('value');
        const geometries = snapshot.val() || {};
        
        return Object.entries(geometries).map(([id, data]) => ({
            id,
            ...data
        }));
    }
    
    async createSacredGeometry(targetUserId) {
        // Create a new sacred geometry group
        const geometryId = generateUUID();
        const geometryRef = this.sacredGeometryRef.child(geometryId);
        
        // Get self and target user data
        const selfData = await this.getSelfData();
        const targetSnapshot = await this.db.ref(`users/${targetUserId}`).once('value');
        const targetData = targetSnapshot.val();
        
        if (!selfData || !targetData) return null;
        
        // Calculate center position between the two users
        const centerX = (selfData.position.x + targetData.position.x) / 2;
        const centerY = (selfData.position.y + targetData.position.y) / 2;
        const centerZ = (selfData.position.z + targetData.position.z) / 2;
        
        // Calculate main intention (most common, or creator's if tie)
        const mainIntention = selfData.intention;
        
        const geometryData = {
            createdAt: firebase.database.ServerValue.TIMESTAMP,
            createdBy: this.sessionId,
            creatorNickname: selfData.nickname,
            center: { x: centerX, y: centerY, z: centerZ },
            mainIntention: mainIntention,
            totalMembersEver: 2, // Track historical member count
            members: {
                [this.sessionId]: {
                    joinedAt: firebase.database.ServerValue.TIMESTAMP,
                    intention: selfData.intention,
                    nickname: selfData.nickname
                },
                [targetUserId]: {
                    joinedAt: firebase.database.ServerValue.TIMESTAMP,
                    intention: targetData.intention,
                    nickname: targetData.nickname,
                    pending: true  // Pending until they accept
                }
            },
            seed: Math.random() * 10000,  // Unique seed for geometry generation
            active: true
        };
        
        await geometryRef.set(geometryData);
        
        // Update self to reference this geometry
        await this.userRef.update({
            sacredGeometryId: geometryId,
            sacredGeometryPending: false
        });
        
        // Invite target user
        await this.db.ref(`users/${targetUserId}`).update({
            sacredGeometryInvite: geometryId,
            sacredGeometryInviteFrom: this.sessionId
        });
        
        // Remove geometry on disconnect if no other members
        geometryRef.child(`members/${this.sessionId}`).onDisconnect().remove();
        
        return geometryId;
    }
    
    async acceptSacredGeometryInvite(geometryId) {
        const selfData = await this.getSelfData();
        if (!selfData) return false;
        
        const geometryRef = this.sacredGeometryRef.child(geometryId);
        
        // Update member status
        await geometryRef.child(`members/${this.sessionId}`).update({
            pending: false,
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            intention: selfData.intention,
            nickname: selfData.nickname
        });
        
        // Update main intention based on all active members
        await this.updateGeometryMainIntention(geometryId);
        
        // Update self
        await this.userRef.update({
            sacredGeometryId: geometryId,
            sacredGeometryPending: false,
            sacredGeometryInvite: null,
            sacredGeometryInviteFrom: null
        });
        
        // Setup disconnect cleanup
        geometryRef.child(`members/${this.sessionId}`).onDisconnect().remove();
        
        return true;
    }
    
    async updateGeometryMainIntention(geometryId) {
        const geometryRef = this.sacredGeometryRef.child(geometryId);
        const snapshot = await geometryRef.once('value');
        const geometryData = snapshot.val();
        
        if (!geometryData || !geometryData.members) return;
        
        // Count intentions among active members
        const intentionCounts = {};
        const activeMembers = Object.values(geometryData.members).filter(m => !m.pending);
        
        activeMembers.forEach(member => {
            const intention = member.intention || 'observer';
            intentionCounts[intention] = (intentionCounts[intention] || 0) + 1;
        });
        
        // Find the most common intention
        let mainIntention = geometryData.mainIntention || 'observer';
        let maxCount = 0;
        
        Object.entries(intentionCounts).forEach(([intention, count]) => {
            if (count > maxCount) {
                maxCount = count;
                mainIntention = intention;
            }
        });
        
        await geometryRef.update({ mainIntention });
    }
    
    async declineSacredGeometryInvite() {
        const selfData = await this.getSelfData();
        if (!selfData || !selfData.sacredGeometryInvite) return;
        
        const geometryId = selfData.sacredGeometryInvite;
        
        // Remove self from pending members
        await this.sacredGeometryRef.child(`${geometryId}/members/${this.sessionId}`).remove();
        
        // Clear invite from self
        await this.userRef.update({
            sacredGeometryInvite: null,
            sacredGeometryInviteFrom: null
        });
    }
    
    async joinSacredGeometry(geometryId) {
        const selfData = await this.getSelfData();
        if (!selfData) return false;
        
        const geometryRef = this.sacredGeometryRef.child(geometryId);
        
        // Get current geometry data to update total members
        const snapshot = await geometryRef.once('value');
        const geometryData = snapshot.val();
        const currentTotal = geometryData?.totalMembersEver || 1;
        
        // Add self as member
        await geometryRef.child(`members/${this.sessionId}`).set({
            joinedAt: firebase.database.ServerValue.TIMESTAMP,
            intention: selfData.intention,
            nickname: selfData.nickname,
            pending: false
        });
        
        // Update total members count
        await geometryRef.update({
            totalMembersEver: currentTotal + 1
        });
        
        // Update main intention
        await this.updateGeometryMainIntention(geometryId);
        
        // Update self
        await this.userRef.update({
            sacredGeometryId: geometryId,
            sacredGeometryPending: false
        });
        
        // Setup disconnect cleanup
        geometryRef.child(`members/${this.sessionId}`).onDisconnect().remove();
        
        return true;
    }
    
    async leaveSacredGeometry() {
        const selfData = await this.getSelfData();
        if (!selfData || !selfData.sacredGeometryId) return;
        
        const geometryId = selfData.sacredGeometryId;
        const geometryRef = this.sacredGeometryRef.child(geometryId);
        
        // Remove self from members
        await geometryRef.child(`members/${this.sessionId}`).remove();
        
        // Check if geometry should be deleted (no active members)
        const snapshot = await geometryRef.child('members').once('value');
        const members = snapshot.val() || {};
        const activeMembers = Object.values(members).filter(m => !m.pending);
        
        if (activeMembers.length === 0) {
            // Delete the geometry
            await geometryRef.remove();
        }
        
        // Clear from self
        await this.userRef.update({
            sacredGeometryId: null,
            sacredGeometryPending: null
        });
    }
    
    async getSacredGeometry(geometryId) {
        const snapshot = await this.sacredGeometryRef.child(geometryId).once('value');
        return snapshot.val();
    }
    
    async updateSacredGeometryIntention() {
        const selfData = await this.getSelfData();
        if (!selfData || !selfData.sacredGeometryId) return;
        
        await this.sacredGeometryRef
            .child(`${selfData.sacredGeometryId}/members/${this.sessionId}`)
            .update({
                intention: selfData.intention
            });
    }
    
    // Cleanup
    async disconnect() {
        this.stopHeartbeat();
        
        // Remove all listeners
        if (this.usersRef) {
            this.usersRef.off();
        }
        
        // Remove user from database
        if (this.userRef) {
            await this.userRef.remove();
        }
        
        this.isConnected = false;
    }
}
