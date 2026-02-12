document.addEventListener("DOMContentLoaded", () => {

    const channelID = "3258996";
    const readAPI = "KQOVOAKJ6NVNWL3K";

    const url =
      `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPI}&results=20`;

    let tempChart, soilChart;

    async function fetchData() {

        const response = await fetch(url);
        const data = await response.json();

        if (!data.feeds || data.feeds.length === 0) return;

        const feeds = data.feeds;
        const latest = feeds[feeds.length - 1];

        const temp = parseFloat(latest.field1) || 0;
        const hum  = parseFloat(latest.field2) || 0;
        const soil = parseFloat(latest.field3) || 0;
        const rain = parseInt(latest.field4) || 0;
        const light = parseInt(latest.field5) || 0;
        const irrigationFlag = parseInt(latest.field6) || 0;

        updateUI(temp, hum, soil, rain, light, irrigationFlag);
        updateCharts(feeds);
    }

    function calculateHealth(temp, hum, soil, rain) {

        let score = 100;

        if (soil <= 5) score -= 85;
        else if (soil <= 15) score -= 60;
        else if (soil <= 25) score -= 40;
        else if (soil <= 35) score -= 20;

        if (temp >= 45) score -= 25;
        else if (temp >= 40) score -= 15;

        if (hum <= 20) score -= 10;
        if (hum >= 90) score -= 10;

        if (soil < 25 && rain === 1) score += 10;

        return Math.max(0, Math.min(100, score));
    }

    function updateUI(temp, hum, soil, rain, light, irrigationFlag) {

        document.getElementById("temp").innerText = `${temp.toFixed(1)} °C`;
        document.getElementById("humidity").innerText = `${hum.toFixed(1)} %`;
        document.getElementById("soil").innerText = `${soil.toFixed(0)} %`;
        document.getElementById("rain").innerText = rain ? "YES" : "NO";
        document.getElementById("light").innerText = light ? "BRIGHT" : "DARK";

        const health = calculateHealth(temp, hum, soil, rain);

        document.getElementById("health").innerText = health;
        document.getElementById("healthFill").style.width = health + "%";

        const statusEl = document.getElementById("status");

        if (health >= 70) {
            statusEl.className = "status stable";
            statusEl.innerText = "SYSTEM: STABLE";
            document.getElementById("healthFill").style.background = "#22c55e";
        }
        else if (health >= 40) {
            statusEl.className = "status warning";
            statusEl.innerText = "SYSTEM: WARNING";
            document.getElementById("healthFill").style.background = "#fbbf24";
        }
        else {
            statusEl.className = "status critical";
            statusEl.innerText = "SYSTEM: CRITICAL – IRRIGATE NOW";
            document.getElementById("healthFill").style.background = "#ef4444";
        }

        const irrigationEl = document.getElementById("irrigation");

        if (soil <= 25) {
            irrigationEl.innerText = "IRRIGATION REQUIRED";
            irrigationEl.style.color = "#ef4444";
        } else {
            irrigationEl.innerText = "OK";
            irrigationEl.style.color = "#22c55e";
        }
    }

    function updateCharts(feeds) {

        const labels = feeds.map(f =>
            new Date(f.created_at).toLocaleTimeString()
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
                        borderColor: "#7c3aed",
                        backgroundColor: "rgba(124,58,237,0.15)",
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

            soilChart = new Chart(document.getElementById("soilChart"), {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: "Soil Moisture (%)",
                        data: soils,
                        borderColor: "#22c55e",
                        backgroundColor: "rgba(34,197,94,0.15)",
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false }
            });

        } else {

            tempChart.data.labels = labels;
            soilChart.data.labels = labels;

            tempChart.data.datasets[0].data = temps;
            soilChart.data.datasets[0].data = soils;

            tempChart.update();
            soilChart.update();
        }
    }

    fetchData();
    setInterval(fetchData, 15000);
});
