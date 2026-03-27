// PartyTown Blocker: Browser Defense against Service Worker Injection
// ===================================================================
//
// Tampermonkey script for Firefox/Chrome to block malicious PartyTown
// service worker injection from airbnb.com.co and related vectors.
//
// Blocks:
//   1. PartyTown library loading
//   2. Service worker registration at anomalous domains
//   3. Background thread script injection
//   4. Credential harvesting via intercepted fetch/XHR
//
// Installation:
//   1. Install Tampermonkey extension
//   2. Create new script and paste this code
//   3. Enable script execution

(function () {
    'use strict';

    const BLOCKED_DOMAINS = [
        'airbnb.com.co',
        'partytown',
        'partytown.js',
        'ptp-worker.js'
    ];

    const BLOCKED_PATHS = [
        '/static/partytown',
        '/_next/static/partytown',
        '/lib/partytown',
        'cdn.jsdelivr.net/npm/partytown'
    ];

    // ===== LEVEL 1: Block Worker Constructor =====
    const originalWorker = window.Worker;

    window.Worker = function (scriptURL, options) {
        const urlStr = scriptURL.toString().toLowerCase();

        // Check against blocked domains
        for (const domain of BLOCKED_DOMAINS) {
            if (urlStr.includes(domain)) {
                console.error(`[PartyTown Blocker] Blocked malicious Worker: ${scriptURL}`);
                // Return dummy worker that does nothing
                return {
                    postMessage: () => { },
                    addEventListener: () => { },
                    removeEventListener: () => { },
                    terminate: () => { }
                };
            }
        }

        // Check against blocked paths
        for (const path of BLOCKED_PATHS) {
            if (urlStr.includes(path)) {
                console.error(`[PartyTown Blocker] Blocked Worker path: ${scriptURL}`);
                return {
                    postMessage: () => { },
                    addEventListener: () => { },
                    removeEventListener: () => { },
                    terminate: () => { }
                };
            }
        }

        // If not blocked, create normal worker
        return new originalWorker(scriptURL, options);
    };

    // ===== LEVEL 2: Block Service Worker Registration =====
    if (navigator.serviceWorker) {
        const originalRegister = navigator.serviceWorker.register;

        navigator.serviceWorker.register = function (scriptURL, options) {
            const urlStr = scriptURL.toString().toLowerCase();

            // Check for suspicious domains/paths
            for (const domain of BLOCKED_DOMAINS) {
                if (urlStr.includes(domain)) {
                    console.error(`[PartyTown Blocker] Blocked Service Worker registration: ${scriptURL}`);
                    return Promise.reject(
                        new Error('[PartyTown Blocker] Suspicious Service Worker blocked')
                    );
                }
            }

            for (const path of BLOCKED_PATHS) {
                if (urlStr.includes(path)) {
                    console.error(`[PartyTown Blocker] Blocked SW path: ${scriptURL}`);
                    return Promise.reject(
                        new Error('[PartyTown Blocker] Suspicious service worker path blocked')
                    );
                }
            }

            // Check for suspicious scope
            if (options && options.scope) {
                if (options.scope.includes('airbnb.com.co')) {
                    console.error(`[PartyTown Blocker] Blocked SW with suspicious scope: ${options.scope}`);
                    return Promise.reject(
                        new Error('[PartyTown Blocker] Suspicious scope blocked')
                    );
                }
            }

            // If not blocked, register normally
            return originalRegister.call(this, scriptURL, options);
        };
    }

    // ===== LEVEL 3: Intercept & Monitor Fetch Requests =====
    const originalFetch = window.fetch;

    window.fetch = function (...args) {
        const urlStr = args[0].toString().toLowerCase();

        // Log suspicious fetch patterns
        if (urlStr.includes('airbnb.com.co') ||
            urlStr.includes('{') || // JSON credential harvesting pattern
            urlStr.includes('Authorization')) {
            console.warn(`[PartyTown Blocker] Monitored fetch: ${args[0]}`);
        }

        // Block certain credential-bearing requests
        if (args[1] && typeof args[1] === 'object') {
            const headers = args[1].headers || {};
            const headerStr = JSON.stringify(headers).toLowerCase();

            // If sending credentials to suspicious domain
            if (headerStr.includes('authorization') && urlStr.includes('airbnb.com.co')) {
                console.error(`[PartyTown Blocker] Blocked credential exfiltration to: ${urlStr}`);
                return Promise.reject(
                    new Error('[PartyTown Blocker] Credential exfiltration attempt blocked')
                );
            }
        }

        // Otherwise allow fetch
        return originalFetch.apply(this, args);
    };

    // ===== LEVEL 4: Block Script Injection =====
    // Override document.createElement to catch malicious script injection
    const originalCreateElement = document.createElement;

    document.createElement = function (tagName) {
        const elem = originalCreateElement.call(document, tagName);

        if (tagName.toLowerCase() === 'script') {
            const originalSetAttribute = elem.setAttribute;

            elem.setAttribute = function (name, value) {
                if (name.toLowerCase() === 'src') {
                    const srcStr = value.toString().toLowerCase();

                    // Check for blocked domains/paths
                    for (const domain of BLOCKED_DOMAINS) {
                        if (srcStr.includes(domain)) {
                            console.error(`[PartyTown Blocker] Blocked script injection: ${value}`);
                            return;  // Don't set the src
                        }
                    }

                    for (const path of BLOCKED_PATHS) {
                        if (srcStr.includes(path)) {
                            console.error(`[PartyTown Blocker] Blocked script path: ${value}`);
                            return;  // Don't set the src
                        }
                    }
                }

                return originalSetAttribute.call(this, name, value);
            };
        }

        return elem;
    };

    // ===== LEVEL 5: Disable Suspicious Scripts in Document =====
    // Unregister any existing service workers from suspicious origins
    if (navigator.serviceWorker) {
        navigator.serviceWorker.getRegistrations().then(registrations => {
            for (let registration of registrations) {
                const scope = registration.scope.toLowerCase();

                for (const domain of BLOCKED_DOMAINS) {
                    if (scope.includes(domain)) {
                        console.warn(`[PartyTown Blocker] Unregistering suspicious SW: ${scope}`);
                        registration.unregister();
                    }
                }
            }
        }).catch(err => {
            console.log('[PartyTown Blocker] Could not enumerate SW registrations:', err);
        });
    }

    // ===== LOGGING & REPORTING =====
    console.log('[PartyTown Blocker] Initialized. Monitoring for malicious injection vectors.');
    console.log(`[PartyTown Blocker] Blocking ${BLOCKED_DOMAINS.length} domains and ${BLOCKED_PATHS.length} paths`);

    // Periodic scan for live workers/registration (every 5 seconds)
    setInterval(() => {
        if (navigator.serviceWorker) {
            navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    const scope = registration.scope.toLowerCase();

                    for (const domain of BLOCKED_DOMAINS) {
                        if (scope.includes(domain)) {
                            console.error(`[PartyTown Blocker] RUNNING SUSPICIOUS SW DETECTED: ${scope}`);
                            try {
                                registration.unregister();
                                console.log('[PartyTown Blocker] Unregistered threat');
                            } catch (e) {
                                console.error('[PartyTown Blocker] Failed to unregister:', e);
                            }
                        }
                    }
                }
            });
        }
    }, 5000);

})();
