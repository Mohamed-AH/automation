
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

// --- NEW: UI FOR MANUAL VERIFICATION PAUSE ---
const createVerificationUI = () => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.id = 'manual-check-overlay';
        overlay.style = 'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 10000; padding: 15px; background: #fff; border: 4px solid #ff0000; box-shadow: 0 4px 15px rgba(0,0,0,0.5); text-align: center; font-family: sans-serif;';
        
        overlay.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #d00; font-size: 16px;">UM VERIFICATION REQUIRED</div>
            <div style="margin-bottom: 10px; font-size: 13px;">Review the highlighted UM field. Edit if necessary, then click proceed.</div>
            <button id="proceed-btn" style="padding: 8px 16px; cursor: pointer; background: #28a745; color: white; border: none; font-weight: bold; border-radius: 4px;">Click to Proceed</button>
        `;
        
        document.body.appendChild(overlay);
        
        document.getElementById('proceed-btn').onclick = () => {
            overlay.remove();
            resolve();
        };
    });
};

// Helper function to get UM value from column 14
async function getUMFromCell(rowIndex) {
    try {
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) return null;
        
        // Target column 14 (UM). Handles both div (EA) and input (BX/PK/etc)
        const selector = `[id="gce0_1.${rowIndex}.14"], [name="gce0_1.${rowIndex}.14"]`;
        const element = iframe.contentDocument.querySelector(selector);
        
        if (!element) return null;
        
        // Return .value if it's an input, otherwise .textContent
        return element.tagName === 'INPUT' ? element.value.trim() : element.textContent.trim();
    } catch (e) {
        return null;
    }
}

// Helper function to click Cancel button
const clickCancelButton = async () => {
    try {
        console.log('Attempting to click Cancel button...');
        await wait(200);
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');
        try {
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_13');
            console.log('Successfully clicked Cancel using factory');
        } catch (factoryError) {
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
        try {
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_12');
            console.log('First OK click successful');
        } catch (factoryError) {
            const okButton = iframe.contentDocument.querySelector('img[name="hc_OK"][id="hc_OK"]');
            if (!okButton) throw new Error('OK button not found');
            okButton.click();
        }
        await wait(200);
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
        const allMenus = iframe.contentDocument.querySelectorAll('select[name="menu1"]');
        let rowMenu = null;
        for (const menu of allMenus) {
            const onchange = menu.getAttribute('onchange');
            if (onchange && onchange.includes('doMenuSelectHE0_138hc_Row_Exit')) {
                rowMenu = menu;
                break;
            }
        }
        if (!rowMenu) throw new Error('Row menu not found');
        rowMenu.click();
        await wait(500);
        const inventoryOption = Array.from(rowMenu.options).find(option => 
            option.text.includes('Inventory Issues') && option.value.includes("post('0_144')")
        );
        if (!inventoryOption) throw new Error('Inventory Issues option not found');
        rowMenu.value = inventoryOption.value;
        try {
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_144');
        } catch (error) {
            rowMenu.dispatchEvent(new Event('change', { bubbles: true }));
        }
        await wait(DELAY);
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
        const tdCell = iframe.contentDocument.querySelector(`td[headers="GHEAD0_1.10"][gridid="0_1"][realrow="${rowIndex}"]`);
        if (!tdCell) return null;
        const divInCell = tdCell.querySelector('div');
        if (!divInCell) return null;
        const value = divInCell.textContent.trim();
        return value === '' || value === '&nbsp;' ? null : parseFloat(value);
    } catch (error) {
        return null;
    }
}

// Helper function to enter quantity in the issue field
async function enterIssueQuantity(rowIndex, quantity) {
    try {
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');
        await wait(500);
        const cellSelector = `td[headers="GHEAD0_1.5"][gridid="0_1"][realrow="${rowIndex}"]`;
        const cell = iframe.contentDocument.querySelector(cellSelector);
        if (!cell) throw new Error('Issue quantity cell not found');
        cell.click();
        await wait(200);
        const inputSelector = `input[name="gce0_1.${rowIndex}.5"]`;
        let input = iframe.contentDocument.querySelector(inputSelector);
        if (!input) {
            const alternativeSelector = `input[id="gce0_1.${rowIndex}.5"]`;
            input = iframe.contentDocument.querySelector(alternativeSelector);
        }
        if (!input) throw new Error('Issue quantity input not found');
        input.value = '';
        input.dispatchEvent(new Event('change', { bubbles: true }));
        await wait(100);
        input.focus();
        await wait(100);
        input.value = quantity;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        const enterKeyDown = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true });
        input.dispatchEvent(enterKeyDown);
        await wait(100);
        const enterKeyUp = new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true });
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
async function processWorkOrderIssues(workOrderInput) {
    try {
        const parts = workOrderInput.trim().split(/[\s\t]+/);
        const workOrder = parts[0];
        const extractedDate = parts.length > 1 ? parts[1] : null;

        console.log(`Processing Work Order: ${workOrder}`);
        
        const qbeInput = await waitForElementInIframe('input[name="qbe0_1.0"]');
        qbeInput.value = workOrder;
        qbeInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        const enterEvent = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true };
        qbeInput.dispatchEvent(new KeyboardEvent('keydown', enterEvent));
        qbeInput.dispatchEvent(new KeyboardEvent('keyup', enterEvent));
        
        await wait(1500);
        const checkbox = await waitForElementInIframe('input[name="grs0_1"]');
        checkbox.click();
        
        await wait(1500);
        await selectInventoryIssues();
        await wait(2000);

        if (extractedDate) {
            const iframe = document.getElementById('e1menuAppIframe');
            const dateInput = iframe.contentDocument.getElementById('C0_90');
            if (dateInput) {
                dateInput.value = extractedDate;
                dateInput.dispatchEvent(new Event('change', { bubbles: true }));
                dateInput.dispatchEvent(new Event('blur', { bubbles: true }));
                await wait(500);
            }
        }

        let rowIndex = 0;
        let processedItems = 0;
        let retryCount = 0;
        const MAX_RETRIES = 3;
        
        // --- TRACKER: ONLY CHECK ONCE PER PAGE ---
        let manualCheckPerformedOnThisPage = false;

        while (retryCount < MAX_RETRIES) {
            const quantity = await getQuantityFromCell(rowIndex);
            
            if (quantity === null) {
                retryCount++;
                if (retryCount >= MAX_RETRIES) break;
                await wait(500);
                continue;
            }

            // --- UM VALIDATION LOGIC ---
            const umValue = await getUMFromCell(rowIndex);
            const manualUnits = ['BX', 'PK', 'DZ', 'ST'];

            if (!manualCheckPerformedOnThisPage && manualUnits.includes(umValue)) {
                console.log(`UM Check Required: Found ${umValue} at row ${rowIndex}`);
                
                const iframe = document.getElementById('e1menuAppIframe');
                const umElement = iframe.contentDocument.querySelector(`[id="gce0_1.${rowIndex}.14"], [name="gce0_1.${rowIndex}.14"]`);
                
                if (umElement) umElement.style.backgroundColor = 'yellow';
                
                // Pause for user intervention
                await createVerificationUI();
                
                if (umElement) umElement.style.backgroundColor = '';
                manualCheckPerformedOnThisPage = true;
            }
            
            retryCount = 0;
            const success = await enterIssueQuantity(rowIndex, quantity);
            if (!success) continue;
            
            processedItems++;
            rowIndex++;
            await wait(1000);
        }

        if (processedItems > 0) {
            await clickOkButton();
        } else {
            await clickCancelButton();
        }

        return { workOrder, status: 'success', itemsProcessed: processedItems };

    } catch (error) {
        console.error(`Error processing WO ${workOrderInput}:`, error);
        await clickCancelButton().catch(() => {});
        return { workOrder: workOrderInput, status: 'failed', error: error.message };
    }
}

// Main function to process all work orders
async function processAllIssues(workOrders) {
    console.log('Starting batch processing...');
    const results = [];
    for (let i = 0; i < workOrders.length; i++) {
        const result = await processWorkOrderIssues(workOrders[i]);
        results.push(result);
        if (i < workOrders.length - 1) await wait(3000);
    }
    console.table(results);
    return results;
}

// Initialize
window.issuesAutomation = {
    processAllIssues,
    processWorkOrderIssues,
    workOrders: [
        '614557	01/11/2026',
        '614560	01/10/2026',
        '614606	01/14/2026',
        '614611	01/15/2026',
        '614626	01/13/2026',
        '614627	01/13/2026',
        '614631	01/13/2026'
    ],
    start: function() {
        return this.processAllIssues(this.workOrders);
    }
};

console.log('Automation System Initialized. Run issuesAutomation.start() to begin.');
