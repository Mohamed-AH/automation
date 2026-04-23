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
const csvData = `614538,21-3690-00016,50
614538,21-3690-00017,50
614538,21-3690-00018,50
614538,21-3690-00019,50
614538,53-1103-00026,30
614538,50119,4000
614538,BSC/4,100
614539,OC-39 -039-012-0001,1000
614540,21-3690-00018,100
614540,50119,4000
614541,CCXEDR-D0047-C003-L7,5
614542,03-1605-00062,1000
614542,07-1502-00069,224
614542,CCAAGB-G1002-A020-C0,200
614543,40MM ROOFING BOLT,2000
614544,PMD-HT-0071,200
614544,2CCB,500
614545,PS-1270F1,12
614546,52171.75,2000
614546,PMD-HT-0279,120
614546,451DC,1000
614546,CFSC075,500
614547,13-0390-00008,4
614547,4009-9808,30
614548,23-0305-00006,1014
614549,23-0305-00006,1014
614549,52171.75,1000
614549,13-3390-00029,1000
614549,STC-52C1,1000
614549,58-C1,1000
614549,451DC,2000
614549,461DC,2000
614549,ES1075,2000
614549,PMD-HT-0279,60
614550,50118,1000
614550,52171.75,400
614551,4090-9005,2
614552,4100-6104,1
614553,4090-9001,34
614553,M7C-2000-595-WT,50
614553,13-0390-00008,15
614553,PMD-HT-0279,180
614554,21-2203-00002,150
614555,PMD-HT-0329,240
614555,NYLON-ROPE,100
614555,25-0301-00008,120
614555,13-3509-00013,100
614555,LP-FXN-WSR-FLT-GL06,5000
614555,LP-FXN-BLT-CRG-GL06020,5000
614556,53-4401-00007,3
614556,PMD-HT-0257,150
614556,PMD-HT-0254,100
614556,53-4203-00007,150
614556,53-4201-00078,150
614556,PMD-HT-0258,150
614556,55-0901-00066,250
614556,11-2501-00006,20
614556,11-2536-00002,1
614556,RQC801A45H,1
614556,31-1601-00004,250
614556,13-3508-00007,50
614556,OC-13 -013-028-0009,50
614556,25-0301-00017,50
614556,49-2006-00009,100
614556,OC-29 -029-013-0001,1000
614556,PMD-HT-0329,200
614556,13-3509-00013,100
614557,M7C-2000-595-YL,10
614558,R.25-94TZ,50
614558,OC-39 -039-012-0001,1000
614559,21-3690-00016,50
614559,21-3690-00017,50
614559,21-3690-00018,50
614559,21-3690-00019,50
614559,USCE100,2000
614559,OC-39 -039-012-0001,3000
614559,OC-13 -013-028-0006,3000
614559,53-1103-00026,15
614559,25-0301-00018,60
614559,09.91.00-01.05.00,60
614559,09.91.23-08.01.11,60
614559,OC-04 -004-001-0002,100
614559,OC-13 -013-026-0005,200
614559,PMD-HT-0287,20
614559,PMD-HT-0258,20
614559,53-1103-00026,15
614560,21-3690-00018,50
614560,50119,5000
614560,13-2903-00303,1000
614561,OC-40 -040-003-0162,500
614561,OC-13 -013-026-0005,200
614562,PMD-HT-0071,100
614563,PMD-HT-0329,100
614564,PMD-HT-0329,77
614565,PS-1270F1,30
614566,4099-9005,15
614566,2084-9023,40
614567,CFSC075,1000
614567,451DC,1000
614567,52171.75,1000
614568,23-0305-00006,676
614568,ES1075,2000
614568,451DC,2000
614568,CFSC075,200
614569,52171.75,150
614570,4090-9001,290
614570,4090-9002,205
614570,4906-9154,20
614570,4902-9721,45
614570,4099-9005,15
614570,M7C-375-422,20
614571,GLC-LH-SMD=,120
614573,048ERU-T3122A2G,6000
614574,012ERU-63122A2G,16022
614575,IC32-RDO-M-BK-WR,45
614576,IC32-RDO-M-BK-WR,21
614577,HXDA,5
614578,OC-13 -013-018-0039,50
614578,OC-29 -029-014-0001,50
614579,M7C-375-422,10
614580,4009-9807,1
614581,26.05.83-16.07.01,13
614581,26.05.83-00.04.03,13
614581,26.05.83-00.16.05,13
614582,26.05.83-16.07.01,187
614582,26.05.83-00.04.03,87
614582,26.05.83-00.16.05,87
614582,26.28.16-16.18.47,41
614583,26.05.83-16.07.01,5
614583,26.05.83-00.16.05,9
614584,26.05.33-13.92.86,400
614585,26.05.33-13.13.16,5
614586,TK046PD0088-00,2
614587,7979112,30
614587,7979722,30
614588,7979722,2
614588,376967,400
614588,652DC,450
614588,52171 1,100
614588,SC44_F_00184696,20
614588,TH-0045-C-GTR103000,25
614588,60090,200
614588,LP-FXN-NUT-SPG-GLM06,600
614589,7979112,30
614589,7979722,28
614589,SEL-W480300,61
614590,004E8J-EG114EGR,8059
614590,004E8J-EG115EYL,5150
614590,008Z8J-36125EGR,5177
614590,008Z8J-36125EYL,8034
614591,004E8J-EG114EGR,16223
614591,004E8J-EG115EYL,20310
614592,SPLHC25/25M,5
614593,52171 1,100
614594,50705-A500,500
614595,XDA+,7
614595,WAPL,3
614596,CCH-01U,10
614597,5307114,8
614597,CCH-01U,2
614597,CCH-04U,14
614597,03-8002-00061,10
614598,RG-180F,15
614599,IC16-RDO-M-BK-WR,24
614599,IC8-RDO-M-BK-WR,24
614600,13-3316-00072,200
614600,STFP_F_00545525,200
614600,OC-13 -013-026-0005,100
614601,CCH-01U,6
614602,ICL-F-DUAL-RDO-M-BK-WR,12
614603,037401Q2Z80003M,100
614603,07-2090-00087,79
614604,012ERU-63122A2G,8077
614605,004E8J-EG115EYL,14724
614605,004E8J-EG114EGR,15783
614605,004T8J-EG111EAQ,16155
614605,004T8J-EG113EBL,16136
614605,8762NH,20
614605,21-3690-00015,60
614605,21-3690-00016,60
614605,21-3690-00017,60
614605,21-3690-00018,60
614605,21-3690-00019,60
614605,ES1100,2000
614606,CCHE-CS24-AE-P00RE,94
614607,03-1605-00062,1000
614607,PMD-HT-0071,100
614608,ES1075,2000
614609,PMD-HT-0329,100
614609,13-3509-00013,50
614610,GNA_F_00868657,72
614610,LP-FXN-BLT-CRG-GL06020,10000
614610,LP-FXN-WSR-FLT-GL10,7400
614610,NYLON-ROPE,100
614610,LP-FXN-WSR-FLT-GL06,5000
614610,LP-FXN-BLT-RFG-GL0620NW,5000
614610,OC-13 -013-001-0003,50
614610,PMD-HT-0201,50
614610,25-0301-00008,50
614610,PMD-HT-0329,100
614610,OC-13 -013-026-0004,100
614610,LP-FXN-NUT-SPG-GLM06,2000
614610,LP-FXN-NUT-HEX-GL06,10000
614611,037401Q2Z80006M,40
614611,048302G5ZZZ006M-GR,20
614611,048302G5Z20006M,20
614612,21-3690-00016,50
614612,21-3690-00017,50
614612,21-3690-00018,50
614612,OC-13 -013-026-0005,30
614612,50119,1000
614612,LP-FXN-BLT-HEX-GL06020,1000
614612,21-2203-00002,100
614613,7979815,12
614614,CCH-01U,9
614615,95-200-99,210
614615,95-050-99-X,140
614615,SPH-01P,20
614615,CCHEP-1111BB,20
614615,E-CASE-F2525/12,20
614616,CCXEDR-D0047-C003-L7,7
614616,BSP-3,100
614616,53-2790-00015,100
614616,53-2790-00016,100
614616,26.05.33-16.51.01,500
614616,52-C-1,500
614616,13-3103-00031,50
614616,13-3103-00018,100
614617,CFSC075,100
614617,DFA 3,200
614617,ZRC0625,1000
614617,52171.75,100
614618,461DC,250
614618,451DC,1000
614618,PMD-HT-0279,72
614618,ES1075,300
614618,ZRC0625,1000
614618,21-2401-00002,500
614618,CFSC075,1000
614618,STC-52C1,150
614618,13-3390-00029,150
614618,52171.75,400
614619,23-0305-00006,338
614619,IRRT103000,25
614620,13-0390-00008,2
614620,M7-R6000,15
614620,M7C-375-422,30
614620,A2404B,10
614621,4090-9002,200
614621,03-7090-00405,10
614621,4081-9308,11
614621,4098-9755,50
614621,4098-9858,25
614622,PS121000-U,9
614622,PS-1270F1,56
614623,012ERU-63122A2G,4008
614624,V12RDDX4,2
614624,VI-PNLB-12R-X4,3
614628,13-3390-00025,45
614628,13-3390-00017,30
614628,13-3316-00046,56
614628,05762,69
614628,OC-13 -013-007-0020,50
614628,OC-13 -013-007-0059,1
614625,13-3390-00025,3
614625,TO-48300,30
614625,OC-13 -013-005-0061,100
614625,LP-FXN-NUT-SPG-GLM06,100
614625,03-9301-00105,7
614625,201,50
614625,07-1005-00002,576
614625,03-1601-00001,14
614625,03-1604-00001,6
614625,PMD-HT-0087,5
614625,21-2401-00022,100
614625,03-1605-00001,8
614625,CIR-41,1
614625,SCR-41,1
614625,ZINC SPRAY,1
614626,03-1605-00001,2
614626,PMD-HT-0087,8
614626,21-2401-00022,200
614626,TO-48300,6
614627,TO-48300,29
614627,GNA_F_00868657,1
614627,PMD-HT-0087,4
614627,09-2223-00004,4
614627,E00075,7
614627,07-1005-00002,336
614627,03-1605-00001,4
614627,LP-FXN-ANC-THB-HD10100,100
614629,13-3509-00054,2
614629,TO-48300,6
614629,07-1005-00002,288
614629,53-0513-00001,2
614629,11-2501-00006,1
614629,OC-40 -040-001-0003,1
614630,49-1702-00154,55
614630,03-4790-00085,35
614630,PMD-HT-0265,120
614630,E00075,3
614630,13-3390-00017,2
614630,TP426,4
614630,03-9301-00105,3
614630,PMD-HT-0087,2
614630,09-2290-00052,2
614630,OC-13 -013-005-0061,100
614630,LP-FXN-ANC-THB-HD10100,100
614630,03-9301-00105,5
614630,13-3390-00025,5
614631,GNA_F_00868665,1
614631,SC42_F_00298609,1
614631,03-4790-00085,68
614632,25-4101-00002,129
614632,25-4101-00003,102
614632,TP426,4
614632,13-3390-00017,9
614633,07-1005-00002,96
614633,03-1605-00001,4
614633,TO-48300,15
614634,49-1702-00005,3
614634,ZINC SPRAY,1
614635,DP-RP-06-UKS,1
614636,GNA_F_00868657,4
614636,GNA_F_00868674,1
614636,GNA_F_00797445,1
614636,STFP_F_00545525,4
614636,GNA_F_00665557,2
614636,GNA_F_00797457,2
614636,SC42_F_00298609,2
614636,STCB_F_00388067,4
614636,LP-FXN-NUT-SPG-GLM06,30
614636,LP-FXN-ANC-THB-HD10100,100
614638,03-1504-00027,54
614637,108622887,12
614637,FFXLCLC42-MXF006,13
614637,80108038,13
614637,80108034,13
614637,03-1504-00027,6
614637,03-1307-00007,1
614637,21-2290-00021,1180
614637,Enb/3,500
614572,C-RS2075,5000`.split('\n').forEach(line => {
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