const main = () => {
    document.querySelector('#clearVETFilters').addEventListener('click', () => clearFilters('vetFilters'));
    document.querySelector('#addVETFilter').addEventListener('click', () => addFilter('vetFilters'));
    refreshFilters('vetFilters');
    
    const startDateInput = document.querySelector('#startDate');
    const endDateInput = document.querySelector('#endDate');
    startDateInput.addEventListener('input', function() {
        endDateInput.value = startDateInput.value;
    });
    
    addPrefrenceListeners();
    refreshPrefrence();
}

document.addEventListener('DOMContentLoaded', () => {
    main();
});

