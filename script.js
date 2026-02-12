const channelID = "3258996";
const readAPI = "KQOVOAKJ6NVNWL3K";

const url =
`https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPI}&results=20`;

let tempChart, soilChart;

async function fetchData() {

    const response = await fetch(url);
    const data = await response.json();

    const feeds = data.feeds;
    if (!feeds || feeds.length === 0) return;

    const temperatures = feeds.map(f => parseFloat(f.field1) || 0);
    const soilValues = feeds.map(f => parseFloat(f.field3) || 0);
    const irrigation = feeds[feeds.length - 1].field6;

    document.getElementById("temp").innerText =
        temperatures[temperatures.length - 1] + " °C";

    document.getElementById("soil").innerText =
        soilValues[soilValues.length - 1] + " %";

    const irrigationEl = document.getElementById("irrigation");

    if (irrigation == 1) {
        irrigationEl.innerText = "REQUIRED";
    } else {
        irrigationEl.innerText = "OK";
    }

    updateCharts(temperatures, soilValues);
}

function updateCharts(tempData, soilData) {

    const labels = tempData.map((_, i) => i + 1);

    if (!tempChart) {

        tempChart = new Chart(
            document.getElementById("tempChart"),
            {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: "Temperature (°C)",
                        data: tempData,
                        borderColor: "#7c3aed",
                        backgroundColor: "rgba(124,58,237,0.15)",
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );

        soilChart = new Chart(
            document.getElementById("soilChart"),
            {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: "Soil Moisture (%)",
                        data: soilData,
                        borderColor: "#000000",
                        backgroundColor: "rgba(0,0,0,0.1)",
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            }
        );

    } else {
        tempChart.data.labels = labels;
        soilChart.data.labels = labels;

        tempChart.data.datasets[0].data = tempData;
        soilChart.data.datasets[0].data = soilData;

        tempChart.update();
        soilChart.update();
    }
}

fetchData();
setInterval(fetchData, 15000);
