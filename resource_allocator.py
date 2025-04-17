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