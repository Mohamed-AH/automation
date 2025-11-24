// Helper function to wait for specified milliseconds
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to wait for element to be available
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
        await wait(1500);
        const closeButton = await waitForElementInIframe('img[name="hc_Cancel"]');
        
        try {
            const iframe = document.getElementById('e1menuAppIframe');
            if (iframe.contentWindow.JDEDTAFactory && 
                typeof iframe.contentWindow.JDEDTAFactory.getInstance === 'function') {
                iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_12');
            } else {
                closeButton.click();
            }
        } catch (clickError) {
            closeButton.click(); // Fallback to direct click
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

        // Try to find the OK button
        const okButton = iframe.contentDocument.querySelector('img[name="hc_OK"]');
        if (!okButton) throw new Error('OK button not found');

        // First try using JDEDTAFactory
        try {
            if (iframe.contentWindow.JDEDTAFactory && 
                typeof iframe.contentWindow.JDEDTAFactory.getInstance === 'function') {
                iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_12');
                console.log('Successfully clicked OK using JDEDTAFactory');
            } else {
                throw new Error('JDEDTAFactory not available');
            }
        } catch (factoryError) {
            // Fallback to direct click
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

// Helper function to select Parts Detail from menu
async function selectPartsDetail() {
    try {
        console.log('Selecting Parts Detail from menu...');
        const DELAY = 1500;
        await wait(DELAY);

        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        const rowMenu = await waitForElementInIframe('select[name="menu1"]');
        if (!rowMenu) throw new Error('Row menu not found');
        
        // First attempt: Try using the menu selection
        try {
            console.log('Attempting menu selection...');
            // Click the menu to ensure it's active
            rowMenu.click();
            await wait(500);
            
            // Find Parts Detail option
            const partsDetailOption = Array.from(rowMenu.options).find(option => 
                option.text === 'Parts Detail' || 
                option.text.includes('Parts Detail')
            );
            
            if (partsDetailOption) {
                // Set the value and trigger events
                rowMenu.value = partsDetailOption.value;
                rowMenu.dispatchEvent(new Event('change', { bubbles: true }));
                
                // Try multiple approaches to trigger the selection
                try {
                    if (iframe.contentWindow.doMenuSelectHE0_138hc_Row_Exit) {
                        iframe.contentWindow.doMenuSelectHE0_138hc_Row_Exit(rowMenu);
                    }
                } catch (e) {
                    console.warn('Menu select function call failed, trying direct factory call');
                }
                
                try {
                    iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_192');
                } catch (e) {
                    console.warn('Direct factory call failed');
                }
                
                // Additional check: try to trigger the default action
                try {
                    const menuChangeEvent = new Event('change', { bubbles: true, cancelable: true });
                    rowMenu.dispatchEvent(menuChangeEvent);
                } catch (e) {
                    console.warn('Menu change event dispatch failed');
                }
            } else {
                throw new Error('Parts Detail option not found in menu');
            }
        } catch (menuError) {
            console.warn('Menu selection method failed:', menuError);
            
            // Second attempt: Direct JDEDTAFactory call
            console.log('Attempting direct factory call...');
            try {
                await wait(500); // Small wait before retry
                iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_192');
            } catch (factoryError) {
                console.error('Both menu selection methods failed');
                throw factoryError;
            }
        }

        // Wait longer after selection to ensure screen loads
        await wait(DELAY * 3);
        console.log('Successfully selected Parts Detail');
        return true;

    } catch (error) {
        console.error('Failed to select Parts Detail:', error);
        throw error;
    }
}

// Initialize work order items map
const workOrderItems = new Map();

// Parse CSV data and organize by work order
const csvData = `613920,49-2101-00061,1
613920,OC-40 -040-003-0117,1
613920,03-9301-00108,4
613920,21-3605-00003,2
613920,PMD-HT-0087,4
613920,21-3601-00001,2
613920,21-2401-00022,100
613920,GNA_F_00868657,1
613920,GNA_F_00868665,1
613920,E00075,15
613920,451DC,50
613920,OC-40 -040-001-0116,40
613920,PMD-HT-0021,20
613920,13-3390-00017,20
613921,03-1805-00006,1
613921,03-1701-00047,1
613921,03-1701-00060,1
613921,03-2090-00023,1
613921,03-1790-00199,1
613921,03-1790-00200,1
613921,03-1701-00043,1
613921,09-2223-00004,2
613922,07-1005-00002,336
613922,21-3601-00001,6
613922,21-3605-00003,7
613922,PMD-HT-0087,6
613922,13-3509-00053,2
613922,03-9101-00005,4
613922,49-1702-00284,9
613922,03-9301-00105,12
613922,03-5290-00081,4
613922,03-1805-00006,2
613922,03-1790-00199,2
613922,03-1790-00200,2
613922,03-1701-00043,2
613922,03-1701-00044,1
613922,03-1701-00047,2
613922,03-2090-00023,1
613922,03-2090-00025,1
613923,49-1702-00284,4
613923,451DC,660
613923,03-9301-00108,42
613923,03-5290-00081,1
613923,03-1701-00048,1
613923,03-1701-00043,1
613923,03-1805-00006,1
613923,03-1790-00199,1
613923,03-1790-00200,1
613923,03-2090-00023,1
613923,03-1701-00044,1
613923,03-1701-00047,1
613923,03-1601-00001,14
613923,03-1604-00001,6
613923,07-1005-00002,360
613923,21-2401-00022,100
613923,LP-FXN-BLT-RFGHD0620N/W,1000
613924,07-1005-00002,432
613924,13-3509-00053,2
613924,GNA_F_00868657,10
613924,GNA_F_00868665,8
613924,09-2223-00004,2
613924,OC-13 -013-007-0157,236
613924,LP-FXN-BLT-RFGHD0620N/W,500
613925,07-1005-00002,552
613925,03-1601-00001,19
613925,03-1604-00001,1
613925,03-5290-00081,1
613925,03-2090-00021,1
613925,03-1805-00006,1
613925,03-1701-00047,1
613925,03-1790-00199,1
613925,03-1601-00001,1
613925,03-1604-00001,1
613925,13-3509-00053,2
613925,09-2223-00004,5
613925,03-9101-00005,2
613925,03-9301-00108,8
613925,03-1601-00002,12
613925,21-2401-00022,100
613926,03-9301-00108,3
613927,49-1702-00284,2
613927,GNA_F_00868657,51
613927,GNA_F_00868665,23
613927,GNA_F_00868666,18
613927,GNA_F_00868661,6
613927,STFP_F_00545525,6
613927,GNA_F_00868669,6
613927,GNA_F_00868660,2
613927,PMD-HT-0087,4
613927,21-3605-00003,2
613927,13-3509-00053,4
613927,OC-13 -013-007-0157,200
613927,21-3102-00005,420
613927,23-0102-0037,50
613927,TP487,50
613927,LP-FXN-BLT-RFGHD0620N/W,1500
613928,49-1702-00005,3
613928,3-CAB14B,1
613928,OC-13 -013-040-0003,12
613928,202,12
613928,PMD-HT-0109,1
613928,GNA_F_00868657,20
613928,GNA_F_00868665,25
613928,STFP_F_00545525,50
613928,GNA_F_00868669,10
613928,451DC,300
613928,GNA_F_00868666,5
613928,E00075,65
613928,OC-40 -040-001-0116,70
613928,PMD-HT-0021,35
613928,PMD-HT-0087,5
613928,49-1702-00284,9
613928,21-2690-00010,50
613929,49-1702-00005,4
613929,OC-13 -013-007-0020,200
613929,13-3390-00022,10
613929,13-3390-00017,10
613929,OC-13 -013-007-0059,2
613929,49-1702-00284,2
613930,13-3509-00053,10
613930,PMD-HT-0087,12
613930,GNA_F_00868657,35
613930,GNA_F_00868665,16
613930,GNA_F_00868669,4
613930,GNA_F_00868661,6
613930,09-2223-00004,4
613930,GNA_F_00868666,3
613930,OC-13 -013-005-0061,50
613930,21-5190-00002,4
613930,21-5101-00001,4
613930,03-1504-00002,5
613930,03-1605-00001,1
613930,IMH-034STL-FLX-UL,2
613930,13-0590-00117,2
613930,13-0590-00118,2
613930,LP-FXN-BLT-RFGHD0620N/W,1000
613931,21-3601-00001,2
613931,PMD-HT-0087,5
613931,GNA_F_00868657,25
613931,GNA_F_00868665,25
613931,GNA_F_00868661,5
613931,GNA_F_00868666,13
613931,GNA_F_00868669,13
613931,03-9101-00005,1
613931,13-3390-00017,15
613931,FX-0150-C-OMDIA10,200
613931,LP-FXN-BLT-RFGHD0620N/W,500
613932,03-5290-00076,1
613932,PMD-HT-0087,4
613932,GNA_F_00868657,10
613932,GNA_F_00868665,5
613932,OC-13 -013-007-0020,200
613932,OC-13 -013-007-0059,2
613932,LP-FXN-BLT-RFGHD0620N/W,500
613932,FX-0150-C-OMDIA10,200
613933,03-5290-00081,3
613933,03-1790-00199,2
613933,03-1790-00200,1
613933,03-1701-00047,2
613933,03-2090-00025,1
613933,03-1701-00043,1
613933,03-1805-00006,2
613933,03-2090-00021,1
613933,23-0102-0037,50
613933,03-9301-00108,18
613933,TP487,30
613933,OC-13 -013-007-0020,200
613933,OC-13 -013-007-0059,2
613933,E00075,15
613933,451DC,50
613933,LP-FXN-BLT-RFGHD0620N/W,500
613933,FX-0150-C-OMDIA10,100
613934,GNA_F_00868657,113
613934,GNA_F_00868665,70
613934,451DC,150
613934,OC-13 -013-005-0061,50
613934,GNA_F_00868669,12
613934,07-1001-00046,3
613934,07-1001-00047,2
613934,GNA_F_00868666,5
613934,03-9301-00108,124
613934,E00075,10
613934,LP-FXN-BLT-RFGHD0620N/W,2500
613934,LP-FXN-NUT-HEX-GL06,1
613934,LP-FXN-NUT-SPG-GLM06,1
613934,FX-0150-C-OMDIA10,250
613935,03-9301-00108,9
613935,451DC,165
613935,21-3601-00001,2
613935,E00075,10
613935,23-0102-0037,20
613935,PMD-HT-0021,20
613935,13-3390-00017,10
613935,FX-0150-C-OMDIA10,50
613935,OC-13 -013-007-0020,50
613935,OC-13 -013-007-0059,2
613935,13-3509-00053,2
613935,LP-FXN-BLT-RFGHD0620N/W,100
613936,23-0102-0037,50
613936,FX-0150-C-OMDIA10,200
613936,LP-FXN-BLT-RFGHD0620N/W,200
613937,ESC/3,20
613937,PMD-HT-0109,2
613937,07-1001-00027,2
613937,07-1001-00046,2
613937,09-2290-00052,2
613937,PMD-HT-0087,5
613937,21-3605-00003,4
613908,760031856,40
613908,760039867,138
613907,03-7090-00293,2
613906,05-1509-00004,4
613919,05-1509-00004,9
613919,PFNSRBL1NEKAFS,8
613919,PFNSRBL2WAVE-W,8`.split('\n').forEach(line => {
    const [workOrder, itemNumber, quantity] = line.split(',');
    if (!workOrderItems.has(workOrder)) {
        workOrderItems.set(workOrder, []);
    }
    workOrderItems.get(workOrder).push({
        itemNumber,
        quantity: parseInt(quantity, 10)
    });
});

// Initialize the work order queue from CSV data
let workOrderQueue = Array.from(workOrderItems.keys()).map(wo => ({ wo }));

// Queue management functions
function addWorkOrders(workOrders) {
    if (!Array.isArray(workOrders)) {
        console.error('Work orders must be provided as an array');
        return;
    }
    
    const validWorkOrders = workOrders.filter(wo => {
        const isValid = wo && wo.wo && typeof wo.wo === 'string';
        if (!isValid) {
            console.warn('Invalid work order format:', wo);
        }
        return isValid;
    });
    
    workOrderQueue.push(...validWorkOrders);
    console.log(`Added ${validWorkOrders.length} work orders to queue. Current queue length: ${workOrderQueue.length}`);
}

function clearWorkOrderQueue() {
    const previousLength = workOrderQueue.length;
    workOrderQueue.length = 0;
    console.log(`Work order queue cleared. Removed ${previousLength} items.`);
}

// Functions for entering items and quantities
async function enterItemNumber(itemNumber) {
    try {
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        const input = iframe.contentDocument.querySelector('input[name^="gce0_1."][name$=".12"][value=""]');
        if (!input) throw new Error('No empty item number field found');

        input.click();
        input.focus();
        await wait(100);

        input.value = itemNumber;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        const enterEvent = new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        });
        input.dispatchEvent(enterEvent);
        
        await wait(500);
        return true;
    } catch (e) {
        console.warn('Enter item number error:', e);
        return false;
    }
}

