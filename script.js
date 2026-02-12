document.addEventListener("DOMContentLoaded", () => {

    const channelID = "3258996";
    const readAPIKey = "thingspeak"; // use your actual read key if private

    const url = `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=20`;

    let tempChart = null;
    let soilChart = null;

    async function fetchData() {
        try {
            const response = await fetch(url);

            if (!response.ok) {
                console.error("API ERROR:", response.status);
                return;
            }

            const data = await response.json();
            console.log("API DATA:", data);

            if (!data.feeds || data.feeds.length === 0) {
                console.warn("No feed data found.");
                return;
            }

            const feeds = data.feeds;
            const latest = feeds[feeds.length - 1];

            const temp = parseFloat(latest.field1) || 0;
            const hum = parseFloat(latest.field2) || 0;
            const soil = parseFloat(latest.field3) || 0;
            const rain = parseInt(latest.field4) || 0;
            const light = parseInt(latest.field5) || 0;

            updateUI(temp, hum, soil, rain, light);
            updateCharts(feeds);

        } catch (err) {
            console.error("Fetch failed:", err);
        }
    }

    function updateUI(temp, hum, soil, rain, light) {
        document.getElementById("temp").innerText = `${temp.toFixed(1)} °C`;
        document.getElementById("humidity").innerText = `${hum.toFixed(1)} %`;
        document.getElementById("soil").innerText = `${soil.toFixed(0)} %`;
        document.getElementById("rain").innerText = rain ? "YES" : "NO";
        document.getElementById("light").innerText = light ? "BRIGHT" : "DARK";

        const health = Math.max(0, 100 - (soil < 25 ? 40 : 0));
        document.getElementById("health").innerText = health;
        document.getElementById("healthFill").style.width = health + "%";
    }

    function updateCharts(feeds) {

        if (typeof Chart === "undefined") {
            console.error("Chart.js NOT loaded.");
            return;
        }

        const labels = feeds.map(f =>
            new Date(f.created_at).toLocaleTimeString()
        );

        const temps = feeds.map(f => parseFloat(f.field1) || 0);
        const soils = feeds.map(f => parseFloat(f.field3) || 0);

        const tempCanvas = document.getElementById("tempChart");
        const soilCanvas = document.getElementById("soilChart");

        if (!tempCanvas || !soilCanvas) {
            console.error("Canvas elements not found.");
            return;
        }

        if (!tempChart) {

            tempChart = new Chart(tempCanvas.getContext("2d"), {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: "Temperature (°C)",
                        data: temps,
                        borderColor: "#22c55e",
                        backgroundColor: "rgba(34,197,94,0.2)",
                        fill: true,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false
                }
            });

            soilChart = new Chart(soilCanvas.getContext("2d"), {
                type: "line",
                data: {
                    labels,
                    datasets: [{
                        label: "Soil Moisture (%)",
                        data: soils,
                        borderColor: "#fbbf24",
                        backgroundColor: "rgba(251,191,36,0.2)",
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

    fetchData();
    setInterval(fetchData, 10000);
});
