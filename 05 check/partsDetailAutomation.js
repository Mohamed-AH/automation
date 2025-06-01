// --- Helper Functions ---

// Helper function to wait for specified milliseconds
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to wait for element to be available (used for elements NOT in iframe)
const waitForElement = async (selector, timeout = 10000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const element = document.querySelector(selector);
        if (element) return element;
        await wait(100);
    }
    throw new Error(`Element ${selector} not found after ${timeout}ms`);
};

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
            console.log('Iframe access error (likely not loaded yet or cross-origin):', e.message);
        }
        await wait(100);
    }
    throw new Error(`Element ${selector} not found in iframe after ${timeout}ms`);
};

// Helper function to click Cancel button
const clickCancelButton = async () => {
    try {
        console.log('Attempting to click Cancel button...');
        await wait(1500);
        const iframe = document.getElementById('e1menuAppIframe');
        if (iframe && iframe.contentWindow && iframe.contentWindow.JDEDTAFactory &&
            typeof iframe.contentWindow.JDEDTAFactory.getInstance === 'function') {
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_12'); // Common cancel action
        } else {
            const closeButton = await waitForElementInIframe('img[name="hc_Cancel"]');
            closeButton.click();
        }
        console.log('Successfully clicked Cancel button');
        await wait(1500);
    } catch (error) {
        console.error('Failed to click Cancel button:', error);
        throw error;
    }
};

// Helper function to click OK button
async function clickOkButton() {
    try {
        console.log('Attempting to click OK button...');
        await wait(1500);

        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        if (iframe.contentWindow.JDEDTAFactory &&
            typeof iframe.contentWindow.JDEDTAFactory.getInstance === 'function') {
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_12'); // Common OK action
            console.log('Successfully clicked OK using JDEDTAFactory');
        } else {
            const okButton = iframe.contentDocument.querySelector('img[name="hc_OK"]');
            if (!okButton) throw new Error('OK button not found');
            console.log('Falling back to direct click...');
            okButton.click();
            console.log('Successfully clicked OK button directly');
        }

        await wait(2000); // Wait for OK action to complete
        return true;
    } catch (error) {
        console.error('Failed to click OK button:', error);
        throw error;
    }
}

// Function to select Parts Detail from the row exit menu
async function selectPartsDetailFromMenu() {
    try {
        console.log('Selecting Parts Detail from menu...');
        const DELAY = 1500;
        await wait(DELAY);

        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        const rowMenu = await waitForElementInIframe('select[name="menu1"]');
        if (!rowMenu) throw new Error('Row menu (select[name="menu1"]) not found');

        rowMenu.click();
        await wait(500); // Small wait after click for menu to fully appear/populate

        let partsDetailOption = null;
        const maxAttempts = 20; // Number of times to check for the option
        const checkInterval = 200; // Milliseconds between checks

        console.log('Attempting to find "Parts Detail" option by text with retries...');
        for (let i = 0; i < maxAttempts; i++) {
            partsDetailOption = Array.from(rowMenu.options).find(option =>
                option.text === 'Parts Detail' ||
                option.text.includes('Parts Detail')
            );
            if (partsDetailOption) {
                console.log(`"Parts Detail" option found by text on attempt ${i + 1}.`);
                break;
            }
            await wait(checkInterval);
        }

        if (partsDetailOption) {
            rowMenu.value = partsDetailOption.value;
            rowMenu.dispatchEvent(new Event('change', { bubbles: true }));
            console.log('Attempting menu selection via direct JDE function call...');
            try {
                if (iframe.contentWindow.doMenuSelectHE0_138hc_Row_Exit) {
                    iframe.contentWindow.doMenuSelectHE0_138hc_Row_Exit(rowMenu);
                    console.log('Menu select direct function call (doMenuSelectHE0_138hc_Row_Exit) executed.');
                    await wait(DELAY); // Add a small wait after successful call
                    return true; // Successfully selected by direct function
                } else {
                    throw new Error('Direct menu select function not available, falling back to factory post call.');
                }
            } catch (e) {
                console.warn(`Menu selection method (doMenuSelectHE0_138hc_Row_Exit) failed: ${e.message}. Attempting direct factory post call (0_192) as fallback.`);
                try {
                    iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_192');
                    console.log('JDEDTAFactory post for Parts Detail (0_192) executed as primary fallback.');
                    await wait(DELAY); // Add a small wait after successful call
                    return true; // Successfully selected by direct factory call
                } catch (e2) {
                    throw new Error(`Direct factory post call for Parts Detail (0_192) failed: ${e2.message}`);
                }
            }
        } else {
            console.warn('Parts Detail option not found by text after multiple attempts. Attempting direct factory post call (0_192) as primary fallback.');
            try {
                iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_192');
                console.log('JDEDTAFactory post for Parts Detail (0_192) executed as primary fallback.');
                await wait(DELAY); // Add a small wait after successful call
                return true; // Successfully selected by direct factory call
            } catch (e) {
                throw new Error(`Parts Detail option not found by text AND direct factory post call (0_192) failed: ${e.message}`);
            }
        }
    } catch (error) {
        console.error('Failed to select Parts Detail from menu:', error);
        throw error;
    }
}

