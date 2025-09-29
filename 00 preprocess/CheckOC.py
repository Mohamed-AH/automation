import pandas as pd
import numpy as np
import os

# Define the file names
INPUT_FILE = 'output.csv'
OUTPUT_FILE = 'output_modified.csv'
ITEM_COLUMN = 'Item Number'

def modify_item_number(item):
    """
    Looks in the item number for items starting with 'OC' and if the 6th place
    (index 5) is not a space, inserts a space there.
    """
    # Check if the item is a string and starts with 'OC'
    if isinstance(item, str) and item.startswith('OC'):
        # Check if the string is long enough (at least 6 characters, indices 0-5)
        if len(item) >= 6:
            # Check if the 6th character (index 5) is NOT a space
            if item[5] != ' ':
                # Insert a space at the 6th position (index 5)
                return item[:5] + ' ' + item[5:]
    
    # Return the original item if it doesn't meet the criteria or is not a string
    return item

# --- Main Execution ---
try:
    # Load the CSV file
    df = pd.read_csv(INPUT_FILE)
    print(f"Successfully loaded '{INPUT_FILE}'.")
    
    # Apply the modification function to the 'Item Number' column
    df[ITEM_COLUMN] = df[ITEM_COLUMN].apply(modify_item_number)
    
    # Save the modified DataFrame to a new CSV file
    df.to_csv(OUTPUT_FILE, index=False)
    print(f"The modified data has been saved to '{OUTPUT_FILE}'.")
    
except FileNotFoundError:
    print(f"Error: The file '{INPUT_FILE}' was not found. Please ensure it is in the same directory.")
except Exception as e:
    print(f"An error occurred: {e}")