import re
import os

def process_csv_content(csv_content):
    # Split the content into lines and remove header
    lines = csv_content.strip().split('\n')[1:]
    # Format each line into the required structure
    formatted_lines = []
    for line in lines:
        work_order, item_number, quantity = line.strip().split(',')
        formatted_lines.append(f'{work_order},{item_number.strip()},{quantity.strip()}')
    return '\n'.join(formatted_lines)

def update_dragon_js(js_file_path, csv_file_path):
    try:
        # Read the CSV file
        print(f"Reading CSV file from: {csv_file_path}")
        with open(csv_file_path, 'r') as csv_file:
            csv_content = csv_file.read()
            print(f"CSV content length: {len(csv_content)} characters")
            
        # Format the CSV content
        formatted_csv = process_csv_content(csv_content)
        print(f"Formatted CSV length: {len(formatted_csv)} characters")
        print("First few lines of formatted CSV:")
        print(formatted_csv.split('\n')[:3])
        
        # Read the JavaScript file
        print(f"\nReading JS file from: {js_file_path}")
        with open(js_file_path, 'r', encoding='utf-8') as js_file:
            js_content = js_file.read()
        print(f"JS file length: {len(js_content)} characters")
        
        # Find the csvData string using a more precise regex
        pattern = r'const\s+csvData\s*=\s*`[^`]*`'
        
        # Check if pattern is found
        match = re.search(pattern, js_content)
        if not match:
            print("Error: Could not find csvData pattern in JS file")
            return
            
        print(f"Found csvData at position: {match.start()}-{match.end()}")
        
        # Create the replacement string
        replacement = f'const csvData = `{formatted_csv}`'
        
        # Replace the old csvData with the new one
        updated_js = re.sub(pattern, replacement, js_content)
        
        # Verify the replacement
        if updated_js == js_content:
            print("Warning: No changes were made to the file content")
            return
            
        # Write the updated content back to the file
        print("\nWriting updated content back to JS file...")
        with open(js_file_path, 'w', encoding='utf-8') as js_file:
            js_file.write(updated_js)
            
        print("Successfully updated csvData in dragon3.js")
        
        # Verify the file was actually written
        with open(js_file_path, 'r', encoding='utf-8') as js_file:
            verification = js_file.read()
            if verification == updated_js:
                print("Verification: File was successfully written")
            else:
                print("Warning: File content verification failed")
        
    except FileNotFoundError as e:
        print(f"Error: File not found - {e.filename}")
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        print(traceback.format_exc())

# File paths
js_file = "dragon3.js"
csv_file = "D:\\auto\\00 preprocess\\updated_output.csv"

# Execute the update
if __name__ == "__main__":
    print("Starting script execution...")
    print(f"Working directory: {os.getcwd()}")
    update_dragon_js(js_file, csv_file)
    input("Press Enter to exit...")