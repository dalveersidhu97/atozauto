
const getVets = () => {
    const vets = [];
    const presentations = document.querySelectorAll('div[role="presentation"]');
    const presentation0 = presentations[0];
    const listHeader = presentation0.querySelector('div[data-test-id="ClaimedShiftsColHeader"]');
    const listHeaderText = listHeader.innerText;
    const dateStr = extractDateFromVetHeader(listHeaderText);

    presentations.forEach(presentation => {
        const items = presentation.querySelectorAll('div[role="listitem"]')
        console.log(items.length);
        items.forEach(listItem => {
            const heading = listItem.querySelector('div[role="heading"]');
            const button = listItem.querySelector('button[data-test-id="AddOpportunityModalButton"]');
            // const button = listItem.querySelector('button[data-testid="OpportunityDetailsModalButton"]');
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

const acceptVET = (vto, callBack) => {
    console.log('Click VET Button', vto);
    vto.button.click()
    setTimeout(() => {
        // pressModalButton(/^yes, add shift$/i, ()=>{
        //     callBack && callBack();
        //     let counter = 1;
        //     const interval = setInterval(()=>{
        //         if(counter<=10) clearInterval(interval);
        //         pressModalButton(/^done$/i, ()=>clearInterval(interval));
        //         pressModalButton(/^ok$/i, ()=>clearInterval(interval));
        //         counter++;
        //     }, 500);
        // });
        setTimeout(() => closeModal(callBack), 200);
    }, 200)
}
const selectDay = (date, callback) => {
    const daySelector = document.querySelector('div[data-test-id="day-selector"]');
    if (!daySelector) return;
    const tabList = daySelector.querySelector('div[role="tablist"]');
    const cards = tabList.querySelectorAll('div[role="tab"]');
    cards.forEach(card => {
        if (card.innerText.includes(date)) {
            card.click();
            setTimeout(callback, 200);
        }
    })
}

const looper = (arr, fn, whenDoneFn, loopName, delayTime, index) => {
    console.log(loopName, ': Entering', (index||0)+1, '/', arr.length);
    let i = index || 0;
    let delay = delayTime || 0;
    if (arr.length > i){
        console.log(loopName, ': Starting');
        const fnToCall = ()=>fn(arr[i], () => {
            if (arr.length - 1 > i) {
                loopName && console.log(loopName, ': Next');
                looper(arr, fn, whenDoneFn, loopName, delay, i + 1);
            }else {
                whenDoneFn()
                loopName && console.log(loopName, ': Done')
            };
        });
        setTimeout(fnToCall, delay);
    }else {
        whenDoneFn()
        loopName && console.log(loopName, ': END')
    }
}

const main = () => {

    chrome.storage.local.get('vetFilters', function (result) {
        const filters = result.vetFilters || [];
        console.log('vetFilters', filters);

        const acceptVETs = (callBackOuter) => {
            let vets = getVets();
            console.log('Ready VETS', { vets });
            let acceptableVETs = [];
            for (let i = 0; i < vets.length; i++) {
                const vet = vets[i];
                const acceptableVET = isVTOAcceptable(filters, vet);
                if (!!acceptableVET) {
                    acceptableVETs.push(vet);
                }
            }

            looper(acceptableVETs, (vet, callBack) => {
                acceptVET(vet, () => {
                    // removeFilter('vetFilters', acceptableFilter);
                    // vets = vets.filter(v => {
                    //     if (JSON.stringify(v) === JSON.stringify(vet)) return false;
                    //     return true;
                    // });
                    callBack();
                });
            }, callBackOuter, 'AcceptVETSLooper', 0);
        }
        let secondsUsed = 0;
        const timeRecorder = setInterval(()=>secondsUsed=secondsUsed+1, 1000);

        looper(filters, (filter, callBack) => {
            let date = filter.date.split(',')[0];
            selectDay(date, () => {
                acceptVETs(callBack)
            });
        }, () => {
            let reloadDelay = 1000;
            clearInterval(timeRecorder);
            const currentMins = new Date().getMinutes();
            console.log(currentMins);
            if ((currentMins > 28 && currentMins < 32) || (currentMins > 58 || currentMins < 2) || (currentMins > 43 && currentMins < 47) || (currentMins > 13 && currentMins < 17)) {
                reloadDelay = 1000;
            }
            const reloadAfter = reloadDelay-secondsUsed<0?0:reloadDelay-secondsUsed;
            console.log(`Reloading in ${reloadAfter/1000} seconds`);
            setTimeout(()=>window.location.reload(), reloadAfter);
        }, 'SelectDayLooper', 0)

        // if (!filters.length) return;

        // const currentMins = new Date().getMinutes();
        // console.log(currentMins);
        // if ((currentMins > 28 && currentMins < 32) || (currentMins > 58 || currentMins < 2) || (currentMins > 43 && currentMins < 47) || (currentMins > 13 && currentMins < 17)) {
        //     reloadAfter = 1000;
        // }
        // if (acceptableVTOs) {
        //     reloadAfter = reloadAfter + acceptableVTOs * gapSeconds;
        // }
        // filters.length > 0 && console.log(`Accepted ${acceptableVTOs} VET(s), Reloading in: `, reloadAfter / 1000, 'Seconds');

        // filters.length > 0 && setTimeout(() => window.location.reload(), reloadAfter);
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