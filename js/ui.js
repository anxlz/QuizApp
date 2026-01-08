function initCustomSelects() {
  document.querySelectorAll('.custom-select').forEach(selectElement => {
    let selectTrigger = selectElement.querySelector('.custom-select-trigger');
    let selectOptions = selectElement.querySelectorAll('.custom-select-option');
    let hiddenInputField = selectElement.parentElement.querySelector('input[type="hidden"]');
    let displayText = selectTrigger.querySelector('.custom-select-text');
    let displayIcon = selectTrigger.querySelector('.custom-select-icon');

    selectTrigger.addEventListener('click', (clickEvent) => {
      clickEvent.stopPropagation();
      document.querySelectorAll('.custom-select.open').forEach(openSelect => {
        if (openSelect !== selectElement) openSelect.classList.remove('open');
      });
      selectElement.classList.toggle('open');
    });

    selectOptions.forEach(optionElement => {
      optionElement.addEventListener('click', () => {
        let optionValue = optionElement.dataset.value;
        let optionIcon = optionElement.querySelector('i').outerHTML;
        let optionText = optionElement.textContent.trim();

        selectElement.dataset.value = optionValue;
        if (hiddenInputField) hiddenInputField.value = optionValue;
        displayText.textContent = optionText;
        displayIcon.innerHTML = optionIcon;

        selectOptions.forEach(option => option.classList.remove('selected'));
        optionElement.classList.add('selected');
        selectElement.classList.remove('open');
      });
    });
  });
}

function initNumberInputs() {
  document.querySelectorAll('.number-btn').forEach(buttonElement => {
    buttonElement.addEventListener('click', () => {
      let inputWrapper = buttonElement.closest('.number-input-wrapper');
      let numberInput = inputWrapper.querySelector('input[type="number"]');
      let minimumValue = parseInt(numberInput.min) || 1;
      let maximumValue = parseInt(numberInput.max) || 50;
      let currentValue = parseInt(numberInput.value) || minimumValue;

      if (buttonElement.dataset.action === 'increment' && currentValue < maximumValue) {
        numberInput.value = currentValue + 1;
      } else if (buttonElement.dataset.action === 'decrement' && currentValue > minimumValue) {
        numberInput.value = currentValue - 1;
      }
    });
  });
}

function initClickOutside() {
  document.addEventListener('click', () => {
    document.querySelectorAll('.custom-select.open').forEach(openSelect => openSelect.classList.remove('open'));
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initCustomSelects();
  initNumberInputs();
  initClickOutside();
});