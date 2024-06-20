const main = () => {
    document.querySelector('#clearVETFilters').addEventListener('click', () => clearFilters('vetFilters'));
    document.querySelector('#addVETFilter').addEventListener('click', () => addFilter('vetFilters'));
    refreshFilters('vetFilters');
    addRefreshModeChangeListeners();
    refreshRefreshMode();
}

document.addEventListener('DOMContentLoaded', () => {
    main();
});

