const main = () => {
  document.querySelector('#clearFilters').addEventListener('click', () => clearFilters('filters'));
  document.querySelector('#addFilter').addEventListener('click', () => addFilter('filters'));
  refreshFilters('filters');
}

document.addEventListener('DOMContentLoaded', () => {
  main();
});

