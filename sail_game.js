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
        dock: document.querySelector('[data-hud="dock"]'),
        upgrade: document.querySelector('[data-hud="upgrade"]'),
        message: document.querySelector('[data-sail-message]'),
        pauseCard: document.querySelector('[data-sail-pause-card]'),
        pauseButton: document.querySelector('[data-sail-pause]'),
        resetButton: document.querySelector('[data-sail-reset]'),
        loading: document.querySelector('[data-sail-loading]')
    };

    var DEBUG_ENABLED = new URLSearchParams(window.location.search).get('debug') === '1';
    var TAU = Math.PI * 2;
    var FIXED_DT = 1 / 60;
    var SEA_LIMIT = 1750;
    var GRAVITY = 160;
    var PROJECTILE_SPEED = 280;
    var PROJECTILE_MAX_LIFE = 3.2;
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
    var aimLine = null;
    var aimMarker = null;
    var windArrow = null;
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
            messageText: 'W/S sail. A/D rudder. Q/E camera. Mouse aim. LMB or Space fire.',
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
            sailPlayer: makeMaterial(0xe8eef4, 0.70, 0.0),
            sailEnemy: makeMaterial(0xd3b4aa, 0.78, 0.0),
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
            aim: new THREE.LineBasicMaterial({ color: 0x32d1a0, transparent: true, opacity: 0.86 }),
            wind: new THREE.LineBasicMaterial({ color: 0x63a6ff, transparent: true, opacity: 0.85 })
        };
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

    function createShipMesh(isPlayer) {
        var group = new THREE.Group();
        var hullMat = isPlayer ? materials.hullPlayer : materials.hullEnemy;
        var sailMat = isPlayer ? materials.sailPlayer : materials.sailEnemy;
        var hull = new THREE.Mesh(new THREE.BoxGeometry(24, 10, 54), hullMat);
        var deck = new THREE.Mesh(new THREE.BoxGeometry(20, 5, 38), materials.deck);
        var bow = new THREE.Mesh(new THREE.ConeGeometry(13, 22, 4), hullMat);
        var stern = new THREE.Mesh(new THREE.BoxGeometry(26, 12, 10), hullMat);
        var mast = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.8, 58, 8), materials.mast);
        var sail = new THREE.Mesh(new THREE.PlaneGeometry(28, 35, 3, 3), sailMat);
        var cannonL = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 18), materials.cannon);
        var cannonR = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 18), materials.cannon);

        hull.position.y = 8;
        deck.position.y = 15;
        bow.rotation.x = Math.PI * 0.5;
        bow.rotation.z = Math.PI * 0.25;
        bow.position.set(0, 8, 36);
        stern.position.set(0, 10, -31);
        mast.position.y = 38;
        sail.position.set(0, 39, 4);
        sail.userData.isSail = true;
        cannonL.position.set(-15, 16, 6);
        cannonR.position.set(15, 16, 6);

        group.add(hull);
        group.add(deck);
        group.add(bow);
        group.add(stern);
        group.add(mast);
        group.add(sail);
        group.add(cannonL);
        group.add(cannonR);
        group.userData.sailMesh = sail;
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

    function createAimObjects() {
        var lineGeometry = new THREE.BufferGeometry();
        var points = [];
        var i;
        for (i = 0; i < 30; i += 1) {
            points.push(new THREE.Vector3(0, 0, 0));
        }
        lineGeometry.setFromPoints(points);
        aimLine = new THREE.Line(lineGeometry, materials.aim);
        aimLine.frustumCulled = false;
        worldGroup.add(aimLine);

        aimMarker = new THREE.Mesh(new THREE.RingGeometry(13, 16, 32), materials.debugGreen);
        aimMarker.rotation.x = -Math.PI * 0.5;
        aimMarker.position.y = 1;
        worldGroup.add(aimMarker);

        var windGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, 0)
        ]);
        windArrow = new THREE.Line(windGeometry, materials.wind);
        windArrow.frustumCulled = false;
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
        state.player.debugRing = DEBUG_ENABLED ? createDebugRing(PLAYER_RADIUS, materials.debugGreen) : null;
        worldGroup.add(state.player.mesh);
        if (state.player.debugRing) {
            worldGroup.add(state.player.debugRing);
        }

        for (i = 0; i < state.enemies.length; i += 1) {
            state.enemies[i].mesh = createShipMesh(false);
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

    function updateShipPhysics(ship, rudder, sailDelta, dt) {
        var fx;
        var fz;
        var wx;
        var wz;
        var windDot;
        var thrust;
        var speed;
        var turnPower;
        var damping;

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
        thrust = Math.max(0, windDot) * ship.sail * state.windSpeed * 54 * ship.sailPowerMul;
        ship.vx += fx * thrust * dt;
        ship.vz += fz * thrust * dt;

        speed = length2(ship.vx, ship.vz);
        turnPower = (0.48 + clamp(speed / 90, 0, 0.75)) * (0.22 + ship.sail * 0.92);
        ship.heading += rudder * turnPower * dt;

        damping = Math.pow(0.986, dt * 60);
        ship.vx *= damping;
        ship.vz *= damping;
        ship.x += ship.vx * dt;
        ship.z += ship.vz * dt;

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
            desiredX = player.x - (player.x - enemy.x) * 0.18;
            desiredZ = player.z - (player.z - enemy.z) * 0.18;
            if (enemy.fireCooldown <= 0) {
                fireFromShip(enemy, player.x + player.vx * 0.9, player.z + player.vz * 0.9);
            }
        } else if (enemy.aiState === 'retreat') {
            desiredX = enemy.x + (enemy.x - player.x);
            desiredZ = enemy.z + (enemy.z - player.z);
        }

        dx = desiredX - enemy.x;
        dz = desiredZ - enemy.z;
        desiredHeading = Math.atan2(dx, dz);
        turnError = wrapAngle(desiredHeading - enemy.heading);
        rudder = clamp(turnError * 1.75, -1, 1);
        sailDelta = enemy.sail < 0.84 ? 0.5 : 0;

        updateShipPhysics(enemy, rudder, sailDelta, dt);
    }

    function fireFromShip(ship, targetX, targetZ) {
        var toX;
        var toZ;
        var len;
        var dirX;
        var dirZ;
        var fx;
        var fz;
        var rightX;
        var rightZ;
        var side;
        var startX;
        var startZ;
        var projectile;
        var mesh;
        var cooldown;

        if (ship.fireCooldown > 0 || ship.hp <= 0 || state.gameOver) {
            return false;
        }

        toX = targetX - ship.x;
        toZ = targetZ - ship.z;
        len = length2(toX, toZ);
        if (len < 1) {
            return false;
        }

        dirX = toX / len;
        dirZ = toZ / len;
        fx = forwardX(ship.heading);
        fz = forwardZ(ship.heading);
        rightX = fz;
        rightZ = -fx;
        side = (dirX * rightX + dirZ * rightZ) >= 0 ? 1 : -1;
        startX = ship.x + rightX * side * 19 + fx * 8;
        startZ = ship.z + rightZ * side * 19 + fz * 8;
        mesh = createProjectileMesh();

        projectile = {
            owner: ship.isPlayer ? 'player' : 'enemy',
            damage: ship.damage,
            x: startX,
            y: 19,
            z: startZ,
            vx: dirX * PROJECTILE_SPEED + ship.vx * 0.22,
            vy: 72,
            vz: dirZ * PROJECTILE_SPEED + ship.vz * 0.22,
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
            setMessage('Hit taken. Use wind angle and keep moving.', 2.2);
            return true;
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
            setMessage('Sail upgraded. Wind thrust increased.', 2.3);
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
            sailCurve = 0.44 + ship.sail * 0.66;
            sailMesh.scale.set(sailCurve, 1, 1);
            sailMesh.rotation.y = Math.sin(state.time * 2.2) * 0.055;
        }

        if (ship.debugRing) {
            ship.debugRing.position.set(ship.x, 1.1, ship.z);
            ship.debugRing.visible = DEBUG_ENABLED && ship.hp > 0;
        }
    }

    function syncMeshes() {
        var i;
        var p;
        var crate;
        var points;
        var attr;
        var t;
        var simX;
        var simY;
        var simZ;
        var dirX;
        var dirZ;
        var len;
        var vx;
        var vy;
        var vz;
        var windAttr;
        var windStart;
        var windEnd;
        var player;

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
        aimMarker.position.set(state.mouseWorldX, 1.2, state.mouseWorldZ);
        dirX = state.mouseWorldX - player.x;
        dirZ = state.mouseWorldZ - player.z;
        len = Math.max(1, length2(dirX, dirZ));
        dirX /= len;
        dirZ /= len;
        vx = dirX * PROJECTILE_SPEED + player.vx * 0.22;
        vy = 72;
        vz = dirZ * PROJECTILE_SPEED + player.vz * 0.22;
        simX = player.x;
        simY = 19;
        simZ = player.z;
        attr = aimLine.geometry.attributes.position;

        for (i = 0; i < attr.count; i += 1) {
            t = i / (attr.count - 1) * 1.8;
            points = {
                x: simX + vx * t,
                y: simY + vy * t - GRAVITY * t * t * 0.5,
                z: simZ + vz * t
            };
            attr.setXYZ(i, points.x, Math.max(1.5, points.y), points.z);
        }
        attr.needsUpdate = true;

        windStart = new THREE.Vector3(player.x, 70, player.z);
        windEnd = new THREE.Vector3(
            player.x + Math.sin(state.windAngle) * 140,
            70,
            player.z + Math.cos(state.windAngle) * 140
        );
        windAttr = windArrow.geometry.attributes.position;
        windAttr.setXYZ(0, windStart.x, windStart.y, windStart.z);
        windAttr.setXYZ(1, windEnd.x, windEnd.y, windEnd.z);
        windAttr.needsUpdate = true;
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
        if (hud.dock) {
            hud.dock.textContent = state.docked ? 'YES' : 'NO';
        }

        if (hud.message) {
            if (DEBUG_ENABLED) {
                debugText = 'DEBUG seed=' + state.seed + ' speed=' + speed + ' proj=' + state.projectiles.length + ' crates=' + state.crates.length;
                debugText += ' ai=' + state.enemies.map(function (enemy) { return enemy.aiState; }).join(',');
                hud.message.textContent = state.messageTimer > 0 ? state.messageText + ' | ' + debugText : debugText;
            } else {
                hud.message.textContent = state.messageTimer > 0 ? state.messageText : 'W/S sail. A/D rudder. Q/E camera. Mouse aim. LMB or Space fire. Dock near islands to sell cargo.';
            }
        }

        if (hud.pauseCard) {
            hud.pauseCard.hidden = !state.paused;
        }
        if (hud.pauseButton) {
            hud.pauseButton.textContent = state.paused ? 'Resume' : 'Pause';
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
        setMessage('New run. Use wind, broadside fire, and dock for upgrades.', 4);
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
            setMessage('Isometric 3D prototype loaded. W/S sail, A/D rudder, Q/E camera, LMB fire.', 5);
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
