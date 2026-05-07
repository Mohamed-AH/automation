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
const csvData = `615197,004E8J-EG115EYL,4985
615197,004T8J-EG111EAQ,8058
615197,BELDEN 4000UE,40
615200,SPH-01P,66
615200,CCHEP-1111BB,66
615200,03-1605-00038,560
615200,95-050-99-X,280
615201,CCH-04U,10
615201,CCHE-CP24-04,68
615201,03-1605-00038,1632
615201,CCHE-CP24-E4,34
615201,95-050-99-X,816
615199,GNA_F_00868666,10
615199,GNA_F_00868940,10
615199,OC-13 -013-026-0005,500
615199,OC-40 -040-005-0001,100
615206,CCAAGB-G1002-A040-C0,5
615206,CCAAGB-G1002-A050-C0,5
615204,CCXEDR-D0047-C003-L7,12
615205,E0075,338
615205,GNA_F_00868663,30
615203,CCXEDR-D0047-C003-L7,10
615202,CCXEDR-D0047-C003-L7,10
615207,SSABS/2,7
615207,23-0105-00028,500
615207,OC-40 -040-001-0115,507
615208,OC-40 -040-001-0115,338
615208,23-0105-00028,300
615209,BE-8723NH-1050,2100
615210,4000UE,34
615210,8762NH,24
615214,USC075,2000
615214,LP-FXN-BLT-CRG-GL06020,10000
615211,IFBLWD8H41H,200
615212,IFBLWD8H41H,200
615213,IFBLWD8H41H,250
615215,OC-13 -013-026-0004,100
615196,09-2205-00001,1
615198,CCH-04U,2
615198,CCHE-CP24-04,8
615198,03-1605-00038,250
615198,CCHE-CP24-E4,8
615198,95-050-99-X,250
615191,RQC801A45H,6
615192,01-0103-00221,20
615192,DPS-M-BK,20
615193,4098-9714,50
615193,4098-9733,30
615193,4090-9001,80
615193,4090-9116,30
615194,4009-9301,5
615195,4090-9002,80
615178,01-0101-00082,1
615179,VS-S2T-10G,2
615180,TSZ1058072,45
615181,01-0103-00149,1
615181,01-0103-00213,2
615181,01-0103-00129,1
615181,01-0103-00214,1
615181,01-0103-00215,1
615182,LC1-UM24E8,2
615182,MXW2X/BETA58=-Z11,1
615182,MXWAPXD2UK=-Z11,1
615182,SLP14/T-WH,27
615182,CONTROL 24CT MICRO,67
615182,C9410R,4
615182,C9400-PWR-3200AC,8
615182,C9400X-SUP-2XL,4
615182,C9400-LC-48S,30
615182,C9400-LC-48T,2
615183,571302,5
615183,572284,5
615188,4090-9116,200
615188,4090-9001,300
615188,4098-9714,500
615188,4098-9764,200
615187,4098-9764,50
615186,4009-9301,6
615186,4098-9714,70
615186,4098-9764,30
615186,4098-9733,20
615186,4090-9001,50
615186,4009-9808,50
615186,4906-9127,50
615185,4098-9714,23
615185,4090-9116,12
615185,4090-9001,82
615185,4906-9154,52
615185,4902-9721,24
615185,4098-9764,55
615184,4098-9764,700
615184,4009-9301,4
615190,23-0305-00006,1521
615189,4902-9721,100
615172,50119,1000
615172,OC-13 -013-026-0005,300
615172,52-C-1,500
615172,OC-13 -013-028-0006,5000
615174,7979814,20
615174,03-1605-00062,1000
615174,13-3301-00011,100
615174,CCAAGB-G1002-A020-C0,500
615173,6501665,1
615177,13-0390-00008,2
615177,13-0390-00007,8
615175,VEP-A00-1P,2
615175,VEP-A00-P,2
615175,VPS-100US-220,4
615175,VP-CLIP,149
615175,VP-COUP,34
615175,VP-EC,1
615175,VP-ELB-90,23
615175,VP-P-200,4
615175,VP-TEE,2
615176,23-0305-00006,676
615176,STC-52C1,3000
615176,58-C1,2000
615176,461DC,3000
615176,451DC,3000
615216,TO-48300,10
615216,PMD-HT-0087,4
615217,49-2006-00004,1
615218,GNA_F_00868665,6
615218,SC42_F_00298609,4
615218,LP-FXN-NUT-SPG-GLM06,50
615218,FX-0145-C-OMDIA08,100
615218,21-5190-00002,7
615218,21-5101-00001,7
615218,03-1504-00002,7
615218,PMD-HT-0087,10
615218,21-3601-00001,10
615218,21-3605-00003,3
615219,21-3601-00001,5
615219,OC-13 -013-007-0171,200
615219,PMD-HT-0087,8
615219,FX-0145-C-OMDIA08,100
615219,TO-48300,10
615219,GNA_F_00868665,2
615219,SC44_F_00396371,1
615219,LP-FXN-NUT-SPG-GLM06,20
615219,LP-FXN-ANC-THB-HD10100,20
615219,GNA_F_00868657,1
615219,LP-FXN-WSR-FLT-HD10,25
615219,HHS/M10X25+HXN/M10+FLW/M1,25
615220,TO-48300,3
615220,PMD-HT-0087,4
615221,49-2006-00004,1
615222,TO-48300,5
615222,ZINC SPRAY,1
615223,TO-48300,10
615223,03-5290-00077,1
615223,21-3601-00001,5
615223,PMD-HT-0087,4
615223,49-2006-00004,4
615223,09-2223-00004,1
615223,OC-13 -013-007-0171,100
615223,21-3102-00055,100
615224,C-R00075,35
615224,R-CCN075,35
615224,TH-0047-C-GTR103000,2
615224,PMD-HT-0087,7
615224,SC44_F_00396371,5
615224,TH-2242-C-HHN10,50
615224,LP-FXN-WSR-FLT-HD10,50
615224,GNA_F_00797453,1
615224,21-3601-00001,8
615224,09-2290-00052,3
615224,07-1001-00051,1
615224,RFO100/150,8
615224,RFORO100/150,8
615224,LP-FXN-NUT-SPG-GLM06,150
615224,FX-0150-C-OMDIA10,150
615224,LP-FXN-ANC-THB-HD10100,100
615225,LP-FXN-BLT-HEX-GL08025,50
615225,LP-FXN-NUT-SPG-GLM06,50
615225,LP-FXN-BLT-HEX-GL08100,50
615225,PMD-HT-0124,1
615226,09-2223-00013,4
615226,21-3601-00001,12
615226,PMD-HT-0087,3
615226,21-3605-00003,3
615226,SIGA-CR,4
615226,OC-13 -013-007-0171,100
615226,OC-13 -013-007-0020,100
615227,49-1702-00005,5
615227,PMD-HT-0087,4
615227,21-3601-00001,6
615227,21-3605-00003,1
615227,TP426,4
615227,OC-13 -013-007-0171,100
615227,21-3102-00055,100
615227,E0075,6
615227,201,20
615228,09-2223-00013,4
615228,TO-48300,7
615228,09-2223-00004,1
615228,21-3601-00001,5
615228,LP-FXN-BLT-HEX-GL08025,200
615228,OC-13 -013-007-0059,2
615228,FX-0145-C-OMDIA08,200
615228,03-1605-00001,4
615228,03-0104-00038,2
615228,03-0104-00040,2
615228,03-0104-00079,2
615228,21-2401-00022,100
615228,LP-FXN-NUT-SPG-GLM06,100
615228,LP-FXN-BLT-HEX-GL08025,100
615229,23-0203-00012,800
615229,OC-13 -013-039-0001,300
615229,59361,10
615229,13-3390-00022,10
615230,09-2223-00004,1
615230,13-0590-00117,2
615230,13-0590-00118,2
615230,PMD-HT-0087,2
615231,53-3703-00008,1
615231,21-2401-00022,200
615231,TO-48300,2
615231,21-3601-00001,2
615232,PMD-HT-0265,500
615232,21-3102-00055,500`.split('\n').forEach(line => {
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