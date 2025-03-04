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
const csvData = `611337,03-1905-00005,20
611337,OC-13 -013-007-0171,300
611337,OC-13 -013-007-0033,8
611337,26.00.00-00.00.12,1
611338,03-9301-00032,122
611338,SIGA-IB,18
611338,03-1905-00003,4
611338,03-1905-00004,4
611338,03-1905-00005,50
611338,OC-13 -013-007-0033,6
611338,OC-13 -013-007-0171,300
611339,03-2090-00025,1
611339,03-1701-00043,1
611339,03-1701-00044,1
611339,03-1701-00049,3
611339,03-1701-00059,1
611339,03-1790-00199,1
611339,03-1790-00200,1
611339,03-1805-00006,1
611340,03-2090-00025,1
611340,03-1701-00043,1
611340,03-1701-00044,1
611340,03-1701-00047,1
611340,03-1701-00048,1
611340,03-1790-00199,1
611340,03-1790-00200,1
611340,03-1805-00006,1
611341,03-1301-00026,2
611341,03-1504-00004,2
611341,03-1302-00006,2
611341,21-5101-00001,2
611341,21-5190-00002,2
611341,03-1504-00002,2
611341,03-9301-00105,2
611342,03-9301-00027,23
611342,03-9301-00032,213
611342,SIGA-IB,1
611342,SIGA-IM,23
611342,SIGA-278,23
611342,49-3706-00008,3
611342,OC-13 -013-007-0171,1000
611342,OC-13 -013-007-0033,16
611343,03-1905-00005,5
611343,03-1905-00004,5
611343,21-5101-00001,5
611343,21-5190-00002,5
611343,03-1504-00002,5
611343,SIGA-LED,35
611343,03-9301-00027,6
611343,03-1301-00026,5
611343,49-3706-00008,5
611343,03-1302-00006,5
611343,03-1504-00004,5
611343,03-0101-00023,31
611343,03-4790-00208,9
611343,03-1605-00024,33
611344,03-1905-00004,4
611344,03-1905-00005,10
611344,03-0101-00024,2
611344,03-0104-00012,2
611344,03-0104-00081,2
611344,03-0104-00077,44
611344,OC-13 -013-007-0033,3
611344,OC-13 -013-007-0171,200
611345,03-9301-00032,248
611345,03-9301-00027,36
611345,49-3706-00008,24
611345,SIGA-IM,20
611345,SIGA-278,20
611345,SIGA-LED,61
611345,SIGA-IB,42
611345,OC-13 -013-007-0033,8
611345,OC-13 -013-007-0171,300
611346,PN10,1500
611376,07-1005-00002,12
611376,03-0101-00023,5
611376,OC-13 -013-007-0033,6
611376,OC-13 -013-007-0171,100
611376,53-5701-00026,100
611376,53-5701-00027,200
611376,53-5701-00028,200
611376,03-1605-00024,5
611377,03-1905-00005,10
611377,OC-13 -013-007-0033,3
611377,OC-13 -013-007-0171,200
611378,03-1905-00005,1
611378,03-0101-00024,1
611378,03-0104-00012,1
611378,03-0104-00081,1
611378,03-8302-00504,1
611378,03-1801-00045,1
611378,03-1801-00043,1
611378,03-1701-00050,1
611378,03-9301-00032,100
611378,SIGA-IB,20
611378,07-1005-00002,432
611378,03-1601-00001,7
611379,MT-777,2
611380,MT-777,2
611381,MT-777,2
611382,MT-777,2
611349,26.05.19-85.46.02,7
611349,26.05.19-85.46.01,7
611349,26.05.19-85.46.03,7
611349,26.05.19-85.46.04,21
611349,26.05.19-85.46.05,21
611350,05.05.23-07.20.03,1500
611351,SS-MANHOLE,2
611352,SPLHC32 25M,20
611352,LP-FXN-NUT-SPG-GLM06,1200
611352,TOP-DUCT TAPE,48
611352,CCXSCB-LB047-C003-L7,1000
611352,H1033DC,2000
611352,SPLHC25/25M,4
611352,CE00100,762
611352,TH-0045-C-GTR103000,250
611353,GNA_F_00304425,80
611353,STFP_F_00331703,400
611354,047202G5ZZZ020M-GR,5
611354,047202G5Z20020M,5
611355,SPLHC32 25M,16
611355,LMM-31,500
611355,662DC,1500
611355,52171 1,1500
611355,LP-FXN-WSR-FLT-GL10,4400
611355,TOP-DUCT TAPE,240
611355,CE00100,762
611355,TH-0045-C-GTR103000,600
611355,LP-FXN-NUT-HEX-GL10,2000
611355,USC100,1200
611355,STFP_F_00682733,400
611356,H51-032-01-BLK,53
611356,CCXSCB-LB047-C003-L7,1000
611357,UU009631142,3784
611357,FG-EC15,12
611357,FG-NET F,4
611357,FG-CLC,4
611357,FG-TMC,4
611357,CF-EC100,4
611357,ES-EC,4
611357,TTK BUS 100,4
611357,FG-NC KIT,4
611358,SPLHC32 25M,16
611358,60090,3000
611358,652DC,600
611358,TOP-DUCT TAPE,48
611358,LMM-31,200
611358,AMG250-2GBT-2S- P180,100
611358,21-8602-00004,10
611358,13-3507-00037,2000
611358,25-0904-00001,48
611358,376967,2000
611358,C-E00200,61
611358,655DC,60
611358,H1036DC,200
611358,205,100
611358,ELB20090,40
611358,GNA_F_00247510,20
611358,GNA_F_00305093,41
611358,SVTRST_F_00427934,10
611358,GNA_F_00495105,50
611358,665DC,60
611359,LP-FXN-NUT-HEX-GL10,4000
611359,LP-FXN-WSR-FLT-GL10,2900
611359,TOP-DUCT TAPE,120
611359,PMD-HT-0087,16
611359,41.36.26-00.02.54,800
611360,M7C-500-595-WT,5
611360,M7-R6000,5
611361,52C 6,800
611361,52C6,4200
611361,UBA4-MH,200
611361,DCV2,1000
611361,DNC2,1500
611361,PVC-GLUE-AMAN,96
611361,YJ74926,8000
611361,NL8FC,500
611361,376967,2000
611361,008Z8J-36125EGR,7357
611362,USC100,800
611362,LMM-31,1000
611362,IDEAL-YELLOW77,3
611362,LP-FXN-BLT-CRG-GL06020,3000
611362,SPLHC32 25M,8
611362,SPLHC63 15M,4
611362,DM5SE-RAL7023,100
611363,8.0C-H5A-PTZ-DP36,31
611363,IRPTZ-MNT-WALL1,17
611363,WLMT-1021,42
611363,AMG260-2GBT-2S-P180,98
611364,GNA_F_00367205,20
611364,C-R00200,10
611347,4100-9765-3,1
611347,4100-9765-4,1
611347,4100-8765-11,1
611347,4190-9027,1
611347,4190-8401-1,1
611347,4190-8401-2,1
611347,4190-8401-15,1
611347,4190-8401-16,1
611365,12.41.13-09.01.00,10
611366,IFBLWD8H41H,380
611366,MT-AB-L 45#2272113,100
611367,ECP100,200
611367,USCE100,1639
611367,2142981,4000
611367,2184522,4000
611367,GNA_F_00868670,4
611367,GNA_F_00868671,10
611367,GNA_F_00868672,10
611368,21-3606-00001,300
611368,PMD-HT-0329,6
611369,THR 10-3,200
611369,CHANNEL2X4,40
611369,STC.52171-3/4,300
611369,PMD-HT-0071,400
611369,13-3509-00013,100
611369,BSP-3,100
611369,LP-FXN-WSR-FLT-GL06,5000
611369,LP-FXN-NUT-HEX-GL06,5000
611369,GNA_F_00439285,25
611369,GNA_F_00868936,10
611369,GNA_F_00868938,10
611370,GNA_F_00868935,18
611370,GNA_F_00868936,36
611370,STCB_F_00397445,60
611370,26.05.33-00.34.22,20
611371,THR 10-3,400
611371,LP-FXN-NUT-SPG-GLM06,1500
611371,LP-FXN-WSR-FLT-GL06,5000
611371,LP-FXN-NUT-HEX-GL06,5000
611371,GI Hex Bolt,2000
611371,L-Shape 50x50mm,900
611371,Earth Strap 200mm,300
611372,CHANNEL4X4,320
611373,05.45.16-07.01.00,380
611374,05.05.23-00.01.40,650
611375,49-2006-00004,40
611348,LINDNER-3D-PANEL,320`.split('\n').forEach(line => {
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