// --- Combined Navigation to Parts Detail ---
/**
 * Automates the navigation to the Parts Detail screen for a given work order.
 * @param {string} workOrderNumber The work order number to search and navigate to.
 * @returns {Promise<boolean>} True if navigation to parts detail was successful, false otherwise.
 */
async function navigateToPartsDetail(workOrderNumber) {
    const DELAY = 1500; // Standard delay

    try {
        console.log(`[NAV] Step 1: Entering Work Order ${workOrderNumber} into QBE field.`);
        await wait(DELAY);
        const qbeInput = await waitForElementInIframe('input[name="qbe0_1.0"]');
        if (!qbeInput) {
            console.error('[NAV] Work Order QBE input field (qbe0_1.0) not found.');
            return false;
        }

        qbeInput.value = workOrderNumber;
        qbeInput.dispatchEvent(new Event('change', { bubbles: true }));
        qbeInput.dispatchEvent(new Event('blur'));
        await wait(500);

        qbeInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        qbeInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
        await wait(DELAY);

        const iframe = document.getElementById('e1menuAppIframe');
        if (iframe && iframe.contentWindow && iframe.contentWindow.JDEDTAFactory) {
            console.log('[NAV] Triggering JDEDTAFactory.post("0_10") for Find action.');
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_10'); // "Find" action
            await wait(DELAY * 2); // Wait for search results to load
        } else {
            console.warn('[NAV] JDEDTAFactory not available for Find action. May need manual Find button click.');
            await wait(DELAY * 2);
        }

        console.log(`[NAV] Step 2: Selecting Work Order ${workOrderNumber} row.`);
        await wait(DELAY);
        let checkbox = null;
        const iframeDoc = iframe.contentDocument;
        if (iframeDoc) {
            const woCell = Array.from(iframeDoc.querySelectorAll('td')).find(td => td.innerText.trim() === workOrderNumber);
            if (woCell) {
                const row = woCell.closest('tr');
                if (row) {
                    checkbox = row.querySelector('input[type="checkbox"][name^="grs0_"]');
                }
            }
        }

        if (checkbox) {
            if (!checkbox.checked) {
                checkbox.click();
                console.log('[NAV] Work order checkbox clicked.');
                await wait(DELAY); // Wait for selection to register
            } else {
                console.log('[NAV] Work order checkbox already checked.');
            }
        } else {
            console.warn('[NAV] Work order checkbox not found for selection. This might lead to issues if auto-selection is not enabled.');
        }

        if (iframe && iframe.contentWindow && iframe.contentWindow.JDEDTAFactory) {
            console.log('[NAV] Triggering JDEDTAFactory.post("0_138") for Row Exit.');
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_138'); // "Row Exit" action
            await wait(DELAY * 2); // Wait for row exit menu to appear
        } else {
            console.warn('[NAV] JDEDTAFactory not available for Row Exit. May need manual Row Exit button click.');
            await wait(DELAY * 2);
        }


        console.log(`[NAV] Step 3: Selecting "Parts Detail" from the menu.`);
        await selectPartsDetailFromMenu();
        await wait(DELAY * 3); // Extra wait for Parts Detail screen to fully load

        console.log(`[NAV] Successfully navigated to Parts Detail for WO: ${workOrderNumber}`);
        return true;

    } catch (error) {
        console.error(`[NAV] Error during navigation to Parts Detail for WO ${workOrderNumber}:`, error);
        try {
            await clickCancelButton();
            console.log('[NAV] Attempted to click Cancel during navigation error recovery.');
            await wait(DELAY);
        } catch (cancelError) {
            console.error('[NAV] Failed to click Cancel during navigation error recovery:', cancelError);
        }
        return false;
    }
}


// --- Functions for Work Order Details Checking ---

/**
 * Extracts parts detail from the table.
 * @returns {Promise<Object>} An object containing findings about parts.
 */
