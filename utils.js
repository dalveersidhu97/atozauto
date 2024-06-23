
function formatDate(date) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    const month = months[date.getMonth()];
    const dayOfMonth = date.getDate();
    const dayOfWeek = days[date.getDay()];

    return `${month} ${dayOfMonth.toString().padStart(2, '0')}, ${dayOfWeek}`;
}

const convertTimeToMins = (timeStr, startTimeInt) => {
    let time = 0;
    const calcMins = (hours, mins) => {
        return hours * 60 + mins;
    }
    if (timeStr.endsWith('a.m.') || timeStr.endsWith('am')) {
        const units = timeStr.replace('a.m.', '').replace('am', '').split(':');
        const h = +units[0] === 12 ? 0 : +units[0];
        time = calcMins(h, +units[1]);
    } else if (timeStr.endsWith('p.m.') || timeStr.endsWith('pm')) {
        const units = timeStr.replace('p.m.', '').replace('pm', '').split(':');
        const h = +units[0] === 12 ? 0 : +units[0];
        time = 720 + calcMins(h, +units[1]);
    }
    if (!!startTimeInt && time - startTimeInt < 0)
        time = time + 24 * 60;
    return time;
}

function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    // const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
    const timeString = date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    const ampm = timeString.split(' ')[1].split('').join('.').toLowerCase() + '.';
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours)
    minutes = minutes < 10 ? '0' + minutes : minutes; // Add leading zero if minutes < 10
    return hours + ':' + minutes + ampm;
}
function intToTime(intTime) {
    let minutes = intTime % 60;
    let hours = (intTime - minutes) / 60;
    const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
    hours = hours % 12;
    hours = hours ? hours : 12; // Handle midnight (0 hours)
    minutes = minutes < 10 ? '0' + minutes : minutes; // Add leading zero if minutes < 10
    return hours + ':' + minutes + ampm;
}
function intToString(time) {
    let intTime = time;
    if (intTime < 0) intTime = 24 * 60 + intTime;
    let minutes = intTime % 60;
    let hours = (intTime - minutes) / 60;
    return `${hours} hours ${minutes} minutes`
}


const opToText = (op) => {
    let text = '';
    switch (op) {
        case 'eq': {
            text = 'Equals to'; break;
        }
        case 'gt': {
            text = 'Greater than'; break;
        }
        case 'lt': {
            text = 'Less than'; break;
        }
        case 'gte': {
            text = 'Greater than or Equals to'; break;
        }
        case 'lte': {
            text = 'Less than or Equals to'; break;
        }
    }
    return text;
}

const getKey = (obj) => {
    let op = 'eq';
    try {
        op = Object.keys(obj)[0];
    } catch (e) { }
    return op;
}

const refreshFilters = (filterKey) => {
    chrome.storage.local.get(null, function (result) {
        const filters = result[filterKey] || [];
        // const vtoFilters = [
        //   {
        //     startTime: { gt: 300 },
        //     endTime: { lt: 710 },
        //     date: "Feb 09, Fri",
        //   },
        // ];

        const filtersContainer = document.querySelector('#filters');
        if (!filtersContainer) return;
        let filtersHTML = ``;
        filters.forEach(filter => {
            const startOp = getKey(filter.startTime);
            const endOp = getKey(filter.endTime);
            const startTime = filter.startTime[startOp];
            const endTime = filter.endTime[endOp];
            filtersHTML = filtersHTML + `
        <div class="card flex flex-column gap-10">
          <h4>${filter.date} (${filter.forName})</h4>
          <div>Start Time <i>(${opToText(startOp)})</i>: <b>${intToTime(startTime)}</b></div>
          <div>End Time <i>(${opToText(endOp)})</i>: <b>${intToTime(endTime)}</b></div>
          <div>${intToString(endTime - startTime)}</div>
        </div>
        `;
        });
        filtersContainer.innerHTML = filtersHTML || `<div><center>No filter</center></div>`;
    })
}


