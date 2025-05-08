// Helper function to wait for specified milliseconds
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to wait for element in iframe
const waitForElementInIframe = async (selector, timeout = 10000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        try {
            const iframe = document.getElementById('e1menuAppIframe');
            if (iframe && iframe.contentDocument) {
                const element = iframe.contentDocument.querySelector(selector);
                if (element) return element;
            }
        } catch (e) {
            console.log('Iframe access error:', e);
        }
        await wait(100);
    }
    throw new Error(`Element ${selector} not found in iframe after ${timeout}ms`);
};

// Helper function to click Cancel button
const clickCancelButton = async () => {
    try {
        console.log('Attempting to click Cancel button...');
        await wait(200);
        
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        try {
            // Use the specific post action for cancel
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_13');
            console.log('Successfully clicked Cancel using factory');
        } catch (factoryError) {
            // Fallback to finding and clicking the button
            const cancelButton = iframe.contentDocument.querySelector('img[name="hc_Cancel"][id="hc_Cancel"]');
            if (!cancelButton) throw new Error('Cancel button not found');
            cancelButton.click();
            console.log('Successfully clicked Cancel using direct click');
        }

        await wait(200);
    } catch (error) {
        console.error('Failed to click Cancel button:', error);
        throw error;
    }
};

// Helper function to click OK button
async function clickOkButton() {
    try {
        console.log('Attempting first OK click...');
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        // First OK click
        try {
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_12');
            console.log('First OK click successful');
        } catch (factoryError) {
            const okButton = iframe.contentDocument.querySelector('img[name="hc_OK"][id="hc_OK"]');
            if (!okButton) throw new Error('OK button not found');
            okButton.click();
        }

        await wait(200);

        // Second OK click
        try {
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_12');
            console.log('Second OK click successful');
        } catch (factoryError) {
            const okButton = iframe.contentDocument.querySelector('img[name="hc_OK"][id="hc_OK"]');
            if (!okButton) throw new Error('OK button not found');
            okButton.click();
        }

        await wait(200);
        return true;
    } catch (error) {
        console.error('Failed to complete OK button clicks:', error);
        throw error;
    }
}

// Function to select Inventory Issues from menu
async function selectInventoryIssues() {
    try {
        console.log('Selecting Inventory Issues from menu...');
        const DELAY = 1500;
        await wait(DELAY);

        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        // First find all menus
        const allMenus = iframe.contentDocument.querySelectorAll('select[name="menu1"]');
        console.log(`Found ${allMenus.length} menus`);

        // Find the correct menu by checking its onchange attribute
        let rowMenu = null;
        for (const menu of allMenus) {
            const onchange = menu.getAttribute('onchange');
            console.log('Checking menu with onchange:', onchange);
            if (onchange && onchange.includes('doMenuSelectHE0_138hc_Row_Exit')) {
                rowMenu = menu;
                break;
            }
        }

        if (!rowMenu) throw new Error('Row menu not found');
        
        console.log('Found correct menu, clicking to activate...');
        rowMenu.click();
        await wait(500);

        // Find Inventory Issues option
        const inventoryOption = Array.from(rowMenu.options).find(option => 
            option.text.includes('Inventory Issues') && 
            option.value.includes("post('0_144')")
        );
        
        if (!inventoryOption) {
            console.log('Menu options:', Array.from(rowMenu.options).map(opt => ({
                text: opt.text,
                value: opt.value
            })));
            throw new Error('Inventory Issues option not found');
        }

        console.log('Found Inventory Issues option, selecting...');
        rowMenu.value = inventoryOption.value;
        
        try {
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_144');
        } catch (error) {
            console.error('Failed to trigger inventory issues via factory:', error);
            rowMenu.dispatchEvent(new Event('change', { bubbles: true }));
        }

        await wait(DELAY);
        console.log('Successfully selected Inventory Issues');
        return true;
    } catch (error) {
        console.error('Failed to select Inventory Issues:', error);
        throw error;
    }
}

// Helper function to get quantity from a cell
async function getQuantityFromCell(rowIndex) {
    try {
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');
        
        await wait(200);
        
        // Try finding by table cell attributes first
        const tdCell = iframe.contentDocument.querySelector(`td[headers="GHEAD0_1.10"][gridid="0_1"][realrow="${rowIndex}"]`);
        if (!tdCell) {
            console.log(`No quantity cell found for row ${rowIndex}`);
            return null;
        }
        
        const divInCell = tdCell.querySelector('div');
        if (!divInCell) {
            console.log(`No div found in quantity cell for row ${rowIndex}`);
            return null;
        }
        
        const value = divInCell.textContent.trim();
        console.log(`Found value in cell: "${value}"`);
        return value === '' || value === '&nbsp;' ? null : parseFloat(value);
        
    } catch (error) {
        console.error('Error getting quantity:', error);
        return null;
    }
}

