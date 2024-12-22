import re

def update_work_order_queue(wo_data_path, js_path):
    # Read work orders from WoData.txt
    work_orders = []
    with open(wo_data_path, 'r', encoding='utf-8') as f:
        for line in f:
            wo_num, branch_num = line.strip().split()
            work_orders.append((wo_num, branch_num))
    
    # Generate new queue content
    queue_items = []
    for i, (wo_num, branch_num) in enumerate(work_orders):
        is_first = "true" if i == 0 else "false"
        queue_items.append(f"    {{ branch: '{branch_num}', wo: '{wo_num}', isFirstRun: {is_first} }}")
    
    new_queue = "const workOrderQueue = [\n" + ",\n".join(queue_items) + "\n];"
    
    # Read the entire JS file with UTF-8 encoding
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Replace the workOrderQueue initialization while preserving the rest of the file
    pattern = r"const workOrderQueue = \[[\s\S]*?\];"
    updated_content = re.sub(pattern, new_queue, content)
    
    # Write the modified content back to the file with UTF-8 encoding
    with open(js_path, 'w', encoding='utf-8', newline='\n') as f:
        f.write(updated_content)

# Usage
update_work_order_queue('WoData.txt', 'WoCreation.js')