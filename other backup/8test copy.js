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

// Helper function to handle menu clicks
const handleMenuClick = async (imgElement) => {
    // Check if the menu is collapsed (contains 'treecollapsed.gif' in src)
    if (imgElement.src.includes('treecollapsed.gif')) {
        imgElement.click();
        await wait(2000); // Wait for menu to expand
        console.log('Menu expanded');
    } else {
        console.log('Menu already expanded');
    }
};

// Helper function to trigger Add button
const triggerAdd = async () => {
    try {
        // Try finding the image in iframe
        console.log('Looking for Add button in iframe...');
        const addButton = await waitForElementInIframe('img[name="hc_Add"]');
        if (addButton) {
            console.log('Found Add button, clicking...');
            // Try using onclick handler if it exists
            if (addButton.onclick) {
                addButton.onclick();
            } 
            // Try using JDEDTAFactory via iframe's window
            else {
                const iframe = document.getElementById('e1menuAppIframe');
                if (iframe.contentWindow.JDEDTAFactory && typeof iframe.contentWindow.JDEDTAFactory.getInstance === 'function') {
                    iframe.contentWindow.JDEDTAFactory.getInstance().post('0_131');
                } else {
                    addButton.click();
                }
            }
            return;
        }
    } catch (e) {
        console.log('Could not find Add button or trigger action:', e);
    }

    throw new Error('Could not find any way to trigger Add action');
};

// Queue to store work orders to be processed
const workOrderQueue = [
    { branch: '70052', wo: '6843', isFirstRun: true },
    { branch: '70033', wo: '6848', isFirstRun: false },
    { branch: '70033', wo: '6846', isFirstRun: false },
    { branch: '70040', wo: '6849', isFirstRun: false },
    { branch: '70040', wo: '6847', isFirstRun: false }
];

// Main automation function
async function automateWorkOrder(branchNumber, woNumber, isFirstRun = true) {
    try {
        const DELAY = 1500;

        if (isFirstRun) {
            // Step 1: PMD Main Menu
            console.log('Step 1: Looking for PMD Main Menu...');
            await wait(DELAY);
            const mainMenu = await waitForElement('img[id="nodeIcon700_..TASK.HAS.NO.PARENT.._70038692"]');
            await handleMenuClick(mainMenu);
            console.log('✓ Step 1: Successfully handled PMD Main Menu');

            // Step 2: PMD Distribution Menu
            console.log('Step 2: Looking for PMD Distribution Menu...');
            await wait(DELAY);
            const distMenu = await waitForElement('img[id="nodeIcon21627300400001-HQWHUNMPSV-OIJYYYYYYY_700_70038693"]');
            await handleMenuClick(distMenu);
            console.log('✓ Step 2: Successfully handled PMD Distribution Menu');

            // Step 3: WN Work Order Entry (New Prj)
            console.log('Step 3: Looking for WN Work Order Entry (New Prj)...');
            await wait(DELAY);
            const newPrjMenu = await waitForElement('img[id="nodeIcon37921169600000-HQWHUNMPSV-XFGNIYYYYY_21627300400001-HQWHUNMPSV-OIJYYYYYYY_70038697"]');
            await handleMenuClick(newPrjMenu);
            console.log('✓ Step 3: Successfully handled WN Work Order Entry (New Prj)');

            // Step 4: WN Work Order Entry submenu
            console.log('Step 4: Looking for WN Work Order Entry submenu...');
            await wait(DELAY);
            const workOrderSubMenu = await waitForElement('img[id="nodeIcon3792133660000d-HQWHUNMPSV-XFGNIYYYYY_37921169600000-HQWHUNMPSV-XFGNIYYYYY_70038699"]');
            await handleMenuClick(workOrderSubMenu);
            console.log('✓ Step 4: Successfully handled WN Work Order Entry submenu');

            // Step 5: Click WN Work Order Entry link
            console.log('Step 5: Looking for WN Work Order Entry link...');
            await wait(DELAY);
            const workOrderLink = await waitForElement('a[title*="Application: P48201"]');
            workOrderLink.click();
            console.log('✓ Step 5: Successfully clicked WN Work Order Entry link');
            
            console.log('Waiting for application to load...');
            await wait(5000);
        }

        // Step 6: Trigger Add
        console.log('Step 6: Triggering Add action...');
        await wait(DELAY);
        try {
            await triggerAdd();
            await wait(3000); // Wait for Add action to complete
            console.log('✓ Step 6: Successfully triggered Add action');
        } catch (error) {
            console.error('Add operation failed:', error);
            throw error;
        }

        // Step 7: Insert branch number
        console.log('Step 7: Looking for branch number input...');
        await wait(DELAY);
        const branchInput = await waitForElementInIframe('input[name="0_43"]');
        branchInput.value = branchNumber;
        branchInput.dispatchEvent(new Event('change', { bubbles: true }));
        branchInput.dispatchEvent(new Event('blur'));
        console.log('✓ Step 7: Successfully inserted branch number:', branchNumber);

        // Step 8: Insert WO number
        console.log('Step 8: Looking for WO number input...');
        await wait(DELAY);
        const woInput = await waitForElementInIframe('input[name="0_152"]');
        woInput.value = woNumber;
        woInput.dispatchEvent(new Event('change', { bubbles: true }));
        woInput.dispatchEvent(new Event('blur'));
        console.log('✓ Step 8: Successfully inserted WO number:', woNumber);

        // Step 9: Click Classification tab
        console.log('Step 9: Looking for Classification tab...');
        await wait(DELAY);
        const classificationTab = await waitForElementInIframe('a[id="CT0_13.2"]');
        classificationTab.click();
        console.log('✓ Step 9: Successfully clicked Classification tab');

        // Step 10: Insert "scs"
        console.log('Step 10: Looking for SCS input field...');
        await wait(DELAY);
        const scsInput = await waitForElementInIframe('input[name="0_118"]');
        scsInput.value = 'scs';
        scsInput.dispatchEvent(new Event('change', { bubbles: true }));
        scsInput.dispatchEvent(new Event('blur'));
        console.log('✓ Step 10: Successfully inserted "scs"');

        // Step 11: Click Accounting tab
        console.log('Step 11: Looking for Accounting tab...');
        await wait(DELAY);
        const accountingTab = await waitForElementInIframe('a[id="CT0_13.3"]');
        accountingTab.click();
        console.log('✓ Step 11: Successfully clicked Accounting tab');

        // Step 12: Insert branch number again
        console.log('Step 12: Looking for second branch number input...');
        await wait(DELAY);
        const branchInput2 = await waitForElementInIframe('input[name="0_199"]');
        branchInput2.value = branchNumber;
        branchInput2.dispatchEvent(new Event('change', { bubbles: true }));
        branchInput2.dispatchEvent(new Event('blur'));
        console.log('✓ Step 12: Successfully inserted branch number again:', branchNumber);

        // Step 13-14: Click OK twice
        for (let i = 0; i < 2; i++) {
            console.log(`Step ${13 + i}: Looking for OK button...`);
            await wait(DELAY);
            const okButton = await waitForElementInIframe('img[name="hc_OK"]');
            okButton.click();
            console.log(`✓ Step ${13 + i}: Successfully clicked OK button`);
        }

        // Step 15: Read SystemWO value
        console.log('Step 15: Looking for SystemWO value...');
        await wait(DELAY);
        const systemWO = await waitForElementInIframe('input[name="0_235"]');
        const systemWOValue = systemWO.value;
        console.log('✓ Step 15: Successfully read SystemWO value:', systemWOValue);

        // Step 16: Click close
        console.log('Step 16: Looking for Close button...');
        await wait(DELAY);
        const closeButton = await waitForElementInIframe('img[name="hc_Cancel"]');
        closeButton.click();
        console.log('✓ Step 16: Successfully clicked Close button');

        console.log('✓✓✓ Automation completed successfully! ✓✓✓');
        return systemWOValue;

    } catch (error) {
        console.error('❌ Automation failed at step:', error);
        throw error;
    }
}

