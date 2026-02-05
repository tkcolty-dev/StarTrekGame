// Star Trek: Strange New Worlds - USS Enterprise Game

class StarTrekGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.enterprise = null;
        this.enemies = [];
        this.projectiles = [];
        this.particles = [];

        this.stats = {
            hull: 100, maxHull: 100,
            shields: 100, maxShields: 100,
            energy: 100, maxEnergy: 100,
            phaserCharge: 100,
            torpedoes: 10, maxTorpedoes: 10,
            phaserDamage: 50, torpedoDamage: 200,
            shieldsActive: true,
            speed: 0, maxSpeed: 2,
            warpSpeed: 0, maxWarp: 9,
            turnSpeed: 0.05,
            credits: 0
        };

        // Ship systems damage tracking
        this.systems = {
            engines: { health: 100, maxHealth: 100, name: 'Impulse Engines' },
            warpCore: { health: 100, maxHealth: 100, name: 'Warp Core' },
            weapons: { health: 100, maxHealth: 100, name: 'Weapons Array' },
            shields: { health: 100, maxHealth: 100, name: 'Shield Generators' },
            sensors: { health: 100, maxHealth: 100, name: 'Sensor Array' }
        };

        // Hull breach visual effects
        this.hullBreaches = [];
        this.shipFires = [];

        // Torpedo reload system
        this.torpedoReloading = false;
        this.torpedoReloadTimer = 0;
        this.torpedoReloadTime = 30000; // 30 seconds

        // Crew dialog system
        this.crewDialogQueue = [];
        this.lastCrewDialog = 0;
        this.crewDialogCooldown = 3000; // Min time between dialogs
        this.lastShieldReport = 100;
        this.announcedEnemies = new Set();

        // Repair system
        this.isRepairing = false;

        this.upgrades = {
            hullPlating: { name: 'Reinforced Hull', desc: '+50 Max Hull', cost: 500, purchased: false, effect: () => { this.stats.maxHull += 50; this.stats.hull = this.stats.maxHull; }},
            shieldBoost: { name: 'Enhanced Shields', desc: '+50 Max Shields', cost: 500, purchased: false, effect: () => { this.stats.maxShields += 50; this.stats.shields = this.stats.maxShields; }},
            phaserUpgrade: { name: 'Phaser Overcharge', desc: '+15 Phaser Damage', cost: 750, purchased: false, effect: () => { this.stats.phaserDamage += 15; }},
            torpedoUpgrade: { name: 'Quantum Torpedoes', desc: '+50 Torpedo Damage', cost: 1000, purchased: false, effect: () => { this.stats.torpedoDamage += 50; }},
            extraTorpedoes: { name: 'Torpedo Bay', desc: '+5 Max Torpedoes', cost: 400, purchased: false, effect: () => { this.stats.maxTorpedoes += 5; this.stats.torpedoes = this.stats.maxTorpedoes; }},
            engineBoost: { name: 'Impulse Upgrade', desc: '+0.5 Max Speed', cost: 600, purchased: false, effect: () => { this.stats.maxSpeed += 0.5; }},
            warpCore: { name: 'Warp Core Upgrade', desc: '+2 Max Warp', cost: 800, purchased: false, effect: () => { this.stats.maxWarp += 2; }},
            energyCell: { name: 'Dilithium Chamber', desc: '+50 Max Energy', cost: 450, purchased: false, effect: () => { this.stats.maxEnergy += 50; this.stats.energy = this.stats.maxEnergy; }}
        };

        this.currentMission = null;
        this.missions = {
            patrol: { name: 'Border Patrol', desc: 'Defend the neutral zone from Klingon raiders', waves: 5, difficulty: 1 },
            rescue: { name: 'Rescue Mission', desc: 'Fight through Romulan forces to rescue stranded crew', waves: 7, difficulty: 1.5 },
            assault: { name: 'Deep Strike', desc: 'Assault enemy staging area', waves: 10, difficulty: 2 },
            survival: { name: 'Survival', desc: 'Survive endless waves of enemies', waves: Infinity, difficulty: 1 }
        };

        this.wave = 1;
        this.maxWaves = 5;
        this.enemiesKilled = 0;
        this.isGameOver = false;
        this.isPaused = false;
        this.gameStarted = false;

        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false, rightDown: false };
        this.cameraDistance = 60;
        this.cameraRotation = { x: 0.3, y: 0 };
        this.cameraTargetRotation = { x: 0.3, y: 0 };
        this.cameraDrag = { startX: 0, startY: 0, startRotX: 0, startRotY: 0 };
        this.isDraggingCamera = false;
        this.cameraFollowShip = true;

        // Mouse flight controls
        this.mouseFlightEnabled = true;
        this.mouseSensitivity = 0.012; // Very responsive controls
        this.autopilotEnabled = false;

        this.phaserCooldown = 0;
        this.torpedoCooldown = 0;

        this.uiVisible = true;

        // Target lock system
        this.targetLocked = null;
        this.targetLockIndicator = null;

        // Kill cam
        this.killCamActive = false;
        this.killCamTarget = null;
        this.killCamTimer = 0;
        this.savedCameraState = null;

        this.nacelleGlows = [];
        this.bussardGlows = [];
        this.impulseGlows = [];

        // Audio system
        this.audioCtx = null;
        this.soundEnabled = true;
        this.masterVolume = 0.5;
        this.sfxVolume = 0.7;
        this.musicVolume = 0.3;
        this.engineOscillator = null;
        this.engineGain = null;
        this.warpOscillator = null;
        this.warpGain = null;

        this.init();
    }

    init() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x000008);
        this.scene.fog = new THREE.FogExp2(0x000011, 0.0005);

        this.camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.camera.position.set(0, 30, 80);

        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('gameCanvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        this.setupAudio();
        this.setupLighting();
        this.createStarfield();
        this.createNebula();
        this.createEnterprise();
        this.createTargetLockIndicator();
        this.setupControls();
        this.setupMinimap();
        this.populateUpgrades();

        // Show title screen instead of starting immediately
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('titleScreen').classList.add('active');
        }, 2500);

        this.lastTime = performance.now();
        this.animate();
    }

    // ============================================
    // AUDIO SYSTEM - IMPROVED STAR TREK SOUNDS
    // ============================================

    setupAudio() {
        const initAudio = () => {
            if (this.audioCtx) return;
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioCtx.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioCtx.destination);
            this.startEngineSound();
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    startEngineSound() {
        if (!this.audioCtx || this.engineOscillator) return;

        // Layered engine hum for richer sound
        const createEngineLayer = (freq, type, vol) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            const filter = this.audioCtx.createBiquadFilter();
            osc.type = type;
            osc.frequency.value = freq;
            filter.type = 'lowpass';
            filter.frequency.value = 150;
            filter.Q.value = 2;
            gain.gain.value = vol;
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            osc.start();
            return { osc, gain, filter };
        };

        this.engineLayers = [
            createEngineLayer(55, 'sawtooth', 0.02),
            createEngineLayer(82.5, 'triangle', 0.015),
            createEngineLayer(110, 'sine', 0.01)
        ];
        this.engineOscillator = this.engineLayers[0].osc;
        this.engineGain = this.engineLayers[0].gain;

        // Warp drive - ethereal whooshing
        this.warpOscillator = this.audioCtx.createOscillator();
        this.warpGain = this.audioCtx.createGain();
        this.warpOscillator.type = 'sine';
        this.warpOscillator.frequency.value = 120;
        this.warpGain.gain.value = 0;

        const warpFilter = this.audioCtx.createBiquadFilter();
        warpFilter.type = 'bandpass';
        warpFilter.frequency.value = 200;
        warpFilter.Q.value = 3;

        this.warpOscillator.connect(warpFilter);
        warpFilter.connect(this.warpGain);
        this.warpGain.connect(this.masterGain);
        this.warpOscillator.start();
    }

    updateEngineSound() {
        if (!this.audioCtx || !this.engineLayers) return;

        const speedRatio = this.stats.speed / this.stats.maxSpeed;
        const baseVol = 0.02 + speedRatio * 0.04;

        this.engineLayers.forEach((layer, i) => {
            const vol = baseVol * (1 - i * 0.3);
            layer.gain.gain.linearRampToValueAtTime(vol * this.sfxVolume, this.audioCtx.currentTime + 0.1);
            layer.filter.frequency.linearRampToValueAtTime(150 + speedRatio * 100, this.audioCtx.currentTime + 0.1);
        });

        if (this.warpGain) {
            const warpRatio = this.stats.warpSpeed / this.stats.maxWarp;
            this.warpGain.gain.linearRampToValueAtTime(warpRatio * 0.06 * this.sfxVolume, this.audioCtx.currentTime + 0.1);
            this.warpOscillator.frequency.linearRampToValueAtTime(120 + warpRatio * 180, this.audioCtx.currentTime + 0.1);
        }
    }

    playPhaserSound() {
        if (!this.audioCtx || !this.soundEnabled) return;

        const duration = 0.6;
        const t = this.audioCtx.currentTime;

        // Main beam - characteristic Star Trek phaser
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(1200, t);
        osc1.frequency.exponentialRampToValueAtTime(400, t + duration);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(1180, t);
        osc2.frequency.exponentialRampToValueAtTime(380, t + duration);

        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(800, t);
        filter.frequency.exponentialRampToValueAtTime(500, t + duration);
        filter.Q.value = 4;

        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.12 * this.sfxVolume, t + 0.02);
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, t + duration * 0.7);
        gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

        const merger = this.audioCtx.createChannelMerger(2);
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);

        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration);
        osc2.stop(t + duration);

        // Add subtle warble
        const lfo = this.audioCtx.createOscillator();
        const lfoGain = this.audioCtx.createGain();
        lfo.frequency.value = 30;
        lfoGain.gain.value = 20;
        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);
        lfo.start(t);
        lfo.stop(t + duration);
    }

    playTorpedoSound() {
        if (!this.audioCtx || !this.soundEnabled) return;

        const t = this.audioCtx.currentTime;

        // Tube launch - pneumatic thump
        const launchOsc = this.audioCtx.createOscillator();
        const launchGain = this.audioCtx.createGain();
        const launchFilter = this.audioCtx.createBiquadFilter();
        launchOsc.type = 'sine';
        launchOsc.frequency.setValueAtTime(150, t);
        launchOsc.frequency.exponentialRampToValueAtTime(30, t + 0.12);
        launchFilter.type = 'lowpass';
        launchFilter.frequency.value = 200;
        launchGain.gain.setValueAtTime(0.35 * this.sfxVolume, t);
        launchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        launchOsc.connect(launchFilter);
        launchFilter.connect(launchGain);
        launchGain.connect(this.masterGain);
        launchOsc.start(t);
        launchOsc.stop(t + 0.15);

        // Photon energy charge-up whine
        const chargeOsc = this.audioCtx.createOscillator();
        const chargeGain = this.audioCtx.createGain();
        chargeOsc.type = 'sine';
        chargeOsc.frequency.setValueAtTime(400, t + 0.05);
        chargeOsc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);
        chargeOsc.frequency.exponentialRampToValueAtTime(800, t + 0.6);
        chargeGain.gain.setValueAtTime(0.1 * this.sfxVolume, t + 0.05);
        chargeGain.gain.linearRampToValueAtTime(0.15 * this.sfxVolume, t + 0.2);
        chargeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        chargeOsc.connect(chargeGain);
        chargeGain.connect(this.masterGain);
        chargeOsc.start(t + 0.05);
        chargeOsc.stop(t + 0.7);

        // Harmonic overtone
        const harmOsc = this.audioCtx.createOscillator();
        const harmGain = this.audioCtx.createGain();
        harmOsc.type = 'triangle';
        harmOsc.frequency.setValueAtTime(800, t + 0.05);
        harmOsc.frequency.exponentialRampToValueAtTime(2400, t + 0.3);
        harmGain.gain.setValueAtTime(0.04 * this.sfxVolume, t + 0.05);
        harmGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        harmOsc.connect(harmGain);
        harmGain.connect(this.masterGain);
        harmOsc.start(t + 0.05);
        harmOsc.stop(t + 0.5);

        // Doppler whoosh away
        const whooshOsc = this.audioCtx.createOscillator();
        const whooshGain = this.audioCtx.createGain();
        const whooshFilter = this.audioCtx.createBiquadFilter();
        whooshOsc.type = 'sawtooth';
        whooshOsc.frequency.setValueAtTime(600, t + 0.1);
        whooshOsc.frequency.exponentialRampToValueAtTime(200, t + 0.8);
        whooshFilter.type = 'bandpass';
        whooshFilter.frequency.setValueAtTime(800, t + 0.1);
        whooshFilter.frequency.exponentialRampToValueAtTime(300, t + 0.8);
        whooshFilter.Q.value = 3;
        whooshGain.gain.setValueAtTime(0.06 * this.sfxVolume, t + 0.1);
        whooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
        whooshOsc.connect(whooshFilter);
        whooshFilter.connect(whooshGain);
        whooshGain.connect(this.masterGain);
        whooshOsc.start(t + 0.1);
        whooshOsc.stop(t + 0.9);
    }

    playExplosionSound() {
        if (!this.audioCtx || !this.soundEnabled) return;

        const t = this.audioCtx.currentTime;
        const duration = 2.0;

        // === INITIAL IMPACT - the moment of explosion ===
        const impactOsc = this.audioCtx.createOscillator();
        const impactGain = this.audioCtx.createGain();
        const impactFilter = this.audioCtx.createBiquadFilter();
        impactOsc.type = 'sawtooth';
        impactOsc.frequency.setValueAtTime(200, t);
        impactOsc.frequency.exponentialRampToValueAtTime(30, t + 0.15);
        impactFilter.type = 'lowpass';
        impactFilter.frequency.setValueAtTime(800, t);
        impactFilter.frequency.exponentialRampToValueAtTime(100, t + 0.2);
        impactGain.gain.setValueAtTime(0.6 * this.sfxVolume, t);
        impactGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        impactOsc.connect(impactFilter);
        impactFilter.connect(impactGain);
        impactGain.connect(this.masterGain);
        impactOsc.start(t);
        impactOsc.stop(t + 0.2);

        // === DEEP BASS BOOM - the shockwave ===
        const boomOsc = this.audioCtx.createOscillator();
        const boomGain = this.audioCtx.createGain();
        boomOsc.type = 'sine';
        boomOsc.frequency.setValueAtTime(80, t);
        boomOsc.frequency.exponentialRampToValueAtTime(15, t + 0.8);
        boomGain.gain.setValueAtTime(0.55 * this.sfxVolume, t);
        boomGain.gain.setValueAtTime(0.55 * this.sfxVolume, t + 0.05);
        boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        boomOsc.connect(boomGain);
        boomGain.connect(this.masterGain);
        boomOsc.start(t);
        boomOsc.stop(t + 0.8);

        // === SUB-BASS RUMBLE - felt more than heard ===
        const subOsc = this.audioCtx.createOscillator();
        const subGain = this.audioCtx.createGain();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(40, t);
        subOsc.frequency.exponentialRampToValueAtTime(20, t + 1.2);
        subGain.gain.setValueAtTime(0.4 * this.sfxVolume, t + 0.05);
        subGain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);
        subOsc.connect(subGain);
        subGain.connect(this.masterGain);
        subOsc.start(t);
        subOsc.stop(t + 1.2);

        // === FIRE/PLASMA ROAR - the burning aftermath ===
        const fireBufferSize = this.audioCtx.sampleRate * 1.5;
        const fireBuffer = this.audioCtx.createBuffer(1, fireBufferSize, this.audioCtx.sampleRate);
        const fireData = fireBuffer.getChannelData(0);
        for (let i = 0; i < fireBufferSize; i++) {
            const env = Math.exp(-i / (fireBufferSize * 0.3)) * (Math.sin(i / 500) * 0.5 + 0.5);
            fireData[i] = (Math.random() * 2 - 1) * env;
        }
        const fireNoise = this.audioCtx.createBufferSource();
        fireNoise.buffer = fireBuffer;
        const fireFilter = this.audioCtx.createBiquadFilter();
        const fireGain = this.audioCtx.createGain();
        fireFilter.type = 'bandpass';
        fireFilter.frequency.setValueAtTime(400, t + 0.1);
        fireFilter.frequency.exponentialRampToValueAtTime(150, t + 1.5);
        fireFilter.Q.value = 1.5;
        fireGain.gain.setValueAtTime(0.001, t);
        fireGain.gain.linearRampToValueAtTime(0.3 * this.sfxVolume, t + 0.15);
        fireGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        fireNoise.connect(fireFilter);
        fireFilter.connect(fireGain);
        fireGain.connect(this.masterGain);
        fireNoise.start(t);

        // === DEBRIS SCATTER - metal and hull fragments ===
        const debrisBufferSize = this.audioCtx.sampleRate * duration;
        const debrisBuffer = this.audioCtx.createBuffer(1, debrisBufferSize, this.audioCtx.sampleRate);
        const debrisData = debrisBuffer.getChannelData(0);
        for (let i = 0; i < debrisBufferSize; i++) {
            const env = Math.exp(-i / (debrisBufferSize * 0.15));
            // Create metallic pings and clanks randomly
            if (Math.random() < 0.002) {
                const pingLength = Math.floor(Math.random() * 800 + 200);
                for (let j = 0; j < pingLength && i + j < debrisBufferSize; j++) {
                    debrisData[i + j] += Math.sin(j * (0.1 + Math.random() * 0.2)) *
                                         Math.exp(-j / 100) * env * 0.5;
                }
            }
            debrisData[i] += (Math.random() * 2 - 1) * env * 0.1;
        }
        const debrisNoise = this.audioCtx.createBufferSource();
        debrisNoise.buffer = debrisBuffer;
        const debrisFilter = this.audioCtx.createBiquadFilter();
        const debrisGain = this.audioCtx.createGain();
        debrisFilter.type = 'highpass';
        debrisFilter.frequency.setValueAtTime(2000, t);
        debrisFilter.frequency.exponentialRampToValueAtTime(500, t + duration);
        debrisGain.gain.setValueAtTime(0.25 * this.sfxVolume, t + 0.05);
        debrisGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
        debrisNoise.connect(debrisFilter);
        debrisFilter.connect(debrisGain);
        debrisGain.connect(this.masterGain);
        debrisNoise.start(t);

        // === ELECTRICAL CRACKLE - systems shorting out ===
        const crackleOsc = this.audioCtx.createOscillator();
        const crackleGain = this.audioCtx.createGain();
        const crackleFilter = this.audioCtx.createBiquadFilter();
        crackleOsc.type = 'square';
        crackleOsc.frequency.setValueAtTime(120, t + 0.08);
        crackleOsc.frequency.setValueAtTime(80, t + 0.2);
        crackleOsc.frequency.setValueAtTime(150, t + 0.3);
        crackleOsc.frequency.exponentialRampToValueAtTime(40, t + 1.0);
        crackleFilter.type = 'bandpass';
        crackleFilter.frequency.value = 1500;
        crackleFilter.Q.value = 3;
        crackleGain.gain.setValueAtTime(0.001, t);
        crackleGain.gain.linearRampToValueAtTime(0.1 * this.sfxVolume, t + 0.1);
        crackleGain.gain.setValueAtTime(0.05 * this.sfxVolume, t + 0.15);
        crackleGain.gain.linearRampToValueAtTime(0.08 * this.sfxVolume, t + 0.25);
        crackleGain.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
        crackleOsc.connect(crackleFilter);
        crackleFilter.connect(crackleGain);
        crackleGain.connect(this.masterGain);
        crackleOsc.start(t + 0.08);
        crackleOsc.stop(t + 1.0);
    }

    playShieldHitSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        const t = this.audioCtx.currentTime;

        // Electric crackle
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(3000, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
        filter.type = 'highpass';
        filter.frequency.value = 500;
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.2);

        // Resonant ping
        const pingOsc = this.audioCtx.createOscillator();
        const pingGain = this.audioCtx.createGain();
        pingOsc.type = 'sine';
        pingOsc.frequency.value = 1800;
        pingGain.gain.setValueAtTime(0.08 * this.sfxVolume, t);
        pingGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        pingOsc.connect(pingGain);
        pingGain.connect(this.masterGain);
        pingOsc.start(t);
        pingOsc.stop(t + 0.3);
    }

    playHullDamageSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        const t = this.audioCtx.currentTime;

        // Metal impact
        const bufferSize = this.audioCtx.sampleRate * 0.15;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.audioCtx.createGain();
        const noiseFilter = this.audioCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.value = 800;
        noiseFilter.Q.value = 1;
        noiseGain.gain.value = 0.25 * this.sfxVolume;
        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);

        // Structural groan
        const groanOsc = this.audioCtx.createOscillator();
        const groanGain = this.audioCtx.createGain();
        groanOsc.type = 'triangle';
        groanOsc.frequency.setValueAtTime(100, t);
        groanOsc.frequency.linearRampToValueAtTime(60, t + 0.4);
        groanGain.gain.setValueAtTime(0.15 * this.sfxVolume, t);
        groanGain.gain.exponentialRampToValueAtTime(0.001, t + 0.5);
        groanOsc.connect(groanGain);
        groanGain.connect(this.masterGain);
        groanOsc.start(t);
        groanOsc.stop(t + 0.5);
    }

    playEnemyFireSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        const t = this.audioCtx.currentTime;

        // Disruptor - harsh electronic
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, t);
        osc.frequency.exponentialRampToValueAtTime(200, t + 0.2);
        gain.gain.setValueAtTime(0.05 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.25);
    }

    playAlertSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        const t = this.audioCtx.currentTime;

        // Classic Star Trek red alert
        for (let i = 0; i < 3; i++) {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.value = i % 2 === 0 ? 800 : 600;
            const start = t + i * 0.3;
            gain.gain.setValueAtTime(0.08 * this.sfxVolume, start);
            gain.gain.setValueAtTime(0.08 * this.sfxVolume, start + 0.2);
            gain.gain.linearRampToValueAtTime(0, start + 0.25);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.25);
        }
    }

    playTargetLockSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        const t = this.audioCtx.currentTime;

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(1200, t);
        osc.frequency.setValueAtTime(1600, t + 0.05);
        osc.frequency.setValueAtTime(1200, t + 0.1);
        gain.gain.setValueAtTime(0.08 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.15);
    }

    playUpgradeSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        const t = this.audioCtx.currentTime;
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = freq;
            const start = t + i * 0.08;
            gain.gain.setValueAtTime(0.1 * this.sfxVolume, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.2);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.2);
        });
    }

    playWaveCompleteSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        const t = this.audioCtx.currentTime;
        const notes = [392, 523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = freq;
            const start = t + i * 0.1;
            gain.gain.setValueAtTime(0.12 * this.sfxVolume, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.4);
        });
    }

    playCrewVoiceSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        const t = this.audioCtx.currentTime;

        // Comm chirp before voice
        const chirp = this.audioCtx.createOscillator();
        const chirpGain = this.audioCtx.createGain();
        chirp.type = 'sine';
        chirp.frequency.setValueAtTime(1200, t);
        chirp.frequency.setValueAtTime(1500, t + 0.05);
        chirpGain.gain.setValueAtTime(0.08 * this.sfxVolume, t);
        chirpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
        chirp.connect(chirpGain);
        chirpGain.connect(this.masterGain);
        chirp.start(t);
        chirp.stop(t + 0.1);
    }

    playRepairSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        const t = this.audioCtx.currentTime;

        // Tool/repair sound
        for (let i = 0; i < 3; i++) {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'triangle';
            osc.frequency.value = 400 + i * 200;
            const start = t + i * 0.15;
            gain.gain.setValueAtTime(0.06 * this.sfxVolume, start);
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.12);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(start);
            osc.stop(start + 0.12);
        }
    }

    playReloadSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        const t = this.audioCtx.currentTime;

        // Mechanical loading sound
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, t);
        osc.frequency.linearRampToValueAtTime(200, t + 0.3);
        gain.gain.setValueAtTime(0.1 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.4);
    }

    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        if (this.masterGain) {
            this.masterGain.gain.value = this.soundEnabled ? this.masterVolume : 0;
        }
        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) soundBtn.textContent = this.soundEnabled ? 'M' : 'MUTED';
    }

    setMasterVolume(vol) {
        this.masterVolume = vol;
        if (this.masterGain && this.soundEnabled) {
            this.masterGain.gain.value = vol;
        }
    }

    setSfxVolume(vol) {
        this.sfxVolume = vol;
    }

    // ============================================
    // LIGHTING
    // ============================================

    setupLighting() {
        const ambient = new THREE.AmbientLight(0x334455, 0.6);
        this.scene.add(ambient);

        const sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        sunLight.position.set(100, 80, 100);
        this.scene.add(sunLight);

        const fillLight = new THREE.DirectionalLight(0x6688aa, 0.4);
        fillLight.position.set(-80, -40, -60);
        this.scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0x88aaff, 0.3);
        rimLight.position.set(0, 50, -100);
        this.scene.add(rimLight);

        this.shipLight = new THREE.PointLight(0x4488ff, 0.8, 150);
        this.scene.add(this.shipLight);
    }

    // ============================================
    // STARFIELD & NEBULA
    // ============================================

    createStarfield() {
        const starGeometry = new THREE.BufferGeometry();
        const starCount = 20000;
        const positions = new Float32Array(starCount * 3);
        const colors = new Float32Array(starCount * 3);

        for (let i = 0; i < starCount; i++) {
            const i3 = i * 3;
            const radius = 2000 + Math.random() * 4000;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);

            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);

            const colorChoice = Math.random();
            if (colorChoice < 0.6) {
                colors[i3] = 1; colors[i3 + 1] = 1; colors[i3 + 2] = 1;
            } else if (colorChoice < 0.8) {
                colors[i3] = 0.8; colors[i3 + 1] = 0.9; colors[i3 + 2] = 1;
            } else {
                colors[i3] = 1; colors[i3 + 1] = 0.9; colors[i3 + 2] = 0.7;
            }
        }

        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const starMaterial = new THREE.PointsMaterial({
            size: 1.5,
            vertexColors: true,
            transparent: true,
            opacity: 0.9
        });

        this.starfield = new THREE.Points(starGeometry, starMaterial);
        this.scene.add(this.starfield);
    }

    createNebula() {
        const nebulaGeometry = new THREE.BufferGeometry();
        const nebulaCount = 300;
        const positions = new Float32Array(nebulaCount * 3);
        const colors = new Float32Array(nebulaCount * 3);

        for (let i = 0; i < nebulaCount; i++) {
            const i3 = i * 3;
            positions[i3] = (Math.random() - 0.5) * 5000;
            positions[i3 + 1] = (Math.random() - 0.5) * 2000;
            positions[i3 + 2] = (Math.random() - 0.5) * 5000 - 2000;

            colors[i3] = 0.2 + Math.random() * 0.2;
            colors[i3 + 1] = 0.1 + Math.random() * 0.15;
            colors[i3 + 2] = 0.4 + Math.random() * 0.4;
        }

        nebulaGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        nebulaGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const nebulaMaterial = new THREE.PointsMaterial({
            size: 100,
            vertexColors: true,
            transparent: true,
            opacity: 0.12,
            blending: THREE.AdditiveBlending
        });

        this.nebula = new THREE.Points(nebulaGeometry, nebulaMaterial);
        this.scene.add(this.nebula);
    }

    // ============================================
    // ENTERPRISE - SLEEKER/THINNER MODEL
    // ============================================

    createEnterprise() {
        this.enterprise = new THREE.Group();

        const hullMaterial = new THREE.MeshStandardMaterial({
            color: 0xe8e8e8, metalness: 0.3, roughness: 0.4
        });
        const hullMaterialDark = new THREE.MeshStandardMaterial({
            color: 0x888899, metalness: 0.4, roughness: 0.3
        });
        const panelMaterial = new THREE.MeshStandardMaterial({
            color: 0xaaaaaa, metalness: 0.5, roughness: 0.3
        });
        const bussardMaterial = new THREE.MeshStandardMaterial({
            color: 0xdd4444, metalness: 0.6, roughness: 0.2,
            emissive: 0x661111, emissiveIntensity: 0.5
        });
        const warpGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x44aaff, transparent: true, opacity: 0.9
        });
        const deflectorMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ccff, transparent: true, opacity: 0.85
        });
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffdd, transparent: true, opacity: 0.9
        });

        // SAUCER - THINNER
        const saucerGroup = new THREE.Group();
        const saucerRadius = 18;
        const saucerShape = new THREE.Shape();
        saucerShape.absarc(0, 0, saucerRadius, 0, Math.PI * 2, false);

        const saucerExtrudeSettings = {
            steps: 1, depth: 1.4, bevelEnabled: true,
            bevelThickness: 0.5, bevelSize: 0.4, bevelSegments: 8
        };

        const saucerGeom = new THREE.ExtrudeGeometry(saucerShape, saucerExtrudeSettings);
        saucerGeom.rotateX(Math.PI / 2);
        saucerGeom.translate(0, -0.3, 0);
        const saucer = new THREE.Mesh(saucerGeom, hullMaterial);
        saucerGroup.add(saucer);

        // Upper dome - flatter
        const upperDomeGeom = new THREE.SphereGeometry(saucerRadius, 64, 32, 0, Math.PI * 2, 0, Math.PI / 12);
        const upperDome = new THREE.Mesh(upperDomeGeom, hullMaterial);
        upperDome.position.y = 0.8;
        saucerGroup.add(upperDome);

        // Lower curve - subtle
        const lowerDomeGeom = new THREE.SphereGeometry(saucerRadius, 64, 32, 0, Math.PI * 2, Math.PI - Math.PI / 14, Math.PI / 14);
        const lowerDome = new THREE.Mesh(lowerDomeGeom, hullMaterial);
        lowerDome.position.y = -0.6;
        saucerGroup.add(lowerDome);

        // Saucer rim
        const rimGeom = new THREE.TorusGeometry(saucerRadius, 0.35, 16, 64);
        const rim = new THREE.Mesh(rimGeom, panelMaterial);
        rim.rotation.x = Math.PI / 2;
        saucerGroup.add(rim);

        // Bridge - compact
        const bridgeGroup = new THREE.Group();
        const bridgeBaseGeom = new THREE.CylinderGeometry(4, 5, 1, 32);
        const bridgeBase = new THREE.Mesh(bridgeBaseGeom, hullMaterial);
        bridgeBase.position.y = 1.3;
        bridgeGroup.add(bridgeBase);

        const bridgeDomeGeom = new THREE.SphereGeometry(3.5, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        const bridgeDome = new THREE.Mesh(bridgeDomeGeom, hullMaterial);
        bridgeDome.position.y = 1.8;
        bridgeGroup.add(bridgeDome);

        const sensorDomeGeom = new THREE.SphereGeometry(1.5, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const sensorDome = new THREE.Mesh(sensorDomeGeom, hullMaterialDark);
        sensorDome.position.y = 4.5;
        bridgeGroup.add(sensorDome);

        const bridgeWindowGeom = new THREE.TorusGeometry(3.2, 0.2, 8, 48);
        const bridgeWindow = new THREE.Mesh(bridgeWindowGeom, windowMaterial);
        bridgeWindow.rotation.x = Math.PI / 2;
        bridgeWindow.position.y = 2.8;
        bridgeGroup.add(bridgeWindow);

        saucerGroup.add(bridgeGroup);

        // Impulse engines
        const impulseHousingGeom = new THREE.BoxGeometry(6, 1.8, 1.5);
        const impulseHousing = new THREE.Mesh(impulseHousingGeom, hullMaterialDark);
        impulseHousing.position.set(0, 0.3, saucerRadius - 1);
        saucerGroup.add(impulseHousing);

        for (let i = -1; i <= 1; i++) {
            const ventGeom = new THREE.PlaneGeometry(1.5, 1.2);
            const vent = new THREE.Mesh(ventGeom, new THREE.MeshBasicMaterial({
                color: 0xff5500, transparent: true, opacity: 0.9
            }));
            vent.position.set(i * 1.8, 0.3, saucerRadius + 0.01);
            saucerGroup.add(vent);
            this.impulseGlows.push(vent);
        }

        // Phaser array
        const phaserGeom = new THREE.TorusGeometry(14, 0.1, 6, 64, Math.PI);
        const phaser = new THREE.Mesh(phaserGeom, new THREE.MeshBasicMaterial({
            color: 0xff8844, transparent: true, opacity: 0.7
        }));
        phaser.rotation.x = Math.PI / 2;
        phaser.rotation.z = Math.PI / 2;
        phaser.position.y = 1.2;
        saucerGroup.add(phaser);

        this.addSaucerWindows(saucerGroup, saucerRadius, windowMaterial);

        saucerGroup.position.z = -14;
        this.enterprise.add(saucerGroup);

        // SECONDARY HULL - THINNER
        const hullGroup = new THREE.Group();
        const hullLength = 38;
        const hullRadius = 3.5;

        const hullPoints = [];
        for (let i = 0; i <= 24; i++) {
            const t = i / 24;
            const z = (t - 0.5) * hullLength;
            let r;
            if (t < 0.1) {
                r = 1.5 + t * 20;
            } else if (t > 0.9) {
                r = hullRadius - (t - 0.9) * 30;
            } else {
                r = hullRadius + Math.sin((t - 0.1) * Math.PI / 0.8) * 0.4;
            }
            hullPoints.push(new THREE.Vector2(Math.max(r, 0.4), z));
        }

        const hullGeom = new THREE.LatheGeometry(hullPoints, 48);
        hullGeom.rotateX(Math.PI / 2);
        const hull = new THREE.Mesh(hullGeom, hullMaterial);
        hullGroup.add(hull);

        // Deflector
        const deflectorGroup = new THREE.Group();
        const defHousingGeom = new THREE.CylinderGeometry(3, 3.5, 3, 32);
        defHousingGeom.rotateX(Math.PI / 2);
        const defHousing = new THREE.Mesh(defHousingGeom, hullMaterialDark);
        deflectorGroup.add(defHousing);

        const defDishGeom = new THREE.SphereGeometry(2.8, 32, 24, 0, Math.PI * 2, 0, Math.PI / 2);
        defDishGeom.rotateX(Math.PI);
        const defDish = new THREE.Mesh(defDishGeom, deflectorMaterial);
        defDish.position.z = -1.2;
        deflectorGroup.add(defDish);
        this.deflector = defDish;

        const defCenterGeom = new THREE.SphereGeometry(1.4, 24, 16);
        const defCenter = new THREE.Mesh(defCenterGeom, new THREE.MeshBasicMaterial({
            color: 0x00ffff, transparent: true, opacity: 0.9
        }));
        defCenter.position.z = -0.8;
        deflectorGroup.add(defCenter);
        this.deflectorCenter = defCenter;

        deflectorGroup.position.z = -hullLength / 2 - 2;
        hullGroup.add(deflectorGroup);

        // Torpedo tubes
        for (let i = -1; i <= 1; i += 2) {
            const tubeGeom = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 12);
            tubeGeom.rotateX(Math.PI / 2);
            const tube = new THREE.Mesh(tubeGeom, hullMaterialDark);
            tube.position.set(i * 0.6, -2.5, -hullLength / 2);
            hullGroup.add(tube);
        }

        // Shuttle bay
        const shuttleBayGeom = new THREE.BoxGeometry(4, 3, 0.8);
        const shuttleBay = new THREE.Mesh(shuttleBayGeom, hullMaterialDark);
        shuttleBay.position.set(0, 0, hullLength / 2 + 1.5);
        hullGroup.add(shuttleBay);

        this.addHullWindows(hullGroup, hullLength, hullRadius, windowMaterial);

        hullGroup.position.set(0, -7, 16);
        this.enterprise.add(hullGroup);

        // NECK - thinner
        const neckGroup = new THREE.Group();
        const neckGeom = new THREE.BoxGeometry(2.5, 10, 3.5);
        const neck = new THREE.Mesh(neckGeom, hullMaterial);
        neckGroup.add(neck);

        const neckFrontGeom = new THREE.BoxGeometry(2.5, 6, 1.5);
        const neckFront = new THREE.Mesh(neckFrontGeom, hullMaterial);
        neckFront.position.set(0, 2, -3);
        neckFront.rotation.x = 0.25;
        neckGroup.add(neckFront);

        neckGroup.position.set(0, -2, 0);
        this.enterprise.add(neckGroup);

        // NACELLES - THINNER
        for (let side = -1; side <= 1; side += 2) {
            const nacelleGroup = new THREE.Group();
            const nacelleLength = 34;
            const nacelleRadius = 2;

            const nacelleBodyGeom = new THREE.CylinderGeometry(nacelleRadius, nacelleRadius, nacelleLength, 32);
            nacelleBodyGeom.rotateX(Math.PI / 2);
            const nacelleBody = new THREE.Mesh(nacelleBodyGeom, hullMaterial);
            nacelleGroup.add(nacelleBody);

            const nacelleRearGeom = new THREE.SphereGeometry(nacelleRadius, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            nacelleRearGeom.rotateX(Math.PI / 2);
            const nacelleRear = new THREE.Mesh(nacelleRearGeom, hullMaterial);
            nacelleRear.position.z = nacelleLength / 2;
            nacelleGroup.add(nacelleRear);

            const bussardGeom = new THREE.SphereGeometry(nacelleRadius + 0.2, 32, 24);
            const bussard = new THREE.Mesh(bussardGeom, bussardMaterial);
            bussard.position.z = -nacelleLength / 2 - 0.3;
            nacelleGroup.add(bussard);

            const bussardGlowGeom = new THREE.SphereGeometry(nacelleRadius - 0.4, 24, 16);
            const bussardGlow = new THREE.Mesh(bussardGlowGeom, new THREE.MeshBasicMaterial({
                color: 0xff5500, transparent: true, opacity: 0.85
            }));
            bussardGlow.position.z = -nacelleLength / 2 - 0.3;
            nacelleGroup.add(bussardGlow);
            this.bussardGlows.push(bussardGlow);

            const grilleGeom = new THREE.BoxGeometry(1.2, 0.2, nacelleLength - 6);
            const grille = new THREE.Mesh(grilleGeom, warpGlowMaterial);
            grille.position.y = nacelleRadius + 0.1;
            nacelleGroup.add(grille);
            this.nacelleGlows.push(grille);

            const nacelleX = side * 12;
            const nacelleY = 6;
            const nacelleZ = 14;
            nacelleGroup.position.set(nacelleX, nacelleY, nacelleZ);
            this.enterprise.add(nacelleGroup);

            // Pylon - thinner
            const pylonGroup = new THREE.Group();
            const pylonGeom = new THREE.BoxGeometry(0.8, 12, 3);
            const pylon = new THREE.Mesh(pylonGeom, hullMaterial);
            pylonGroup.add(pylon);

            const pylonX = side * 7;
            pylonGroup.position.set(pylonX, -0.5, 14);
            pylonGroup.rotation.z = side * -0.35;
            pylonGroup.rotation.x = 0.08;
            this.enterprise.add(pylonGroup);
        }

        // Nav lights
        const lights = [
            { pos: [0, 5.5, -14], color: 0x00ff00 },
            { pos: [-saucerRadius - 0.3, 0, -14], color: 0xff0000 },
            { pos: [saucerRadius + 0.3, 0, -14], color: 0x00ff00 },
            { pos: [0, -7, 26], color: 0xffffff },
        ];

        lights.forEach(({ pos, color }) => {
            const lightGeom = new THREE.SphereGeometry(0.25, 8, 8);
            const light = new THREE.Mesh(lightGeom, new THREE.MeshBasicMaterial({ color }));
            light.position.set(...pos);
            this.enterprise.add(light);
        });

        const strobeGeom = new THREE.SphereGeometry(0.3, 8, 8);
        this.strobeLight = new THREE.Mesh(strobeGeom, new THREE.MeshBasicMaterial({
            color: 0xffffff, transparent: true, opacity: 0
        }));
        this.strobeLight.position.set(0, 5.5, -14);
        this.enterprise.add(this.strobeLight);

        this.enterprise.scale.set(0.4, 0.4, 0.4);
        this.enterprise.rotation.y = Math.PI;
        this.scene.add(this.enterprise);

        // Shield mesh
        const shieldGeom = new THREE.SphereGeometry(22, 32, 32);
        this.shieldMesh = new THREE.Mesh(shieldGeom, new THREE.MeshBasicMaterial({
            color: 0x44aaff, transparent: true, opacity: 0, side: THREE.DoubleSide
        }));
        this.enterprise.add(this.shieldMesh);
    }

    addSaucerWindows(saucerGroup, radius, material) {
        for (let ring = 0; ring < 3; ring++) {
            const r = radius - 2 - ring * 3;
            const count = Math.floor(28 - ring * 6);
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                if (angle > 1.2 && angle < 1.9) continue;
                const windowGeom = new THREE.CircleGeometry(0.15, 6);
                const window = new THREE.Mesh(windowGeom, material);
                window.position.set(Math.cos(angle) * r, 1.1 - ring * 0.08, Math.sin(angle) * r);
                window.rotation.x = -Math.PI / 2;
                saucerGroup.add(window);
            }
        }
    }

    addHullWindows(hullGroup, length, radius, material) {
        for (let row = 0; row < 4; row++) {
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                if (Math.sin(angle) < -0.3) continue;
                const windowGeom = new THREE.CircleGeometry(0.12, 6);
                const window = new THREE.Mesh(windowGeom, material);
                const r = radius + 0.03;
                window.position.set(Math.cos(angle) * r, Math.sin(angle) * r, -8 + row * 5);
                window.lookAt(Math.cos(angle) * (r + 1), Math.sin(angle) * (r + 1), -8 + row * 5);
                hullGroup.add(window);
            }
        }
    }

    addRegistryText(saucerGroup) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#222222';
        ctx.font = 'bold 80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('NCC-1701', canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: texture, transparent: true, side: THREE.DoubleSide
        });

        const textGeom = new THREE.PlaneGeometry(10, 2.5);
        const textMesh = new THREE.Mesh(textGeom, textMaterial);
        textMesh.rotation.x = -Math.PI / 2;
        textMesh.position.set(0, 1.6, 5);
        saucerGroup.add(textMesh);

        const textMeshBottom = textMesh.clone();
        textMeshBottom.rotation.x = Math.PI / 2;
        textMeshBottom.position.set(0, -1, 5);
        saucerGroup.add(textMeshBottom);
    }

    // ============================================
    // TARGET LOCK SYSTEM
    // ============================================

    createTargetLockIndicator() {
        const group = new THREE.Group();

        // Targeting reticle
        const ringGeom = new THREE.RingGeometry(8, 9, 32);
        const ringMat = new THREE.MeshBasicMaterial({
            color: 0xff3333, transparent: true, opacity: 0.8, side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeom, ringMat);
        group.add(ring);

        // Corner brackets
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            const bracketGeom = new THREE.PlaneGeometry(4, 1);
            const bracket = new THREE.Mesh(bracketGeom, ringMat);
            bracket.position.set(Math.cos(angle) * 12, Math.sin(angle) * 12, 0);
            bracket.rotation.z = angle + Math.PI / 2;
            group.add(bracket);
        }

        // Inner crosshair
        const crossGeom = new THREE.PlaneGeometry(0.5, 6);
        const cross1 = new THREE.Mesh(crossGeom, ringMat);
        const cross2 = new THREE.Mesh(crossGeom, ringMat);
        cross2.rotation.z = Math.PI / 2;
        group.add(cross1, cross2);

        group.visible = false;
        this.targetLockIndicator = group;
        this.scene.add(group);
    }

    findNearestEnemy() {
        if (this.enemies.length === 0) return null;

        let nearest = null;
        let nearestDist = Infinity;
        const shipForward = new THREE.Vector3(0, 0, -1);
        shipForward.applyQuaternion(this.enterprise.quaternion);

        this.enemies.forEach(enemy => {
            const toEnemy = enemy.position.clone().sub(this.enterprise.position);
            const dist = toEnemy.length();
            const angle = shipForward.angleTo(toEnemy.normalize());

            // Only target enemies in front (within 90 degrees) and within range - very long range targeting
            if (dist < 1000 && angle < Math.PI / 2) {
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = enemy;
                }
            }
        });

        return nearest;
    }

    updateTargetLock() {
        const target = this.findNearestEnemy();

        if (target !== this.targetLocked) {
            if (target && !this.targetLocked) {
                this.playTargetLockSound();
            }
            this.targetLocked = target;
        }

        if (this.targetLocked && this.targetLockIndicator) {
            this.targetLockIndicator.visible = true;
            this.targetLockIndicator.position.copy(this.targetLocked.position);
            this.targetLockIndicator.lookAt(this.camera.position);

            // Animate
            const time = Date.now() * 0.003;
            this.targetLockIndicator.rotation.z = time;
            this.targetLockIndicator.scale.setScalar(1 + Math.sin(time * 3) * 0.05);

            // Update UI
            const targetInfo = document.getElementById('targetInfo');
            if (targetInfo) {
                const dist = this.enterprise.position.distanceTo(this.targetLocked.position).toFixed(0);
                const health = Math.round(this.targetLocked.userData.health / this.targetLocked.userData.maxHealth * 100);
                targetInfo.innerHTML = `TARGET: ${this.targetLocked.userData.type.toUpperCase()}<br>DIST: ${dist}m | HULL: ${health}%`;
                targetInfo.style.display = 'block';
            }
        } else {
            if (this.targetLockIndicator) this.targetLockIndicator.visible = false;
            const targetInfo = document.getElementById('targetInfo');
            if (targetInfo) targetInfo.style.display = 'none';
        }
    }

    // ============================================
    // KILL CAM
    // ============================================

    startKillCam(enemy) {
        if (this.killCamActive) return;

        this.killCamActive = true;
        this.killCamTarget = enemy.position.clone();
        this.killCamTimer = 1500; // 1.5 seconds

        // Save camera state
        this.savedCameraState = {
            distance: this.cameraDistance,
            rotationX: this.cameraRotation.x,
            rotationY: this.cameraRotation.y
        };

        // Zoom towards explosion
        this.cameraDistance = 30;
    }

    updateKillCam(deltaTime) {
        if (!this.killCamActive) return;

        this.killCamTimer -= deltaTime;

        if (this.killCamTimer <= 0) {
            // Restore camera
            this.killCamActive = false;
            this.cameraDistance = this.savedCameraState.distance;
            this.cameraRotation.x = this.savedCameraState.rotationX;
            this.cameraRotation.y = this.savedCameraState.rotationY;
            this.savedCameraState = null;
        }
    }

    // ============================================
    // ENEMIES
    // ============================================

    createEnemy(type = 'klingon') {
        const enemy = new THREE.Group();

        // Klingon Bird of Prey and Romulan Warbirds - with shields
        enemy.userData = {
            type: type,
            health: type === 'klingon' ? 120 : 100,
            maxHealth: type === 'klingon' ? 120 : 100,
            shields: type === 'klingon' ? 120 : 100,
            maxShields: type === 'klingon' ? 120 : 100,
            speed: type === 'klingon' ? 0.4 : 0.5,
            turnSpeed: type === 'klingon' ? 0.015 : 0.02,
            damage: type === 'klingon' ? 30 : 20,
            fireRate: type === 'klingon' ? 2500 : 3500,
            lastFire: 0,
            credits: type === 'klingon' ? 100 : 175,
            announced: false
        };

        if (type === 'klingon') {
            // Klingon Bird of Prey - MUCH BIGGER MODEL
            const bodyMat = new THREE.MeshPhongMaterial({ color: 0x2a4a2a, specular: 0x224422 });
            const darkMat = new THREE.MeshPhongMaterial({ color: 0x1a2a1a });
            const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });

            // Main hull - larger
            const bodyGeom = new THREE.ConeGeometry(5, 16, 8);
            bodyGeom.rotateX(Math.PI / 2);
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            enemy.add(body);

            // Command pod on top
            const podGeom = new THREE.SphereGeometry(3, 16, 12);
            const pod = new THREE.Mesh(podGeom, bodyMat);
            pod.position.set(0, 2, -4);
            enemy.add(pod);

            // Bridge windows
            const windowGeom = new THREE.BoxGeometry(4, 0.5, 1);
            const windowMat = new THREE.MeshBasicMaterial({ color: 0x88ff88, transparent: true, opacity: 0.7 });
            const bridgeWindow = new THREE.Mesh(windowGeom, windowMat);
            bridgeWindow.position.set(0, 3, -5);
            enemy.add(bridgeWindow);

            // Large sweeping wings
            for (let side = -1; side <= 1; side += 2) {
                // Main wing
                const wingGeom = new THREE.BoxGeometry(20, 1, 8);
                const wing = new THREE.Mesh(wingGeom, bodyMat);
                wing.position.set(side * 10, 0, 3);
                wing.rotation.z = side * 0.25;
                enemy.add(wing);

                // Wing tip - disruptor cannon
                const tipGeom = new THREE.CylinderGeometry(1.5, 2, 6, 6);
                tipGeom.rotateZ(side * Math.PI / 2);
                const tip = new THREE.Mesh(tipGeom, darkMat);
                tip.position.set(side * 20, side * -2.5, 3);
                enemy.add(tip);

                // Wing glow strips
                const stripGeom = new THREE.BoxGeometry(15, 0.3, 1);
                const strip = new THREE.Mesh(stripGeom, glowMat);
                strip.position.set(side * 8, 0.7, 3);
                enemy.add(strip);

                // Nacelle under wing
                const nacelleGeom = new THREE.CylinderGeometry(1.2, 1.2, 10, 8);
                nacelleGeom.rotateX(Math.PI / 2);
                const nacelle = new THREE.Mesh(nacelleGeom, darkMat);
                nacelle.position.set(side * 8, -1.5, 5);
                enemy.add(nacelle);

                // Nacelle glow
                const nacelleGlowGeom = new THREE.CylinderGeometry(0.8, 0.8, 8, 8);
                nacelleGlowGeom.rotateX(Math.PI / 2);
                const nacelleGlow = new THREE.Mesh(nacelleGlowGeom, new THREE.MeshBasicMaterial({
                    color: 0xff4400, transparent: true, opacity: 0.7
                }));
                nacelleGlow.position.set(side * 8, -1.5, 5);
                enemy.add(nacelleGlow);
            }

            // Torpedo launcher at front
            const launcherGeom = new THREE.CylinderGeometry(1, 1.5, 4, 8);
            launcherGeom.rotateX(Math.PI / 2);
            const launcher = new THREE.Mesh(launcherGeom, darkMat);
            launcher.position.z = -10;
            enemy.add(launcher);

            // Front cannon glow
            const cannonGlowGeom = new THREE.SphereGeometry(0.8, 8, 8);
            const cannonGlow = new THREE.Mesh(cannonGlowGeom, glowMat);
            cannonGlow.position.z = -12;
            enemy.add(cannonGlow);

            // Engine exhaust
            const exhaustGeom = new THREE.ConeGeometry(2, 4, 8);
            exhaustGeom.rotateX(-Math.PI / 2);
            const exhaustMat = new THREE.MeshBasicMaterial({ color: 0xff6600, transparent: true, opacity: 0.6 });
            const exhaust = new THREE.Mesh(exhaustGeom, exhaustMat);
            exhaust.position.z = 10;
            enemy.add(exhaust);
        } else {
            const bodyMat = new THREE.MeshPhongMaterial({ color: 0x336655, specular: 0x224433 });

            const upperGeom = new THREE.BoxGeometry(8, 2, 15);
            const upper = new THREE.Mesh(upperGeom, bodyMat);
            upper.position.y = 1;
            enemy.add(upper);

            const lowerGeom = new THREE.BoxGeometry(6, 2, 12);
            const lower = new THREE.Mesh(lowerGeom, bodyMat);
            lower.position.y = -1;
            enemy.add(lower);

            for (let side = -1; side <= 1; side += 2) {
                const wingGeom = new THREE.BoxGeometry(15, 0.5, 8);
                const wing = new THREE.Mesh(wingGeom, bodyMat);
                wing.position.set(side * 8, 0, 0);
                wing.rotation.z = side * 0.2;
                enemy.add(wing);
            }

            const glowGeom = new THREE.SphereGeometry(1, 8, 8);
            const glow = new THREE.Mesh(glowGeom, new THREE.MeshBasicMaterial({ color: 0x00ff44 }));
            glow.position.z = -7;
            enemy.add(glow);
        }

        // Smaller, more numerous enemy ships
        const scale = type === 'klingon' ? 0.45 : 0.35;
        enemy.scale.set(scale, scale, scale);

        // Add shield mesh to enemy
        const shieldGeom = new THREE.SphereGeometry(15, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: type === 'klingon' ? 0x44ff44 : 0x44ff88,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
        enemy.add(shieldMesh);
        enemy.userData.shieldMesh = shieldMesh;

        return enemy;
    }

    spawnWave() {
        if (!this.gameStarted) return;

        const difficulty = this.currentMission ? this.missions[this.currentMission].difficulty : 1;
        const enemyCount = Math.floor((4 + this.wave * 2) * difficulty); // More enemies

        // Reset announced enemies for new wave
        this.announcedEnemies.clear();

        // Spawn enemies in groups from 1-3 directions
        const numGroups = Math.min(1 + Math.floor(this.wave / 2), 3); // 1-3 groups based on wave
        const enemiesPerGroup = Math.ceil(enemyCount / numGroups);

        // Pick random directions for groups to approach from
        const groupAngles = [];
        for (let g = 0; g < numGroups; g++) {
            const baseAngle = (Math.random() * Math.PI * 2);
            groupAngles.push(baseAngle + g * (Math.PI * 0.6));
        }

        let enemiesSpawned = 0;
        for (let g = 0; g < numGroups; g++) {
            const groupAngle = groupAngles[g];
            const groupSize = Math.min(enemiesPerGroup, enemyCount - enemiesSpawned);

            // Calculate group leader position
            const leaderDistance = 550;
            const leaderX = this.enterprise.position.x + Math.cos(groupAngle) * leaderDistance;
            const leaderZ = this.enterprise.position.z + Math.sin(groupAngle) * leaderDistance;

            for (let i = 0; i < groupSize; i++) {
                const type = Math.random() > 0.7 && this.wave > 2 ? 'romulan' : 'klingon';
                const enemy = this.createEnemy(type);

                // V-Formation offsets relative to leader
                const row = Math.floor(i / 2);
                const side = (i % 2 === 0) ? 1 : -1;
                const formationX = (i === 0) ? 0 : side * (row + 1) * 25; // Spread sideways
                const formationZ = row * 35; // Stagger backwards

                // Rotate formation offset by group angle
                const cosA = Math.cos(groupAngle);
                const sinA = Math.sin(groupAngle);
                const offsetX = formationX * cosA - formationZ * sinA;
                const offsetZ = formationX * sinA + formationZ * cosA;

                enemy.position.x = leaderX + offsetX;
                enemy.position.y = (Math.random() - 0.5) * 10;
                enemy.position.z = leaderZ + offsetZ;

                // Store formation data for maintaining formation during movement
                enemy.userData.groupId = g;
                enemy.userData.formationOffset = new THREE.Vector3(offsetX, 0, offsetZ);
                enemy.userData.isLeader = (i === 0);

                this.enemies.push(enemy);
                this.scene.add(enemy);
                enemiesSpawned++;
            }
        }

        document.getElementById('waveNumber').textContent = this.wave;
        this.showAlert(`WAVE ${this.wave} - ${enemyCount} HOSTILE VESSELS INCOMING`);
        this.playAlertSound();

        // Crew announcement
        this.showCrewDialog('SPOCK', `Captain, sensors detecting ${enemyCount} hostile vessels approaching.`);
    }

    showAlert(message) {
        const alertBar = document.getElementById('alertBar');
        if (alertBar) {
            alertBar.textContent = message;
            alertBar.classList.add('active');
            setTimeout(() => alertBar.classList.remove('active'), 4000);
        }
    }

    // ============================================
    // CREW DIALOG SYSTEM
    // ============================================

    showCrewDialog(crewMember, message) {
        const now = Date.now();
        if (now - this.lastCrewDialog < this.crewDialogCooldown) {
            // Queue it for later
            if (this.crewDialogQueue.length < 5) {
                this.crewDialogQueue.push({ crewMember, message });
            }
            return;
        }

        this.lastCrewDialog = now;
        this.playCrewVoiceSound();

        // Create or get dialog box
        let dialogBox = document.getElementById('crewDialog');
        if (!dialogBox) {
            dialogBox = document.createElement('div');
            dialogBox.id = 'crewDialog';
            dialogBox.style.cssText = `
                position: fixed;
                bottom: 200px;
                left: 50%;
                transform: translateX(-50%);
                padding: 15px 30px;
                background: linear-gradient(135deg, rgba(0,40,80,0.95) 0%, rgba(0,20,40,0.98) 100%);
                border: 2px solid #00d4ff;
                border-left: 4px solid #ff9500;
                border-radius: 5px;
                font-family: 'Rajdhani', sans-serif;
                font-size: 18px;
                color: #ffffff;
                max-width: 600px;
                text-align: center;
                z-index: 9999;
                pointer-events: none;
            `;
            document.body.appendChild(dialogBox);
        }

        dialogBox.innerHTML = `<span style="font-family: 'Orbitron', sans-serif; font-weight: 700; color: #ff9500; margin-right: 8px;">${crewMember}:</span> "${message}"`;
        dialogBox.style.display = 'block';

        // Clear any existing timeout
        if (this.crewDialogTimeout) {
            clearTimeout(this.crewDialogTimeout);
        }

        this.crewDialogTimeout = setTimeout(() => {
            dialogBox.style.display = 'none';
        }, 4000);
    }

    processCrewDialogQueue() {
        if (this.crewDialogQueue.length === 0) return;
        const now = Date.now();
        if (now - this.lastCrewDialog >= this.crewDialogCooldown) {
            const dialog = this.crewDialogQueue.shift();
            this.showCrewDialog(dialog.crewMember, dialog.message);
        }
    }

    checkShieldStatus() {
        const shieldPercent = Math.round(this.stats.shields / this.stats.maxShields * 100);
        const thresholds = [75, 50, 25, 10];

        for (const threshold of thresholds) {
            if (shieldPercent <= threshold && this.lastShieldReport > threshold) {
                this.lastShieldReport = shieldPercent;
                this.showCrewDialog('UHURA', `Shields at ${shieldPercent} percent, Captain!`);
                break;
            }
        }

        // Reset if shields restored
        if (shieldPercent > this.lastShieldReport + 20) {
            this.lastShieldReport = shieldPercent;
        }
    }

    announceEnemy(enemy) {
        if (this.announcedEnemies.has(enemy)) return;

        const distance = this.enterprise.position.distanceTo(enemy.position);
        if (distance < 500 && !enemy.userData.announced) {
            enemy.userData.announced = true;
            this.announcedEnemies.add(enemy);

            const enemyName = enemy.userData.type === 'klingon' ? 'Klingon Bird of Prey' : 'Romulan Warbird';
            const bearing = Math.floor(Math.random() * 360);
            const mark = Math.floor(Math.random() * 90);
            const messages = [
                `${enemyName} bearing ${bearing} mark ${mark}!`,
                `${enemyName} on attack vector, ${Math.floor(distance)} meters!`,
                `Hostile ${enemyName} detected, shields are up!`,
                `${enemyName} closing to weapons range!`
            ];
            this.showCrewDialog('SULU', messages[Math.floor(Math.random() * messages.length)]);
        }
    }

    // ============================================
    // SHIP SYSTEMS & DAMAGE
    // ============================================

    damageSystem(systemKey, amount) {
        const system = this.systems[systemKey];
        if (!system) return;

        system.health = Math.max(0, system.health - amount);

        if (system.health < 30 && system.health + amount >= 30) {
            this.showCrewDialog('SCOTTY', `Captain! ${system.name} are failing! We need repairs!`);
        } else if (system.health <= 0 && system.health + amount > 0) {
            this.showCrewDialog('SCOTTY', `${system.name} are offline, Captain!`);
        }
    }

    repairSystems() {
        // Repair all systems slowly when R is held
        let repaired = false;
        Object.keys(this.systems).forEach(key => {
            const system = this.systems[key];
            if (system.health < system.maxHealth) {
                system.health = Math.min(system.maxHealth, system.health + 0.05);
                repaired = true;
            }
        });

        // Also repair hull slowly
        if (this.stats.hull < this.stats.maxHull) {
            this.stats.hull = Math.min(this.stats.maxHull, this.stats.hull + 0.02);
            repaired = true;
        }

        return repaired;
    }

    getSystemEfficiency(systemKey) {
        const system = this.systems[systemKey];
        if (!system) return 1;
        // Returns 0.3-1.0 based on health (never fully disabled, just degraded)
        return 0.3 + (system.health / system.maxHealth) * 0.7;
    }

    createHullBreach(position) {
        // Create visual hull breach effect on the Enterprise
        const breachGroup = new THREE.Group();

        // Sparking effect
        const sparkGeom = new THREE.SphereGeometry(0.3, 6, 6);
        const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

        for (let i = 0; i < 5; i++) {
            const spark = new THREE.Mesh(sparkGeom, sparkMat.clone());
            spark.position.set(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
            );
            breachGroup.add(spark);
        }

        // Smoke/fire
        const fireGeom = new THREE.SphereGeometry(1, 8, 8);
        const fireMat = new THREE.MeshBasicMaterial({
            color: 0xff4400, transparent: true, opacity: 0.6
        });
        const fire = new THREE.Mesh(fireGeom, fireMat);
        breachGroup.add(fire);

        breachGroup.position.copy(position);
        breachGroup.userData = { life: 10000, flickerTime: 0 };

        this.enterprise.add(breachGroup);
        this.hullBreaches.push(breachGroup);
    }

    showShieldHitEffect() {
        // Make shield brightly visible
        this.shieldMesh.material.opacity = 0.6;
        this.shieldMesh.material.color.setHex(0x66ddff);

        // Animate shield fade out
        let opacity = 0.6;
        const fadeInterval = setInterval(() => {
            opacity -= 0.05;
            if (opacity <= 0) {
                opacity = 0;
                this.shieldMesh.material.opacity = 0;
                this.shieldMesh.material.color.setHex(0x44aaff);
                clearInterval(fadeInterval);
            } else {
                this.shieldMesh.material.opacity = opacity;
                // Shift color from bright cyan to normal blue as it fades
                const r = Math.floor(0x44 + (0x66 - 0x44) * (opacity / 0.6));
                const g = Math.floor(0xaa + (0xdd - 0xaa) * (opacity / 0.6));
                const b = 0xff;
                this.shieldMesh.material.color.setRGB(r/255, g/255, b/255);
            }
        }, 30);
    }

    updateHullBreaches(deltaTime) {
        this.hullBreaches = this.hullBreaches.filter(breach => {
            breach.userData.life -= deltaTime;
            breach.userData.flickerTime += deltaTime;

            // Flicker effect
            breach.children.forEach((child, idx) => {
                if (child.material) {
                    child.material.opacity = 0.3 + Math.sin(breach.userData.flickerTime * 0.01 + idx) * 0.3;
                }
            });

            if (breach.userData.life <= 0 || this.stats.hull >= this.stats.maxHull * 0.8) {
                this.enterprise.remove(breach);
                return false;
            }
            return true;
        });
    }

    // ============================================
    // MISSION / MENU SYSTEM
    // ============================================

    startMission(missionKey) {
        this.currentMission = missionKey;
        const mission = this.missions[missionKey];
        this.maxWaves = mission.waves;
        this.wave = 1;
        this.gameStarted = true;
        this.isGameOver = false;

        // Reset stats
        this.stats.hull = this.stats.maxHull;
        this.stats.shields = this.stats.maxShields;
        this.stats.energy = this.stats.maxEnergy;
        this.stats.torpedoes = this.stats.maxTorpedoes;
        this.stats.phaserCharge = 100;

        // Reset ship systems
        Object.keys(this.systems).forEach(key => {
            this.systems[key].health = this.systems[key].maxHealth;
        });

        // Reset torpedo reload
        this.torpedoReloading = false;
        this.torpedoReloadTimer = 0;

        // Reset crew dialog state
        this.lastShieldReport = 100;
        this.announcedEnemies.clear();
        this.crewDialogQueue = [];

        // Clear hull breaches
        this.hullBreaches.forEach(breach => this.enterprise.remove(breach));
        this.hullBreaches = [];

        // Clear enemies
        this.enemies.forEach(e => this.scene.remove(e));
        this.enemies = [];

        // Hide title, show game UI
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('gameUI').style.display = 'block';

        this.spawnWave();
    }

    openSettings() {
        document.getElementById('settingsPanel').classList.add('active');
    }

    closeSettings() {
        document.getElementById('settingsPanel').classList.remove('active');
    }

    returnToTitle() {
        this.gameStarted = false;
        this.isGameOver = false;
        this.enemies.forEach(e => this.scene.remove(e));
        this.enemies = [];
        document.getElementById('gameOverScreen').classList.remove('active');
        document.getElementById('gameUI').style.display = 'none';
        document.getElementById('titleScreen').classList.add('active');
    }

    // ============================================
    // CONTROLS
    // ============================================

    setupControls() {
        window.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            this.keys[key] = true;

            // Prevent arrow keys and space from scrolling page
            if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(key)) {
                e.preventDefault();
            }

            if (e.key === '2' || e.key === ' ') this.fireTorpedo();
            if (key === 'u') this.openUpgrades();
            if (key === 'h') this.toggleUI();
            if (key === 'm') this.toggleSound();
            if (key === 'p') this.toggleAutopilot();
            if (key === 'r') this.isRepairing = true;
            if (e.key === 'Escape') {
                this.closeUpgrades();
                this.closeSettings();
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
            if (e.key.toLowerCase() === 'r') this.isRepairing = false;
        });

        // Mouse controls - track position for flight
        window.addEventListener('mousemove', (e) => {
            // Mouse position from -1 to 1 (center is 0,0)
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;

            // Update mouse cursor indicator
            const cursor = document.getElementById('mouseCursor');
            if (cursor) {
                cursor.style.left = e.clientX + 'px';
                cursor.style.top = e.clientY + 'px';
            }
        });

        // Left click - fire phasers
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                this.firePhaser();
            }
            if (e.button === 2) {
                this.mouse.rightDown = true;
            }
        });

        window.addEventListener('mouseup', (e) => {
            if (e.button === 0) this.mouse.down = false;
            if (e.button === 2) this.mouse.rightDown = false;
        });

        // Right click - fire torpedo
        window.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.fireTorpedo();
        });

        // Scroll - zoom camera
        window.addEventListener('wheel', (e) => {
            this.cameraDistance += e.deltaY * 0.05;
            this.cameraDistance = Math.max(25, Math.min(200, this.cameraDistance));
        });

        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    setupMinimap() {
        this.minimapCanvas = document.getElementById('minimapCanvas');
        if (this.minimapCanvas) {
            this.minimapCtx = this.minimapCanvas.getContext('2d');
            this.minimapCanvas.width = 140;
            this.minimapCanvas.height = 140;
        }
    }

    updateMinimap() {
        if (!this.minimapCtx) return;
        const ctx = this.minimapCtx;
        const size = 140;
        const scale = 0.12;

        ctx.clearRect(0, 0, size, size);

        this.enemies.forEach(enemy => {
            const dx = (enemy.position.x - this.enterprise.position.x) * scale;
            const dz = (enemy.position.z - this.enterprise.position.z) * scale;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < size / 2 - 10) {
                ctx.beginPath();
                ctx.arc(size / 2 + dx, size / 2 + dz, 4, 0, Math.PI * 2);
                ctx.fillStyle = enemy === this.targetLocked ? '#ffff00' : (enemy.userData.type === 'klingon' ? '#ff3366' : '#66ff33');
                ctx.fill();
            }
        });
    }

    populateUpgrades() {
        const grid = document.getElementById('upgradeGrid');
        if (!grid) return;
        grid.innerHTML = '';

        Object.entries(this.upgrades).forEach(([key, upgrade]) => {
            const card = document.createElement('div');
            card.className = `upgrade-card ${upgrade.purchased ? 'purchased' : ''}`;
            card.innerHTML = `
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-desc">${upgrade.desc}</div>
                <div class="upgrade-cost">${upgrade.purchased ? 'PURCHASED' : upgrade.cost + ' Credits'}</div>
            `;
            if (!upgrade.purchased) {
                card.onclick = () => this.purchaseUpgrade(key);
            }
            grid.appendChild(card);
        });
    }

    purchaseUpgrade(key) {
        const upgrade = this.upgrades[key];
        if (upgrade.purchased || this.stats.credits < upgrade.cost) return;

        this.stats.credits -= upgrade.cost;
        upgrade.purchased = true;
        upgrade.effect();
        this.playUpgradeSound();
        this.updateUI();
        this.populateUpgrades();
    }

    openUpgrades() {
        document.getElementById('upgradePanel').classList.add('active');
        document.getElementById('creditsValue').textContent = this.stats.credits;
        this.isPaused = true;
    }

    closeUpgrades() {
        document.getElementById('upgradePanel').classList.remove('active');
        this.isPaused = false;
    }

    toggleUI() {
        this.uiVisible = !this.uiVisible;
        const panels = ['topBar', 'leftPanel', 'rightPanel', 'bottomPanel', 'minimap', 'controlsHelp'];
        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = this.uiVisible ? '' : 'none';
        });
        const toggleBtn = document.getElementById('uiToggleBtn');
        if (toggleBtn) toggleBtn.textContent = this.uiVisible ? 'H' : 'SHOW UI (H)';
    }

    toggleShields() {
        this.stats.shieldsActive = !this.stats.shieldsActive;
        const el = document.getElementById('shieldStatus');
        if (el) el.textContent = this.stats.shieldsActive ? 'ACTIVE' : 'OFFLINE';
    }

    toggleAutopilot() {
        this.autopilotEnabled = !this.autopilotEnabled;
        this.showAlert(this.autopilotEnabled ? 'AUTOPILOT ENGAGED' : 'AUTOPILOT DISENGAGED');
    }

    // ============================================
    // COMBAT
    // ============================================

    firePhaser() {
        if (!this.gameStarted || this.phaserCooldown > 0 || this.stats.phaserCharge < 10) return;

        this.phaserCooldown = 200;
        this.stats.phaserCharge -= 10;
        this.playPhaserSound();

        const start = this.enterprise.position.clone();
        let end;

        // If we have a target lock, fire at target - extended range
        if (this.targetLocked) {
            const direction = this.targetLocked.position.clone().sub(start).normalize();
            end = start.clone().add(direction.multiplyScalar(500));
        } else {
            const direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.enterprise.quaternion);
            end = start.clone().add(direction.multiplyScalar(500));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0xff6600, transparent: true, opacity: 1
        });
        const beam = new THREE.Line(geometry, material);
        beam.userData = { life: 300, damage: this.stats.phaserDamage * this.getSystemEfficiency('weapons'), type: 'phaser' };

        this.projectiles.push(beam);
        this.scene.add(beam);

        this.enemies.forEach(enemy => {
            const dist = this.pointToLineDistance(enemy.position, start, end);
            if (dist < 15) {
                this.damageEnemy(enemy, this.stats.phaserDamage);
            }
        });
    }

    pointToLineDistance(point, lineStart, lineEnd) {
        const line = lineEnd.clone().sub(lineStart);
        const toPoint = point.clone().sub(lineStart);
        const t = Math.max(0, Math.min(1, toPoint.dot(line) / line.lengthSq()));
        const closest = lineStart.clone().add(line.multiplyScalar(t));
        return point.distanceTo(closest);
    }

    fireTorpedo() {
        if (!this.gameStarted || this.torpedoCooldown > 0) return;

        // Check if reloading
        if (this.torpedoReloading) {
            const remaining = Math.ceil(this.torpedoReloadTimer / 1000);
            this.showAlert(`TORPEDO BAY RELOADING: ${remaining}s`);
            return;
        }

        // Check if out of torpedoes - start reload
        if (this.stats.torpedoes <= 0) {
            this.torpedoReloading = true;
            this.torpedoReloadTimer = this.torpedoReloadTime;
            this.showCrewDialog('CHEKOV', 'Torpedo bay empty, Captain. Reloading now.');
            this.showAlert('TORPEDO BAY RELOADING - 30 SECONDS');
            return;
        }

        // Weapons efficiency affects damage
        const weaponEfficiency = this.getSystemEfficiency('weapons');

        this.torpedoCooldown = 1000;
        this.stats.torpedoes--;
        this.playTorpedoSound();

        // Cyan photon torpedo
        const torpedoGeom = new THREE.SphereGeometry(0.6, 16, 16);
        const torpedoMat = new THREE.MeshBasicMaterial({ color: 0x00ffff });
        const torpedo = new THREE.Mesh(torpedoGeom, torpedoMat);

        torpedo.position.copy(this.enterprise.position);

        // Inner glow
        const glowGeom = new THREE.SphereGeometry(1.2, 12, 12);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff, transparent: true, opacity: 0.6
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        torpedo.add(glow);

        // Outer glow
        const outerGlowGeom = new THREE.SphereGeometry(2, 12, 12);
        const outerGlowMat = new THREE.MeshBasicMaterial({
            color: 0x0088ff, transparent: true, opacity: 0.3
        });
        const outerGlow = new THREE.Mesh(outerGlowGeom, outerGlowMat);
        torpedo.add(outerGlow);

        // Trail effect
        const trailGeom = new THREE.CylinderGeometry(0.3, 0.8, 3, 8);
        trailGeom.rotateX(Math.PI / 2);
        const trailMat = new THREE.MeshBasicMaterial({
            color: 0x00ffff, transparent: true, opacity: 0.4
        });
        const trail = new THREE.Mesh(trailGeom, trailMat);
        trail.position.z = 1.5;
        torpedo.add(trail);

        let direction;
        if (this.targetLocked) {
            direction = this.targetLocked.position.clone().sub(this.enterprise.position).normalize();
        } else {
            direction = new THREE.Vector3(0, 0, -1);
            direction.applyQuaternion(this.enterprise.quaternion);
        }

        torpedo.userData = {
            velocity: direction.multiplyScalar(5),
            damage: this.stats.torpedoDamage * this.getSystemEfficiency('weapons'),
            life: 3000,
            type: 'torpedo',
            target: this.targetLocked
        };

        this.projectiles.push(torpedo);
        this.scene.add(torpedo);
    }

    damageEnemy(enemy, damage) {
        // Enemy shields absorb damage first
        if (enemy.userData.shields > 0) {
            const shieldDamage = Math.min(damage, enemy.userData.shields);
            enemy.userData.shields -= shieldDamage;
            damage -= shieldDamage;

            // Show enemy shield hit effect
            if (enemy.userData.shieldMesh) {
                enemy.userData.shieldMesh.material.opacity = 0.5;
                setTimeout(() => {
                    if (enemy.userData.shieldMesh) {
                        enemy.userData.shieldMesh.material.opacity = 0;
                    }
                }, 150);
            }

            // Announce when enemy shields go down
            if (enemy.userData.shields <= 0 && shieldDamage > 0) {
                this.showCrewDialog('SPOCK', `Enemy shields have failed, Captain.`);
            }
        }

        // Remaining damage hits hull
        if (damage > 0) {
            enemy.userData.health -= damage;

            // Flash red when hull is hit
            enemy.traverse(child => {
                if (child.isMesh && child.material.color && child !== enemy.userData.shieldMesh) {
                    const originalColor = child.material.color.getHex();
                    child.material.color.setHex(0xff0000);
                    setTimeout(() => child.material.color.setHex(originalColor), 100);
                }
            });
        }

        if (enemy.userData.health <= 0) {
            this.destroyEnemy(enemy);
        }
    }

    destroyEnemy(enemy) {
        // Start kill cam for dramatic effect
        if (Math.random() > 0.7) { // 30% chance
            this.startKillCam(enemy);
        }

        this.createExplosion(enemy.position.clone());
        this.playExplosionSound();

        this.stats.credits += enemy.userData.credits;
        this.enemiesKilled++;

        const index = this.enemies.indexOf(enemy);
        if (index > -1) {
            this.enemies.splice(index, 1);
            this.scene.remove(enemy);
        }

        if (this.targetLocked === enemy) {
            this.targetLocked = null;
        }

        if (this.enemies.length === 0) {
            this.wave++;
            this.playWaveCompleteSound();

            if (this.wave > this.maxWaves && this.maxWaves !== Infinity) {
                this.gameOver(true);
            } else {
                setTimeout(() => this.spawnWave(), 3000);
            }
        }

        this.updateUI();
    }

    createExplosion(position) {
        // Fire/plasma particles
        const particleCount = 40;
        for (let i = 0; i < particleCount; i++) {
            const geom = new THREE.SphereGeometry(0.4 + Math.random() * 0.6, 6, 6);
            const colors = [0xff6600, 0xffcc00, 0xff3300, 0xffff00];
            const mat = new THREE.MeshBasicMaterial({
                color: colors[Math.floor(Math.random() * colors.length)],
                transparent: true, opacity: 1
            });
            const particle = new THREE.Mesh(geom, mat);

            particle.position.copy(position);
            particle.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 3
                ),
                life: 800 + Math.random() * 400,
                type: 'fire'
            };

            this.particles.push(particle);
            this.scene.add(particle);
        }

        // Metal debris pieces
        const debrisCount = 15;
        for (let i = 0; i < debrisCount; i++) {
            const size = 0.3 + Math.random() * 0.8;
            let geom;
            const shapeType = Math.random();
            if (shapeType < 0.33) {
                geom = new THREE.BoxGeometry(size, size * 0.3, size * 0.5);
            } else if (shapeType < 0.66) {
                geom = new THREE.TetrahedronGeometry(size * 0.5);
            } else {
                geom = new THREE.CylinderGeometry(size * 0.2, size * 0.2, size, 6);
            }

            const mat = new THREE.MeshStandardMaterial({
                color: Math.random() > 0.5 ? 0x444444 : 0x666666,
                metalness: 0.8,
                roughness: 0.3
            });
            const debris = new THREE.Mesh(geom, mat);

            debris.position.copy(position);
            debris.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
            debris.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2,
                    (Math.random() - 0.5) * 2
                ),
                rotationSpeed: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.1
                ),
                life: 2000 + Math.random() * 1000,
                type: 'debris'
            };

            this.particles.push(debris);
            this.scene.add(debris);
        }

        // Smoke particles
        const smokeCount = 20;
        for (let i = 0; i < smokeCount; i++) {
            const geom = new THREE.SphereGeometry(1 + Math.random() * 1.5, 8, 8);
            const mat = new THREE.MeshBasicMaterial({
                color: 0x333333,
                transparent: true,
                opacity: 0.4
            });
            const smoke = new THREE.Mesh(geom, mat);

            smoke.position.copy(position);
            smoke.userData = {
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.8,
                    Math.random() * 0.5,
                    (Math.random() - 0.5) * 0.8
                ),
                life: 1500 + Math.random() * 500,
                type: 'smoke'
            };

            this.particles.push(smoke);
            this.scene.add(smoke);
        }
    }

    damagePlayer(amount) {
        // Shield generator efficiency affects shield absorption
        const shieldEfficiency = this.getSystemEfficiency('shields');

        if (this.stats.shieldsActive && this.stats.shields > 0) {
            const absorbedByShields = Math.min(amount * shieldEfficiency, this.stats.shields);
            this.stats.shields -= absorbedByShields;
            amount -= absorbedByShields;

            // Dramatic shield flash effect
            this.showShieldHitEffect();
            this.playShieldHitSound();

            // Check shield status for crew dialog
            this.checkShieldStatus();
        }

        // Hull damage when shields are down or depleted
        if (amount > 0) {
            this.stats.hull -= amount;
            this.playHullDamageSound();

            // Damage overlay
            const overlay = document.getElementById('damageOverlay');
            if (overlay) {
                overlay.style.opacity = 0.6;
                setTimeout(() => overlay.style.opacity = 0, 300);
            }

            // Random system damage when hull takes hits
            const systemKeys = Object.keys(this.systems);
            const randomSystem = systemKeys[Math.floor(Math.random() * systemKeys.length)];
            this.damageSystem(randomSystem, amount * 0.5);

            // Create hull breach visual effect (30% chance per hit)
            if (Math.random() < 0.3) {
                const breachPos = new THREE.Vector3(
                    (Math.random() - 0.5) * 15,
                    (Math.random() - 0.5) * 5,
                    (Math.random() - 0.5) * 20
                );
                this.createHullBreach(breachPos);
                this.showCrewDialog('UHURA', 'Hull breach detected! Damage control teams responding!');
            }

            // Crew reports hull damage
            const hullPercent = Math.round(this.stats.hull / this.stats.maxHull * 100);
            if (hullPercent <= 50 && hullPercent > 45) {
                this.showCrewDialog('SPOCK', `Hull integrity at ${hullPercent} percent. Recommend evasive action.`);
            } else if (hullPercent <= 25 && hullPercent > 20) {
                this.showCrewDialog('SCOTTY', `She cannae take much more of this, Captain!`);
            }
        }

        // Ship is destroyed only when hull reaches 0
        if (this.stats.hull <= 0) {
            this.showCrewDialog('SPOCK', 'Hull breach is critical. Abandon ship.');
            setTimeout(() => this.gameOver(false), 2000);
        }

        this.updateUI();
    }

    // ============================================
    // UI UPDATE
    // ============================================

    updateUI() {
        const setBar = (id, pct) => {
            const el = document.getElementById(id);
            if (el) el.style.width = pct + '%';
        };
        const setText = (id, txt) => {
            const el = document.getElementById(id);
            if (el) el.textContent = txt;
        };

        setBar('hullBar', this.stats.hull / this.stats.maxHull * 100);
        setText('hullValue', Math.round(this.stats.hull / this.stats.maxHull * 100) + '%');

        setBar('shieldBar', this.stats.shields / this.stats.maxShields * 100);
        setText('shieldValue', Math.round(this.stats.shields / this.stats.maxShields * 100) + '%');

        setBar('energyBar', this.stats.energy / this.stats.maxEnergy * 100);
        setText('energyValue', Math.round(this.stats.energy / this.stats.maxEnergy * 100) + '%');

        setBar('phaserBar', this.stats.phaserCharge);
        setText('phaserValue', Math.round(this.stats.phaserCharge) + '%');

        setBar('torpedoBar', this.stats.torpedoes / this.stats.maxTorpedoes * 100);
        setText('torpedoValue', this.stats.torpedoes);

        setText('phaserDmg', this.stats.phaserDamage);
        setText('torpedoDmg', this.stats.torpedoDamage);

        const statusDot = document.getElementById('statusDot');
        const statusText = document.getElementById('statusText');

        if (statusDot && statusText) {
            if (this.stats.hull < 30) {
                statusDot.className = 'status-dot status-red';
                statusText.textContent = 'CRITICAL DAMAGE';
            } else if (this.stats.hull < 60 || this.stats.shields < 30) {
                statusDot.className = 'status-dot status-yellow';
                statusText.textContent = 'DAMAGE SUSTAINED';
            } else {
                statusDot.className = 'status-dot status-green';
                statusText.textContent = 'ALL SYSTEMS NOMINAL';
            }
        }

        setBar('throttleFill', this.stats.speed / this.stats.maxSpeed * 100);
        setBar('warpFill', this.stats.warpSpeed / this.stats.maxWarp * 100);

        if (this.stats.warpSpeed > 0) {
            setText('speedDisplay', `WARP ${this.stats.warpSpeed.toFixed(1)}`);
            setText('warpIndicator', 'WARP DRIVE ENGAGED');
        } else if (this.stats.speed > 0) {
            setText('speedDisplay', `${(this.stats.speed / this.stats.maxSpeed * 100).toFixed(0)}% IMPULSE`);
            setText('warpIndicator', 'IMPULSE ENGINES');
        } else {
            setText('speedDisplay', 'FULL STOP');
            setText('warpIndicator', 'ENGINES IDLE');
        }

        setText('coordX', `X: ${this.enterprise.position.x.toFixed(0)}`);
        setText('coordZ', `Z: ${this.enterprise.position.z.toFixed(0)}`);
        setText('creditsValue', this.stats.credits);
    }

    gameOver(victory) {
        this.isGameOver = true;
        this.gameStarted = false;

        const screen = document.getElementById('gameOverScreen');
        const title = document.getElementById('gameOverTitle');
        const stats = document.getElementById('gameOverStats');

        if (victory) {
            title.textContent = 'MISSION COMPLETE';
            title.className = 'game-over-title victory';
        } else {
            title.textContent = 'SHIP DESTROYED';
            title.className = 'game-over-title defeat';
        }

        stats.innerHTML = `
            Waves Completed: ${this.wave - 1}<br>
            Enemies Destroyed: ${this.enemiesKilled}<br>
            Credits Earned: ${this.stats.credits}
        `;

        screen.classList.add('active');
    }

    restart() {
        location.reload();
    }

    // ============================================
    // MAIN UPDATE LOOP
    // ============================================

    update(deltaTime) {
        if (this.isGameOver || this.isPaused) return;

        // Kill cam update
        this.updateKillCam(deltaTime);

        if (!this.gameStarted) {
            // Title screen - rotate camera around ship
            const time = Date.now() * 0.0002;
            this.camera.position.x = Math.sin(time) * 80;
            this.camera.position.z = Math.cos(time) * 80;
            this.camera.position.y = 30 + Math.sin(time * 0.5) * 10;
            this.camera.lookAt(this.enterprise.position);
            return;
        }

        // Process crew dialog queue
        this.processCrewDialogQueue();

        // Update hull breach effects
        this.updateHullBreaches(deltaTime);

        // Torpedo reload timer
        if (this.torpedoReloading) {
            this.torpedoReloadTimer -= deltaTime;
            if (this.torpedoReloadTimer <= 0) {
                this.torpedoReloading = false;
                this.stats.torpedoes = this.stats.maxTorpedoes;
                this.playReloadSound();
                this.showCrewDialog('CHEKOV', 'Torpedo bay reloaded and ready, Captain!');
                this.showAlert('TORPEDO BAY RELOADED');
            }
        }

        // Repair when R is held (costs energy)
        if (this.isRepairing && this.stats.energy > 10) {
            if (this.repairSystems()) {
                this.stats.energy -= deltaTime * 0.02;
                // Play repair sound periodically
                if (Math.random() < 0.01) this.playRepairSound();
            }
        }

        // Regeneration (affected by system damage)
        const weaponEfficiency = this.getSystemEfficiency('weapons');
        if (this.stats.phaserCharge < 100) {
            this.stats.phaserCharge += deltaTime * 0.015 * weaponEfficiency;
        }

        const shieldGenEfficiency = this.getSystemEfficiency('shields');
        if (this.stats.shields < this.stats.maxShields && this.stats.shieldsActive) {
            this.stats.shields += deltaTime * 0.005 * shieldGenEfficiency;
        }

        if (this.stats.energy < this.stats.maxEnergy) {
            this.stats.energy += deltaTime * 0.01;
        }

        // Cooldowns
        if (this.phaserCooldown > 0) this.phaserCooldown -= deltaTime;
        if (this.torpedoCooldown > 0) this.torpedoCooldown -= deltaTime;

        // WAR THUNDER STYLE MOUSE CONTROLS
        // Ship smoothly flies toward where the mouse is pointing
        if (this.mouseFlightEnabled && this.gameStarted && !this.autopilotEnabled) {
            // Calculate target direction based on mouse position
            // Mouse at center = fly straight, mouse offset = turn that direction
            const mouseX = this.mouse.x; // -1 to 1
            const mouseY = this.mouse.y; // -1 to 1

            // Target yaw and pitch based on mouse position
            // The ship tries to rotate so it's pointing where the mouse indicates
            const targetYawOffset = -mouseX * 0.8; // How much to turn left/right
            const targetPitchOffset = mouseY * 0.4; // How much to pitch up/down

            // Smooth interpolation factor (higher = more responsive)
            const smoothing = 0.04;

            // Calculate desired rotation changes
            const currentPitch = this.enterprise.rotation.x;
            const desiredPitch = targetPitchOffset;

            // Smoothly interpolate pitch
            this.enterprise.rotation.x += (desiredPitch - currentPitch) * smoothing;
            this.enterprise.rotation.x = Math.max(-0.6, Math.min(0.6, this.enterprise.rotation.x));

            // Apply yaw based on mouse offset (the further from center, the faster the turn)
            const yawRate = targetYawOffset * 0.03;
            this.enterprise.rotation.y += yawRate;

            // Auto-level roll smoothly
            this.enterprise.rotation.z *= 0.95;

            // Add slight roll when turning (like a real aircraft/ship)
            this.enterprise.rotation.z -= mouseX * 0.01;
            this.enterprise.rotation.z = Math.max(-0.3, Math.min(0.3, this.enterprise.rotation.z));
        }

        // Autopilot - automatically fly towards nearest enemy
        if (this.autopilotEnabled && this.targetLocked && this.gameStarted) {
            const toTarget = this.targetLocked.position.clone().sub(this.enterprise.position).normalize();
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.enterprise.quaternion);

            // Calculate turn needed
            const cross = new THREE.Vector3().crossVectors(forward, toTarget);
            this.enterprise.rotation.y += cross.y * 0.025;
            this.enterprise.rotation.x -= cross.x * 0.015;
            this.enterprise.rotation.x = Math.max(-0.4, Math.min(0.4, this.enterprise.rotation.x));
            this.enterprise.rotation.z *= 0.95;

            // Auto-accelerate
            this.stats.speed = Math.min(this.stats.speed + 0.01, this.stats.maxSpeed * 0.7);
        }

        const turnSpeed = this.stats.turnSpeed * deltaTime * 0.05;

        // Keyboard controls still work for fine adjustments
        if (this.keys['a'] || this.keys['arrowleft']) this.enterprise.rotation.y += turnSpeed;
        if (this.keys['d'] || this.keys['arrowright']) this.enterprise.rotation.y -= turnSpeed;
        if (this.keys['q']) this.enterprise.rotation.z += turnSpeed * 0.5;
        if (this.keys['e']) this.enterprise.rotation.z -= turnSpeed * 0.5;

        // Throttle (W/S and Up/Down arrows) - hold to accelerate/decelerate
        if (this.keys['w'] || this.keys['arrowup']) {
            this.stats.speed = Math.min(this.stats.speed + 0.03, this.stats.maxSpeed);
        } else if (this.keys['s'] || this.keys['arrowdown']) {
            this.stats.speed = Math.max(this.stats.speed - 0.03, 0);
        }

        // Hold left mouse button to accelerate
        if (this.mouse.down) {
            this.stats.speed = Math.min(this.stats.speed + 0.015, this.stats.maxSpeed);
        }

        // Warp
        if (this.keys['shift'] && this.stats.energy > 0) {
            this.stats.warpSpeed = Math.min(this.stats.warpSpeed + 0.05, this.stats.maxWarp);
            this.stats.energy -= deltaTime * 0.02;
        } else {
            this.stats.warpSpeed = Math.max(this.stats.warpSpeed - 0.1, 0);
        }

        // Move ship (affected by engine damage)
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(this.enterprise.quaternion);

        const engineEfficiency = this.getSystemEfficiency('engines');
        const warpEfficiency = this.getSystemEfficiency('warpCore');
        const totalSpeed = (this.stats.speed * engineEfficiency) + (this.stats.warpSpeed * 5 * warpEfficiency);
        this.enterprise.position.add(forward.multiplyScalar(totalSpeed));

        this.updateEngineSound();

        // Ship light
        this.shipLight.position.copy(this.enterprise.position);
        this.shipLight.position.y += 10;

        // Visual effects
        const time = Date.now();
        const warpActive = this.stats.warpSpeed > 0;

        if (this.nacelleGlows) {
            this.nacelleGlows.forEach((glow, idx) => {
                if (glow && glow.material) {
                    glow.material.opacity = warpActive
                        ? 0.95 + Math.sin(time * 0.01 + idx) * 0.05
                        : 0.7 + Math.sin(time * 0.004) * 0.2;
                }
            });
        }

        if (this.bussardGlows) {
            this.bussardGlows.forEach((glow, idx) => {
                if (glow && glow.material) {
                    glow.material.opacity = warpActive ? 0.95 : 0.7 + Math.sin(time * 0.006 + idx) * 0.2;
                }
            });
        }

        if (this.impulseGlows) {
            const impulseIntensity = 0.3 + (this.stats.speed / this.stats.maxSpeed) * 0.6;
            this.impulseGlows.forEach(glow => {
                if (glow && glow.material) glow.material.opacity = impulseIntensity;
            });
        }

        if (this.strobeLight) {
            this.strobeLight.material.opacity = ((time % 2000) / 2000) < 0.1 ? 1 : 0;
        }

        if (this.deflectorCenter) {
            this.deflectorCenter.material.opacity = 0.7 + Math.sin(time * 0.003) * 0.25;
        }

        // Update target lock
        this.updateTargetLock();

        // Update enemies - formation-based movement
        // First, find group leaders and move them
        const groupLeaders = {};
        this.enemies.forEach(enemy => {
            if (enemy.userData.isLeader) {
                groupLeaders[enemy.userData.groupId] = enemy;
            }
        });

        this.enemies.forEach(enemy => {
            const toPlayer = this.enterprise.position.clone().sub(enemy.position);
            const distance = toPlayer.length();

            // Announce enemy when in range
            this.announceEnemy(enemy);

            // Turn towards player
            const targetQuat = new THREE.Quaternion();
            const lookMatrix = new THREE.Matrix4().lookAt(enemy.position, this.enterprise.position, new THREE.Vector3(0, 1, 0));
            targetQuat.setFromRotationMatrix(lookMatrix);
            enemy.quaternion.slerp(targetQuat, enemy.userData.turnSpeed || 0.02);

            if (enemy.userData.isLeader) {
                // Leader moves toward player, others follow
                if (distance > 150) {
                    const moveDir = toPlayer.clone().normalize();
                    enemy.position.add(moveDir.multiplyScalar(enemy.userData.speed));
                } else if (distance > 80) {
                    const moveDir = toPlayer.clone().normalize();
                    enemy.position.add(moveDir.multiplyScalar(enemy.userData.speed * 0.5));
                } else {
                    // Circle at close range
                    const perpendicular = new THREE.Vector3(-toPlayer.z, 0, toPlayer.x).normalize();
                    enemy.position.add(perpendicular.multiplyScalar(enemy.userData.speed * 0.4));
                }
            } else {
                // Wingmen maintain formation relative to their leader
                const leader = groupLeaders[enemy.userData.groupId];
                if (leader) {
                    // Calculate desired position based on leader + formation offset
                    const desiredPos = leader.position.clone().add(enemy.userData.formationOffset);
                    const toDesired = desiredPos.clone().sub(enemy.position);

                    // Smoothly move toward formation position
                    if (toDesired.length() > 5) {
                        enemy.position.add(toDesired.normalize().multiplyScalar(enemy.userData.speed * 1.2));
                    }
                } else {
                    // No leader, move independently
                    if (distance > 100) {
                        const moveDir = toPlayer.clone().normalize();
                        enemy.position.add(moveDir.multiplyScalar(enemy.userData.speed));
                    }
                }
            }

            // Fire at player when in range
            const now = Date.now();
            if (distance < 400 && now - enemy.userData.lastFire > enemy.userData.fireRate) {
                enemy.userData.lastFire = now;
                this.enemyFire(enemy);
            }
        });

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            proj.userData.life -= deltaTime;

            if (proj.userData.type === 'torpedo') {
                // Homing towards target
                if (proj.userData.target && this.enemies.includes(proj.userData.target)) {
                    const toTarget = proj.userData.target.position.clone().sub(proj.position).normalize();
                    proj.userData.velocity.lerp(toTarget.multiplyScalar(5), 0.02);
                }
                proj.position.add(proj.userData.velocity);

                this.enemies.forEach(enemy => {
                    if (proj.position.distanceTo(enemy.position) < 10) {
                        this.damageEnemy(enemy, proj.userData.damage);
                        this.createExplosion(proj.position.clone());
                        proj.userData.life = 0;
                    }
                });
            } else if (proj.userData.type === 'phaser') {
                proj.material.opacity -= deltaTime * 0.003;
            } else if (proj.userData.type === 'enemy') {
                proj.position.add(proj.userData.velocity);

                if (proj.position.distanceTo(this.enterprise.position) < 15) {
                    this.damagePlayer(proj.userData.damage);
                    proj.userData.life = 0;
                }
            }

            if (proj.userData.life <= 0) {
                this.scene.remove(proj);
                return false;
            }
            return true;
        });

        // Update particles
        this.particles = this.particles.filter(particle => {
            particle.userData.life -= deltaTime;
            particle.position.add(particle.userData.velocity);

            if (particle.userData.type === 'debris') {
                // Rotate debris
                if (particle.userData.rotationSpeed) {
                    particle.rotation.x += particle.userData.rotationSpeed.x;
                    particle.rotation.y += particle.userData.rotationSpeed.y;
                    particle.rotation.z += particle.userData.rotationSpeed.z;
                }
                // Debris fades slower
                particle.material.opacity = Math.min(1, particle.userData.life / 500);
            } else if (particle.userData.type === 'smoke') {
                // Smoke expands and fades
                particle.scale.multiplyScalar(1.01);
                particle.material.opacity = (particle.userData.life / 2000) * 0.4;
            } else {
                // Fire particles shrink and fade
                particle.material.opacity = particle.userData.life / 1000;
                particle.scale.multiplyScalar(0.97);
            }

            if (particle.userData.life <= 0) {
                this.scene.remove(particle);
                return false;
            }
            return true;
        });

        // CAMERA - follows ship rotation when enabled
        if (!this.killCamActive) {
            const shipPos = this.enterprise.position.clone();

            // Camera follow - smoothly follow ship's heading from behind
            if (this.cameraFollowShip) {
                // Camera should be behind the ship
                const targetYaw = this.enterprise.rotation.y;
                let diff = targetYaw - this.cameraTargetRotation.y;
                // Normalize angle difference to [-PI, PI]
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.cameraTargetRotation.y += diff * 0.04;
                this.cameraRotation.y += (this.cameraTargetRotation.y - this.cameraRotation.y) * 0.1;

                // Also follow pitch slightly
                const targetPitch = 0.3 - this.enterprise.rotation.x * 0.3;
                this.cameraRotation.x += (targetPitch - this.cameraRotation.x) * 0.05;
            }

            const cameraOffset = new THREE.Vector3(
                Math.sin(this.cameraRotation.y) * Math.cos(this.cameraRotation.x) * this.cameraDistance,
                Math.sin(this.cameraRotation.x) * this.cameraDistance,
                Math.cos(this.cameraRotation.y) * Math.cos(this.cameraRotation.x) * this.cameraDistance
            );

            const targetCameraPos = shipPos.clone().add(cameraOffset);
            this.camera.position.lerp(targetCameraPos, 0.08);
            this.camera.lookAt(shipPos);
        } else {
            // Kill cam - look at explosion
            this.camera.lookAt(this.killCamTarget);
        }

        // Starfield rotation
        this.starfield.rotation.y += 0.00003;

        this.updateUI();
        this.updateMinimap();
    }

    enemyFire(enemy) {
        this.playEnemyFireSound();

        const projGeom = new THREE.SphereGeometry(0.5, 6, 6);
        const projMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const proj = new THREE.Mesh(projGeom, projMat);

        proj.position.copy(enemy.position);

        const direction = this.enterprise.position.clone().sub(enemy.position).normalize();

        proj.userData = {
            velocity: direction.multiplyScalar(3),
            damage: enemy.userData.damage,
            life: 5000,
            type: 'enemy'
        };

        const glowGeom = new THREE.SphereGeometry(1, 6, 6);
        const glowMat = new THREE.MeshBasicMaterial({
            color: 0x00ff00, transparent: true, opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        proj.add(glow);

        this.projectiles.push(proj);
        this.scene.add(proj);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;

        this.update(deltaTime);
        this.renderer.render(this.scene, this.camera);
    }
}

// Initialize game
const game = new StarTrekGame();