async function getPartsDetail() {
    const detailFindings = {
        partsEntered: false,
        allIssued: true,
        anyQtyAvailableProjectLeft: false,
        partDetails: []
    };

    try {
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe || !iframe.contentDocument) {
            throw new Error('Iframe content not accessible.');
        }
        const partsGrid = await waitForElementInIframe('table#jdeGridData0_1', 7000);
        if (!partsGrid) {
            console.log('Parts grid not found.');
            return detailFindings;
        }

        const rows = partsGrid.querySelectorAll('tbody tr');
        if (rows.length === 0) {
            console.log('No parts found in the grid.');
            return detailFindings;
        }

        for (let i = 0; i < rows.length; i++) {
            if (i % 2 !== 0) {
                console.log(`Skipping row index ${i} (likely a description row).`);
                continue;
            }

            const row = rows[i];
            const cols = row.querySelectorAll('td');
            const partNumberColIndex = 3;
            const qtyIssuedColIndex = 6;
            const qtyAvailCurrentProjectColIndex = 10;

            if (cols.length > Math.max(partNumberColIndex, qtyIssuedColIndex, qtyAvailCurrentProjectColIndex)) {
                let partNumber = '';
                const partNumberCell = cols[partNumberColIndex];
                if (partNumberCell) {
                    const inputField = partNumberCell.querySelector('input.textfield');
                    if (inputField && inputField.value) {
                        partNumber = inputField.value.trim();
                    } else {
                        const nobrDiv = partNumberCell.querySelector('nobr > div');
                        if (nobrDiv && nobrDiv.innerText) {
                            partNumber = nobrDiv.innerText.trim();
                        } else {
                            partNumber = partNumberCell.innerText.trim();
                        }
                    }
                    if (partNumber === '&nbsp;') {
                        partNumber = '';
                    }
                }

                let qtyIssued = 0;
                const qtyIssuedCell = cols[qtyIssuedColIndex];
                if (qtyIssuedCell) {
                    const issuedInput = qtyIssuedCell.querySelector('input.textfield');
                    if (issuedInput && issuedInput.value) {
                        qtyIssued = parseFloat(issuedInput.value.trim()) || 0;
                    } else {
                        const nobrDiv = qtyIssuedCell.querySelector('nobr > div');
                        if (nobrDiv && nobrDiv.innerText) {
                            qtyIssued = parseFloat(nobrDiv.innerText.trim()) || 0;
                        } else {
                            qtyIssued = parseFloat(qtyIssuedCell.innerText.trim()) || 0;
                        }
                    }
                }

                let qtyAvailCurrentProject = 0;
                const qtyAvailCell = cols[qtyAvailCurrentProjectColIndex];
                if (qtyAvailCell) {
                    const nobrDiv = qtyAvailCell.querySelector('nobr > div');
                    if (nobrDiv && nobrDiv.innerText) {
                        qtyAvailCurrentProject = parseFloat(nobrDiv.innerText.trim()) || 0;
                    } else {
                        qtyAvailCurrentProject = parseFloat(qtyAvailCell.innerText.trim()) || 0;
                    }
                }

                if (partNumber === '' && qtyIssued === 0 && qtyAvailCurrentProject === 0) {
                    console.log(`Skipping row with empty/zero data: Part Number: '${partNumber}', Issued Qty: ${qtyIssued}, Qty Aval: ${qtyAvailCurrentProject}`);
                    continue;
                }

                if (qtyIssued <= 0) {
                    detailFindings.allIssued = false;
                }

                if (qtyAvailCurrentProject > 0) {
                    detailFindings.anyQtyAvailableProjectLeft = true;
                }

                detailFindings.partDetails.push({
                    "Part Number": partNumber,
                    "Issued Qty": qtyIssued,
                    "Qty Aval Current - Project": qtyAvailCurrentProject
                });
            } else {
                console.warn("Skipping row due to insufficient columns:", row.innerText);
            }
        }
        
        detailFindings.partsEntered = detailFindings.partDetails.length > 0;

    } catch (error) {
        console.error('Error fetching parts detail:', error);
        detailFindings.allIssued = false;
        detailFindings.anyQtyAvailableProjectLeft = false;
        detailFindings.partsEntered = false;
        detailFindings.error = error.message;
    }
    return detailFindings;
}

/**
 * Processes a single work order number.
 * @param {string} workOrderNumber The work order number to process.
 * @returns {Promise<Object>} A dictionary of findings for the work order.
 */
