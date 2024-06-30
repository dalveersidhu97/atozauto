const loaded = () => {
    const h1 = document.querySelector('h1[data-test-component="StencilH1"]');
    if (!h1) return false;
    const vtoSpinner = document.querySelector('svg[data-test-id="VtoLandingPage_Spinner"]');
    if (!!vtoSpinner) {
        return false;
    };
    console.log('LOADED')
    return true;
}

console.clear();
setTimeout(() => !!setUserInfo && setUserInfo(), 100);
setUserInfo();
let noResponseReloadTimeout = undefined;
chrome.storage.local.get('preference', function (result) {
    const preference = result.preference || {};
    if (preference.refreshMode !== 'Off') {
        noResponseReloadTimeout = setTimeout(() => window.location.reload(), 3 *1000 * 60);
    }
});

const inverval = setInterval(() => {
    if (loaded()) {
        clearInterval(inverval);
        !!noResponseReloadTimeout && clearTimeout(noResponseReloadTimeout);
        chrome.storage.local.get('preference', function (result) {
            const preference = result.preference || {};
            main(preference);
        });
        const GenericErrorContainer = document.querySelector('div[data-test-id="GenericErrorPageLayout"]');
        if (!!GenericErrorContainer)
            setTimeout(() => window.location.reload(), 2000);
    }
}, 100);

const sessionInterval = setInterval(() => {
    const sessionModal = document.querySelector('div[aria-describedby="sr-session-expires-modal-message"]');
    if (!sessionModal) return;
    const styles = window.getComputedStyle(sessionModal);
    if (styles.display !== 'none') {
        const stayLoggedInButton = sessionModal.querySelector('#session-expires-modal-btn-stay-in');
        stayLoggedInButton.click();
        sessionModal.style.display = 'none';
        console.log('modal is visible')
    }
}, 300);