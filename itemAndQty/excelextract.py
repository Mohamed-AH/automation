import pandas as pd

def extract_columns_from_excel():
    # Read the Excel file
    file_path = r"D:\auto\itemAndQty\wos.xlsx"
    
    try:
        # Read Excel file
        df = pd.read_excel(file_path)
        
        # Select only the required columns
        # Assuming the column names are exactly as shown in your data
        result_df = df[['Item Number', 'Quantity', 'WO#']]
        
        # Remove any rows where all values are NaN
        result_df = result_df.dropna(how='all')
        
        # Save to CSV in the same directory
        output_path = r"D:\auto\itemAndQty\extracted_data.csv"
        result_df.to_csv(output_path, index=False)
        
        print(f"\nData has been extracted and saved to: {output_path}")
        print("\nFirst few rows of extracted data:")
        print(result_df.head())
        print(f"\nTotal rows extracted: {len(result_df)}")
        
    except FileNotFoundError:
        print(f"Error: Could not find the file at {file_path}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    extract_columns_from_excel()