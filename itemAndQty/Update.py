import csv
import re

def update_config_file():
    # Read CSV data
    entries = []
    with open('extracted_data.csv', 'r') as csvfile:
        csvreader = csv.DictReader(csvfile)
        for row in csvreader:
            entries.append({
                'itemNumber': row['Item Number'],
                'quantity': int(row['Quantity'])
            })
    
    # Read the original JS file
    with open('itemAndQty.sh', 'r') as file:
        content = file.read()
    
    # Create the new entries string
    new_entries = []
    for entry in entries:
        new_entries.append(f"        {{ itemNumber: '{entry['itemNumber']}', quantity: {entry['quantity']} }}")
    
    # Join entries with comma and newline
    entries_str = ',\n'.join(new_entries)
    
    # Replace the entries array while preserving the structure
    pattern = r'entries: \[\n.*?\n    \]'
    new_content = re.sub(pattern, f'entries: [\n{entries_str}\n    ]', content, flags=re.DOTALL)
    
    # Write the updated content back to the file
    with open('itemAndQty.sh', 'w') as file:
        file.write(new_content)

if __name__ == "__main__":
    update_config_file()