async function processSingleWorkOrder(workOrderNumber) {
    const result = {
        "Work Order": workOrderNumber,
        "Exists": "No",
        "Part Numbers Entered": "No",
        "All Items Issued": "N/A",
        "Items Left in Qty Aval Current - Project": "N/A",
        "Details": []
    };

    console.log(`\n--- Processing Work Order: ${workOrderNumber} ---`);

    try {
        const navSuccess = await navigateToPartsDetail(workOrderNumber);
        if (!navSuccess) {
            result["Exists"] = "Work Order Does Not Exist";
            console.warn(`Navigation to parts detail failed for WO ${workOrderNumber}. Setting status to 'Work Order Does Not Exist'.`);
            try {
                await clickCancelButton();
            } catch (cancelErr) {
                console.error(`Failed to cancel after navigation failure for WO ${workOrderNumber}: ${cancelErr.message}`);
            }
            return result;
        }

        const partsData = await getPartsDetail();

        if (!partsData.partsEntered) {
            result["Exists"] = "Work Order Does Not Exist";
            result["Part Numbers Entered"] = "No";
            result["All Items Issued"] = "N/A";
            result["Items Left in Qty Aval Current - Project"] = "N/A";
            result["Details"] = [];
            console.warn(`Mapsd to Parts Detail for WO ${workOrderNumber}, but no valid parts were found. Setting status to 'Work Order Does Not Exist'.`);
        } else {
            result["Exists"] = "Yes";
            result["Part Numbers Entered"] = "Yes";
            result["All Items Issued"] = partsData.allIssued ? "Yes" : "No";
            result["Items Left in Qty Aval Current - Project"] = partsData.anyQtyAvailableProjectLeft ? "Yes" : "No";
            result["Details"] = partsData.partDetails;
        }
        
        if (partsData.error) result.error = partsData.error;

        console.log(`Summary for ${workOrderNumber}:`);
        console.log(`  Exists: ${result["Exists"]}`);
        console.log(`  Part Numbers Entered: ${result["Part Numbers Entered"]}`);
        console.log(`  All Items Issued: ${result["All Items Issued"]}`);
        console.log(`  Items Left in Qty Aval Current - Project: ${result["Items Left in Qty Aval Current - Project"]}`);
        
        if (result["Details"].length > 0) {
            console.log("  Part-Specific Details:");
            console.table(result["Details"]);
        } else {
            console.log("  No specific part details collected.");
        }

    } catch (error) {
        console.error(`Critical error processing work order ${workOrderNumber}:`, error);
        result.error = error.message;
        try {
            await clickCancelButton();
        } catch (cancelError) {
            console.error('Failed to click Cancel button during critical error recovery:', cancelError);
        }
    } finally {
        try {
            const okButton = await waitForElementInIframe('img[name="hc_OK"]', 1000);
            if (okButton) {
                await clickOkButton();
                console.log(`Mapsd back from Parts Detail for ${workOrderNumber}.`);
                await wait(2000);
            } else {
                 console.log(`OK button not found on Parts Detail for ${workOrderNumber}, assuming already returned or error state.`);
            }
        } catch (navError) {
            console.warn(`Error during final navigation back for ${workOrderNumber}: ${navError.message}`);
        }
    }
    return result;
}

// --- Automation System Setup ---

// Array to hold the queue of work orders. This can be modified externally.
const workOrderQueue = ["611993", "611994", "611995", "611996", "611997", "611998", "611999", "612000", "612001", "612002", "612003", "612004", "612005", "612006", "612007", "612008", "612009", "612010", "612011", "612012", "612013", "612014", "612015", "612016", "612017", "612018", "612019"];
const processedResults = []; // To store results of processed work orders

/**
 * Main function to process work orders sequentially from the queue.
 */
