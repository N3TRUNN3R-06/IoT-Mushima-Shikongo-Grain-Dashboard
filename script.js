const channelID = "3258996";
const readAPIKey = "KQOVOAKJ6NVNWL3K";

const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=1`;

let lastAlertLevel = "stable";

async function fetchData() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.feeds || data.feeds.length === 0) return;

        const feed = data.feeds[0];

        const temperature = parseFloat(feed.field1) || 0;
        const humidity = parseFloat(feed.field2) || 0;
        const soil = parseFloat(feed.field3) || 0;
        const rain = parseInt(feed.field4) || 0;
        const light = parseInt(feed.field5) || 0;

        updateUI(temperature, humidity, soil, rain, light);

    } catch (error) {
        console.error("Fetch error:", error);
    }
}

function updateUI(temp, hum, soil, rain, light) {

    document.getElementById("temp").innerText = `${temp.toFixed(1)} °C`;
    document.getElementById("humidity").innerText = `${hum.toFixed(1)} %`;
    document.getElementById("soil").innerText = `${soil.toFixed(0)} %`;
    document.getElementById("rain").innerText = rain === 1 ? "YES" : "NO";
    document.getElementById("light").innerText = light === 1 ? "BRIGHT" : "DARK";

    const health = calculateHealth(soil, temp, hum, rain);

    document.getElementById("health").innerText = health;
    document.getElementById("healthFill").style.width = health + "%";

    updateStatus(health);
    updateHealthColor(health);

    const irrigationDecision = irrigationLogic(soil, rain, light);
    document.getElementById("irrigation").innerText = irrigationDecision;

    handleNotifications(health, soil, rain, light);
}

function calculateHealth(soil, temp, hum, rain) {

    let score = 100;

    if (soil <= 5) score -= 70;
    else if (soil <= 15) score -= 55;
    else if (soil <= 25) score -= 35;
    else if (soil <= 35) score -= 20;

    if (soil >= 90) score -= 50;

    if (temp >= 45) score -= 25;
    else if (temp >= 40) score -= 15;

    if (hum <= 20) score -= 10;
    if (hum >= 90) score -= 10;

    if (soil < 25 && rain === 1) score += 10;

    return Math.max(0, Math.min(100, score));
}

function irrigationLogic(soil, rain, light) {

    if (soil < 25 && rain === 0 && light === 1)
        return "IRRIGATION REQUIRED";

    if (soil < 25 && rain === 1)
        return "RAIN DETECTED – WAIT";

    if (light === 0)
        return "WAIT – NIGHT";

    return "NOT REQUIRED";
}

function updateStatus(score) {

    const badge = document.getElementById("status");

    if (score >= 70) {
        badge.className = "status stable";
        badge.innerText = "SYSTEM: STABLE";
    }
    else if (score >= 40) {
        badge.className = "status warning";
        badge.innerText = "SYSTEM: WARNING";
    }
    else {
        badge.className = "status critical";
        badge.innerText = "SYSTEM: CRITICAL";
    }
}

function updateHealthColor(score) {
    const fill = document.getElementById("healthFill");

    if (score >= 70)
        fill.style.background = "#22c55e";
    else if (score >= 40)
        fill.style.background = "#fbbf24";
    else
        fill.style.background = "#ef4444";
}

function handleNotifications(health, soil, rain, light) {

    let currentLevel = "stable";

    if (health < 40) currentLevel = "critical";
    else if (health < 70) currentLevel = "warning";

    if (currentLevel !== lastAlertLevel) {

        if (currentLevel === "warning")
            showToast("⚠ Soil conditions suboptimal.", "warning");

        if (currentLevel === "critical")
            showToast("🚨 Immediate irrigation required!", "critical");

        lastAlertLevel = currentLevel;
    }

    if (soil < 25 && rain === 0 && light === 1)
        showToast("💧 Irrigation Recommended Now.", "critical");
}

function showToast(message, type) {

    const container = document.getElementById("toastContainer");

    const toast = document.createElement("div");
    toast.classList.add("toast", type);
    toast.innerText = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add("hide");
        setTimeout(() => toast.remove(), 300);
    }, 4000);
}

setInterval(fetchData, 10000);
fetchData();
