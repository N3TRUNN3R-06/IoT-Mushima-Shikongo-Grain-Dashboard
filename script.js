const channelID = "3258996";
const readAPI = "KQOVOAKJ6NVNWL3K";
const weatherApiKey = "353c8dee2b841991e6cb38f83b4736de";

const lat = -17.5;
const lon = 17.0;

const dataURL =
`https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPI}&results=24`;

const weatherURL =
`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${weatherApiKey}&units=metric`;

let tempChart, soilChart;

async function fetchData() {
    const response = await fetch(dataURL);
    const data = await response.json();
    const feeds = data.feeds;
    if (!feeds) return;

    const temps = feeds.map(f => parseFloat(f.field1));
    const soils = feeds.map(f => parseFloat(f.field3));

    const latestTemp = temps.at(-1);
    const latestSoil = soils.at(-1);

    document.getElementById("temperature").innerText = latestTemp + " °C";
    document.getElementById("soil").innerText = latestSoil + " %";

    const avgTemp =
        (temps.reduce((a,b)=>a+b,0)/temps.length).toFixed(1);

    document.getElementById("tempStats").innerText =
        `24-sample Avg: ${avgTemp}°C`;

    let cropScore = 100;
    if (latestSoil < 30) cropScore -= 25;
    if (latestTemp > 38) cropScore -= 20;
    if (latestSoil > 85) cropScore -= 20;

    document.getElementById("cropScore").innerText = cropScore + "/100";

    document.getElementById("systemHealth").innerText =
        cropScore > 70 ? "SYSTEM: STABLE" :
        cropScore > 40 ? "SYSTEM: WARNING" :
        "SYSTEM: CRITICAL";

    updateCharts(temps, soils);
}

async function fetchWeather() {
    const response = await fetch(weatherURL);
    const data = await response.json();
    const forecast = data.list[0];

    const temp = forecast.main.temp;
    const condition = forecast.weather[0].main;
    const rainProb = forecast.pop * 100;

    document.getElementById("weatherTemp").innerText = temp + " °C";
    document.getElementById("weatherCondition").innerText = condition;
    document.getElementById("rainProbability").innerText =
        `Rain Probability: ${rainProb.toFixed(0)}%`;
}

function updateCharts(tempData, soilData) {

    const labels = tempData.map((_, i) => i);

    if (!tempChart) {

        tempChart = new Chart(document.getElementById("tempChart"), {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Temperature (°C)",
                    data: tempData,
                    borderColor: "#7c3aed",
                    backgroundColor: "rgba(124,58,237,0.1)",
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                animation: { duration: 1200 },
                plugins: {
                    legend: { display: true }
                }
            }
        });

        soilChart = new Chart(document.getElementById("soilChart"), {
            type: "line",
            data: {
                labels,
                datasets: [{
                    label: "Soil Moisture (%)",
                    data: soilData,
                    borderColor: "#111",
                    backgroundColor: "rgba(0,0,0,0.05)",
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                animation: { duration: 1200 },
                plugins: {
                    legend: { display: true }
                }
            }
        });

    } else {
        tempChart.data.datasets[0].data = tempData;
        soilChart.data.datasets[0].data = soilData;
        tempChart.update();
        soilChart.update();
    }
}

fetchData();
fetchWeather();

setInterval(fetchData, 15000);
setInterval(fetchWeather, 600000);
