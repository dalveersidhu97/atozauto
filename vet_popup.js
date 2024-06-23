const main = () => {
    document.querySelector('#clearVETFilters').addEventListener('click', () => clearFilters('vetFilters'));
    document.querySelector('#addVETFilter').addEventListener('click', () => addFilter('vetFilters'));

    const startDateInput = document.querySelector('#startDate');
    const endDateInput = document.querySelector('#endDate');
    startDateInput.addEventListener('input', function() {
        endDateInput.value = startDateInput.value;
    });

    refreshFilters('vetFilters');
    addPrefrenceListeners();
    refreshPrefrence();
}

document.addEventListener('DOMContentLoaded', () => {
    main();
});

