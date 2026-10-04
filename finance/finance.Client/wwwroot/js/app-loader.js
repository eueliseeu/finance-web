// AppLoader - Subtle bottom notification for WASM initialization
window.AppLoader = (() => {
    let loaderElement = null;
    let progressBar = null;
    let shimmer = null;
    let statusText = null;
    let percentageText = null;
    let wasmReady = false;
    let progressCheckInterval = null;
    
    // Constants
    const PROGRESS_CHECK_INTERVAL_MS = 150; // Poll interval for progress updates (balanced for responsiveness)
    const WASM_CHECK_INTERVAL_MS = 200; // Poll interval for WASM readiness
    const TIMEOUT_WARNING_MS = 60000; // Show warning after 60 seconds

    // Detect if we're using Auto or WebAssembly mode
    const isAutoOrWasmMode = () => {
        // Check for blazor.web (matches blazor.web.js, blazor.web.[hash].js, etc.)
        // Blazor adds version hashes in production: blazor.web.abc123def.js
        const blazorScript = document.querySelector('script[src*="blazor.web"]');
        return blazorScript !== null; // If blazor.web exists, we're in Auto/WASM mode
    };

    // Initialize DOM references
    const initElements = () => {
        loaderElement = document.getElementById('app-loader');
        progressBar = document.getElementById('app-loader-progress');
        shimmer = document.getElementById('app-loader-shimmer');
        statusText = document.getElementById('app-loader-status');
        percentageText = document.getElementById('app-loader-percentage');
    };

    // Show the loader
    const show = () => {
        if (loaderElement) {
            loaderElement.classList.add('show');
        }
    };

    // Hide the loader with fade-out
    const hide = () => {

        setTimeout(() => {
            if (loaderElement) {
                loaderElement.classList.add('hiding');

                setTimeout(() => {
                    loaderElement.remove();
                }, 400);
            }
        }, 480); // Slight delay before starting hide animation
    };

    // Update progress (0-100)
    const updateProgress = (percentage) => {
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        
        if (percentageText) {
            percentageText.textContent = percentage > 0 ? `${Math.round(percentage)}%` : '';
        }
        
        // Hide shimmer when we have real progress
        if (shimmer && percentage > 0) {
            shimmer.style.display = 'none';
        }
    };

    // Update status message
    const updateStatus = (message) => {
        if (statusText) {
            statusText.textContent = message;
        }
    };

    // Monitor Blazor's native progress using CSS variable
    const monitorBlazorProgress = () => {
        progressCheckInterval = setInterval(() => {
            // Read the --blazor-load-percentage CSS variable set by Blazor
            const loadPercentage = getComputedStyle(document.body).getPropertyValue('--blazor-load-percentage').trim();
            
            if (loadPercentage) {
                const percentage = parseFloat(loadPercentage);
                if (!isNaN(percentage) && percentage > 0) {
                    updateProgress(percentage);
                    
                    // Update status based on progress
                    if (percentage < 30) {
                        updateStatus('Loading configuration...');
                    } else if (percentage < 70) {
                        updateStatus('Loading app runtime...');
                    } else if (percentage < 100) {
                        updateStatus('Loading assemblies...');
                    }
                }
            }
        }, PROGRESS_CHECK_INTERVAL_MS);
    };

    // Check if WASM is fully initialized
    // NOTE: This relies on Blazor internal APIs which may change in future versions.
    // If this breaks in future Blazor updates, consider alternative detection methods.
    const isWasmReady = () => {
        return window.Blazor && 
               window.Blazor._internal && 
               window.Blazor._internal.navigationManager;
    };

    // Poll for WASM readiness
    const waitForWasm = () => {
        const startTime = Date.now();
        
        const checkInterval = setInterval(() => {
            if (isWasmReady()) {
                wasmReady = true;
                clearInterval(checkInterval);
                
                // Stop monitoring progress
                if (progressCheckInterval) {
                    clearInterval(progressCheckInterval);
                }
                
                updateProgress(100);
                updateStatus('Ready!');
                
                // Hide after brief delay
                setTimeout(hide, 500);
            } else {
                // Show elapsed time after 10 seconds
                const elapsed = Math.floor((Date.now() - startTime) / 1000);
                if (elapsed > 10) {
                    updateStatus(`Still initializing... (${elapsed}s)`);
                }
            }
        }, WASM_CHECK_INTERVAL_MS);

        // Timeout warning after configured timeout
        setTimeout(() => {
            if (!wasmReady) {
                // Stop monitoring progress on timeout
                if (progressCheckInterval) {
                    clearInterval(progressCheckInterval);
                }
                
                updateStatus('Initialization is taking longer than expected...');
                // Show shimmer for indeterminate state
                if (shimmer) {
                    shimmer.style.display = 'block';
                }
                if (progressBar) {
                    progressBar.style.width = '0%';
                }
            }
        }, TIMEOUT_WARNING_MS);
    };

    // Initialize
    const init = () => {
        initElements();
        
        if (!loaderElement) {
            return;
        }

        // Only show for Auto/WASM mode
        if (!isAutoOrWasmMode()) {
            loaderElement.remove();
            return;
        }
        
        show();
        
        // Show shimmer initially
        if (shimmer) {
            shimmer.style.display = 'block';
        }
        
        // Start monitoring Blazor's native progress
        monitorBlazorProgress();
        waitForWasm();
    };

    // Public API
    return {
        init,
        show,
        hide,
        updateProgress,
        updateStatus,
        isReady: () => wasmReady
    };
})();
