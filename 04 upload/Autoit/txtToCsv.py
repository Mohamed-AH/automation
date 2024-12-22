import csv
from datetime import datetime
import os
import time

def process_log_file(log_path, csv_path):
    """
    Read log file and convert to CSV format
    """
    with open(log_path, 'r') as log_file, open(csv_path, 'w', newline='') as csv_file:
        csv_writer = csv.writer(csv_file)
        # Write header
        csv_writer.writerow(['Timestamp', 'Date', 'Time', 'Filename', 'Full Path'])
        
        for line in log_file:
            if line.strip():
                # Parse the log entry
                timestamp_str, file_info = line.split(' - ')
                file_path = file_info.replace('File uploaded: ', '').strip()
                filename = os.path.basename(file_path)
                
                # Convert timestamp to date and time
                timestamp = datetime.strptime(timestamp_str, '%Y/%m/%d %H:%M:%S')
                date = timestamp.strftime('%Y-%m-%d')
                time = timestamp.strftime('%H:%M:%S')
                
                # Write to CSV
                csv_writer.writerow([
                    timestamp_str,
                    date,
                    time,
                    filename,
                    file_path
                ])

def monitor_and_process(log_path, csv_path, interval=60):
    """
    Continuously monitor log file and update CSV
    """
    while True:
        process_log_file(log_path, csv_path)
        print(f"CSV updated at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        time.sleep(interval)

if __name__ == "__main__":
    log_path = r"D:\auto\upload\Autoit\upload_log.txt"
    csv_path = r"D:\auto\upload\Autoit\upload_log.csv"
    monitor_and_process(log_path, csv_path)