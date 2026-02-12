const channelID = "3258996";
const readAPIKey = "thingspeak"; // YOUR READ KEY

const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=20`;

let tempChart = null;
let soilChart = null;

async function fetchData() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (!data.feeds || data.feeds.length === 0) return;

        const feeds = data.feeds;
        const latest = feeds[feeds.length - 1];

        const temp = parseFloat(latest.field1) || 0;
        const hum = parseFloat(latest.field2) || 0;
        const soil = parseFloat(latest.field3) || 0;
        const rain = parseInt(latest.field4) || 0;
        const light = parseInt(latest.field5) || 0;

        updateUI(temp, hum, soil, rain, light);
        updateCharts(feeds);

    } catch (error) {
        console.error("API Error:", error);
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
}

function calculateHealth(soil, temp, hum, rain) {
    let score = 100;

    if (soil <= 25) score -= 40;
    if (temp >= 40) score -= 15;
    if (hum <= 20 || hum >= 90) score -= 10;
    if (soil < 25 && rain === 1) score += 10;

    return Math.max(0, Math.min(100, score));
}

function updateCharts(feeds) {

    const labels = feeds.map(feed =>
        new Date(feed.created_at).toLocaleTimeString()
    );

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
                    backgroundColor: "rgba(34,197,94,0.15)",
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
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
                    backgroundColor: "rgba(251,191,36,0.15)",
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
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
