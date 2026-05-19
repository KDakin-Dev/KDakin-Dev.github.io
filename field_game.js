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

            coreZoneRadius: 165,
            fusionDistance: 62,
            fusionHeatSeconds: 0.78,
            fusionHeatDecay: 1.15,
            unstableLifetime: 9.0,
            levelAdvanceDelayMs: 900,

            pointerRadius: 185,
            pointerPushRadius: 280,
            pointerForce: 430,
            pointerPushForce: 860,
            pulseForce: 330,

            orbitPullBase: 0.78,
            orbitPullConnected: 0.34,
            orbitPullControlDamp: 0.18,
            ambientNoise: 7.5,

            baseDamping: 0.988,
            maxSpeedBase: 58,
            maxSpeedPerLevel: 2.5,
            spawnSpeedBase: 12,
            spawnSpeedPerLevel: 0.8,

            hotLinkAlpha: 0.72,
            previewAlpha: 0.16
        },

        nuclei: {
            CORE: { name: "CORE", mass: 9999, radius: 7.0, color: "143, 214, 255" },

            H: { name: "H", mass: 1, radius: 2.7, color: "99, 166, 255" },
            D: { name: "D", mass: 2, radius: 3.0, color: "126, 242, 176" },
            He3: { name: "He3", mass: 3, radius: 3.4, color: "120, 210, 255" },
            He4: { name: "He4", mass: 4, radius: 3.7, color: "255, 209, 102" },
            Be8: { name: "Be8", mass: 8, radius: 4.3, color: "255, 160, 82", unstable: true },

            C12: { name: "C12", mass: 12, radius: 4.7, color: "185, 148, 255" },
            O16: { name: "O16", mass: 16, radius: 5.0, color: "255, 116, 116" },
            Ne20: { name: "Ne20", mass: 20, radius: 5.3, color: "125, 190, 255" },
            Mg24: { name: "Mg24", mass: 24, radius: 5.6, color: "120, 220, 190" },
            Si28: { name: "Si28", mass: 28, radius: 5.9, color: "255, 145, 77" },
            S32: { name: "S32", mass: 32, radius: 6.1, color: "255, 230, 96" },
            Ar36: { name: "Ar36", mass: 36, radius: 6.3, color: "145, 210, 255" },
            Ca40: { name: "Ca40", mass: 40, radius: 6.5, color: "160, 255, 180" },
            Ti44: { name: "Ti44", mass: 44, radius: 6.7, color: "210, 180, 255" },
            Cr48: { name: "Cr48", mass: 48, radius: 6.9, color: "190, 190, 210" },
            Fe52: { name: "Fe52", mass: 52, radius: 7.1, color: "255, 120, 120" },
            Fe56: { name: "Fe56", mass: 56, radius: 7.3, color: "255, 107, 139" }
        },

        reactions: [
            { a: "H", b: "H", product: "D", label: "p-p -> D", heat: 0.70, bonus: ["e+", "nu"] },
            { a: "D", b: "H", product: "He3", label: "D+p -> He3", heat: 0.74 },
            { a: "He3", b: "He3", product: "He4", label: "He3+He3 -> He4", heat: 0.86, spawn: ["H", "H"] },
            { a: "He4", b: "He4", product: "Be8", label: "alpha+alpha -> Be8", heat: 0.82 },
            { a: "Be8", b: "He4", product: "C12", label: "Be8+alpha -> C12", heat: 0.82 },
            { a: "C12", b: "He4", product: "O16", label: "C12+alpha -> O16", heat: 0.88 },
            { a: "O16", b: "He4", product: "Ne20", label: "O16+alpha -> Ne20", heat: 0.92 },
            { a: "Ne20", b: "He4", product: "Mg24", label: "Ne20+alpha -> Mg24", heat: 0.96 },
            { a: "Mg24", b: "He4", product: "Si28", label: "Mg24+alpha -> Si28", heat: 1.00 },
            { a: "Si28", b: "He4", product: "S32", label: "Si28+alpha -> S32", heat: 1.04 },
            { a: "S32", b: "He4", product: "Ar36", label: "S32+alpha -> Ar36", heat: 1.08 },
            { a: "Ar36", b: "He4", product: "Ca40", label: "Ar36+alpha -> Ca40", heat: 1.12 },
            { a: "Ca40", b: "He4", product: "Ti44", label: "Ca40+alpha -> Ti44", heat: 1.16 },
            { a: "Ti44", b: "He4", product: "Cr48", label: "Ti44+alpha -> Cr48", heat: 1.20 },
            { a: "Cr48", b: "He4", product: "Fe52", label: "Cr48+alpha -> Fe52", heat: 1.24 },
            { a: "Fe52", b: "He4", product: "Fe56", label: "Fe52+alpha -> Fe56", heat: 1.30 }
        ],

        stages: [
            { label: "Proton capture", nuclei: ["H", "H", "H", "H"], goal: "D", target: 2 },
            { label: "Deuterium burn", nuclei: ["D", "H", "D", "H", "H"], goal: "He3", target: 2 },
            { label: "Helium-3 branch", nuclei: ["He3", "He3", "He3", "He3"], goal: "He4", target: 2 },
            { label: "Triple-alpha seed", nuclei: ["He4", "He4", "He4", "He4", "He4", "He4"], goal: "C12", target: 1 },
            { label: "Carbon alpha capture", nuclei: ["C12", "He4", "He4", "H", "H"], goal: "O16", target: 1 },
            { label: "Oxygen alpha capture", nuclei: ["O16", "He4", "He4", "D"], goal: "Ne20", target: 1 },
            { label: "Neon alpha capture", nuclei: ["Ne20", "He4", "He4", "H"], goal: "Mg24", target: 1 },
            { label: "Magnesium alpha capture", nuclei: ["Mg24", "He4", "He4", "D"], goal: "Si28", target: 1 },
            { label: "Silicon alpha chain", nuclei: ["Si28", "He4", "He4", "H"], goal: "S32", target: 1 },
            { label: "Sulfur alpha chain", nuclei: ["S32", "He4", "He4", "D"], goal: "Ar36", target: 1 },
            { label: "Argon alpha chain", nuclei: ["Ar36", "He4", "He4", "H"], goal: "Ca40", target: 1 },
            { label: "Calcium alpha chain", nuclei: ["Ca40", "He4", "He4", "D"], goal: "Ti44", target: 1 },
            { label: "Titanium alpha chain", nuclei: ["Ti44", "He4", "He4", "H"], goal: "Cr48", target: 1 },
            { label: "Chromium alpha chain", nuclei: ["Cr48", "He4", "He4", "D"], goal: "Fe52", target: 1 },
            { label: "Iron-group target", nuclei: ["Fe52", "He4", "He4", "H"], goal: "Fe56", target: 1 }
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
        pointer: {
            x: 0,
            y: 0,
            px: 0,
            py: 0,
            active: false,
            down: false,
            speed: 0
        },
        scroll01: 0,
        linkCount: 0,
        gameMode: false,
        level: 1,
        stage: null,
        goalCount: 0,
        target: 1,
        nextNodeId: 1,
        levelAdvancePending: false,
        lastReaction: "READY"
    };

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function rand(min, max) {
        return min + Math.random() * (max - min);
    }

    function pad3(value) {
        return String(value).padStart(3, "0").slice(-3);
    }

    function pad2(value) {
        return String(value).padStart(2, "0");
    }

    function distSq(a, b) {
        var dx = a.x - b.x;
        var dy = a.y - b.y;
        return dx * dx + dy * dy;
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

    function getGameBounds() {
        return {
            left: CONFIG.game.playAreaLeft,
            right: state.width - CONFIG.game.playAreaRight,
            top: CONFIG.game.playAreaTop,
            bottom: state.height - CONFIG.game.playAreaBottom
        };
    }

    function getCore() {
        return state.nodes.length > 0 ? state.nodes[0] : null;
    }

    function getNucleus(name) {
        return CONFIG.nuclei[name] || CONFIG.nuclei.H;
    }

    function wantedPortfolioNodeCount() {
        var area = state.width * state.height;
        return clamp(
            Math.floor(area / CONFIG.portfolio.areaPerNode),
            CONFIG.portfolio.minNodes,
            CONFIG.portfolio.maxNodes
        );
    }

    function getOrbitCenter(time) {
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
        var center = getOrbitCenter(0);
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

    function getStage(level) {
        if (level <= CONFIG.stages.length) {
            return CONFIG.stages[level - 1];
        }

        return {
            label: "Iron-group loop",
            nuclei: ["Fe52", "He4", "He4", "H", "D"],
            goal: "Fe56",
            target: 1
        };
    }

    function createGameNode(id, nucleusName, x, y, core) {
        var nucleus = getNucleus(nucleusName);
        var speed = CONFIG.game.spawnSpeedBase + state.level * CONFIG.game.spawnSpeedPerLevel;
        var speedScale = 1 / Math.pow(Math.max(1, nucleus.mass), 0.38);
        var orbitScale = core ? 0 : rand(0.26, 0.47);
        var bounds = getGameBounds();
        var minDim = Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top);
        var orbitA = minDim * orbitScale;
        var orbitB = orbitA * rand(0.42, 0.72);
        var orbitSpeed = (Math.random() < 0.5 ? -1 : 1) * rand(0.28, 0.56) / Math.pow(Math.max(1, nucleus.mass), 0.33);

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

    function beginLevel(level) {
        var stage = getStage(level);
        var bounds = getGameBounds();
        var cx = (bounds.left + bounds.right) * 0.5;
        var cy = (bounds.top + bounds.bottom) * 0.5;

        state.level = level;
        state.stage = stage;
        state.nodes = [];
        state.pulses = [];
        state.fusionHeat = Object.create(null);
        state.hotPairs = [];
        state.goalCount = 0;
        state.target = stage.target || 1;
        state.nextNodeId = 1;
        state.levelAdvancePending = false;
        state.lastReaction = "Goal: " + stage.goal;

        state.nodes.push(createGameNode(0, "CORE", cx, cy, true));

        var count = stage.nuclei.length;
        for (var i = 0; i < count; i += 1) {
            spawnNucleus(stage.nuclei[i], null, i, count);
        }

        updateGameStats();
    }

    function spawnNucleus(nucleusName, origin, index, count) {
        var bounds = getGameBounds();
        var core = getCore();
        var cx = core ? core.x : (bounds.left + bounds.right) * 0.5;
        var cy = core ? core.y : (bounds.top + bounds.bottom) * 0.5;
        var angle;
        var ring;
        var x;
        var y;

        if (origin) {
            angle = rand(0, Math.PI * 2);
            x = origin.x + Math.cos(angle) * rand(18, 48);
            y = origin.y + Math.sin(angle) * rand(18, 48);
        } else {
            angle = (Math.PI * 2 * index) / Math.max(1, count) + rand(-0.34, 0.34);
            ring = Math.min(bounds.right - bounds.left, bounds.bottom - bounds.top) * rand(0.30, 0.46);
            x = cx + Math.cos(angle) * ring + rand(-42, 42);
            y = cy + Math.sin(angle) * ring + rand(-42, 42);
        }

        x = clamp(x, bounds.left + 44, bounds.right - 44);
        y = clamp(y, bounds.top + 44, bounds.bottom - 44);

        var node = createGameNode(state.nextNodeId, nucleusName, x, y, false);
        state.nextNodeId += 1;

        if (origin) {
            var dx = node.x - origin.x;
            var dy = node.y - origin.y;
            var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            var push = 52 / Math.pow(Math.max(1, node.mass), 0.35);
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
        p.active = active;
        var dx = p.x - p.px;
        var dy = p.y - p.py;
        p.speed = Math.sqrt(dx * dx + dy * dy);
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
        beginLevel(1);
        if (dom.gameMessage) {
            dom.gameMessage.textContent = "Push nuclei into the CORE zone. Hold compatible pairs together long enough to trigger fusion. Heavy nuclei move slower and resist the cursor field more.";
        }
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
        var center = getOrbitCenter(time);
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

            var falloff = 1 - d / radius;
            var massScale = Math.pow(Math.max(1, n.mass), 0.42);
            var force = strength * falloff / massScale;
            n.vx += (dx / d) * force * dt;
            n.vy += (dy / d) * force * dt;
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
                var massScale = Math.pow(Math.max(1, n.mass), 0.42);
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
                    controlDamp = CONFIG.game.orbitPullControlDamp;
                }
            }

            var pull = CONFIG.game.orbitPullBase * controlDamp / Math.pow(Math.max(1, n.mass), 0.22);
            n.vx += dx * pull * dt;
            n.vy += dy * pull * dt;

            var noise = CONFIG.game.ambientNoise / Math.pow(Math.max(1, n.mass), 0.45);
            n.vx += Math.sin(time * 0.0011 + n.pulse) * noise * dt;
            n.vy += Math.cos(time * 0.0009 + n.pulse) * noise * dt;
        }
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
            n.vx *= Math.pow(CONFIG.game.baseDamping, dt * 60);
            n.vy *= Math.pow(CONFIG.game.baseDamping, dt * 60);

            var maxSpeed = (CONFIG.game.maxSpeedBase + state.level * CONFIG.game.maxSpeedPerLevel) / Math.pow(Math.max(1, n.mass), 0.18);
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

    function reactionKey(a, b) {
        return a.id < b.id ? a.id + ":" + b.id : b.id + ":" + a.id;
    }

    function findReaction(a, b) {
        if (a.core || b.core) return null;

        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            var r = CONFIG.reactions[i];
            if ((r.a === a.nucleusName && r.b === b.nucleusName) || (r.a === b.nucleusName && r.b === a.nucleusName)) {
                return r;
            }
        }

        return null;
    }

    function isInsideFusionZone(n) {
        var core = getCore();
        if (!core) return false;

        var dx = n.x - core.x;
        var dy = n.y - core.y;
        var r = CONFIG.game.coreZoneRadius;
        return dx * dx + dy * dy <= r * r;
    }

    function updateFusionPairs(dt) {
        var activeKeys = Object.create(null);
        state.hotPairs = [];
        state.linkCount = 0;

        for (var i = 1; i < state.nodes.length; i += 1) {
            var a = state.nodes[i];
            for (var j = i + 1; j < state.nodes.length; j += 1) {
                var b = state.nodes[j];
                var reaction = findReaction(a, b);
                if (!reaction) continue;

                var dx = a.x - b.x;
                var dy = a.y - b.y;
                var d = Math.sqrt(dx * dx + dy * dy);
                var maxD = CONFIG.game.fusionDistance + a.radius + b.radius;
                if (d > maxD) continue;

                var zoneA = isInsideFusionZone(a);
                var zoneB = isInsideFusionZone(b);
                var inZone = zoneA && zoneB;
                var key = reactionKey(a, b);
                var heatTarget = reaction.heat || CONFIG.game.fusionHeatSeconds;

                activeKeys[key] = true;
                state.linkCount += 1;

                if (!state.fusionHeat[key]) {
                    state.fusionHeat[key] = {
                        heat: 0,
                        label: reaction.label,
                        a: a.id,
                        b: b.id
                    };
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
                spawnNucleus(reaction.spawn[i], origin, i, reaction.spawn.length);
            }
        }

        state.fusionHeat = Object.create(null);
        state.hotPairs = [];
        state.lastReaction = reaction.label;

        if (reaction.product === state.stage.goal) {
            state.goalCount += 1;
            if (!state.levelAdvancePending && state.goalCount >= state.target) {
                state.levelAdvancePending = true;
                window.setTimeout(function () {
                    if (state.gameMode) {
                        beginLevel(state.level + 1);
                    }
                }, CONFIG.game.levelAdvanceDelayMs);
            }
        }

        addPulse(x, y, 170);
    }

    function decayUnstableNuclei() {
        for (var i = state.nodes.length - 1; i >= 0; i -= 1) {
            var n = state.nodes[i];
            if (!n.unstable) continue;
            if (n.age < CONFIG.game.unstableLifetime) continue;

            var origin = { x: n.x, y: n.y };
            removeNode(n);
            spawnNucleus("He4", origin, 0, 2);
            spawnNucleus("He4", origin, 1, 2);
            state.lastReaction = "Be8 decayed";
            addPulse(origin.x, origin.y, 110);
        }
    }

    function updateGamePhysics(dt, time) {
        applyOrbitForces(dt, time);
        applyGamePointerForces(dt);
        applyPulseForces(dt);
        integrateGameNodes(dt);
        updateFusionPairs(dt);
        decayUnstableNuclei();
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
        ctx.strokeStyle = "rgba(143, 214, 255, 0.26)";
        ctx.lineWidth = 1;
        ctx.setLineDash([9, 10]);
        ctx.strokeRect(bounds.left, bounds.top, bounds.right - bounds.left, bounds.bottom - bounds.top);
        ctx.restore();
    }

    function drawCoreZone() {
        if (!state.gameMode) return;

        var core = getCore();
        if (!core) return;

        ctx.save();
        var gradient = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, CONFIG.game.coreZoneRadius);
        gradient.addColorStop(0, "rgba(255, 209, 102, 0.14)");
        gradient.addColorStop(0.55, "rgba(99, 166, 255, 0.055)");
        gradient.addColorStop(1, "rgba(99, 166, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(core.x, core.y, CONFIG.game.coreZoneRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "rgba(255, 209, 102, 0.18)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.arc(core.x, core.y, CONFIG.game.coreZoneRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }

    function drawOrbitTraces(time) {
        var center = getOrbitCenter(time);
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
        ctx.lineWidth = 1.7;

        for (var i = 0; i < state.hotPairs.length; i += 1) {
            var pair = state.hotPairs[i];
            var a = pair.a;
            var b = pair.b;
            var alpha = CONFIG.game.previewAlpha + pair.heat01 * CONFIG.game.hotLinkAlpha;
            var color = pair.inZone ? "255, 209, 102" : "99, 166, 255";

            ctx.strokeStyle = "rgba(" + color + ", " + alpha.toFixed(4) + ")";
            ctx.shadowColor = "rgba(" + color + ", 0.35)";
            ctx.shadowBlur = 6 + pair.heat01 * 18;
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
            var nucleusColor = n.nucleus ? n.nucleus.color : "99, 166, 255";
            var pulse = 0.75 + Math.sin(time * 0.002 + (n.pulse || n.phase || 0)) * 0.25;
            var radius = n.radius || n.size || 2;
            var size = n.core ? radius + pulse * 1.2 : radius + pulse * (state.gameMode ? 1.05 : 0.8);
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
            ctx.arc(n.x, n.y, size + (n.core ? 7 : 4), 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(" + nucleusColor + ", " + (state.gameMode ? 0.20 : 0.08).toFixed(4) + ")";
            ctx.lineWidth = n.core ? 1.6 : 1;
            ctx.stroke();

            if (state.gameMode) {
                ctx.fillStyle = "rgba(215, 227, 244, 0.84)";
                ctx.font = n.core ? "11px SFMono-Regular, Consolas, monospace" : "10px SFMono-Regular, Consolas, monospace";
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
        gradient.addColorStop(0, "rgba(99, 166, 255, 0.20)");
        gradient.addColorStop(0.44, "rgba(99, 166, 255, 0.07)");
        gradient.addColorStop(1, "rgba(99, 166, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(state.pointer.x, state.pointer.y, r, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(state.pointer.x, state.pointer.y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(143, 214, 255, 0.62)";
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
        var stage = state.stage || getStage(state.level);
        if (dom.gameLevel) dom.gameLevel.textContent = pad2(state.level);
        if (dom.gameCollected) dom.gameCollected.textContent = pad3(state.goalCount);
        if (dom.gameTarget) dom.gameTarget.textContent = pad3(state.target);
        if (dom.gameLinks) dom.gameLinks.textContent = pad3(state.linkCount);
        if (dom.gameNodes) dom.gameNodes.textContent = pad3(state.gameMode ? state.nodes.length : state.portfolioNodes.length);
        if (dom.gameAtoms) dom.gameAtoms.textContent = stage.label;
        if (dom.gameProgressFill) {
            dom.gameProgressFill.style.width = clamp(state.goalCount / Math.max(1, state.target) * 100, 0, 100).toFixed(2) + "%";
        }
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
