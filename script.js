document.addEventListener("DOMContentLoaded", () => {

    const channelID = "3258996";
    const readAPIKey = "KQOVOAKJ6NVNWL3K";

    const url =
      `https://api.thingspeak.com/channels/${channelID}/feeds.json?api_key=${readAPIKey}&results=20`;

    let tempChart;
    let soilChart;

    async function fetchData() {
        try {
            const response = await fetch(url);
            const data = await response.json();

            console.log("ThingSpeak Data:", data);

            if (!data.feeds || data.feeds.length === 0) {
                console.warn("No feeds returned.");
                return;
            }

            const feeds = data.feeds;
            const latest = feeds[feeds.length - 1];

            updateUI(latest);
            updateCharts(feeds);

        } catch (error) {
            console.error("Fetch Error:", error);
        }
    }

    function updateUI(feed) {
        const temp = parseFloat(feed.field1) || 0;
        const hum = parseFloat(feed.field2) || 0;
        const soil = parseFloat(feed.field3) || 0;
        const rain = parseInt(feed.field4) || 0;
        const light = parseInt(feed.field5) || 0;

        document.getElementById("temp").innerText = `${temp.toFixed(1)} °C`;
        document.getElementById("humidity").innerText = `${hum.toFixed(1)} %`;
        document.getElementById("soil").innerText = `${soil.toFixed(0)} %`;
        document.getElementById("rain").innerText = rain ? "YES" : "NO";
        document.getElementById("light").innerText = light ? "BRIGHT" : "DARK";

        document.getElementById("health").innerText = soil < 30 ? 60 : 90;
        document.getElementById("healthFill").style.width =
            (soil < 30 ? 60 : 90) + "%";
    }

    function updateCharts(feeds) {

        const labels = feeds.map(f =>
            new Date(f.created_at).toLocaleTimeString()
        );

        const temps = feeds.map(f => parseFloat(f.field1) || 0);
        const soils = feeds.map(f => parseFloat(f.field3) || 0);

        if (!tempChart) {

            tempChart = new Chart(
                document.getElementById("tempChart"),
                {
                    type: "line",
                    data: {
                        labels: labels,
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
                }
            );

            soilChart = new Chart(
                document.getElementById("soilChart"),
                {
                    type: "line",
                    data: {
                        labels: labels,
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
                }
            );

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
