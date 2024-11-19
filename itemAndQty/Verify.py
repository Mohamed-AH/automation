import csv
import re
import sys
from typing import List, Dict, Tuple

def extract_js_entries(js_file_path: str) -> List[Dict[str, any]]:
    """Extract entries from the JavaScript file."""
    with open(js_file_path, 'r') as file:
        content = file.read()
    
    # Find the entries array using regex
    entries_match = re.search(r'entries: \[(.*?)\]', content, re.DOTALL)
    if not entries_match:
        raise ValueError("Could not find entries array in JS file")
    
    entries_text = entries_match.group(1)
    
    # Extract individual entries using regex
    entry_pattern = r'{[\s\n]*itemNumber:[\s\n]*[\'"]([^\'"]+)[\'"][\s\n]*,[\s\n]*quantity:[\s\n]*(\d+)[\s\n]*}'
    entries = []
    for match in re.finditer(entry_pattern, entries_text):
        entries.append({
            'itemNumber': match.group(1),
            'quantity': int(match.group(2))
        })
    
    return entries

def read_csv_entries(csv_file_path: str) -> List[Dict[str, any]]:
    """Read entries from the CSV file."""
    entries = []
    with open(csv_file_path, 'r') as file:
        reader = csv.DictReader(file)
        for row in reader:
            entries.append({
                'itemNumber': row['Item Number'],
                'quantity': int(row['Quantity'])
            })
    return entries

def verify_entries(csv_entries: List[Dict], js_entries: List[Dict]) -> Tuple[bool, List[str]]:
    """Compare entries and return verification results."""
    messages = []
    is_valid = True
    
    # Check lengths
    if len(csv_entries) != len(js_entries):
        messages.append(f"❌ Length mismatch: CSV has {len(csv_entries)} entries, JS has {len(js_entries)} entries")
        is_valid = False
    
    # Compare each entry
    for i, (csv_entry, js_entry) in enumerate(zip(csv_entries, js_entries)):
        entry_messages = []
        
        # Compare item numbers
        if csv_entry['itemNumber'] != js_entry['itemNumber']:
            entry_messages.append(
                f"Item Number mismatch: CSV={csv_entry['itemNumber']}, JS={js_entry['itemNumber']}"
            )
        
        # Compare quantities
        if csv_entry['quantity'] != js_entry['quantity']:
            entry_messages.append(
                f"Quantity mismatch: CSV={csv_entry['quantity']}, JS={js_entry['quantity']}"
            )
        
        if entry_messages:
            messages.append(f"\n❌ Entry {i + 1} has differences:")
            messages.extend([f"  - {msg}" for msg in entry_messages])
            is_valid = False
        else:
            messages.append(f"✓ Entry {i + 1} matches perfectly")
    
    return is_valid, messages

def main():
    # File paths
    csv_file = 'extracted_data.csv'
    js_file = 'itemAndQty.sh'
    
    try:
        # Read both files
        print(f"\nReading files...")
        csv_entries = read_csv_entries(csv_file)
        js_entries = extract_js_entries(js_file)
        
        # Verify entries
        print("\nVerifying entries...")
        is_valid, messages = verify_entries(csv_entries, js_entries)
        
        # Print results
        print("\nVerification Results:")
        print("=" * 50)
        for message in messages:
            print(message)
        print("=" * 50)
        
        # Print final status
        print(f"\nFinal Status: {'✅ ALL ENTRIES MATCH' if is_valid else '❌ MISMATCHES FOUND'}")
        
        # Exit with appropriate status code
        sys.exit(0 if is_valid else 1)
        
    except Exception as e:
        print(f"\n❌ Error during verification: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()