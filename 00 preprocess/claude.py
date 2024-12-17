import os
from dotenv import load_dotenv
from pypdf import PdfReader, PdfWriter
from langchain_anthropic import ChatAnthropic
from langchain.schema import HumanMessage
import pandas as pd
import io

# Load environment variables from .env file
load_dotenv()

class PDFProcessor:
    def __init__(self):
        """Initialize with API key from environment variable"""
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY not found in environment variables")
        
        self.chat = ChatAnthropic(api_key=api_key)
        self.prompt_template = """We need to extract the following data from the PDF and export it as a single CSV in this format:'Project Number, Work Order Number, Item Number, Issued Qty'

1. Project Number:
   * 5-digit number starting with 7
   * Follows the words 'Project' after the project name is mentioned
   * Only one Project Number per sheet/page
2. Work Order Number:
   * Follows the words 'Work Order #' or 'WO' (case-insensitive)
   * One number per page
   * May be handwritten
   * Ignore the title 'Work Order Form F-805-01-01'
3. Item Numbers:
   * Combination of characters (alphabets), numbers, hyphens, and dots
   * Found in the 'Material Information' table under the 'BTAT Item Number' column
   * Multiple entries per page
4. Issued Qty:
   * Numeric value
   * Found in the 'Material Information' table (issued QTY)
   * One entry per Item Number
   * May be blank if no stock
   * May be handwritten

Additional Instructions:
* Include headers in the CSV file
* If data is missing or unclear, leave the field blank in the CSV
* accuracy is most important, never guess or make up values
* Return ONLY the CSV data without any other text or explanations

Example output format:
Project Number,Work Order Number,Item Number,Issued Qty
70034,21,172IHD7S2-3,150
70034,21,172CCB,150

Here is the page content to process:
{page_text}

Remember to return ONLY the CSV data without any explanations or additional text."""

    def split_pdf(self, input_path: str) -> list:
        """Split PDF into individual pages and return their text content"""
        reader = PdfReader(input_path)
        pages = []
        
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            text = page.extract_text()
            pages.append(text)
            
        return pages

    def process_page(self, page_text: str) -> pd.DataFrame:
        """Send page text to Claude and get CSV response"""
        prompt = self.prompt_template.format(page_text=page_text)
        
        messages = [HumanMessage(content=prompt)]
        response = self.chat.invoke(messages)
        
        try:
            df = pd.read_csv(io.StringIO(response.content))
            expected_columns = ['Project Number', 'Work Order Number', 'Item Number', 'Issued Qty']
            df.columns = expected_columns
            return df
        except Exception as e:
            print(f"Error parsing CSV response: {str(e)}")
            return pd.DataFrame(columns=['Project Number', 'Work Order Number', 'Item Number', 'Issued Qty'])

    def process_directory(self, input_dir: str, output_dir: str):
        """Process all PDFs in directory and create consolidated CSV"""
        all_data = pd.DataFrame()
        
        for filename in sorted(os.listdir(input_dir)):
            if filename.endswith('.pdf'):
                input_path = os.path.join(input_dir, filename)
                print(f"\nProcessing {filename}...")
                
                pages = self.split_pdf(input_path)
                for i, page_text in enumerate(pages, 1):
                    print(f"Processing page {i} of {len(pages)}...")
                    try:
                        df = self.process_page(page_text)
                        all_data = pd.concat([all_data, df], ignore_index=True)
                    except Exception as e:
                        print(f"Error processing page {i}: {str(e)}")
        
        if not all_data.empty:
            os.makedirs(output_dir, exist_ok=True)
            output_path = os.path.join(output_dir, 'work_orders.csv')
            all_data.to_csv(output_path, index=False)
            print(f"\nCSV file created at: {output_path}")
        else:
            print("\nNo data was extracted from the PDFs")

def main():
    input_dir = r"D:\auto\00 preprocess\pdfs"
    output_dir = r"D:\auto\00 preprocess\csvs"
    
    processor = PDFProcessor()
    processor.process_directory(input_dir, output_dir)

if __name__ == "__main__":
    main()