async function enterQuantity(quantity) {
    try {
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        const input = iframe.contentDocument.querySelector('input[name$=".14"][value="1"]');
        if (!input) throw new Error('No quantity input field found with value "1"');

        input.click();
        await wait(100);

        input.value = quantity;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        await wait(100);

        input.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        }));
        
        await wait(50);
        
        input.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true,
            cancelable: true
        }));

        input.blur();
        
        await wait(500);
        return true;
    } catch (e) {
        console.warn('Enter quantity error:', e);
        return false;
    }
}

// Automation configuration
window.automationConfig = {
    entries: [],
    isRunning: false,
    currentIndex: 0,
    phase: 'items',
    minDelay: 1000,
    maxDelay: 2000,
    suppressErrors: true
};

// Main automation function
async function startAutomation() {
    const config = window.automationConfig;
    
    if (config.isRunning) {
        console.log('Automation is already running');
        return;
    }

    config.isRunning = true;
    console.log(`Starting ${config.phase} phase with ${config.entries.length} entries...`);

    while (config.currentIndex < config.entries.length && config.isRunning) {
        try {
            const entry = config.entries[config.currentIndex];
            
            if (config.phase === 'items') {
                console.log(`Entering item number ${config.currentIndex + 1}/${config.entries.length}: ${entry.itemNumber}`);
                const success = await enterItemNumber(entry.itemNumber);
                if (!success) throw new Error('Failed to enter item number');
            } else {
                console.log(`Entering quantity ${config.currentIndex + 1}/${config.entries.length}: ${entry.quantity}`);
                const success = await enterQuantity(entry.quantity);
                if (!success) throw new Error('Failed to enter quantity');
            }

            await wait(1000);
            config.currentIndex++;
            
        } catch (error) {
            console.error(`Error processing entry ${config.currentIndex + 1}:`, error);
            if (!config.suppressErrors) {
                pauseAutomation();
                break;
            }
            await wait(1000);
            config.currentIndex++;
        }
    }

    if (config.currentIndex >= config.entries.length) {
        console.log(`All ${config.phase} entered. Clicking OK button...`);
        try {
            await clickOkButton();
            console.log('OK button clicked successfully.');
        } catch (error) {
            console.error('Failed to click OK button:', error);
            config.isRunning = false;
            throw error;
        }
        config.isRunning = false;
    }
}
// Automation control functions
function pauseAutomation() {
    window.automationConfig.isRunning = false;
    console.log(`Paused at entry ${window.automationConfig.currentIndex + 1}`);
}

