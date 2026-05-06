const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

let reprocessingQueue = [];
let woProgressTracker = {}; 

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
            console.log('[DEBUG] Iframe access error:', e);
        }
        await wait(100);
    }
    throw new Error(`Element ${selector} not found`);
};

// --- UI COMPONENTS ---
const createVerificationUI = () => {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.id = 'manual-check-overlay';
        overlay.style = 'position: fixed; top: 10px; left: 50%; transform: translateX(-50%); z-index: 10000; padding: 15px; background: #fff; border: 4px solid #ff0000; box-shadow: 0 4px 15px rgba(0,0,0,0.5); text-align: center; font-family: sans-serif;';
        overlay.innerHTML = `
            <div style="margin-bottom: 10px; font-weight: bold; color: #d00; font-size: 16px;">UM VERIFICATION REQUIRED</div>
            <div style="margin-bottom: 10px; font-size: 13px;">Review the highlighted UM field. Edit if necessary, then click proceed.</div>
            <button id="proceed-btn" style="padding: 8px 16px; cursor: pointer; background: #28a745; color: white; border: none; font-weight: bold; border-radius: 4px;">Click to Proceed</button>
        `;
        document.body.appendChild(overlay);
        document.getElementById('proceed-btn').onclick = () => {
            overlay.remove();
            resolve();
        };
    });
};

// --- DATA EXTRACTION ---
async function getUMFromCell(rowIndex) {
    try {
        const iframe = document.getElementById('e1menuAppIframe');
        const selector = `[id="gce0_1.${rowIndex}.14"], [name="gce0_1.${rowIndex}.14"]`;
        const element = iframe.contentDocument.querySelector(selector);
        if (!element) return null;
        return element.tagName === 'INPUT' ? element.value.trim() : element.textContent.trim();
    } catch (e) { return null; }
}

async function getQuantityFromCell(rowIndex) {
    const iframe = document.getElementById('e1menuAppIframe');
    const tdCell = iframe.contentDocument.querySelector(`td[headers="GHEAD0_1.10"][gridid="0_1"][realrow="${rowIndex}"]`);
    if (!tdCell) return null;
    const val = tdCell.querySelector('div')?.textContent.trim();
    return (val === '' || val === '&nbsp;') ? null : parseFloat(val);
}

// --- NAVIGATION & ACTIONS ---
const clickCancelButton = async () => {
    try {
        console.log('[ACTION] Closing window...');
        const iframe = document.getElementById('e1menuAppIframe');
        try {
            iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_13');
        } catch (e) {
            const btn = iframe.contentDocument.querySelector('img[name="hc_Cancel"][id="hc_Cancel"]');
            if (btn) btn.click();
        }
        await wait(1500);
    } catch (error) { console.error('[ERROR] Close failed', error); }
};

async function clickOkButton(originalWorkOrderInput, itemsJustProcessed) {
    try {
        console.log(`[PROCESS] Committing ${itemsJustProcessed} items...`);
        const iframe = document.getElementById('e1menuAppIframe');
        
        for (let c = 1; c <= 3; c++) {
            console.log(`[ACTION] OK Click ${c}/3`);
            try {
                iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_12');
            } catch (e) {
                const btn = iframe.contentDocument.querySelector('img[name="hc_OK"][id="hc_OK"]');
                if (btn) btn.click();
            }
            await wait(2500); 
        }

        const dateField = iframe.contentDocument.querySelector('[id="C0_90"], [name="0_90"]');
        
        // Error Detection
        const errorMsg = iframe.contentDocument.querySelector('.ErrorText, [id*="err"]');
        if (errorMsg && errorMsg.textContent.trim() !== "") {
            console.error(`[SYSTEM ERROR] ${errorMsg.textContent.trim()}`);
            await clickCancelButton();
            return { status: 'error', message: errorMsg.textContent };
        }

        // AGGRESSIVE REPROCESSING: If we hit 10, always queue it for safety.
        if (itemsJustProcessed >= 10) {
            console.log(`[SAFETY] 10 items processed. Queuing WO for verification in next batch.`);
            reprocessingQueue.push(originalWorkOrderInput);
            if (dateField) await clickCancelButton();
            return { status: 'reprocess' };
        }

        if (dateField) {
            console.log('[DEBUG] Window stayed open. Closing manually.');
            await clickCancelButton();
        }
        
        return { status: 'success' };
    } catch (error) { throw error; }
}

