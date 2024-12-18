import os

def rename_files():
    # Read numbers from names.txt
    with open('names.txt', 'r') as f:
        new_numbers = [line.strip() for line in f.readlines()]
    
    base_dir = r"D:\auto\04 upload\pre"
    
    try:
        # Pair numbers with files in serial order
        for i, new_num in enumerate(new_numbers, 1):
            # Format old filename using the specified pattern
            old_file = os.path.join(base_dir, f"WO-18-12-2024 {i}.pdf")
            new_file = os.path.join(base_dir, f"{new_num}.pdf")
            
            if os.path.exists(old_file):
                if not os.path.exists(new_file):
                    os.rename(old_file, new_file)
                    print(f"Renamed: {old_file} -> {new_file}")
                else:
                    print(f"Warning: Target file already exists: {new_file}")
            else:
                print(f"Warning: Source file not found: {old_file}")
                
    except Exception as e:
        print(f"Error occurred: {str(e)}")

if __name__ == "__main__":
    rename_files()