import pandas as pd

def replace_work_orders(output_file, system_wo_file):
    # Read the CSV file
    output_df = pd.read_csv(output_file)
    
    # Read the system work order file with the correct structure
    # Using proper tab separation and skipping the header row
    system_wo_df = pd.DataFrame([line.strip().split() for line in open(system_wo_file).readlines()[1:]], 
                               columns=['Work Order Number', 'Project Number', 'systemWO'])
    
    print("System WO DataFrame after cleaning:")
    print(system_wo_df.head())
    
    # Convert columns to appropriate types
    output_df['Project Number'] = output_df['Project Number'].astype(str)
    output_df['Work Order Number'] = output_df['Work Order Number'].astype(str)
    system_wo_df['Project Number'] = system_wo_df['Project Number'].astype(str)
    system_wo_df['Work Order Number'] = system_wo_df['Work Order Number'].astype(str)
    
    # Create mapping dictionary
    wo_mapping = {}
    for _, row in system_wo_df.iterrows():
        key = (row['Project Number'], row['Work Order Number'])
        wo_mapping[key] = row['systemWO']
    
    # Function to get system WO number
    def get_system_wo(row):
        key = (str(row['Project Number']), str(row['Work Order Number']))
        return wo_mapping.get(key, 'Not Found')
    
    # Create a new column with the system work order number
    output_df['System_Work_Order'] = output_df.apply(get_system_wo, axis=1)
    
    # Drop the original Project Number and Work Order Number columns
    output_df = output_df.drop(['Project Number', 'Work Order Number'], axis=1)
    
    # Reorder columns to put System Work Order first
    cols = ['System_Work_Order', 'Item Number', 'Issued Qty']
    output_df = output_df[cols]
    
    return output_df

def main():
    try:
        # Process the files
        result_df = replace_work_orders('output.csv', 'systemwo.txt')
        
        # Save the result to a new CSV file
        result_df.to_csv('updated_output.csv', index=False)
        print("\nProcessing complete. Results saved to 'updated_output.csv'")
        
        # Display the first few rows of the result
        print("\nFirst few rows of the processed data:")
        print(result_df.head())
        
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        import traceback
        print(traceback.format_exc())

if __name__ == "__main__":
    main()