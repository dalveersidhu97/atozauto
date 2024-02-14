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

const getVets = () => {
    const vets = [];
    const vetList = document.querySelector('div[role="list"]');
    if(!vetList) return;
    const items = vetList.querySelectorAll('div[role="listitem"]')
    items.forEach(listItem => {
        const heading = listItem.querySelector('div[role="heading"]');
        if (!heading) return;
        const timeStr = heading.innerText.split(' ')[0];
        const startTimeStr = timeStr.split('-')[0];
        const endTimeStr = timeStr.split('-')[1];
        console.log({startTimeStr, endTimeStr})
    })
    return vets;
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
    }, 500)
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
        getVets();
    });

}
console.clear()
setTimeout(main, 2000);