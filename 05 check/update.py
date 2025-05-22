import os
import re

def update_javascript_work_order_queue(data_file_path, js_file_path):
    """
    Reads work order numbers from a data file and directly modifies a JavaScript file
    to update the 'workOrderQueue' array, replacing its existing contents.

    Args:
        data_file_path (str): The path to the file containing work order numbers (e.g., 'WoData.txt').
                              Assumes one work order per line, first column.
        js_file_path (str): The path to the JavaScript file to modify
                            (e.g., 'check/partsDetailAutomation.js').
    """
    # 1. Read work orders from the data file
    work_orders = []
    try:
        with open(data_file_path, 'r') as f:
            for line in f:
                stripped_line = line.strip()
                if stripped_line: # Ensure line is not empty
                    # Split by whitespace and take the first part as the work order number
                    # This handles both space and tab delimiters
                    parts = stripped_line.split(maxsplit=1) 
                    wo = parts[0]
                    work_orders.append(f'"{wo}"')
    except FileNotFoundError:
        print(f"Error: The data file '{data_file_path}' was not found. Please check the path.", file=os.sys.stderr)
        return
    except Exception as e:
        print(f"An error occurred while reading the data file '{data_file_path}': {e}", file=os.sys.stderr)
        return

    js_array_content = ", ".join(work_orders)
    
    # Define the regex pattern to find the workOrderQueue declaration and its content
    # It looks for 'const workOrderQueue = [' followed by any characters (non-greedy) until '];'
    # The `re.DOTALL` flag is important if the array content spans multiple lines, though
    # our previous script put it on one line. Using it for robustness.
    # We capture the indentation and the part before the array to reconstruct the line.
    pattern = re.compile(r"(\s*const workOrderQueue = \[)(.*?)(];)", re.DOTALL)
    
    # 2. Read and modify the JavaScript file
    lines = []
    modified = False
    try:
        with open(js_file_path, 'r') as f:
            lines = f.readlines()

        with open(js_file_path, 'w') as f:
            for line in lines:
                match = pattern.match(line)
                if match:
                    # Reconstruct the line with the new array content
                    # group(1) is "const workOrderQueue = ["
                    # group(3) is "];"
                    new_line = f"{match.group(1)}{js_array_content}{match.group(3)}\n"
                    f.write(new_line)
                    print(f"Successfully updated 'workOrderQueue' in '{js_file_path}'.")
                    modified = True
                else:
                    f.write(line)
        
        if not modified:
            print(f"Warning: The 'workOrderQueue' array declaration (e.g., 'const workOrderQueue = [...]') "
                  f"was not found or did not match the expected pattern in '{js_file_path}'. "
                  f"The JavaScript file was not modified. Please ensure the JS file content matches the expected format.", file=os.sys.stderr)

    except FileNotFoundError:
        print(f"Error: The JavaScript file '{js_file_path}' was not found. Please check the path.", file=os.sys.stderr)
    except Exception as e:
        print(f"An error occurred while modifying the JavaScript file '{js_file_path}': {e}", file=os.sys.stderr)

if __name__ == "__main__":
    # --- Configuration ---
    # Path to your WoData.txt file
    # Assuming 'WoData.txt' is in '01 woCreation/' and this script is run from the project root.
    data_file = 'd:/auto/03 issue/issue.txt' 

    # Path to your partsDetailAutomation.js file
    # Based on the user's request: 'check/partsDetailAutomation.js'
    js_automation_file = 'partsDetailAutomation.js'

    update_javascript_work_order_queue(data_file, js_automation_file)
    print("\nScript finished. Please check your JavaScript file for updates.")