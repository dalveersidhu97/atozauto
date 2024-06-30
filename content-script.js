const getVtos = ({ isTestMode }) => {
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

const acceptVTO = (vto, isTestMode, callBack) => {
    console.log('Click VTO Button', vto);
    if (isTestMode) {
        setTimeout(() => closeModal(callBack), 2000);
        return;
    }
    vto.button.click()
    setTimeout(() => {
        pressModalButton(/^Accept VTO$/i, () => {
            callBack && callBack();
            let counter = 1;
            const interval = setInterval(() => {
                if (counter <= 10) clearInterval(interval);
                pressModalButton(/^ok$/i, () => clearInterval(interval));
                counter++;
            }, 500)
        });
        // pressModalButton(/^CANCEL$/i);
    }, 1000)
}

const acceptAllAcceptables = (filters, callBackOuter, { isTestMode }) => {
    let vtos = getVtos({ isTestMode });
    console.log('Ready VTOs', { vtos });
    let acceptables = [];
    for (let i = 0; i < vtos.length; i++) {
        const vto = vtos[i];
        const acceptableFilter = isVTOAcceptable(filters, vto);
        if (!!acceptableFilter) {
            acceptables.push({ vto, filter: acceptableFilter });
        }
    }
    console.log('Acceptable VTOs', { acceptables });
    const acceptablesSortedAsFilters = sortArray(acceptables, filters);
    console.log('Acceptable Sorted As Filters VTOs', { acceptablesSortedAsFilters });

    looper(acceptablesSortedAsFilters, (acceptable, callBack) => {
        const vto = acceptable.vto;
        const filter = acceptable.filter;
        acceptVTO(vto, isTestMode, () => {
            removeFilter('filters', filter);
            vtos = vtos.filter(v => {
                if (JSON.stringify(v) === JSON.stringify(vto)) return false;
                return true;
            });
            callBack();
        });
    }, callBackOuter, 'AcceptVTOsLooper', 200);
}

const main = (preference) => {
    console.log({preference});
    chrome.storage.local.get('filters', function (result) {
        const refreshMode = preference.refreshMode; // Smart | Full Speed
        const isTestMode = preference.testMode === 'On'; // On | Off
        const userName = getUserInfo().name;
        const filters = (result.filters||[]).filter(f => f.forName.toLowerCase() === userName.toLowerCase()) || [];
        console.log('filters', filters);
        if (!filters.length) return;
    
        acceptAllAcceptables(filters, () => {
            finalCallBack(filters, preference);
        }, { isTestMode });
    });
}

// const mainDep = () => {

//     chrome.storage.local.get('filters', function (result) {
//         const userName = getUserInfo().name;
//         const filters = result.filters.filter(f => f.forName.toLowerCase() === userName.toLowerCase()) || [];
//         console.log('filters', filters);
//         if (!filters.length) return;

//         let vtos = getVtos();
//         console.log({ vtos });
//         let acceptableVTOs = 0;
//         const gapSeconds = 3500;
//         let reloadAfter = 20000;

//         for (let i = 0; i < vtos.length; i++) {
//             const vto = vtos[i];
//             const matchedFilter = isVTOAcceptable(filters, vto);
//             if (!!matchedFilter) {
//                 setTimeout(() => {
//                     acceptVTO(vto, false, () => {
//                         removeFilter('filters', matchedFilter);
//                         vtos = vtos.filter(v => {
//                             if (JSON.stringify(v) === JSON.stringify(vto)) return false;
//                             return true;
//                         });
//                     });
//                 }, acceptableVTOs * gapSeconds);
//                 acceptableVTOs++;
//             }
//         }
//         const currentMins = new Date().getMinutes();
//         console.log(currentMins);
//         if ((currentMins > 28 && currentMins < 32) || (currentMins > 58 || currentMins < 2) || (currentMins > 43 && currentMins < 47) || (currentMins > 13 && currentMins < 17)) {
//             reloadAfter = 600;
//         }
//         if (acceptableVTOs) {
//             reloadAfter = reloadAfter + acceptableVTOs * gapSeconds;
//         }
//         filters.length > 0 && console.log(`Accepted ${acceptableVTOs} VTO(s), Reloading in: `, reloadAfter / 1000, 'Seconds');

//         filters.length > 0 && setTimeout(() => window.location.reload(), reloadAfter)
//     });

// }