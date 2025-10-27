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

// Helper function to find element by text content
const findElementByText = async (text, elementType = '*', timeout = 10000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const elements = document.querySelectorAll(elementType);
        for (const element of elements) {
            if (element.textContent.trim() === text || 
                element.textContent.trim().includes(text) ||
                (element.title?.includes("Task Type: Folder") && element.textContent.trim().includes(text))) {
                return element;
            }
        }
        await wait(100);
    }
    throw new Error(`Element containing text "${text}" not found after ${timeout}ms`);
};

// Helper function to find menu item by text with enhanced matching
const findMenuItemByText = async (text, timeout = 10000) => {
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        const elements = document.querySelectorAll('table td span, table td a');
        for (const element of elements) {
            if (element.textContent.trim() === text || 
                element.textContent.trim().includes(text) ||
                (element.title?.includes("Task Type: Folder") && element.textContent.trim().includes(text))) {
                const row = element.closest('tr');
                if (row) {
                    const imgElement = row.querySelector('img[src*="treecollapsed.gif"], img[src*="treeexpanded.gif"]');
                    if (imgElement) {
                        return imgElement;
                    }
                }
            }
        }
        await wait(100);
    }
    throw new Error(`Menu item "${text}" not found after ${timeout}ms`);
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
    if (imgElement.src.includes('treecollapsed.gif')) {
        imgElement.click();
        await wait(2000);
        console.log('Menu expanded');
    } else {
        console.log('Menu already expanded');
    }
};

