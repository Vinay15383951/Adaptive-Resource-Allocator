from flask import Flask, render_template, jsonify, request
from resource_allocator import ResourceAllocator
import psutil
import threading
import os
import logging

# --- Logging Configuration ---
log_path = os.path.join(os.path.dirname(__file__), 'resource_allocation.log')
logging.basicConfig(
    filename=log_path,
    level=logging.INFO,
    format='%(asctime)s - %(message)s',
    filemode='a'
)
logging.getLogger('werkzeug').setLevel(logging.ERROR)

# --- Flask App Setup ---
app = Flask(__name__)
allocator = ResourceAllocator()
monitoring_thread = None

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/metrics')
def get_metrics():
    try:
        cpu = psutil.cpu_percent(interval=0.3)
        memory = psutil.virtual_memory().percent
        return jsonify({'cpu': round(cpu, 1), 'memory': round(memory, 1)})
    except Exception as e:
        return jsonify({'cpu': 0, 'memory': 0, 'error': str(e)})

@app.route('/processes')
def get_processes():
    try:
        allocator.get_process_info()
        process_list = [
            {
                'pid': pid,
                'name': info['name'],
                'cpu': round(info['cpu'], 1),
                'memory': round(info['memory'], 1)
            } for pid, info in allocator.processes.items()
        ]
        return jsonify(process_list)
    except Exception as e:
        return jsonify([])

@app.route('/logs')
def get_logs():
    try:
        if not os.path.exists(log_path):
            return jsonify({"log": "No logs found."})
        with open(log_path, "r", encoding="utf-8", errors="ignore") as file:
            lines = file.readlines()[-100:]
            return jsonify({"log": "".join(lines)})
    except Exception as e:
        return jsonify({"log": f"Error reading logs: {str(e)}"})
    
@app.route('/start')
def start_monitoring():
    global monitoring_thread
    if not allocator.running:
        monitoring_thread = threading.Thread(target=allocator.start_monitoring, daemon=True)
        monitoring_thread.start()
        return jsonify({"status": "Monitoring started"})
    return jsonify({"status": "Already running"})

@app.route('/stop')
def stop_monitoring():
    allocator.stop_monitoring()
    return jsonify({"status": "Monitoring stopped"})

@app.route('/update_thresholds')
def update_thresholds():
    cpu = request.args.get("cpu", type=int)
    memory = request.args.get("memory", type=int)
    if cpu is not None:
        allocator.threshold_cpu = cpu
    if memory is not None:
        allocator.threshold_memory = memory
    return jsonify({"message": f"Thresholds updated: CPU={allocator.threshold_cpu}%, Memory={allocator.threshold_memory}%"})

# --- Whitelist Routes ---
@app.route('/whitelist')
def get_whitelist():
    return jsonify({"whitelist": allocator.get_whitelist()})

@app.route('/whitelist/add', methods=['POST'])
def add_to_whitelist():
    name = request.json.get("name", "").strip()
    if name:
        allocator.add_to_whitelist(name)
        return jsonify({"message": f"{name} added to whitelist."})
    return jsonify({"message": "Invalid process name."}), 400

@app.route('/whitelist/remove', methods=['POST'])
def remove_from_whitelist():
    name = request.json.get("name", "").strip()
    if name:
        allocator.remove_from_whitelist(name)
        return jsonify({"message": f"{name} removed from whitelist."})
    return jsonify({"message": "Invalid process name."}), 400

if __name__ == '__main__':
    app.run(debug=True)