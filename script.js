const channelID = "3258996";
const readAPIKey = "KQOVOAKJ6NVNWL3K";

const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=1`;

let modalShown = false;

async function fetchData() {
    const response = await fetch(url);
    const data = await response.json();
    const feed = data.feeds[0];

    const temp = parseFloat(feed.field1);
    const hum = parseFloat(feed.field2);
    const soil = parseFloat(feed.field3);
    const rain = parseInt(feed.field4);
    const light = parseInt(feed.field5);

    updateUI(temp, hum, soil, rain, light);
}

function updateUI(temp, hum, soil, rain, light) {

    document.getElementById("temp").innerText = temp.toFixed(1) + " °C";
    document.getElementById("humidity").innerText = hum.toFixed(1) + " %";
    document.getElementById("soil").innerText = soil.toFixed(0) + " %";
    document.getElementById("light").innerText = light === 1 ? "BRIGHT" : "DARK";

    const health = calculateHealth(soil, temp);
    document.getElementById("health").innerText = health;
    document.getElementById("healthFill").style.width = health + "%";

    updateStatus(health);

    const irrigation = irrigationLogic(soil, rain, light);
    document.getElementById("irrigation").innerText = irrigation;

    checkCritical(soil, health);
}

function calculateHealth(soil, temp) {

    let score = 100;

    if (soil <= 5) score -= 70;
    else if (soil <= 15) score -= 55;
    else if (soil <= 25) score -= 35;
    else if (soil <= 35) score -= 20;

    if (soil >= 90) score -= 50;

    if (temp >= 45) score -= 25;
    else if (temp >= 40) score -= 15;

    return Math.max(0, score);
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

function irrigationLogic(soil, rain, light) {

    if (soil < 25 && rain === 0 && light === 1)
        return "IRRIGATION REQUIRED";

    if (soil < 25 && rain === 1)
        return "RAIN DETECTED – WAIT";

    return "NOT REQUIRED";
}

function checkCritical(soil, health) {

    if (soil < 20 && health < 40 && !modalShown) {
        document.getElementById("alertMessage").innerText =
            "Soil moisture critically low. Immediate irrigation recommended.";
        document.getElementById("alertModal").style.display = "block";
        modalShown = true;
    }

    if (soil >= 25) {
        modalShown = false;
    }
}

function closeModal() {
    document.getElementById("alertModal").style.display = "none";
}

setInterval(fetchData, 10000);
fetchData();
