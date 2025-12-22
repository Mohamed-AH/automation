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
const csvData = `614272,IC16-RDO-M-BK-WR,5
614273,OC-39 -039-012-0001,500
614273,OC-13 -013-028-0006,500
614274,040402G5Z20010M,20
614275,OC-13 -013-026-0005,30
614275,21-3690-00015,20
614275,OC-40 -040-001-0002,1
614275,PMD-HT-0109,1
614276,57-0404-00083,97
614276,OC-40 -040-003-0231,300
614276,PMD-HT-0080,300
614276,PMD-HT-0287,500
614276,PMD-HT-0258,500
614276,99-0102-00005,20
614276,99-0102-00007,20
614276,OC-13 -013-028-0006,5000
614276,OC-13 -013-028-0005,5000
614276,OC-39 -039-012-0001,5000
614276,PMD-HT-0139,5000
614277,26.05.33-02.35.02,70
614278,M7C-2000-595-YL,5
614278,BSC/4,500
614278,STFP_F_00545525,200
614279,GNA_F_00868657,96
614279,STFP_F_00545525,350
614279,GNA_F_00868665,57
614280,53-2290-00002,1
614281,ES1075,300
614281,ECP075,1000
614282,CCH-01U,3
614282,CCH-CS,6
614282,CCHE-CP24-04,6
614282,03-1601-00005,6
614282,03-1604-00002,6
614282,7979801,3
614283,CCXEDR-D0047-C003-L7,6
614284,03-1605-00062,250
614285,CCXEDR-D0047-C003-L7,10
614286,THR 10-3,100
614286,52-C-1,1500
614287,ES1075,2000
614288,451DC,167
614289,01-0103-00221,42
614290,040402G5Z20015M,100
614291,SFP-3,8
614291,C3/INT,2
614291,CNFE2MC,4
614291,PS-MORD4860,4
614291,CNFESFPMCPOE30/M,4
614291,BFLT2_F1-M0-D1,4
614291,MFL_RRRR-DC,2
614291,MAT288_X1-DC,1
614291,CAL-EU,3
614292,D5-RAL 9002,148
614293,26.05.33-02.40.01,100
614293,ES1075,1000
614294,50118,1000
614294,ES1075,1000
614294,461DC,200
614295,13-0390-00007,2
614295,13-0390-00008,2
614295,PMD-HT-0279,12
614296,4009-9807,4
614297,13-0390-00007,6
614297,13-0390-00016,4
614297,4090-9001,100
614297,4090-9002,50
614297,21-2401-00002,2000
614298,13-0390-00016,10
614299,DB-VWC2-M4-FR4K,1
614299,DB-VWC2-M4-IC-HDMI4,2
614299,DB-VWC2-M4-OC-HDMI4,3
614299,DB-ACM-PSU-460W,1
614299,INR60W60D12-BK-WI,1
614299,LVS1U,10
614299,55BDL8007X/00,10
614300,4100-9766-5,1
614300,4100-9765-6,1
614300,4100-9765-12,1
614301,4100-6104,7
614302,IFWMDBP4,10
614302,IFAASMSCS-10,20
614302,IFAPTSMSC1-10,20
614303,55BDL8007X/00,10
614304,DB-VWC2-M4-FR4K,1
614304,DB-VWC2-M4-IC-HDMI4,2
614304,DB-VWC2-M4-OC-HDMI4,3
614304,DB-ACM-PSU-460W,1
614304,INR60W60D12-BK-WI,1
614304,LVS1U,10
614305,M7C-2000-595-WT,5
614305,M7-R6000,5
614305,4098-9793,10
614305,4090-9001,40
614305,4090-9002,70
614305,4098-9755,60
614305,4902-9721,8
614306,BFA/4,200
614306,OC-13 -013-039-0004,200
614306,DFA 3,200
614306,26.05.33-02.40.01,195
614306,ES1075,2000
614306,USC100,1000
614307,BTO107_FCT2250_EMEA,1
614308,004E8J-EG115EYL,4059
614308,004E8J-EG114EGR,12124
614308,004T8J-EG113EBL,4034
614308,004T8J-EG111EAQ,12063
614309,004E8J-EG115EYL,12144
614309,004E8J-EG114EGR,12091
614309,004T8J-EG113EBL,8050
614310,IC8-RDO-M-BK-WR,20
614310,IC16-RDO-M-BK-WR,25
614310,RG-180F,50
614310,D5-RAL 9016,50
614311,BSC/4,1500
614311,53-1103-00026,3
614311,DFA4,310
614311,BFA/4,1000
614311,ECP100,3000
614311,21-3690-00018,100
614311,PMD-HT-0258,50
614312,M7-R4300,100
614312,BM-33-427,50
614313,E0100,127
614313,THR 10-3,50
614313,CRH-662RT,50
614313,21-3690-00017,20
614313,PMD-HT-0287,10
614313,OC-40 -040-001-0139,25
614313,OC-13 -013-020-0004,50
614313,13-3316-00072,50
614314,037401Q2Z80006M,269
614314,040402G5ZZz2003M-GR,20
614315,13-0401-00134,30
614315,8762NH,30
614315,LS0HLT075,50
614315,OC-04 -004-001-0002,150
614316,RG-180F,15
614316,LS0HLT075,30
614316,FLCNU100-LS,30
614317,BSP-4,300
614317,OC-13 -013-020-0004,500
614317,PRIME-100,20
614317,OC-04 -004-001-0002,150
614317,OC-13 -013-026-0001,50
614318,IC8-RDO-M-BK-WR,25
614319,OC-13 -013-026-0001,48
614319,09.91.23-08.01.11,36
614319,25-0301-00018,36
614319,09.91.00-01.05.00,24
614320,09.91.00-01.10.00,24
614320,ELECTRICAL BLUE PLUG,50
614321,ECP075,2000
614321,50119,6000
614321,05.05.23-10.48.01,10000
614321,ES1075,2000
614321,BSC/3,500
614321,31-1705-00006,5
614321,23-0203-00006,150
614322,5503020,23
614322,3110000,23
614322,7990000,46
614322,4612000,23
614322,5302052,46
614322,5302120,46
614322,7113000,23
614322,5301337,27
614322,8108245,23
614323,EFA/2,50
614323,ES1075,50
614323,PMD-HT-0071,50
614323,52-C-1,500
614323,26.05.33-16.51.01,200
614324,BSP-3,50
614324,ES1075,400
614324,CAXCSN-00000-C011,1
614324,25-0905-00012,100
614324,CHANNEL2X4,20
614324,PMD-HT-0071,50
614324,07-1502-00069,100
614324,03-1605-00062,100
614325,DFA 3,50
614326,DFA 3,50
614327,PMD-HT-0329,48
614327,OC-29 -029-014-0001,60
614328,PMD-HT-0329,200
614329,SIGA-OSHD,33
614329,SIGA-OSD,15
614330,13-0390-00016,10
614330,4098-9793,150
614330,4099-9005,35
614330,4098-9755,75
614330,4090-9001,420
614330,4090-9002,375`.split('\n').forEach(line => {
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