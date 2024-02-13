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
    // console.log(val1, op, val2, isValid)
    return isValid;
}

const validateVTOFilter = (vto, filter) => {
    const vtoDate = vto.date.split(',')[0].toLowerCase();
    const requiredDate = filter.date.split(',')[0].toLowerCase();
    console.log(vtoDate, '===', requiredDate);
    if (vtoDate !== requiredDate) return false;

    const startTimeOp = Object.keys(filter.startTime)[0];
    const startTime = filter.startTime[startTimeOp];
    const endTimeOp = Object.keys(filter.endTime)[0];
    const endTime = filter.endTime[endTimeOp];

    const isStartTimeValid = is(vto.startTime, startTimeOp, startTime);
    const isEndTimeValid = is(vto.endTime, endTimeOp, endTime);
    const isValid = isStartTimeValid && isEndTimeValid;
    console.log({ isValid, isMust: filter.isMust, isStartTimeValid, isEndTimeValid });
    return isValid ? isValid : filter.isMust ? false : true;
}

const isVTOAcceptable = (vtoFilters, vto) => {
    for (let i = 0; i < vtoFilters.length; i++) {
        const isFilterValid = validateVTOFilter(vto, vtoFilters[i]);
        if (!isFilterValid) return false;
    }
    return true;
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
//         isMust: false,
//         date: "Feb 09, Fri",
//     },
// ];

function contains(context, selector, text) {
    var elements = context.querySelectorAll(selector);
    return Array.prototype.filter.call(elements, function (element) {
        return RegExp(text).test(element.textContent);
    });
}

const acceptVTO = (vto) => {
    console.log('Click VTO Button', vto);
    vto.button.click()
    setTimeout(() => {
        const modal = document.querySelector('div[data-test-component="StencilModal"]');
        if (!modal) {
            console.log('No confirm modal');
            return false;
        }
        const acceptButton = contains(modal, 'button', 'Accept VTO');
        if (!acceptButton) {
            console.log('No confirm button');
            return false;
        }
        // acceptButton.click();
        console.log('Confirm button clicked', acceptButton);
        return true;
    }, 1000)
}


const main = () => {

    chrome.storage.local.get('filters', function (result) {
        const filters = result.filters || [];
        console.log('filters', filters);

        const vtos = getVtos();
        console.log({ vtos });
        let acceptableVTOs = 0;
        const gapSeconds = 3000;
        let reloadAfter = 25000;

        for (let i = 0; i < vtos.length; i++) {
            const vto = vtos[i];
            if (isVTOAcceptable(filters, vto)) {
                setTimeout(() => {
                    acceptVTO(vto);
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
const inverval = setInterval(() => {
    if (loaded()) {
        clearInterval(inverval);
        main();
    }
}, 200);

const sessionInterval = setInterval(()=>{
    const sessionModal = document.querySelector('div[aria-describedby="sr-session-expires-modal-message"]');
    if (!sessionModal) return;
    const styles = window.getComputedStyle(sessionModal);
    if (styles.display!=='none') {
        const stayLoggedInButton = sessionModal.querySelector('#session-expires-modal-btn-stay-in');
        stayLoggedInButton.click();
        console.log('modal is visible')
    }
}, 300);