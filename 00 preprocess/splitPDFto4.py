import os
from PyPDF2 import PdfReader, PdfWriter

# Define source and target directories
source_dir = r"D:\auto\04 upload\pre"
target_dir = r"D:\auto\00 preprocess\pdfs"

# Create target directory if it doesn't exist
os.makedirs(target_dir, exist_ok=True)

# Define the number of pages per split document
PAGES_PER_SPLIT = 4

# Process PDFs in the source directory
for file in os.listdir(source_dir):
    # Skip non-PDF files
    if not file.lower().endswith('.pdf'):
        continue
        
    source_path = os.path.join(source_dir, file)
    
    try:
        pdf_reader = PdfReader(source_path)
        total_pages = len(pdf_reader.pages)
        
        # If PDF has PAGES_PER_SPLIT or fewer pages, copy it directly
        if total_pages <= PAGES_PER_SPLIT:
            target_path = os.path.join(target_dir, file)
            with open(target_path, 'wb') as output_file:
                pdf_writer = PdfWriter()
                for page in pdf_reader.pages:
                    pdf_writer.add_page(page)
                pdf_writer.write(output_file)
            print(f"Copied '{file}' directly (total pages: {total_pages})")
        
        # If PDF has more than PAGES_PER_SPLIT pages, split it
        else:
            print(f"Splitting '{file}' (total pages: {total_pages}) into {PAGES_PER_SPLIT}-page chunks...")
            for i in range(0, total_pages, PAGES_PER_SPLIT):
                pdf_writer = PdfWriter()
                end_page = min(i + PAGES_PER_SPLIT, total_pages)
                
                for page_num in range(i, end_page):
                    pdf_writer.add_page(pdf_reader.pages[page_num])
                
                # Construct the split filename (e.g., original_part1.pdf, original_part2.pdf)
                split_filename = f"{os.path.splitext(file)[0]}_part{i//PAGES_PER_SPLIT + 1}.pdf"
                target_path = os.path.join(target_dir, split_filename)
                
                with open(target_path, 'wb') as output_file:
                    pdf_writer.write(output_file)
                print(f"  - Created '{split_filename}' (pages {i+1}-{end_page})")
                    
    except Exception as e:
        print(f"Error processing '{file}': {str(e)}")

print("\nPDF processing complete.")