async function selectInventoryIssues() {
    await wait(2000);
    const iframe = document.getElementById('e1menuAppIframe');
    const allMenus = iframe.contentDocument.querySelectorAll('select[name="menu1"]');
    let rowMenu = null;
    for (const menu of allMenus) {
        if (menu.getAttribute('onchange')?.includes('doMenuSelectHE0_138hc_Row_Exit')) {
            rowMenu = menu; break;
        }
    }
    if (!rowMenu) throw new Error('Row menu not found');
    rowMenu.click();
    await wait(500);
    const opt = Array.from(rowMenu.options).find(o => o.text.includes('Inventory Issues'));
    rowMenu.value = opt.value;
    try { iframe.contentWindow.JDEDTAFactory.getInstance('').post('0_144'); } 
    catch (e) { rowMenu.dispatchEvent(new Event('change', { bubbles: true })); }
    await wait(2500);
}

async function enterIssueQuantity(rowIndex, quantity) {
    const iframe = document.getElementById('e1menuAppIframe');
    await wait(600);
    const cell = iframe.contentDocument.querySelector(`td[headers="GHEAD0_1.5"][gridid="0_1"][realrow="${rowIndex}"]`);
    if (!cell) return false;
    cell.click(); await wait(300);
    const input = iframe.contentDocument.querySelector(`input[name="gce0_1.${rowIndex}.5"], input[id="gce0_1.${rowIndex}.5"]`);
    if (!input) return false;
    input.value = quantity;
    input.dispatchEvent(new Event('change', { bubbles: true }));
    const ev = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true };
    input.dispatchEvent(new KeyboardEvent('keydown', ev));
    input.dispatchEvent(new KeyboardEvent('keyup', ev));
    input.blur(); await wait(600);
    return true;
}

// --- CORE LOGIC ---
async function processWorkOrderIssues(workOrderInput) {
    try {
        const parts = workOrderInput.trim().split(/[\s\t]+/);
        const workOrder = parts[0];
        const extractedDate = parts.length > 1 ? parts[1] : null;

        console.log(`\n--- STARTING WO: ${workOrder} ---`);
        
        const qbeInput = await waitForElementInIframe('input[name="qbe0_1.0"]');
        qbeInput.value = workOrder;
        const ev = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true };
        qbeInput.dispatchEvent(new KeyboardEvent('keydown', ev));
        qbeInput.dispatchEvent(new KeyboardEvent('keyup', ev));
        await wait(2000);
        
        const checkbox = await waitForElementInIframe('input[name="grs0_1"]');
        checkbox.click(); await wait(1500);
        await selectInventoryIssues(); 

        // Progress Tracking / Infinite Loop Protection
        const currentTopQty = await getQuantityFromCell(0);
        if (woProgressTracker[workOrder] !== undefined && woProgressTracker[workOrder] === currentTopQty) {
            console.error(`[STUCK] WO ${workOrder} quantity (${currentTopQty}) unchanged. Aborting.`);
            await clickCancelButton();
            return { workOrder, status: 'aborted_loop', items: 0 };
        }
        woProgressTracker[workOrder] = currentTopQty;

        if (extractedDate) {
            const iframe = document.getElementById('e1menuAppIframe');
            const dateInput = iframe.contentDocument.getElementById('C0_90');
            if (dateInput) {
                dateInput.value = extractedDate;
                dateInput.dispatchEvent(new Event('blur', { bubbles: true }));
                await wait(800);
            }
        }

        let rowIndex = 0;
        let processedItems = 0;
        let manualCheckDone = false;

        // Loop until max visible items (10)
        while (rowIndex < 10) {
            const quantity = await getQuantityFromCell(rowIndex);
            if (quantity === null || quantity === 0) break; 

            const umValue = await getUMFromCell(rowIndex);
            if (!manualCheckDone && ['BX', 'PK', 'DZ', 'ST'].includes(umValue)) {
                console.log(`[VERIFY] Manual UM check: ${umValue}`);
                await createVerificationUI();
                manualCheckDone = true;
            }

            console.log(`[DATA] Row ${rowIndex}: Entering ${quantity}`);
            const success = await enterIssueQuantity(rowIndex, quantity);
            if (success) { processedItems++; rowIndex++; } else { break; }
        }

        if (processedItems === 0) {
            console.log('[INFO] Grid is empty.');
            await clickCancelButton();
            return { workOrder, status: 'empty', items: 0 };
        }

        const result = await clickOkButton(workOrderInput, processedItems);
        return { workOrder, status: result.status, items: processedItems };

    } catch (error) {
        console.error(`[CRITICAL ERROR] WO ${workOrderInput}:`, error.message);
        await clickCancelButton().catch(() => {});
        return { workOrder: workOrderInput, status: 'failed', error: error.message };
    }
}

