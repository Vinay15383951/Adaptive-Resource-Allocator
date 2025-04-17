import psutil
import platform
import logging
import time

class ResourceAllocator:
    def __init__(self):
        self.processes = {}
        self.running = False
        self.threshold_cpu = 80
        self.threshold_memory = 80
        self.whitelist = set()

        # Set platform-specific priority levels
        if platform.system() == "Windows":
            self.normal_priority = psutil.NORMAL_PRIORITY_CLASS
            self.low_priority = psutil.BELOW_NORMAL_PRIORITY_CLASS
        else:
            self.normal_priority = 0
            self.low_priority = 10

        # Log only essential info

    def get_process_info(self):
        self.processes.clear()
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_percent']):
            try:
                info = proc.info
                self.processes[info['pid']] = {
                    'name': info['name'] or "Unknown",
                    'cpu': info['cpu_percent'],
                    'memory': info['memory_percent']
                }
            except (psutil.NoSuchProcess, psutil.AccessDenied):
                continue

    def add_to_whitelist(self, name):
        self.whitelist.add(name.lower())
        logging.info(f"Added to whitelist: {name}")

    def remove_from_whitelist(self, name):
        self.whitelist.discard(name.lower())
        logging.info(f"Removed from whitelist: {name}")

    def get_whitelist(self):
        return list(self.whitelist)

    def adjust_resources(self):
        self.get_process_info()
        for pid, info in list(self.processes.items()):
            try:
                proc_name = info['name'].lower()
                if proc_name in self.whitelist:
                    logging.info(f"Skipped whitelisted process: {info['name']} (PID: {pid})")
                    continue

                proc = psutil.Process(pid)

                if info['cpu'] > self.threshold_cpu or info['memory'] > self.threshold_memory:
                    if proc.nice() != self.low_priority:
                        proc.nice(self.low_priority)
                        logging.info(f"Lowered priority: {info['name']} (PID: {pid}) | CPU: {info['cpu']}%, Memory: {info['memory']}%")
                else:
                    if proc.nice() != self.normal_priority:
                        proc.nice(self.normal_priority)
                        logging.info(f"Restored priority: {info['name']} (PID: {pid})")

            except Exception as e:
                logging.warning(f"Error adjusting {info['name']} (PID: {pid}): {e}")

    def start_monitoring(self):
        self.running = True
        logging.info("Monitoring started.")
        while self.running:
            self.adjust_resources()
            time.sleep(2)

    def stop_monitoring(self):
        self.running = False
        logging.info("Monitoring stopped.")
