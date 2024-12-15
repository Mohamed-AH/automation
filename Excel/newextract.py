import pandas as pd

def convert_wos_to_csv():
    try:
        # Read the Excel file
        df = pd.read_excel('wos.xlsx')
        
        # Create a list to store the data
        data = []
        
        # Process each row from the input
        for _, row in df.iterrows():
            data.append({
                'Project Number': '70060',
                'Work Order Number': row['WO#'],
                'Item Number': row['Item Number'],
                'Issued Qty': row['Quantity']
            })
        
        # Create DataFrame from processed data
        output_df = pd.DataFrame(data)
        
        # Explicitly set the column order
        output_df = output_df[['Project Number', 'Work Order Number', 'Item Number', 'Issued Qty']]
        
        # Save to CSV without index and verify the content
        output_df.to_csv('converted_wos.csv', index=False)
        
        # Print first few rows to verify
        print("Preview of the generated CSV:")
        print(output_df.head())
        print("\nFile has been saved as 'converted_wos.csv'")
        
    except FileNotFoundError:
        print("Error: 'wos.xlsx' file not found in the current directory")
    except Exception as e:
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    convert_wos_to_csv()