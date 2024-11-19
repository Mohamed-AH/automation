import re
import sys
from pathlib import Path
import shutil

def validate_work_order(wo):
    """Validate individual work order format"""
    return bool(re.match(r'^\d{1,10}$', wo.strip()))

def read_work_orders(upload_file):
    """Read and validate work orders from upload.txt"""
    try:
        work_orders = []
        invalid_orders = []
        
        with open(upload_file, 'r') as f:
            for line_num, line in enumerate(f, 1):
                wo = line.strip()
                if wo:  # Skip empty lines
                    if validate_work_order(wo):
                        work_orders.append(wo)
                    else:
                        invalid_orders.append((line_num, wo))
        
        # Report validation results
        print(f"Found {len(work_orders)} valid work orders")
        if invalid_orders:
            print("\nWarning: Invalid work orders found:")
            for line_num, wo in invalid_orders:
                print(f"Line {line_num}: {wo}")
            
            proceed = input("\nDo you want to continue with valid work orders only? (y/n): ").lower()
            if proceed != 'y':
                return None
        
        return work_orders

    except FileNotFoundError:
        print(f"Error: {upload_file} not found")
        return None
    except Exception as e:
        print(f"Error reading {upload_file}: {str(e)}")
        return None

def backup_vbs_file(vbs_file):
    """Create a backup of the VBS file"""
    try:
        backup_path = f"{vbs_file}.backup"
        shutil.copy2(vbs_file, backup_path)
        print(f"Backup created: {backup_path}")
        return True
    except Exception as e:
        print(f"Error creating backup: {str(e)}")
        return False

def update_vbs_array(vbs_file, work_orders):
    """Update the work orders array in the VBS script"""
    if not work_orders:
        print("No valid work orders to process")
        return False
        
    try:
        # Create backup first
        if not backup_vbs_file(vbs_file):
            return False
            
        # Read the VBS file
        with open(vbs_file, 'r') as f:
            content = f.read()

        # Find the exact workOrders array definition
        pattern = r'(workOrders\s*=\s*Array\()([^)]*?)(\))'
        match = re.search(pattern, content)
        
        if not match:
            print("Could not find workOrders array in VBS script")
            return False
            
        # Preserve the exact spacing and format
        prefix = match.group(1)  # Keeps 'workOrders = Array('
        suffix = match.group(3)  # Keeps ')'
        
        # Create the array string
        new_array_content = ",".join(f'"{wo}"' for wo in work_orders)
        
        # Verify the content length is within VBScript limits
        estimated_line_length = len(prefix) + len(new_array_content) + len(suffix)
        if estimated_line_length > 65535:  # VBScript line length limit
            print("Error: Too many work orders to fit in a single VBScript line")
            print("Please reduce the number of work orders or modify the VBS script to handle multiple arrays")
            return False
            
        # Create the new array line
        new_line = f"{prefix}{new_array_content}{suffix}"
        
        # Replace only the exact match
        start, end = match.span()
        updated_content = content[:start] + new_line + content[end:]
        
        # Write the updated content back to the file
        with open(vbs_file, 'w', newline='') as f:  # Preserve line endings
            f.write(updated_content)
            
        print(f"\nSuccessfully updated VBS script with {len(work_orders)} work orders")
        print(f"Work orders: {', '.join(work_orders)}")
        return True
    
    except Exception as e:
        print(f"Error updating VBS file: {str(e)}")
        print("Restoring from backup...")
        try:
            backup_path = f"{vbs_file}.backup"
            shutil.copy2(backup_path, vbs_file)
            print("Restored from backup successfully")
        except Exception as be:
            print(f"Error restoring backup: {str(be)}")
        return False

def main():
    upload_file = "upload.txt"
    vbs_file = "workorder_process.vbs"
    
    # Validate files exist
    if not all(Path(f).exists() for f in [upload_file, vbs_file]):
        print("Required files not found. Please ensure both files exist:")
        print(f"- {upload_file}")
        print(f"- {vbs_file}")
        return
    
    # Read work orders
    print("Reading work orders...")
    work_orders = read_work_orders(upload_file)
    if work_orders is None:
        return
        
    if not work_orders:
        print("No work orders found in file")
        return
        
    # Confirm before proceeding with large updates
    if len(work_orders) > 1000:
        print(f"\nWarning: Large number of work orders found ({len(work_orders)})")
        proceed = input("Do you want to continue? (y/n): ").lower()
        if proceed != 'y':
            return
    
    # Update the VBS script
    print("\nUpdating VBS script...")
    if update_vbs_array(vbs_file, work_orders):
        print("\nUpdate completed successfully")
    else:
        print("\nUpdate failed")

if __name__ == "__main__":
    main()