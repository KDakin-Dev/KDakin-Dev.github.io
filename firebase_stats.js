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

const STAT_KEYS = ["created", "stable", "magnetars", "blackHoles"];
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);
const statsRef = ref(database, "stats");
let authReady = false;
let authPromise = null;

function padStat(value) {
    const safeValue = Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0;
    return String(Math.floor(safeValue)).padStart(3, "0");
}

function setStatText(key, value) {
    const target = document.querySelector('[data-star-stat="' + key + '"]');
    if (target) {
        target.textContent = padStat(value);
    }
}

function renderStats(stats) {
    const source = stats && typeof stats === "object" ? stats : {};
    STAT_KEYS.forEach(function (key) {
        setStatText(key, source[key] || 0);
    });
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

async function incrementCounter(key) {
    await runTransaction(ref(database, "stats/" + key), function (currentValue) {
        if (typeof currentValue !== "number") {
            return 1;
        }
        return currentValue + 1;
    });
}

async function recordStarOutcome(rawOutcome) {
    const outcomeKey = normalizeOutcome(rawOutcome);
    try {
        await ensureAuth();
        await Promise.all([
            incrementCounter("created"),
            incrementCounter(outcomeKey)
        ]);
    } catch (error) {
        console.warn("Star statistics update failed", error);
    }
}

onValue(statsRef, function (snapshot) {
    renderStats(snapshot.val());
}, function (error) {
    console.warn("Star statistics read failed", error);
    renderStats(null);
});

window.KDakinStarStats = {
    recordStarOutcome: recordStarOutcome,
    renderStats: renderStats
};

window.addEventListener("kdakin:star-game-complete", function (event) {
    const detail = event && event.detail ? event.detail : {};
    recordStarOutcome(detail.outcome || detail.endingType || "stable");
});
