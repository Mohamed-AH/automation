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
        '614732	01/29/2026',
        '614733	01/31/2026',
        '614734	01/31/2026',
        '614735	01/31/2026',
        '614736	01/31/2026',
        '614737	01/31/2026',
        '614738	01/31/2026',
        '614739	01/31/2026',
        '614740	01/31/2026',
        '614741	01/31/2026',
        '614742	01/31/2026',
        '614743	02/01/2026',
        '614744	02/01/2026',
        '614745	02/01/2026',
        '614746	02/01/2026',
        '614747	02/01/2026',
        '614748	02/01/2026',
        '614749	02/01/2026',
        '614750	02/01/2026',
        '614751	02/01/2026',
        '614752	02/01/2026',
        '614753	02/01/2026',
        '614754	02/01/2026',
        '614755	02/01/2026',
        '614756	02/01/2026',
        '614757	02/01/2026',
        '614758	02/01/2026',
        '614759	02/01/2026',
        '614760	02/01/2026',
        '614761	02/01/2026',
        '614762	02/01/2026',
        '614763	02/01/2026',
        '614764	02/01/2026',
        '614765	02/01/2026',
        '614766	02/02/2026',
        '614767	02/02/2026',
        '614768	02/02/2026',
        '614769	02/02/2026',
        '614770	02/02/2026',
        '614771	02/02/2026',
        '614772	02/02/2026',
        '614773	02/02/2026',
        '614774	02/02/2026',
        '614775	02/02/2026',
        '614776	02/02/2026',
        '614777	02/02/2026',
        '614778	02/02/2026',
        '614779	02/02/2026',
        '614780	02/02/2026',
        '614781	02/02/2026',
        '614782	02/02/2026',
        '614783	02/02/2026',
        '614784	02/02/2026',
        '614785	02/04/2026',
        '614786	02/04/2026',
        '614787	02/04/2026',
        '614788	02/04/2026',
        '614789	02/04/2026',
        '614790	02/04/2026',
        '614791	02/04/2026',
        '614792	02/04/2026',
        '614793	02/04/2026',
        '614794	02/04/2026',
        '614795	02/04/2026',
        '614796	02/04/2026',
        '614797	02/04/2026',
        '614798	02/04/2026',
        '614799	02/09/2026',
        '614800	02/05/2026',
        '614801	02/05/2026',
        '614802	02/05/2026',
        '614803	02/05/2026',
        '614804	02/05/2026',
        '614805	02/05/2026',
        '614806	02/05/2026',
        '614807	02/05/2026',
        '614808	02/05/2026',
        '614809	02/05/2026',
        '614810	02/05/2026',
        '614811	02/07/2026',
        '614812	02/07/2026',
        '614813	02/07/2026',
        '614814	02/07/2026',
        '614815	02/07/2026',
        '614816	02/07/2026',
        '614817	02/07/2026',
        '614818	02/07/2026',
        '614819	02/08/2026',
        '614820	02/08/2026',
        '614821	02/08/2026',
        '614822	02/08/2026',
        '614823	02/08/2026',
        '614824	02/08/2026',
        '614825	02/08/2026',
        '614826	02/08/2026',
        '614827	02/08/2026',
        '614828	02/08/2026',
        '614829	02/08/2026',
        '614830	02/10/2026',
        '614831	02/10/2026',
        '614832	02/10/2026',
        '614833	02/10/2026',
        '614834	02/10/2026',
        '614835	02/10/2026',
        '614836	02/10/2026',
        '614837	02/10/2026',
        '614838	02/10/2026',
        '614839	02/10/2026',
        '614840	02/10/2026',
        '614841	02/10/2026',
        '614842	02/10/2026',
        '614843	02/10/2026',
        '614844	02/10/2026',
        '614845	02/10/2026',
        '614846	02/10/2026',
        '614847	02/10/2026',
        '614848	02/10/2026',
        '614849	02/10/2026',
        '614850	02/10/2026',
        '614851	02/10/2026',
        '614852	02/10/2026',
        '614853	02/10/2026',
        '614854	02/10/2026',
        '614855	02/10/2026',
        '614856	02/10/2026',
        '614857	02/11/2026',
        '614858	02/11/2026',
        '614859	02/11/2026',
        '614860	02/11/2026',
        '614861	02/11/2026',
        '614862	02/11/2026',
        '614863	02/15/2026',
        '614864	02/15/2026',
        '614865	02/15/2026',
        '614866	02/15/2026',
        '614867	02/15/2026',
        '614868	02/15/2026',
        '614869	02/15/2026',
        '614870	02/15/2026',
        '614871	02/15/2026',
        '614872	02/15/2026',
        '614873	02/15/2026',
        '614874	02/15/2026',
        '614875	02/15/2026',
        '614876	02/15/2026',
        '614877	02/15/2026',
        '614878	02/15/2026',
        '614879	02/15/2026',
        '614880	02/15/2026',
        '614881	02/15/2026',
        '614882	02/15/2026',
        '614883	02/15/2026',
        '614884	02/15/2026',
        '614885	02/15/2026',
        '614886	02/192026',
        '614887	02/192026',
        '614888	02/192026',
        '614889	02/192026',
        '614890	02/192026',
        '614891	02/192026',
        '614892	02/192026',
        '614893	02/192026',
        '614894	02/192026',
        '614895	02/192026',
        '614896	02/192026',
        '614897	02/18/2026',
        '614898	02/18/2026',
        '614899	02/18/2026',
        '614900	02/18/2026',
        '614901	02/18/2026',
        '614902	02/18/2026',
        '614903	02/18/2026',
        '614904	02/18/2026',
        '614905	02/18/2026',
        '614906	02/18/2026',
        '614907	02/18/2026',
        '614908	02/18/2026',
        '614909	02/19/2026',
        '614910	02/19/2026',
        '614911	02/19/2026',
        '614912	02/19/2026',
        '614913	02/19/2026',
        '614914	02/23/2026',
        '614915	02/23/2026',
        '614916	02/23/2026',
        '614917	02/23/2026',
        '614918	02/23/2026',
        '614919	02/23/2026',
        '614920	02/23/2026',
        '614921	02/23/2026'
    ],
    start: function() { 
        return this.processAllIssues(this.workOrders); 
    }
};

console.log('Automation Script Loaded. Run issuesAutomation.start()');