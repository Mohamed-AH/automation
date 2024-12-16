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
const csvData = `610369,13-0806-00028,6560
610369,OC-40 -040-003-0126,13
610369,OC-40 -040-003-0162,3
610369,PMD-HT-0254,10
610369,PMD-HT-0257,10
610370,GNA_F_00868670,100
610370,OC-13 -013-020-0004,1300
610370,53-4203-00009,100
610371,004E8J-EG115EYL,4096
610371,004E8J-EG114EGR,4040
610371,04T8J-EG111EAQ,4035
610371,004T8J-EG113EBL,4052
610371,13-0401-00128,4
610372,03-1605-00041,14
610372,03-1605-00042,7
610372,03-1607-00005,8
610372,03-1607-00007,9
610372,CCH-CS24-AD-P00QE,4
610373,OC-13 -013-020-0004,200
610373,PMD-HT-0329,50
610373,OC-29 -029-013-0001,100
610373,THR 10-3,50
610373,13-3509-00013,50
610373,ES1100,1000
610373,53-4203-00009,10
610373,OC-40 -040-001-0139,100
610373,21-2290-00036,2000
610373,OC-27 -027-044-0002,10
610373,PMD-HT-0139,500
610373,MI-8280-C-EC060150,2000
610373,HOLE SAW,10
610374,PMD-HT-0139,6000
610374,OC-29 -029-013-0001,1000
610375,OC-29 -029-013-0001,200
610376,23-0305-00043,50
610376,LP-FXN-BLT-RFG-GL0620nw,13800
610376,stlb_F_00545649,3000
610377,LP-FXN-NUT-HEX-GL06,4000
610377,LP-FXN-WSR-FLT-GL06,4000
610377,LP-FXN-WSR-FLT-GL10,6000
610377,LP-FXN-NUT-HEX-GL10,6000
610377,1651RT,150
610377,26.05.33-00.01.19,2
610377,E0100,254
610377,ECN100,100
610377,ECP100,200
610377,BSC/4,200
610377,BSC/3,200
610377,BSP-3,100
610377,26.05.33-00.17.01,4
610377,21-3102-00045,20
610377,25-0301-00008,36
610378,CHANNEL4X4,50
610378,THR 10-3,100
610378,23-0305-00043,25
610378,GNA_F_00868657,36
610378,710DC,1000
610378,LP-FXN-WSR-FLT-GL10,25000
610378,LP-FXN-NUT-HEX-GL10,25000
610378,STFP_F_00545525,10
610378,GNA_F_00868660,10
610378,13-3509-00013,600
610378,PMD-HT-0329,1000
610378,OC-40 -040-003-0162,230
610378,53-4203-00009,100
610378,LP-FXN-NUT-SPG-GLM06,2000
610378,BSP-3,300
610378,25-0905-00012,20
610379,STFP_F_00545525,200
610379,ES1100,200
610379,ECP100,100
610379,GNA_F_00868663,15
610379,GNA_F_00868664,15
610379,LP-FXN-NUT-HEX-GL06,2000
610379,LP-FXN-WSR-FLT-GL06,2000
610379,ECN100,500
610379,CRH-1652RT,200
610379,710DC,200
610379,LP-FXN-WSR-FLT-GL10,2000
610379,LP-FXN-NUT-HEX-GL10,2000
610379,USCE100,100
610380,01-0103-00216,100
610380,01-0103-00221,100
610381,OC-40 -040-001-0115,2028
610381,ES1075,2000
610381,451DC,1000
610381,709DC,1000
610381,IMH-034STL-FLX-UL,50
610381,PMD-HT-0279,60
610381,STC.52171-3/4,500
610381,OC-40 -040-001-0116,300
610382,60119,1000
610383,50119,10000
610384,451DC,200
610384,OC-40 -040-001-0116,200
610384,STC.52171-3/4,200
610384,ES1075,1000
610384,50119,2000
610385,OC-40 -040-001-0115,5070
610385,IMH-034STL-FLX-UL,50
610385,52-C-1,3000
610385,PMD-HT-0279,700
610385,ITCC-USC-E075,6000
610385,53-4401-00013,5
610385,OC-40 -040-001-0116,7200
610385,709DC,3900
610385,ES1075,10000
610385,451DC,8150
610385,STC.52171-3/4,4000
610385,50119,37000
610385,OC-13 -013-039-0004,700
610385,07-2013-00009,250
610385,13-3311-00005,1550
610385,05.05.23-00.01.40,1000
610385,54-C6,1500
610385,13-3318-00016,550
610385,OC-40 -040-001-0115,5070
610385,IMH-034STL-FLX-UL,50
610385,52-C-1,3000
610385,PMD-HT-0279,700
610385,ITCC-USC-E075,6000
610385,53-4401-00013,5
610385,OC-40 -040-001-0116,7200
610385,709DC,4000
610385,ES1075,10000
610385,451DC,8150
610385,STC.52171-3/4,4000
610385,50119,37000
610385,OC-13 -013-039-0004,700
610385,07-2013-00009,250
610385,13-3311-00005,1550
610385,05.05.23-00.01.40,1000
610385,54-C6,1500
610385,13-3318-00016,550
610386,26.05.33-00.57.02,200
610387,SPLHC63 25M,20
610387,LT206,200
610387,DTC4,504
610388,004E8J-EG115EYL,78370
610388,ZA08WKF01- A1000,22000
610388,ZA08WKF01-X1000,9940
610389,8.0C-H6A-D1-IR,18
610389,CCXFCB-L0047-C002-L7,2000
610389,GNA_F_00304511,203
610389,GNA_F_00607697,240
610389,SPLHC32 25M,4
610389,SPIT-58585-,2000
610389,TOP-DUCT TAPE,48
610390,CE00100,1016
610390,USC100,2000
610390,SPIT-58585-,2000
610390,60090,3000
610391,03-1605-00081,1000
610391,H51-032-01-WH,2
610392,1120343,200
610392,1121342,200
610393,CUSTFLRBX,9
610393,AVATUS-C-36,3
610393,CUSTOM ENCLOSURE,6
610393,H51-035-00,100
610394,040402G5Z20003M,303
610394,CCAAGB-G1002-A015-C0,82
610394,CCAAGB-G1002-A020-C0,97
610394,5307114,2
610394,8108245,2
610394,5503020,2
610394,7990000,2
610394,6450060,1
610394,5302052,2
610394,GENELEC 8050BPM,12
610394,8000-402B,12
610394,9001AP,12
610394,SFP28-25G-LR,40
610395,DCV6,500
610395,DHB6,200
610395,DNC6,200`.split('\n').forEach(line => {
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