// Helper function to trigger Add button
const triggerAdd = async () => {
    try {
        console.log('Looking for Add button in iframe...');
        const addButton = await waitForElementInIframe('img[name="hc_Add"]');
        if (addButton) {
            console.log('Found Add button, clicking...');
            if (addButton.onclick) {
                addButton.onclick();
            } else {
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
    { branch: '70049', wo: '9172', isFirstRun: true },
    { branch: '70034', wo: '269', isFirstRun: false },
    { branch: '70033', wo: '9119', isFirstRun: false },
    { branch: '70033', wo: '9118', isFirstRun: false },
    { branch: '70033', wo: '9103', isFirstRun: false },
    { branch: '70033', wo: '9139', isFirstRun: false },
    { branch: '70033', wo: '9171', isFirstRun: false },
    { branch: '70033', wo: '9168', isFirstRun: false },
    { branch: '70033', wo: '9178', isFirstRun: false },
    { branch: '70033', wo: '9136', isFirstRun: false },
    { branch: '70040', wo: '9159', isFirstRun: false },
    { branch: '70040', wo: '9083', isFirstRun: false },
    { branch: '70040', wo: '9154', isFirstRun: false }
];

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

// Main automation function
async function automateWorkOrder(branchNumber, woNumber, isFirstRun = true) {
    try {
        const DELAY = 1500;

        if (isFirstRun) {
            // Step 1: PMD Main Menu
            console.log('Step 1: Looking for PMD Main Menu...');
            await wait(DELAY);
            const mainMenu = await findMenuItemByText('PMD Main Menu');
            await handleMenuClick(mainMenu);
            console.log('✓ Step 1: Successfully handled PMD Main Menu');

            // Step 2: PMD Distribution Menu
            console.log('Step 2: Looking for PMD Distribution Menu...');
            await wait(DELAY);
            const distMenu = await findMenuItemByText('PMD Distribution Menu');
            await handleMenuClick(distMenu);
            console.log('✓ Step 2: Successfully handled PMD Distribution Menu');

            // Step 3: WN Work Order Entry (New Prj)
            console.log('Step 3: Looking for WN Work Order Entry (New Prj)...');
            await wait(DELAY);
            const newPrjMenu = await findMenuItemByText('WN Work Order Entry (New Prj)');
            await handleMenuClick(newPrjMenu);
            console.log('✓ Step 3: Successfully handled WN Work Order Entry (New Prj)');
            await wait(DELAY);

            // Step 4: Click first item in the expanded menu
            console.log('Step 4: Looking for first menu item...');
            try {
                const menuId = newPrjMenu.id?.replace('nodeIcon', 'treechild') || '';
                const expandedMenuContainer = document.getElementById(menuId) || 
                                           newPrjMenu.closest('div[id^="treechild"]');
                
                if (!expandedMenuContainer) throw new Error('Could not find expanded menu container');

                const menuItems = expandedMenuContainer.querySelectorAll('span[style*="cursor: hand"], a[href*="javascript:RunNewApp"]');

                if (menuItems.length > 0) {
                    const firstItem = menuItems[0];

                    if (firstItem.tagName.toLowerCase() === 'span') {
                        const row = firstItem.closest('tr');
                        if (row) {
                            const imgElement = row.querySelector('img[src*="treecollapsed.gif"]');
                            if (imgElement) {
                                // Only click if menu is collapsed
                                await handleMenuClick(imgElement);
                            }
                        }
                    } else {
                        firstItem.click();
                    }
                    console.log('✓ Step 4: Successfully handled first menu item');
                    await wait(DELAY);
                } else {
                    throw new Error('No menu items found');
                }
            } catch (error) {
                console.error('Failed to handle first menu item:', error);
                throw error;
            }

            // Step 5: Find and click the Work Order Entry link
            console.log('Step 5: Looking for Work Order Entry link...');
            try {
                await wait(DELAY);

                const allLinks = document.querySelectorAll('a[href*="javascript:RunNewApp"]');
                let found = false;
                
                for (const link of allLinks) {
                    const onclick = link.getAttribute('onclick') || '';
                    const title = link.getAttribute('title') || '';
                    if (onclick.includes('P48201') || title.includes('P48201')) {
                        link.click();
                        found = true;
                        break;
                    }
                }

                if (!found) {
                    const links = document.querySelectorAll('a[title*="Application"]');
                    for (const link of links) {
                        if (link.title.includes('Work Order')) {
                            link.click();
                            found = true;
                            break;
                        }
                    }
                }

                if (!found) {
                    throw new Error('Could not find Work Order Entry application link');
                }

                console.log('✓ Step 5: Successfully clicked Work Order Entry link');
                await wait(5000);
            } catch (error) {
                console.error('Failed to find application link:', error);
                throw error;
            }
        }

        // Step 6: Trigger Add
        console.log('Step 6: Triggering Add action...');
        await wait(DELAY);
        await triggerAdd();
        await wait(3000);
        console.log('✓ Step 6: Successfully triggered Add action');

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
            await wait(DELAY);
            console.log(`✓ Step ${13 + i}: Successfully clicked OK button`);
        }

        // Step 15: Read SystemWO value and handle errors
        console.log('Step 15: Looking for SystemWO value...');
        await wait(DELAY);
        try {
            const systemWO = await waitForElementInIframe('input[name="0_235"]');
            const systemWOValue = systemWO.value;
            if (!systemWOValue) {
                await clickCancelButton();
                throw new Error('SystemWO value is empty');
            }
            
            console.log('✓ Step 15: Successfully read SystemWO value:', systemWOValue);
            
            // Step 16: Click close
            console.log('Step 16: Looking for Close button...');
            await wait(DELAY);
            await clickCancelButton();
            console.log('✓ Step 16: Successfully clicked Close button');

            console.log('✓✓✓ Automation completed successfully! ✓✓✓');
            return systemWOValue;
            
        } catch (error) {
            console.error('Failed to get SystemWO value:', error);
            // Try to click cancel button before throwing error
            try {
                await clickCancelButton();
            } catch (cancelError) {
                console.error('Additionally failed to click Cancel button:', cancelError);
            }
            throw new Error('SystemWO value not obtained');
        }

    } catch (error) {
        console.error('❌ Automation failed:', error);
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
            
            if (!systemWO) {
                throw new Error('SystemWO value not obtained');
            }
            
            results.push({
                branch: workOrder.branch,
                wo: workOrder.wo,
                systemWO: systemWO,
                status: 'success'
            });
            console.log(`Successfully processed work order: Branch ${workOrder.branch}, WO ${workOrder.wo}, SystemWO: ${systemWO}`);
            
        } catch (error) {
            console.error(`Failed to process work order: Branch ${workOrder.branch}, WO ${workOrder.wo}`, error);
            
            const errorMessage = error.message || 'Unknown error';
            // Only retry if it's an Add button error, not a SystemWO error
            const shouldRetry = (errorMessage.includes('Could not find Add button') || 
                               errorMessage.includes('Element img[name="hc_Add"] not found')) &&
                               !errorMessage.includes('SystemWO');
            
            results.push({
                branch: workOrder.branch,
                wo: workOrder.wo,
                status: 'failed',
                error: errorMessage
            });
            
            if (shouldRetry) {
                console.log('Retrying work order after error...');
                i--; // Retry this work order
                await wait(5000); // Wait longer before retry
            } else {
                console.log('Continuing to next work order...');
            }
        }
        
        // Always wait between work orders
        if (i < workOrderQueue.length - 1) {
            console.log('Waiting before processing next work order...');
            await wait(3000);
        }
    }
    
    // Print summary with error details
    console.log('\nProcessing Summary:');
    console.table(results);
    
    // Print specific error summary
    const failures = results.filter(r => r.status === 'failed');
    if (failures.length > 0) {
        console.log('\nFailed Work Orders:');
        failures.forEach(f => {
            console.log(`Branch: ${f.branch}, WO: ${f.wo}`);
            console.log(`Error: ${f.error}`);
            console.log('---');
        });
    }
    
    // Print success/failure counts
    const successCount = results.filter(r => r.status === 'success').length;
    const failureCount = failures.length;
    console.log('\nFinal Statistics:');
    console.log(`Total Work Orders: ${workOrderQueue.length}`);
    console.log(`Successful: ${successCount}`);
    console.log(`Failed: ${failureCount}`);
    console.log(`Success Rate: ${((successCount / workOrderQueue.length) * 100).toFixed(2)}%`);
    
    return results;
}

// Function to add more work orders to the queue
function addWorkOrders(workOrders) {
    if (!Array.isArray(workOrders)) {
        console.error('Work orders must be provided as an array');
        return;
    }
    
    const validWorkOrders = workOrders.filter(wo => {
        const isValid = wo.branch && wo.wo;
        if (!isValid) {
            console.warn('Invalid work order format:', wo);
        }
        return isValid;
    });
    
    workOrderQueue.push(...validWorkOrders);
    console.log(`Added ${validWorkOrders.length} work orders to queue. Current queue length: ${workOrderQueue.length}`);
}

// Function to clear the queue
function clearWorkOrderQueue() {
    const previousLength = workOrderQueue.length;
    workOrderQueue.length = 0;
    console.log(`Work order queue cleared. Removed ${previousLength} items.`);
}

// Run automation function to handle both single and batch processing
async function runAutomation(branch, wo, isFirstRun) {
    if (arguments.length === 0) {
        // Batch processing
        if (workOrderQueue.length === 0) {
            console.log('No work orders in queue to process.');
            return;
        }
        return processWorkOrders();
    } else {
        // Single work order processing
        console.log('Processing single work order...');
        try {
            const systemWO = await automateWorkOrder(branch, wo, isFirstRun);
            if (!systemWO) {
                throw new Error('SystemWO value not obtained');
            }
            console.log('Final SystemWO value:', systemWO);
            return systemWO;
        } catch (error) {
            console.error('Failed to run automation:', error);
            throw error;
        }
    }
}

// Export functions for potential reuse
window.workOrderAutomation = {
    addWorkOrders,
    clearWorkOrderQueue,
    runAutomation,
    getQueueLength: () => workOrderQueue.length,
    getQueue: () => [...workOrderQueue]
};

// Run the automation
runAutomation();