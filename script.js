const channelID = "3258996";
const readAPIKey = "KQOVOAKJ6NVNWL3K";

const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=1`;

async function fetchData() {
    try {
        const response = await fetch(url);
        const data = await response.json();

        const feed = data.feeds[0];

        const temperature = parseFloat(feed.field1);
        const humidity = parseFloat(feed.field2);
        const soil = parseFloat(feed.field3);
        const rain = parseInt(feed.field4);
        const light = parseInt(feed.field5);

        updateUI(temperature, humidity, soil, rain, light);

    } catch (error) {
        console.error("Error fetching data:", error);
    }
}

function updateUI(temp, hum, soil, rain, light) {

    document.getElementById("temp").innerText = temp.toFixed(1) + " °C";
    document.getElementById("humidity").innerText = hum.toFixed(1) + " %";
    document.getElementById("soil").innerText = soil.toFixed(0) + " %";
    document.getElementById("rain").innerText = rain === 1 ? "YES" : "NO";
    document.getElementById("light").innerText = light === 1 ? "BRIGHT" : "DARK";

    const healthScore = calculateCropHealth(soil, temp);
    document.getElementById("health").innerText = healthScore + " / 100";

    updateStatusBadge(healthScore);

    evaluateAlerts(soil, temp, rain, light);
}

function calculateCropHealth(soil, temp) {

    let score = 100;

    // Severe drought
    if (soil <= 10) score -= 60;
    else if (soil <= 20) score -= 45;
    else if (soil <= 30) score -= 25;

    // Flood risk
    if (soil >= 90) score -= 50;
    else if (soil >= 80) score -= 30;

    // Heat stress
    if (temp >= 45) score -= 30;
    else if (temp >= 40) score -= 20;

    return Math.max(0, score);
}

function updateStatusBadge(score) {

    const badge = document.getElementById("status");

    if (score >= 70) {
        badge.innerText = "STABLE";
        badge.className = "status stable";
    }
    else if (score >= 40) {
        badge.innerText = "WARNING";
        badge.className = "status warning";
    }
    else {
        badge.innerText = "CRITICAL";
        badge.className = "status critical";
    }
}

function evaluateAlerts(soil, temp, rain, light) {

    const alertBox = document.getElementById("alertBox");

    // Severe drought
    if (soil < 20 && rain === 0 && light === 1) {
        showAlert("CRITICAL: Severe drought detected. Immediate irrigation required.");
        return;
    }

    // Heat stress
    if (temp > 42) {
        showAlert("WARNING: High temperature stress detected.");
        return;
    }

    // Flood condition
    if (soil > 90) {
        showAlert("WARNING: Soil oversaturation detected.");
        return;
    }

    hideAlert();
}

function showAlert(message) {
    const alertBox = document.getElementById("alertBox");
    alertBox.innerText = message;
    alertBox.style.display = "block";
}

function hideAlert() {
    const alertBox = document.getElementById("alertBox");
    alertBox.style.display = "none";
}

// Auto refresh every 10 seconds
setInterval(fetchData, 10000);
fetchData();
