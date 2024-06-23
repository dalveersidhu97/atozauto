
const getVets = ({ isTestMode }) => {
    const vets = [];
    const presentations = document.querySelectorAll('div[role="presentation"]');
    const presentation0 = presentations[0];
    const listHeader = presentation0.querySelector('div[data-test-id="ClaimedShiftsColHeader"]');
    const listHeaderText = listHeader.innerText;
    const dateStr = extractDateFromVetHeader(listHeaderText);
    console.log('DATE: ', dateStr);

    presentations.forEach(presentation => {
        const items = presentation.querySelectorAll('div[role="listitem"]')
        console.log(items.length);
        items.forEach(listItem => {
            const heading = listItem.querySelector('div[role="heading"]');
            let button = listItem.querySelector('button[data-test-id="AddOpportunityModalButton"]');
            if (isTestMode)
                button = listItem.querySelector('button[data-test-id="AddOpportunityModalButton"]')
                    || listItem.querySelector('button[data-testid="OpportunityDetailsModalButton"]')
                    || listItem.querySelector('button[data-testid="ViewDetailsButton"]');
            if (button) {
                const timeStr = heading.innerText.split(' ')[0];
                const startTimeStr = timeStr.split('-')[0];
                const endTimeStr = timeStr.split('-')[1];
                const startTime = convertTimeToMins(startTimeStr);
                const vet = {
                    button,
                    startTimeStr,
                    endTimeStr,
                    date: dateStr,
                    startTime,
                    endTime: convertTimeToMins(endTimeStr, startTime)
                }
                console.log(vet);
                vets.push(vet);
            }
        })
    });

    return vets;
}

const acceptVET = (vet, isTestMode, callBack) => {
    console.log('Click VET Button', vet);
    vet.button.click();
    if (isTestMode) {
        setTimeout(() => closeModal(callBack), 2000);
        return;
    }
    setTimeout(() => {
        const btnFound = pressModalButton(/^yes, add shift$/i, () => {
            let counter = 1;
            const interval = setInterval(() => {
                if (counter > 60) {
                    clearInterval(interval);
                    closeModal(callBack);
                }
                pressModalButtonTemp(/^done$/i, () => {
                    clearInterval(interval);
                    callBack();
                });
                pressModalButtonTemp(/^ok$/i, () => {
                    clearInterval(interval);
                    callBack();
                });
                counter++;
            }, 100);
        });
        if (!btnFound) {
            setTimeout(() => closeModal(callBack), 500);
        }
    }, 0)
}

const selectDay = (inputDate, callback) => {
    const parts = inputDate.split(' ');
    const date = parts[0] + ' ' + parseInt(parts[1], 10).toString(); // converting Jul 01 to Jul 1
    const daySelector = document.querySelector('div[data-test-id="day-selector"]');
    if (!daySelector) {
        console.log('No day Selector')
        return;
    }
    const tabList = daySelector.querySelector('div[role="tablist"]');
    let cardFound = false;
    const labelQuery = `div[aria-label*="${date.replace(' ', '  ')}"]`;
    const card = daySelector.querySelector(labelQuery);
    // tabList.scrollLeft = card.offsetLeft - tabList.offsetLeft;
    tabList.scroll({ left: card.offsetLeft - tabList.offsetLeft, behavior: 'smooth' });
    if (!!card) {
        card.click();
        setTimeout(callback, 0);
        cardFound = true;
        console.log('Selected Date: ', date)
    }
    if (!cardFound) console.log('Day Tab not found for ', date);
}

