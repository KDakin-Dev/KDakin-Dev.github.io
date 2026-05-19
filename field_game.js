(function () {
    "use strict";

    var CONFIG = {
        canvasDprMax: 2,

        portfolio: {
            minNodes: 48,
            maxNodes: 130,
            areaPerNode: 17000,
            linkDistanceDesktop: 146,
            linkDistanceMobile: 118,
            pointerRadius: 190,
            pointerPushRadius: 260,
            pointerForce: 170,
            pointerPushForce: 360
        },

        game: {
            playAreaLeft: 18,
            playAreaRight: 18,
            playAreaTop: 124,
            playAreaBottom: 26,

            initialCoreMass: 2.0,
            coreRadiusBase: 9.0,
            coreRadiusScale: 1.42,
            coreRadiusMax: 44.0,
            fusionRadiusBase: 78.0,
            fusionRadiusScale: 7.0,
            fusionRadiusMax: 245.0,

            spawnInterval: 1.15,
            spawnBurstBase: 7,
            spawnByMassScale: 2.3,
            spawnMax: 48,
            spawnSpeedBase: 11.0,
            spawnSpeedByCoreLevel: 0.65,

            fusionDistance: 64,
            fusionHeatSeconds: 0.82,
            fusionHeatDecay: 1.15,
            validPairAttractRange: 132,
            validPairAttractForce: 72,
            invalidPairRange: 86,
            invalidPairRepelForce: 135,

            pointerRadius: 205,
            pointerPushRadius: 310,
            pointerForce: 620,
            pointerPushForce: 1180,
            pointerCenterPower: 2.45,
            pointerMotionForce: 14.0,
            pulseForce: 390,

            orbitPullBase: 0.86,
            orbitPullControlDamp: 0.12,
            orbitNoise: 6.0,
            outerOrbitBias: 0.46,

            baseDamping: 0.989,
            maxSpeedBase: 62,
            maxSpeedPerLevel: 1.7,

            hotLinkAlpha: 0.72,
            previewAlpha: 0.16,
            absorbButtonUpdateInterval: 0.15,
            fusionHoldScaleInsideCore: 0.72,
            insideCoreSpeedScale: 0.58,
            insideCoreDamping: 0.965,
            insideCoreOrbitPullScale: 0.22,
            absorbClickRadiusBonus: 12,
            levelAdvancePulseMass: 0.0
        },

        nuclei: {
            CORE: { name: "CORE", mass: 9999, radius: 7.0, color: "143, 214, 255", absorb: 0 },
            H: { name: "H", mass: 1, radius: 2.7, color: "99, 166, 255", absorb: 0.6 },
            D: { name: "D", mass: 2, radius: 3.0, color: "126, 242, 176", absorb: 1.7 },
            He3: { name: "He3", mass: 3, radius: 3.4, color: "120, 210, 255", absorb: 3.4 },
            He4: { name: "He4", mass: 4, radius: 3.7, color: "255, 209, 102", absorb: 8.5 },
            Be8: { name: "Be8", mass: 8, radius: 4.3, color: "255, 160, 82", absorb: 13.0, unstable: true },
            C12: { name: "C12", mass: 12, radius: 4.7, color: "185, 148, 255", absorb: 32.0 },
            O16: { name: "O16", mass: 16, radius: 5.0, color: "255, 116, 116", absorb: 52.0 },
            Ne20: { name: "Ne20", mass: 20, radius: 5.3, color: "125, 190, 255", absorb: 74.0 },
            Mg24: { name: "Mg24", mass: 24, radius: 5.6, color: "120, 220, 190", absorb: 98.0 },
            Si28: { name: "Si28", mass: 28, radius: 5.9, color: "255, 145, 77", absorb: 130.0 },
            S32: { name: "S32", mass: 32, radius: 6.1, color: "255, 230, 96", absorb: 164.0 },
            Ar36: { name: "Ar36", mass: 36, radius: 6.3, color: "145, 210, 255", absorb: 202.0 },
            Ca40: { name: "Ca40", mass: 40, radius: 6.5, color: "160, 255, 180", absorb: 245.0 },
            Ti44: { name: "Ti44", mass: 44, radius: 6.7, color: "210, 180, 255", absorb: 292.0 },
            Cr48: { name: "Cr48", mass: 48, radius: 6.9, color: "190, 190, 210", absorb: 344.0 },
            Fe52: { name: "Fe52", mass: 52, radius: 7.1, color: "255, 120, 120", absorb: 402.0 },
            Fe56: { name: "Fe56", mass: 56, radius: 7.3, color: "255, 107, 139", absorb: 470.0 }
        },

        growthStages: [
            { level: 1, mass: 0, title: "Proton seed", hint: "Need: H + H -> D" },
            { level: 2, mass: 8, title: "Deuterium burn", hint: "Need: D + H -> He3" },
            { level: 3, mass: 22, title: "Helium-3 branch", hint: "Need: He3 + He3 -> He4" },
            { level: 4, mass: 52, title: "Alpha seed", hint: "Need: He4 + He4 -> Be8" },
            { level: 5, mass: 105, title: "Triple-alpha", hint: "Need: Be8 + He4 -> C12" },
            { level: 6, mass: 185, title: "Carbon capture", hint: "Need: C12 + He4 -> O16" },
            { level: 7, mass: 300, title: "Oxygen capture", hint: "Need: O16 + He4 -> Ne20" },
            { level: 8, mass: 460, title: "Neon capture", hint: "Need: Ne20 + He4 -> Mg24" },
            { level: 9, mass: 680, title: "Magnesium capture", hint: "Need: Mg24 + He4 -> Si28" },
            { level: 10, mass: 960, title: "Silicon chain", hint: "Need: alpha chain to Fe56" }
        ],

        reactions: [
            { a: "H", b: "H", product: "D", unlock: 1, label: "H + H -> D", heat: 0.58 },
            { a: "D", b: "H", product: "He3", unlock: 2, label: "D + H -> He3", heat: 0.64 },
            { a: "He3", b: "He3", product: "He4", unlock: 3, label: "He3 + He3 -> He4", heat: 0.76, spawn: ["H", "H"] },
            { a: "He4", b: "He4", product: "Be8", unlock: 4, label: "He4 + He4 -> Be8", heat: 0.84 },
            { a: "Be8", b: "He4", product: "C12", unlock: 5, label: "Be8 + He4 -> C12", heat: 0.72 },
            { a: "C12", b: "He4", product: "O16", unlock: 6, label: "C12 + He4 -> O16", heat: 0.88 },
            { a: "O16", b: "He4", product: "Ne20", unlock: 7, label: "O16 + He4 -> Ne20", heat: 0.92 },
            { a: "Ne20", b: "He4", product: "Mg24", unlock: 8, label: "Ne20 + He4 -> Mg24", heat: 0.96 },
            { a: "Mg24", b: "He4", product: "Si28", unlock: 9, label: "Mg24 + He4 -> Si28", heat: 1.00 },
            { a: "Si28", b: "He4", product: "S32", unlock: 10, label: "Si28 + He4 -> S32", heat: 1.04 },
            { a: "S32", b: "He4", product: "Ar36", unlock: 10, label: "S32 + He4 -> Ar36", heat: 1.08 },
            { a: "Ar36", b: "He4", product: "Ca40", unlock: 10, label: "Ar36 + He4 -> Ca40", heat: 1.12 },
            { a: "Ca40", b: "He4", product: "Ti44", unlock: 10, label: "Ca40 + He4 -> Ti44", heat: 1.16 },
            { a: "Ti44", b: "He4", product: "Cr48", unlock: 10, label: "Ti44 + He4 -> Cr48", heat: 1.20 },
            { a: "Cr48", b: "He4", product: "Fe52", unlock: 10, label: "Cr48 + He4 -> Fe52", heat: 1.24 },
            { a: "Fe52", b: "He4", product: "Fe56", unlock: 10, label: "Fe52 + He4 -> Fe56", heat: 1.30 }
        ]
    };

    var canvas = document.getElementById("field-canvas");
    var ctx = canvas.getContext("2d", { alpha: true });

    var dom = {
        metricNodes: document.getElementById("metric-nodes"),
        metricLinks: document.getElementById("metric-links"),
        metricInput: document.getElementById("metric-input"),
        metricScroll: document.getElementById("metric-scroll"),
        gameLevel: document.getElementById("game-level"),
        gameCollected: document.getElementById("game-collected"),
        gameTarget: document.getElementById("game-target"),
        gameLinks: document.getElementById("game-links"),
        gameNodes: document.getElementById("game-nodes"),
        gameInput: document.getElementById("game-input"),
        gameAtoms: document.getElementById("game-atoms"),
        gameProgressFill: document.getElementById("game-progress-fill"),
        gameMessage: document.querySelector(".game-message"),
        enterGameButton: document.getElementById("enter-game"),
        exitGameButton: document.getElementById("exit-game"),
        miniProbe: document.querySelector(".probe-dot"),
        miniOrbitBox: document.querySelector(".mini-orbit")
    };

    var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    var state = {
        width: 1,
        height: 1,
        dpr: 1,
        lastTime: 0,
        nodes: [],
        portfolioNodes: [],
        pulses: [],
        fusionHeat: Object.create(null),
        hotPairs: [],
        invalidPairs: [],
        pointer: {
            x: 0,
            y: 0,
            px: 0,
            py: 0,
            vx: 0,
            vy: 0,
            active: false,
            down: false,
            speed: 0
        },
        scroll01: 0,
        linkCount: 0,
        gameMode: false,
        coreMass: CONFIG.game.initialCoreMass,
        coreLevel: 1,
        nextNodeId: 1,
        spawnTimer: 0,
        absorbUiTimer: 0,
        levelFlash: 0,
        lastReaction: "READY",
        absorbRoot: null,
        recipeRoot: null
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function pad3(value) {
        return String(Math.floor(value)).padStart(3, "0").slice(-3);
    }

    function pad2(value) {
        return String(Math.floor(value)).padStart(2, "0");
    }

    function distSq(a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return dx * dx + dy * dy;
    }

    function getNucleus(name) {
        return CONFIG.nuclei[name] || CONFIG.nuclei.H;
    }

    function getCore() {
        return state.nodes.length > 0 ? state.nodes[0] : null;
    }

    function getGameBounds() {
        return {
            left: CONFIG.game.playAreaLeft,
            right: state.width - CONFIG.game.playAreaRight,
            top: CONFIG.game.playAreaTop,
            bottom: state.height - CONFIG.game.playAreaBottom
        };
    }

    function coreRadius() {
        return clamp(
            CONFIG.game.coreRadiusBase + Math.sqrt(state.coreMass) * CONFIG.game.coreRadiusScale,
            CONFIG.game.coreRadiusBase,
            CONFIG.game.coreRadiusMax
        );
    }

    function fusionRadius() {
        return clamp(
            CONFIG.game.fusionRadiusBase + Math.sqrt(state.coreMass) * CONFIG.game.fusionRadiusScale,
            CONFIG.game.fusionRadiusBase,
            CONFIG.game.fusionRadiusMax
        );
    }

    function getCoreLevel() {
        var level = 1;
        for (var i = 0; i < CONFIG.growthStages.length; i += 1) {
            if (state.coreMass >= CONFIG.growthStages[i].mass) {
                level = CONFIG.growthStages[i].level;
            }
        }
        return level;
    }

    function getGrowthStage() {
        var level = getCoreLevel();
        return CONFIG.growthStages[Math.min(level - 1, CONFIG.growthStages.length - 1)];
    }

    function getNextStageMass() {
        var level = getCoreLevel();
        for (var i = 0; i < CONFIG.growthStages.length; i += 1) {
            if (CONFIG.growthStages[i].level === level + 1) {
                return CONFIG.growthStages[i].mass;
            }
        }
        return Math.ceil(state.coreMass + 250);
    }

    function resize() {
        state.dpr = clamp(window.devicePixelRatio || 1, 1, CONFIG.canvasDprMax);
        state.width = Math.max(1, window.innerWidth);
        state.height = Math.max(1, window.innerHeight);
        canvas.width = Math.floor(state.width * state.dpr);
        canvas.height = Math.floor(state.height * state.dpr);
        canvas.style.width = state.width + "px";
        canvas.style.height = state.height + "px";
        ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

        if (state.gameMode) {
            keepGameInsideBounds();
        } else {
            rebuildPortfolioNodes();
        }
    }

    function wantedPortfolioNodeCount() {
        var area = state.width * state.height;
        return clamp(
            Math.floor(area / CONFIG.portfolio.areaPerNode),
            CONFIG.portfolio.minNodes,
            CONFIG.portfolio.maxNodes
        );
    }

    function getOrbitCenter() {
        return {
            x: state.width * 0.5,
            y: state.height * 0.48
        };
    }

    function getOrbitParams(index, scale) {
        var group = index % 5;
        var minDim = Math.min(state.width, state.height);
        return {
            group: group,
            a: minDim * (0.30 + group * 0.075) * (1.54 - group * 0.055) * scale,
            b: minDim * (0.115 + group * 0.045) * scale,
            rot: -0.42 + group * 0.29,
            speed: (group % 2 === 0 ? 1 : -1) * rand(0.10, 0.24) * (1 + group * 0.08)
        };
    }

    function orbitPoint(cx, cy, a, b, rot, t) {
        var x = Math.cos(t) * a;
        var y = Math.sin(t) * b;
        var c = Math.cos(rot);
        var s = Math.sin(rot);
        return {
            x: cx + x * c - y * s,
            y: cy + x * s + y * c
        };
    }

    function createPortfolioNode(index) {
        var center = getOrbitCenter();
        var params = getOrbitParams(index, 1.0);
        var phase = rand(0, Math.PI * 2);
        var point = orbitPoint(center.x, center.y, params.a, params.b, params.rot, phase);
        return {
            id: index,
            x: point.x,
            y: point.y,
            a: params.a,
            b: params.b,
            rot: params.rot,
            speed: params.speed,
            orbitGroup: params.group,
            phase: phase,
            ox: rand(-5, 5),
            oy: rand(-5, 5),
            ovx: 0,
            ovy: 0,
            size: rand(1.1, 2.7),
            nucleus: CONFIG.nuclei.H
        };
    }

    function rebuildPortfolioNodes() {
        var count = wantedPortfolioNodeCount();
        if (state.portfolioNodes.length > count) {
            state.portfolioNodes.length = count;
        }
        while (state.portfolioNodes.length < count) {
            state.portfolioNodes.push(createPortfolioNode(state.portfolioNodes.length));
        }
        state.nodes = state.portfolioNodes;
        if (dom.metricNodes) dom.metricNodes.textContent = pad3(state.nodes.length);
    }

    function createGameNode(id, nucleusName, x, y, core) {
        var nucleus = getNucleus(nucleusName);
        var bounds = getGameBounds();
        var minDim = Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top);
        var speed = CONFIG.game.spawnSpeedBase + getCoreLevel() * CONFIG.game.spawnSpeedByCoreLevel;
        var speedScale = 1 / Math.pow(Math.max(1, nucleus.mass), 0.36);
        var orbitScale = core ? 0 : rand(0.36, CONFIG.game.outerOrbitBias);
        var orbitA = minDim * orbitScale;
        var orbitB = orbitA * rand(0.48, 0.78);
        var orbitSpeed = (Math.random() < 0.5 ? -1 : 1) * rand(0.28, 0.62) / Math.pow(Math.max(1, nucleus.mass), 0.30);

        return {
            id: id,
            nucleus: nucleus,
            nucleusName: nucleusName,
            x: x,
            y: y,
            vx: core ? 0 : rand(-speed, speed) * speedScale,
            vy: core ? 0 : rand(-speed, speed) * speedScale,
            core: core,
            radius: nucleus.radius,
            mass: nucleus.mass,
            pulse: rand(0, Math.PI * 2),
            orbitA: orbitA,
            orbitB: orbitB,
            orbitRot: rand(-0.65, 0.65),
            orbitPhase: rand(0, Math.PI * 2),
            orbitSpeed: orbitSpeed,
            age: 0,
            unstable: !!nucleus.unstable
        };
    }

    function resetCoreGame() {
        var bounds = getGameBounds();
        var cx = (bounds.left + bounds.right) * 0.5;
        var cy = (bounds.top + bounds.bottom) * 0.5;

        state.nodes = [];
        state.pulses = [];
        state.fusionHeat = Object.create(null);
        state.hotPairs = [];
        state.invalidPairs = [];
        state.coreMass = CONFIG.game.initialCoreMass;
        state.coreLevel = 1;
        state.nextNodeId = 1;
        state.spawnTimer = 0;
        state.absorbUiTimer = 0;
        state.levelFlash = 0;
        state.lastReaction = "Feed H into the core";

        state.nodes.push(createGameNode(0, "CORE", cx, cy, true));

        var initialCount = CONFIG.game.spawnBurstBase;
        for (var i = 0; i < initialCount; i += 1) {
            spawnNucleus("H", null);
        }

        updateAbsorbButtons(true);
        updateGameStats();
    }

    function particleCapacity() {
        return clamp(
            Math.floor(CONFIG.game.spawnBurstBase + Math.sqrt(state.coreMass) * CONFIG.game.spawnByMassScale),
            CONFIG.game.spawnBurstBase,
            CONFIG.game.spawnMax
        );
    }

    function countNonCoreNodes() {
        var count = 0;
        for (var i = 0; i < state.nodes.length; i += 1) {
            if (!state.nodes[i].core) count += 1;
        }
        return count;
    }

    function pickSpawnType() {
        var level = getCoreLevel();
        var roll = Math.random();

        if (level >= 5 && roll > 0.965) return "He4";
        if (level >= 3 && roll > 0.93) return "D";
        return "H";
    }

    function spawnNucleus(nucleusName, origin) {
        var bounds = getGameBounds();
        var core = getCore();
        var cx = core ? core.x : (bounds.left + bounds.right) * 0.5;
        var cy = core ? core.y : (bounds.top + bounds.bottom) * 0.5;
        var x;
        var y;
        var angle;
        var radius;

        if (origin) {
            angle = rand(0, Math.PI * 2);
            x = origin.x + Math.cos(angle) * rand(18, 48);
            y = origin.y + Math.sin(angle) * rand(18, 48);
        } else {
            angle = rand(0, Math.PI * 2);
            radius = Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top) * rand(0.42, 0.50);
            x = cx + Math.cos(angle) * radius;
            y = cy + Math.sin(angle) * radius;
        }

        x = clamp(x, bounds.left + 44, bounds.right - 44);
        y = clamp(y, bounds.top + 44, bounds.bottom - 44);

        var node = createGameNode(state.nextNodeId, nucleusName, x, y, false);
        state.nextNodeId += 1;

        if (origin) {
            var dx = node.x - origin.x;
            var dy = node.y - origin.y;
            var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            var push = 52 / Math.pow(Math.max(1, node.mass), 0.32);
            node.vx = (dx / d) * push + rand(-8, 8);
            node.vy = (dy / d) * push + rand(-8, 8);
        }

        state.nodes.push(node);
        return node;
    }

    function keepGameInsideBounds() {
        var bounds = getGameBounds();
        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            var margin = 22 + n.radius;
            n.x = clamp(n.x, bounds.left + margin, bounds.right - margin);
            n.y = clamp(n.y, bounds.top + margin, bounds.bottom - margin);
        }
    }

    function updateScroll() {
        var doc = document.documentElement;
        var maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        state.scroll01 = state.gameMode ? 0 : clamp(window.scrollY / maxScroll, 0, 1);
        if (dom.metricScroll) dom.metricScroll.textContent = state.scroll01.toFixed(2);
    }

    function setPointer(x, y, active) {
        var p = state.pointer;
        p.px = p.x;
        p.py = p.y;
        p.x = x;
        p.y = y;
        p.vx = p.x - p.px;
        p.vy = p.y - p.py;
        p.active = active;
        p.speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    }

    function addPulse(x, y, power) {
        state.pulses.push({
            x: x,
            y: y,
            r: 0,
            life: 1,
            power: power
        });
        if (state.pulses.length > 12) {
            state.pulses.shift();
        }
    }

    function enterGameMode() {
        state.gameMode = true;
        document.body.classList.add("game-mode");
        resetCoreGame();

        if (dom.gameMessage) {
            dom.gameMessage.textContent = "Push H from the outer orbit into the core zone. Fuse nuclei, then absorb products manually. Heavier products feed the core much better than raw H.";
        }

        ensureRecipeUi();
        hideAbsorbUi();

        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen().catch(function () {});
        }
    }

    function exitGameMode() {
        state.gameMode = false;
        document.body.classList.remove("game-mode");
        state.nodes = state.portfolioNodes;
        state.fusionHeat = Object.create(null);
        state.hotPairs = [];
        state.invalidPairs = [];
        hideAbsorbUi();
        hideRecipeUi();
        rebuildPortfolioNodes();
        updateGameStats();

        if (document.fullscreenElement && document.exitFullscreen) {
            document.exitFullscreen().catch(function () {});
        }
    }

    function applyPortfolioPointerForce(node, baseX, baseY, applyForce) {
        if (state.pointer.active) {
            var px = baseX - state.pointer.x;
            var py = baseY - state.pointer.y;
            var pdSq = px * px + py * py + 140;
            var pd = Math.sqrt(pdSq);
            var radius = state.pointer.down ? CONFIG.portfolio.pointerPushRadius : CONFIG.portfolio.pointerRadius;
            if (pd < radius) {
                var force = (1 - pd / radius) * (state.pointer.down ? CONFIG.portfolio.pointerPushForce : CONFIG.portfolio.pointerForce);
                applyForce((px / pd) * force, (py / pd) * force);
            }
        }

        for (var i = 0; i < state.pulses.length; i += 1) {
            var pulse = state.pulses[i];
            var qx = baseX - pulse.x;
            var qy = baseY - pulse.y;
            var qd = Math.sqrt(qx * qx + qy * qy) + 0.001;
            var band = Math.abs(qd - pulse.r);
            if (band < 90) {
                var push = (1 - band / 90) * pulse.life * pulse.power;
                applyForce((qx / qd) * push, (qy / qd) * push);
            }
        }
    }

    function updatePortfolioNode(node, dt, time) {
        var margin = 26 + node.size;
        var center = getOrbitCenter();
        var rot = node.rot + Math.sin(time * 0.00006 + node.orbitGroup) * 0.035;
        var t = node.phase + time * 0.001 * node.speed;
        var target = orbitPoint(center.x, center.y, node.a, node.b, rot, t);

        var ax = -node.ox * 1.8;
        var ay = -node.oy * 1.8;

        applyPortfolioPointerForce(node, target.x, target.y, function (fx, fy) {
            ax += fx;
            ay += fy;
        });

        node.ovx += ax * dt;
        node.ovy += ay * dt;
        node.ovx *= Math.pow(0.90, dt * 60);
        node.ovy *= Math.pow(0.90, dt * 60);
        node.ox += node.ovx * dt;
        node.oy += node.ovy * dt;

        var maxOffset = state.pointer.down ? 120 : 72;
        var offsetLen = Math.sqrt(node.ox * node.ox + node.oy * node.oy);
        if (offsetLen > maxOffset) {
            node.ox = node.ox / offsetLen * maxOffset;
            node.oy = node.oy / offsetLen * maxOffset;
        }

        node.x = clamp(target.x + node.ox, margin, state.width - margin);
        node.y = clamp(target.y + node.oy, margin, state.height - margin);
    }

    function applyGamePointerForces(dt) {
        if (!state.pointer.active) return;

        var radius = state.pointer.down ? CONFIG.game.pointerPushRadius : CONFIG.game.pointerRadius;
        var strength = state.pointer.down ? CONFIG.game.pointerPushForce : CONFIG.game.pointerForce;

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            if (n.core) continue;

            var dx = n.x - state.pointer.x;
            var dy = n.y - state.pointer.y;
            var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            if (d > radius) continue;

            var t = 1 - d / radius;
            var falloff = Math.pow(t, CONFIG.game.pointerCenterPower);
            var massScale = Math.pow(Math.max(1, n.mass), 0.36);
            var force = strength * falloff / massScale;

            n.vx += (dx / d) * force * dt;
            n.vy += (dy / d) * force * dt;

            if (state.pointer.speed > 0.4) {
                n.vx += state.pointer.vx * CONFIG.game.pointerMotionForce * falloff * dt / massScale;
                n.vy += state.pointer.vy * CONFIG.game.pointerMotionForce * falloff * dt / massScale;
            }
        }
    }

    function applyPulseForces(dt) {
        for (var p = state.pulses.length - 1; p >= 0; p -= 1) {
            var pulse = state.pulses[p];

            for (var i = 0; i < state.nodes.length; i += 1) {
                var n = state.nodes[i];
                if (n.core) continue;

                var dx = n.x - pulse.x;
                var dy = n.y - pulse.y;
                var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
                var band = Math.abs(d - pulse.r);
                if (band > 92) continue;

                var falloff = (1 - band / 92) * pulse.life;
                var massScale = Math.pow(Math.max(1, n.mass), 0.38);
                var force = pulse.power * falloff / massScale;
                n.vx += (dx / d) * force * dt;
                n.vy += (dy / d) * force * dt;
            }
        }
    }

    function applyOrbitForces(dt, time) {
        var core = getCore();
        if (!core) return;

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            if (n.core) continue;

            var rot = n.orbitRot + Math.sin(time * 0.00004 + n.pulse) * 0.06;
            var t = n.orbitPhase + time * 0.001 * n.orbitSpeed;
            var target = orbitPoint(core.x, core.y, n.orbitA, n.orbitB, rot, t);
            var dx = target.x - n.x;
            var dy = target.y - n.y;

            var controlDamp = 1.0;
            if (state.pointer.active) {
                var pdx = n.x - state.pointer.x;
                var pdy = n.y - state.pointer.y;
                var pd = Math.sqrt(pdx * pdx + pdy * pdy);
                var radius = state.pointer.down ? CONFIG.game.pointerPushRadius : CONFIG.game.pointerRadius;
                if (pd < radius) {
                    var f = 1 - pd / radius;
                    controlDamp = 1 - (1 - CONFIG.game.orbitPullControlDamp) * f;
                }
            }

            if (isInsideFusionZone(n)) {
                controlDamp *= CONFIG.game.insideCoreOrbitPullScale;
            }

            var pull = CONFIG.game.orbitPullBase * controlDamp / Math.pow(Math.max(1, n.mass), 0.20);
            n.vx += dx * pull * dt;
            n.vy += dy * pull * dt;

            var noise = CONFIG.game.orbitNoise / Math.pow(Math.max(1, n.mass), 0.45);
            n.vx += Math.sin(time * 0.0011 + n.pulse) * noise * dt;
            n.vy += Math.cos(time * 0.0009 + n.pulse) * noise * dt;
        }
    }

    function reactionKey(a, b) {
        return a.id < b.id ? a.id + ":" + b.id : b.id + ":" + a.id;
    }

    function findReaction(a, b) {
        if (a.core || b.core) return null;

        var level = getCoreLevel();
        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            var r = CONFIG.reactions[i];
            if (r.unlock > level) continue;
            if ((r.a === a.nucleusName && r.b === b.nucleusName) || (r.a === b.nucleusName && r.b === a.nucleusName)) {
                return r;
            }
        }

        return null;
    }

    function anyFutureReaction(a, b) {
        if (a.core || b.core) return false;

        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            var r = CONFIG.reactions[i];
            if ((r.a === a.nucleusName && r.b === b.nucleusName) || (r.a === b.nucleusName && r.b === a.nucleusName)) {
                return true;
            }
        }

        return false;
    }

    function isInsideFusionZone(n) {
        var core = getCore();
        if (!core) return false;

        var dx = n.x - core.x;
        var dy = n.y - core.y;
        var r = fusionRadius();
        return dx * dx + dy * dy <= r * r;
    }

    function applyPairForcesAndFusion(dt) {
        var activeKeys = Object.create(null);
        state.hotPairs = [];
        state.invalidPairs = [];
        state.linkCount = 0;

        for (var i = 1; i < state.nodes.length; i += 1) {
            var a = state.nodes[i];

            for (var j = i + 1; j < state.nodes.length; j += 1) {
                var b = state.nodes[j];
                var dx = b.x - a.x;
                var dy = b.y - a.y;
                var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
                var nx = dx / d;
                var ny = dy / d;
                var reaction = findReaction(a, b);
                var inZone = isInsideFusionZone(a) && isInsideFusionZone(b);

                if (reaction && d < CONFIG.game.validPairAttractRange) {
                    var attract01 = 1 - d / CONFIG.game.validPairAttractRange;
                    var attract = CONFIG.game.validPairAttractForce * attract01 * (inZone ? 1.35 : 0.55);

                    a.vx += nx * attract * dt / Math.pow(Math.max(1, a.mass), 0.42);
                    a.vy += ny * attract * dt / Math.pow(Math.max(1, a.mass), 0.42);
                    b.vx -= nx * attract * dt / Math.pow(Math.max(1, b.mass), 0.42);
                    b.vy -= ny * attract * dt / Math.pow(Math.max(1, b.mass), 0.42);
                }

                if (reaction && d < CONFIG.game.fusionDistance + a.radius + b.radius) {
                    var key = reactionKey(a, b);
                    var heatTarget = (reaction.heat || CONFIG.game.fusionHeatSeconds) * CONFIG.game.fusionHoldScaleInsideCore;

                    activeKeys[key] = true;
                    state.linkCount += 1;

                    if (!state.fusionHeat[key]) {
                        state.fusionHeat[key] = { heat: 0, label: reaction.label };
                    }

                    if (inZone) {
                        state.fusionHeat[key].heat += dt;
                    } else {
                        state.fusionHeat[key].heat = Math.max(0, state.fusionHeat[key].heat - CONFIG.game.fusionHeatDecay * dt);
                    }

                    var heat01 = clamp(state.fusionHeat[key].heat / heatTarget, 0, 1);
                    state.hotPairs.push({
                        a: a,
                        b: b,
                        reaction: reaction,
                        heat01: heat01,
                        inZone: inZone
                    });

                    if (state.fusionHeat[key].heat >= heatTarget) {
                        performFusion(a, b, reaction);
                        return;
                    }
                } else if (inZone && !reaction && d < CONFIG.game.invalidPairRange && !anyFutureReaction(a, b)) {
                    var repel01 = 1 - d / CONFIG.game.invalidPairRange;
                    var repel = CONFIG.game.invalidPairRepelForce * repel01;

                    a.vx -= nx * repel * dt / Math.pow(Math.max(1, a.mass), 0.42);
                    a.vy -= ny * repel * dt / Math.pow(Math.max(1, a.mass), 0.42);
                    b.vx += nx * repel * dt / Math.pow(Math.max(1, b.mass), 0.42);
                    b.vy += ny * repel * dt / Math.pow(Math.max(1, b.mass), 0.42);

                    state.invalidPairs.push({ a: a, b: b, alpha: repel01 });
                }
            }
        }

        Object.keys(state.fusionHeat).forEach(function (key) {
            if (!activeKeys[key]) {
                state.fusionHeat[key].heat -= CONFIG.game.fusionHeatDecay * dt;
                if (state.fusionHeat[key].heat <= 0) {
                    delete state.fusionHeat[key];
                }
            }
        });
    }

    function removeNode(node) {
        for (var i = state.nodes.length - 1; i >= 0; i -= 1) {
            if (state.nodes[i].id === node.id) {
                state.nodes.splice(i, 1);
                return;
            }
        }
    }

    function performFusion(a, b, reaction) {
        var x = (a.x + b.x) * 0.5;
        var y = (a.y + b.y) * 0.5;
        var vx = (a.vx + b.vx) * 0.35;
        var vy = (a.vy + b.vy) * 0.35;
        var origin = { x: x, y: y };

        removeNode(a);
        removeNode(b);

        var product = createGameNode(state.nextNodeId, reaction.product, x, y, false);
        state.nextNodeId += 1;
        product.vx = vx + rand(-8, 8);
        product.vy = vy + rand(-8, 8);
        product.age = 0;
        state.nodes.push(product);

        if (reaction.spawn) {
            for (var i = 0; i < reaction.spawn.length; i += 1) {
                spawnNucleus(reaction.spawn[i], origin);
            }
        }

        state.fusionHeat = Object.create(null);
        state.hotPairs = [];
        state.lastReaction = reaction.label;
        addPulse(x, y, 170);
        updateAbsorbButtons(true);
    }

    function absorbNode(node) {
        if (!node || node.core) return;

        var nucleus = getNucleus(node.nucleusName);
        var oldLevel = getCoreLevel();
        var value = nucleus.absorb || nucleus.mass || 1;

        state.coreMass += value;
        state.lastReaction = "Absorbed " + nucleus.name + " +" + value.toFixed(1);
        removeNode(node);
        addPulse(node.x, node.y, 130 + Math.min(240, value * 1.5));

        var newLevel = getCoreLevel();
        if (newLevel > oldLevel) {
            state.levelFlash = 1.0;
            state.lastReaction = "Core stage " + newLevel + " unlocked";
        }

        updateAbsorbButtons(true);
        updateGameStats();
    }

    function getAbsorbableNodesByType() {
        var groups = Object.create(null);

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            if (n.core) continue;
            if (!isInsideFusionZone(n)) continue;

            if (!groups[n.nucleusName]) {
                groups[n.nucleusName] = [];
            }
            groups[n.nucleusName].push(n);
        }

        return groups;
    }

    function findAbsorbNodeAt(x, y) {
        if (!state.gameMode) return null;

        var best = null;
        var bestSq = Infinity;

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            if (n.core) continue;
            if (!isInsideFusionZone(n)) continue;

            var dx = x - n.x;
            var dy = y - n.y;
            var radius = n.radius + CONFIG.game.absorbClickRadiusBonus;
            var dSq = dx * dx + dy * dy;

            if (dSq <= radius * radius && dSq < bestSq) {
                best = n;
                bestSq = dSq;
            }
        }

        return best;
    }

    function tryAbsorbAtPointer() {
        var n = findAbsorbNodeAt(state.pointer.x, state.pointer.y);
        if (!n) return false;
        absorbNode(n);
        return true;
    }

    function ensureRecipeUi() {
        if (state.recipeRoot) {
            state.recipeRoot.style.display = state.gameMode ? "block" : "none";
            return;
        }

        var root = document.createElement("div");
        root.id = "fusion-recipe-hud";
        root.style.position = "fixed";
        root.style.left = "50%";
        root.style.top = "96px";
        root.style.transform = "translateX(-50%)";
        root.style.zIndex = "12";
        root.style.display = "none";
        root.style.minWidth = "min(560px, calc(100vw - 36px))";
        root.style.padding = "12px 16px";
        root.style.border = "1px solid rgba(255, 209, 102, 0.32)";
        root.style.borderRadius = "18px";
        root.style.background = "rgba(5, 10, 16, 0.78)";
        root.style.backdropFilter = "blur(14px)";
        root.style.boxShadow = "0 16px 60px rgba(0, 0, 0, 0.36)";
        root.style.color = "rgba(215, 227, 244, 0.96)";
        root.style.font = "800 13px SFMono-Regular, Consolas, monospace";
        root.style.letterSpacing = "0.06em";
        root.style.textAlign = "center";
        root.style.pointerEvents = "none";

        document.body.appendChild(root);
        state.recipeRoot = root;
    }

    function hideRecipeUi() {
        if (state.recipeRoot) {
            state.recipeRoot.style.display = "none";
        }
    }

    function updateRecipeUi() {
        if (!state.gameMode) {
            hideRecipeUi();
            return;
        }

        ensureRecipeUi();
        var stage = getGrowthStage();
        var nextMass = getNextStageMass();
        var massText = state.coreMass.toFixed(1) + " / " + nextMass.toFixed(0);
        state.recipeRoot.textContent = stage.hint + " | Core mass: " + massText + " | Click nucleus inside zone to absorb";
        state.recipeRoot.style.display = "block";
    }

    function ensureAbsorbUi() {
        if (state.absorbRoot) {
            state.absorbRoot.style.display = state.gameMode ? "flex" : "none";
            return;
        }

        var root = document.createElement("div");
        root.id = "absorb-controls";
        root.style.position = "fixed";
        root.style.right = "18px";
        root.style.bottom = "18px";
        root.style.zIndex = "12";
        root.style.display = "none";
        root.style.flexDirection = "column";
        root.style.gap = "8px";
        root.style.pointerEvents = "auto";
        root.style.maxWidth = "min(360px, calc(100vw - 36px))";

        document.body.appendChild(root);
        state.absorbRoot = root;
    }

    function hideAbsorbUi() {
        if (state.absorbRoot) {
            state.absorbRoot.style.display = "none";
        }
    }

    function makeAbsorbButton(typeName, count) {
        var nucleus = getNucleus(typeName);
        var button = document.createElement("button");
        button.type = "button";
        button.textContent = "Absorb " + nucleus.name + " +" + (nucleus.absorb || nucleus.mass).toFixed(1) + " x" + count;
        button.style.minHeight = "42px";
        button.style.padding = "0 14px";
        button.style.border = "1px solid rgba(" + nucleus.color + ", 0.42)";
        button.style.borderRadius = "14px";
        button.style.background = "rgba(5, 10, 16, 0.78)";
        button.style.color = "rgba(215, 227, 244, 0.94)";
        button.style.cursor = "pointer";
        button.style.font = "700 12px SFMono-Regular, Consolas, monospace";
        button.style.letterSpacing = "0.06em";
        button.style.boxShadow = "0 10px 38px rgba(0, 0, 0, 0.34)";

        button.addEventListener("click", function () {
            var groups = getAbsorbableNodesByType();
            var list = groups[typeName] || [];
            if (list.length <= 0) return;

            var core = getCore();
            var best = list[0];
            var bestSq = core ? distSq(best, core) : 0;

            for (var i = 1; i < list.length; i += 1) {
                var dSq = core ? distSq(list[i], core) : 0;
                if (dSq < bestSq) {
                    bestSq = dSq;
                    best = list[i];
                }
            }

            absorbNode(best);
        });

        return button;
    }

    function updateAbsorbButtons(force) {
        hideAbsorbUi();
        return;

        ensureAbsorbUi();

        if (!state.gameMode) {
            hideAbsorbUi();
            return;
        }

        if (!force && state.absorbUiTimer > 0) return;
        state.absorbUiTimer = CONFIG.game.absorbButtonUpdateInterval;

        var root = state.absorbRoot;
        while (root.firstChild) {
            root.removeChild(root.firstChild);
        }

        var groups = getAbsorbableNodesByType();
        var names = Object.keys(groups).sort(function (a, b) {
            return (getNucleus(b).absorb || 0) - (getNucleus(a).absorb || 0);
        });

        if (names.length <= 0) {
            var empty = document.createElement("div");
            empty.textContent = "No nuclei in core zone";
            empty.style.padding = "12px 14px";
            empty.style.border = "1px solid rgba(99, 166, 255, 0.18)";
            empty.style.borderRadius = "14px";
            empty.style.background = "rgba(5, 10, 16, 0.62)";
            empty.style.color = "rgba(139, 155, 176, 0.9)";
            empty.style.font = "700 12px SFMono-Regular, Consolas, monospace";
            root.appendChild(empty);
        } else {
            for (var i = 0; i < names.length; i += 1) {
                root.appendChild(makeAbsorbButton(names[i], groups[names[i]].length));
            }
        }

        root.style.display = "flex";
    }

    function updateSpawner(dt) {
        var capacity = particleCapacity();
        if (countNonCoreNodes() >= capacity) return;

        state.spawnTimer -= dt;
        if (state.spawnTimer > 0) return;

        state.spawnTimer = Math.max(0.38, CONFIG.game.spawnInterval - Math.sqrt(state.coreMass) * 0.014);
        spawnNucleus(pickSpawnType(), null);
    }

    function integrateGameNodes(dt) {
        var bounds = getGameBounds();

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];

            if (n.core) {
                n.x = (bounds.left + bounds.right) * 0.5;
                n.y = (bounds.top + bounds.bottom) * 0.5;
                n.vx = 0;
                n.vy = 0;
                continue;
            }

            n.age += dt;
            var insideCoreZone = isInsideFusionZone(n);
            var damping = insideCoreZone ? CONFIG.game.insideCoreDamping : CONFIG.game.baseDamping;
            n.vx *= Math.pow(damping, dt * 60);
            n.vy *= Math.pow(damping, dt * 60);

            var maxSpeed = (CONFIG.game.maxSpeedBase + getCoreLevel() * CONFIG.game.maxSpeedPerLevel) / Math.pow(Math.max(1, n.mass), 0.16);
            if (insideCoreZone) {
                maxSpeed *= CONFIG.game.insideCoreSpeedScale;
            }
            var speed = Math.sqrt(n.vx * n.vx + n.vy * n.vy);
            if (speed > maxSpeed) {
                n.vx = n.vx / speed * maxSpeed;
                n.vy = n.vy / speed * maxSpeed;
            }

            n.x += n.vx * dt;
            n.y += n.vy * dt;

            var margin = 22 + n.radius;
            if (n.x < bounds.left + margin) {
                n.x = bounds.left + margin;
                n.vx = Math.abs(n.vx) * 0.78;
            }
            if (n.x > bounds.right - margin) {
                n.x = bounds.right - margin;
                n.vx = -Math.abs(n.vx) * 0.78;
            }
            if (n.y < bounds.top + margin) {
                n.y = bounds.top + margin;
                n.vy = Math.abs(n.vy) * 0.78;
            }
            if (n.y > bounds.bottom - margin) {
                n.y = bounds.bottom - margin;
                n.vy = -Math.abs(n.vy) * 0.78;
            }
        }
    }

    function decayUnstableNuclei() {
        for (var i = state.nodes.length - 1; i >= 0; i -= 1) {
            var n = state.nodes[i];
            if (!n.unstable) continue;
            if (n.age < 10.0) continue;

            var origin = { x: n.x, y: n.y };
            removeNode(n);
            spawnNucleus("He4", origin);
            spawnNucleus("He4", origin);
            state.lastReaction = "Be8 decayed";
            addPulse(origin.x, origin.y, 110);
        }
    }

    function updateGamePhysics(dt, time) {
        state.absorbUiTimer -= dt;
        state.levelFlash = Math.max(0, state.levelFlash - dt * 1.8);

        updateSpawner(dt);
        applyOrbitForces(dt, time);
        applyGamePointerForces(dt);
        applyPulseForces(dt);
        applyPairForcesAndFusion(dt);
        integrateGameNodes(dt);
        decayUnstableNuclei();
        updateAbsorbButtons(false);
    }

    function drawGameBackdrop() {
        if (!state.gameMode) return;

        var level = getCoreLevel();
        var darkness = clamp(0.62 - level * 0.026, 0.32, 0.62);

        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, " + darkness.toFixed(4) + ")";
        ctx.fillRect(0, 0, state.width, state.height);
        ctx.restore();
    }

    function drawGrid(time) {
        var grid = state.gameMode ? 70 : 80;
        var offset = (time * 0.006) % grid;
        ctx.save();
        ctx.globalAlpha = state.gameMode ? 0.5 : 0.34;
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(99, 166, 255, 0.055)";
        ctx.beginPath();

        var x;
        var y;

        for (x = -grid + offset; x < state.width + grid; x += grid) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x + state.scroll01 * 50, state.height);
        }
        for (y = -grid + offset; y < state.height + grid; y += grid) {
            ctx.moveTo(0, y);
            ctx.lineTo(state.width, y + state.scroll01 * 30);
        }

        ctx.stroke();
        ctx.restore();
    }

    function drawBounds() {
        if (!state.gameMode) return;

        var bounds = getGameBounds();
        ctx.save();
        ctx.strokeStyle = "rgba(143, 214, 255, 0.22)";
        ctx.lineWidth = 1;
        ctx.setLineDash([9, 10]);
        ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
        ctx.restore();
    }

    function drawCoreZone() {
        if (!state.gameMode) return;

        var core = getCore();
        if (!core) return;

        var fr = fusionRadius();
        var cr = coreRadius();
        var level = getCoreLevel();
        var glow = clamp(0.10 + level * 0.035 + Math.sqrt(state.coreMass) * 0.006, 0.12, 0.48);

        ctx.save();

        var gradient = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, fr);
        gradient.addColorStop(0, "rgba(255, 209, 102, " + glow.toFixed(4) + ")");
        gradient.addColorStop(0.32, "rgba(99, 166, 255, 0.075)");
        gradient.addColorStop(1, "rgba(99, 166, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(core.x, core.y, fr, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 209, 102, 0.22)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.arc(core.x, core.y, fr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(core.x, core.y, cr, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 209, 102, 0.62)";
        ctx.shadowColor = "rgba(255, 209, 102, 0.58)";
        ctx.shadowBlur = 26 + level * 4;
        ctx.fill();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 245, 190, 0.64)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.fillStyle = "rgba(5, 10, 16, 0.78)";
        ctx.font = "10px SFMono-Regular, Consolas, monospace";
        ctx.textAlign = "center";
        ctx.fillText("CORE", core.x, core.y + 3);

        ctx.restore();
    }

    function drawOrbitTraces(time) {
        var center = getOrbitCenter();
        var count = state.gameMode ? 2 : 5;
        ctx.save();

        for (var i = 0; i < count; i += 1) {
            var params = getOrbitParams(i, state.gameMode ? 0.72 : 1.0);
            var rot = params.rot + Math.sin(time * 0.00006 + params.group) * 0.035;
            ctx.beginPath();
            ctx.ellipse(center.x, center.y, params.a, params.b, rot, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(99, 166, 255, " + (state.gameMode ? 0.05 : 0.13 - i * 0.015) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawPortfolioLinks() {
        var limit = state.width < 700 ? CONFIG.portfolio.linkDistanceMobile : CONFIG.portfolio.linkDistanceDesktop;
        var limitSq = limit * limit;
        var count = 0;

        ctx.save();
        ctx.lineWidth = 1;

        for (var i = 0; i < state.nodes.length; i += 1) {
            var a = state.nodes[i];
            for (var j = i + 1; j < state.nodes.length; j += 1) {
                var b = state.nodes[j];
                var dx = a.x - b.x;
                var dy = a.y - b.y;
                var dSq = dx * dx + dy * dy;
                if (dSq < limitSq) {
                    var alpha = (1 - dSq / limitSq) * 0.22;
                    ctx.strokeStyle = "rgba(99, 166, 255, " + alpha.toFixed(4) + ")";
                    ctx.beginPath();
                    ctx.moveTo(a.x, a.y);
                    ctx.lineTo(b.x, b.y);
                    ctx.stroke();
                    count += 1;
                }
            }
        }

        ctx.restore();

        state.linkCount = count;
        if (dom.metricLinks) dom.metricLinks.textContent = pad3(count);
        if (dom.gameLinks) dom.gameLinks.textContent = pad3(count);
    }

    function drawFusionLinks() {
        ctx.save();

        for (var r = 0; r < state.invalidPairs.length; r += 1) {
            var pair = state.invalidPairs[r];
            ctx.lineWidth = 1.2;
            ctx.strokeStyle = "rgba(255, 107, 139, " + (0.15 + pair.alpha * 0.32).toFixed(4) + ")";
            ctx.beginPath();
            ctx.moveTo(pair.a.x, pair.a.y);
            ctx.lineTo(pair.b.x, pair.b.y);
            ctx.stroke();
        }

        ctx.lineWidth = 1.7;
        for (var i = 0; i < state.hotPairs.length; i += 1) {
            var hot = state.hotPairs[i];
            var a = hot.a;
            var b = hot.b;
            var alpha = CONFIG.game.previewAlpha + hot.heat01 * CONFIG.game.hotLinkAlpha;
            var color = hot.inZone ? "255, 209, 102" : "99, 166, 255";

            ctx.strokeStyle = "rgba(" + color + ", " + alpha.toFixed(4) + ")";
            ctx.shadowColor = "rgba(" + color + ", 0.35)";
            ctx.shadowBlur = 6 + hot.heat01 * 18;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
        }

        ctx.restore();

        if (dom.metricLinks) dom.metricLinks.textContent = pad3(state.linkCount);
        if (dom.gameLinks) dom.gameLinks.textContent = pad3(state.linkCount);
    }

    function drawNodes(time) {
        ctx.save();

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            if (n.core && state.gameMode) continue;

            var nucleusColor = n.nucleus ? n.nucleus.color : "99, 166, 255";
            var pulse = 0.75 + Math.sin(time * 0.002 + (n.pulse || n.phase || 0)) * 0.25;
            var radius = n.radius || n.size || 2;
            var size = radius + pulse * (state.gameMode ? 1.05 : 0.8);
            var alpha = state.gameMode ? 0.78 : 0.42;

            if (n.unstable) {
                alpha = 0.56 + Math.sin(time * 0.018) * 0.18;
            }

            ctx.beginPath();
            ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + nucleusColor + ", " + alpha.toFixed(4) + ")";
            ctx.shadowColor = "rgba(" + nucleusColor + ", 0.45)";
            ctx.shadowBlur = state.gameMode ? 18 : 10;
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(n.x, n.y, size + 4, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(" + nucleusColor + ", " + (state.gameMode ? 0.20 : 0.08).toFixed(4) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();

            if (state.gameMode && isInsideFusionZone(n)) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, size + 9, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255, 209, 102, 0.42)";
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }

            if (state.gameMode) {
                ctx.fillStyle = "rgba(215, 227, 244, 0.84)";
                ctx.font = "10px SFMono-Regular, Consolas, monospace";
                ctx.textAlign = "center";
                ctx.fillText(n.nucleus.name, n.x, n.y - size - 8);
            }
        }

        ctx.restore();
    }

    function drawPulses(dt) {
        ctx.save();

        for (var i = state.pulses.length - 1; i >= 0; i -= 1) {
            var p = state.pulses[i];
            p.r += (235 + p.power * 0.55) * dt;
            p.life -= 0.72 * dt;

            if (p.life <= 0) {
                state.pulses.splice(i, 1);
                continue;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(255, 209, 102, " + (p.life * 0.32).toFixed(4) + ")";
            ctx.lineWidth = 1.5;
            ctx.stroke();
        }

        ctx.restore();
    }

    function drawPointerField() {
        if (!state.pointer.active) return;

        var r;
        if (state.gameMode) {
            r = state.pointer.down ? CONFIG.game.pointerPushRadius : CONFIG.game.pointerRadius;
        } else {
            r = state.pointer.down ? CONFIG.portfolio.pointerPushRadius : CONFIG.portfolio.pointerRadius;
        }

        ctx.save();
        var gradient = ctx.createRadialGradient(state.pointer.x, state.pointer.y, 0, state.pointer.x, state.pointer.y, r);
        gradient.addColorStop(0, "rgba(99, 166, 255, 0.25)");
        gradient.addColorStop(0.20, "rgba(99, 166, 255, 0.15)");
        gradient.addColorStop(0.55, "rgba(99, 166, 255, 0.045)");
        gradient.addColorStop(1, "rgba(99, 166, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(state.pointer.x, state.pointer.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(state.pointer.x, state.pointer.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(143, 214, 255, 0.66)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.restore();
    }

    function updateMetrics() {
        var input = "IDLE";
        if (state.pointer.down) {
            input = "PUSH";
        } else if (state.pointer.active) {
            input = state.pointer.speed > 18 ? "VECTOR" : "TRACK";
        }

        if (dom.metricInput) dom.metricInput.textContent = input;
        if (dom.gameInput) dom.gameInput.textContent = input;
    }

    function updateGameStats() {
        var level = getCoreLevel();
        var stage = getGrowthStage();
        var nextMass = getNextStageMass();

        state.coreLevel = level;

        if (dom.gameLevel) dom.gameLevel.textContent = pad2(level);
        if (dom.gameCollected) dom.gameCollected.textContent = pad3(state.coreMass);
        if (dom.gameTarget) dom.gameTarget.textContent = pad3(nextMass);
        if (dom.gameLinks) dom.gameLinks.textContent = pad3(state.linkCount);
        if (dom.gameNodes) dom.gameNodes.textContent = pad3(state.gameMode ? countNonCoreNodes() : state.portfolioNodes.length);
        if (dom.gameAtoms) dom.gameAtoms.textContent = stage.title;

        if (dom.gameProgressFill) {
            var prev = stage.mass;
            var progress = (state.coreMass - prev) / Math.max(1, nextMass - prev);
            dom.gameProgressFill.style.width = clamp(progress * 100, 0, 100).toFixed(2) + "%";
        }

        if (dom.gameMessage && state.gameMode) {
            dom.gameMessage.textContent = state.lastReaction + " | Heavy products feed the core better than raw H.";
        }

        updateRecipeUi();
    }

    function updateMiniOrbitProbe(time) {
        if (!dom.miniProbe || !dom.miniOrbitBox) return;

        var rect = dom.miniOrbitBox.getBoundingClientRect();
        var cx = rect.width * 0.5;
        var cy = rect.height * 0.5;

        var a1 = rect.width * 0.43;
        var b1 = rect.height * 0.29;
        var rot1 = -18 * Math.PI / 180;
        var t1 = time * 0.00115;

        var x1 = Math.cos(t1) * a1;
        var y1 = Math.sin(t1) * b1;
        var c1 = Math.cos(rot1);
        var s1 = Math.sin(rot1);
        var px1 = cx + x1 * c1 - y1 * s1;
        var py1 = cy + x1 * s1 + y1 * c1;

        dom.miniProbe.style.transform = "translate(" + px1.toFixed(2) + "px, " + py1.toFixed(2) + "px) translate(-50%, -50%)";
    }

    function frame(time) {
        if (!state.lastTime) state.lastTime = time;
        var dt = clamp((time - state.lastTime) / 1000, 0.001, 0.033);
        state.lastTime = time;

        updateScroll();
        updateMetrics();
        updateMiniOrbitProbe(time);

        ctx.clearRect(0, 0, state.width, state.height);
        drawGameBackdrop();
        drawGrid(time);
        drawBounds();
        drawOrbitTraces(time);
        drawCoreZone();

        if (!reduceMotion) {
            if (state.gameMode) {
                updateGamePhysics(dt, time);
            } else {
                for (var i = 0; i < state.nodes.length; i += 1) {
                    updatePortfolioNode(state.nodes[i], dt, time);
                }
            }
        }

        drawPointerField();
        drawPulses(dt);

        if (state.gameMode) {
            drawFusionLinks();
        } else {
            drawPortfolioLinks();
        }

        drawNodes(time);
        updateGameStats();

        window.requestAnimationFrame(frame);
    }

    function setupReveal() {
        var items = Array.prototype.slice.call(document.querySelectorAll(".reveal"));
        if (!("IntersectionObserver" in window)) {
            items.forEach(function (item) {
                item.classList.add("visible");
            });
            return;
        }

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.12 });

        items.forEach(function (item) {
            observer.observe(item);
        });
    }

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", updateScroll, { passive: true });

    window.addEventListener("pointermove", function (event) {
        setPointer(event.clientX, event.clientY, true);
    }, { passive: true });

    window.addEventListener("pointerleave", function () {
        state.pointer.active = false;
    }, { passive: true });

    window.addEventListener("pointerdown", function (event) {
        state.pointer.down = true;
        setPointer(event.clientX, event.clientY, true);

        if (state.gameMode && tryAbsorbAtPointer()) {
            return;
        }

        addPulse(event.clientX, event.clientY, state.gameMode ? CONFIG.game.pulseForce : 180);
    });

    window.addEventListener("pointerup", function (event) {
        state.pointer.down = false;
        setPointer(event.clientX, event.clientY, true);
    }, { passive: true });

    window.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && state.gameMode) {
            exitGameMode();
        }
    });

    document.addEventListener("fullscreenchange", function () {
        if (!document.fullscreenElement && state.gameMode) {
            exitGameMode();
        }
    });

    if (dom.enterGameButton) {
        dom.enterGameButton.addEventListener("click", enterGameMode);
    }

    if (dom.exitGameButton) {
        dom.exitGameButton.addEventListener("click", exitGameMode);
    }

    resize();
    updateScroll();
    setupReveal();
    window.requestAnimationFrame(frame);
}());
