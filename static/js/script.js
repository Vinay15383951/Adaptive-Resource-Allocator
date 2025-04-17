function fetchMetrics() {
    fetch('/metrics')
        .then(response => response.json())
        .then(data => {
            document.getElementById('cpuUsage').textContent = data.cpu + '%';
            document.getElementById('memoryUsage').textContent = data.memory + '%';
            updateCharts(data.cpu, data.memory);
        });
}

function fetchProcesses() {
    fetch('/processes')
        .then(response => response.json())
        .then(data => {
            const tableBody = document.getElementById('processTableBody');
            tableBody.innerHTML = '';
            data.forEach(proc => {
                const row = `
                    <tr>
                        <td>${proc.pid}</td>
                        <td>${proc.name}</td>
                        <td>${proc.cpu}</td>
                        <td>${proc.memory}</td>
                    </tr>`;
                tableBody.innerHTML += row;
            });
        });
}

function fetchLogs() {
    fetch('/logs')
        .then(response => response.json())
        .then(data => {
            document.getElementById('logOutput').value = data.log || 'No logs available.';
        });
}

document.getElementById('startBtn').addEventListener('click', () => {
    fetch('/start')
        .then(res => res.json())
        .then(() => {
            document.getElementById('startBtn').disabled = true;
            document.getElementById('stopBtn').disabled = false;
            showAlert('Monitoring started.');
        });
});

document.getElementById('stopBtn').addEventListener('click', () => {
    fetch('/stop')
        .then(res => res.json())
        .then(() => {
            document.getElementById('startBtn').disabled = false;
            document.getElementById('stopBtn').disabled = true;
            showAlert('Monitoring stopped.');
        });
});

document.getElementById('updateThresholdsBtn').addEventListener('click', () => {
    const cpu = document.getElementById('cpuThreshold').value;
    const memory = document.getElementById('memoryThreshold').value;

    fetch(`/update_thresholds?cpu=${cpu}&memory=${memory}`)
        .then(res => res.json())
        .then(data => {
            showAlert(data.message);
        });
});

function showAlert(message) {
    const alertBox = document.getElementById('alert-box');
    alertBox.textContent = message;
    alertBox.classList.remove('hidden');

    setTimeout(() => {
        alertBox.classList.add('hidden');
    }, 4000);
}

// Dark mode toggle logic
const toggle = document.getElementById('darkModeToggle');

// Apply saved mode
if (localStorage.getItem('darkMode') === 'enabled') {
    document.body.classList.add('dark-mode');
    toggle.checked = true;
}

toggle.addEventListener('change', () => {
    if (toggle.checked) {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'enabled');
    } else {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'disabled');
    }
});

// Whitelist
function fetchWhitelist() {
    fetch('/whitelist')
        .then(res => res.json())
        .then(data => {
            const list = document.getElementById('whitelistList');
            list.innerHTML = '';
            data.whitelist.forEach(name => {
                const item = document.createElement('li');
                item.textContent = name;
                const removeBtn = document.createElement('button');
                removeBtn.textContent = '❌';
                removeBtn.className = 'remove-btn';
                removeBtn.onclick = () => removeFromWhitelist(name);
                item.appendChild(removeBtn);
                list.appendChild(item);
            });
        });
}

function addToWhitelist() {
    const name = document.getElementById('whitelistInput').value.trim();
    if (!name) return;
    fetch('/whitelist/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    })
        .then(res => res.json())
        .then(data => {
            showAlert(data.message);
            fetchWhitelist();
            document.getElementById('whitelistInput').value = '';
        });
}

function removeFromWhitelist(name) {
    fetch('/whitelist/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
    })
        .then(res => res.json())
        .then(data => {
            showAlert(data.message);
            fetchWhitelist();
        });
}
// Charts
const cpuChartCtx = document.getElementById('cpuChart').getContext('2d');
const memoryChartCtx = document.getElementById('memoryChart').getContext('2d');

let cpuChart = new Chart(cpuChartCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'CPU Usage (%)',
            data: [],
            backgroundColor: 'rgba(0,123,255,0.1)',
            borderColor: '#007bff',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        }]
    },
    options: {
        scales: {
            y: { beginAtZero: true, max: 100 }
        }
    }
});

let memoryChart = new Chart(memoryChartCtx, {
    type: 'line',
    data: {
        labels: [],
        datasets: [{
            label: 'Memory Usage (%)',
            data: [],
            backgroundColor: 'rgba(40,167,69,0.1)',
            borderColor: '#28a745',
            borderWidth: 2,
            tension: 0.3,
            fill: true
        }]
    },
    options: {
        scales: {
            y: { beginAtZero: true, max: 100 }
        }
    }
});

function updateCharts(cpu, memory) {
    const time = new Date().toLocaleTimeString();

    cpuChart.data.labels.push(time);
    cpuChart.data.datasets[0].data.push(cpu);
    if (cpuChart.data.labels.length > 10) {
        cpuChart.data.labels.shift();
        cpuChart.data.datasets[0].data.shift();
    }
    cpuChart.update();

    memoryChart.data.labels.push(time);
    memoryChart.data.datasets[0].data.push(memory);
    if (memoryChart.data.labels.length > 10) {
        memoryChart.data.labels.shift();
        memoryChart.data.datasets[0].data.shift();
    }
    memoryChart.update();
}

// Initial Fetch
fetchMetrics();
fetchProcesses();
fetchLogs();
fetchWhitelist();

// Auto refresh
setInterval(() => {
    fetchMetrics();
    fetchProcesses();
    fetchLogs();
    fetchWhitelist();
}, 3000);