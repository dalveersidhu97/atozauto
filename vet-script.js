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

function extractDateFromVetHeader(inputString) {
    const regex = /\b\w{3}, (\w{3} \d{1,2})\b/;
    const match = inputString.match(regex);

    if (match) {
        return match[1];
    } else {
        return undefined;
    }
}

const getVets = () => {
    const vets = [];
    const presentations = document.querySelectorAll('div[role="presentation"]');
    presentations.forEach(presentation => {
        const listHeaderText = presentation.querySelector('div[data-test-id="ClaimedShiftsColHeader"]').innerText;
        const dateStr = extractDateFromVetHeader(listHeaderText);
        console.log(dateStr)
        const items = presentation.querySelectorAll('div[role="listitem"]')
        console.log(items.length);
        items.forEach(listItem => {
            const heading = listItem.querySelector('div[role="heading"]');
            // const button = listItem.querySelector('button[data-test-id="AddOpportunityModalButton"]');
            const button = listItem.querySelector('button[data-testid="OpportunityDetailsModalButton"]');
            if (button) {
                const timeStr = heading.innerText.split(' ')[0];
                const startTimeStr = timeStr.split('-')[0];
                const endTimeStr = timeStr.split('-')[1];
                const vet = {
                    button,
                    startTimeStr,
                    endTimeStr,
                    date: dateStr,
                    startTime: convertTimeToMins(startTimeStr),
                    endTime: convertTimeToMins(endTimeStr)
                }
                console.log(vet);
                vets.push(vet);
            }
        })
    });

    return vets;
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

const closeModal = (callBack) => {
    const modal = document.querySelector('div[data-test-component="StencilModal"]');
    if (!modal) {
        console.log('No modal');
        return false;
    }
    const button = contains(modal, 'button[data-test-component="ModalCloseButton"]', '');
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
        // pressModalButton(/^add shift$/i, ()=>{
        //     callBack && callBack();
        //     let counter = 1;
        //     const interval = setInterval(()=>{
        //         if(counter<=10) clearInterval(interval);
        //         pressModalButton(/^ok$/i, ()=>clearInterval(interval));
        //         counter++;
        //     }, 500)
        // });
        closeModal(callBack);
    }, 1000)
}
const selectDay = (date) => {
    const daySelector = document.querySelector('div[data-test-id="day-selector"]');
    if (!daySelector) return;
    const tabList = daySelector.querySelector('div[role="tablist"]');
    const cards = tabList.querySelectorAll('div[role="tab"]');
    cards.forEach(card => {
        if (card.innerText.includes(date)) {
            card.click();
        }
    })
}

const main = () => {

    chrome.storage.local.get('vetFilters', function (result) {
        const filters = result.vetFilters || [];
        console.log('vetFilters', filters);

        for (let i = 0; i < filters.length; i++) {
            const filter = filters[i];
            const date = filter.date.split(',')[0];
            selectDay(date);
        }

        if (!filters.length) return;
        let vets = getVets();
        console.log({vets});
        let acceptableVTOs = 0;
        const gapSeconds = 3000;
        let reloadAfter = 25000;
        
        for (let i = 0; i < vets.length; i++) {
            const vto = vets[i];
            const matchedFilter = isVTOAcceptable(filters, vto);
            if (!!matchedFilter) {
                setTimeout(() => {
                    acceptVTO(vto, () => {
                        removeFilter('vetFilters', matchedFilter);
                        vets = vets.filter(v => {
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
        filters.length > 0 && console.log(`Accepted ${acceptableVTOs} VET(s), Reloading in: `, reloadAfter / 1000, 'Seconds');

        filters.length > 0 && setTimeout(() => window.location.reload(), reloadAfter)
    });

}
console.clear();
setUserInfo();
setTimeout(main, 2000);