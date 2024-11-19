// Configuration
window.automationConfig = {
    entries: [
        { itemNumber: 'RFOC', quantity: 18 },
        { itemNumber: 'RMF', quantity: 2 },
        { itemNumber: 'XFOC', quantity: 23 },
        { itemNumber: 'XMIC+', quantity: 18 },
        { itemNumber: 'XDA+', quantity: 1 },
        { itemNumber: 'XDSP', quantity: 74 },
        { itemNumber: 'XFIP', quantity: 18 },
        { itemNumber: 'XCI', quantity: 13 },
        { itemNumber: 'WAPL', quantity: 5 },
        { itemNumber: 'X19-6RU', quantity: 1 },
        { itemNumber: 'XRI', quantity: 9 },
        { itemNumber: 'RMCQ', quantity: 3 },
        { itemNumber: 'X19-3RU', quantity: 22 },
        { itemNumber: 'RBD6', quantity: 4 },
        { itemNumber: 'RFAN-06-GPO', quantity: 17 },
        { itemNumber: 'XDIP', quantity: 66 },
        { itemNumber: 'VX IT 5307', quantity: 9 },
        { itemNumber: 'DK 42RU ACC.', quantity: 5 },
        { itemNumber: 'AVATUS-C-36', quantity: 3 },
        { itemNumber: 'AVATUS-CUSTOM-METER', quantity: 6 },
        { itemNumber: 'RFAN06-GPO', quantity: 12 },
        { itemNumber: 'RMDQ', quantity: 9 }
    ],
    isRunning: false,
    currentIndex: 0,
    phase: 'items', // 'items' or 'quantities'
    minDelay: 1000,
    maxDelay: 2000,
    suppressErrors: true
};

// Helper functions
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to enter item number (from item.sh)
async function enterItemNumber(itemNumber) {
    try {
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        // Find first empty item number field
        const input = iframe.contentDocument.querySelector('input[name^="gce0_1."][name$=".12"][value=""]');
        if (!input) throw new Error('No empty item number field found');

        // Click and focus the input
        input.click();
        input.focus();
        await wait(100);

        // Enter value
        input.value = itemNumber;
        input.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Simulate Enter
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

// Function to enter quantity (from qty.sh)
async function enterQuantity(quantity) {
    try {
        const iframe = document.getElementById('e1menuAppIframe');
        if (!iframe) throw new Error('Iframe not found');

        // Find first input with value "1"
        const input = iframe.contentDocument.querySelector('input[name$=".14"][value="1"]');
        if (!input) throw new Error('No quantity input field found with value "1"');

        // Get row from input name
        const row = input.name.split('.')[1];

        // Click to focus
        input.click();
        await wait(100);

        // Set value
        input.value = quantity;

        // Trigger change event
        const changeEvent = new Event('change', { bubbles: true });
        input.dispatchEvent(changeEvent);
        
        await wait(100);

        // Enter key simulation
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

        // Trigger blur
        input.blur();
        
        await wait(500);
        return true;
    } catch (e) {
        console.warn('Enter quantity error:', e);
        return false;
    }
}

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
        if (config.phase === 'items') {
            console.log('All item numbers entered. Ready for quantity phase.');
            console.log('Run automationControls.startQuantities() to begin quantity updates.');
        } else {
            console.log('All quantities entered. Process complete.');
        }
        resetAutomation();
    }
}

// Control functions
function pauseAutomation() {
    window.automationConfig.isRunning = false;
    console.log(`Paused at entry ${window.automationConfig.currentIndex + 1}`);
}

function resetAutomation() {
    window.automationConfig.isRunning = false;
    window.automationConfig.currentIndex = 0;
}

function resumeAutomation() {
    if (!window.automationConfig.isRunning) {
        startAutomation();
    }
}

// Function to start quantity phase
function startQuantities() {
    window.automationConfig.phase = 'quantities';
    window.automationConfig.currentIndex = 0;
    startAutomation();
}

// Add controls to window object
window.automationControls = {
    start: startAutomation,
    startQuantities: startQuantities,
    pause: pauseAutomation,
    resume: resumeAutomation,
    reset: resetAutomation
};

console.log(`
Work Order Items Entry Automation loaded!
- ${window.automationConfig.entries.length} entries to process

Phase 1 - Enter Item Numbers:
start:   automationControls.start()

Phase 2 - Update Quantities:
start:   automationControls.startQuantities()

Other Commands:
pause:   automationControls.pause()
resume:  automationControls.resume()
reset:   automationControls.reset()
`);