const looper = (arr, fn, whenDoneFn, loopName, delayTime, initialDelay, index) => {
    console.log(loopName, ': Entering', (index || 0) + 1, '/', arr.length);
    let i = index || 0;
    let delay = delayTime || 0;
    let intialDel = initialDelay || 0;
    if (arr.length > i) {
        console.log(loopName, ': Starting');
        const fnToCall = () => fn(arr[i], () => {
            if (arr.length - 1 > i) {
                loopName && console.log(loopName, ': Next');
                looper(arr, fn, whenDoneFn, loopName, delay, initialDelay, i + 1);
            } else {
                whenDoneFn();
                loopName && console.log(loopName, ': Done')
            };
        });
        setTimeout(fnToCall, (i === 0 ? 0 : delay) + (i === 0 ? intialDel : 0));
    } else {
        whenDoneFn();
        loopName && console.log(loopName, ': End')
    }
}

const removeDuplicates = (arr = []) => {
    return arr.filter((item, index) => arr.indexOf(item) === index);
}

const getArryObjectIndex = (obj, arr) => {
    const arrStr = arr.map(f => JSON.stringify(f));
    return arrStr.indexOf(JSON.stringify(obj))
}

const main = (preference) => {
    const refreshMode = preference.refreshMode; // Smart | Full Speed
    const isTestMode = preference.testMode === 'On'; // On | Off
    chrome.storage.local.get('vetFilters', function (result) {
        const filters = result.vetFilters || [];
        const allFilterDates = filters.map(filter => filter.date.split(',')[0])
        console.log('vetFilters', filters);
        const uniqueFilterDates = removeDuplicates(allFilterDates);

        const acceptVETs = (callBackOuter) => {
            let vets = getVets({ isTestMode });
            console.log('Ready VETS', { vets });
            let acceptables = [];
            for (let i = 0; i < vets.length; i++) {
                const vet = vets[i];
                const acceptableFilter = isVTOAcceptable(filters, vet);
                if (!!acceptableFilter) {
                    acceptables.push({ vet, filter: acceptableFilter });
                }
            }
            console.log('Acceptable VETS', { acceptables });

            function compare(a, b) {
                if (getArryObjectIndex(a.filter, filters) < getArryObjectIndex(b.filter, filters))
                    return -1;
                if (getArryObjectIndex(a.filter, filters) > getArryObjectIndex(b.filter, filters))
                    return 1;
                return 0;
            }

            const acceptablesSortedAsFilters = acceptables.sort(compare);
            console.log('Acceptable Sorted As Filters VETS', { acceptablesSortedAsFilters });

            looper(acceptablesSortedAsFilters, (acceptable, callBack) => {
                const vet = acceptable.vet;
                const filter = acceptable.filter;
                acceptVET(vet, isTestMode, () => {
                    !isTestMode && removeFilter('vetFilters', filter);
                    vets = vets.filter(v => {
                        if (JSON.stringify(v) === JSON.stringify(vet)) return false;
                        return true;
                    });
                    callBack();
                });
            }, callBackOuter, 'AcceptVETSLooper', 200);
        }
        let secondsUsed = 0;
        const timeRecorder = setInterval(() => secondsUsed = secondsUsed + 1000, 1000);

        looper(uniqueFilterDates, (date, callBack) => {
            selectDay(date, () => {
                acceptVETs(callBack)
            });
        }, () => {
            if (!filters.length || refreshMode === "Off") return;
            let reloadDelay = refreshMode === 'Smart' ? 20000 : 0;
            clearInterval(timeRecorder);
            const currentMins = new Date().getMinutes();
            console.log(currentMins);
            if ((currentMins > 28 && currentMins < 32) || (currentMins > 58 || currentMins < 2) || (currentMins > 43 && currentMins < 47) || (currentMins > 13 && currentMins < 17)) {
                reloadDelay = refreshMode === 'Smart' ? 1000 : 0;
            }
            const reloadAfter = reloadDelay - secondsUsed < 0 ? 0 : reloadDelay - secondsUsed;
            console.log(`Reloading in ${reloadAfter / 1000} seconds`);
            setTimeout(() => window.location.reload(), reloadAfter);
        }, 'SelectDayLooper', 0, 0)
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
        chrome.storage.local.get('preference', function (result) {
            const preference = result.preference;
            main(preference);
        });
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
