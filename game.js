// Star Trek: Strange New Worlds - USS Enterprise Game

class StarTrekGame {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.enterprise = null;
        this.enemies = [];
        this.allies = [];
        this.allyShipNames = ['USS Excalibur', 'USS Lexington', 'USS Defiant', 'USS Hood'];
        this.projectiles = [];
        this.particles = [];

        this.stats = {
            hull: 500, maxHull: 500,
            shields: 200, maxShields: 200,
            energy: 100, maxEnergy: 100,
            phaserCharge: 100,
            torpedoes: 72, maxTorpedoes: 72,
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
            hullPlating: { name: 'Reinforced Hull', desc: '+100 Max Hull', cost: 500, purchased: false, effect: () => { this.stats.maxHull += 100; this.stats.hull = this.stats.maxHull; }},
            shieldBoost: { name: 'Enhanced Shields', desc: '+100 Max Shields', cost: 500, purchased: false, effect: () => { this.stats.maxShields += 100; this.stats.shields = this.stats.maxShields; }},
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
            fleet: { name: 'Fleet Battle', desc: 'Command a Federation squadron against overwhelming enemy forces', waves: 8, difficulty: 2.5, allies: 3 },
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

        // Raycaster for mouse aiming
        this.raycaster = new THREE.Raycaster();

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
        this.audioBuffers = {};
        this.audioLoaded = false;

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
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // Shadow setup
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

        // Bloom post-processing
        this.bloomEnabled = !!(THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass);
        if (this.bloomEnabled) {
            this.composer = new THREE.EffectComposer(this.renderer);
            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);

            this.bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(window.innerWidth, window.innerHeight),
                0.8,   // strength
                0.4,   // radius
                0.85   // threshold
            );
            this.composer.addPass(this.bloomPass);
        }

        // Screen shake state
        this.screenShake = { intensity: 0, duration: 0, elapsed: 0, active: false };

        // Engine trail particles
        this.engineTrails = [];

        // Warp speed lines
        this.warpLines = null;
        this.warpLinesOpacity = 0;

        // Explosion flash lights
        this.explosionFlashes = [];

        this.setupAudio();
        this.setupLighting();
        this.createStarfield();
        this.createNebula();
        this.createEnterprise();
        this.createWarpLines();
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
            this.loadAudioSamples();
            this.startEngineSound();
            document.removeEventListener('click', initAudio);
            document.removeEventListener('keydown', initAudio);
        };
        document.addEventListener('click', initAudio);
        document.addEventListener('keydown', initAudio);
    }

    async loadAudioSamples() {
        const soundFiles = {
            phaser: 'sounds/tos_ship_phaser_1.mp3',
            torpedo: 'sounds/tos_photon_torpedo.mp3',
            torpedo2: 'sounds/tos_photon_torpedo_2.mp3',
            redAlert: 'sounds/tos_red_alert.mp3',
            shieldHit: 'sounds/shield_sizzle.mp3',
            hullHit1: 'sounds/tos_hullhit_1.mp3',
            hullHit2: 'sounds/tos_hullhit_2.mp3',
            hullHit3: 'sounds/tos_hullhit_3.mp3',
            hullHit4: 'sounds/tos_hullhit_4.mp3',
            hullDamage: 'sounds/tos_hull_hit.mp3',
            commChirp: 'sounds/tng_chirp_clean.mp3',
            commChirp2: 'sounds/tos_chirp_1.mp3',
            largeExplosion1: 'sounds/largeexplosion1.mp3',
            largeExplosion2: 'sounds/largeexplosion2.mp3',
            largeExplosion3: 'sounds/largeexplosion3.mp3',
            largeExplosion4: 'sounds/largeexplosion4.mp3',
            smallExplosion1: 'sounds/smallexplosion1.mp3',
            smallExplosion2: 'sounds/smallexplosion2.mp3',
            smallExplosion3: 'sounds/smallexplosion3.mp3',
            consoleExplosion: 'sounds/console_explo_01.mp3',
            phaserStrike: 'sounds/tng_phaser_strike.mp3',
            disruptor: 'sounds/tos_disruptor.mp3',
        };

        const loadSound = async (name, url) => {
            try {
                const response = await fetch(url);
                const arrayBuffer = await response.arrayBuffer();
                this.audioBuffers[name] = await this.audioCtx.decodeAudioData(arrayBuffer);
            } catch (e) {
                console.warn(`Failed to load sound: ${name} from ${url}`);
            }
        };

        await Promise.all(
            Object.entries(soundFiles).map(([name, url]) => loadSound(name, url))
        );
        this.audioLoaded = true;
        console.log('Star Trek sound effects loaded');
    }

    playSample(name, volume = 1.0, playbackRate = 1.0) {
        if (!this.audioCtx || !this.soundEnabled || !this.audioBuffers[name]) return null;
        const source = this.audioCtx.createBufferSource();
        source.buffer = this.audioBuffers[name];
        source.playbackRate.value = playbackRate;
        const gain = this.audioCtx.createGain();
        gain.gain.value = volume * this.sfxVolume;
        source.connect(gain);
        gain.connect(this.masterGain);
        source.start(0);
        return { source, gain };
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

    startCombatMusic() {
        if (!this.audioCtx || this.combatMusicPlaying) return;
        this.combatMusicPlaying = true;

        const vol = this.musicVolume;

        // Star Trek style orchestral combat music
        // Timpani/percussion hits
        this.timpaniInterval = setInterval(() => {
            if (!this.gameStarted || !this.soundEnabled) return;
            const t = this.audioCtx.currentTime;

            // Timpani hit
            const timpani = this.audioCtx.createOscillator();
            const timpaniGain = this.audioCtx.createGain();
            timpani.type = 'sine';
            timpani.frequency.setValueAtTime(80, t);
            timpani.frequency.exponentialRampToValueAtTime(50, t + 0.3);
            timpaniGain.gain.setValueAtTime(0.3 * vol, t);
            timpaniGain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
            timpani.connect(timpaniGain);
            timpaniGain.connect(this.masterGain);
            timpani.start(t);
            timpani.stop(t + 0.4);
        }, 800);

        // Brass fanfare/French horn swells
        this.brassInterval = setInterval(() => {
            if (!this.gameStarted || !this.soundEnabled) return;
            const t = this.audioCtx.currentTime;

            // Heroic brass chord (stacked fifths like Star Trek)
            const brassNotes = [
                [130.8, 196, 261.6], // C major
                [146.8, 220, 293.7], // D major
                [164.8, 246.9, 329.6], // E minor
                [174.6, 261.6, 349.2]  // F major
            ];
            const chord = brassNotes[Math.floor(Math.random() * brassNotes.length)];

            chord.forEach((freq, i) => {
                const brass = this.audioCtx.createOscillator();
                const brassGain = this.audioCtx.createGain();
                const brassFilter = this.audioCtx.createBiquadFilter();

                brass.type = 'sawtooth';
                brass.frequency.value = freq;

                brassFilter.type = 'lowpass';
                brassFilter.frequency.setValueAtTime(300, t);
                brassFilter.frequency.linearRampToValueAtTime(1200, t + 0.3);
                brassFilter.frequency.linearRampToValueAtTime(400, t + 1.5);

                brassGain.gain.setValueAtTime(0, t);
                brassGain.gain.linearRampToValueAtTime(0.08 * vol, t + 0.2);
                brassGain.gain.setValueAtTime(0.06 * vol, t + 1);
                brassGain.gain.linearRampToValueAtTime(0, t + 2);

                brass.connect(brassFilter);
                brassFilter.connect(brassGain);
                brassGain.connect(this.masterGain);
                brass.start(t + i * 0.05);
                brass.stop(t + 2);
            });
        }, 4000);

        // Strings - sustained tension
        this.stringsOscs = [];
        const stringNotes = [130.8, 164.8, 196]; // C, E, G - sustained chord
        stringNotes.forEach(freq => {
            const str = this.audioCtx.createOscillator();
            const strGain = this.audioCtx.createGain();
            const strFilter = this.audioCtx.createBiquadFilter();

            str.type = 'triangle';
            str.frequency.value = freq;

            strFilter.type = 'lowpass';
            strFilter.frequency.value = 600;

            strGain.gain.value = 0.04 * vol;

            str.connect(strFilter);
            strFilter.connect(strGain);
            strGain.connect(this.masterGain);
            str.start();

            this.stringsOscs.push({ osc: str, gain: strGain });
        });

        // Heroic melody fragments (like TNG theme)
        this.melodyInterval = setInterval(() => {
            if (!this.gameStarted || !this.soundEnabled) return;
            const t = this.audioCtx.currentTime;

            // Star Trek style ascending melody
            const melodies = [
                [261.6, 329.6, 392, 523.2], // C E G C (heroic rise)
                [293.7, 349.2, 440, 587.3], // D F A D
                [261.6, 311.1, 392, 466.2], // C Eb G Bb (tension)
            ];
            const melody = melodies[Math.floor(Math.random() * melodies.length)];

            melody.forEach((freq, i) => {
                const note = this.audioCtx.createOscillator();
                const noteGain = this.audioCtx.createGain();
                const noteFilter = this.audioCtx.createBiquadFilter();

                note.type = 'triangle';
                note.frequency.value = freq;

                noteFilter.type = 'lowpass';
                noteFilter.frequency.value = 2000;

                const startTime = t + i * 0.25;
                noteGain.gain.setValueAtTime(0, startTime);
                noteGain.gain.linearRampToValueAtTime(0.1 * vol, startTime + 0.05);
                noteGain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.4);

                note.connect(noteFilter);
                noteFilter.connect(noteGain);
                noteGain.connect(this.masterGain);
                note.start(startTime);
                note.stop(startTime + 0.5);
            });
        }, 6000);
    }

    stopCombatMusic() {
        this.combatMusicPlaying = false;
        if (this.timpaniInterval) clearInterval(this.timpaniInterval);
        if (this.brassInterval) clearInterval(this.brassInterval);
        if (this.melodyInterval) clearInterval(this.melodyInterval);
        if (this.stringsOscs) {
            this.stringsOscs.forEach(s => s.osc.stop());
            this.stringsOscs = null;
        }
        this.timpaniInterval = null;
        this.brassInterval = null;
        this.melodyInterval = null;
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
        if (this.audioBuffers.phaser) {
            // Use ship phaser sound with slight pitch variation
            this.playSample('phaser', 0.6, 0.9 + Math.random() * 0.2);
            return;
        }
        // Fallback: synthesized phaser
        const duration = 0.6;
        const t = this.audioCtx.currentTime;
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
        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc1.start(t);
        osc2.start(t);
        osc1.stop(t + duration);
        osc2.stop(t + duration);
    }

    playTorpedoSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        if (this.audioBuffers.torpedo) {
            const key = Math.random() > 0.5 && this.audioBuffers.torpedo2 ? 'torpedo2' : 'torpedo';
            this.playSample(key, 0.7);
            return;
        }
        // Fallback: synthesized torpedo
        const t = this.audioCtx.currentTime;
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
        const chargeOsc = this.audioCtx.createOscillator();
        const chargeGain = this.audioCtx.createGain();
        chargeOsc.type = 'sine';
        chargeOsc.frequency.setValueAtTime(400, t + 0.05);
        chargeOsc.frequency.exponentialRampToValueAtTime(1200, t + 0.3);
        chargeGain.gain.setValueAtTime(0.1 * this.sfxVolume, t + 0.05);
        chargeGain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
        chargeOsc.connect(chargeGain);
        chargeGain.connect(this.masterGain);
        chargeOsc.start(t + 0.05);
        chargeOsc.stop(t + 0.7);
    }

    playExplosionSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        // Use TrekCore large explosion sounds
        const largeExplosions = ['largeExplosion1', 'largeExplosion2', 'largeExplosion3', 'largeExplosion4'].filter(k => this.audioBuffers[k]);
        if (largeExplosions.length > 0) {
            const pick = largeExplosions[Math.floor(Math.random() * largeExplosions.length)];
            this.playSample(pick, 0.9, 0.85 + Math.random() * 0.3);
            // Layer a small explosion for extra punch
            const smallExplosions = ['smallExplosion1', 'smallExplosion2', 'smallExplosion3'].filter(k => this.audioBuffers[k]);
            if (smallExplosions.length > 0) {
                const pick2 = smallExplosions[Math.floor(Math.random() * smallExplosions.length)];
                setTimeout(() => this.playSample(pick2, 0.5, 0.7 + Math.random() * 0.3), 60);
            }
            return;
        }
        // Fallback: synthesized explosion
        const t = this.audioCtx.currentTime;
        const boomOsc = this.audioCtx.createOscillator();
        const boomGain = this.audioCtx.createGain();
        boomOsc.type = 'sine';
        boomOsc.frequency.setValueAtTime(80, t);
        boomOsc.frequency.exponentialRampToValueAtTime(15, t + 0.8);
        boomGain.gain.setValueAtTime(0.55 * this.sfxVolume, t);
        boomGain.gain.exponentialRampToValueAtTime(0.001, t + 0.8);
        boomOsc.connect(boomGain);
        boomGain.connect(this.masterGain);
        boomOsc.start(t);
        boomOsc.stop(t + 0.8);
        const fireBufferSize = this.audioCtx.sampleRate * 1.5;
        const fireBuffer = this.audioCtx.createBuffer(1, fireBufferSize, this.audioCtx.sampleRate);
        const fireData = fireBuffer.getChannelData(0);
        for (let i = 0; i < fireBufferSize; i++) {
            fireData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (fireBufferSize * 0.3));
        }
        const fireNoise = this.audioCtx.createBufferSource();
        fireNoise.buffer = fireBuffer;
        const fireGain = this.audioCtx.createGain();
        fireGain.gain.setValueAtTime(0.3 * this.sfxVolume, t);
        fireGain.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
        fireNoise.connect(fireGain);
        fireGain.connect(this.masterGain);
        fireNoise.start(t);
    }

    playShieldHitSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        if (this.audioBuffers.shieldHit) {
            this.playSample('shieldHit', 0.7, 0.9 + Math.random() * 0.2);
            // Layer phaser strike for impact feel
            if (this.audioBuffers.phaserStrike) {
                this.playSample('phaserStrike', 0.4, 0.9 + Math.random() * 0.2);
            }
            return;
        }
        // Fallback: synthesized shield hit
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(3000, t);
        osc.frequency.exponentialRampToValueAtTime(800, t + 0.15);
        gain.gain.setValueAtTime(0.12 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc.stop(t + 0.2);
    }

    playHullDamageSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        if (this.audioBuffers.hullDamage) {
            this.playSample('hullDamage', 0.7, 0.9 + Math.random() * 0.2);
            // Layer console explosion for internal damage feel
            if (this.audioBuffers.consoleExplosion) {
                setTimeout(() => this.playSample('consoleExplosion', 0.5, 0.9 + Math.random() * 0.2), 50);
            }
            return;
        }
        // Fallback: synthesized hull damage
        const t = this.audioCtx.currentTime;
        const bufferSize = this.audioCtx.sampleRate * 0.15;
        const buffer = this.audioCtx.createBuffer(1, bufferSize, this.audioCtx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.2));
        }
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.audioCtx.createGain();
        noiseGain.gain.value = 0.25 * this.sfxVolume;
        noise.connect(noiseGain);
        noiseGain.connect(this.masterGain);
        noise.start(t);
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
        if (this.audioBuffers.disruptor) {
            this.playSample('disruptor', 0.4, 0.9 + Math.random() * 0.2);
            return;
        }
        // Fallback: synthesized disruptor - harsh electronic sound distinct from Federation phasers
        const t = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        const filter = this.audioCtx.createBiquadFilter();
        osc.type = 'square';
        osc.frequency.setValueAtTime(500, t);
        osc.frequency.exponentialRampToValueAtTime(150, t + 0.25);
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(450, t);
        osc2.frequency.exponentialRampToValueAtTime(120, t + 0.25);
        filter.type = 'bandpass';
        filter.frequency.value = 600;
        filter.Q.value = 2;
        gain.gain.setValueAtTime(0.07 * this.sfxVolume, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);
        osc.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        osc.start(t);
        osc2.start(t);
        osc.stop(t + 0.3);
        osc2.stop(t + 0.3);
    }

    playAlertSound() {
        if (!this.audioCtx || !this.soundEnabled) return;
        if (this.audioBuffers.redAlert) {
            // Play a short clip of the red alert (it's a long looping sound)
            const source = this.audioCtx.createBufferSource();
            source.buffer = this.audioBuffers.redAlert;
            const gain = this.audioCtx.createGain();
            gain.gain.value = 0.4 * this.sfxVolume;
            // Fade out after 2 seconds
            gain.gain.setValueAtTime(0.4 * this.sfxVolume, this.audioCtx.currentTime);
            gain.gain.setValueAtTime(0.4 * this.sfxVolume, this.audioCtx.currentTime + 1.5);
            gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 2.0);
            source.connect(gain);
            gain.connect(this.masterGain);
            source.start(0);
            source.stop(this.audioCtx.currentTime + 2.0);
            return;
        }
        // Fallback: synthesized red alert
        const t = this.audioCtx.currentTime;
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
        if (this.audioBuffers.commChirp) {
            // Prefer TOS communicator chirp (matches TOS era), TNG chirp as alternate
            const key = Math.random() > 0.7 && this.audioBuffers.commChirp ? 'commChirp' : 'commChirp2';
            this.playSample(this.audioBuffers[key] ? key : 'commChirp', 0.5);
            return;
        }
        // Fallback: synthesized comm chirp
        const t = this.audioCtx.currentTime;
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

        this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
        this.sunLight.position.set(100, 80, 100);
        this.sunLight.castShadow = true;
        this.sunLight.shadow.mapSize.width = 1024;
        this.sunLight.shadow.mapSize.height = 1024;
        this.sunLight.shadow.camera.near = 1;
        this.sunLight.shadow.camera.far = 500;
        this.sunLight.shadow.camera.left = -100;
        this.sunLight.shadow.camera.right = 100;
        this.sunLight.shadow.camera.top = 100;
        this.sunLight.shadow.camera.bottom = -100;
        this.scene.add(this.sunLight);
        this.scene.add(this.sunLight.target);

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

        // ========== REALISTIC MATERIALS ==========
        // Primary hull - pearlescent white/light gray
        const hullMaterial = new THREE.MeshStandardMaterial({
            color: 0xe8e8ec,
            metalness: 0.15,
            roughness: 0.35,
        });

        // Secondary hull panels - slightly darker
        const hullPanelMaterial = new THREE.MeshStandardMaterial({
            color: 0xd8d8dc,
            metalness: 0.2,
            roughness: 0.4,
        });

        // Dark accent areas
        const darkMaterial = new THREE.MeshStandardMaterial({
            color: 0x556677,
            metalness: 0.4,
            roughness: 0.3,
        });

        // Bussard collectors - deep red with glow
        const bussardMaterial = new THREE.MeshStandardMaterial({
            color: 0xcc2200,
            metalness: 0.3,
            roughness: 0.2,
            emissive: 0xff3300,
            emissiveIntensity: 0.8
        });

        // Warp nacelle grille - bright blue
        const warpGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0x4499ff,
            transparent: true,
            opacity: 0.95
        });

        // Deflector dish - copper/gold
        const deflectorMaterial = new THREE.MeshStandardMaterial({
            color: 0xdd8844,
            metalness: 0.7,
            roughness: 0.2,
            emissive: 0xcc6633,
            emissiveIntensity: 0.4
        });

        // Window glow - warm yellow
        const windowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffcc,
            transparent: true,
            opacity: 0.9
        });

        // ========== SAUCER SECTION ==========
        const saucerGroup = new THREE.Group();
        const saucerRadius = 22;
        const saucerThickness = 2.8;

        // Main saucer disc - accurate Constitution-class profile
        const saucerTopPoints = [];
        const saucerBottomPoints = [];

        // Create realistic saucer profile
        for (let i = 0; i <= 40; i++) {
            const t = i / 40;
            const r = t * saucerRadius;

            // Top surface - very flat with slight rise in center
            let topY;
            if (t < 0.15) {
                topY = saucerThickness * 0.5 + t * 2; // Rise to bridge area
            } else if (t < 0.9) {
                topY = saucerThickness * 0.5 * (1 - Math.pow((t - 0.15) / 0.75, 0.5) * 0.3);
            } else {
                topY = saucerThickness * 0.2 * (1 - (t - 0.9) / 0.1);
            }
            saucerTopPoints.push(new THREE.Vector2(r, topY));

            // Bottom surface - flatter
            let bottomY;
            if (t < 0.9) {
                bottomY = -saucerThickness * 0.35 * (1 - Math.pow(t / 0.9, 2) * 0.2);
            } else {
                bottomY = -saucerThickness * 0.15 * (1 - (t - 0.9) / 0.1);
            }
            saucerBottomPoints.push(new THREE.Vector2(r, bottomY));
        }

        // Combine for full profile
        const saucerProfile = [...saucerTopPoints];
        for (let i = saucerBottomPoints.length - 1; i >= 0; i--) {
            saucerProfile.push(saucerBottomPoints[i]);
        }

        const saucerGeom = new THREE.LatheGeometry(saucerProfile, 72);
        const saucer = new THREE.Mesh(saucerGeom, hullMaterial);
        saucerGroup.add(saucer);

        // Saucer edge detail ring
        const edgeRingGeom = new THREE.TorusGeometry(saucerRadius - 0.3, 0.25, 8, 72);
        const edgeRing = new THREE.Mesh(edgeRingGeom, hullPanelMaterial);
        edgeRing.rotation.x = Math.PI / 2;
        edgeRing.position.y = 0.1;
        saucerGroup.add(edgeRing);

        // Panel line rings for detail
        for (let ring = 1; ring <= 4; ring++) {
            const ringRadius = saucerRadius * (0.25 + ring * 0.15);
            const panelRingGeom = new THREE.TorusGeometry(ringRadius, 0.06, 4, 72);
            const panelRing = new THREE.Mesh(panelRingGeom, darkMaterial);
            panelRing.rotation.x = Math.PI / 2;
            panelRing.position.y = saucerThickness * 0.4;
            saucerGroup.add(panelRing);
        }

        // ========== BRIDGE MODULE - Accurate stepped design ==========
        const bridgeGroup = new THREE.Group();

        // B/C Deck - wide base
        const deckBCGeom = new THREE.CylinderGeometry(6.5, 7.5, 0.8, 32);
        const deckBC = new THREE.Mesh(deckBCGeom, hullMaterial);
        deckBC.position.y = saucerThickness * 0.5 + 0.4;
        bridgeGroup.add(deckBC);

        // A Deck - bridge level
        const deckAGeom = new THREE.CylinderGeometry(5.0, 6.2, 0.7, 32);
        const deckA = new THREE.Mesh(deckAGeom, hullMaterial);
        deckA.position.y = saucerThickness * 0.5 + 1.1;
        bridgeGroup.add(deckA);

        // Bridge dome
        const bridgeDomeGeom = new THREE.SphereGeometry(4.2, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2.8);
        const bridgeDome = new THREE.Mesh(bridgeDomeGeom, hullMaterial);
        bridgeDome.position.y = saucerThickness * 0.5 + 1.4;
        bridgeGroup.add(bridgeDome);

        // Bridge window band - horizontal strip
        const bridgeWindowGeom = new THREE.TorusGeometry(4.0, 0.18, 8, 48);
        const bridgeWindow = new THREE.Mesh(bridgeWindowGeom, windowMaterial);
        bridgeWindow.rotation.x = Math.PI / 2;
        bridgeWindow.position.y = saucerThickness * 0.5 + 2.2;
        bridgeGroup.add(bridgeWindow);

        // Sensor dome on top
        const sensorDomeGeom = new THREE.SphereGeometry(1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
        const sensorDome = new THREE.Mesh(sensorDomeGeom, darkMaterial);
        sensorDome.position.y = saucerThickness * 0.5 + 3.8;
        bridgeGroup.add(sensorDome);

        saucerGroup.add(bridgeGroup);

        // ========== IMPULSE ENGINES ==========
        const impulseGroup = new THREE.Group();

        // Main housing
        const impulseHousingGeom = new THREE.BoxGeometry(7, 2.2, 3);
        const impulseHousing = new THREE.Mesh(impulseHousingGeom, darkMaterial);
        impulseGroup.add(impulseHousing);

        // Impulse vents - glowing exhaust
        for (let i = -1; i <= 1; i++) {
            const ventGeom = new THREE.PlaneGeometry(1.8, 1.5);
            const vent = new THREE.Mesh(ventGeom, new THREE.MeshBasicMaterial({
                color: 0xff5511,
                transparent: true,
                opacity: 0.95
            }));
            vent.position.set(i * 2.2, 0, 1.51);
            impulseGroup.add(vent);
            this.impulseGlows.push(vent);

            // Vent glow halo
            const haloGeom = new THREE.PlaneGeometry(2.4, 2.0);
            const halo = new THREE.Mesh(haloGeom, new THREE.MeshBasicMaterial({
                color: 0xff3300,
                transparent: true,
                opacity: 0.3
            }));
            halo.position.set(i * 2.2, 0, 1.55);
            impulseGroup.add(halo);
        }

        impulseGroup.position.set(0, 0.3, saucerRadius - 3);
        saucerGroup.add(impulseGroup);

        // ========== PHASER STRIPS ==========
        // Dorsal phaser array
        const phaserDorsalGeom = new THREE.TorusGeometry(saucerRadius - 6, 0.1, 6, 64, Math.PI);
        const phaserDorsal = new THREE.Mesh(phaserDorsalGeom, new THREE.MeshBasicMaterial({
            color: 0xffaa44,
            transparent: true,
            opacity: 0.7
        }));
        phaserDorsal.rotation.x = Math.PI / 2;
        phaserDorsal.rotation.z = Math.PI / 2;
        phaserDorsal.position.y = saucerThickness * 0.45;
        saucerGroup.add(phaserDorsal);

        // Ventral phaser array
        const phaserVentralGeom = new THREE.TorusGeometry(saucerRadius - 6, 0.1, 6, 64, Math.PI);
        const phaserVentral = new THREE.Mesh(phaserVentralGeom, new THREE.MeshBasicMaterial({
            color: 0xffaa44,
            transparent: true,
            opacity: 0.6
        }));
        phaserVentral.rotation.x = Math.PI / 2;
        phaserVentral.rotation.z = -Math.PI / 2;
        phaserVentral.position.y = -saucerThickness * 0.3;
        saucerGroup.add(phaserVentral);

        // Add windows to saucer
        this.addSaucerWindows(saucerGroup, saucerRadius, windowMaterial);

        saucerGroup.position.z = -18;
        this.enterprise.add(saucerGroup);

        // ========== SECONDARY HULL (Engineering Section) ==========
        const hullGroup = new THREE.Group();
        const hullLength = 48;
        const hullRadius = 4.0;

        // Realistic cigar-shaped hull profile
        const hullPoints = [];
        for (let i = 0; i <= 36; i++) {
            const t = i / 36;
            const z = (t - 0.5) * hullLength;
            let r;

            if (t < 0.12) {
                // Forward taper to deflector
                r = 2.2 + t * 15;
            } else if (t > 0.88) {
                // Aft taper to shuttle bay
                r = hullRadius * (1 - (t - 0.88) * 6);
            } else {
                // Main body with subtle curve
                const bodyT = (t - 0.12) / 0.76;
                r = hullRadius + Math.sin(bodyT * Math.PI) * 0.4;
            }
            hullPoints.push(new THREE.Vector2(Math.max(r, 0.8), z));
        }

        const hullGeom = new THREE.LatheGeometry(hullPoints, 48);
        hullGeom.rotateX(Math.PI / 2);
        const hull = new THREE.Mesh(hullGeom, hullMaterial);
        hullGroup.add(hull);

        // Hull panel details
        for (let i = 0; i < 4; i++) {
            const detailZ = -hullLength * 0.3 + i * hullLength * 0.2;
            const detailRingGeom = new THREE.TorusGeometry(hullRadius + 0.05, 0.08, 4, 32);
            const detailRing = new THREE.Mesh(detailRingGeom, darkMaterial);
            detailRing.position.z = detailZ;
            hullGroup.add(detailRing);
        }

        // ========== DEFLECTOR DISH ==========
        const deflectorGroup = new THREE.Group();

        // Deflector housing
        const defHousingGeom = new THREE.CylinderGeometry(3.5, 4.0, 4, 32);
        defHousingGeom.rotateX(Math.PI / 2);
        const defHousing = new THREE.Mesh(defHousingGeom, darkMaterial);
        deflectorGroup.add(defHousing);

        // Main dish - copper colored parabolic
        const defDishPoints = [];
        for (let i = 0; i <= 16; i++) {
            const t = i / 16;
            const r = t * 3.2;
            const z = -Math.pow(t, 1.5) * 1.8; // Parabolic curve
            defDishPoints.push(new THREE.Vector2(r, z));
        }
        const defDishGeom = new THREE.LatheGeometry(defDishPoints, 32);
        const defDish = new THREE.Mesh(defDishGeom, deflectorMaterial);
        defDish.position.z = -1.5;
        deflectorGroup.add(defDish);
        this.deflector = defDish;

        // Deflector center glow
        const defCenterGeom = new THREE.SphereGeometry(1.2, 24, 16);
        const defCenter = new THREE.Mesh(defCenterGeom, new THREE.MeshBasicMaterial({
            color: 0xffaa55,
            transparent: true,
            opacity: 0.9
        }));
        defCenter.position.z = -1.2;
        deflectorGroup.add(defCenter);
        this.deflectorCenter = defCenter;

        // Outer glow ring
        const defGlowRingGeom = new THREE.TorusGeometry(2.8, 0.15, 8, 32);
        const defGlowRing = new THREE.Mesh(defGlowRingGeom, new THREE.MeshBasicMaterial({
            color: 0xffcc77,
            transparent: true,
            opacity: 0.5
        }));
        defGlowRing.position.z = -2.0;
        deflectorGroup.add(defGlowRing);

        deflectorGroup.position.z = -hullLength / 2 - 2;
        hullGroup.add(deflectorGroup);

        // ========== TORPEDO LAUNCHER ==========
        const torpedoHousingGeom = new THREE.BoxGeometry(2.5, 1.8, 2);
        const torpedoHousing = new THREE.Mesh(torpedoHousingGeom, darkMaterial);
        torpedoHousing.position.set(0, -3.2, -hullLength / 2 + 6);
        hullGroup.add(torpedoHousing);

        // Torpedo tubes
        for (let i = -1; i <= 1; i += 2) {
            const tubeGeom = new THREE.CylinderGeometry(0.35, 0.35, 2.5, 12);
            tubeGeom.rotateX(Math.PI / 2);
            const tube = new THREE.Mesh(tubeGeom, new THREE.MeshBasicMaterial({ color: 0x222222 }));
            tube.position.set(i * 0.7, -3.2, -hullLength / 2 + 4.5);
            hullGroup.add(tube);
        }

        // ========== SHUTTLE BAY ==========
        const shuttleBayGeom = new THREE.BoxGeometry(5, 4, 1);
        const shuttleBay = new THREE.Mesh(shuttleBayGeom, darkMaterial);
        shuttleBay.position.set(0, 0, hullLength / 2);
        hullGroup.add(shuttleBay);

        // Shuttle bay doors
        const doorGeom = new THREE.PlaneGeometry(4, 3);
        const door = new THREE.Mesh(doorGeom, new THREE.MeshStandardMaterial({
            color: 0x445566,
            metalness: 0.5,
            roughness: 0.3
        }));
        door.position.set(0, 0, hullLength / 2 + 0.51);
        hullGroup.add(door);

        this.addHullWindows(hullGroup, hullLength, hullRadius, windowMaterial);

        hullGroup.position.set(0, -8, 20);
        this.enterprise.add(hullGroup);

        // ========== NECK (Dorsal Connector) ==========
        const neckGroup = new THREE.Group();

        // Curved neck connecting saucer to hull
        const neckShape = new THREE.Shape();
        neckShape.moveTo(-1.5, 0);
        neckShape.lineTo(1.5, 0);
        neckShape.lineTo(1.8, 12);
        neckShape.lineTo(-1.8, 12);
        neckShape.closePath();

        const neckExtrudeSettings = {
            steps: 1,
            depth: 4,
            bevelEnabled: true,
            bevelThickness: 0.3,
            bevelSize: 0.3,
            bevelSegments: 3
        };

        const neckGeom = new THREE.ExtrudeGeometry(neckShape, neckExtrudeSettings);
        neckGeom.translate(0, -6, -2);
        const neck = new THREE.Mesh(neckGeom, hullMaterial);
        neckGroup.add(neck);

        neckGroup.position.set(0, -2, 2);
        this.enterprise.add(neckGroup);

        // ========== WARP NACELLES ==========
        for (let side = -1; side <= 1; side += 2) {
            const nacelleGroup = new THREE.Group();
            const nacelleLength = 44;
            const nacelleRadius = 2.2;

            // Main nacelle body - cylindrical with tapered ends
            const nacellePoints = [];
            for (let i = 0; i <= 32; i++) {
                const t = i / 32;
                const z = (t - 0.5) * nacelleLength;
                let r = nacelleRadius;

                if (t < 0.08) {
                    // Front taper
                    r = nacelleRadius * (0.6 + t * 5);
                } else if (t > 0.92) {
                    // Rear taper
                    r = nacelleRadius * (1 - (t - 0.92) * 8);
                }
                nacellePoints.push(new THREE.Vector2(r, z));
            }

            const nacelleGeom = new THREE.LatheGeometry(nacellePoints, 32);
            nacelleGeom.rotateX(Math.PI / 2);
            const nacelleBody = new THREE.Mesh(nacelleGeom, hullMaterial);
            nacelleGroup.add(nacelleBody);

            // Nacelle detail band
            const nacelleBandGeom = new THREE.TorusGeometry(nacelleRadius + 0.05, 0.12, 8, 32);
            const nacelleBand = new THREE.Mesh(nacelleBandGeom, darkMaterial);
            nacelleBand.position.z = -nacelleLength * 0.3;
            nacelleGroup.add(nacelleBand);

            // ========== BUSSARD COLLECTOR ==========
            // Outer dome
            const bussardDomeGeom = new THREE.SphereGeometry(nacelleRadius + 0.4, 32, 24, 0, Math.PI * 2, 0, Math.PI / 1.8);
            bussardDomeGeom.rotateX(Math.PI);
            const bussardDome = new THREE.Mesh(bussardDomeGeom, new THREE.MeshStandardMaterial({
                color: 0x882200,
                metalness: 0.3,
                roughness: 0.4,
                transparent: true,
                opacity: 0.85
            }));
            bussardDome.position.z = -nacelleLength / 2 - 0.5;
            nacelleGroup.add(bussardDome);

            // Inner glow
            const bussardGlowGeom = new THREE.SphereGeometry(nacelleRadius - 0.2, 24, 16);
            const bussardGlow = new THREE.Mesh(bussardGlowGeom, new THREE.MeshBasicMaterial({
                color: 0xff4400,
                transparent: true,
                opacity: 0.9
            }));
            bussardGlow.position.z = -nacelleLength / 2 - 0.3;
            nacelleGroup.add(bussardGlow);
            this.bussardGlows.push(bussardGlow);

            // Bussard spinning effect rings
            for (let r = 0; r < 3; r++) {
                const spinRingGeom = new THREE.TorusGeometry(nacelleRadius * (0.3 + r * 0.25), 0.08, 6, 24);
                const spinRing = new THREE.Mesh(spinRingGeom, new THREE.MeshBasicMaterial({
                    color: 0xff6622,
                    transparent: true,
                    opacity: 0.6 - r * 0.15
                }));
                spinRing.position.z = -nacelleLength / 2 - 0.8;
                nacelleGroup.add(spinRing);
            }

            // ========== WARP GRILLE ==========
            // Main grille - glowing blue strip
            const grilleGeom = new THREE.BoxGeometry(1.0, 0.25, nacelleLength - 10);
            const grille = new THREE.Mesh(grilleGeom, warpGlowMaterial);
            grille.position.y = nacelleRadius + 0.12;
            grille.position.z = 2;
            nacelleGroup.add(grille);
            this.nacelleGlows.push(grille);

            // Grille housing
            const grilleHousingGeom = new THREE.BoxGeometry(1.4, 0.4, nacelleLength - 8);
            const grilleHousing = new THREE.Mesh(grilleHousingGeom, darkMaterial);
            grilleHousing.position.y = nacelleRadius + 0.2;
            grilleHousing.position.z = 2;
            nacelleGroup.add(grilleHousing);

            // Glow aura
            const grilleAuraGeom = new THREE.BoxGeometry(2.0, 0.1, nacelleLength - 8);
            const grilleAura = new THREE.Mesh(grilleAuraGeom, new THREE.MeshBasicMaterial({
                color: 0x66bbff,
                transparent: true,
                opacity: 0.25
            }));
            grilleAura.position.y = nacelleRadius + 0.35;
            grilleAura.position.z = 2;
            nacelleGroup.add(grilleAura);

            // Nacelle end cap
            const endCapGeom = new THREE.SphereGeometry(nacelleRadius * 0.5, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2);
            endCapGeom.rotateX(Math.PI / 2);
            const endCap = new THREE.Mesh(endCapGeom, darkMaterial);
            endCap.position.z = nacelleLength / 2;
            nacelleGroup.add(endCap);

            // Position nacelle
            nacelleGroup.position.set(side * 14, 8, 18);
            this.enterprise.add(nacelleGroup);

            // ========== PYLON (Nacelle Strut) ==========
            const pylonGroup = new THREE.Group();

            // Swept-back pylon shape
            const pylonShape = new THREE.Shape();
            pylonShape.moveTo(0, -7);
            pylonShape.lineTo(0.5, -7);
            pylonShape.bezierCurveTo(0.6, -3, 0.6, 3, 0.5, 7);
            pylonShape.lineTo(0, 7);
            pylonShape.bezierCurveTo(0.1, 3, 0.1, -3, 0, -7);

            const pylonExtrudeSettings = {
                steps: 1,
                depth: 3.5,
                bevelEnabled: true,
                bevelThickness: 0.15,
                bevelSize: 0.15,
                bevelSegments: 2
            };

            const pylonGeom = new THREE.ExtrudeGeometry(pylonShape, pylonExtrudeSettings);
            pylonGeom.translate(-0.25, 0, -1.75);
            const pylon = new THREE.Mesh(pylonGeom, hullMaterial);
            pylonGroup.add(pylon);

            pylonGroup.position.set(side * 9, 0.5, 18);
            pylonGroup.rotation.z = side * -0.42;
            pylonGroup.rotation.x = 0.03;
            this.enterprise.add(pylonGroup);
        }

        // ========== NAVIGATION LIGHTS ==========
        const navLights = [
            { pos: [0, saucerThickness * 0.5 + 4.5, -18], color: 0x00ff00, size: 0.3 }, // Top
            { pos: [-saucerRadius - 0.5, 0, -18], color: 0xff0000, size: 0.35 }, // Port
            { pos: [saucerRadius + 0.5, 0, -18], color: 0x00ff00, size: 0.35 }, // Starboard
            { pos: [0, -8, 44], color: 0xffffff, size: 0.3 }, // Aft
            { pos: [-14, 8, -8], color: 0xff0000, size: 0.25 }, // Port nacelle
            { pos: [14, 8, -8], color: 0x00ff00, size: 0.25 }, // Starboard nacelle
        ];

        navLights.forEach(({ pos, color, size }) => {
            const lightGeom = new THREE.SphereGeometry(size, 8, 8);
            const light = new THREE.Mesh(lightGeom, new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 0.9
            }));
            light.position.set(...pos);
            this.enterprise.add(light);
        });

        // Strobe light
        const strobeGeom = new THREE.SphereGeometry(0.35, 8, 8);
        this.strobeLight = new THREE.Mesh(strobeGeom, new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0
        }));
        this.strobeLight.position.set(0, saucerThickness * 0.5 + 4, -18);
        this.enterprise.add(this.strobeLight);

        // Final assembly
        this.enterprise.scale.set(0.32, 0.32, 0.32);
        this.enterprise.rotation.y = Math.PI;
        this.scene.add(this.enterprise);

        // Enable shadows on Enterprise meshes
        this.enableShadows(this.enterprise);

        // Shield mesh - larger to encompass full ship
        const shieldGeom = new THREE.SphereGeometry(30, 32, 32);
        this.shieldMesh = new THREE.Mesh(shieldGeom, new THREE.MeshBasicMaterial({
            color: 0x44aaff, transparent: true, opacity: 0, side: THREE.DoubleSide
        }));
        this.enterprise.add(this.shieldMesh);
    }

    addSaucerWindows(saucerGroup, radius, material) {
        const saucerThickness = 2.8;

        // Realistic window placement - multiple deck rings
        for (let ring = 0; ring < 5; ring++) {
            const r = radius - 4 - ring * 3.2;
            const count = Math.floor(36 - ring * 5);
            const yPos = saucerThickness * 0.35 - ring * 0.12;

            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                // Skip aft section where impulse engines are
                if (angle > 0.8 && angle < 2.3) continue;

                const windowGeom = new THREE.CircleGeometry(0.15, 8);
                const window = new THREE.Mesh(windowGeom, material);
                window.position.set(Math.cos(angle) * r, yPos, Math.sin(angle) * r);
                window.rotation.x = -Math.PI / 2;
                saucerGroup.add(window);
            }
        }
    }

    addHullWindows(hullGroup, length, radius, material) {
        // Realistic window placement along engineering hull
        // Multiple deck levels with proper spacing
        for (let row = 0; row < 6; row++) {
            const zPos = -length * 0.35 + row * length * 0.12;
            const numWindows = 14;

            for (let i = 0; i < numWindows; i++) {
                const angle = (i / numWindows) * Math.PI * 2;
                // Only show windows on upper portion (not bottom of hull)
                if (Math.sin(angle) < -0.15) continue;

                const windowGeom = new THREE.CircleGeometry(0.12, 8);
                const window = new THREE.Mesh(windowGeom, material);
                const r = radius + 0.03;
                window.position.set(Math.cos(angle) * r, Math.sin(angle) * r, zPos);
                window.lookAt(Math.cos(angle) * (r + 1), Math.sin(angle) * (r + 1), zPos);
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

        // Enemy stats by type
        const enemyStats = {
            klingon: { health: 120, shields: 120, speed: 0.4, turnSpeed: 0.015, damage: 30, fireRate: 1200, credits: 100, scale: 0.45, shieldColor: 0x44ff44 },
            romulan: { health: 100, shields: 100, speed: 0.5, turnSpeed: 0.02, damage: 25, fireRate: 1500, credits: 150, scale: 0.4, shieldColor: 0x44ff88 },
            borg: { health: 300, shields: 200, speed: 0.2, turnSpeed: 0.008, damage: 50, fireRate: 2000, credits: 400, scale: 0.6, shieldColor: 0x88ff88, regenerates: true },
            gorn: { health: 80, shields: 60, speed: 0.7, turnSpeed: 0.03, damage: 20, fireRate: 800, credits: 80, scale: 0.35, shieldColor: 0xffff44 },
            cardassian: { health: 150, shields: 150, speed: 0.35, turnSpeed: 0.012, damage: 35, fireRate: 1800, credits: 200, scale: 0.5, shieldColor: 0xffaa44 }
        };

        const stats = enemyStats[type] || enemyStats.klingon;
        enemy.userData = {
            type: type,
            health: stats.health,
            maxHealth: stats.health,
            shields: stats.shields,
            maxShields: stats.shields,
            speed: stats.speed,
            turnSpeed: stats.turnSpeed,
            damage: stats.damage,
            fireRate: stats.fireRate,
            lastFire: 0,
            credits: stats.credits,
            announced: false,
            regenerates: stats.regenerates || false
        };

        if (type === 'klingon') {
            // Klingon Bird of Prey
            const bodyMat = new THREE.MeshPhongMaterial({ color: 0x2a4a2a, specular: 0x224422 });
            const darkMat = new THREE.MeshPhongMaterial({ color: 0x1a2a1a });
            const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff44 });

            const bodyGeom = new THREE.ConeGeometry(5, 16, 8);
            bodyGeom.rotateX(Math.PI / 2);
            enemy.add(new THREE.Mesh(bodyGeom, bodyMat));

            const pod = new THREE.Mesh(new THREE.SphereGeometry(3, 16, 12), bodyMat);
            pod.position.set(0, 2, -4);
            enemy.add(pod);

            for (let side = -1; side <= 1; side += 2) {
                const wing = new THREE.Mesh(new THREE.BoxGeometry(20, 1, 8), bodyMat);
                wing.position.set(side * 10, 0, 3);
                wing.rotation.z = side * 0.25;
                enemy.add(wing);

                const strip = new THREE.Mesh(new THREE.BoxGeometry(15, 0.3, 1), glowMat);
                strip.position.set(side * 8, 0.7, 3);
                enemy.add(strip);
            }

            const cannonGlow = new THREE.Mesh(new THREE.SphereGeometry(0.8, 8, 8), glowMat);
            cannonGlow.position.z = -12;
            enemy.add(cannonGlow);

        } else if (type === 'romulan') {
            // Romulan Warbird
            const bodyMat = new THREE.MeshPhongMaterial({ color: 0x336655, specular: 0x224433 });
            const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff66 });

            const upper = new THREE.Mesh(new THREE.BoxGeometry(8, 2, 18), bodyMat);
            enemy.add(upper);

            for (let side = -1; side <= 1; side += 2) {
                const wing = new THREE.Mesh(new THREE.BoxGeometry(18, 0.5, 10), bodyMat);
                wing.position.set(side * 10, 0, 2);
                wing.rotation.z = side * 0.15;
                enemy.add(wing);
            }

            const glow = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), glowMat);
            glow.position.z = -10;
            enemy.add(glow);

        } else if (type === 'borg') {
            // Borg Cube - iconic cube shape with green glow
            const cubeMat = new THREE.MeshPhongMaterial({ color: 0x222222, specular: 0x111111 });
            const borgGlow = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.8 });

            const cube = new THREE.Mesh(new THREE.BoxGeometry(20, 20, 20), cubeMat);
            enemy.add(cube);

            // Grid pattern on cube faces
            for (let i = -1; i <= 1; i += 2) {
                for (let j = -1; j <= 1; j += 2) {
                    const lineH = new THREE.Mesh(new THREE.BoxGeometry(18, 0.3, 0.3), borgGlow);
                    lineH.position.set(0, i * 5, j * 10.1);
                    enemy.add(lineH);

                    const lineV = new THREE.Mesh(new THREE.BoxGeometry(0.3, 18, 0.3), borgGlow);
                    lineV.position.set(i * 5, 0, j * 10.1);
                    enemy.add(lineV);
                }
            }

            // Central green glow
            const core = new THREE.Mesh(new THREE.SphereGeometry(3, 8, 8), borgGlow);
            enemy.add(core);

        } else if (type === 'gorn') {
            // Gorn Raider - aggressive, reptilian design
            const bodyMat = new THREE.MeshPhongMaterial({ color: 0x4a3a2a, specular: 0x332211 });
            const glowMat = new THREE.MeshBasicMaterial({ color: 0xffaa00 });

            // Sleek predator body
            const body = new THREE.Mesh(new THREE.ConeGeometry(3, 14, 6), bodyMat);
            body.rotation.x = Math.PI / 2;
            enemy.add(body);

            // Aggressive forward spikes
            for (let i = 0; i < 3; i++) {
                const spike = new THREE.Mesh(new THREE.ConeGeometry(0.5, 4, 4), bodyMat);
                spike.rotation.x = Math.PI / 2;
                spike.position.set((i - 1) * 2, 0, -9);
                enemy.add(spike);
            }

            // Engine glow
            const engine = new THREE.Mesh(new THREE.SphereGeometry(1.5, 8, 8), glowMat);
            engine.position.z = 8;
            enemy.add(engine);

        } else if (type === 'cardassian') {
            // Cardassian Galor-class
            const bodyMat = new THREE.MeshPhongMaterial({ color: 0x8a7a5a, specular: 0x554433 });
            const glowMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });

            // Main hull - elongated
            const hull = new THREE.Mesh(new THREE.BoxGeometry(6, 3, 22), bodyMat);
            enemy.add(hull);

            // Forward section
            const nose = new THREE.Mesh(new THREE.ConeGeometry(3, 8, 6), bodyMat);
            nose.rotation.x = Math.PI / 2;
            nose.position.z = -15;
            enemy.add(nose);

            // Wing structures
            for (let side = -1; side <= 1; side += 2) {
                const wing = new THREE.Mesh(new THREE.BoxGeometry(12, 1, 6), bodyMat);
                wing.position.set(side * 7, 0, 4);
                enemy.add(wing);
            }

            // Weapon glow
            const weapon = new THREE.Mesh(new THREE.SphereGeometry(1, 8, 8), glowMat);
            weapon.position.z = -19;
            enemy.add(weapon);
        }

        enemy.scale.set(stats.scale, stats.scale, stats.scale);

        // Add shield mesh
        const shieldGeom = new THREE.SphereGeometry(type === 'borg' ? 20 : 15, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: stats.shieldColor,
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
                // Determine enemy type based on wave number
                let type;
                const roll = Math.random();

                if (this.wave >= 8) {
                    // Late waves: all enemy types including Borg
                    if (roll < 0.1) type = 'borg';          // 10% Borg (rare, powerful)
                    else if (roll < 0.25) type = 'cardassian'; // 15% Cardassian
                    else if (roll < 0.45) type = 'romulan';    // 20% Romulan
                    else if (roll < 0.65) type = 'gorn';       // 20% Gorn
                    else type = 'klingon';                     // 35% Klingon
                } else if (this.wave >= 5) {
                    // Mid waves: Klingon, Romulan, Cardassian, Gorn
                    if (roll < 0.15) type = 'cardassian';   // 15% Cardassian
                    else if (roll < 0.35) type = 'romulan'; // 20% Romulan
                    else if (roll < 0.55) type = 'gorn';    // 20% Gorn
                    else type = 'klingon';                  // 45% Klingon
                } else if (this.wave >= 3) {
                    // Early-mid waves: Klingon, Gorn, Romulan
                    if (roll < 0.2) type = 'romulan';       // 20% Romulan
                    else if (roll < 0.45) type = 'gorn';    // 25% Gorn
                    else type = 'klingon';                  // 55% Klingon
                } else {
                    // Starting waves: mostly Klingon and Gorn
                    if (roll < 0.3) type = 'gorn';          // 30% Gorn (fast, weak scouts)
                    else type = 'klingon';                  // 70% Klingon
                }

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

                this.enableShadows(enemy);
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

    createAlly(name) {
        const ally = new THREE.Group();

        // Federation blue/white color scheme
        const hullMat = new THREE.MeshPhongMaterial({ color: 0xccccdd, specular: 0x666688 });
        const accentMat = new THREE.MeshPhongMaterial({ color: 0x8899bb });
        const nacelleGlow = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.8 });
        const deflectorMat = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.7 });

        // Saucer section
        const saucer = new THREE.Mesh(new THREE.CylinderGeometry(7, 7, 1.5, 24), hullMat);
        saucer.rotation.x = 0;
        ally.add(saucer);

        // Bridge dome
        const bridge = new THREE.Mesh(new THREE.SphereGeometry(2, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), accentMat);
        bridge.position.y = 0.75;
        ally.add(bridge);

        // Engineering hull (secondary hull)
        const engHull = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2, 12, 8), hullMat);
        engHull.rotation.x = Math.PI / 2;
        engHull.position.set(0, -2, 5);
        ally.add(engHull);

        // Neck connecting saucer to engineering hull
        const neck = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 3), hullMat);
        neck.position.set(0, -1, 1.5);
        ally.add(neck);

        // Nacelle pylons and nacelles
        for (let side = -1; side <= 1; side += 2) {
            const pylon = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 1.5), accentMat);
            pylon.position.set(side * 4, -2, 6);
            pylon.rotation.z = side * 0.2;
            ally.add(pylon);

            const nacelle = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 10, 8), accentMat);
            nacelle.rotation.x = Math.PI / 2;
            nacelle.position.set(side * 5.5, -4, 5);
            ally.add(nacelle);

            // Nacelle glow
            const glow = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 9, 8), nacelleGlow);
            glow.rotation.x = Math.PI / 2;
            glow.position.set(side * 5.5, -3.8, 5);
            ally.add(glow);

            // Bussard collector
            const bussard = new THREE.Mesh(new THREE.SphereGeometry(1.1, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff4400, transparent: true, opacity: 0.7 }));
            bussard.position.set(side * 5.5, -4, 0);
            ally.add(bussard);
        }

        // Deflector dish
        const deflector = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 8), deflectorMat);
        deflector.position.set(0, -2, -1);
        ally.add(deflector);

        ally.scale.set(0.4, 0.4, 0.4);

        // Ally stats - similar to player but slightly weaker
        ally.userData = {
            type: 'federation',
            name: name,
            health: 80,
            maxHealth: 80,
            shields: 80,
            maxShields: 80,
            fireRate: 1500,
            damage: 30,
            lastFire: 0,
            speed: 0.5,
            turnSpeed: 0.02,
            formationOffset: new THREE.Vector3(),
            engagingEnemy: null
        };

        // Blue shield mesh
        const shieldGeom = new THREE.SphereGeometry(15, 16, 16);
        const shieldMat = new THREE.MeshBasicMaterial({
            color: 0x4488ff,
            transparent: true,
            opacity: 0,
            side: THREE.DoubleSide
        });
        const shieldMesh = new THREE.Mesh(shieldGeom, shieldMat);
        ally.add(shieldMesh);
        ally.userData.shieldMesh = shieldMesh;

        return ally;
    }

    spawnAllies(count) {
        // Clear existing allies
        this.allies.forEach(a => this.scene.remove(a));
        this.allies = [];

        // V-formation offsets behind/beside the Enterprise
        const formationOffsets = [
            new THREE.Vector3(-30, 0, 30),   // Left wing
            new THREE.Vector3(30, 0, 30),     // Right wing
            new THREE.Vector3(-55, -5, 55),   // Far left
            new THREE.Vector3(55, -5, 55)     // Far right
        ];

        for (let i = 0; i < count && i < this.allyShipNames.length; i++) {
            const ally = this.createAlly(this.allyShipNames[i]);

            ally.userData.formationOffset = formationOffsets[i].clone();
            ally.position.copy(this.enterprise.position).add(formationOffsets[i]);
            ally.quaternion.copy(this.enterprise.quaternion);

            this.enableShadows(ally);
            this.allies.push(ally);
            this.scene.add(ally);
        }

        this.showCrewDialog('UHURA', 'Captain, the fleet is in formation and ready.');
    }

    updateAllies(deltaTime) {
        if (this.allies.length === 0) return;

        const now = Date.now();

        this.allies.forEach(ally => {
            // Find nearest enemy
            let nearestEnemy = null;
            let nearestDist = Infinity;
            this.enemies.forEach(enemy => {
                const dist = ally.position.distanceTo(enemy.position);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearestEnemy = enemy;
                }
            });

            // Movement AI
            if (nearestEnemy && nearestDist < 200) {
                // Break formation and engage enemy
                ally.userData.engagingEnemy = nearestEnemy;

                // Turn toward enemy
                const targetQuat = new THREE.Quaternion();
                const lookMatrix = new THREE.Matrix4().lookAt(ally.position, nearestEnemy.position, new THREE.Vector3(0, 1, 0));
                targetQuat.setFromRotationMatrix(lookMatrix);
                ally.quaternion.slerp(targetQuat, ally.userData.turnSpeed);

                if (nearestDist > 80) {
                    // Approach enemy
                    const moveDir = nearestEnemy.position.clone().sub(ally.position).normalize();
                    ally.position.add(moveDir.multiplyScalar(ally.userData.speed));
                } else {
                    // Circle-strafe at close range
                    const toEnemy = nearestEnemy.position.clone().sub(ally.position);
                    const perpendicular = new THREE.Vector3(-toEnemy.z, 0, toEnemy.x).normalize();
                    ally.position.add(perpendicular.multiplyScalar(ally.userData.speed * 0.4));
                }

                // Combat AI - fire phasers at enemies in range
                if (nearestDist < 350 && now - ally.userData.lastFire > ally.userData.fireRate) {
                    ally.userData.lastFire = now;
                    this.allyFire(ally, nearestEnemy);
                }
            } else {
                // Maintain formation with player
                ally.userData.engagingEnemy = null;

                // Apply player rotation to formation offset
                const rotatedOffset = ally.userData.formationOffset.clone().applyQuaternion(this.enterprise.quaternion);
                const desiredPos = this.enterprise.position.clone().add(rotatedOffset);
                const toDesired = desiredPos.clone().sub(ally.position);
                const desiredDist = toDesired.length();

                // Turn toward formation position
                if (desiredDist > 5) {
                    const targetQuat = new THREE.Quaternion();
                    const lookMatrix = new THREE.Matrix4().lookAt(ally.position, desiredPos, new THREE.Vector3(0, 1, 0));
                    targetQuat.setFromRotationMatrix(lookMatrix);
                    ally.quaternion.slerp(targetQuat, ally.userData.turnSpeed * 1.5);

                    const moveSpeed = Math.min(ally.userData.speed * 1.5, desiredDist * 0.05);
                    ally.position.add(toDesired.normalize().multiplyScalar(moveSpeed));
                } else {
                    // Match player rotation when in position
                    ally.quaternion.slerp(this.enterprise.quaternion, 0.05);
                }
            }

            // Regenerate ally shields slowly
            if (ally.userData.shields < ally.userData.maxShields) {
                ally.userData.shields += deltaTime * 0.003;
            }
        });
    }

    allyFire(ally, target) {
        // Create orange phaser beam (Federation but distinct from player)
        const start = ally.position.clone();
        const direction = target.position.clone().sub(start).normalize();
        const end = start.clone().add(direction.multiplyScalar(350));

        const geometry = new THREE.BufferGeometry().setFromPoints([start, end]);
        const material = new THREE.LineBasicMaterial({
            color: 0xff8844, transparent: true, opacity: 1
        });
        const beam = new THREE.Line(geometry, material);
        beam.userData = { life: 300, damage: ally.userData.damage, type: 'ally' };

        this.projectiles.push(beam);
        this.scene.add(beam);

        // Check immediate hit (phaser is instant like player phasers)
        this.enemies.forEach(enemy => {
            const dist = this.pointToLineDistance(enemy.position, start, end);
            if (dist < 15) {
                this.damageEnemy(enemy, ally.userData.damage);
            }
        });
    }

    damageAlly(ally, damage) {
        // Shields absorb damage first
        if (ally.userData.shields > 0) {
            const shieldDamage = Math.min(damage, ally.userData.shields);
            ally.userData.shields -= shieldDamage;
            damage -= shieldDamage;

            // Shield hit effect
            if (ally.userData.shieldMesh) {
                ally.userData.shieldMesh.material.opacity = 0.5;
                setTimeout(() => {
                    if (ally.userData.shieldMesh) {
                        ally.userData.shieldMesh.material.opacity = 0;
                    }
                }, 150);
            }
        }

        // Remaining damage hits hull
        if (damage > 0) {
            ally.userData.health -= damage;

            // Flash red
            ally.traverse(child => {
                if (child.isMesh && child.material.color && child !== ally.userData.shieldMesh) {
                    const originalColor = child.material.color.getHex();
                    child.material.color.setHex(0xff0000);
                    setTimeout(() => child.material.color.setHex(originalColor), 100);
                }
            });
        }

        if (ally.userData.health <= 0) {
            this.destroyAlly(ally);
        }
    }

    destroyAlly(ally) {
        this.createExplosion(ally.position.clone());
        this.playExplosionSound();

        const index = this.allies.indexOf(ally);
        if (index > -1) {
            this.allies.splice(index, 1);
            this.scene.remove(ally);
        }

        this.showCrewDialog('UHURA', `We've lost a ship! ${ally.userData.name} is gone!`);
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

            // Get proper ship names for all enemy types
            const enemyNames = {
                'klingon': 'Klingon Bird of Prey',
                'romulan': 'Romulan Warbird',
                'borg': 'Borg Cube',
                'gorn': 'Gorn Raider',
                'cardassian': 'Cardassian Galor-class'
            };
            const enemyName = enemyNames[enemy.userData.type] || 'Unknown Vessel';

            const bearing = Math.floor(Math.random() * 360);
            const mark = Math.floor(Math.random() * 90);

            // Different crew members announce different enemy types
            let crewMember = 'SULU';
            let messages;

            if (enemy.userData.type === 'borg') {
                crewMember = 'SPOCK';
                messages = [
                    `${enemyName} detected! Their shields are adaptive, Captain.`,
                    `${enemyName} bearing ${bearing} mark ${mark}. Recommend maximum firepower.`,
                    `Borg vessel approaching. They will attempt to adapt to our weapons.`,
                    `${enemyName} on intercept course. Resistance may prove... difficult.`
                ];
            } else if (enemy.userData.type === 'gorn') {
                messages = [
                    `${enemyName} bearing ${bearing} mark ${mark}! Fast attack craft!`,
                    `${enemyName} inbound, ${Math.floor(distance)} meters! They're quick, Captain!`,
                    `Hostile ${enemyName} detected! Small but maneuverable!`,
                    `${enemyName} closing fast! They're trying to flank us!`
                ];
            } else if (enemy.userData.type === 'cardassian') {
                messages = [
                    `${enemyName} bearing ${bearing} mark ${mark}! Heavy warship!`,
                    `${enemyName} on attack vector! Strong shields detected!`,
                    `Cardassian warship closing, ${Math.floor(distance)} meters! They're heavily armed!`,
                    `${enemyName} approaching! Recommend evasive maneuvers!`
                ];
            } else {
                messages = [
                    `${enemyName} bearing ${bearing} mark ${mark}!`,
                    `${enemyName} on attack vector, ${Math.floor(distance)} meters!`,
                    `Hostile ${enemyName} detected, shields are up!`,
                    `${enemyName} closing to weapons range!`
                ];
            }

            this.showCrewDialog(crewMember, messages[Math.floor(Math.random() * messages.length)]);
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
            this.stats.hull = Math.min(this.stats.maxHull, this.stats.hull + 0.1);
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

        // Clear allies
        this.allies.forEach(a => this.scene.remove(a));
        this.allies = [];

        // Hide title, show game UI
        document.getElementById('titleScreen').classList.remove('active');
        document.getElementById('gameUI').style.display = 'block';

        this.spawnWave();

        // Spawn allies if mission has them
        if (mission.allies) {
            this.spawnAllies(mission.allies);
        }

        this.startCombatMusic();
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
        this.allies.forEach(a => this.scene.remove(a));
        this.allies = [];
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

        // Left click - hold to continuously fire phasers
        window.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
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
            if (this.bloomEnabled) this.composer.setSize(window.innerWidth, window.innerHeight);
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

        // Draw allies as blue dots
        this.allies.forEach(ally => {
            const dx = (ally.position.x - this.enterprise.position.x) * scale;
            const dz = (ally.position.z - this.enterprise.position.z) * scale;
            const dist = Math.sqrt(dx * dx + dz * dz);

            if (dist < size / 2 - 10) {
                ctx.beginPath();
                ctx.arc(size / 2 + dx, size / 2 + dz, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#4488ff';
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

    getMouseAimPoint() {
        // Raycast from camera through mouse position to get a 3D aim point
        this.raycaster.setFromCamera(new THREE.Vector2(this.mouse.x, this.mouse.y), this.camera);
        const aimPoint = this.raycaster.ray.origin.clone().add(
            this.raycaster.ray.direction.clone().multiplyScalar(500)
        );
        return aimPoint;
    }

    firePhaser() {
        if (!this.gameStarted || this.phaserCooldown > 0 || this.stats.phaserCharge < 10) return;

        this.phaserCooldown = 200;
        this.stats.phaserCharge -= 10;
        this.playPhaserSound();

        const start = this.enterprise.position.clone();
        const aimPoint = this.getMouseAimPoint();
        const direction = aimPoint.clone().sub(start).normalize();
        const end = start.clone().add(direction.multiplyScalar(500));

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

        const aimPoint = this.getMouseAimPoint();
        const direction = aimPoint.clone().sub(this.enterprise.position).normalize();

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
        // Explosion flash light + bloom sphere
        this.createExplosionFlash(position);

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
            this.triggerScreenShake(0.5, 200);

            // Check shield status for crew dialog
            this.checkShieldStatus();
        }

        // Hull damage when shields are down or depleted - cap damage per hit
        if (amount > 0) {
            const maxHullDamagePerHit = this.stats.maxHull * 0.04;
            amount = Math.min(amount, maxHullDamagePerHit);
            this.stats.hull -= amount;
            this.playHullDamageSound();
            this.triggerScreenShake(1.5, 400);

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
        this.stopCombatMusic();

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

        const mission = this.currentMission ? this.missions[this.currentMission] : null;
        const allyLine = (mission && mission.allies)
            ? `<br>Fleet Surviving: ${this.allies.length}/${mission.allies}`
            : '';

        stats.innerHTML = `
            Waves Completed: ${this.wave - 1}<br>
            Enemies Destroyed: ${this.enemiesKilled}<br>
            Credits Earned: ${this.stats.credits}${allyLine}
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

        // Continuous phaser fire while holding left mouse button
        if (this.mouse.down && this.gameStarted) {
            this.firePhaser();
        }

        // Arrow key + WASD flight controls

        // Autopilot - automatically fly towards nearest enemy
        if (this.autopilotEnabled && this.targetLocked && this.gameStarted) {
            const toTarget = this.targetLocked.position.clone().sub(this.enterprise.position).normalize();
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.enterprise.quaternion);

            const cross = new THREE.Vector3().crossVectors(forward, toTarget);
            const apEuler = new THREE.Euler().setFromQuaternion(this.enterprise.quaternion, 'YXZ');
            apEuler.y += cross.y * 0.025;
            apEuler.x -= cross.x * 0.015;
            apEuler.x = Math.max(-0.4, Math.min(0.4, apEuler.x));
            apEuler.z = 0;
            this.enterprise.quaternion.setFromEuler(apEuler);

            this.stats.speed = Math.min(this.stats.speed + 0.01, this.stats.maxSpeed * 0.7);
        }

        const turnSpeed = this.stats.turnSpeed * deltaTime * 0.12;

        // Mouse yaw - War Thunder style: ship turns left/right toward mouse
        const mouseX = this.mouse.x; // -1 (left) to 1 (right)
        const yawRate = -mouseX * 0.045;

        // Apply yaw around world Y axis (keeps ship level)
        const yawQuat = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yawRate);
        this.enterprise.quaternion.premultiply(yawQuat);

        // Mouse pitch - War Thunder style: ship pitches toward mouse vertical
        const mouseY = this.mouse.y; // -1 (bottom) to 1 (top)
        const pitchRate = mouseY * 0.045;
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.enterprise.quaternion);
        const pitchQuat = new THREE.Quaternion().setFromAxisAngle(right, pitchRate);
        this.enterprise.quaternion.premultiply(pitchQuat);

        // Force ship to stay level: extract yaw and pitch, zero out roll
        const euler = new THREE.Euler().setFromQuaternion(this.enterprise.quaternion, 'YXZ');
        euler.z = 0; // kill all roll
        this.enterprise.quaternion.setFromEuler(euler);

        // Throttle - E / W / Up Arrow = speed up, Q / S / Down Arrow = slow down
        if (this.keys['e'] || this.keys['w'] || this.keys['arrowup']) {
            this.stats.speed = Math.min(this.stats.speed + 0.05, this.stats.maxSpeed);
        } else if (this.keys['q'] || this.keys['s'] || this.keys['arrowdown']) {
            this.stats.speed = Math.max(this.stats.speed - 0.05, 0);
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

        // Sun follows player so shadows stay relevant
        this.sunLight.position.copy(this.enterprise.position).add(new THREE.Vector3(100, 80, 100));
        this.sunLight.target.position.copy(this.enterprise.position);

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
            if (distance < 500 && now - enemy.userData.lastFire > enemy.userData.fireRate) {
                enemy.userData.lastFire = now;
                this.enemyFire(enemy);
            }
        });

        // Update allies
        this.updateAllies(deltaTime);

        // Update projectiles
        this.projectiles = this.projectiles.filter(proj => {
            proj.userData.life -= deltaTime;

            if (proj.userData.type === 'torpedo') {
                // Strong homing towards locked target
                if (proj.userData.target && this.enemies.includes(proj.userData.target)) {
                    const toTarget = proj.userData.target.position.clone().sub(proj.position).normalize();
                    proj.userData.velocity.lerp(toTarget.multiplyScalar(5), 0.12);
                }
                proj.position.add(proj.userData.velocity);
                // Orient torpedo to face direction of travel
                proj.lookAt(proj.position.clone().add(proj.userData.velocity));

                this.enemies.forEach(enemy => {
                    if (proj.position.distanceTo(enemy.position) < 10) {
                        this.damageEnemy(enemy, proj.userData.damage);
                        this.createExplosion(proj.position.clone());
                        proj.userData.life = 0;
                    }
                });
            } else if (proj.userData.type === 'phaser') {
                proj.material.opacity -= deltaTime * 0.003;
            } else if (proj.userData.type === 'ally') {
                // Ally phaser beams fade out like player phasers
                proj.material.opacity -= deltaTime * 0.003;
            } else if (proj.userData.type === 'enemy') {
                proj.position.add(proj.userData.velocity);

                // Check hit on player
                if (proj.position.distanceTo(this.enterprise.position) < 15) {
                    this.damagePlayer(proj.userData.damage);
                    proj.userData.life = 0;
                }

                // Check hit on allies
                for (let i = this.allies.length - 1; i >= 0; i--) {
                    const ally = this.allies[i];
                    if (proj.position.distanceTo(ally.position) < 12) {
                        this.damageAlly(ally, proj.userData.damage);
                        proj.userData.life = 0;
                        break;
                    }
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

            // Extract yaw and pitch from ship quaternion
            const shipEuler = new THREE.Euler().setFromQuaternion(this.enterprise.quaternion, 'YXZ');

            // Camera follow - smoothly follow ship's heading from behind
            if (this.cameraFollowShip) {
                const targetYaw = shipEuler.y;
                let diff = targetYaw - this.cameraTargetRotation.y;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.cameraTargetRotation.y += diff * 0.04;
                this.cameraRotation.y += (this.cameraTargetRotation.y - this.cameraRotation.y) * 0.1;

                const targetPitch = 0.3 - shipEuler.x * 0.3;
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
        this.drawEnemyIndicators();
    }

    drawEnemyIndicators() {
        if (!this.indicatorCanvas) {
            this.indicatorCanvas = document.createElement('canvas');
            this.indicatorCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
            document.body.appendChild(this.indicatorCanvas);
            this.indicatorCtx = this.indicatorCanvas.getContext('2d');
        }

        const canvas = this.indicatorCanvas;
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const ctx = this.indicatorCtx;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (!this.gameStarted || this.isPaused) return;
        if (this.enemies.length === 0 && this.allies.length === 0) return;

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const margin = 50;

        const drawIndicatorArrow = (entity, color, label) => {
            const pos = entity.position.clone();
            pos.project(this.camera);

            const screenX = (pos.x * 0.5 + 0.5) * canvas.width;
            const screenY = (-pos.y * 0.5 + 0.5) * canvas.height;

            const isOffScreen = screenX < 0 || screenX > canvas.width ||
                                screenY < 0 || screenY > canvas.height || pos.z > 1;

            if (!isOffScreen) return;

            const dx = screenX - centerX;
            const dy = screenY - centerY;
            let angle = Math.atan2(dy, dx);

            if (pos.z > 1) {
                angle = Math.atan2(-dy, -dx);
            }

            const edgeX = Math.cos(angle);
            const edgeY = Math.sin(angle);

            const maxExtentX = (canvas.width / 2) - margin;
            const maxExtentY = (canvas.height / 2) - margin;
            const scale = Math.min(
                Math.abs(maxExtentX / (edgeX || 0.001)),
                Math.abs(maxExtentY / (edgeY || 0.001))
            );

            const arrowX = centerX + edgeX * scale;
            const arrowY = centerY + edgeY * scale;

            const dist = this.enterprise.position.distanceTo(entity.position);
            const alpha = Math.max(0.4, Math.min(1.0, 1.0 - (dist - 100) / 500));

            ctx.save();
            ctx.translate(arrowX, arrowY);
            ctx.rotate(angle);
            ctx.globalAlpha = alpha;

            ctx.beginPath();
            ctx.moveTo(18, 0);
            ctx.lineTo(-8, -10);
            ctx.lineTo(-4, 0);
            ctx.lineTo(-8, 10);
            ctx.closePath();

            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255,255,255,0.6)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.rotate(-angle);
            ctx.font = 'bold 10px monospace';
            ctx.fillStyle = color;
            ctx.textAlign = 'center';
            ctx.fillText(label, 0, -16);

            ctx.restore();
        };

        // Draw enemy indicators
        const enemyColors = {
            klingon: '#ff4444',
            romulan: '#44ff88',
            borg: '#88ff88',
            gorn: '#ffff44',
            cardassian: '#ffaa44'
        };

        this.enemies.forEach(enemy => {
            const color = enemyColors[enemy.userData.type] || '#ff4444';
            const dist = this.enterprise.position.distanceTo(enemy.position);
            drawIndicatorArrow(enemy, color, Math.round(dist) + 'm');
        });

        // Draw ally indicators (blue)
        this.allies.forEach(ally => {
            const dist = this.enterprise.position.distanceTo(ally.position);
            drawIndicatorArrow(ally, '#4488ff', Math.round(dist) + 'm');
        });
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

    // ============================================
    // VISUAL EFFECTS
    // ============================================

    enableShadows(group) {
        group.traverse(child => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    triggerScreenShake(intensity, duration) {
        if (intensity > this.screenShake.intensity) {
            this.screenShake.intensity = intensity;
            this.screenShake.duration = duration;
            this.screenShake.elapsed = 0;
            this.screenShake.active = true;
        }
    }

    updateScreenShake(deltaTime) {
        if (!this.screenShake.active) return;

        this.screenShake.elapsed += deltaTime;
        if (this.screenShake.elapsed >= this.screenShake.duration) {
            this.screenShake.active = false;
            return;
        }

        const progress = this.screenShake.elapsed / this.screenShake.duration;
        const decay = 1 - progress * progress; // quadratic decay
        const shake = this.screenShake.intensity * decay;

        this.camera.position.x += (Math.random() - 0.5) * shake;
        this.camera.position.y += (Math.random() - 0.5) * shake;
        this.camera.position.z += (Math.random() - 0.5) * shake * 0.5;
    }

    createExplosionFlash(position) {
        // PointLight flash
        const light = new THREE.PointLight(0xffaa44, 8, 200);
        light.position.copy(position);
        this.scene.add(light);

        // Bright bloom sphere
        const flashGeom = new THREE.SphereGeometry(3, 12, 12);
        const flashMat = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1
        });
        const flash = new THREE.Mesh(flashGeom, flashMat);
        flash.position.copy(position);
        this.scene.add(flash);

        const flashData = { light, flash, elapsed: 0, duration: 400 };
        this.explosionFlashes.push(flashData);

        // Trigger screen shake if near player
        const dist = this.enterprise.position.distanceTo(position);
        if (dist < 200) {
            const shakeIntensity = Math.max(0.5, 3 * (1 - dist / 200));
            this.triggerScreenShake(shakeIntensity, 300);
        }
    }

    updateExplosionFlashes(deltaTime) {
        this.explosionFlashes = this.explosionFlashes.filter(f => {
            f.elapsed += deltaTime;
            const progress = f.elapsed / f.duration;

            if (progress >= 1) {
                this.scene.remove(f.light);
                this.scene.remove(f.flash);
                f.flash.geometry.dispose();
                f.flash.material.dispose();
                return false;
            }

            // Light fades out
            f.light.intensity = 8 * (1 - progress);
            // Sphere expands and fades
            const scale = 1 + progress * 4;
            f.flash.scale.set(scale, scale, scale);
            f.flash.material.opacity = 1 - progress;

            return true;
        });
    }

    createWarpLines() {
        this.warpLineGroup = new THREE.Group();
        const lineCount = 200;

        for (let i = 0; i < lineCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 80;
            const y = (Math.random() - 0.5) * 60;

            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;

            const points = [
                new THREE.Vector3(x, y, z),
                new THREE.Vector3(x, y, z + 0.1) // starts as a dot
            ];

            const geom = new THREE.BufferGeometry().setFromPoints(points);
            const mat = new THREE.LineBasicMaterial({
                color: 0xaaccff,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending
            });

            const line = new THREE.Line(geom, mat);
            line.userData = {
                baseX: x, baseY: y, baseZ: z,
                angle, radius
            };
            this.warpLineGroup.add(line);
        }

        this.scene.add(this.warpLineGroup);
        this.warpLines = this.warpLineGroup;
    }

    updateWarpLines(deltaTime) {
        if (!this.warpLines) return;

        const warpActive = this.stats.warpSpeed > 0;
        const targetOpacity = warpActive ? 0.7 : 0;

        // Smooth transition
        this.warpLinesOpacity += (targetOpacity - this.warpLinesOpacity) * 0.05;

        // Fade starfield during warp
        if (this.starfield && this.starfield.material) {
            const starTarget = warpActive ? 0.3 : 0.9;
            this.starfield.material.opacity += (starTarget - this.starfield.material.opacity) * 0.05;
        }

        // Position warp lines around player
        this.warpLines.position.copy(this.enterprise.position);
        this.warpLines.quaternion.copy(this.enterprise.quaternion);

        const warpFactor = Math.min(this.stats.warpSpeed / this.stats.maxWarp, 1);
        const streakLength = warpFactor * 40;

        this.warpLines.children.forEach(line => {
            const d = line.userData;
            const positions = line.geometry.attributes.position.array;

            // Start point stays at base
            positions[0] = d.baseX;
            positions[1] = d.baseY;
            positions[2] = d.baseZ;

            // End point stretches backward (positive Z = behind ship)
            positions[3] = d.baseX;
            positions[4] = d.baseY;
            positions[5] = d.baseZ + streakLength;

            line.geometry.attributes.position.needsUpdate = true;
            line.material.opacity = this.warpLinesOpacity;
        });
    }

    updateEngineTrails(deltaTime) {
        const totalSpeed = this.stats.speed + this.stats.warpSpeed * 5;
        const warpActive = this.stats.warpSpeed > 0;

        // Emit particles from nacelle rear ends
        if (totalSpeed > 0.1 && this.enterprise) {
            // Nacelle positions in local space (rear ends)
            // Nacelles are at x=+/-14, y=8, z=18 in local, plus nacelleLength/2 = 22 for rear
            const nacelleRearPositions = [
                new THREE.Vector3(-14 * 0.32, 8 * 0.32, 40 * 0.32),  // port nacelle rear
                new THREE.Vector3(14 * 0.32, 8 * 0.32, 40 * 0.32)    // starboard nacelle rear
            ];

            const emitChance = Math.min(totalSpeed / 2, 1);
            if (Math.random() < emitChance) {
                nacelleRearPositions.forEach(localPos => {
                    const worldPos = localPos.clone().applyMatrix4(this.enterprise.matrixWorld);

                    const geom = new THREE.SphereGeometry(0.3 + Math.random() * 0.2, 4, 4);
                    const color = warpActive ? 0x66bbff : 0x4488ff;
                    const mat = new THREE.MeshBasicMaterial({
                        color: color,
                        transparent: true,
                        opacity: 0.8
                    });
                    const particle = new THREE.Mesh(geom, mat);
                    particle.position.copy(worldPos);

                    // Slight random spread
                    particle.position.x += (Math.random() - 0.5) * 0.3;
                    particle.position.y += (Math.random() - 0.5) * 0.3;

                    particle.userData = {
                        life: 300,
                        maxLife: 300,
                        type: 'engineTrail'
                    };

                    this.engineTrails.push(particle);
                    this.scene.add(particle);
                });
            }
        }

        // Update existing trail particles
        this.engineTrails = this.engineTrails.filter(p => {
            p.userData.life -= deltaTime;

            if (p.userData.life <= 0) {
                this.scene.remove(p);
                p.geometry.dispose();
                p.material.dispose();
                return false;
            }

            const lifeRatio = p.userData.life / p.userData.maxLife;
            p.material.opacity = lifeRatio * 0.8;
            const scale = lifeRatio;
            p.scale.set(scale, scale, scale);

            return true;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const now = performance.now();
        const deltaTime = now - this.lastTime;
        this.lastTime = now;

        this.update(deltaTime);

        // Update visual effects
        this.updateScreenShake(deltaTime);
        this.updateExplosionFlashes(deltaTime);
        this.updateEngineTrails(deltaTime);
        this.updateWarpLines(deltaTime);

        if (this.bloomEnabled) {
            this.composer.render();
        } else {
            this.renderer.render(this.scene, this.camera);
        }
    }
}

// Initialize game
const game = new StarTrekGame();
