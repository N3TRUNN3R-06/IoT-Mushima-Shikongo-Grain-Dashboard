const channelID = "3258996";
const readAPIKey = "KQOVOAKJ6NVNWL3K";
const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=15`;

let tempChart, soilChart;
let lastAlertLevel = "stable";

async function fetchData() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        const feeds = data.feeds;
        if (!feeds || feeds.length === 0) return;

        const latest = feeds[feeds.length - 1];

        const temp = parseFloat(latest.field1) || 0;
        const hum = parseFloat(latest.field2) || 0;
        const soil = parseFloat(latest.field3) || 0;
        const rain = parseInt(latest.field4) || 0;
        const light = parseInt(latest.field5) || 0;

        updateUI(temp, hum, soil, rain, light);
        updateCharts(feeds);

    } catch (err) {
        console.error(err);
    }
}

function updateUI(temp, hum, soil, rain, light) {
    document.getElementById("temp").innerText = `${temp.toFixed(1)} °C`;
    document.getElementById("humidity").innerText = `${hum.toFixed(1)} %`;
    document.getElementById("soil").innerText = `${soil.toFixed(0)} %`;
    document.getElementById("rain").innerText = rain ? "YES" : "NO";
    document.getElementById("light").innerText = light ? "BRIGHT" : "DARK";

    const health = calculateHealth(soil, temp, hum, rain);

    document.getElementById("health").innerText = health;
    document.getElementById("healthFill").style.width = health + "%";

    updateStatus(health);

    document.getElementById("irrigation").innerText =
        irrigationLogic(soil, rain, light);
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
    if (hum <= 20 || hum >= 90) score -= 10;
    if (soil < 25 && rain === 1) score += 10;

    return Math.max(0, Math.min(100, score));
}

function irrigationLogic(soil, rain, light) {
    if (soil < 25 && rain === 0 && light === 1) return "IRRIGATION REQUIRED";
    if (soil < 25 && rain === 1) return "RAIN DETECTED – WAIT";
    if (light === 0) return "WAIT – NIGHT";
    return "NOT REQUIRED";
}

function updateStatus(score) {
    const badge = document.getElementById("status");
    if (score >= 70) {
        badge.className = "status stable";
        badge.innerText = "SYSTEM: STABLE";
    } else if (score >= 40) {
        badge.className = "status warning";
        badge.innerText = "SYSTEM: WARNING";
    } else {
        badge.className = "status critical";
        badge.innerText = "SYSTEM: CRITICAL";
    }
}

function updateCharts(feeds) {
    const labels = feeds.map((_, i) => i + 1);
    const temps = feeds.map(f => parseFloat(f.field1) || 0);
    const soils = feeds.map(f => parseFloat(f.field3) || 0);

    if (!tempChart) {
        tempChart = new Chart(document.getElementById("tempChart"), {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Temperature (°C)",
                    data: temps,
                    borderColor: "#22c55e",
                    backgroundColor: "rgba(34,197,94,0.2)",
                    fill: true,
                    tension: 0.3
                }]
            }
        });

        soilChart = new Chart(document.getElementById("soilChart"), {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Soil Moisture (%)",
                    data: soils,
                    borderColor: "#fbbf24",
                    backgroundColor: "rgba(251,191,36,0.2)",
                    fill: true,
                    tension: 0.3
                }]
            }
        });

    } else {
        tempChart.data.labels = labels;
        tempChart.data.datasets[0].data = temps;
        tempChart.update();

        soilChart.data.labels = labels;
        soilChart.data.datasets[0].data = soils;
        soilChart.update();
    }
}

setInterval(fetchData, 10000);
fetchData();