const addFilter = (filterKey) => {
    const startDatePicker = document.getElementById('startDate');
    const endDatePicker = document.getElementById('endDate');
    const startDate = new Date(startDatePicker.value);
    const endDate = new Date(endDatePicker.value);
    const startTime = convertTimeToMins(formatTime(startDate));
    const endTime = convertTimeToMins(formatTime(endDate), startTime);
    const opStart = document.querySelector("#startOp").value;
    const opEnd = document.querySelector("#endOp").value;
    const forName = document.getElementById('forName').value;


    const selectedDate = new Date(startDate);
    const data = {
        startTime: { [opStart]: startTime },
        endTime: { [opEnd]: endTime },
        date: formatDate(selectedDate),
        forName
    };

    chrome.storage.local.get(null, function (result) {
        const filters = result[filterKey] || [];
        const newFilters = [...filters, data];
        chrome.storage.local.set({ ...result, [filterKey]: newFilters });
        refreshFilters(filterKey);
    });
}

const removeFilter = (filterKey, filterToDelete, callBack) => {
    chrome.storage.local.get(null, function (result) {
        const filters = result[filterKey] || [];
        const newFilters = filters.filter(filter => {
            if (JSON.stringify(filterToDelete) === filter) {
                return false
            }
            return true;
        });
        chrome.storage.local.set({ ...result, [filterKey]: newFilters });
        refreshFilters(filterKey);
    });
}

const clearFilters = (filterKey) => {
    chrome.storage.local.get(null, function (result) {
        chrome.storage.local.set({ ...result, [filterKey]: [] });
        refreshFilters(filterKey);
    })
}

const refreshUserInfo = () => {
    chrome.storage.local.get(null, function (result) {
        const userInfo = result.userInfo;
        if (!userInfo) return;
        document.getElementById('userName').innerText = userInfo.name;
        // document.getElementById('userImage').innerHTML = `<img src="${userInfo.img}" />`;
        document.getElementById('forName').value = userInfo.name;
    });
}

const initPrefrence = (callBack) => {
    console.log('initPrefrence')
    chrome.storage.local.get(null, function (result) {
        if(!result.preference)
            chrome.storage.local.set({ ...result, ['preference']: { refreshMode: 'Smart', testMode: 'Off' } });
        !!callBack && setTimeout(callBack, 500);
    })
}

const setPreference = (key, value, callBack) => {
    chrome.storage.local.get(null, function (result) {
        chrome.storage.local.set({ ...result, ['preference']: { ...(result.preference || {}), [key]: value } });
        !!callBack && setTimeout(callBack, 500);
    })
}

const refreshPrefrence = () => {
    console.log('refreshPrefrence')
    chrome.storage.local.get(null, function (result) {
        if(!result.preference)
            return initPrefrence(refreshPrefrence);
        const preference = result.preference || {};
        const refreshMode = preference.refreshMode;
        const testMode = preference.testMode;
        console.log(preference);

        if (refreshMode === "Smart") {
            document.getElementById("Smart").checked = true;
        } else if (refreshMode === "Full Speed") {
            document.getElementById("Full Speed").checked = true;
        } else if (refreshMode === "Off") {
            document.getElementById("Off").checked = true;
        }
        if (testMode === "On") {
            document.getElementById("testModeOn").checked = true;
        } else if (testMode === "Off") {
            document.getElementById("testModeOff").checked = true;
        }
    });
}

const addPrefrenceListeners = () => {
    const refreshRadioButtons = document.querySelectorAll('input[name="refreshMode"]');
    refreshRadioButtons.forEach(function (radio) {
        radio.addEventListener("change", function () {
            if (this.checked) {
                setPreference('refreshMode', this.value, refreshPrefrence);
            }
        });
    });
    const testModeRadioButtons = document.querySelectorAll('input[name="testMode"]');
    testModeRadioButtons.forEach(function (radio) {
        radio.addEventListener("change", function () {
            if (this.checked) {
                setPreference('testMode', this.value, refreshPrefrence);
            }
        });
    });
}


document.addEventListener('DOMContentLoaded', () => {
    refreshUserInfo();
});