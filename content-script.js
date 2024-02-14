const convertTimeToMins = (timeStr) => {
    let time = 0;
    const calcMins = (hours, mins) => {
        return hours * 60 + mins;
    }
    if (timeStr.endsWith('a.m.')) {
        const units = timeStr.replace('a.m.', '').split(':');
        time = calcMins(+units[0], +units[1]);
    } else if (timeStr.endsWith('p.m.')) {
        const units = timeStr.replace('p.m.', '').split(':');
        time = 720 + calcMins(+units[0], +units[1]);
    }
    return time;
}

const getUserInfo = () => {
    const navbar = document.querySelector('#navbar-menu');
    const img = navbar.querySelector(`img[alt="User's avatar"]`);
    const name = img.parentElement.parentElement.innerText;
    console.log(name, img.getAttribute('src'));
    return { name, img: img.getAttribute('src') }
}

const setUserInfo = () => {
    const userInfo = getUserInfo();
    chrome.storage.local.get(null, function (result) {
        chrome.storage.local.set({ ...result, userInfo });
    });
}

const getVtos = () => {
    const vtos = [];
    const expanders = document.querySelectorAll('div[data-test-component="StencilExpander"]');
    expanders.forEach(expander => {
        const h1 = expander.querySelector('h2').innerText;
        const vtoBadge = expander.querySelector('div[data-test-id="VtoForDay_countIcon"]');

        if (!vtoBadge) return;
        const numVTOText = vtoBadge.innerText;
        const numVTO = +numVTOText;
        if (!numVTO) return;

        const expandedContent = expander.querySelector('div[data-test-component="StencilExpanderContent"]');
        if (!expandedContent) return;
        const cards = expandedContent.querySelectorAll('div[data-test-component="StencilReactCard"]');
        cards.forEach(card => {
            const button = card.querySelector('button');
            if (button && button.innerText === 'Accept') {
                const texts = card.querySelectorAll('div[data-test-component="StencilText"]');
                const time = texts[0].innerText;
                const times = time.split(' - ');
                const startTime = convertTimeToMins(times[0]);
                const endTime = convertTimeToMins(times[1]);
                const duration = texts[1].innerText;
                const cycle = texts[2].innerText;
                vtos.push({ date: h1, startTime, endTime, time, duration, cycle, button })
            }
        })
    })
    return vtos;
}

const is = (val1, op, val2) => {
    let isValid = false;
    switch (op) {
        case 'gt': { if (val1 > val2) isValid = true; break; }
        case 'gte': { if (val1 >= val2) isValid = true; break; }
        case 'lt': { if (val1 < val2) isValid = true; break; }
        case 'lte': { if (val1 <= val2) isValid = true; break; }
        case 'eq': { if (val1 === val2) isValid = true; break; }
    }
    console.log(val1, op, val2, isValid)
    return isValid;
}

const validateVTOFilter = (vto, filter) => {
    const userName = getUserInfo().name;
    const vtoDate = vto.date.split(',')[0].toLowerCase();
    const requiredDate = filter.date.split(',')[0].toLowerCase();
    if (filter.forName.toLowerCase() !== userName.toLowerCase()) return false;
    if (vtoDate !== requiredDate) return false;
    console.log(vtoDate, '===', requiredDate);

    const startTimeOp = Object.keys(filter.startTime)[0];
    const startTime = filter.startTime[startTimeOp];
    const endTimeOp = Object.keys(filter.endTime)[0];
    const endTime = filter.endTime[endTimeOp];

    const isStartTimeValid = is(vto.startTime, startTimeOp, startTime);
    const isEndTimeValid = is(vto.endTime, endTimeOp, endTime);
    const isValid = isStartTimeValid && isEndTimeValid;
    return isValid;
}

const isVTOAcceptable = (vtoFilters, vto) => {
    for (let i = 0; i < vtoFilters.length; i++) {
        const isFilterValid = validateVTOFilter(vto, vtoFilters[i]);
        if (isFilterValid) return vtoFilters[i];
    }
    return false;
}


