const channelID = "3258996";
const readAPI = "KQOVOAKJ6NVNWL3K";
const weatherApiKey = "353c8dee2b841991e6cb38f83b4736de";

// Replace with real farm coordinates
const lat = -17.5;
const lon = 17.0;

const url =
`https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPI}&results=24`;

const weatherURL =
`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;

let tempChart, soilChart;

async function fetchData() {
    const response = await fetch(url);
    const data = await response.json();
    const feeds = data.feeds;
    if (!feeds) return;

    const temps = feeds.map(f => parseFloat(f.field1));
    const soils = feeds.map(f => parseFloat(f.field3));
    const irrigation = feeds.at(-1).field6;

    const latestTemp = temps.at(-1);
    const latestSoil = soils.at(-1);

    document.getElementById("temperature").innerText = latestTemp + " °C";
    document.getElementById("soil").innerText = latestSoil + " %";

    const avgTemp =
        (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1);
    document.getElementById("tempStats").innerText =
        `Avg: ${avgTemp}°C`;

    let soilStress = "Optimal";
    if (latestSoil < 30) soilStress = "Drought Risk";
    if (latestSoil > 80) soilStress = "Waterlogging Risk";
    document.getElementById("soilStress").innerText = soilStress;

    let cropScore = 100;
    if (latestSoil < 30) cropScore -= 25;
    if (latestTemp > 38) cropScore -= 20;
    if (latestSoil > 85) cropScore -= 20;

    document.getElementById("cropScore").innerText = cropScore + "/100";

    const irrigationEl = document.getElementById("irrigation");
    irrigationEl.innerText = irrigation == 1 ? "REQUIRED" : "OK";
    irrigationEl.className =
        irrigation == 1 ? "status alert" : "status ok";

    document.getElementById("systemHealth").innerText =
        cropScore > 70 ? "SYSTEM HEALTH: STABLE" :
        cropScore > 40 ? "SYSTEM HEALTH: WARNING" :
        "SYSTEM HEALTH: CRITICAL";

    updateCharts(temps, soils);

    document.getElementById("analyticsData").innerText =
`24-Sample Temperature Avg: ${avgTemp}°C
Soil Trend: ${soils.at(-1) > soils.at(-2) ? "Rising" : "Falling"}
Yield Risk Estimate: ${100 - cropScore}%`;
}

async function fetchWeather() {
    const response = await fetch(weatherURL);
    const data = await response.json();

    const forecast = data.list[0];
    const temp = forecast.main.temp;
    const condition = forecast.weather[0].main;
    const rainProb = forecast.pop * 100;
    const wind = forecast.wind.speed;

    document.getElementById("weatherTemp").innerText = temp + " °C";
    document.getElementById("weatherCondition").innerText = condition;
    document.getElementById("rainProbability").innerText =
        "Rain Prob: " + rainProb.toFixed(0) + "%";
    document.getElementById("windSpeed").innerText =
        "Wind: " + wind + " m/s";

    const alert = document.getElementById("weatherAlert");

    if (rainProb > 60) {
        alert.innerText =
            "⚠ Heavy Rain Expected — Irrigation Suspended";
        alert.classList.remove("hidden");
    }
    else if (temp > 40) {
        alert.innerText =
            "⚠ Extreme Heat Warning";
        alert.classList.remove("hidden");
    }
    else {
        alert.classList.add("hidden");
    }
}

function updateCharts(tempData, soilData) {
    if (!tempChart) {
        tempChart = new Chart(document.getElementById("tempChart"), {
            type: "line",
            data: {
                labels: tempData.map((_,i)=>i),
                datasets: [{
                    data: tempData,
                    borderColor: "#7c3aed",
                    tension: 0.4
                }]
            }
        });

        soilChart = new Chart(document.getElementById("soilChart"), {
            type: "line",
            data: {
                labels: soilData.map((_,i)=>i),
                datasets: [{
                    data: soilData,
                    borderColor: "#111",
                    tension: 0.4
                }]
            }
        });
    } else {
        tempChart.data.datasets[0].data = tempData;
        soilChart.data.datasets[0].data = soilData;
        tempChart.update();
        soilChart.update();
    }
}

function openModal() {
    document.getElementById("analyticsModal").style.display = "block";
}

function closeModal() {
    document.getElementById("analyticsModal").style.display = "none";
}

document.addEventListener("mousemove", e => {
    const glow = document.querySelector(".cursor-glow");
    glow.style.left = e.clientX + "px";
    glow.style.top = e.clientY + "px";
});

fetchData();
fetchWeather();

setInterval(fetchData, 15000);
setInterval(fetchWeather, 600000);
