/* ============================================
   HYPNO - UI Management
   ============================================ */

import { INTENTIONS, EMOTIONS, DEFAULT_USER } from './config.js';
import { 
    formatConnectionTime, 
    showElement, 
    pluralize, 
    loadFromLocal, 
    saveToLocal,
    clearLocalKeys
} from './utils.js';

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
        this.settingsBtn = document.getElementById('settings-btn');
        this.selfMenu = document.getElementById('self-menu');
        this.userMenu = document.getElementById('user-menu');
        this.settingsMenu = document.getElementById('settings-menu');
        
        // Inputs
        this.nicknameInput = document.getElementById('nickname-input');
        this.noteInput = document.getElementById('note-input');
        this.selfNickname = document.getElementById('self-nickname');
        this.selfNote = document.getElementById('self-note');
        
        // Settings
        this.defaultSettings = {
            showJoystick: true,
            enableGyroscope: false,
            showLabels: true,
            showParticles: true,
            autoRotate: true,
            lowQuality: false
        };
        this.settings = { ...this.defaultSettings };
        this.storageKeys = {
            profile: 'hypno_profile',
            settings: 'hypno_settings'
        };
        
        // State
        this.selfData = null;
        this.selectedUserId = null;
        this.selectedUserData = null;
        this.connectionTimeInterval = null;
        
        this.loadSavedSettings();
        this.loadSavedProfile();
        this.applySettingsAfterLoad();
        this.syncSettingsToggles();
        this.init();
    }
    
    init() {
        this.bindEvents();
    }
    
    bindEvents() {
        // Welcome modal - Enter button
        const enterBtn = document.getElementById('enter-btn');
        enterBtn.addEventListener('click', () => this.onEnterClick());
        this.nicknameInput.addEventListener('input', () => this.persistProfile());
        this.noteInput.addEventListener('input', () => this.persistProfile());
        
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
        
        // Settings button
        if (this.settingsBtn) {
            const openSettings = (e) => {
                e.preventDefault();
                this.openSettingsMenu();
            };
            this.settingsBtn.addEventListener('click', openSettings);
            this.settingsBtn.addEventListener('touchend', openSettings);
        }
        
        // Click outside modal to close
        const sgInfoModal = document.getElementById('sg-info-modal');
        [this.selfMenu, this.userMenu, this.settingsMenu, sgInfoModal].forEach(modal => {
            if (modal) {
                modal.addEventListener('click', (e) => {
                    if (e.target === modal) {
                        this.closeModal(modal.id);
                    }
                });
            }
        });
        
        // Settings toggles
        this.bindSettingsEvents();
        
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
            this.persistProfile();
        });
        
        this.selfNote.addEventListener('blur', () => {
            const note = this.selfNote.value.trim();
            this.firebase.updateNote(note);
            this.persistProfile();
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
        this.persistProfile();
        
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
        
        // Show settings button
        if (this.settingsBtn) {
            this.settingsBtn.classList.remove('hidden');
        }
        
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
        
        if (this.settingsBtn) {
            gsap.from(this.settingsBtn, {
                scale: 0,
                opacity: 0,
                duration: 0.5,
                delay: 0.5,
                ease: 'back.out(1.7)'
            });
        }
        
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
            if (this.settings.showJoystick) {
                mobileJoystick.classList.remove('hidden');
                mobileJoystick.classList.add('visible');
                
                gsap.from(mobileJoystick, {
                    scale: 0,
                    opacity: 0,
                    duration: 0.5,
                    delay: 0.7,
                    ease: 'back.out(1.7)'
                });
            } else {
                mobileJoystick.classList.add('hidden');
                mobileJoystick.classList.remove('visible');
            }
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
        
        const intentionKey = this.selfData.intention || 'observer';
        const emotionKey = this.selfData.emotion || 'neutral';
        const intention = INTENTIONS[intentionKey] || INTENTIONS.observer;
        const emotion = EMOTIONS[emotionKey] || EMOTIONS.neutral;
        
        document.getElementById('current-intention').textContent = 
            `Currently: ${intention.icon} ${intentionKey.charAt(0).toUpperCase() + intentionKey.slice(1)} (${intention.shape.charAt(0).toUpperCase() + intention.shape.slice(1)} shape)`;
        
        document.getElementById('current-emotion').textContent = 
            `Currently: ${emotion.icon} ${emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1)}${emotion.effect !== 'none' ? ` (${emotion.effect.charAt(0).toUpperCase() + emotion.effect.slice(1)} effect)` : ''}`;
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
        
        const safeNickname = userData?.nickname || 'Anonymous';
        const intentionKey = userData?.intention || 'observer';
        const emotionKey = userData?.emotion || 'neutral';
        const intention = INTENTIONS[intentionKey] || INTENTIONS.observer;
        const emotion = EMOTIONS[emotionKey] || EMOTIONS.neutral;
        const connectionTime = userData?.connectedAt ? formatConnectionTime(userData.connectedAt) : 'Moments ago';
        const noteText = userData?.note ? `"${userData.note}"` : 'No note left...';
        
        // Populate user info
        document.getElementById('user-display-name').textContent = `✧ ${safeNickname} ✧`;
        
        document.getElementById('user-intention').textContent = 
            `Intention: ${intention?.icon || '◯'} ${intentionKey.charAt(0).toUpperCase() + intentionKey.slice(1)}`;
        
        document.getElementById('user-emotion').textContent = 
            `Emotion: ${emotion?.icon || '😐'} ${emotionKey.charAt(0).toUpperCase() + emotionKey.slice(1)}`;
        
        document.getElementById('user-note').textContent = 
            noteText;
        
        document.getElementById('user-connection-time').textContent = 
            connectionTime;
        
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
        if (this.settingsMenu) {
            showElement(this.settingsMenu, false);
        }
        // Close sacred geometry info modal
        const sgInfoModal = document.getElementById('sg-info-modal');
        if (sgInfoModal) {
            showElement(sgInfoModal, false);
        }
        this.stopConnectionTimeUpdates();
        this.selectedUserId = null;
        this.selectedUserData = null;
    }
    
    // ========================
    // Settings Management
    // ========================
    
    bindSettingsEvents() {
        // Joystick toggle
        const joystickToggle = document.getElementById('setting-joystick');
        if (joystickToggle) {
            joystickToggle.addEventListener('change', (e) => {
                this.settings.showJoystick = e.target.checked;
                this.applyJoystickSetting();
                this.persistSettings();
            });
        }
        
        // Gyroscope toggle
        const gyroToggle = document.getElementById('setting-gyroscope');
        if (gyroToggle) {
            gyroToggle.addEventListener('change', async (e) => {
                this.settings.enableGyroscope = e.target.checked;
                await this.applyGyroscopeSetting();
                this.persistSettings();
            });
        }
        
        // Labels toggle
        const labelsToggle = document.getElementById('setting-labels');
        if (labelsToggle) {
            labelsToggle.addEventListener('change', (e) => {
                this.settings.showLabels = e.target.checked;
                this.applyLabelsSetting();
                this.persistSettings();
            });
        }
        
        // Particles toggle
        const particlesToggle = document.getElementById('setting-particles');
        if (particlesToggle) {
            particlesToggle.addEventListener('change', (e) => {
                this.settings.showParticles = e.target.checked;
                this.applyParticlesSetting();
                this.persistSettings();
            });
        }
        
        // Auto-rotate toggle
        const autoRotateToggle = document.getElementById('setting-autorotate');
        if (autoRotateToggle) {
            autoRotateToggle.addEventListener('change', (e) => {
                this.settings.autoRotate = e.target.checked;
                this.applyAutoRotateSetting();
                this.persistSettings();
            });
        }
        
        // Low quality toggle
        const lowQualityToggle = document.getElementById('setting-lowquality');
        if (lowQualityToggle) {
            lowQualityToggle.addEventListener('change', (e) => {
                this.settings.lowQuality = e.target.checked;
                // Could implement quality reduction here
                this.persistSettings();
            });
        }

        const clearDataBtn = document.getElementById('setting-clear-data');
        if (clearDataBtn) {
            clearDataBtn.addEventListener('click', () => this.clearLocalData());
        }
        
        // Reset app button (clears everything and reloads)
        const resetAppBtn = document.getElementById('setting-reset-app');
        if (resetAppBtn) {
            resetAppBtn.addEventListener('click', () => this.resetAppCompletely());
        }
    }
    
    resetAppCompletely() {
        if (confirm('This will clear all your data and reload the app. Are you sure?')) {
            // Clear all localStorage
            localStorage.clear();
            
            // Clear any sessionStorage
            sessionStorage.clear();
            
            // Unregister service worker if present
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(registrations => {
                    registrations.forEach(registration => {
                        registration.unregister();
                    });
                });
            }
            
            // Clear caches
            if ('caches' in window) {
                caches.keys().then(names => {
                    names.forEach(name => {
                        caches.delete(name);
                    });
                });
            }
            
            // Reload the page after a small delay to ensure cleanup
            setTimeout(() => {
                window.location.reload(true);
            }, 100);
        }
    }
    
    openSettingsMenu() {
        if (!this.settingsMenu) return;
        
        this.syncSettingsToggles();
        
        showElement(this.settingsMenu, true);
    }
    
    applyJoystickSetting() {
        const joystick = document.getElementById('mobile-joystick');
        if (joystick) {
            if (this.settings.showJoystick && this.isMobile()) {
                joystick.classList.remove('hidden');
                joystick.classList.add('visible');
            } else {
                joystick.classList.add('hidden');
                joystick.classList.remove('visible');
            }
        }
    }
    
    async applyGyroscopeSetting() {
        if (!this.scene) return;
        
        if (this.settings.enableGyroscope) {
            await this.scene.enableGyroscope();
        } else {
            this.scene.disableGyroscope();
        }
    }
    
    applyLabelsSetting() {
        if (!this.scene) return;
        
        this.scene.users.forEach(userShape => {
            if (userShape.label) {
                userShape.label.visible = this.settings.showLabels;
            }
        });
    }
    
    applyParticlesSetting() {
        if (!this.scene) return;
        
        this.scene.users.forEach(userShape => {
            if (userShape.emotionEffect && userShape.emotionEffect.particles) {
                userShape.emotionEffect.particles.visible = this.settings.showParticles;
            }
        });
    }
    
    applyAutoRotateSetting() {
        if (!this.scene) return;
        
        this.scene.controls.autoRotate = this.settings.autoRotate;
    }

    syncSettingsToggles() {
        const joystickToggle = document.getElementById('setting-joystick');
        const gyroToggle = document.getElementById('setting-gyroscope');
        const labelsToggle = document.getElementById('setting-labels');
        const particlesToggle = document.getElementById('setting-particles');
        const autoRotateToggle = document.getElementById('setting-autorotate');
        const lowQualityToggle = document.getElementById('setting-lowquality');
        
        if (joystickToggle) joystickToggle.checked = this.settings.showJoystick;
        if (gyroToggle) gyroToggle.checked = this.settings.enableGyroscope;
        if (labelsToggle) labelsToggle.checked = this.settings.showLabels;
        if (particlesToggle) particlesToggle.checked = this.settings.showParticles;
        if (autoRotateToggle) autoRotateToggle.checked = this.settings.autoRotate;
        if (lowQualityToggle) lowQualityToggle.checked = this.settings.lowQuality;
    }
    
    applySettingsAfterLoad() {
        this.applyJoystickSetting();
        this.applyLabelsSetting();
        this.applyParticlesSetting();
        this.applyAutoRotateSetting();
        
        // Apply gyroscope only if user previously enabled it (may prompt permission)
        if (this.settings.enableGyroscope) {
            this.applyGyroscopeSetting();
        }
    }
    
    loadSavedSettings() {
        const saved = loadFromLocal(this.storageKeys.settings, null);
        if (saved) {
            this.settings = { ...this.defaultSettings, ...saved };
        }
    }
    
    loadSavedProfile() {
        const profile = loadFromLocal(this.storageKeys.profile, null);
        if (!profile) return;
        
        const nickname = profile.nickname || '';
        const note = profile.note || '';
        
        if (this.nicknameInput && nickname) this.nicknameInput.value = nickname;
        if (this.noteInput && note) this.noteInput.value = note;
        if (this.selfNickname && nickname) this.selfNickname.value = nickname;
        if (this.selfNote && note) this.selfNote.value = note;
    }
    
    persistSettings() {
        saveToLocal(this.storageKeys.settings, this.settings);
    }
    
    persistProfile() {
        const nickname = (this.nicknameInput?.value || '').trim() || DEFAULT_USER.nickname;
        const note = (this.noteInput?.value || '').trim();
        saveToLocal(this.storageKeys.profile, { nickname, note });
    }
    
    clearLocalData() {
        clearLocalKeys([this.storageKeys.profile, this.storageKeys.settings]);
        this.settings = { ...this.defaultSettings };
        this.syncSettingsToggles();
        this.applySettingsAfterLoad();
        
        if (this.nicknameInput) this.nicknameInput.value = '';
        if (this.noteInput) this.noteInput.value = '';
        if (this.selfNickname) this.selfNickname.value = '';
        if (this.selfNote) this.selfNote.value = '';
        
        if (this.firebase) {
            this.firebase.updateNickname(DEFAULT_USER.nickname);
            this.firebase.updateNote('');
        }
        
        alert('Local data cleared. Please re-enter your name and settings.');
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
