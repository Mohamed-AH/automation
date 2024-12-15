import os

def remove_quotes_from_pdfs(directory='.'):
    """
    Remove single quotes from the beginning and end of PDF filenames
    Only processes files that both start and end with quotes and end in .pdf
    
    Args:
        directory (str): The directory path to process (defaults to current directory)
    """
    # Get all files in directory
    files = os.listdir(directory)
    
    # Filter for PDF files with quotes
    pdf_files = [f for f in files if f.startswith("'") and f.endswith(".pdf'")]
    
    for filename in pdf_files:
        # Remove first and last character (the quotes)
        new_filename = filename[1:-1]
        
        # Create full file paths
        old_filepath = os.path.join(directory, filename)
        new_filepath = os.path.join(directory, new_filename)
        
        try:
            os.rename(old_filepath, new_filepath)
            print(f"Renamed: {filename} → {new_filename}")
        except OSError as e:
            print(f"Error renaming {filename}: {e}")
        
    print("\nProcessing complete!")

if __name__ == "__main__":
    remove_quotes_from_pdfs()