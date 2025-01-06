import os
from PyPDF2 import PdfReader, PdfWriter

source_dir = r"D:\auto\04 upload\pre"
target_dir = r"D:\auto\00 preprocess\pdfs"

# Create target directory if it doesn't exist
os.makedirs(target_dir, exist_ok=True)

# Process PDFs in source directory
for file in os.listdir(source_dir):
    if not file.lower().endswith('.pdf'):
        continue
        
    source_path = os.path.join(source_dir, file)
    
    try:
        pdf_reader = PdfReader(source_path)
        total_pages = len(pdf_reader.pages)
        
        # If PDF has 5 or fewer pages, copy it directly
        if total_pages <= 5:
            target_path = os.path.join(target_dir, file)
            with open(target_path, 'wb') as output_file:
                pdf_writer = PdfWriter()
                for page in pdf_reader.pages:
                    pdf_writer.add_page(page)
                pdf_writer.write(output_file)
        
        # If PDF has more than 5 pages, split it
        else:
            for i in range(0, total_pages, 5):
                pdf_writer = PdfWriter()
                end_page = min(i + 5, total_pages)
                
                for page_num in range(i, end_page):
                    pdf_writer.add_page(pdf_reader.pages[page_num])
                
                split_filename = f"{os.path.splitext(file)[0]}_part{i//5 + 1}.pdf"
                target_path = os.path.join(target_dir, split_filename)
                
                with open(target_path, 'wb') as output_file:
                    pdf_writer.write(output_file)
                    
    except Exception as e:
        print(f"Error processing {file}: {str(e)}")