async function processAllIssues(workOrders) {
    let currentBatch = [...workOrders];
    const finalResults = [];
    woProgressTracker = {}; 

    while (currentBatch.length > 0) {
        reprocessingQueue = [];
        let batchProgressCount = 0;
        console.log(`\n[BATCH] Processing ${currentBatch.length} orders...`);

        for (let i = 0; i < currentBatch.length; i++) {
            const res = await processWorkOrderIssues(currentBatch[i]);
            finalResults.push(res);
            if (res.items) batchProgressCount += res.items;
            if (i < currentBatch.length - 1) await wait(4000);
        }

        console.log(`[BATCH DONE] Total items issued: ${batchProgressCount}`);

        if (reprocessingQueue.length > 0) {
            // Exit if we have a queue but issued 0 items (prevents dead loops)
            if (batchProgressCount === 0) {
                console.warn("[TERMINATE] No progress made. Exiting to prevent loop.");
                break;
            }
            currentBatch = [...new Set(reprocessingQueue)];
            console.log(`[NEXT CYCLE] Rerunning ${currentBatch.length} orders for verification.`);
            await wait(6000);
        } else {
            currentBatch = [];
        }
    }
    console.table(finalResults);
}

// --- INITIALIZATION ---
window.issuesAutomation = {
    processAllIssues,
    workOrders: [
        '615022	04/09/2026',
        '615023	04/09/2026',
        '615024	04/09/2026',
        '615025	04/09/2026',
        '615026	04/09/2026',
        '615027	04/09/2026',
        '615028	04/09/2026',
        '615029	04/09/2026',
        '615030	04/09/2026',
        '615031	04/09/2026',
        '615032	04/09/2026',
        '615033	04/09/2026',
        '615034	03/31/2026',
        '615035	03/31/2026',
        '615036	03/31/2026',
        '615037	03/31/2026',
        '615038	04/04/2026',
        '615039	04/04/2026',
        '615040	04/04/2026',
        '615041	04/04/2026',
        '615042	04/04/2026',
        '615043	04/04/2026',
        '615044	04/06/2026',
        '615045	04/06/2026',
        '615046	04/06/2026',
        '615047	04/06/2026',
        '615048	04/06/2026',
        '615049	04/06/2026',
        '615050	04/06/2026',
        '615051	04/06/2026',
        '615052	04/06/2026'
    ],
    start: function() { 
        return this.processAllIssues(this.workOrders); 
    }
};

console.log('Automation Script Loaded. Run issuesAutomation.start()');