function resetAutomation() {
    window.automationConfig.isRunning = false;
    window.automationConfig.currentIndex = 0;
}

function startQuantities() {
    window.automationConfig.phase = 'quantities';
    window.automationConfig.currentIndex = 0;
    startAutomation();
}

// Main automation function for parts detail
async function automatePartsDetail(woNumber) {
    try {
        const DELAY = 1500;

        console.log('Step 1: Looking for WO number QBE field...');
        await wait(DELAY);
        const qbeInput = await waitForElementInIframe('input[name="qbe0_1.0"]');
        qbeInput.value = woNumber;
        qbeInput.dispatchEvent(new Event('change', { bubbles: true }));
        qbeInput.dispatchEvent(new Event('blur'));
        
        qbeInput.dispatchEvent(new KeyboardEvent('keydown', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        }));

        qbeInput.dispatchEvent(new KeyboardEvent('keyup', {
            key: 'Enter',
            code: 'Enter',
            keyCode: 13,
            which: 13,
            bubbles: true
        }));

        console.log('Step 2: Looking for work order checkbox...');
        await wait(DELAY);
        const checkbox = await waitForElementInIframe('input[name="grs0_1"]');
        checkbox.click();

        console.log('Step 3: Looking for Row menu...');
        await wait(DELAY);
        await selectPartsDetail();

        await wait(DELAY * 2);
        return true;

    } catch (error) {
        console.error('Automation failed:', error);
        try {
            await clickCancelButton();
        } catch (cancelError) {
            console.error('Additionally failed to click Cancel button:', cancelError);
        }
        throw error;
    }
}

