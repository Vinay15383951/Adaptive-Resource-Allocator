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