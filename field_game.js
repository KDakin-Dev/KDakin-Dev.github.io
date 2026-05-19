(function () {
    "use strict";

    var CONFIG = {
        canvasDprMax: 2,
        buildVersion: "0.10.5-balance-fix",

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
            visualScale: 1.42,
            coreRadiusBase: 13.0,
            coreRadiusScale: 1.62,
            coreRadiusMax: 56.0,
            fusionRadiusBase: 96.0,
            fusionRadiusScale: 6.0,
            fusionRadiusMax: 245.0,

            spawnInterval: 0.90,
            spawnBurstBase: 13,
            spawnByMassScale: 1.85,
            spawnMax: 46,
            spawnSpeedBase: 11.0,
            spawnSpeedByCoreLevel: 0.65,

            fusionDistance: 86,
            fusionHeatSeconds: 0.68,
            fusionHeatDecay: 1.15,
            validPairAttractRange: 132,
            validPairAttractForce: 48,
            invalidPairRange: 86,
            invalidPairRepelForce: 135,

            pointerRadius: 205,
            pointerPushRadius: 310,
            pointerForce: 620,
            pointerPushForce: 1180,
            pointerCenterPower: 2.45,
            pointerMotionForce: 14.0,
            pulseForce: 390,

            orbitPullBase: 0.94,
            orbitPullControlDamp: 0.10,
            orbitNoise: 5.2,
            outerOrbitBias: 0.78,

            baseDamping: 0.989,
            maxSpeedBase: 62,
            maxSpeedPerLevel: 1.7,

            hotLinkAlpha: 0.72,
            previewAlpha: 0.16,
            absorbButtonUpdateInterval: 0.15,
            fusionHoldScaleInsideCore: 0.62,
            contactFusionHeatBoost: 1.75,
            pairFusionZonePadding: 34,
            validPairMinDistance: 18,
            overlapSoftPushForce: 72,
            insideCoreSpeedScale: 0.82,
            insideCoreHeavySpeedPower: 0.16,
            insideCoreDamping: 0.985,
            insideCoreOrbitPullScale: 0.42,
            insideCoreRetainForce: 1.15,
            insideCoreRetainHeavyPower: 0.34,
            insideCoreRetainRadiusScale: 0.74,
            insideCoreTangentialForce: 22,
            innerHydrogenEscapeForce: 38,
            innerProductOrbitAssist: 18,
            absorbClickRadiusBonus: 22,
            levelAdvancePulseMass: 0.0,

            collapseCriticalMass: 150,
            collapseBlackHoleMass: 176,
            collapseNeutronStabilityMin: 38,
            supernovaDuration: 3.2,
            finalSpawnInterval: 0.72
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
            { a: "H", b: "H", product: "D", requiresAbsorbed: null, label: "H + H -> D", heat: 0.58 },
            { a: "D", b: "H", product: "He3", requiresAbsorbed: "D", label: "D + H -> He3", heat: 0.64 },
            { a: "He3", b: "He3", product: "He4", requiresAbsorbed: "He3", label: "He3 + He3 -> He4", heat: 0.76, spawn: ["H", "H"] },
            { a: "He4", b: "He4", product: "Be8", requiresAbsorbed: "He4", label: "He4 + He4 -> Be8", heat: 0.84 },
            { a: "Be8", b: "He4", product: "C12", requiresAbsorbed: "Be8", label: "Be8 + He4 -> C12", heat: 0.72 },
            { a: "C12", b: "He4", product: "O16", requiresAbsorbed: "C12", label: "C12 + He4 -> O16", heat: 0.88 },
            { a: "O16", b: "He4", product: "Ne20", requiresAbsorbed: "O16", label: "O16 + He4 -> Ne20", heat: 0.92 },
            { a: "Ne20", b: "He4", product: "Mg24", requiresAbsorbed: "Ne20", label: "Ne20 + He4 -> Mg24", heat: 0.96 },
            { a: "Mg24", b: "He4", product: "Si28", requiresAbsorbed: "Mg24", label: "Mg24 + He4 -> Si28", heat: 1.00 },
            { a: "Si28", b: "He4", product: "S32", requiresAbsorbed: "Si28", label: "Si28 + He4 -> S32", heat: 1.04 },
            { a: "S32", b: "He4", product: "Ar36", requiresAbsorbed: "S32", label: "S32 + He4 -> Ar36", heat: 1.08 },
            { a: "Ar36", b: "He4", product: "Ca40", requiresAbsorbed: "Ar36", label: "Ar36 + He4 -> Ca40", heat: 1.12 },
            { a: "Ca40", b: "He4", product: "Ti44", requiresAbsorbed: "Ca40", label: "Ca40 + He4 -> Ti44", heat: 1.16 },
            { a: "Ti44", b: "He4", product: "Cr48", requiresAbsorbed: "Ti44", label: "Ti44 + He4 -> Cr48", heat: 1.20 },
            { a: "Cr48", b: "He4", product: "Fe52", requiresAbsorbed: "Cr48", label: "Cr48 + He4 -> Fe52", heat: 1.24 },
            { a: "Fe52", b: "He4", product: "Fe56", requiresAbsorbed: "Fe52", label: "Fe52 + He4 -> Fe56", heat: 1.30 }
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
        absorbedProducts: Object.create(null),
        finalPhase: "fusion",
        collapseMass: 0,
        stability: 100,
        supernovaTimer: 0,
        endingType: "",
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
        recipeRoot: null,
        versionRoot: null,
        unlockRoot: null,
        finalRoot: null,
        unlockTimer: 0,
        unlockName: ""
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

    function isReactionUnlocked(reaction) {
        if (!reaction.requiresAbsorbed) return true;
        return !!state.absorbedProducts[reaction.requiresAbsorbed];
    }

    function getPrimaryRecipe() {
        if (state.finalPhase !== "fusion") return null;

        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            var reaction = CONFIG.reactions[i];
            if (!state.absorbedProducts[reaction.product]) {
                return reaction;
            }
        }
        return CONFIG.reactions[CONFIG.reactions.length - 1];
    }

    function isFusionPhase() {
        return state.finalPhase === "fusion";
    }

    function isCollapsePhase() {
        return state.finalPhase === "collapse";
    }

    function isSupernovaPhase() {
        return state.finalPhase === "supernova";
    }

    function isEndingPhase() {
        return state.finalPhase === "ending";
    }

    function getUnlockedRecipeList() {
        var list = [];
        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            if (isReactionUnlocked(CONFIG.reactions[i])) {
                list.push(CONFIG.reactions[i]);
            }
        }
        return list;
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
        var visualMass = state.coreMass;

        if (isCollapsePhase() || isSupernovaPhase() || isEndingPhase()) {
            visualMass += state.collapseMass * 1.45;
        }

        var radius = CONFIG.game.coreRadiusBase + Math.sqrt(visualMass) * CONFIG.game.coreRadiusScale;

        if (isCollapsePhase()) {
            radius *= 1.12 + clamp(state.collapseMass / CONFIG.game.collapseCriticalMass, 0, 1) * 0.34;
        } else if (isSupernovaPhase()) {
            radius = Math.max(radius * 1.75, 112);
        } else if (isEndingPhase()) {
            radius = state.endingType === "BLACK HOLE" ? Math.max(radius * 1.08, 72) : Math.max(radius * 0.64, 38);
        }

        return clamp(
            radius,
            CONFIG.game.coreRadiusBase,
            isFusionPhase() ? 84 : 170
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
        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            if (state.absorbedProducts[CONFIG.reactions[i].product]) {
                level = Math.max(level, i + 2);
            }
        }
        return clamp(level, 1, CONFIG.growthStages.length);
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
        var orbitScale = core ? 0 : rand(0.58, CONFIG.game.outerOrbitBias);

        if (!core && nucleus.mass >= 28) {
            var heavy01 = clamp((nucleus.mass - 28) / 28, 0, 1);
            if (isCollapsePhase()) {
                orbitScale = rand(0.24, 0.42) - heavy01 * 0.10;
            } else {
                orbitScale = rand(0.34, 0.54) - heavy01 * 0.12;
            }
        } else if (!core && isCollapsePhase() && nucleus.mass >= 12) {
            var midHeavy01 = clamp((nucleus.mass - 12) / 16, 0, 1);
            orbitScale = rand(0.34, 0.50) - midHeavy01 * 0.08;
        }

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
            synthesized: false,
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
        state.absorbedProducts = Object.create(null);
        state.finalPhase = "fusion";
        state.collapseMass = 0;
        state.stability = 100;
        state.supernovaTimer = 0;
        state.endingType = "";
        state.coreMass = CONFIG.game.initialCoreMass;
        state.coreLevel = 1;
        state.nextNodeId = 1;
        state.spawnTimer = 0;
        state.absorbUiTimer = 0;
        state.levelFlash = 0;
        state.lastReaction = "Feed H into the core";
        state.unlockTimer = 0;
        state.unlockName = "";
        hideFinalUi();

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

    function countNodesByType(typeName) {
        var count = 0;
        for (var i = 0; i < state.nodes.length; i += 1) {
            if (!state.nodes[i].core && state.nodes[i].nucleusName === typeName) {
                count += 1;
            }
        }
        return count;
    }

    function hasAbsorbed(typeName) {
        return !!state.absorbedProducts[typeName];
    }

    function isSpawnableSupport(typeName) {
        if (typeName === "H") return true;
        if (typeName === "D") return hasAbsorbed("D");
        if (typeName === "He3") return hasAbsorbed("He3");
        if (typeName === "He4") return hasAbsorbed("He4");
        return hasAbsorbed(typeName);
    }

    function getCurrentRecipe() {
        if (state.finalPhase !== "fusion") {
            return null;
        }

        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            var reaction = CONFIG.reactions[i];
            if (isReactionUnlocked(reaction) && !state.absorbedProducts[reaction.product]) {
                return reaction;
            }
        }
        return CONFIG.reactions[CONFIG.reactions.length - 1];
    }

    function pushWeightedSpawn(list, typeName, weight) {
        if (weight <= 0) return;
        if (!isSpawnableSupport(typeName)) return;
        list.push({ type: typeName, weight: weight });
    }

    function getReactionProductIndex(typeName) {
        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            if (CONFIG.reactions[i].product === typeName) {
                return i;
            }
        }
        return -1;
    }

    function getCurrentRecipeIndex() {
        var recipe = getCurrentRecipe();
        if (!recipe) return 0;

        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            if (CONFIG.reactions[i] === recipe) {
                return i;
            }
        }

        return 0;
    }

    function pushLaggedHeavySupport(list, currentIndex) {
        // Heavy support should lag behind current progress. It helps recovery
        // without turning late-game synthesis into automatic free heavy drops.
        var start = Math.max(0, currentIndex - 5);
        var end = Math.max(0, currentIndex - 3);

        for (var i = start; i <= end; i += 1) {
            var typeName = CONFIG.reactions[i].product;
            if (!typeName) continue;
            if (typeName === "D" || typeName === "He3" || typeName === "He4") continue;
            if (!hasAbsorbed(typeName)) continue;

            var age = currentIndex - i;
            var weight = age >= 5 ? 2.4 : 1.4;
            pushWeightedSpawn(list, typeName, weight);
        }
    }

    function pushRareRecoverySeed(list, recipe, currentIndex) {
        if (!recipe || !recipe.a || recipe.a === "He4") return;
        if (!hasAbsorbed(recipe.a)) return;

        // Current heavy ingredient is a rare anti-softlock seed, not normal fuel.
        // It becomes slightly more likely only if none of that type is on field.
        var count = countNodesByType(recipe.a);
        var weight = count <= 0 ? 2.8 : 0.7;

        if (currentIndex >= 8) {
            weight += 0.6;
        }

        pushWeightedSpawn(list, recipe.a, weight);
    }

    function pickWeightedSpawn(list) {
        var total = 0;
        for (var i = 0; i < list.length; i += 1) {
            total += list[i].weight;
        }
        if (total <= 0) return "H";

        var roll = Math.random() * total;
        for (var j = 0; j < list.length; j += 1) {
            roll -= list[j].weight;
            if (roll <= 0) return list[j].type;
        }

        return list[list.length - 1].type;
    }

    function pickCollapseSpawnType() {
        var list = [];

        list.push({ type: "H", weight: 58 });
        list.push({ type: "D", weight: 10 });
        list.push({ type: "He3", weight: 8 });
        list.push({ type: "He4", weight: 28 });
        list.push({ type: "C12", weight: 18 });
        list.push({ type: "O16", weight: 17 });
        list.push({ type: "Ne20", weight: 11 });
        list.push({ type: "Mg24", weight: 10 });
        list.push({ type: "Si28", weight: 13 });
        list.push({ type: "S32", weight: 10 });
        list.push({ type: "Fe52", weight: 8 });
        list.push({ type: "Fe56", weight: 7 });

        if (state.stability < 38) {
            list.push({ type: "H", weight: 36 });
            list.push({ type: "He4", weight: 24 });
        }

        if (state.collapseMass > 95) {
            list.push({ type: "Fe56", weight: 10 });
            list.push({ type: "Si28", weight: 10 });
            list.push({ type: "S32", weight: 8 });
        }

        return pickWeightedSpawn(list);
    }

    function pickSpawnType() {
        if (isCollapsePhase()) {
            return pickCollapseSpawnType();
        }

        var recipe = getCurrentRecipe();
        var level = getCoreLevel();
        var currentIndex = getCurrentRecipeIndex();
        var hCount = countNodesByType("H");
        var dCount = countNodesByType("D");
        var he3Count = countNodesByType("He3");
        var he4Count = countNodesByType("He4");
        var list = [];

        // Hydrogen remains the main raw material. Late game gets more flow,
        // but not by throwing near-current heavy nuclei at the player.
        var hWeight = 150 + level * 12;
        if (hCount < 12 + Math.floor(level * 0.95)) {
            hWeight += 130;
        }
        pushWeightedSpawn(list, "H", hWeight);

        // D is useful as a small support, but too much D clogs the field.
        if (level >= 2 && dCount < 1) {
            pushWeightedSpawn(list, "D", 3.0);
        }

        // He3 appears as a small bridge only while it is still relevant.
        if (level >= 3 && hasAbsorbed("He3") && he3Count < 1) {
            var he3Need = recipe && (recipe.a === "He3" || recipe.b === "He3");
            pushWeightedSpawn(list, "He3", he3Need ? 4.0 : 1.2);
        }

        // He4 is the main alpha-chain support, but it should not flood the game.
        if (level >= 4 && hasAbsorbed("He4")) {
            var he4Need = recipe && (recipe.a === "He4" || recipe.b === "He4");
            var he4Weight = he4Need ? 18.0 : 6.0;
            if (he4Count < 2) {
                he4Weight += 12.0;
            }
            pushWeightedSpawn(list, "He4", he4Weight);
        }

        // Heavy seeds lag behind by about 4-5 reaction steps.
        // Example: when current progress is around Ar36/Ca40, support should
        // be closer to C12/O16/Ne20, not the immediately previous S32.
        if (level >= 7) {
            pushLaggedHeavySupport(list, currentIndex);
        }

        // Rare anti-softlock current seed. Very low weight on purpose.
        // It should help if the chain stalls, not replace the chain.
        if (level >= 6) {
            pushRareRecoverySeed(list, recipe, currentIndex);
        }

        return pickWeightedSpawn(list);
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
        } else if (state.gameMode && getNucleus(nucleusName).mass >= 28) {
            angle = rand(0, Math.PI * 2);
            var heavyMass = getNucleus(nucleusName).mass;
            var heavy01 = clamp((heavyMass - 28) / 28, 0, 1);
            radius = fusionRadius() * rand(0.62, 1.02 - heavy01 * 0.18);
            if (isCollapsePhase()) {
                radius = fusionRadius() * rand(0.46, 0.88 - heavy01 * 0.16);
            }
            x = cx + Math.cos(angle) * radius;
            y = cy + Math.sin(angle) * radius;
        } else if (isCollapsePhase() && getNucleus(nucleusName).mass >= 12) {
            angle = rand(0, Math.PI * 2);
            var midHeavyMass = getNucleus(nucleusName).mass;
            var midHeavy01 = clamp((midHeavyMass - 12) / 16, 0, 1);
            radius = fusionRadius() * rand(0.56, 0.98 - midHeavy01 * 0.14);
            x = cx + Math.cos(angle) * radius;
            y = cy + Math.sin(angle) * radius;
        } else {
            var pad = 62;
            var side = Math.floor(rand(0, 4));
            if (side === 0) {
                x = bounds.left + pad;
                y = rand(bounds.top + pad, bounds.bottom - pad);
            } else if (side === 1) {
                x = bounds.right - pad;
                y = rand(bounds.top + pad, bounds.bottom - pad);
            } else if (side === 2) {
                x = rand(bounds.left + pad, bounds.right - pad);
                y = bounds.top + pad;
            } else {
                x = rand(bounds.left + pad, bounds.right - pad);
                y = bounds.bottom - pad;
            }
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
        ensureVersionUi();
        ensureUnlockUi();
        configureLegacyGameHud(true);
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
        hideVersionUi();
        hideUnlockUi();
        hideFinalUi();
        configureLegacyGameHud(false);
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

            var insideCore = isInsideFusionZone(n);
            var rot = n.orbitRot + Math.sin(time * 0.00004 + n.pulse) * 0.06;
            var t = n.orbitPhase + time * 0.001 * n.orbitSpeed;
            var target = orbitPoint(core.x, core.y, n.orbitA, n.orbitB, rot, t);
            var dx = target.x - n.x;
            var dy = target.y - n.y;

            var pd = Infinity;
            var controlDamp = 1.0;
            if (state.pointer.active) {
                var pdx = n.x - state.pointer.x;
                var pdy = n.y - state.pointer.y;
                pd = Math.sqrt(pdx * pdx + pdy * pdy);
                var radius = state.pointer.down ? CONFIG.game.pointerPushRadius : CONFIG.game.pointerRadius;
                if (pd < radius) {
                    var f = 1 - pd / radius;
                    controlDamp = 1 - (1 - CONFIG.game.orbitPullControlDamp) * f;
                }
            }

            if (insideCore) {
                controlDamp *= CONFIG.game.insideCoreOrbitPullScale;
            }

            var pull = CONFIG.game.orbitPullBase * controlDamp / Math.pow(Math.max(1, n.mass), 0.20);
            n.vx += dx * pull * dt;
            n.vy += dy * pull * dt;

            var cdx = core.x - n.x;
            var cdy = core.y - n.y;
            var cd = Math.sqrt(cdx * cdx + cdy * cdy) + 0.001;
            var tx = -cdy / cd;
            var ty = cdx / cd;

            if (insideCore) {
                var orbitAssist = CONFIG.game.insideCoreTangentialForce / Math.pow(Math.max(1, n.mass), 0.16);
                n.vx += tx * orbitAssist * dt * (n.orbitSpeed >= 0 ? 1 : -1);
                n.vy += ty * orbitAssist * dt * (n.orbitSpeed >= 0 ? 1 : -1);

                if (n.synthesized && n.nucleusName !== "H") {
                    var keep = CONFIG.game.innerProductOrbitAssist / Math.pow(Math.max(1, n.mass), 0.12);
                    n.vx += (cdx / cd) * keep * dt;
                    n.vy += (cdy / cd) * keep * dt;
                }

                if (!n.synthesized && n.nucleusName === "H" && pd > CONFIG.game.pointerRadius * 0.72) {
                    var escape = CONFIG.game.innerHydrogenEscapeForce / Math.pow(Math.max(1, n.mass), 0.10);
                    n.vx -= (cdx / cd) * escape * dt;
                    n.vy -= (cdy / cd) * escape * dt;
                }
            } else if (!n.synthesized && n.nucleusName === "H") {
                var minOrbit = fusionRadius() * 1.28;
                if (cd < minOrbit && pd > CONFIG.game.pointerRadius * 0.65) {
                    var away = (minOrbit - cd) * 0.85;
                    n.vx -= (cdx / cd) * away * dt;
                    n.vy -= (cdy / cd) * away * dt;
                }
            }

            if (n.mass >= 28 || (isCollapsePhase() && n.mass >= 12)) {
                var heavy01b = clamp((n.mass - 12) / 44, 0, 1);
                var desiredOrbit = fusionRadius();

                if (isCollapsePhase()) {
                    desiredOrbit *= 0.78 - heavy01b * 0.36;
                } else {
                    desiredOrbit *= 1.06 - heavy01b * 0.46;
                }

                if (cd > desiredOrbit) {
                    var pullGain = isCollapsePhase() ? (1.35 + heavy01b * 3.25) : (0.68 + heavy01b * 2.15);
                    var inward = (cd - desiredOrbit) * pullGain;
                    n.vx += (cdx / cd) * inward * dt / Math.pow(Math.max(1, n.mass), 0.12);
                    n.vy += (cdy / cd) * inward * dt / Math.pow(Math.max(1, n.mass), 0.12);
                }

                var heavyOrbit = (isCollapsePhase() ? 18 + heavy01b * 18 : 9 + heavy01b * 14) / Math.pow(Math.max(1, n.mass), 0.10);
                n.vx += tx * heavyOrbit * dt * (n.orbitSpeed >= 0 ? 1 : -1);
                n.vy += ty * heavyOrbit * dt * (n.orbitSpeed >= 0 ? 1 : -1);
            }

            var noise = CONFIG.game.orbitNoise / Math.pow(Math.max(1, n.mass), 0.45);
            if (n.mass >= 28) {
                noise *= isCollapsePhase() ? 0.22 : 0.52;
            } else if (isCollapsePhase() && n.mass >= 12) {
                noise *= 0.42;
            }
            n.vx += Math.sin(time * 0.0011 + n.pulse) * noise * dt;
            n.vy += Math.cos(time * 0.0009 + n.pulse) * noise * dt;
        }
    }

    function reactionKey(a, b) {
        return a.id < b.id ? a.id + ":" + b.id : b.id + ":" + a.id;
    }

    function findReaction(a, b) {
        if (!isFusionPhase()) return null;
        if (a.core || b.core) return null;

        for (var i = 0; i < CONFIG.reactions.length; i += 1) {
            var r = CONFIG.reactions[i];
            if (!isReactionUnlocked(r)) continue;
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

    function isPairInsideFusionZone(a, b) {
        var core = getCore();
        if (!core) return false;

        var mx = (a.x + b.x) * 0.5;
        var my = (a.y + b.y) * 0.5;
        var mdx = mx - core.x;
        var mdy = my - core.y;
        var r = fusionRadius() + CONFIG.game.pairFusionZonePadding;

        if (mdx * mdx + mdy * mdy > r * r) {
            return false;
        }

        var adx = a.x - core.x;
        var ady = a.y - core.y;
        var bdx = b.x - core.x;
        var bdy = b.y - core.y;
        var outer = fusionRadius() + CONFIG.game.pairFusionZonePadding * 1.35;

        return adx * adx + ady * ady <= outer * outer && bdx * bdx + bdy * bdy <= outer * outer;
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
                var inZone = isPairInsideFusionZone(a, b);

                if (reaction && inZone && d < CONFIG.game.validPairAttractRange) {
                    var attract01 = 1 - d / CONFIG.game.validPairAttractRange;
                    var attract = CONFIG.game.validPairAttractForce * attract01;
                    var aMass = Math.pow(Math.max(1, a.mass), 0.42);
                    var bMass = Math.pow(Math.max(1, b.mass), 0.42);

                    a.vx += nx * attract * dt / aMass;
                    a.vy += ny * attract * dt / aMass;
                    b.vx -= nx * attract * dt / bMass;
                    b.vy -= ny * attract * dt / bMass;

                }

                if (reaction && d < CONFIG.game.fusionDistance + (a.radius + b.radius) * CONFIG.game.visualScale) {
                    var key = reactionKey(a, b);
                    var heatTarget = (reaction.heat || CONFIG.game.fusionHeatSeconds) * CONFIG.game.fusionHoldScaleInsideCore;

                    activeKeys[key] = true;
                    state.linkCount += 1;

                    if (!state.fusionHeat[key]) {
                        state.fusionHeat[key] = { heat: 0, label: reaction.label };
                    }

                    if (inZone) {
                        var contactD = (a.radius + b.radius) * CONFIG.game.visualScale + CONFIG.game.validPairMinDistance;
                        if (d < contactD) {
                            state.fusionHeat[key].heat = heatTarget;
                        } else {
                            state.fusionHeat[key].heat += dt;
                        }
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
                } else if (inZone && !reaction && d < CONFIG.game.invalidPairRange) {
                    var repel01 = 1 - d / CONFIG.game.invalidPairRange;
                    var future = anyFutureReaction(a, b);
                    var repel = CONFIG.game.invalidPairRepelForce * repel01 * (future ? 0.35 : 1.0);

                    a.vx -= nx * repel * dt / Math.pow(Math.max(1, a.mass), 0.42);
                    a.vy -= ny * repel * dt / Math.pow(Math.max(1, a.mass), 0.42);
                    b.vx += nx * repel * dt / Math.pow(Math.max(1, b.mass), 0.42);
                    b.vy += ny * repel * dt / Math.pow(Math.max(1, b.mass), 0.42);

                    state.invalidPairs.push({ a: a, b: b, alpha: future ? repel01 * 0.45 : repel01 });
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
        product.synthesized = true;
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
        if (!isNodeAbsorbable(node)) return;

        if (isCollapsePhase()) {
            absorbCollapseNode(node);
            return;
        }

        var nucleus = getNucleus(node.nucleusName);
        var oldLevel = getCoreLevel();
        var wasNew = !state.absorbedProducts[node.nucleusName];
        var value = nucleus.absorb || nucleus.mass || 1;

        state.coreMass += value;
        state.absorbedProducts[node.nucleusName] = (state.absorbedProducts[node.nucleusName] || 0) + 1;
        removeNode(node);

        if (wasNew) {
            showUnlock(nucleus.name);
            state.lastReaction = "Unlocked " + nucleus.name;
        } else {
            state.lastReaction = "Absorbed " + nucleus.name + " +" + value.toFixed(1);
        }

        addPulse(node.x, node.y, 150 + Math.min(260, value * 1.45));

        var newLevel = getCoreLevel();
        if (newLevel > oldLevel) {
            state.levelFlash = 1.0;
        }

        if (node.nucleusName === "Fe56") {
            triggerIronCoreCollapse();
        }

        updateAbsorbButtons(true);
        updateGameStats();
    }

    function getCollapseAbsorbValue(typeName) {
        var nucleus = getNucleus(typeName);
        var mass = nucleus.mass || 1;

        // Final phase is intentionally a two-bar decision:
        // Collapse gets the star to the supernova event.
        // Stability decides whether the remnant becomes a neutron star or a black hole.
        if (typeName === "H") return { core: 0.16, collapse: 0.3, stability: 5.5, role: "stability" };
        if (typeName === "D") return { core: 0.28, collapse: 0.5, stability: 6.5, role: "stability" };
        if (typeName === "He3") return { core: 0.42, collapse: 0.8, stability: 6.0, role: "stability" };
        if (typeName === "He4") return { core: 0.64, collapse: 1.3, stability: 5.2, role: "stability" };

        if (mass < 28) {
            return { core: 1.4, collapse: 4.4, stability: 1.8, role: "balanced" };
        }

        if (mass < 44) {
            return { core: 2.4, collapse: 10.8, stability: -8.0, role: "collapse" };
        }

        if (mass < 52) {
            return { core: 3.4, collapse: 15.8, stability: -13.0, role: "collapse" };
        }

        return { core: 4.8, collapse: 21.5, stability: -19.0, role: "collapse" };
    }

    function absorbCollapseNode(node) {
        var nucleus = getNucleus(node.nucleusName);
        var effect = getCollapseAbsorbValue(node.nucleusName);

        state.coreMass += effect.core;
        state.collapseMass += effect.collapse;
        state.stability = clamp(state.stability + effect.stability, 0, 100);

        if (effect.role === "stability") {
            state.lastReaction = nucleus.name + " stabilized the core";
        } else if (effect.role === "balanced") {
            state.lastReaction = nucleus.name + " balanced the collapse";
        } else {
            state.lastReaction = nucleus.name + " drove the collapse";
        }

        removeNode(node);
        addPulse(node.x, node.y, 170 + Math.min(260, effect.collapse * 6));

        if (state.collapseMass >= CONFIG.game.collapseCriticalMass || state.stability <= 0) {
            triggerSupernova();
        }

        updateAbsorbButtons(true);
        updateGameStats();
    }

    function isNodeAbsorbable(n) {
        if (!n || n.core) return false;
        if (!isInsideFusionZone(n)) return false;

        if (isCollapsePhase()) {
            return true;
        }

        if (!isFusionPhase()) return false;

        if (!n.synthesized) return false;
        if (n.nucleusName === "H") return false;
        return true;
    }

    function getAbsorbableNodesByType() {
        var groups = Object.create(null);

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            if (!isNodeAbsorbable(n)) continue;

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
            if (!isNodeAbsorbable(n)) continue;

            var dx = x - n.x;
            var dy = y - n.y;
            var radius = n.radius * CONFIG.game.visualScale + CONFIG.game.absorbClickRadiusBonus;
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
        root.style.top = "18px";
        root.style.transform = "translateX(-50%)";
        root.style.zIndex = "12";
        root.style.display = "none";
        root.style.minWidth = "min(760px, calc(100vw - 36px))";
        root.style.padding = "13px 18px 14px";
        root.style.border = "1px solid rgba(255, 209, 102, 0.32)";
        root.style.borderRadius = "18px";
        root.style.background = "rgba(5, 10, 16, 0.78)";
        root.style.backdropFilter = "blur(14px)";
        root.style.boxShadow = "0 16px 60px rgba(0, 0, 0, 0.36)";
        root.style.overflow = "visible";
        root.style.color = "rgba(215, 227, 244, 0.96)";
        root.style.font = "800 14px SFMono-Regular, Consolas, monospace";
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

    function nucleusChipHtml(name, dimmed, sizePx) {
        var n = getNucleus(name);
        var size = sizePx || 48;
        var opacity = dimmed ? "0.38" : "0.96";
        var border = dimmed ? "0.16" : "0.58";
        var glow = dimmed ? "0.06" : "0.30";
        var fontSize = size >= 46 ? 13 : 10;

        return "<span style='display:inline-flex;align-items:center;justify-content:center;width:" + size + "px;height:" + size + "px;margin:0 2px;border-radius:999px;border:1px solid rgba(" + n.color + "," + border + ");background:radial-gradient(circle at 35% 30%,rgba(255,255,255,0.22),rgba(" + n.color + ",0.34) 42%,rgba(5,10,16,0.72) 100%);color:rgba(235,245,255," + opacity + ");box-shadow:0 0 " + Math.round(size * 0.55) + "px rgba(" + n.color + "," + glow + ");font:900 " + fontSize + "px SFMono-Regular,Consolas,monospace;letter-spacing:0.03em;text-align:center;'>" + n.name + "</span>";
    }

    function recipeArrowHtml(dimmed) {
        var color = dimmed ? "rgba(139,155,176,0.34)" : "rgba(255,209,102,0.95)";
        return "<span style='display:inline-flex;align-items:center;justify-content:center;width:30px;color:" + color + ";font:900 21px SFMono-Regular,Consolas,monospace;'>=> </span>";
    }

    function reactionHtml(reaction, active) {
        var dimmed = !active;
        var size = active ? 48 : 30;
        var gap = active ? 8 : 5;
        var opacity = active ? "1" : "0.66";

        return "<span style='display:inline-flex;align-items:center;justify-content:center;gap:" + gap + "px;opacity:" + opacity + ";white-space:nowrap;'>"
            + nucleusChipHtml(reaction.a, dimmed, size)
            + "<span style='color:rgba(180,205,235," + (active ? "0.82" : "0.56") + ");font:900 " + (active ? 18 : 12) + "px SFMono-Regular,Consolas,monospace;'>+</span>"
            + nucleusChipHtml(reaction.b, dimmed, size)
            + recipeArrowHtml(dimmed)
            + nucleusChipHtml(reaction.product, dimmed, size)
            + "</span>";
    }

    function unlockedRecipeStripHtml(primary) {
        var unlocked = getUnlockedRecipeList();
        var items = [];
        var start = Math.max(0, unlocked.length - 8);

        for (var i = start; i < unlocked.length; i += 1) {
            var reaction = unlocked[i];
            if (primary && reaction.product === primary.product) continue;
            items.push(reactionHtml(reaction, false));
        }

        if (items.length <= 0) return "";

        var mid = Math.ceil(items.length / 2);
        var leftItems = items.slice(0, mid).join("");
        var rightItems = items.slice(mid).join("");

        return ""
            + "<div style='position:absolute;right:calc(100% + 16px);top:50%;transform:translateY(-50%);width:clamp(0px,calc((100vw - 850px)/2),330px);display:flex;gap:10px;justify-content:flex-end;overflow:hidden;pointer-events:none;'>"
            + leftItems
            + "</div>"
            + "<div style='position:absolute;left:calc(100% + 16px);top:50%;transform:translateY(-50%);width:clamp(0px,calc((100vw - 850px)/2),330px);display:flex;gap:10px;justify-content:flex-start;overflow:hidden;pointer-events:none;'>"
            + rightItems
            + "</div>";
    }

    function updateRecipeUi() {
        if (!state.gameMode) {
            hideRecipeUi();
            return;
        }

        ensureRecipeUi();

        if (isCollapsePhase()) {
            var massPct = clamp(state.collapseMass / CONFIG.game.collapseCriticalMass * 100, 0, 100);
            var stabilityPct = clamp(state.stability, 0, 100);
            var predicted = stabilityPct >= CONFIG.game.collapseNeutronStabilityMin && state.collapseMass < CONFIG.game.collapseBlackHoleMass
                ? "LIKELY NEUTRON STAR"
                : "BLACK HOLE RISK";

            state.recipeRoot.innerHTML = ""
                + "<div style='display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:10px;'>"
                + "<span style='color:rgba(255,107,139,0.94);font-size:11px;letter-spacing:0.18em;'>IRON CORE</span>"
                + "<span style='color:rgba(255,209,102,0.86);font-size:11px;letter-spacing:0.10em;'>" + predicted + "</span>"
                + "</div>"
                + finalBarHtml("Collapse", massPct, "255,107,139")
                + finalBarHtml("Stability", stabilityPct, "143,214,255")
                + collapseLegendHtml();
            state.recipeRoot.style.display = "block";
            return;
        }

        if (isSupernovaPhase()) {
            state.recipeRoot.innerHTML = ""
                + "<div style='text-align:center;color:rgba(255,245,190,0.98);font:900 24px Inter,Arial,sans-serif;letter-spacing:0.10em;'>SUPERNOVA</div>"
                + "<div style='margin-top:8px;text-align:center;color:rgba(139,155,176,0.82);font:800 11px SFMono-Regular,Consolas,monospace;'>REMNANT: " + state.endingType + "</div>";
            state.recipeRoot.style.display = "block";
            return;
        }

        if (isEndingPhase()) {
            state.recipeRoot.innerHTML = ""
                + "<div style='text-align:center;color:rgba(255,209,102,0.92);font:900 11px SFMono-Regular,Consolas,monospace;letter-spacing:0.20em;'>FINAL REMNANT</div>"
                + "<div style='margin-top:8px;text-align:center;color:rgba(235,245,255,0.98);font:900 26px Inter,Arial,sans-serif;letter-spacing:0.06em;'>" + state.endingType + "</div>";
            state.recipeRoot.style.display = "block";
            return;
        }

        var recipe = getPrimaryRecipe();
        var unlocked = isReactionUnlocked(recipe);
        var stage = getGrowthStage();
        var lockText = unlocked ? "" : "<span style='margin-left:10px;color:rgba(255,107,139,0.84);font:900 10px SFMono-Regular,Consolas,monospace;'>ABSORB " + recipe.requiresAbsorbed + "</span>";
        var strip = unlockedRecipeStripHtml(recipe);

        state.recipeRoot.innerHTML = ""
            + strip
            + "<div style='display:flex;align-items:center;justify-content:space-between;gap:14px;margin-bottom:9px;'>"
            + "<span style='color:rgba(143,214,255,0.86);font-size:11px;letter-spacing:0.18em;'>LV " + pad2(getCoreLevel()) + "</span>"
            + "<span style='color:rgba(215,227,244,0.72);font-size:11px;letter-spacing:0.10em;'>" + stage.title + "</span>"
            + "<span style='color:rgba(255,209,102,0.88);font-size:11px;letter-spacing:0.10em;'>STAR MASS " + state.coreMass.toFixed(0) + "</span>"
            + "</div>"
            + "<div style='display:flex;align-items:center;justify-content:center;gap:8px;white-space:nowrap;'>"
            + reactionHtml(recipe, true)
            + lockText
            + "</div>";

        state.recipeRoot.style.display = "block";
    }

    function collapseLegendHtml() {
        return ""
            + "<div style='display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:10px;'>"
            + collapseLegendCell("LIGHT", "H D He", "+ Stability", "143,214,255")
            + collapseLegendCell("BALANCED", "C O Ne Mg", "+ Both", "255,209,102")
            + collapseLegendCell("HEAVY", "Si Fe", "+ Collapse / - Stability", "255,107,139")
            + "</div>";
    }

    function collapseLegendCell(title, examples, effect, color) {
        return ""
            + "<div style='border:1px solid rgba(" + color + ",0.22);border-radius:12px;background:rgba(5,10,16,0.36);padding:8px 9px;text-align:center;'>"
            + "<div style='color:rgba(" + color + ",0.92);font:900 10px SFMono-Regular,Consolas,monospace;letter-spacing:0.12em;'>" + title + "</div>"
            + "<div style='color:rgba(215,227,244,0.76);font:800 10px SFMono-Regular,Consolas,monospace;margin-top:4px;'>" + examples + "</div>"
            + "<div style='color:rgba(139,155,176,0.86);font:800 10px SFMono-Regular,Consolas,monospace;margin-top:4px;'>" + effect + "</div>"
            + "</div>";
    }

    function finalBarHtml(label, pct, color) {
        return ""
            + "<div style='display:grid;grid-template-columns:88px 1fr 42px;align-items:center;gap:10px;margin:7px 0;'>"
            + "<span style='color:rgba(139,155,176,0.86);font:800 10px SFMono-Regular,Consolas,monospace;letter-spacing:0.12em;text-transform:uppercase;'>" + label + "</span>"
            + "<span style='height:9px;border:1px solid rgba(" + color + ",0.26);border-radius:999px;background:rgba(5,10,16,0.62);overflow:hidden;display:block;'>"
            + "<i style='display:block;height:100%;width:" + pct.toFixed(1) + "%;background:linear-gradient(90deg,rgba(" + color + ",0.45),rgba(" + color + ",0.95));box-shadow:0 0 16px rgba(" + color + ",0.48);'></i>"
            + "</span>"
            + "<b style='color:rgba(215,227,244,0.86);font:900 10px SFMono-Regular,Consolas,monospace;text-align:right;'>" + pct.toFixed(0) + "%</b>"
            + "</div>";
    }

    function configureLegacyGameHud(enabled) {
        var stats = document.querySelectorAll(".game-stat");
        for (var i = 0; i < stats.length; i += 1) {
            stats[i].style.display = enabled ? "none" : "";
        }

        var progress = document.querySelector(".game-progress");
        if (progress) progress.style.display = enabled ? "none" : "";

        var topbar = document.querySelector(".game-topbar");
        if (topbar) {
            topbar.style.gridTemplateColumns = enabled ? "auto" : "";
            topbar.style.justifyContent = enabled ? "end" : "";
            topbar.style.pointerEvents = enabled ? "none" : "";
        }

        var exit = document.getElementById("exit-game");
        if (exit) {
            exit.style.minHeight = enabled ? "42px" : "";
            exit.style.minWidth = enabled ? "78px" : "";
            exit.style.padding = enabled ? "0 14px" : "";
            exit.style.pointerEvents = "auto";
        }
    }

    function ensureVersionUi() {
        if (state.versionRoot) {
            state.versionRoot.textContent = "build " + CONFIG.buildVersion;
            state.versionRoot.style.display = state.gameMode ? "block" : "none";
            return;
        }

        var root = document.createElement("div");
        root.id = "build-version-badge";
        root.textContent = "build " + CONFIG.buildVersion;
        root.style.position = "fixed";
        root.style.right = "18px";
        root.style.bottom = "18px";
        root.style.zIndex = "90";
        root.style.padding = "8px 10px";
        root.style.border = "1px solid rgba(99, 166, 255, 0.16)";
        root.style.borderRadius = "12px";
        root.style.background = "rgba(5, 10, 16, 0.72)";
        root.style.color = "rgba(180, 205, 235, 0.92)";
        root.style.font = "700 11px SFMono-Regular, Consolas, monospace";
        root.style.letterSpacing = "0.08em";
        root.style.pointerEvents = "none";
        root.style.display = "none";
        document.body.appendChild(root);
        state.versionRoot = root;
    }

    function hideVersionUi() {
        if (state.versionRoot) state.versionRoot.style.display = "none";
    }

    function ensureUnlockUi() {
        if (state.unlockRoot) return;

        var root = document.createElement("div");
        root.id = "unlock-banner";
        root.style.position = "fixed";
        root.style.left = "50%";
        root.style.top = "42%";
        root.style.transform = "translate(-50%, -50%)";
        root.style.zIndex = "14";
        root.style.pointerEvents = "none";
        root.style.display = "none";
        root.style.textAlign = "center";
        root.style.padding = "20px 28px";
        root.style.border = "1px solid rgba(255, 209, 102, 0.46)";
        root.style.borderRadius = "24px";
        root.style.background = "rgba(5, 10, 16, 0.76)";
        root.style.backdropFilter = "blur(14px)";
        root.style.boxShadow = "0 0 70px rgba(255, 209, 102, 0.22)";
        document.body.appendChild(root);
        state.unlockRoot = root;
    }

    function hideUnlockUi() {
        if (state.unlockRoot) state.unlockRoot.style.display = "none";
    }

    function showUnlock(name) {
        ensureUnlockUi();
        state.unlockTimer = 2.2;
        state.unlockName = name;
        state.unlockRoot.innerHTML = ""
            + "<div style='color:rgba(255,209,102,0.94);font:900 12px SFMono-Regular,Consolas,monospace;letter-spacing:0.22em;margin-bottom:8px;'>NEW NUCLEUS</div>"
            + "<div style='color:rgba(235,245,255,0.98);font:900 38px Inter,Arial,sans-serif;letter-spacing:0.02em;text-shadow:0 0 24px rgba(255,209,102,0.35);'>" + name + "</div>"
            + "<div style='color:rgba(139,155,176,0.82);font:800 11px SFMono-Regular,Consolas,monospace;letter-spacing:0.12em;margin-top:8px;'>RECIPE UNLOCKED</div>";
        state.unlockRoot.style.opacity = "1";
        state.unlockRoot.style.display = "block";
    }

    function updateUnlockUi(dt) {
        if (!state.unlockRoot || state.unlockTimer <= 0) return;
        state.unlockTimer -= dt;
        var t = clamp(state.unlockTimer / 2.2, 0, 1);
        state.unlockRoot.style.opacity = String(clamp(t * 1.35, 0, 1));
        state.unlockRoot.style.transform = "translate(-50%, -50%) scale(" + (1 + (1 - t) * 0.08).toFixed(3) + ")";
        if (state.unlockTimer <= 0) {
            state.unlockRoot.style.display = "none";
        }
    }

    function ensureFinalUi() {
        if (state.finalRoot) return;

        var root = document.createElement("div");
        root.id = "final-summary-panel";
        root.style.position = "fixed";
        root.style.left = "50%";
        root.style.top = "50%";
        root.style.transform = "translate(-50%, -50%)";
        root.style.zIndex = "18";
        root.style.display = "none";
        root.style.width = "min(620px, calc(100vw - 36px))";
        root.style.padding = "26px 30px";
        root.style.border = "1px solid rgba(255, 209, 102, 0.42)";
        root.style.borderRadius = "28px";
        root.style.background = "rgba(5, 10, 16, 0.84)";
        root.style.backdropFilter = "blur(18px)";
        root.style.boxShadow = "0 0 90px rgba(255, 209, 102, 0.22), 0 26px 90px rgba(0,0,0,0.55)";
        root.style.color = "rgba(235,245,255,0.96)";
        root.style.textAlign = "center";
        root.style.pointerEvents = "auto";
        document.body.appendChild(root);
        state.finalRoot = root;
    }

    function hideFinalUi() {
        if (state.finalRoot) {
            state.finalRoot.style.display = "none";
        }
    }

    function showFinalUi() {
        ensureFinalUi();

        var remnantColor = state.endingType === "BLACK HOLE" ? "255, 160, 82" : "143, 214, 255";
        var discovered = Object.keys(state.absorbedProducts).length;
        var thanks = state.endingType === "BLACK HOLE"
            ? "The core crossed the stability limit and collapsed into a black hole."
            : "The supernova left behind a compact neutron star.";

        state.finalRoot.innerHTML = ""
            + "<div style='color:rgba(255,209,102,0.96);font:900 12px SFMono-Regular,Consolas,monospace;letter-spacing:0.22em;margin-bottom:8px;'>FINAL REMNANT</div>"
            + "<div style='color:rgba(" + remnantColor + ",0.98);font:900 44px Inter,Arial,sans-serif;letter-spacing:0.04em;text-shadow:0 0 28px rgba(" + remnantColor + ",0.45);'>" + state.endingType + "</div>"
            + "<div style='margin-top:10px;color:rgba(215,227,244,0.78);font:800 13px SFMono-Regular,Consolas,monospace;line-height:1.5;'>" + thanks + "</div>"
            + "<div style='display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:22px 0 20px;'>"
            + finalSummaryCell("Star mass", state.coreMass.toFixed(0))
            + finalSummaryCell("Collapse", clamp(state.collapseMass / CONFIG.game.collapseCriticalMass * 100, 0, 999).toFixed(0) + "%")
            + finalSummaryCell("Stability", clamp(state.stability, 0, 100).toFixed(0) + "%")
            + "</div>"
            + "<div style='color:rgba(139,155,176,0.92);font:800 12px SFMono-Regular,Consolas,monospace;margin-bottom:18px;'>Discovered nuclei: " + discovered + " / " + CONFIG.reactions.length + "<br>Thanks for playing.</div>"
            + "<div style='display:flex;justify-content:center;gap:12px;flex-wrap:wrap;'>"
            + "<button id='final-new-star' type='button' style='min-height:44px;padding:0 18px;border:1px solid rgba(143,214,255,0.42);border-radius:14px;background:rgba(99,166,255,0.16);color:rgba(235,245,255,0.96);font:900 12px SFMono-Regular,Consolas,monospace;letter-spacing:0.12em;cursor:pointer;'>NEW STAR</button>"
            + "<button id='final-exit' type='button' style='min-height:44px;padding:0 18px;border:1px solid rgba(255,209,102,0.34);border-radius:14px;background:rgba(255,209,102,0.14);color:rgba(255,244,228,0.96);font:900 12px SFMono-Regular,Consolas,monospace;letter-spacing:0.12em;cursor:pointer;'>EXIT</button>"
            + "</div>";

        state.finalRoot.style.display = "block";

        var newStar = document.getElementById("final-new-star");
        var exit = document.getElementById("final-exit");

        if (newStar) {
            newStar.addEventListener("click", function () {
                hideFinalUi();
                resetCoreGame();
            });
        }

        if (exit) {
            exit.addEventListener("click", function () {
                exitGameMode();
            });
        }
    }

    function finalSummaryCell(label, value) {
        return ""
            + "<div style='border:1px solid rgba(99,166,255,0.18);border-radius:16px;background:rgba(255,255,255,0.035);padding:12px 8px;'>"
            + "<div style='color:rgba(139,155,176,0.92);font:900 10px SFMono-Regular,Consolas,monospace;letter-spacing:0.12em;text-transform:uppercase;'>" + label + "</div>"
            + "<div style='margin-top:7px;color:rgba(235,245,255,0.96);font:900 20px SFMono-Regular,Consolas,monospace;'>" + value + "</div>"
            + "</div>";
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

        if (isCollapsePhase()) {
            state.spawnTimer = CONFIG.game.finalSpawnInterval;
        } else {
            state.spawnTimer = Math.max(0.38, CONFIG.game.spawnInterval - Math.sqrt(state.coreMass) * 0.014);
        }
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
                maxSpeed *= CONFIG.game.insideCoreSpeedScale / Math.pow(Math.max(1, n.mass), CONFIG.game.insideCoreHeavySpeedPower);
                if (n.synthesized && n.nucleusName !== "H") {
                    maxSpeed *= 1.18;
                }
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

            var core = getCore();
            if (core) {
                var cdx = n.x - core.x;
                var cdy = n.y - core.y;
                var cd = Math.sqrt(cdx * cdx + cdy * cdy) + 0.001;
                var coreBlockRadius = coreRadius() + n.radius * CONFIG.game.visualScale + 9;
                if (cd < coreBlockRadius) {
                    var cnx = cdx / cd;
                    var cny = cdy / cd;
                    n.x = core.x + cnx * coreBlockRadius;
                    n.y = core.y + cny * coreBlockRadius;
                    var inward = n.vx * cnx + n.vy * cny;
                    if (inward < 0) {
                        n.vx -= inward * cnx * 1.65;
                        n.vy -= inward * cny * 1.65;
                    }
                    n.vx += cnx * 22 * dt;
                    n.vy += cny * 22 * dt;
                }
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

    function triggerIronCoreCollapse() {
        if (!isFusionPhase()) return;

        state.finalPhase = "collapse";
        state.collapseMass = 0;
        state.stability = 68;
        state.supernovaTimer = 0;
        state.endingType = "";
        state.lastReaction = "IRON CORE COLLAPSE";
        state.levelFlash = 1.0;

        showUnlock("IRON CORE");
        addPulse(getCore().x, getCore().y, 300);
    }

    function triggerSupernova() {
        if (!isCollapsePhase()) return;

        state.finalPhase = "supernova";
        state.supernovaTimer = CONFIG.game.supernovaDuration;
        state.endingType = chooseEndingType();
        state.lastReaction = "SUPERNOVA";

        showUnlock("SUPERNOVA");
        addPulse(getCore().x, getCore().y, 520);
    }

    function chooseEndingType() {
        if (state.stability <= CONFIG.game.collapseNeutronStabilityMin) {
            return "BLACK HOLE";
        }
        if (state.collapseMass >= CONFIG.game.collapseBlackHoleMass) {
            return "BLACK HOLE";
        }
        return "NEUTRON STAR";
    }

    function updateSupernova(dt) {
        state.supernovaTimer -= dt;
        state.collapseMass = Math.min(CONFIG.game.collapseBlackHoleMass, state.collapseMass + dt * 4.0);

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            if (n.core) continue;

            var core = getCore();
            var dx = n.x - core.x;
            var dy = n.y - core.y;
            var d = Math.sqrt(dx * dx + dy * dy) + 0.001;
            var push = 420 * dt / Math.pow(Math.max(1, n.mass), 0.32);
            n.vx += (dx / d) * push;
            n.vy += (dy / d) * push;
        }

        integrateGameNodes(dt);

        if (state.supernovaTimer <= 0) {
            state.finalPhase = "ending";
            state.lastReaction = state.endingType + " FORMED";
            state.nodes = state.nodes.length > 0 ? [state.nodes[0]] : state.nodes;
            showUnlock(state.endingType);
            showFinalUi();
        }
    }

    function updateGamePhysics(dt, time) {
        state.absorbUiTimer -= dt;
        updateUnlockUi(dt);
        state.levelFlash = Math.max(0, state.levelFlash - dt * 1.8);

        if (isEndingPhase()) {
            updateAbsorbButtons(false);
            return;
        }

        if (isSupernovaPhase()) {
            updateSupernova(dt);
            updateAbsorbButtons(false);
            return;
        }

        updateSpawner(dt);
        applyOrbitForces(dt, time);
        applyGamePointerForces(dt);
        applyPulseForces(dt);

        if (isFusionPhase()) {
            applyPairForcesAndFusion(dt);
        } else {
            state.hotPairs = [];
            state.invalidPairs = [];
            state.linkCount = 0;
        }

        integrateGameNodes(dt);

        if (isFusionPhase()) {
            decayUnstableNuclei();
        }

        updateAbsorbButtons(false);
    }

    function drawGameBackdrop() {
        if (!state.gameMode) return;

        var darkness = clamp(0.80 - Math.log(1 + state.coreMass) * 0.055, 0.34, 0.80);

        if (isCollapsePhase()) {
            darkness = 0.48;
        } else if (isSupernovaPhase()) {
            darkness = 0.22;
        } else if (isEndingPhase()) {
            darkness = state.endingType === "BLACK HOLE" ? 0.78 : 0.34;
        }

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
        var coreColor = "255, 209, 102";

        if (isCollapsePhase()) {
            coreColor = "255, 107, 139";
            glow = 0.42 + (1 - state.stability / 100) * 0.26;
        } else if (isSupernovaPhase()) {
            coreColor = "255, 245, 190";
            glow = 0.92;
        } else if (isEndingPhase()) {
            coreColor = state.endingType === "BLACK HOLE" ? "8, 12, 20" : "143, 214, 255";
            glow = state.endingType === "BLACK HOLE" ? 0.42 : 0.72;
        }

        ctx.save();

        var gradient = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, fr);
        gradient.addColorStop(0, "rgba(" + coreColor + ", " + glow.toFixed(4) + ")");
        gradient.addColorStop(0.32, "rgba(99, 166, 255, 0.075)");
        gradient.addColorStop(1, "rgba(99, 166, 255, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(core.x, core.y, fr, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = isCollapsePhase() ? "rgba(255, 107, 139, 0.34)" : "rgba(255, 209, 102, 0.22)";
        ctx.lineWidth = 1;
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.arc(core.x, core.y, fr, 0, Math.PI * 2);
        ctx.stroke();

        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.arc(core.x, core.y, cr, 0, Math.PI * 2);

        if (isEndingPhase() && state.endingType === "BLACK HOLE") {
            var black = ctx.createRadialGradient(core.x, core.y, 0, core.x, core.y, cr * 2.2);
            black.addColorStop(0, "rgba(0, 0, 0, 1)");
            black.addColorStop(0.62, "rgba(2, 5, 12, 1)");
            black.addColorStop(0.72, "rgba(255, 160, 82, 0.75)");
            black.addColorStop(1, "rgba(255, 107, 139, 0)");
            ctx.fillStyle = black;
            ctx.shadowColor = "rgba(255, 107, 139, 0.62)";
            ctx.shadowBlur = 38;
        } else {
            ctx.fillStyle = "rgba(" + coreColor + ", 0.68)";
            ctx.shadowColor = "rgba(" + coreColor + ", 0.58)";
            ctx.shadowBlur = isEndingPhase() ? 58 : 26 + level * 4;
        }

        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 245, 190, 0.64)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

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

    function isPrimaryAbsorbTarget(n) {
        if (!n || !isFusionPhase()) return false;
        var recipe = getPrimaryRecipe();
        return !!recipe && n.nucleusName === recipe.product;
    }

    function drawNodes(time) {
        ctx.save();

        for (var i = 0; i < state.nodes.length; i += 1) {
            var n = state.nodes[i];
            if (n.core && state.gameMode) continue;

            var nucleusColor = n.nucleus ? n.nucleus.color : "99, 166, 255";
            var pulse = 0.75 + Math.sin(time * 0.002 + (n.pulse || n.phase || 0)) * 0.25;
            var blink = 0.55 + Math.sin(time * 0.012 + (n.pulse || 0)) * 0.45;
            var radius = (n.radius || n.size || 2) * (state.gameMode ? CONFIG.game.visualScale : 1.0);
            var size = radius + pulse * (state.gameMode ? 1.35 : 0.8);
            var alpha = state.gameMode ? 0.84 : 0.42;
            var absorbable = state.gameMode && isNodeAbsorbable(n);

            if (n.unstable) {
                alpha = 0.56 + Math.sin(time * 0.018) * 0.18;
            }

            if (absorbable) {
                var primaryGlow = isPrimaryAbsorbTarget(n);
                var glowPulse = primaryGlow ? blink : 0.25 + blink * 0.22;
                var glowAlpha = primaryGlow ? (0.045 + glowPulse * 0.075) : (0.025 + glowPulse * 0.035);
                var ringAlpha = primaryGlow ? (0.24 + glowPulse * 0.26) : (0.16 + glowPulse * 0.10);

                ctx.beginPath();
                ctx.arc(n.x, n.y, size + (primaryGlow ? 14 : 10) + glowPulse * 4, 0, Math.PI * 2);
                ctx.fillStyle = "rgba(255, 209, 102, " + glowAlpha.toFixed(4) + ")";
                ctx.shadowColor = "rgba(255, 209, 102, " + (primaryGlow ? "0.38" : "0.18") + ")";
                ctx.shadowBlur = primaryGlow ? 16 + glowPulse * 12 : 9 + glowPulse * 5;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(n.x, n.y, size + (primaryGlow ? 8 : 6) + glowPulse * 2, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255, 245, 190, " + ringAlpha.toFixed(4) + ")";
                ctx.lineWidth = primaryGlow ? 1.35 : 1.0;
                ctx.stroke();
            }

            ctx.beginPath();
            ctx.arc(n.x, n.y, size, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(" + nucleusColor + ", " + alpha.toFixed(4) + ")";
            ctx.shadowColor = "rgba(" + nucleusColor + ", 0.48)";
            ctx.shadowBlur = state.gameMode ? 22 : 10;
            ctx.fill();

            ctx.shadowBlur = 0;
            ctx.beginPath();
            ctx.arc(n.x, n.y, size + 4, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(" + nucleusColor + ", " + (state.gameMode ? 0.28 : 0.08).toFixed(4) + ")";
            ctx.lineWidth = 1;
            ctx.stroke();

            if (state.gameMode && (n.nucleusName !== "H" || absorbable)) {
                ctx.fillStyle = "rgba(235, 245, 255, 0.90)";
                ctx.font = "11px SFMono-Regular, Consolas, monospace";
                ctx.textAlign = "center";
                ctx.fillText(n.nucleus.name, n.x, n.y - size - 10);
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

    function drawSupernovaOverlay(time) {
        if (!state.gameMode) return;
        if (!isSupernovaPhase() && !isEndingPhase()) return;

        var core = getCore();
        if (!core) return;

        ctx.save();

        if (isSupernovaPhase()) {
            var t = 1 - clamp(state.supernovaTimer / CONFIG.game.supernovaDuration, 0, 1);
            for (var i = 0; i < 4; i += 1) {
                var r = (t * 900) + i * 120;
                ctx.beginPath();
                ctx.arc(core.x, core.y, r, 0, Math.PI * 2);
                ctx.strokeStyle = "rgba(255, 209, 102, " + (0.42 * (1 - t) / (i + 1)).toFixed(4) + ")";
                ctx.lineWidth = 2 + i;
                ctx.stroke();
            }

            ctx.fillStyle = "rgba(255, 245, 190, " + (0.26 * (1 - Math.abs(t - 0.45))).toFixed(4) + ")";
            ctx.fillRect(0, 0, state.width, state.height);
        }

        if (isEndingPhase()) {
            ctx.textAlign = "center";
            ctx.font = "900 46px Inter, Arial, sans-serif";
            ctx.fillStyle = state.endingType === "BLACK HOLE" ? "rgba(255, 180, 130, 0.98)" : "rgba(180, 225, 255, 0.98)";
            ctx.shadowColor = state.endingType === "BLACK HOLE" ? "rgba(255, 107, 139, 0.55)" : "rgba(143, 214, 255, 0.55)";
            ctx.shadowBlur = 28;
            ctx.fillText(state.endingType, state.width * 0.5, state.height * 0.5 - 92);

            ctx.font = "800 13px SFMono-Regular, Consolas, monospace";
            ctx.fillStyle = "rgba(215, 227, 244, 0.78)";
            ctx.shadowBlur = 0;
            ctx.fillText("SUPERNOVA REMNANT FORMED", state.width * 0.5, state.height * 0.5 - 58);
        }

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
            if (isCollapsePhase()) {
                dom.gameMessage.textContent = state.lastReaction + " | Fill Collapse to trigger supernova. Keep Stability high for neutron star; let it fall for black hole.";
            } else if (isSupernovaPhase()) {
                dom.gameMessage.textContent = "SUPERNOVA | Outcome: " + state.endingType;
            } else if (isEndingPhase()) {
                dom.gameMessage.textContent = "Final remnant formed: " + state.endingType;
            } else {
                dom.gameMessage.textContent = state.lastReaction + " | Click glowing fused nuclei to absorb. Raw H is fuel, not food.";
            }
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
        drawSupernovaOverlay(time);
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