// Function to execute automation for specific work order
// Updated executeItemAndQtyScript function to skip checkbox after OK
async function executeItemAndQtyScript(workOrderNumber) {
    try {
        console.log(`Executing item and quantity script for Work Order: ${workOrderNumber}`);
        
        const items = workOrderItems.get(workOrderNumber);
        if (!items) {
            throw new Error(`No items found for work order ${workOrderNumber}`);
        }

        window.automationConfig = {
            entries: items,
            isRunning: false,
            currentIndex: 0,
            phase: 'items',
            minDelay: 1000,
            maxDelay: 2000,
            suppressErrors: true
        };

        // Start items phase
        console.log(`Starting items phase for WO ${workOrderNumber} with ${items.length} items...`);
        await startAutomation();
        
        // Wait for items phase to complete
        while (window.automationConfig.isRunning) {
            await wait(1000);
        }

        // Wait after first OK button click
        await wait(3000);
        
        // Reselect Parts Detail before starting quantities phase
        console.log('Reselecting Parts Detail from Row menu...');
        
        // Try Parts Detail selection multiple times if needed
        let selectionSuccess = false;
        for (let attempt = 1; attempt <= 3 && !selectionSuccess; attempt++) {
            try {
                await selectPartsDetail();
                selectionSuccess = true;
                console.log('Successfully selected Parts Detail');
            } catch (e) {
                console.warn(`Parts Detail selection attempt ${attempt} failed, attempt ${attempt}/3`);
                await wait(1000);
            }
        }
        
        if (!selectionSuccess) {
            throw new Error('Failed to select Parts Detail after multiple attempts');
        }
        
        // Additional wait after selecting Parts Detail
        await wait(3000);
        
        // Start quantities phase
        console.log(`Starting quantities phase for WO ${workOrderNumber}...`);
        window.automationConfig.phase = 'quantities';
        window.automationConfig.currentIndex = 0;
        await startAutomation();
        
        // Wait for quantities phase to complete
        while (window.automationConfig.isRunning) {
            await wait(1000);
        }

        // Wait after final OK button click
        await wait(2000);

        console.log(`Completed processing WO ${workOrderNumber}`);
        return true;
        
    } catch (error) {
        console.error(`Failed to execute item and quantity script for WO ${workOrderNumber}:`, error);
        throw error;
    }
}
// Main process function
async function processWorkOrders() {
    console.log('Starting batch processing of work orders...');
    const results = [];
    
    for (let i = 0; i < workOrderQueue.length; i++) {
        const workOrder = workOrderQueue[i];
        console.log(`Processing work order ${i + 1}/${workOrderQueue.length}: ${workOrder.wo}`);
        
        try {
            // First automate the parts detail screen
            await automatePartsDetail(workOrder.wo);
            
            // Then execute the item and quantity script
            await executeItemAndQtyScript(workOrder.wo);
            
            results.push({
                wo: workOrder.wo,
                status: 'success',
                itemCount: workOrderItems.get(workOrder.wo).length
            });
            
            console.log(`Successfully processed work order: ${workOrder.wo}`);
            
        } catch (error) {
            console.error(`Failed to process work order: ${workOrder.wo}`, error);
            results.push({
                wo: workOrder.wo,
                status: 'failed',
                error: error.message || 'Unknown error'
            });
            
            // Try to recover by clicking Cancel
            try {
                await clickCancelButton();
            } catch (cancelError) {
                console.error('Failed to recover with Cancel button:', cancelError);
            }
        }
        
        // Wait between work orders
        if (i < workOrderQueue.length - 1) {
            console.log('Waiting before processing next work order...');
            await wait(3000);
        }
    }
    
    // Print summary
    console.log('\nProcessing Summary:');
    console.table(results);
    
    return results;
}

