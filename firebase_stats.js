import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getDatabase, onValue, ref, runTransaction } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyAbRpvmlAWb2fJOcQgNdcwVOUkXf9yFroQ",
    authDomain: "kdakin-dev-stats.firebaseapp.com",
    databaseURL: "https://kdakin-dev-stats-default-rtdb.firebaseio.com",
    projectId: "kdakin-dev-stats",
    storageBucket: "kdakin-dev-stats.firebasestorage.app",
    messagingSenderId: "500304910798",
    appId: "1:500304910798:web:461af507f2971565e8739f"
};

const STAR_STAT_KEYS = ["created", "stable", "magnetars", "blackHoles"];
const SAIL_STAT_KEYS = ["goldLooted", "shipsSunk", "seaTerrors"];
const SAIL_DATABASE_KEYS = {
    goldLooted: "sailGoldLooted",
    shipsSunk: "sailShipsSunk",
    seaTerrors: "sailSeaTerrors"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const statsRef = ref(database, "stats");
let authReady = false;
let authPromise = null;

function toSafeInteger(value) {
    const numberValue = Number(value);
    if (!Number.isFinite(numberValue)) {
        return 0;
    }
    return Math.max(0, Math.floor(numberValue));
}

function padStat(value) {
    return String(toSafeInteger(value)).padStart(3, "0");
}

function setStatText(attributeName, key, value) {
    const target = document.querySelector("[" + attributeName + "=\"" + key + "\"]");
    if (target) {
        target.textContent = padStat(value);
    }
}

function renderStarStats(stats) {
    const source = stats && typeof stats === "object" ? stats : {};
    STAR_STAT_KEYS.forEach(function (key) {
        setStatText("data-star-stat", key, source[key] || 0);
    });
}

function renderSailStats(stats) {
    const source = stats && typeof stats === "object" ? stats : {};
    SAIL_STAT_KEYS.forEach(function (key) {
        setStatText("data-sail-stat", key, source[SAIL_DATABASE_KEYS[key]] || 0);
    });
}

function renderStats(stats) {
    renderStarStats(stats);
    renderSailStats(stats);
}

function normalizeOutcome(rawOutcome) {
    const value = String(rawOutcome || "").toLowerCase();
    if (value === "blackhole" || value === "black_hole" || value === "black-hole" || value === "black hole") {
        return "blackHoles";
    }
    if (value === "magnetar" || value === "magnetars") {
        return "magnetars";
    }
    return "stable";
}

async function ensureAuth() {
    if (authReady) {
        return;
    }
    if (!authPromise) {
        authPromise = signInAnonymously(auth)
            .then(function () {
                authReady = true;
            })
            .catch(function (error) {
                authPromise = null;
                console.warn("Firebase anonymous auth failed", error);
                throw error;
            });
    }
    await authPromise;
}

async function incrementCounter(key, amount) {
    const safeAmount = Math.max(1, toSafeInteger(amount || 1));
    await runTransaction(ref(database, "stats/" + key), function (currentValue) {
        if (typeof currentValue !== "number") {
            return safeAmount;
        }
        return currentValue + safeAmount;
    });
}

async function recordStarOutcome(rawOutcome) {
    const outcomeKey = normalizeOutcome(rawOutcome);
    try {
        await ensureAuth();
        await Promise.all([
            incrementCounter("created", 1),
            incrementCounter(outcomeKey, 1)
        ]);
    } catch (error) {
        console.warn("Star statistics update failed", error);
    }
}

async function recordSailStats(delta) {
    const safeDelta = delta && typeof delta === "object" ? delta : {};
    const updates = [];
    SAIL_STAT_KEYS.forEach(function (key) {
        const amount = toSafeInteger(safeDelta[key]);
        if (amount > 0) {
            updates.push({ key: SAIL_DATABASE_KEYS[key], amount: amount });
        }
    });

    if (updates.length < 1) {
        return;
    }

    try {
        await ensureAuth();
        await Promise.all(updates.map(function (update) {
            return incrementCounter(update.key, update.amount);
        }));
    } catch (error) {
        console.warn("Sail statistics update failed", error);
    }
}

onValue(statsRef, function (snapshot) {
    renderStats(snapshot.val());
}, function (error) {
    console.warn("Statistics read failed", error);
    renderStats(null);
});

window.KDakinStarStats = {
    recordStarOutcome: recordStarOutcome,
    renderStats: renderStarStats
};

window.KDakinSailStats = {
    recordSailStats: recordSailStats,
    renderStats: renderSailStats
};

window.addEventListener("kdakin:star-game-complete", function (event) {
    const detail = event && event.detail ? event.detail : {};
    recordStarOutcome(detail.outcome || detail.endingType || "stable");
});

window.addEventListener("kdakin:sail-stats", function (event) {
    const detail = event && event.detail ? event.detail : {};
    recordSailStats(detail);
});