// Helper function to enter quantity in the issue field
async function enterIssueQuantity(rowIndex, quantity) {
    try {
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        await wait(500);

        // First, find and click the cell
        const cellSelector = `td[headers="GHEAD0_1.5"][gridid="0_1"][realrow="${rowIndex}"]`;
        console.log(`Looking for cell with selector: ${cellSelector}`);
        const cell = iframe.contentDocument.querySelector(cellSelector);
        if (!cell) {
            console.log('Cell not found');
            throw new Error('Issue quantity cell not found');
        }

        // Click the cell first
        console.log('Clicking cell before entering quantity');
        cell.click();
        await wait(200);

        // Now find the input field
        const inputSelector = `input[name="gce0_1.${rowIndex}.5"]`;
        console.log(`Looking for input with selector: ${inputSelector}`);

        let input = iframe.contentDocument.querySelector(inputSelector);
        if (!input) {
            const alternativeSelector = `input[id="gce0_1.${rowIndex}.5"]`;
            const altInput = iframe.contentDocument.querySelector(alternativeSelector);
            if (!altInput) {
                console.log('Input not found with either selector');
                throw new Error('Issue quantity input not found');
            }
            input = altInput;
        }

        input.value = '';
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await wait(100);

        input.focus();
        await wait(100);

        input.value = quantity;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        const enterKeyDown = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        input.dispatchEvent(enterKeyDown);
        
        await wait(100);
        
        const enterKeyUp = new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        });
        input.dispatchEvent(enterKeyUp);
        
        input.blur();
        await wait(500);
        return true;
    } catch (error) {
        console.error('Error entering issue quantity:', error);
        return false;
    }
}

// Function to process single work order issues
async function processWorkOrderIssues(workOrder) {
    try {
        console.log(`Processing issues for Work Order: ${workOrder}`);
        
        const qbeInput = await waitForElementInIframe('input[name="qbe0_1.0"]');
        qbeInput.value = workOrder;
        qbeInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        const keydownEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        });
        qbeInput.dispatchEvent(keydownEvent);
        
        const keyupEvent = new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        });
        qbeInput.dispatchEvent(keyupEvent);
        
        await wait(1500);

        const checkbox = await waitForElementInIframe('input[name="grs0_1"]');
        checkbox.click();
        
        await wait(1500);

        await selectInventoryIssues();
        await wait(2000);

        // Check for items immediately
        const firstQuantity = await getQuantityFromCell(0);
        if (firstQuantity === null) {
            console.log('No items found to issue for this work order');
            await clickCancelButton();
            return {
                workOrder,
                status: 'success',
                itemsProcessed: 0,
                message: 'No items to issue'
            };
        }

        let rowIndex = 0;
        let processedItems = 0;
        let retryCount = 0;
        const MAX_RETRIES = 3;
        
        while (retryCount < MAX_RETRIES) {
            console.log(`Processing row ${rowIndex} (Attempt ${retryCount + 1}/${MAX_RETRIES})`);
            const quantity = await getQuantityFromCell(rowIndex);
            
            if (quantity === null) {
                retryCount++;
                if (retryCount >= MAX_RETRIES) {
                    break; // Exit the loop if we've retried enough times
                }
                await wait(500);
                continue;
            }
            
            retryCount = 0; // Reset retry count when we find a quantity
            console.log(`Found quantity ${quantity} at row ${rowIndex}`);
            
            const success = await enterIssueQuantity(rowIndex, quantity);
            if (!success) {
                console.log(`Failed to enter quantity for row ${rowIndex}, retrying...`);
                continue;
            }
            
            processedItems++;
            rowIndex++;
            await wait(1000); // Wait longer between rows
        }

        if (processedItems > 0) {
            console.log(`Processed ${processedItems} items for WO ${workOrder}`);
            await clickOkButton();
        } else {
            console.log(`No items processed for WO ${workOrder}`);
            await clickCancelButton();
        }

        return {
            workOrder,
            status: 'success',
            itemsProcessed: processedItems
        };

    } catch (error) {
        console.error(`Error processing WO ${workOrder}:`, error);
        try {
            await clickCancelButton();
        } catch (cancelError) {
            console.error('Failed to click Cancel after error:', cancelError);
        }
        return {
            workOrder,
            status: 'failed',
            error: error.message
        };
    }
}

// Main function to process all work orders
async function processAllIssues(workOrders) {
    console.log('Starting batch processing of work order issues...');
    const results = [];
    
    for (let i = 0; i < workOrders.length; i++) {
        const workOrder = workOrders[i];
        console.log(`Processing ${i + 1}/${workOrders.length}: WO ${workOrder}`);
        
        const result = await processWorkOrderIssues(workOrder);
        results.push(result);
        
        if (i < workOrders.length - 1) {
            console.log('Waiting before next work order...');
            await wait(3000);
        }
    }
    
    console.log('\nProcessing Summary:');
    console.table(results);
    
    return results;
}

// Initialize the issues automation system
window.issuesAutomation = {
    processAllIssues,
    processWorkOrderIssues,
    workOrders: [
        '611719',
        '611720',
        '611721',
        '611722',
        '611723',
        '611724',
        '611725',
        '611726',
        '611727',
        '611728',
        '611729',
        '611730',
        '611731',
        '611732',
        '611733',
        '611734',
        '611735',
        '611736',
        '611737',
        '611738',
        '611739',
        '611740',
        '611741',
        '611742',
        '611743',
        '611744',
        '611745',
        '611746',
        '611747',
        '611748'
    ],
    start: function() {
        return this.processAllIssues(this.workOrders);
    }
};

// Print initialization message
console.log(`
Work Order Issues Automation System Initialized
--------------------------------------------
Total Work Orders to Process: ${window.issuesAutomation.workOrders.length}

Available Commands:
- Start Processing All: issuesAutomation.start()
- Process Single WO: issuesAutomation.processWorkOrderIssues('workOrderNumber')
- Process Custom List: issuesAutomation.processAllIssues(['wo1', 'wo2', ...])
`);