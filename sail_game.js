(function () {
    'use strict';

    var THREE_URL = 'https://unpkg.com/three@0.165.0/build/three.module.js';
    var canvas = document.getElementById('sail-canvas');

    if (!canvas) {
        return;
    }

    var hud = {
        hp: document.querySelector('[data-hud="hp"]'),
        sail: document.querySelector('[data-hud="sail"]'),
        wind: document.querySelector('[data-hud="wind"]'),
        cargo: document.querySelector('[data-hud="cargo"]'),
        gold: document.querySelector('[data-hud="gold"]'),
        enemies: document.querySelector('[data-hud="enemies"]'),
        reload: document.querySelector('[data-hud="reload"]'),
        dock: document.querySelector('[data-hud="dock"]'),
        upgrade: document.querySelector('[data-hud="upgrade"]'),
        message: document.querySelector('[data-sail-message]'),
        pauseCard: document.querySelector('[data-sail-pause-card]'),
        pauseButton: document.querySelector('[data-sail-pause]'),
        resetButton: document.querySelector('[data-sail-reset]'),
        loading: document.querySelector('[data-sail-loading]'),
        minimap: document.querySelector('[data-sail-minimap]')
    };

    var DEBUG_ENABLED = new URLSearchParams(window.location.search).get('debug') === '1';
    var TAU = Math.PI * 2;
    var FIXED_DT = 1 / 60;
    var SEA_LIMIT = 1750;
    var GRAVITY = 160;
    var PROJECTILE_MAX_LIFE = 3.2;
    var BROADSIDE_HALF_ARC = 0.82;
    var AIM_DOT_COUNT = 30;
    var AIM_MAX_FLIGHT_TIME = 3.0;
    var AIM_MAX_RANGE = 720;
    var WAKE_POINT_COUNT = 34;
    var WAKE_LIFE = 3.2;
    var PLAYER_RADIUS = 24;
    var ENEMY_RADIUS = 23;
    var ISLAND_DOCK_RADIUS = 118;
    var THREE = null;
    var renderer = null;
    var scene = null;
    var camera = null;
    var raycaster = null;
    var groundPlane = null;
    var worldGroup = null;
    var waterMesh = null;
    var waterPositions = null;
    var waterBasePositions = null;
    var aimDots = null;
    var aimDotMatrix = null;
    var aimMarker = null;
    var windArrow = null;
    var minimapContext = null;
    var clockStarted = false;
    var lastFrameTime = 0;
    var accumulator = 0;

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function wrapAngle(angle) {
        while (angle > Math.PI) {
            angle -= TAU;
        }
        while (angle < -Math.PI) {
            angle += TAU;
        }
        return angle;
    }

    function length2(x, z) {
        return Math.sqrt(x * x + z * z);
    }

    function dist2(a, b) {
        var dx = a.x - b.x;
        var dz = a.z - b.z;
        return Math.sqrt(dx * dx + dz * dz);
    }

    function pad(value, count) {
        return String(Math.max(0, Math.floor(value))).padStart(count, '0');
    }

    function makeRng(seed) {
        var value = seed >>> 0;
        return function () {
            value += 0x6D2B79F5;
            var t = value;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    function seedFromUrl() {
        var params = new URLSearchParams(window.location.search);
        var raw = params.get('seed') || '42';
        var numeric = Number(raw);

        if (Number.isFinite(numeric)) {
            return numeric >>> 0;
        }

        var hash = 2166136261;
        for (var i = 0; i < raw.length; i += 1) {
            hash ^= raw.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return hash >>> 0;
    }

    function randRange(rng, min, max) {
        return min + (max - min) * rng();
    }

    function angleName(angle) {
        var names = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
        var normalized = (angle % TAU + TAU) % TAU;
        var index = Math.round(normalized / (TAU / 8)) % 8;
        return names[index];
    }

    function forwardX(heading) {
        return Math.sin(heading);
    }

    function forwardZ(heading) {
        return Math.cos(heading);
    }

    function makeShip(x, z, heading, isPlayer) {
        return {
            x: x,
            z: z,
            y: 0,
            vx: 0,
            vz: 0,
            heading: heading,
            sail: isPlayer ? 0.55 : 0.78,
            sailAngle: 0,
            hp: isPlayer ? 100 : 78,
            maxHp: isPlayer ? 100 : 78,
            cargo: 0,
            cargoValue: 0,
            cargoCapacity: isPlayer ? 6 : 2,
            gold: 0,
            kills: 0,
            hitFlash: 0,
            sinkTimer: 0,
            fireCooldown: 0,
            fireHintCooldown: 0,
            wakeTimer: 0,
            wakePoints: [],
            wakeLine: null,
            healthBar: null,
            aiTimer: 0,
            aiState: 'patrol',
            targetX: x,
            targetZ: z,
            patrolIndex: 0,
            isPlayer: isPlayer,
            mesh: null,
            debugRing: null,
            damage: isPlayer ? 35 : 18,
            cannonCooldownMul: 1,
            sailPowerMul: 1
        };
    }

    function makeInitialState() {
        var seed = seedFromUrl();
        var rng = makeRng(seed);
        var islands = [];
        var enemies = [];
        var i;
        var angle;
        var radius;

        islands.push({
            x: -110,
            z: -80,
            r: 86,
            dock: true,
            name: 'Harbor',
            mesh: null,
            debugRing: null
        });

        for (i = 0; i < 6; i += 1) {
            angle = randRange(rng, 0, TAU);
            radius = randRange(rng, 430, 1200);
            islands.push({
                x: Math.sin(angle) * radius,
                z: Math.cos(angle) * radius,
                r: randRange(rng, 48, 95),
                dock: i % 2 === 0,
                name: 'Island ' + (i + 1),
                mesh: null,
                debugRing: null
            });
        }

        for (i = 0; i < 5; i += 1) {
            angle = randRange(rng, 0, TAU);
            radius = randRange(rng, 520, 1300);
            enemies.push(makeShip(Math.sin(angle) * radius, Math.cos(angle) * radius, randRange(rng, 0, TAU), false));
        }

        return {
            seed: seed,
            rng: rng,
            time: 0,
            paused: false,
            gameOver: false,
            routeClear: false,
            docked: false,
            dockTimer: 0,
            sellCooldown: 0,
            player: makeShip(-250, -190, 0.35, true),
            enemies: enemies,
            islands: islands,
            crates: [],
            projectiles: [],
            splashes: [],
            windAngle: randRange(rng, 0, TAU),
            windTargetAngle: randRange(rng, 0, TAU),
            windSpeed: randRange(rng, 0.78, 1.08),
            windTimer: 5,
            cameraTargetX: 0,
            cameraTargetZ: 0,
            cameraOrbit: Math.PI * 0.25,
            mouseNdcX: 0,
            mouseNdcY: 0,
            mouseWorldX: 0,
            mouseWorldZ: 0,
            mouseInside: false,
            messageText: 'W/S sail. A/D rudder. Q/E camera. Mouse aim. LMB or Space broadside fire.',
            messageTimer: 0,
            input: {
                sailUp: false,
                sailDown: false,
                left: false,
                right: false,
                camLeft: false,
                camRight: false,
                fire: false
            }
        };
    }

    var state = makeInitialState();

    function setMessage(text, seconds) {
        state.messageText = text;
        state.messageTimer = seconds || 3;
        if (hud.message) {
            hud.message.textContent = text;
        }
    }

    function makeMaterial(color, roughness, metalness) {
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: roughness,
            metalness: metalness,
            flatShading: true
        });
    }

    var materials = null;

    function initMaterials() {
        materials = {
            water: new THREE.MeshStandardMaterial({
                color: 0x174b6e,
                roughness: 0.82,
                metalness: 0.03,
                flatShading: true
            }),
            hullPlayer: makeMaterial(0x7a4a2e, 0.86, 0.02),
            hullEnemy: makeMaterial(0x5a2530, 0.88, 0.02),
            deck: makeMaterial(0xc58b52, 0.78, 0.02),
            mast: makeMaterial(0x3a2418, 0.82, 0.02),
            sailPlayer: makeMaterial(0xf1ead8, 0.70, 0.0),
            sailEnemy: makeMaterial(0xd8b9a8, 0.78, 0.0),
            cannon: makeMaterial(0x191b1f, 0.55, 0.18),
            cannonball: makeMaterial(0x101113, 0.48, 0.42),
            sand: makeMaterial(0xb58d4d, 0.90, 0.0),
            grass: makeMaterial(0x4e8c50, 0.92, 0.0),
            palm: makeMaterial(0x5d3c21, 0.90, 0.0),
            leaf: makeMaterial(0x2f7f54, 0.92, 0.0),
            crate: makeMaterial(0xb57231, 0.88, 0.0),
            dock: makeMaterial(0x6b472a, 0.88, 0.0),
            debugGreen: new THREE.MeshBasicMaterial({ color: 0x32d1a0, wireframe: true, transparent: true, opacity: 0.45 }),
            debugRed: new THREE.MeshBasicMaterial({ color: 0xff6c5f, wireframe: true, transparent: true, opacity: 0.40 }),
            wind: new THREE.LineBasicMaterial({ color: 0x63a6ff, transparent: true, opacity: 0.44 }),
            wake: new THREE.LineBasicMaterial({ color: 0xd8f5ff, transparent: true, opacity: 0.38 }),
            hpBack: new THREE.MeshBasicMaterial({ color: 0x120e12, transparent: true, opacity: 0.82 }),
            hpFill: new THREE.MeshBasicMaterial({ color: 0x32d1a0, transparent: true, opacity: 0.92 }),
            aimGood: new THREE.MeshBasicMaterial({ color: 0x32d1a0, transparent: true, opacity: 0.88 }),
            aimBad: new THREE.MeshBasicMaterial({ color: 0xff6c5f, transparent: true, opacity: 0.84 }),
            aimMarkerGood: new THREE.MeshBasicMaterial({ color: 0x32d1a0, wireframe: true, transparent: true, opacity: 0.58 }),
            aimMarkerBad: new THREE.MeshBasicMaterial({ color: 0xff6c5f, wireframe: true, transparent: true, opacity: 0.58 })
        };

        materials.hullPlayer.side = THREE.DoubleSide;
        materials.hullEnemy.side = THREE.DoubleSide;
        materials.sailPlayer.side = THREE.DoubleSide;
        materials.sailEnemy.side = THREE.DoubleSide;
    }

    function createWater() {
        var geometry = new THREE.PlaneGeometry(4200, 4200, 72, 72);
        var mesh = new THREE.Mesh(geometry, materials.water);
        mesh.rotation.x = -Math.PI * 0.5;
        mesh.position.y = -2;
        mesh.receiveShadow = false;
        waterPositions = geometry.attributes.position;
        waterBasePositions = new Float32Array(waterPositions.array.length);
        waterBasePositions.set(waterPositions.array);
        scene.add(mesh);
        waterMesh = mesh;
    }

    function updateWater(time) {
        if (!waterPositions || !waterBasePositions) {
            return;
        }

        var arr = waterPositions.array;
        var base = waterBasePositions;
        var i;
        var x;
        var y;
        var wave;

        for (i = 0; i < arr.length; i += 3) {
            x = base[i];
            y = base[i + 1];
            wave = Math.sin(x * 0.010 + time * 1.25) * 3.0;
            wave += Math.cos(y * 0.012 - time * 1.05) * 2.2;
            wave += Math.sin((x + y) * 0.006 + time * 0.85) * 1.4;
            arr[i + 2] = wave;
        }

        waterPositions.needsUpdate = true;
        waterMesh.geometry.computeVertexNormals();
    }

    function createHullGeometry() {
        var geometry = new THREE.BufferGeometry();
        var vertices = [
            -15, 14, -34,
            15, 14, -34,
            -16, 14, 8,
            16, 14, 8,
            0, 14, 44,
            -13, 5, -34,
            13, 5, -34,
            -15, 4, 8,
            15, 4, 8,
            0, 5, 40,
            0, -2, -28,
            0, -3, 8,
            0, 1, 37
        ];
        var indices = [
            0, 2, 3, 0, 3, 1,
            2, 4, 3,
            0, 5, 7, 0, 7, 2,
            2, 7, 9, 2, 9, 4,
            1, 3, 8, 1, 8, 6,
            3, 4, 9, 3, 9, 8,
            0, 1, 6, 0, 6, 5,
            5, 10, 11, 5, 11, 7,
            7, 11, 12, 7, 12, 9,
            6, 8, 11, 6, 11, 10,
            8, 9, 12, 8, 12, 11,
            4, 12, 9,
            4, 3, 12,
            4, 12, 2
        ];

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        return geometry;
    }

    function createShipMesh(isPlayer) {
        var group = new THREE.Group();
        var hullMat = isPlayer ? materials.hullPlayer : materials.hullEnemy;
        var sailMat = isPlayer ? materials.sailPlayer : materials.sailEnemy;
        var hull = new THREE.Mesh(createHullGeometry(), hullMat);
        var deck = new THREE.Mesh(new THREE.BoxGeometry(21, 4, 34), materials.deck);
        var sternBlock = new THREE.Mesh(new THREE.BoxGeometry(24, 8, 12), hullMat);
        var mast = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 58, 8), materials.mast);
        var sailPivot = new THREE.Group();
        var boom = new THREE.Mesh(new THREE.BoxGeometry(33, 2.2, 2.2), materials.mast);
        var sail = new THREE.Mesh(new THREE.BoxGeometry(30, 36, 1.1, 1, 4, 1), sailMat);
        var cannonL = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 5), materials.cannon);
        var cannonR = new THREE.Mesh(new THREE.BoxGeometry(18, 4, 5), materials.cannon);

        hull.position.y = 6;
        deck.position.set(0, 20, -6);
        sternBlock.position.set(0, 13, -35);
        mast.position.set(0, 42, 0);
        sailPivot.position.set(0, 43, 1);
        boom.position.set(0, -5, 0);
        sail.position.set(0, 8, 0.35);
        sail.userData.isSail = true;
        cannonL.position.set(-17, 19, 2);
        cannonR.position.set(17, 19, 2);

        sailPivot.add(boom);
        sailPivot.add(sail);
        group.add(hull);
        group.add(deck);
        group.add(sternBlock);
        group.add(mast);
        group.add(sailPivot);
        group.add(cannonL);
        group.add(cannonR);
        group.userData.sailMesh = sail;
        group.userData.sailPivot = sailPivot;
        group.userData.boomMesh = boom;
        group.userData.hullMesh = hull;
        group.scale.setScalar(isPlayer ? 1.0 : 0.95);
        return group;
    }

    function createIslandMesh(island, rng) {
        var group = new THREE.Group();
        var base = new THREE.Mesh(new THREE.CylinderGeometry(island.r, island.r * 1.12, 18, 13), materials.sand);
        var grass = new THREE.Mesh(new THREE.CylinderGeometry(island.r * 0.72, island.r * 0.84, 8, 11), materials.grass);
        var palmCount = island.dock ? 4 : 2;
        var i;

        base.position.y = 3;
        grass.position.y = 16;
        group.add(base);
        group.add(grass);

        for (i = 0; i < palmCount; i += 1) {
            group.add(createPalm(randRange(rng, -island.r * 0.42, island.r * 0.42), randRange(rng, -island.r * 0.42, island.r * 0.42), rng));
        }

        if (island.dock) {
            var dock = new THREE.Mesh(new THREE.BoxGeometry(24, 7, 95), materials.dock);
            dock.position.set(0, 8, island.r + 34);
            group.add(dock);
        }

        group.position.set(island.x, 0, island.z);
        island.mesh = group;
        worldGroup.add(group);

        if (DEBUG_ENABLED) {
            island.debugRing = createDebugRing(island.dock ? ISLAND_DOCK_RADIUS : island.r, materials.debugGreen);
            island.debugRing.position.set(island.x, 1, island.z);
            worldGroup.add(island.debugRing);
        }
    }

    function createPalm(x, z, rng) {
        var group = new THREE.Group();
        var trunk = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 3.5, 34, 7), materials.palm);
        var leafA = new THREE.Mesh(new THREE.ConeGeometry(13, 28, 6), materials.leaf);
        var leafB = new THREE.Mesh(new THREE.ConeGeometry(11, 24, 6), materials.leaf);
        var leafC = new THREE.Mesh(new THREE.ConeGeometry(10, 22, 6), materials.leaf);

        trunk.position.y = 24;
        trunk.rotation.z = randRange(rng, -0.10, 0.10);
        leafA.position.y = 46;
        leafB.position.y = 45;
        leafC.position.y = 44;
        leafA.rotation.z = 0.55;
        leafB.rotation.z = -0.45;
        leafB.rotation.y = 1.7;
        leafC.rotation.z = 0.25;
        leafC.rotation.y = -1.6;

        group.add(trunk);
        group.add(leafA);
        group.add(leafB);
        group.add(leafC);
        group.position.set(x, 0, z);
        return group;
    }

    function createProjectileMesh() {
        return new THREE.Mesh(new THREE.SphereGeometry(5, 10, 8), materials.cannonball);
    }

    function createCrateMesh() {
        var group = new THREE.Group();
        var box = new THREE.Mesh(new THREE.BoxGeometry(18, 14, 18), materials.crate);
        var bandA = new THREE.Mesh(new THREE.BoxGeometry(20, 16, 3), materials.dock);
        var bandB = new THREE.Mesh(new THREE.BoxGeometry(3, 16, 20), materials.dock);
        box.position.y = 8;
        bandA.position.y = 8.5;
        bandB.position.y = 8.6;
        group.add(box);
        group.add(bandA);
        group.add(bandB);
        return group;
    }

    function createDebugRing(radius, material) {
        var mat = material && material.clone ? material.clone() : material;
        var ring = new THREE.Mesh(new THREE.RingGeometry(radius - 1.5, radius + 1.5, 64), mat);
        ring.rotation.x = -Math.PI * 0.5;
        return ring;
    }

    function createWakeLine() {
        var geometry = new THREE.BufferGeometry();
        var values = new Float32Array(WAKE_POINT_COUNT * 3);
        var material = materials.wake.clone();
        var i;

        for (i = 0; i < values.length; i += 3) {
            values[i] = 0;
            values[i + 1] = -1000;
            values[i + 2] = 0;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(values, 3));
        return new THREE.Line(geometry, material);
    }

    function createHealthBar() {
        var group = new THREE.Group();
        var back = new THREE.Mesh(new THREE.PlaneGeometry(42, 6), materials.hpBack.clone());
        var fill = new THREE.Mesh(new THREE.PlaneGeometry(38, 3.5), materials.hpFill.clone());

        back.position.z = -0.01;
        fill.position.z = 0;
        fill.userData.fullWidth = 38;
        group.add(back);
        group.add(fill);
        group.userData.fill = fill;
        return group;
    }

    function attachShipHelpers(ship) {
        ship.wakeLine = createWakeLine();
        ship.healthBar = createHealthBar();
        worldGroup.add(ship.wakeLine);
        worldGroup.add(ship.healthBar);
    }

    function createAimObjects() {
        var dotGeometry = new THREE.SphereGeometry(3.2, 8, 6);
        var windGeometry;

        aimDots = new THREE.InstancedMesh(dotGeometry, materials.aimGood, AIM_DOT_COUNT);
        aimDots.frustumCulled = false;
        aimDotMatrix = new THREE.Matrix4();
        worldGroup.add(aimDots);

        aimMarker = new THREE.Mesh(new THREE.RingGeometry(13, 16, 32), materials.aimMarkerGood);
        aimMarker.rotation.x = -Math.PI * 0.5;
        aimMarker.position.y = 1;
        worldGroup.add(aimMarker);

        windGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]);
        windArrow = new THREE.Line(windGeometry, materials.wind);
        windArrow.frustumCulled = false;
        windArrow.visible = DEBUG_ENABLED;
        worldGroup.add(windArrow);
    }

    function clearWorldGroup() {
        if (!worldGroup) {
            return;
        }

        while (worldGroup.children.length > 0) {
            worldGroup.remove(worldGroup.children[0]);
        }
    }

    function buildWorld() {
        var i;
        var rng = makeRng(state.seed ^ 0x9E3779B9);

        clearWorldGroup();

        for (i = 0; i < state.islands.length; i += 1) {
            createIslandMesh(state.islands[i], rng);
        }

        state.player.mesh = createShipMesh(true);
        attachShipHelpers(state.player);
        state.player.debugRing = DEBUG_ENABLED ? createDebugRing(PLAYER_RADIUS, materials.debugGreen) : null;
        worldGroup.add(state.player.mesh);
        if (state.player.debugRing) {
            worldGroup.add(state.player.debugRing);
        }

        for (i = 0; i < state.enemies.length; i += 1) {
            state.enemies[i].mesh = createShipMesh(false);
            attachShipHelpers(state.enemies[i]);
            state.enemies[i].debugRing = DEBUG_ENABLED ? createDebugRing(ENEMY_RADIUS, materials.debugRed) : null;
            worldGroup.add(state.enemies[i].mesh);
            if (state.enemies[i].debugRing) {
                worldGroup.add(state.enemies[i].debugRing);
            }
        }

        createAimObjects();
    }

    function initThree() {
        initMaterials();

        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false,
            powerPreference: 'high-performance'
        });
        renderer.setClearColor(0x08151e, 1);
        renderer.shadowMap.enabled = false;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x08151e);
        scene.fog = new THREE.Fog(0x08151e, 1200, 3600);

        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 6000);
        raycaster = new THREE.Raycaster();
        groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

        var ambient = new THREE.AmbientLight(0xa8c4e8, 1.8);
        var sun = new THREE.DirectionalLight(0xfff2d4, 2.6);
        sun.position.set(340, 600, 260);
        scene.add(ambient);
        scene.add(sun);

        worldGroup = new THREE.Group();
        scene.add(worldGroup);

        if (hud.minimap && hud.minimap.getContext) {
            minimapContext = hud.minimap.getContext('2d');
        }

        createWater();
        buildWorld();
        resize();
        syncMeshes();

        if (hud.loading) {
            hud.loading.hidden = true;
        }
    }

    function resize() {
        var rect = canvas.getBoundingClientRect();
        var width = Math.max(320, rect.width);
        var height = Math.max(320, rect.height);
        var aspect = width / height;
        var viewSize = 720;
        var pixelRatio = Math.min(window.devicePixelRatio || 1, 1.5);

        renderer.setPixelRatio(pixelRatio);
        renderer.setSize(width, height, false);
        camera.left = -viewSize * aspect * 0.5;
        camera.right = viewSize * aspect * 0.5;
        camera.top = viewSize * 0.5;
        camera.bottom = -viewSize * 0.5;
        camera.updateProjectionMatrix();
    }

    function updateMouseWorld(clientX, clientY) {
        var rect = canvas.getBoundingClientRect();
        var x = ((clientX - rect.left) / rect.width) * 2 - 1;
        var y = -(((clientY - rect.top) / rect.height) * 2 - 1);
        var hit = new THREE.Vector3();

        state.mouseNdcX = x;
        state.mouseNdcY = y;
        raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

        if (raycaster.ray.intersectPlane(groundPlane, hit)) {
            state.mouseWorldX = hit.x;
            state.mouseWorldZ = hit.z;
            state.mouseInside = true;
        }
    }

    function updateCamera(dt) {
        var p = state.player;
        var distance = 740;
        var height = 520;
        var orbitInput = 0;

        if (state.input.camLeft) {
            orbitInput -= 1;
        }
        if (state.input.camRight) {
            orbitInput += 1;
        }
        state.cameraOrbit += orbitInput * dt * 1.15;

        state.cameraTargetX = lerp(state.cameraTargetX, p.x, 1 - Math.pow(0.001, dt));
        state.cameraTargetZ = lerp(state.cameraTargetZ, p.z, 1 - Math.pow(0.001, dt));

        camera.position.set(
            state.cameraTargetX + Math.sin(state.cameraOrbit) * distance,
            height,
            state.cameraTargetZ + Math.cos(state.cameraOrbit) * distance
        );
        camera.lookAt(state.cameraTargetX, 0, state.cameraTargetZ);
    }

    function updateWind(dt) {
        state.windTimer -= dt;
        if (state.windTimer <= 0) {
            state.windTargetAngle = randRange(state.rng, 0, TAU);
            state.windSpeed = randRange(state.rng, 0.74, 1.16);
            state.windTimer = randRange(state.rng, 7, 12);
        }
        state.windAngle += wrapAngle(state.windTargetAngle - state.windAngle) * dt * 0.18;
    }

    function addWakePoint(ship, dt) {
        var speed = length2(ship.vx, ship.vz);
        var fx;
        var fz;
        var i;

        if (ship.hp <= 0 || speed < 12) {
            return;
        }

        ship.wakeTimer -= dt;
        if (ship.wakeTimer <= 0) {
            fx = forwardX(ship.heading);
            fz = forwardZ(ship.heading);
            ship.wakePoints.unshift({
                x: ship.x - fx * 32,
                z: ship.z - fz * 32,
                age: 0
            });
            if (ship.wakePoints.length > WAKE_POINT_COUNT) {
                ship.wakePoints.length = WAKE_POINT_COUNT;
            }
            ship.wakeTimer = 0.10;
        }

        for (i = ship.wakePoints.length - 1; i >= 0; i -= 1) {
            ship.wakePoints[i].age += dt;
            if (ship.wakePoints[i].age > WAKE_LIFE) {
                ship.wakePoints.splice(i, 1);
            }
        }
    }

    function resolveIslandCollision(ship) {
        var radius = ship.isPlayer ? PLAYER_RADIUS : ENEMY_RADIUS;
        var i;
        var island;
        var dx;
        var dz;
        var d;
        var nx;
        var nz;
        var minDist;
        var push;
        var into;

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            dx = ship.x - island.x;
            dz = ship.z - island.z;
            d = length2(dx, dz);
            minDist = island.r + radius * 0.72;
            if (d < minDist) {
                if (d < 0.001) {
                    nx = 1;
                    nz = 0;
                } else {
                    nx = dx / d;
                    nz = dz / d;
                }
                push = minDist - d;
                ship.x += nx * push;
                ship.z += nz * push;
                into = ship.vx * nx + ship.vz * nz;
                if (into < 0) {
                    ship.vx -= into * nx * 1.25;
                    ship.vz -= into * nz * 1.25;
                }
                ship.vx *= 0.72;
                ship.vz *= 0.72;
            }
        }
    }

    function updateShipPhysics(ship, rudder, sailDelta, dt) {
        var fx;
        var fz;
        var wx;
        var wz;
        var windDot;
        var beamFactor;
        var tailFactor;
        var headFactor;
        var sailEfficiency;
        var thrust;
        var crossWind;
        var speed;
        var turnPower;
        var damping;
        var relativeWind;
        var targetSailAngle;
        var smoothing;

        if (ship.hp <= 0) {
            ship.sinkTimer += dt;
            ship.vx *= Math.pow(0.96, dt * 60);
            ship.vz *= Math.pow(0.96, dt * 60);
            ship.x += ship.vx * dt;
            ship.z += ship.vz * dt;
            return;
        }

        ship.sail = clamp(ship.sail + sailDelta * dt * 0.82, 0, 1);
        fx = forwardX(ship.heading);
        fz = forwardZ(ship.heading);
        wx = Math.sin(state.windAngle);
        wz = Math.cos(state.windAngle);
        windDot = fx * wx + fz * wz;
        relativeWind = wrapAngle(state.windAngle - ship.heading);
        targetSailAngle = clamp(-relativeWind * 0.56, -0.98, 0.98);
        smoothing = 1 - Math.pow(0.001, dt);
        ship.sailAngle = lerp(ship.sailAngle, targetSailAngle, smoothing);

        beamFactor = Math.sqrt(Math.max(0, 1 - windDot * windDot));
        tailFactor = Math.max(0, windDot);
        headFactor = Math.max(0, -windDot);
        sailEfficiency = 0.30 + beamFactor * 0.58 + tailFactor * 0.42 + headFactor * 0.16;
        sailEfficiency = clamp(sailEfficiency, 0.34, 1.22);
        thrust = sailEfficiency * ship.sail * state.windSpeed * 82 * ship.sailPowerMul;
        crossWind = beamFactor * state.windSpeed * ship.sail * 4.2;

        ship.vx += fx * thrust * dt;
        ship.vz += fz * thrust * dt;
        ship.vx += wx * crossWind * dt;
        ship.vz += wz * crossWind * dt;

        speed = length2(ship.vx, ship.vz);
        turnPower = (0.44 + clamp(speed / 120, 0, 0.78)) * (0.36 + ship.sail * 0.82);
        ship.heading += rudder * turnPower * dt;

        damping = Math.pow(0.989, dt * 60);
        ship.vx *= damping;
        ship.vz *= damping;
        ship.x += ship.vx * dt;
        ship.z += ship.vz * dt;
        resolveIslandCollision(ship);
        addWakePoint(ship, dt);

        if (ship.x < -SEA_LIMIT || ship.x > SEA_LIMIT) {
            ship.x = clamp(ship.x, -SEA_LIMIT, SEA_LIMIT);
            ship.vx *= -0.25;
        }
        if (ship.z < -SEA_LIMIT || ship.z > SEA_LIMIT) {
            ship.z = clamp(ship.z, -SEA_LIMIT, SEA_LIMIT);
            ship.vz *= -0.25;
        }

        if (ship.fireCooldown > 0) {
            ship.fireCooldown -= dt;
        }
        if (ship.fireHintCooldown > 0) {
            ship.fireHintCooldown -= dt;
        }
        if (ship.hitFlash > 0) {
            ship.hitFlash -= dt;
        }
    }

    function updatePlayer(dt) {
        var sailDelta = 0;
        var rudder = 0;

        if (state.input.sailUp) {
            sailDelta += 1;
        }
        if (state.input.sailDown) {
            sailDelta -= 1;
        }
        if (state.input.left) {
            rudder -= 1;
        }
        if (state.input.right) {
            rudder += 1;
        }

        updateShipPhysics(state.player, rudder, sailDelta, dt);

        if (state.input.fire) {
            fireFromShip(state.player, state.mouseWorldX, state.mouseWorldZ);
            state.input.fire = false;
        }
    }

    function updateEnemies(dt) {
        var i;
        for (i = 0; i < state.enemies.length; i += 1) {
            updateEnemy(state.enemies[i], dt);
        }
    }

    function updateEnemy(enemy, dt) {
        var player = state.player;
        var distanceToPlayer = dist2(enemy, player);
        var desiredX = enemy.targetX;
        var desiredZ = enemy.targetZ;
        var dx;
        var dz;
        var desiredHeading;
        var desiredHeadingOverride = null;
        var turnError;
        var rudder;
        var sailDelta;

        if (enemy.hp <= 0) {
            updateShipPhysics(enemy, 0, -1, dt);
            return;
        }

        enemy.aiTimer -= dt;

        if (enemy.hp < enemy.maxHp * 0.28) {
            enemy.aiState = 'retreat';
        } else if (distanceToPlayer < 260) {
            enemy.aiState = 'attack';
        } else if (distanceToPlayer < 720) {
            enemy.aiState = 'chase';
        } else {
            enemy.aiState = 'patrol';
        }

        if (enemy.aiState === 'patrol') {
            if (enemy.aiTimer <= 0 || length2(enemy.targetX - enemy.x, enemy.targetZ - enemy.z) < 90) {
                enemy.targetX += randRange(state.rng, -260, 260);
                enemy.targetZ += randRange(state.rng, -260, 260);
                enemy.targetX = clamp(enemy.targetX, -SEA_LIMIT * 0.8, SEA_LIMIT * 0.8);
                enemy.targetZ = clamp(enemy.targetZ, -SEA_LIMIT * 0.8, SEA_LIMIT * 0.8);
                enemy.aiTimer = randRange(state.rng, 3.5, 6.0);
            }
            desiredX = enemy.targetX;
            desiredZ = enemy.targetZ;
        } else if (enemy.aiState === 'chase') {
            desiredX = player.x + player.vx * 1.2;
            desiredZ = player.z + player.vz * 1.2;
        } else if (enemy.aiState === 'attack') {
            desiredHeadingOverride = chooseBroadsideHeading(enemy, player);
            desiredX = enemy.x + Math.sin(desiredHeadingOverride) * 160;
            desiredZ = enemy.z + Math.cos(desiredHeadingOverride) * 160;
            if (distanceToPlayer < 150) {
                desiredX += (enemy.x - player.x) * 0.45;
                desiredZ += (enemy.z - player.z) * 0.45;
            }
            if (enemy.fireCooldown <= 0) {
                fireFromShip(enemy, player.x + player.vx * 0.9, player.z + player.vz * 0.9);
            }
        } else if (enemy.aiState === 'retreat') {
            desiredX = enemy.x + (enemy.x - player.x);
            desiredZ = enemy.z + (enemy.z - player.z);
        }

        dx = desiredX - enemy.x;
        dz = desiredZ - enemy.z;
        desiredHeading = desiredHeadingOverride === null ? Math.atan2(dx, dz) : desiredHeadingOverride;
        turnError = wrapAngle(desiredHeading - enemy.heading);
        rudder = clamp(turnError * 1.75, -1, 1);
        sailDelta = enemy.sail < 0.84 ? 0.5 : 0;

        updateShipPhysics(enemy, rudder, sailDelta, dt);
    }

    function getBroadsideInfo(ship, targetX, targetZ) {
        var toX = targetX - ship.x;
        var toZ = targetZ - ship.z;
        var len = length2(toX, toZ);
        var fx;
        var fz;
        var rightX;
        var rightZ;
        var dirX;
        var dirZ;
        var side;
        var sideDot;
        var forwardDot;
        var minSideDot;

        if (len < 1) {
            len = 1;
        }

        dirX = toX / len;
        dirZ = toZ / len;
        fx = forwardX(ship.heading);
        fz = forwardZ(ship.heading);
        rightX = fz;
        rightZ = -fx;
        sideDot = dirX * rightX + dirZ * rightZ;
        forwardDot = dirX * fx + dirZ * fz;
        side = sideDot >= 0 ? 1 : -1;
        minSideDot = Math.cos(BROADSIDE_HALF_ARC);

        return {
            dirX: dirX,
            dirZ: dirZ,
            rightX: rightX,
            rightZ: rightZ,
            forwardDot: forwardDot,
            sideDot: sideDot,
            side: side,
            inArc: Math.abs(sideDot) >= minSideDot,
            len: len
        };
    }

    function getPlayerAimStatus() {
        var p = state.player;
        var shot = getShotPlan(p, state.mouseWorldX, state.mouseWorldZ);
        return {
            info: shot.info,
            shot: shot,
            canFire: shot.info.inArc && shot.rangeOk && p.fireCooldown <= 0 && p.hp > 0 && !state.gameOver,
            inArc: shot.info.inArc,
            reloading: p.fireCooldown > 0
        };
    }

    function chooseBroadsideHeading(ship, target) {
        var toTarget = Math.atan2(target.x - ship.x, target.z - ship.z);
        var leftHeading = toTarget + Math.PI * 0.5;
        var rightHeading = toTarget - Math.PI * 0.5;
        var leftError = Math.abs(wrapAngle(leftHeading - ship.heading));
        var rightError = Math.abs(wrapAngle(rightHeading - ship.heading));
        return leftError < rightError ? leftHeading : rightHeading;
    }

    function getShotPlan(ship, targetX, targetZ) {
        var info = getBroadsideInfo(ship, targetX, targetZ);
        var startX = ship.x + info.rightX * info.side * 21 + forwardX(ship.heading) * 5;
        var startY = 20;
        var startZ = ship.z + info.rightZ * info.side * 21 + forwardZ(ship.heading) * 5;
        var dx = targetX - startX;
        var dz = targetZ - startZ;
        var rawDist = Math.max(1, length2(dx, dz));
        var rangeScale = rawDist > AIM_MAX_RANGE ? AIM_MAX_RANGE / rawDist : 1;
        var endX = startX + dx * rangeScale;
        var endZ = startZ + dz * rangeScale;
        var dist = Math.max(1, length2(endX - startX, endZ - startZ));
        var flightTime = clamp(0.50 + dist / 230, 0.68, AIM_MAX_FLIGHT_TIME);
        var targetY = 1.5;
        var vx = (endX - startX) / flightTime + ship.vx * 0.12;
        var vz = (endZ - startZ) / flightTime + ship.vz * 0.12;
        var vy = (targetY - startY + 0.5 * GRAVITY * flightTime * flightTime) / flightTime;

        return {
            info: info,
            startX: startX,
            startY: startY,
            startZ: startZ,
            endX: endX,
            endZ: endZ,
            vx: vx,
            vy: clamp(vy, 48, 245),
            vz: vz,
            flightTime: flightTime,
            rangeOk: rawDist <= AIM_MAX_RANGE
        };
    }

    function fireFromShip(ship, targetX, targetZ) {
        var shot;
        var projectile;
        var mesh;
        var cooldown;

        if (ship.fireCooldown > 0 || ship.hp <= 0 || state.gameOver) {
            return false;
        }

        shot = getShotPlan(ship, targetX, targetZ);
        if (!shot.info.inArc) {
            if (ship.isPlayer && ship.fireHintCooldown <= 0) {
                setMessage('Target outside broadside arc. Turn the ship side-on before firing.', 1.8);
                ship.fireHintCooldown = 0.8;
            }
            return false;
        }
        if (!shot.rangeOk) {
            if (ship.isPlayer && ship.fireHintCooldown <= 0) {
                setMessage('Target is out of cannon range.', 1.6);
                ship.fireHintCooldown = 0.8;
            }
            return false;
        }

        mesh = createProjectileMesh();
        projectile = {
            owner: ship.isPlayer ? 'player' : 'enemy',
            damage: ship.damage,
            x: shot.startX,
            y: shot.startY,
            z: shot.startZ,
            vx: shot.vx,
            vy: shot.vy,
            vz: shot.vz,
            life: PROJECTILE_MAX_LIFE,
            mesh: mesh,
            active: true
        };

        worldGroup.add(mesh);
        state.projectiles.push(projectile);
        cooldown = ship.isPlayer ? 0.58 * ship.cannonCooldownMul : 1.15;
        ship.fireCooldown = cooldown;
        return true;
    }

    function updateProjectiles(dt) {
        var i;
        var p;
        var hit;

        for (i = state.projectiles.length - 1; i >= 0; i -= 1) {
            p = state.projectiles[i];
            if (!p.active) {
                continue;
            }

            p.life -= dt;
            p.vy -= GRAVITY * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z += p.vz * dt;

            hit = false;
            if (p.owner === 'player') {
                hit = checkProjectileAgainstEnemies(p);
            } else {
                hit = checkProjectileAgainstPlayer(p);
            }

            if (!hit) {
                hit = checkProjectileAgainstIslands(p);
            }

            if (p.y <= 0) {
                makeSplash(p.x, p.z);
                hit = true;
            }

            if (p.life <= 0) {
                hit = true;
            }

            if (hit) {
                p.active = false;
                worldGroup.remove(p.mesh);
                state.projectiles.splice(i, 1);
            }
        }
    }

    function checkProjectileAgainstPlayer(p) {
        var player = state.player;
        if (player.hp <= 0 || p.y > 28) {
            return false;
        }

        if (length2(p.x - player.x, p.z - player.z) <= PLAYER_RADIUS) {
            applyDamage(player, p.damage);
            setMessage('Hit taken. Hit taken. Keep moving and turn for a better broadside.', 2.2);
            return true;
        }
        return false;
    }

    function checkProjectileAgainstIslands(p) {
        var i;
        var island;

        if (p.y > 36) {
            return false;
        }

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            if (length2(p.x - island.x, p.z - island.z) <= island.r * 0.95) {
                makeSplash(p.x, p.z);
                return true;
            }
        }
        return false;
    }

    function checkProjectileAgainstEnemies(p) {
        var i;
        var enemy;
        for (i = 0; i < state.enemies.length; i += 1) {
            enemy = state.enemies[i];
            if (enemy.hp <= 0 || p.y > 28) {
                continue;
            }

            if (length2(p.x - enemy.x, p.z - enemy.z) <= ENEMY_RADIUS) {
                applyDamage(enemy, p.damage);
                if (enemy.hp <= 0) {
                    sinkEnemy(enemy);
                }
                return true;
            }
        }
        return false;
    }

    function applyDamage(ship, amount) {
        ship.hp = Math.max(0, ship.hp - amount);
        ship.hitFlash = 0.22;
        if (ship.isPlayer && ship.hp <= 0) {
            state.gameOver = true;
            setMessage('Ship lost. Press New run to restart.', 10);
        }
    }

    function sinkEnemy(enemy) {
        var crateCount = 2 + Math.floor(state.rng() * 3);
        var i;
        state.player.kills += 1;
        enemy.sinkTimer = 0.01;
        setMessage('Enemy ship disabled. Cargo crates in the water.', 2.4);

        for (i = 0; i < crateCount; i += 1) {
            spawnCrate(
                enemy.x + randRange(state.rng, -42, 42),
                enemy.z + randRange(state.rng, -42, 42),
                24 + Math.floor(randRange(state.rng, 0, 42))
            );
        }
    }

    function spawnCrate(x, z, value) {
        var mesh = createCrateMesh();
        var crate = {
            x: x,
            z: z,
            value: value,
            mesh: mesh,
            bob: randRange(state.rng, 0, TAU),
            active: true
        };
        mesh.position.set(x, 8, z);
        worldGroup.add(mesh);
        state.crates.push(crate);
    }

    function updateCrates(dt) {
        var i;
        var crate;
        var p = state.player;

        for (i = state.crates.length - 1; i >= 0; i -= 1) {
            crate = state.crates[i];
            crate.bob += dt * 1.8;
            if (dist2(crate, p) < 44 && p.cargo < p.cargoCapacity) {
                p.cargo += 1;
                p.cargoValue += crate.value;
                worldGroup.remove(crate.mesh);
                state.crates.splice(i, 1);
                setMessage('Cargo recovered. Dock near an island to sell it.', 2.0);
            }
        }
    }

    function makeSplash(x, z) {
        var ring = createDebugRing(10, materials.debugGreen);
        var splash = {
            x: x,
            z: z,
            life: 0.55,
            mesh: ring
        };
        ring.position.set(x, 1.3, z);
        ring.scale.setScalar(0.25);
        worldGroup.add(ring);
        state.splashes.push(splash);
    }

    function updateSplashes(dt) {
        var i;
        var splash;
        var t;

        for (i = state.splashes.length - 1; i >= 0; i -= 1) {
            splash = state.splashes[i];
            splash.life -= dt;
            t = 1 - clamp(splash.life / 0.55, 0, 1);
            splash.mesh.scale.setScalar(0.25 + t * 2.6);
            if (splash.mesh.material) {
                splash.mesh.material.opacity = Math.max(0, 0.45 * (1 - t));
            }
            if (splash.life <= 0) {
                worldGroup.remove(splash.mesh);
                state.splashes.splice(i, 1);
            }
        }
    }

    function updateDock(dt) {
        var p = state.player;
        var docked = false;
        var i;
        var island;
        var hullCost;
        var sailCost;
        var cannonCost;

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            if (!island.dock) {
                continue;
            }
            if (dist2(p, island) <= ISLAND_DOCK_RADIUS) {
                docked = true;
                break;
            }
        }

        state.docked = docked;
        state.sellCooldown = Math.max(0, state.sellCooldown - dt);

        if (docked && p.cargo > 0 && state.sellCooldown <= 0) {
            p.gold += p.cargoValue;
            setMessage('Cargo sold for ' + p.cargoValue + ' gold. Upgrades: 1 hull, 2 sail, 3 cannon.', 3.5);
            p.cargo = 0;
            p.cargoValue = 0;
            state.sellCooldown = 2.0;
        }

        hullCost = upgradeCost('hull');
        sailCost = upgradeCost('sail');
        cannonCost = upgradeCost('cannon');
        if (hud.upgrade) {
            hud.upgrade.textContent = hullCost + '/' + sailCost + '/' + cannonCost;
        }
    }

    function upgradeCost(type) {
        if (type === 'hull') {
            return 70 + (state.player.maxHp - 100) * 3;
        }
        if (type === 'sail') {
            return 90 + Math.round((state.player.sailPowerMul - 1) * 260);
        }
        return 110 + Math.round((1 - state.player.cannonCooldownMul) * 280);
    }

    function buyUpgrade(slot) {
        var p = state.player;
        var cost;

        if (!state.docked || state.gameOver) {
            setMessage('Dock near an island before buying upgrades.', 1.7);
            return;
        }

        if (slot === 1) {
            cost = upgradeCost('hull');
            if (p.gold < cost) {
                setMessage('Not enough gold for hull upgrade.', 1.7);
                return;
            }
            p.gold -= cost;
            p.maxHp += 20;
            p.hp = p.maxHp;
            p.cargoCapacity += 2;
            setMessage('Hull upgraded. HP and cargo capacity increased.', 2.3);
        } else if (slot === 2) {
            cost = upgradeCost('sail');
            if (p.gold < cost) {
                setMessage('Not enough gold for sail upgrade.', 1.7);
                return;
            }
            p.gold -= cost;
            p.sailPowerMul += 0.14;
            setMessage('Sail upgraded. Wind handling improved.', 2.3);
        } else if (slot === 3) {
            cost = upgradeCost('cannon');
            if (p.gold < cost) {
                setMessage('Not enough gold for cannon upgrade.', 1.7);
                return;
            }
            p.gold -= cost;
            p.damage += 10;
            p.cannonCooldownMul = Math.max(0.55, p.cannonCooldownMul - 0.08);
            setMessage('Cannon upgraded. Damage and reload improved.', 2.3);
        }
    }

    function updateGame(dt) {
        if (state.paused || state.gameOver) {
            return;
        }

        state.time += dt;
        state.messageTimer = Math.max(0, state.messageTimer - dt);
        updateWind(dt);
        updatePlayer(dt);
        updateEnemies(dt);
        updateProjectiles(dt);
        updateCrates(dt);
        updateSplashes(dt);
        updateDock(dt);
        updateRouteClear();
    }

    function updateRouteClear() {
        var alive = state.enemies.filter(function (enemy) {
            return enemy.hp > 0;
        }).length;

        if (!state.routeClear && alive === 0) {
            state.routeClear = true;
            setMessage('Route clear. The harbor is safe for now.', 8);
        }
    }

    function syncWakeLine(ship) {
        var line = ship.wakeLine;
        var attr;
        var point;
        var lastX = ship.x;
        var lastZ = ship.z;
        var i;

        if (!line) {
            return;
        }

        attr = line.geometry.attributes.position;
        for (i = 0; i < WAKE_POINT_COUNT; i += 1) {
            point = ship.wakePoints[i];
            if (point) {
                lastX = point.x;
                lastZ = point.z;
                attr.setXYZ(i, point.x, 1.1 + Math.sin(state.time * 2 + i) * 0.4, point.z);
            } else {
                attr.setXYZ(i, lastX, -1000, lastZ);
            }
        }
        attr.needsUpdate = true;
        line.visible = ship.wakePoints.length > 1 && ship.hp > 0;
    }

    function syncHealthBar(ship) {
        var bar = ship.healthBar;
        var fill;
        var ratio;
        var fullWidth;

        if (!bar) {
            return;
        }

        bar.position.set(ship.x, ship.hp > 0 ? 78 : -1000, ship.z);
        bar.visible = ship.hp > 0;
        bar.lookAt(camera.position);
        fill = bar.userData.fill;
        if (fill) {
            ratio = clamp(ship.hp / ship.maxHp, 0, 1);
            fullWidth = fill.userData.fullWidth || 38;
            fill.scale.x = ratio;
            fill.position.x = -(fullWidth * (1 - ratio)) * 0.5;
        }
    }

    function syncShipMesh(ship) {
        var mesh = ship.mesh;
        var sailMesh;
        var sailCurve;

        if (!mesh) {
            return;
        }

        mesh.position.set(ship.x, ship.hp > 0 ? 0 : -Math.min(24, ship.sinkTimer * 12), ship.z);
        mesh.rotation.y = ship.heading;
        mesh.rotation.z = ship.hp > 0 ? Math.sin(state.time * 2.5 + ship.x * 0.01) * 0.018 : ship.sinkTimer * 0.18;
        mesh.rotation.x = ship.hp > 0 ? Math.cos(state.time * 2.0 + ship.z * 0.01) * 0.015 : -ship.sinkTimer * 0.10;

        sailMesh = mesh.userData.sailMesh;
        if (sailMesh) {
            sailCurve = 0.62 + ship.sail * 0.38;
            sailMesh.scale.set(sailCurve, 1, 1);
            sailMesh.rotation.z = Math.sin(state.time * 2.2 + ship.x * 0.01) * 0.035;
        }
        if (mesh.userData.sailPivot) {
            mesh.userData.sailPivot.rotation.y = ship.sailAngle;
        }

        if (ship.debugRing) {
            ship.debugRing.position.set(ship.x, 1.1, ship.z);
            ship.debugRing.visible = DEBUG_ENABLED && ship.hp > 0;
        }

        syncWakeLine(ship);
        syncHealthBar(ship);
    }

    function syncMeshes() {
        var i;
        var p;
        var crate;
        var t;
        var simX;
        var simY;
        var simZ;
        var vx;
        var vy;
        var vz;
        var windAttr;
        var player;
        var aimStatus;

        syncShipMesh(state.player);
        for (i = 0; i < state.enemies.length; i += 1) {
            syncShipMesh(state.enemies[i]);
        }

        for (i = 0; i < state.projectiles.length; i += 1) {
            p = state.projectiles[i];
            p.mesh.position.set(p.x, p.y, p.z);
        }

        for (i = 0; i < state.crates.length; i += 1) {
            crate = state.crates[i];
            crate.mesh.position.set(crate.x, 7 + Math.sin(crate.bob) * 3.2, crate.z);
            crate.mesh.rotation.y += 0.01;
        }

        player = state.player;
        aimStatus = getPlayerAimStatus();
        aimDots.material = aimStatus.canFire ? materials.aimGood : materials.aimBad;
        aimDots.visible = state.mouseInside && player.hp > 0;
        aimMarker.material = aimStatus.canFire ? materials.aimMarkerGood : materials.aimMarkerBad;
        aimMarker.visible = state.mouseInside && player.hp > 0;
        aimMarker.position.set(aimStatus.shot.endX, 1.2, aimStatus.shot.endZ);
        vx = aimStatus.shot.vx;
        vy = aimStatus.shot.vy;
        vz = aimStatus.shot.vz;
        simX = aimStatus.shot.startX;
        simY = aimStatus.shot.startY;
        simZ = aimStatus.shot.startZ;

        for (i = 0; i < AIM_DOT_COUNT; i += 1) {
            t = (i / Math.max(1, AIM_DOT_COUNT - 1)) * aimStatus.shot.flightTime;
            var dotX = simX + vx * t;
            var dotY = Math.max(1.5, simY + vy * t - GRAVITY * t * t * 0.5);
            var dotZ = simZ + vz * t;
            var dotScale = 0.62 + i / AIM_DOT_COUNT * 0.42;
            aimDotMatrix.makeScale(dotScale, dotScale, dotScale);
            aimDotMatrix.setPosition(dotX, dotY, dotZ);
            aimDots.setMatrixAt(i, aimDotMatrix);
        }
        aimDots.instanceMatrix.needsUpdate = true;

        if (windArrow) {
            windArrow.visible = DEBUG_ENABLED;
            if (DEBUG_ENABLED) {
                windAttr = windArrow.geometry.attributes.position;
                windAttr.setXYZ(0, player.x, 70, player.z);
                windAttr.setXYZ(1, player.x + Math.sin(state.windAngle) * 140, 70, player.z + Math.cos(state.windAngle) * 140);
                windAttr.needsUpdate = true;
            }
        }
    }

    function mapToMini(value) {
        return 90 + (value / SEA_LIMIT) * 78;
    }

    function drawMinimap() {
        var ctx = minimapContext;
        var i;
        var island;
        var enemy;
        var crate;
        var p = state.player;
        var x;
        var y;

        if (!ctx) {
            return;
        }

        ctx.clearRect(0, 0, 180, 180);
        ctx.fillStyle = 'rgba(5, 16, 24, 0.84)';
        ctx.fillRect(0, 0, 180, 180);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.strokeRect(0.5, 0.5, 179, 179);
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.07)';
        ctx.beginPath();
        ctx.moveTo(90, 0);
        ctx.lineTo(90, 180);
        ctx.moveTo(0, 90);
        ctx.lineTo(180, 90);
        ctx.stroke();

        for (i = 0; i < state.islands.length; i += 1) {
            island = state.islands[i];
            x = mapToMini(island.x);
            y = mapToMini(island.z);
            ctx.fillStyle = island.dock ? 'rgba(255, 209, 102, 0.85)' : 'rgba(83, 158, 90, 0.70)';
            ctx.beginPath();
            ctx.arc(x, y, clamp(island.r / 24, 2.5, 5.5), 0, TAU);
            ctx.fill();
        }

        ctx.fillStyle = 'rgba(181, 114, 49, 0.85)';
        for (i = 0; i < state.crates.length; i += 1) {
            crate = state.crates[i];
            ctx.fillRect(mapToMini(crate.x) - 1.5, mapToMini(crate.z) - 1.5, 3, 3);
        }

        ctx.fillStyle = 'rgba(255, 108, 95, 0.95)';
        for (i = 0; i < state.enemies.length; i += 1) {
            enemy = state.enemies[i];
            if (enemy.hp <= 0) {
                continue;
            }
            ctx.beginPath();
            ctx.arc(mapToMini(enemy.x), mapToMini(enemy.z), 3, 0, TAU);
            ctx.fill();
        }

        ctx.save();
        ctx.translate(mapToMini(p.x), mapToMini(p.z));
        ctx.rotate(-p.heading);
        ctx.fillStyle = 'rgba(50, 209, 160, 1)';
        ctx.beginPath();
        ctx.moveTo(0, -5);
        ctx.lineTo(4, 5);
        ctx.lineTo(-4, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
    }

    function updateHud() {
        var p = state.player;
        var aliveEnemies = state.enemies.filter(function (enemy) {
            return enemy.hp > 0;
        }).length;
        var speed = Math.round(length2(p.vx, p.vz));
        var debugText;

        if (hud.hp) {
            hud.hp.textContent = pad(p.hp, 3) + '/' + pad(p.maxHp, 3);
        }
        if (hud.sail) {
            hud.sail.textContent = pad(p.sail * 100, 2) + '%';
        }
        if (hud.wind) {
            hud.wind.textContent = angleName(state.windAngle) + ' ' + Math.round(state.windSpeed * 100) + '%';
        }
        if (hud.cargo) {
            hud.cargo.textContent = p.cargo + '/' + p.cargoCapacity;
        }
        if (hud.gold) {
            hud.gold.textContent = pad(p.gold, 3);
        }
        if (hud.enemies) {
            hud.enemies.textContent = pad(aliveEnemies, 2);
        }
        if (hud.reload) {
            hud.reload.textContent = p.fireCooldown <= 0 ? 'READY' : pad((1 - p.fireCooldown / (0.58 * p.cannonCooldownMul)) * 100, 2) + '%';
        }
        if (hud.dock) {
            hud.dock.textContent = state.docked ? 'YES' : 'NO';
        }

        if (hud.message) {
            if (DEBUG_ENABLED) {
                debugText = 'DEBUG seed=' + state.seed + ' speed=' + speed + ' proj=' + state.projectiles.length + ' crates=' + state.crates.length;
                debugText += ' ai=' + state.enemies.map(function (enemy) { return enemy.aiState; }).join(',');
                hud.message.textContent = state.messageTimer > 0 ? state.messageText + ' | ' + debugText : debugText;
            } else {
                hud.message.textContent = state.messageTimer > 0 ? state.messageText : 'W/S sail. A/D rudder. Q/E camera. Mouse aim. LMB or Space broadside fire. Dock near islands to sell cargo.';
            }
        }

        drawMinimap();

        if (hud.pauseCard) {
            hud.pauseCard.hidden = !state.paused;
            hud.pauseCard.classList.toggle('is-visible', state.paused);
            hud.pauseCard.setAttribute('aria-hidden', state.paused ? 'false' : 'true');
        }
        if (hud.pauseButton) {
            hud.pauseButton.textContent = state.paused ? 'Resume' : 'Pause';
            hud.pauseButton.setAttribute('aria-pressed', state.paused ? 'true' : 'false');
        }
    }

    function renderFrame(now) {
        var dt;

        if (!clockStarted) {
            clockStarted = true;
            lastFrameTime = now;
        }

        dt = Math.min(0.05, (now - lastFrameTime) / 1000);
        lastFrameTime = now;
        accumulator += dt;

        while (accumulator >= FIXED_DT) {
            updateGame(FIXED_DT);
            accumulator -= FIXED_DT;
        }

        updateCamera(dt);
        updateWater(state.time);
        syncMeshes();
        updateHud();
        renderer.render(scene, camera);
        window.requestAnimationFrame(renderFrame);
    }

    function resetGame() {
        state = makeInitialState();
        accumulator = 0;
        clockStarted = false;
        buildWorld();
        syncMeshes();
        setMessage('New run. Catch the wind, fire broadside, and dock for upgrades.', 4);
    }

    function togglePause() {
        state.paused = !state.paused;
        updateHud();
    }

    function onKeyDown(event) {
        if (event.repeat && event.code !== 'Space') {
            return;
        }

        if (event.code === 'KeyW') {
            state.input.sailUp = true;
        } else if (event.code === 'KeyS') {
            state.input.sailDown = true;
        } else if (event.code === 'KeyA') {
            state.input.left = true;
        } else if (event.code === 'KeyD') {
            state.input.right = true;
        } else if (event.code === 'KeyQ') {
            state.input.camLeft = true;
        } else if (event.code === 'KeyE') {
            state.input.camRight = true;
        } else if (event.code === 'Space') {
            state.input.fire = true;
            event.preventDefault();
        } else if (event.code === 'KeyP') {
            togglePause();
        } else if (event.code === 'Digit1') {
            buyUpgrade(1);
        } else if (event.code === 'Digit2') {
            buyUpgrade(2);
        } else if (event.code === 'Digit3') {
            buyUpgrade(3);
        }
    }

    function onKeyUp(event) {
        if (event.code === 'KeyW') {
            state.input.sailUp = false;
        } else if (event.code === 'KeyS') {
            state.input.sailDown = false;
        } else if (event.code === 'KeyA') {
            state.input.left = false;
        } else if (event.code === 'KeyD') {
            state.input.right = false;
        } else if (event.code === 'KeyQ') {
            state.input.camLeft = false;
        } else if (event.code === 'KeyE') {
            state.input.camRight = false;
        }
    }

    function installEvents() {
        window.addEventListener('resize', resize);
        window.addEventListener('keydown', onKeyDown);
        window.addEventListener('keyup', onKeyUp);
        canvas.addEventListener('mousemove', function (event) {
            updateMouseWorld(event.clientX, event.clientY);
        });
        canvas.addEventListener('mouseenter', function (event) {
            updateMouseWorld(event.clientX, event.clientY);
            state.mouseInside = true;
        });
        canvas.addEventListener('mouseleave', function () {
            state.mouseInside = false;
        });
        canvas.addEventListener('mousedown', function (event) {
            if (event.button === 0) {
                updateMouseWorld(event.clientX, event.clientY);
                state.input.fire = true;
                event.preventDefault();
            }
        });
        canvas.addEventListener('contextmenu', function (event) {
            event.preventDefault();
        });

        if (hud.pauseButton) {
            hud.pauseButton.addEventListener('click', togglePause);
        }
        if (hud.resetButton) {
            hud.resetButton.addEventListener('click', resetGame);
        }
    }

    async function boot() {
        try {
            THREE = await import(THREE_URL);
            initThree();
            installEvents();
            setMessage('Sail and Fire loaded. W/S sail, A/D rudder, Q/E camera, LMB broadside fire.', 5);
            window.requestAnimationFrame(renderFrame);
        } catch (error) {
            if (hud.loading) {
                hud.loading.hidden = false;
                hud.loading.innerHTML = '<strong>WebGL load failed</strong><span>Check network access to Three.js CDN</span>';
            }
            if (hud.message) {
                hud.message.textContent = 'Failed to load Three.js. Check network access or browser WebGL support.';
            }
            console.error(error);
        }
    }

    boot();
}());