// Export functions for potential reuse
window.partsDetailAutomation = {
    addWorkOrders,
    clearWorkOrderQueue,
    processWorkOrders,
    automatePartsDetail,
    executeItemAndQtyScript,
    getQueueLength: () => workOrderQueue.length,
    getQueue: () => [...workOrderQueue],
    getItemsForWorkOrder: (wo) => workOrderItems.get(wo) || [],
    workOrderItems: new Map(workOrderItems),
    debug: {
        getCurrentConfig: () => ({ ...window.automationConfig }),
        getWorkOrderCount: () => workOrderItems.size,
        getTotalItemCount: () => Array.from(workOrderItems.values()).reduce((sum, items) => sum + items.length, 0)
    }
};

window.automationControls = {
    start: startAutomation,
    startQuantities: startQuantities,
    pause: pauseAutomation,
    reset: resetAutomation
};

// Initialize the automation with a startup message
console.log(`
Work Order Automation System Initialized
-------------------------------------
Total Work Orders: ${workOrderItems.size}
Total Items: ${Array.from(workOrderItems.values()).reduce((sum, items) => sum + items.length, 0)}

Available Commands:
- Start Processing: partsDetailAutomation.processWorkOrders()
- Add Work Orders: partsDetailAutomation.addWorkOrders([{wo: '123456'}, ...])
- Clear Queue: partsDetailAutomation.clearWorkOrderQueue()
- Get Items for WO: partsDetailAutomation.getItemsForWorkOrder('123456')
- Get Queue Length: partsDetailAutomation.getQueueLength()
- Get Current Queue: partsDetailAutomation.getQueue()

Debug Commands:
- Current Config: partsDetailAutomation.debug.getCurrentConfig()
- Work Order Count: partsDetailAutomation.debug.getWorkOrderCount()
- Total Item Count: partsDetailAutomation.debug.getTotalItemCount()
`);