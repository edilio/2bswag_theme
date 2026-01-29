document.addEventListener("DOMContentLoaded", function () {
  const dataTag = document.getElementById("location-decorations-data");
  if (!dataTag) return;

  const data = JSON.parse(dataTag.textContent);
  const locationSelect = document.getElementById("location-select");
  const decorationSelect = document.getElementById("decoration-select");
  const locationProperty = document.getElementById("location-property");
  const decorationProperty = document.getElementById("decoration-property");

  const sortedLocations = data.sort((a, b) => a.locationRank - b.locationRank);

  sortedLocations.forEach(loc => {
    const option = document.createElement("option");
    option.value = loc.locationId;
    option.textContent = loc.locationName;
    option.dataset.decorations = JSON.stringify(loc.decorations);
    locationSelect.appendChild(option);
  });

  function populateDecorations(decorations) {
    decorationSelect.innerHTML = "";
    decorations.forEach(dec => {
      const opt = document.createElement("option");
      opt.value = dec.decorationId;
      opt.textContent = dec.decorationName + (dec.priceIncludes ? " (included)" : "");
      decorationSelect.appendChild(opt);
    });
    syncDecorationProperty();
  }

  function syncLocationProperty() {
    if (locationProperty && locationSelect.selectedIndex >= 0) {
      locationProperty.value = locationSelect.options[locationSelect.selectedIndex].textContent;
    }
  }

  function syncDecorationProperty() {
    if (decorationProperty && decorationSelect.selectedIndex >= 0) {
      decorationProperty.value = decorationSelect.options[decorationSelect.selectedIndex].textContent;
    }
  }

  if (sortedLocations.length > 0) {
    locationSelect.value = sortedLocations[0].locationId;
    populateDecorations(sortedLocations[0].decorations);
    syncLocationProperty();
  }

  locationSelect.addEventListener("change", function () {
    const selectedOption = locationSelect.options[locationSelect.selectedIndex];
    const decorations = JSON.parse(selectedOption.dataset.decorations);
    populateDecorations(decorations);
    syncLocationProperty();
  });

  decorationSelect.addEventListener("change", function () {
    syncDecorationProperty();
  });
});
