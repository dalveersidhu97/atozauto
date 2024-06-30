const main = () => {
  document.querySelector('#clearFilters').addEventListener('click', () => clearFilters('filters'));
  document.querySelector('#addFilter').addEventListener('click', () => addFilter('filters'));
  refreshFilters('filters');

  const startDateInput = document.querySelector('#startDate');
  const endDateInput = document.querySelector('#endDate');
  startDateInput.addEventListener('input', function () {
    endDateInput.value = startDateInput.value;
  });

  addPrefrenceListeners();
  refreshPrefrence();
}

document.addEventListener('DOMContentLoaded', () => {
  main();
});

