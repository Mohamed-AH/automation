# JDE Work Order Automation

This project takes the tedium out of processing work orders in JD Edwards (JDE). It handles everything from reading PDFs to clicking buttons - letting computers do what they do best while humans focus on more interesting work.

## What It Does

Picture this: A stack of PDF work orders needs to be processed in JDE. Each one needs data extraction, system entry, material assignments, inventory processing, and document uploads. Doing this manually would take hours (or days) of repetitive clicking and typing.

This automation system turns that into a streamlined process:
- Extracts data from PDFs using the Claude API
- Creates work orders in JDE automatically
- Handles all the material line items
- Processes inventory issues
- Takes care of document uploads

## The Interesting Parts

### Smart Data Extraction
Lives in `00 preprocess/` - Uses Claude API to intelligently extract work order data from PDFs, mapping it to system numbers. No more copy-pasting!

### Browser Automation Magic
Found in `01 woCreation/` and `02 enterWO/` - Scripts that navigate JDE like a pro, handling work order creation and material entry. Built with retry logic because sometimes things don't go as planned.

### Inventory Handling
The `03 issue/` directory contains scripts that manage inventory issues, making sure everything balances correctly. It's like having a really fast, really accurate inventory clerk.

### Document Management
In `04 upload/` - Handles all the document uploading through a combination of VBScript and AutoIt. Even deals with those tricky file upload dialogs!

## Under The Hood

The system is built using:
- Python for data processing and coordination
- JavaScript for browser automation
- VBScript for system integration
- AutoIt for handling system dialogs
- Claude API for intelligent PDF extraction

## Getting Started

1. Update the input files:
   - `systemwo.txt` - Maps work orders to system numbers
   - `WoData.txt` - Work orders to create
   - `issue.txt` - Orders for inventory processing

2. Place PDFs in the upload directory

3. Run the components in sequence:
   ```bash
   # Extract PDF data
   python 00_preprocess/claude.py
   python 00_preprocess/process_work_orders.py

   # Create work orders
   python 01_woCreation/wo.py
   # Then run WoCreation.js in browser

   # Handle materials
   python 02_enterWO/update_csv.py
   # Then run dragon3.js in browser

   # Process inventory
   python 03_issue/updatearray.py
   # Then run issues4.js in browser

   # Upload documents
   start upload.bat  # Handles environment checks and uploads
   ```

## Behind the Scenes

The system includes some thoughtful touches:
- Comprehensive error logging
- Automatic retry on timeouts
- Input validation at each step
- Security-conscious configuration
- Detailed process logging

## Making Things Easier

Some tips for smooth operation:
- Start small when testing changes
- Keep an eye on error.txt
- Monitor upload_log.txt
- Make sure input files are up to date
- Check that workflow program is running
- Verify PDFs are in place before uploads

This project shows how automation can transform tedious tasks into smooth processes, letting computers handle the repetitive work while keeping humans in control of the important decisions.

Feel free to explore each component - the code is structured to be readable and maintainable. After all, good automation should make life easier for everyone involved!