async function processWorkOrders() {
    console.log("Starting batch processing of work orders from the pre-populated queue...");
    
    // Take a copy of the queue for this run and then clear the original queue
    // to allow for new work orders to be added for subsequent runs.
    const currentQueue = [...window.partsDetailAutomation.workOrderQueue];
    window.partsDetailAutomation.workOrderQueue.length = 0; // Clear the original queue
    processedResults.length = 0; // Clear previous results

    // Map to store part numbers with remaining quantities and the work orders they appear in
    // Key: Part Number (string)
    // Value: Set of Work Order Numbers (Set<string>)
    const partsWithRemainingQty = new Map();

    for (let i = 0; i < currentQueue.length; i++) {
        const woNum = currentQueue[i];
        const result = await processSingleWorkOrder(woNum);
        processedResults.push(result);

        // Check for parts with remaining quantities and aggregate them
        if (result["Items Left in Qty Aval Current - Project"] === "Yes" && result.Details.length > 0) {
            result.Details.forEach(part => {
                if (part["Qty Aval Current - Project"] > 0) {
                    const partNumber = part["Part Number"];
                    if (partNumber) { // Ensure part number is not empty
                        if (!partsWithRemainingQty.has(partNumber)) {
                            partsWithRemainingQty.set(partNumber, new Set());
                        }
                        partsWithRemainingQty.get(partNumber).add(woNum);
                    }
                }
            });
        }

        if (i < currentQueue.length - 1) {
            console.log(`Waiting 3 seconds before processing next work order...`);
            await wait(3000);
        }
    }

    console.log("\n--- Batch Processing Summary ---");
    const summaryData = processedResults.map(res => ({
        "Work Order": res["Work Order"],
        "Exists": res["Exists"],
        "Part Numbers Entered": res["Part Numbers Entered"],
        "All Items Issued": res["All Items Issued"],
        "Items Left in Qty Aval Current - Project": res["Items Left in Qty Aval Current - Project"],
        "Error": res.error || "None"
    }));
    console.table(summaryData);

    // New section for parts with remaining quantities
    if (partsWithRemainingQty.size > 0) {
        console.log("\n--- Parts with Remaining 'Qty Aval Current - Project' Across Batch ---");
        partsWithRemainingQty.forEach((workOrders, partNumber) => {
            console.log(`Part Number: ${partNumber}`);
            console.log(`  Present in Work Orders: ${Array.from(workOrders).join(', ')}`);
        });
        console.log("\nManual inspection of these work orders is recommended for probable errors.");
    } else {
        console.log("\nNo parts found with remaining 'Qty Aval Current - Project' in this batch. Current summary is OK.");
    }

    console.log("\nBatch Processing Finished.");
    return processedResults;
}

// Expose automation controls globally
window.partsDetailAutomation = {
    /**
     * The queue of work order numbers to be processed.
     * You can populate this array directly from an external script or manually in the console.
     * Example: partsDetailAutomation.workOrderQueue = ["123456", "789012"];
     */
    workOrderQueue: workOrderQueue,

    /**
     * Starts the processing of work orders currently in the `workOrderQueue`.
     * Once called, it processes all items in the queue and then clears it.
     */
    processWorkOrders: processWorkOrders,
    
    /**
     * Clears all work orders from the processing queue and any previously collected results.
     */
    clearWorkOrderQueue: () => {
        window.partsDetailAutomation.workOrderQueue.length = 0;
        processedResults.length = 0;
        console.log('Work order queue and previous results cleared.');
    },
    
    /**
     * Retrieves the results of all work orders processed in the last run.
     * @returns {Object[]} An array of results for each processed work order.
     */
    getProcessedResults: () => [...processedResults],

    debug: {
        /**
         * Returns the current number of work orders in the queue.
         * @returns {number}
         */
        getWorkOrderCount: () => window.partsDetailAutomation.workOrderQueue.length,
    }
};

// Initialize the automation with a startup message
console.log(`
Work Order Parts Detail Automation System Initialized
---------------------------------------------------
This script automates fetching parts detail for work orders.

How to Use:
1.  **Navigate to your JDE Work Order Entry screen** in your web browser.
2.  **Open your browser's Developer Tools** (F12) and go to the 'Console' tab.
3.  **Paste the entire script** into the console and press Enter.

**To run the automation:**

* **1. Populate the work order queue:**
    Assign an array of work order numbers (as strings) to 'partsDetailAutomation.workOrderQueue'.
    This can be done from another script or directly in the console:
    \`\`\`javascript
    partsDetailAutomation.workOrderQueue = ["611900", "611901", "611950", "DUMMY123"];
    \`\`\`

* **2. Start processing:**
    Call the main processing function:
    \`\`\`javascript
    partsDetailAutomation.processWorkOrders();
    \`\`\`

* **Other useful commands:**
    - To clear the queue and previous results:
      \`\`\`javascript
      partsDetailAutomation.clearWorkOrderQueue();
      \`\`\`
    - To retrieve the results of the last processing run:
      \`\`\`javascript
      partsDetailAutomation.getProcessedResults();
      \`\`\`
    - To check the number of work orders currently in the queue:
      \`\`\`javascript
      partsDetailAutomation.debug.getWorkOrderCount();
      \`\`\`
`);