// const testVTOs = [{
//     button: "button.e4s17lp0.css-1jwvbdk",
//     cycle: "PFSD",
//     date: "Feb 09, Fri",
//     duration: "(6hrs 50mins)",
//     time: "5:00a.m. - 11:50a.m.",
//     startTime: 300,
//     endTime: 710
// }];

// const vtoFilters = [
//     {
//         startTime: { gt: 300 },
//         endTime: { lt: 710 },
//         date: "Feb 09, Fri",
//         forName: "Dalveer",
//     },
// ];

function contains(context, selector, text) {
    var elements = context.querySelectorAll(selector);
    for (let i = 0; i < elements.length; i++) {
        const element = elements[i];
        if (RegExp(text).test(element.innerText)) return element;
    }
    return undefined;
}

const removeFilter = (filterKey, filterToDelete) => {
    chrome.storage.local.get(null, function (result) {
        const filters = result[filterKey] || [];
        const newFilters = filters.filter(filter => {
            if (JSON.stringify(filterToDelete) === JSON.stringify(filter)) {
                return false
            }
            return true;
        });
        chrome.storage.local.set({ ...result, [filterKey]: newFilters });
    });
}

const pressModalButton = (regex, callBack) => {
    const modal = document.querySelector('div[data-test-component="StencilModal"]');
    if (!modal) {
        console.log('No modal');
        return false;
    }
    const button = contains(modal, 'button', regex);
    if (!button) {
        console.log('No button');
        return false;
    }
    button.click();
    callBack && callBack();
}

const acceptVTO = (vto, callBack) => {
    console.log('Click VTO Button', vto);
    vto.button.click()
    setTimeout(() => {
        pressModalButton(/^Accept VTO$/i, ()=>{
            callBack && callBack();
            let counter = 1;
            const interval = setInterval(()=>{
                if(counter<=10) clearInterval(interval);
                pressModalButton(/^ok$/i, ()=>clearInterval(interval));
                counter++;
            }, 500)
        });
        // pressModalButton(/^CANCEL$/i);
    }, 1000)
}

const main = () => {

    chrome.storage.local.get('filters', function (result) {
        const userName = getUserInfo().name;
        const filters = result.filters.filter(f=>f.forName.toLowerCase()===userName.toLowerCase()) || [];
        console.log('filters', filters);
        if (!filters.length) return;

        let vtos = getVtos();
        console.log({ vtos });
        let acceptableVTOs = 0;
        const gapSeconds = 3000;
        let reloadAfter = 25000;

        for (let i = 0; i < vtos.length; i++) {
            const vto = vtos[i];
            const matchedFilter = isVTOAcceptable(filters, vto);
            if (!!matchedFilter) {
                setTimeout(() => {
                    acceptVTO(vto, () => {
                        removeFilter('filters', matchedFilter);
                        vtos = vtos.filter(v => {
                            if (JSON.stringify(v) === JSON.stringify(vto)) return false;
                            return true;
                        });
                    });
                }, acceptableVTOs * gapSeconds);
                acceptableVTOs++;
            }
        }
        const currentMins = new Date().getMinutes();
        console.log(currentMins);
        if ((currentMins > 28 && currentMins < 32) || (currentMins > 58 || currentMins < 2) || (currentMins > 43 && currentMins < 47) || (currentMins > 13 && currentMins < 17)) {
            reloadAfter = 1000;
        }
        if (acceptableVTOs) {
            reloadAfter = reloadAfter + acceptableVTOs * gapSeconds;
        }
        filters.length > 0 && console.log(`Accepted ${acceptableVTOs} VTO(s), Reloading in: `, reloadAfter / 1000, 'Seconds');

        filters.length > 0 && setTimeout(() => window.location.reload(), reloadAfter)
    });

}

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
setUserInfo();
const inverval = setInterval(() => {
    if (loaded()) {
        clearInterval(inverval);
        main();
    }
}, 200);

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