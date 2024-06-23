const convertTimeToMins = (timeStr, startTimeInt) => {
    let time = 0;
    const calcMins = (hours, mins) => {
        return hours * 60 + mins;
    }
    if (timeStr.endsWith('a.m.') || timeStr.endsWith('am')) {
        const units = timeStr.replace('a.m.', '').replace('am', '').split(':');
        const h = +units[0]===12?0:+units[0];
        time = calcMins(h, +units[1]);
    } else if (timeStr.endsWith('p.m.') || timeStr.endsWith('pm')) {
        const units = timeStr.replace('p.m.', '').replace('pm', '').split(':');
        const h = +units[0]===12?0:+units[0];
        time = 720 + calcMins(h, +units[1]);
    }
    if (!!startTimeInt && time-startTimeInt<0)
        time = time + 24*60;
    return time;
}

function extractDateFromVetHeader(inputString) {
    const regex = /\b\w{3}, (\w{3} \d{1,2})\b/;
    const match = inputString.match(regex);

    if (match) {
        return match[1];
    } else {
        return undefined;
    }
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
    const modal = document.querySelector('div[data-test-component="StencilModal"]'); // try role="dialog"
    if (!modal) {
        console.log('No modal');
        return false;
    }
    const button = contains(modal, 'button', regex);
    if (!button) {
        console.log('No button', regex);
        return false;
    }
    button.click();
    callBack && callBack();
    return true;
}
const pressModalButtonTemp = (regex, callBack) => {
    const modals = document.querySelectorAll('div[role="dialog"]');
    let btnFound = false;
    modals.forEach(modal=> {
        if (!modal) {
            console.log('No modal');
        }else {
            const button = contains(modal, 'button', regex);
            if (!button) {
                console.log('No button', regex);
            }else {
                button.click();
                callBack && callBack();
                btnFound = true;
            }
        }
    });
    return btnFound;
}

const closeModal = (callBack) => {
    const modals = document.querySelectorAll('div[role="dialog"]'); // try role="dialog"
    modals.forEach(modal => {
        if (!modal) {
            console.log('No modal');
        }else {
            console.log({ modal })
            const button = contains(modal, 'button[data-test-component="ModalCloseButton"]', '');
            if (!button) {
                console.log('No button');
            }else {
                button.click();
                callBack && callBack();
            }
        } 
    })
    
}