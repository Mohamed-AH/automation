import re

def update_work_orders(js_file_path, txt_file_path):
    # Read the work orders from the text file
    with open(txt_file_path, 'r') as f:
        new_work_orders = [line.strip() for line in f.readlines() if line.strip()]
    print(f"Read {len(new_work_orders)} work orders from {txt_file_path}")
    print("First few work orders:", new_work_orders[:3])

    # Format the work orders array as a string
    formatted_work_orders = "[\n        '" + "',\n        '".join(new_work_orders) + "'\n    ]"
    print("\nFormatted array (preview):")
    print(formatted_work_orders[:200] + "...")

    # Read the JavaScript file
    with open(js_file_path, 'r') as f:
        js_content = f.read()
    print(f"\nRead {len(js_content)} characters from {js_file_path}")

    # Define a more specific pattern to match the workOrders array
    pattern = r'(workOrders:\s*\[)[^\]]*(\])'
    
    # Check if pattern exists in content
    if not re.search(pattern, js_content):
        print("\nERROR: Could not find workOrders array in the JavaScript file!")
        print("Looking for content that matches pattern...")
        # Print a snippet of the file around where we expect to find the array
        if 'workOrders' in js_content:
            pos = js_content.find('workOrders')
            print("\nContent around 'workOrders':")
            print(js_content[max(0, pos-50):min(len(js_content), pos+200)])
        return 0

    # Replace the workOrders array with the new values
    updated_js = re.sub(pattern, r'\1' + formatted_work_orders[1:-1] + r'\2', js_content)

    # Verify the change
    if js_content == updated_js:
        print("\nERROR: No changes were made to the file!")
        return 0

    # Write the updated content back to the file
    with open(js_file_path, 'w') as f:
        f.write(updated_js)
    print("\nSuccessfully wrote updated content to file")

    return len(new_work_orders)

if __name__ == "__main__":
    try:
        count = update_work_orders('issues4.js', 'issue.txt')
        if count > 0:
            print(f"\nSuccessfully updated workOrders array with {count} new values.")
        else:
            print("\nFailed to update workOrders array. Please check the errors above.")
    except Exception as e:
        print(f"\nError: {str(e)}")
        # Print more detailed error information
        import traceback
        print("\nDetailed error information:")
        print(traceback.format_exc())