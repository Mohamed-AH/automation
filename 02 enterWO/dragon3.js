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
const csvData = `615001,5307114,13.0
615001,8108245,13.0
615001,5301235,13.0
615001,5503020,13.0
615001,7990000,26.0
615001,3110000,13.0
615001,6450060,13.0
615001,5302052,26.0
615001,5302120,26.0
615001,5301337,13.0
615001,7113000,13.0
615001,7829150,13.0
615001,7979116,26.0
615001,5301326,13.0
615001,5501655,5.0
615001,5501460,13.0
615000,004EEU-13122A2G,76188.0
615000,CCXEDB-D0047-C001-L7,54.0
615000,12600130,4.0
615000,12630130,4.0
615000,12660130,4.0
614975,5307114,2.0
614976,BELDEN 4000UE,5.0
614976,07-2090-00089,100.0
614977,004E8J-EG114EGR,16017.0
614977,004T8J-EG113EBL,16174.0
614978,030402R5Z20003M,100.0
614978,040402G5ZZZ003M-GR,100.0
614978,030301Q2Z80003M,100.0
614978,037401Q2Z80006M,100.0
614979,IC32-RDO-M-BK-WR,9.0
614980,IC8-RO-II-M-WR,8.0
614981,DA-500FH,11.0
614981,7979815,2.0
614982,OC-40 -040-001-0002,33.0
614982,53-4401-00013,36.0
614982,PMD-HT-0019,5.0
614982,99-0102-00007,20.0
614982,21-3690-00015,180.0
614982,21-3690-00016,200.0
614982,21-3690-00017,200.0
614982,21-3690-00018,200.0
614982,21-3690-00019,200.0
614982,RQC801A45H,15.0
614983,C9400R,2.0
614983,C9400-PWR-2100AC,4.0
614983,C9400X-SUP-2XL,2.0
614983,C9400-LC-48S,2.0
614983,C9400-LC-48T,2.0
614984,C9300-48U-A,107.0
614984,CAB-SPWR-30CM,107.0
614984,C9K-ACC-SCR-4,107.0
614984,CAB-GUIDE-1RU,107.0
614984,C9300-NM-8X,107.0
614984,PWR-C1-1100WAC-P,107.0
614984,PWR-C1-1100WAC-P/2,107.0
614984,CAB-C15-CBN,214.0
614984,STACK-T1-50CM,107.0
614984,C9K-ACC-RBFT,107.0
614984,IE-9320-16P8U4X-E,201.0
614984,PWR-RGD-AC-DC-400,402.0
614984,C9600-LC-48YL=,24.0
614984,SFP-10G-LR-S=,1198.0
614985,STCB_F_00386777,100.0
614985,OC-13 -013-026-0005,300.0
614987,DFA 3,500.0
614988,4081-9308,4.0
614989,IFWMDBP4,6.0
614986,A2508A,5.0
614990,4902-9721,50.0
614990,M7C-375-422,60.0
614990,M7-R6000,50.0
614990,13-0390-00008,16.0
614991,23-0305-00006,1521.0
614991,ES1075,2000.0
614991,STC-52C1,3000.0
614991,461DC,1000.0
614991,451DC,1000.0
614991,CFSC075,2000.0
614991,PMD-HT-0279,180.0
614993,55BDL8007X/00,7.0
614993,LVS1U,7.0
614993,DB-VWC2-M4-FR4K,1.0
614993,DB-VWC2-M4-IC-HDMI4,2.0
614993,DB-VWC2-M4-OC-HDMI4,3.0
614993,DB-ACM-PSU-460W,1.0
614993,INR60W60D12-BK-WI,1.0
614994,GNA_F_00868658,35.0
614994,GNA_F_00868660,50.0
614994,OC-13 -013-026-0004,100.0
614995,LP-FXN-BLT-RFG-GL06-20NW,4000.0
614996,GNA_F_00868660,20.0
614996,OC-13 -013-026-0004,100.0
614996,STFP_F_00545525,100.0
614992,EDGE-01U-SP,6.0
614992,ECM-UM12-04-89G,20.0
614992,EDGE-04U,6.0
614992,ECM-UM12-05-93Q,156.0
614992,UU009535251E,34.0
614998,C9400-PWR-BLANK,252.0
614998,C9400-S-BLANK,64.0
614998,C9400-QSFP-CVR,168.0
614998,C9400-PWR-3200AC,84.0
614998,CAB-C19-CBN,84.0
614998,CAB-CON-C9K-RJ45,42.0
614998,CAB-GUIDE-7R,32.0
614998,C9K-ACC-ADP-DB9,42.0
614998,C9K-ACC-SCR-12,42.0
614998,C9400-LC-48S,134.0
614998,C9400X-SUP-2XL-B,42.0
614998,C9400X-SUP-2XL,42.0
614998,C9400-SSD-NONE,42.0
614998,C9400-LC-48H-B,42.0
614998,C9400-LC-48H,42.0
614998,C9407R-96U-BUNDLE-E,6.0
614998,C9407R-96U-BNDL-E,26.0
614998,C9410R-96U-BNDL-E,10.0
614998,CAB-GUIDE-10R,10.0
614998,C9400-LC-48S=,1.0
614998,C9400-S-BLANK=,41.0
614998,GLC-LH-SMD=,4387.0
614997,PRO T.QCT1250.I5,6.0
614997,FQC-10528,6.0
614956,26.06.33-00.01.19,2.0
614923,26.05.33-13.06.01,40.0
614999,A10050442,66.0
614957,07-1290-00021,50.0
614933,DPS-M-BK,15.0
614932,13-0401-00069,30.0
614934,OC-13 -013-007-0067,500.0
614941,CCXEDR-D0047-C003-L7,15.0
614952,SMC-9-SCLC-M,10.0
614952,MMC-50-SCLC-M,1.0
614952,NFC-KIT-CASE,5.0
614958,SPH-01P,3.0
614958,CCHEP-1111BB,3.0
614950,037401Q2Z80006M,300.0
614950,030301Q2Z80003M,300.0
614951,040402G5Z20010M,9.0
614951,040402G5ZZZ010M-GR,41.0
614953,7979815,24.0
614954,7979815,26.0
614955,AX 2262165,1.0
614938,03-7090-00396,1.0
614938,03-7090-00397,1.0
614938,03-7090-00398,1.0
614938,03-7090-00399,1.0
614938,03-7090-00400,1.0
614935,FI55329024,1.0
614935,94.74,1.0
614936,13-0390-00007,20.0
614936,13-0390-00008,12.0
614937,13-0390-00007,20.0
614937,13-0390-00008,12.0
614939,03-7090-00396,1.0
614939,03-7090-00397,1.0
614939,03-7090-00398,1.0
614939,03-7090-00399,1.0
614939,03-7090-00400,1.0
614959,FI55329024,10.0
614959,94.74,10.0
614922,5307114,9.0
614922,8108245,9.0
614922,5503020,15.0
614922,3110000,15.0
614922,7990000,15.0
614922,5302052,18.0
614922,7979815,18.0
614922,7113000,15.0
614922,4612000,15.0
614922,7151305,3.0
614922,5301337,13.0
614924,03-7090-00396,6.0
614924,03-7090-00397,6.0
614924,03-7090-00398,6.0
614924,03-7090-00399,6.0
614924,03-7090-00400,6.0
614925,YR64,10.0
614925,YP14,80.0
614925,BP10,150.0
614926,26.05.33-13.92.86,400.0
614926,26.05.33-34.36.01,50.0
614926,23.34.00-43.02.01,4.0
614927,23.34.00-43.02.01,2.0
614927,23.34.00-43.01.01,2.0
614928,662DC,150.0
614928,202,300.0
614928,MAXCSV-02408-C001,15.0
614928,WAXWSW-00008-C007,50.0
614928,XF500003553,350.0
614928,52C6,200.0
614928,SEL-W480300,39.0
614928,SEL-W360200,10.0
614928,LP-FXN-NUT-SPG-GLM06,600.0
614928,60090,3000.0
614929,000201G4Z31001.5M,250.0
614929,SMC-9-SCLC-M,2.0
614929,QUICKCLEAN-2.5-5P,3.0
614929,NFC-IBC-1.25MM,30.0
614930,STE-R-3/100,1.0
614931,M7-19-427,5.0
614942,05.05.23-27.03.01,790.0
614942,05.05.23-27.07.17,1000.0
614942,05.05.23-27.16.44,500.0
614942,05.05.23-11.32.03,4300.0
614942,05.05.23-10.85.04,3500.0
614943,26.28.16-16.18.47,450.0
614943,26.05.83-16.07.01,2700.0
614943,26.05.83-00.04.03,9900.0
614943,26.05.83-00.16.05,400.0
614943,26.05.19-85.53.01,1.0
614943,26.05.19-85.53.02,1.0
614944,26.05.19-87.15.03,1.0
614944,26.05.19-87.15.04,1.0
614944,26.05.19-78.06.01,1.0
614944,26.05.19-87.15.01,1.0
614944,26.05.19-87.15.02,1.0
614945,26.05.19-85.42.04,12.0
614945,26 05.19-85.42.03,4.0
614945,26.05.19-85.42.01,4.0
614945,26.05.19-85.42.02,4.0
614945,26.05.19-85.42.05,12.0
614946,26.05.83-00.16.05,266.0
614946,26.05.83-00.16.06,500.0
614946,26.05.83-00.16.07,80.0
614947,26.05.19-85.46.25,600.0
614948,004E8J-EG114EGR,4105.0
614949,2IHD5-3,62.0
614949,C-R00100,91.0
614949,60090,200.0
614949,202,300.0
614960,09-2223-00004,4.0
614960,03-1605-00001,2.0
614960,53-0513-00001,2.0
614960,TO-48300,30.0
614960,21-3601-00001,10.0
614960,21-3605-00003,3.0
614960,PMD-HT-0087,5.0
614960,03-1604-00001,6.0
614960,21-2401-00022,100.0
614961,PSU-100,3.0
614961,49-2006-00004,1.0
614962,49-2006-00004,5.0
614962,OC-22 -022-004-0004,3.0
614963,09-2223-00004,4.0
614963,TO-48300,5.0
614963,07-0401-00027,6.0
614963,07-0401-00028,5.0
614963,LP-FXN-ANC-THB-HD10100,35.0
614964,21-3601-00001,4.0
614964,TO-48300,20.0
614965,49-2006-00004,1.0
614965,OC-22 -022-004-0004,1.0
614966,49-2006-00004,1.0
614967,13-0590-00117,1.5
614967,13-0590-00118,1.5
614968,07-1502-00066,347.0
614968,PMD-HT-0087,5.0
614968,53-5701-00026,40.0
614968,07-1502-00059,307.0
614968,49-2006-00004,1.0
614969,49-2006-00004,1.0
614969,TO-48300,10.0
614969,OC-22 -022-004-0004,1.0
614970,49-2006-00004,2.0
614971,49-2006-00004,12.0
614971,OC-22 -022-004-0004,2.0
614972,49-2006-00004,8.0
614973,TP7114,20.0
614973,C-R00075,30.0
614973,OC-13 -013-005-0061,50.0
614973,TP7296,20.0
614973,FX-0150-C-OMDIA10,150.0
614973,USC100,170.0
614973,49-2006-00004,4.0
614973,R-CCN075,30.0
614973,11-2501-00006,1.0
614973,EFA/4,2.0
614973,PMD-HT-0087,5.0
614973,13-3390-00016,15.0
614973,E0075,35.0
614973,OC-40 -040-001-0116,25.0
614973,38-0103-00013,100.0
614974,GNA_F_00868665,2.0
614974,E0075,10.0
614974,LP-FXN-NUT-SPG-GLM06,15.0
614974,21-2690-00013,25.0`.split('\n').forEach(line => {
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