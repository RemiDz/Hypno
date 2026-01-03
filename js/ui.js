/* ============================================
   HYPNO - UI Management
   ============================================ */

import { INTENTIONS, EMOTIONS } from './config.js';
import { formatConnectionTime, showElement, pluralize } from './utils.js';

export class UIManager {
    constructor(firebaseSync, cosmicScene) {
        this.firebase = firebaseSync;
        this.scene = cosmicScene;
        
        // DOM Elements
        this.loadingScreen = document.getElementById('loading-screen');
        this.welcomeModal = document.getElementById('welcome-modal');
        this.soulsCounter = document.getElementById('souls-counter');
        this.menuBtn = document.getElementById('menu-btn');
        this.returnBtn = document.getElementById('return-btn');
        this.selfMenu = document.getElementById('self-menu');
        this.userMenu = document.getElementById('user-menu');
        
        // Inputs
        this.nicknameInput = document.getElementById('nickname-input');
        this.noteInput = document.getElementById('note-input');
        this.selfNickname = document.getElementById('self-nickname');
        this.selfNote = document.getElementById('self-note');
        
        // State
        this.selfData = null;
        this.selectedUserId = null;
        this.selectedUserData = null;
        this.connectionTimeInterval = null;
        
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Welcome modal - Enter button
        const enterBtn = document.getElementById('enter-btn');
        enterBtn.addEventListener('click', () => this.onEnterClick());
        
        // Menu button
        this.menuBtn.addEventListener('click', () => this.openSelfMenu());
        
        // Return button
        this.returnBtn.addEventListener('click', () => {
            if (this.scene) {
                this.scene.returnToSelf();
            }
        });
        
        // Close buttons
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.getAttribute('data-close');
                this.closeModal(modalId);
            });
        });
        
        // Click outside modal to close
        [this.selfMenu, this.userMenu].forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });
        
        // Intention buttons
        document.querySelectorAll('.intention-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const intention = btn.getAttribute('data-intention');
                this.selectIntention(intention);
            });
        });
        
        // Emotion buttons
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const emotion = btn.getAttribute('data-emotion');
                this.selectEmotion(emotion);
            });
        });
        
        // Self nickname/note input changes
        this.selfNickname.addEventListener('blur', () => {
            const nickname = this.selfNickname.value.trim() || 'Anonymous Wanderer';
            this.firebase.updateNickname(nickname);
        });
        
        this.selfNote.addEventListener('blur', () => {
            const note = this.selfNote.value.trim();
            this.firebase.updateNote(note);
        });
        
        // Resonate button
        const resonateBtn = document.getElementById('resonate-btn');
        resonateBtn.addEventListener('click', () => this.toggleResonance());
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });
    }
    
    // ========================
    // Loading & Welcome
    // ========================
    
    hideLoading() {
        this.loadingScreen.classList.add('hidden');
    }
    
    showWelcome() {
        this.hideLoading();
        showElement(this.welcomeModal, true);
    }
    
    async onEnterClick() {
        const nickname = this.nicknameInput.value.trim() || 'Anonymous Wanderer';
        const note = this.noteInput.value.trim();
        
        // Hide welcome, show main UI
        showElement(this.welcomeModal, false);
        this.showMainUI();
        
        // Emit enter event
        if (this.onEnter) {
            await this.onEnter(nickname, note);
        }
    }
    
    showMainUI() {
        this.menuBtn.classList.remove('hidden');
        this.returnBtn.classList.remove('hidden');
        
        // Show controls hint (only on desktop)
        const controlsHint = document.getElementById('controls-hint');
        if (controlsHint && !this.isMobile()) {
            controlsHint.classList.remove('hidden');
            
            // Auto-hide after 10 seconds
            setTimeout(() => {
                gsap.to(controlsHint, {
                    opacity: 0,
                    duration: 1,
                    onComplete: () => {
                        controlsHint.classList.add('hidden');
                    }
                });
            }, 10000);
        }
        
        // Animate in
        gsap.from(this.menuBtn, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            delay: 0.3
        });
        
        gsap.from(this.returnBtn, {
            y: 20,
            opacity: 0,
            duration: 0.5,
            delay: 0.4
        });
        
        gsap.from(this.soulsCounter, {
            y: -20,
            opacity: 0,
            duration: 0.5,
            delay: 0.5
        });
        
        if (controlsHint && !this.isMobile()) {
            gsap.from(controlsHint, {
                y: 20,
                opacity: 0,
                duration: 0.5,
                delay: 0.6
            });
        }
        
        // Show mobile joystick ONLY on mobile devices
        const mobileJoystick = document.getElementById('mobile-joystick');
        if (mobileJoystick && this.isMobile()) {
            mobileJoystick.classList.remove('hidden');
            mobileJoystick.classList.add('visible');
            
            gsap.from(mobileJoystick, {
                scale: 0,
                opacity: 0,
                duration: 0.5,
                delay: 0.7,
                ease: 'back.out(1.7)'
            });
        }
        
        // Show gyroscope button ONLY on mobile devices
        const gyroscopeBtn = document.getElementById('gyroscope-btn');
        if (gyroscopeBtn && this.isMobile()) {
            gyroscopeBtn.classList.remove('hidden');
            
            gsap.from(gyroscopeBtn, {
                scale: 0,
                opacity: 0,
                duration: 0.5,
                delay: 0.8,
                ease: 'back.out(1.7)'
            });
        }
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || 
               (window.innerWidth <= 768);
    }
    
    // ========================
    // Souls Counter
    // ========================
    
    updateSoulsCounter(count) {
        const text = count === 1 
            ? '✧ 1 soul connected ✧' 
            : `✧ ${count} souls connected ✧`;
        
        if (this.soulsCounter.textContent !== text) {
            gsap.to(this.soulsCounter, {
                opacity: 0.3,
                duration: 0.2,
                onComplete: () => {
                    this.soulsCounter.textContent = text;
                    gsap.to(this.soulsCounter, {
                        opacity: 1,
                        duration: 0.3
                    });
                }
            });
        }
    }
    
    // ========================
    // Self Menu
    // ========================
    
    openSelfMenu() {
        this.loadSelfData();
        showElement(this.selfMenu, true);
        
        // Start connection time updates
        this.startConnectionTimeUpdates();
    }
    
    async loadSelfData() {
        this.selfData = await this.firebase.getSelfData();
        
        if (!this.selfData) return;
        
        // Populate fields
        this.selfNickname.value = this.selfData.nickname || '';
        this.selfNote.value = this.selfData.note || '';
        
        // Update intention buttons
        this.updateIntentionButtons(this.selfData.intention);
        
        // Update emotion buttons
        this.updateEmotionButtons(this.selfData.emotion);
        
        // Update current selections text
        this.updateCurrentSelectionText();
        
        // Update resonance count
        const resonanceCount = this.selfData.resonatingWith?.length || 0;
        document.getElementById('self-resonance-count').textContent = 
            `${resonanceCount} ${pluralize(resonanceCount, 'soul')}`;
    }
    
    updateIntentionButtons(currentIntention) {
        document.querySelectorAll('.intention-btn').forEach(btn => {
            const intention = btn.getAttribute('data-intention');
            btn.classList.toggle('active', intention === currentIntention);
        });
    }
    
    updateEmotionButtons(currentEmotion) {
        document.querySelectorAll('.emotion-btn').forEach(btn => {
            const emotion = btn.getAttribute('data-emotion');
            btn.classList.toggle('active', emotion === currentEmotion);
        });
    }
    
    updateCurrentSelectionText() {
        if (!this.selfData) return;
        
        const intention = INTENTIONS[this.selfData.intention];
        const emotion = EMOTIONS[this.selfData.emotion];
        
        document.getElementById('current-intention').textContent = 
            `Currently: ${intention.icon} ${this.selfData.intention.charAt(0).toUpperCase() + this.selfData.intention.slice(1)} (${intention.shape.charAt(0).toUpperCase() + intention.shape.slice(1)} shape)`;
        
        document.getElementById('current-emotion').textContent = 
            `Currently: ${emotion.icon} ${this.selfData.emotion.charAt(0).toUpperCase() + this.selfData.emotion.slice(1)}${emotion.effect !== 'none' ? ` (${emotion.effect.charAt(0).toUpperCase() + emotion.effect.slice(1)} effect)` : ''}`;
    }
    
    selectIntention(intention) {
        this.firebase.updateIntention(intention);
        this.selfData.intention = intention;
        this.updateIntentionButtons(intention);
        this.updateCurrentSelectionText();
    }
    
    selectEmotion(emotion) {
        this.firebase.updateEmotion(emotion);
        this.selfData.emotion = emotion;
        this.updateEmotionButtons(emotion);
        this.updateCurrentSelectionText();
    }
    
    startConnectionTimeUpdates() {
        this.updateConnectionTime();
        this.connectionTimeInterval = setInterval(() => {
            this.updateConnectionTime();
        }, 1000);
    }
    
    stopConnectionTimeUpdates() {
        if (this.connectionTimeInterval) {
            clearInterval(this.connectionTimeInterval);
            this.connectionTimeInterval = null;
        }
    }
    
    updateConnectionTime() {
        if (!this.selfData?.connectedAt) return;
        
        const timeStr = formatConnectionTime(this.selfData.connectedAt);
        
        const selfTimeEl = document.getElementById('self-connection-time');
        if (selfTimeEl) {
            selfTimeEl.textContent = timeStr;
        }
        
        // Also update user menu if open
        if (this.selectedUserData?.connectedAt) {
            const userTimeEl = document.getElementById('user-connection-time');
            if (userTimeEl) {
                userTimeEl.textContent = formatConnectionTime(this.selectedUserData.connectedAt);
            }
        }
    }
    
    // ========================
    // User Menu (Other users)
    // ========================
    
    openUserMenu(userId, userData) {
        this.selectedUserId = userId;
        this.selectedUserData = userData;
        
        // Populate user info
        document.getElementById('user-display-name').textContent = `✧ ${userData.nickname || 'Anonymous'} ✧`;
        
        const intention = INTENTIONS[userData.intention];
        const emotion = EMOTIONS[userData.emotion];
        
        document.getElementById('user-intention').textContent = 
            `Intention: ${intention?.icon || '◯'} ${(userData.intention || 'observer').charAt(0).toUpperCase() + (userData.intention || 'observer').slice(1)}`;
        
        document.getElementById('user-emotion').textContent = 
            `Emotion: ${emotion?.icon || '😐'} ${(userData.emotion || 'neutral').charAt(0).toUpperCase() + (userData.emotion || 'neutral').slice(1)}`;
        
        document.getElementById('user-note').textContent = 
            userData.note ? `"${userData.note}"` : 'No note left...';
        
        document.getElementById('user-connection-time').textContent = 
            formatConnectionTime(userData.connectedAt);
        
        // Shape preview
        const shapePreview = document.getElementById('user-shape-preview');
        shapePreview.textContent = intention?.icon || '◯';
        shapePreview.style.color = intention?.color || '#FFFFFF';
        
        // Check resonance status
        this.updateResonanceStatus();
        
        // Show modal
        showElement(this.userMenu, true);
        
        // Start time updates
        this.startConnectionTimeUpdates();
    }
    
    async updateResonanceStatus() {
        const isResonating = await this.firebase.isResonatingWith(this.selectedUserId);
        
        const resonateBtn = document.getElementById('resonate-btn');
        const resonanceStatus = document.getElementById('resonance-status');
        
        if (isResonating) {
            resonateBtn.classList.add('active');
            resonateBtn.querySelector('.resonate-text').textContent = 'STOP RESONATING';
            resonanceStatus.textContent = 'Currently resonating: YES ✧';
        } else {
            resonateBtn.classList.remove('active');
            resonateBtn.querySelector('.resonate-text').textContent = 'RESONATE WITH THIS SOUL';
            resonanceStatus.textContent = 'Currently resonating: NO';
        }
    }
    
    async toggleResonance() {
        if (!this.selectedUserId) return;
        
        const isResonating = await this.firebase.isResonatingWith(this.selectedUserId);
        
        if (isResonating) {
            await this.firebase.removeResonance(this.selectedUserId);
        } else {
            await this.firebase.addResonance(this.selectedUserId);
        }
        
        await this.updateResonanceStatus();
    }
    
    // ========================
    // Modal Management
    // ========================
    
    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            showElement(modal, false);
        }
        
        this.stopConnectionTimeUpdates();
        
        if (modalId === 'user-menu') {
            this.selectedUserId = null;
            this.selectedUserData = null;
        }
    }
    
    closeAllModals() {
        showElement(this.selfMenu, false);
        showElement(this.userMenu, false);
        this.stopConnectionTimeUpdates();
        this.selectedUserId = null;
        this.selectedUserData = null;
    }
    
    // ========================
    // Public API
    // ========================
    
    setOnEnterCallback(callback) {
        this.onEnter = callback;
    }
    
    setFirebaseSync(firebaseSync) {
        this.firebase = firebaseSync;
    }
    
    setCosmicScene(scene) {
        this.scene = scene;
    }
}
