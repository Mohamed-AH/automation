
# Work Order Automation Project

This project automates the process of creating work orders, inputting item details, and uploading PDFs in a business system.

```
Auto/
├── itemAndQty/          # Item and quantity scripts
├── upload/             # Upload automation
│   └── Autoit/        # AutoIt scripts and exe
└── woCreation/        # Work order creation scripts
```


## Scripts and Their Functions

### Work Order Creation
- `wo.py`: Reads data from a text file and updates the array in `wocreation.js`
- `wocreation.js`: Navigates the web page and creates work orders

### Item and Quantity Management
- `excelextract.py`: Extracts work order number, item number, and quantity from `wos.xlsx` and updates `extracted_data.csv`
- `update.py`: Reads from `extracted_data.csv` and updates the array in `itemAndQty.sh`
- `itemAndQty.sh`: Interacts with the web page to insert item numbers and quantities into respective work orders

### PDF Upload
- `update_vbs.py`: Reads data from `upload.txt` and updates the array in `working.vbs`
- `openIE.vbs`: Opens a blank Internet Explorer page
- `working.vbs`: Interacts with Internet Explorer to navigate menus and initiate PDF uploads
- `UploadFile.au3/exe` (AutoIt): Simulates user interaction for file selection during upload

## Workflow

1. Work order creation
2. Item and quantity input
3. PDF upload


## Requirements

- Python
- Node.js
- AutoIt
- Internet Explorer