// Function to process all work orders in queue
async function processWorkOrders() {
    console.log('Starting batch processing of work orders...');
    const results = [];
    
    for (let i = 0; i < workOrderQueue.length; i++) {
        const workOrder = workOrderQueue[i];
        console.log(`Processing work order ${i + 1}/${workOrderQueue.length}:`, workOrder);
        
        try {
            const systemWO = await automateWorkOrder(workOrder.branch, workOrder.wo, workOrder.isFirstRun);
            results.push({
                branch: workOrder.branch,
                wo: workOrder.wo,
                systemWO: systemWO,
                status: 'success'
            });
            console.log(`Successfully processed work order: Branch ${workOrder.branch}, WO ${workOrder.wo}, SystemWO: ${systemWO}`);
            
            // Add delay between work orders
            if (i < workOrderQueue.length - 1) {
                console.log('Waiting before processing next work order...');
                await wait(3000); // 3 second delay between work orders
            }
        } catch (error) {
            console.error(`Failed to process work order: Branch ${workOrder.branch}, WO ${workOrder.wo}`, error);
            results.push({
                branch: workOrder.branch,
                wo: workOrder.wo,
                status: 'failed',
                error: error.message
            });
            
            // Optional: Add retry logic
            if (error.message.includes('Could not find Add button')) {
                console.log('Retrying work order after error...');
                i--; // Retry this work order
                await wait(5000); // Wait longer before retry
                continue;
            }
        }
    }
    
    // Print summary
    console.log('\nProcessing Summary:');
    console.table(results);
    
    return results;
}

// Function to add more work orders to the queue
function addWorkOrders(workOrders) {
    workOrderQueue.push(...workOrders);
    console.log('Added work orders to queue. Current queue length:', workOrderQueue.length);
}

// Function to clear the queue
function clearWorkOrderQueue() {
    workOrderQueue.length = 0;
    console.log('Work order queue cleared');
}

// Modified run automation function to handle both single and batch processing
async function runAutomation(branch, wo, isFirstRun) {
    if (arguments.length === 0) {
        // Run batch processing if no arguments provided
        return processWorkOrders();
    } else {
        // Run single work order if arguments provided
        console.log('Processing single work order...');
        try {
            const systemWO = await automateWorkOrder(branch, wo, isFirstRun);
            console.log('Final SystemWO value:', systemWO);
            return systemWO;
        } catch (error) {
            console.error('Failed to run automation:', error);
        }
    }
}

// Run the automation for all work orders in queue
runAutomation();