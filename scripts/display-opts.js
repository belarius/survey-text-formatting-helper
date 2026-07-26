// !--- VARS ---!
// Variable that references the input for the text color input element
let textColorInput = getTextColorInput();
// Variable that references the input for the background color input element
let backgroundColorInput = getBackgroundColorInput();
// Variable that references the markup legend ul
let markupColorsList = getMarkupColorsList();
// Variable that references the markup legend ul
let markupColorsForm = getMarkupColorsForm();

// Set up a stylesheet to be maintained by this javascript file
let stylesheet = new CSSStyleSheet();
stylesheet.insertRule('.input-area #text-output.dynamic-colors { color: #000000; background-color: #ffffff }');
document.adoptedStyleSheets = [stylesheet];

// Set up a variable to hold the select listener and a counter for how many attempts the listener setup function has made
let textColorListener, backgroundColorListener, markupColorsListListener, colorListenerSetupTries = 0;

// Set up management variables for the markup legend edit form
let showForm = false;
let formVals = {};
let markupFormListener, markupFormSubmit;

// !--- FUNCTIONS ---!
// Function to search the HTML for an element with the 'text-color-input' ID and return that element
function getTextColorInput() {
  return document.getElementById('text-color-input');
}
// Function to search the HTML for an element with the 'background-color-input' ID and return that element
function getBackgroundColorInput() {
  return document.getElementById('background-color-input');
}
// Function to search the HTML for an element with the 'markup-colors-list' ID and return that element
function getMarkupColorsList() {
  return document.getElementById('markup-colors-list');
}
// Function to search the HTML for an element with the 'markup-colors-form' ID and return that element
function getMarkupColorsForm() {
  return document.getElementById('markup-colors-form');
}
// Function to search the HTML for an element with the 'markup-edit-button' ID and return that element
function getMarkupEditButton() {
  return document.getElementById('markup-edit-button');
}

// Function to set up the input listeners
function listenToColorSelect() {
  // Get the color input fields
  textColorInput = getTextColorInput();
  backgroundColorInput = getBackgroundColorInput();
  // Get the markup legend ul
  markupColorsList = getMarkupColorsList();
  // Get the markup colors form element
  markupColorsForm = getMarkupColorsForm();
  // Check if all the above fields do exist, and if not, loop the function to try again - unless it has tried too many times
  if (!textColorInput || !backgroundColorInput || !markupColorsList || !markupColorsForm) {
    // Send an error if it's tried this 5 times and hasn't found one of the elements yet
    if (colorListenerSetupTries >= 5) {
      if (!textColorInput) {
        console.error(new Error('Text color input element could not be found.'));
      }
      if (!backgroundColorInput) {
        console.error(new Error('Background color input element could not be found.'));
      }
      if (!markupColorsList) {
        console.error(new Error('Markup legend list element could not be found.'));
      }
      if (!markupColorsForm) {
        console.error(new Error('Markup legend form element could not be found.'));
      }
    } else {
      // Wait half a second...
      setTimeout(() => {
        // ...then increment colorListenerSetupTries
        colorListenerSetupTries++;
        // And recursively call the function to try again
        listenToColorSelect();
      }, 500);
    }
  }
  if (textColorInput && !textColorListener) {
    // If text color input field exists, add an event listener for any "input" events (meaning anything in the input field is changed)
    textColorListener = textColorInput.addEventListener("input", (e) => {
      // When the listener is triggered, call the function that runs the parser
      colorUpdate(e, 'color');
    });
    textColorInput.dispatchEvent(new Event('input'));
  }
  if (backgroundColorInput && !backgroundColorListener) {
    // If background color input field exists, add an event listener for any "input" events (meaning anything in the input field is changed)
    backgroundColorListener = backgroundColorInput.addEventListener("input", (e) => {
      // When the listener is triggered, call the function that runs the parser
      colorUpdate(e, 'background-color');
    });
    backgroundColorInput.dispatchEvent(new Event('input'));
  }
  if (markupColorsList && !markupColorsListListener) {
    // If background color input field exists, create a mutation observer for any changes to the list (meaning any tags get added or removed)
    markupColorsListListener = new MutationObserver((mutationList, observer) => {
      // Call the function to enable or disable the edit button based on if there are tags to edit colors for
      enableEditButton();
      // Call the function to restore the stored values for any previously set custom colors
      setFormValues();
    });
    // Call the same function manually to do initial setup
    enableEditButton();
    // Start the observer
    markupColorsListListener.observe(markupColorsList, { childList: true });
  }
  if (markupColorsForm && !markupFormListener) {
    // If the markup form exists, add an event listener for any input events (meaning any inputs in the markup form are changed)
    markupFormListener = markupColorsForm.addEventListener("input", (e) => {
      // Prevent page reload
      e.preventDefault();
      // When any inputs on the form are changed, request to submit the form
      markupColorsForm.requestSubmit();
    });
  }
  if (markupColorsForm && !markupFormSubmit) {
    // If the markup form exists, add an event listener for any submit events (called from the previous listener)
    markupFormSubmit = markupColorsForm.addEventListener("submit", (e) => {
      // Prevent page reload
      e.preventDefault();
      // Call the function to handle the changes to the form and apply them to the page
      markupColorsUpdate(e);
    });
  }
}

// Function to update the page to reflect the selected background/font color for the output section
function colorUpdate(event, field) {
  // Check if the value in the field is valid
  if (event.target.validity.valid && /[0-9a-fA-F]{6}/.exec(event.target.value)) {
    // If so, then get the stylesheet
    let targetRule = stylesheet.cssRules.item(0);
    if (targetRule) {
      // And set the color value into the appropriate property
      targetRule.style[field] = '#' + event.target.value;
    }
  }
}

// Function to enable or disable the edit button
function enableEditButton() {
  // If the list of tags has at least 1 tag and the button exists
  if (markupColorsList.childNodes.length > 0 && getMarkupEditButton()) {
    // Enable the button (by removing the disabled attribute)
    getMarkupEditButton().removeAttribute('disabled');
    // Otherwise, if the list of tags has no tags and the button exists
  } else if (markupColorsList.childNodes.length <= 0 && getMarkupEditButton()) {
    // Check if the form is currently being shown
    if (showForm) {
      // If so, toggle it to hide it
      toggleMarkupForm();
    }
    // Disable the button
    getMarkupEditButton().setAttribute('disabled', true);
  }
}

// Function to toggle the markup legend form on or off
function toggleMarkupForm() {
  // Toggle the showForm variable
  showForm = !showForm;
  // Change the button text to match new state
  document.getElementById('markup-edit-button-text').innerHTML = showForm ? 'stop editing colors' : 'edit markup colors';
  // If the form is now set to show
  if (showForm) {
    // Remove the 'hide' class from the form
    document.getElementById('markup-colors-form')?.classList.remove('hide');
    // Otherwise, the form is set to hide
  } else {
    // Add the 'hide' class to the form
    document.getElementById('markup-colors-form')?.classList.add('hide');
  }
}

// Function to set form values to stored values (if there are any)
function setFormValues() {
  // If there is at least one custom color value stored
  if (Object.keys(formVals).length > 0) {
    // Run through the stored values
    Object.keys(formVals).forEach(val => {
      // Try to find a field in the existing form that matches the name of the stored value (not guaranteed if a color was set, then its corresponding tag was removed)
      const field = markupColorsForm.querySelector("input[name='" + val + "']");
      // If it finds a matching field
      if (field) {
        // Set the field's value to the stored value
        field.value = formVals[val];
      }
    });
  }
}

// Function to create the markup legend form
function markupColorsUpdate(e) {
  // When the form is submitted, create a FormData object with the current values in the form
  const formData = new FormData(e.target);
  // Iterate through each value
  formData.forEach((val, idx) => {
    // Get the CSS rule selector from the input field's name
    const selector = '.' + idx.split('-').join('.');
    // Create a storage var for the matching index
    let ruleIndex;
    // Iterate through the stylesheet rules, looking for any rules where the selector matches the selector built from the input field's name
    for (let i = 0; i < stylesheet.cssRules.length; i++) {
      // If there is a rule where the selectors match
      if (stylesheet.cssRules[i]['selectorText'] === selector) {
        // Save that index value so it can be removed/edited
        ruleIndex = i;
      }
    }
    // If the index value is not undefined, it means that it found a matching rule
    if (ruleIndex !== undefined) {
      // So we delete the rule so that it can either be cleared or changed later, depending on the value of the input field
      stylesheet.deleteRule(ruleIndex);
      // Also delete the value from the formVals object so it isn't stored anymore
      delete formVals[idx];
    }
    // If there is a value set in the form input field, we need to add it to the stylesheet
    if (val) {
      // Create a new CSS rule with the color value in the field and insert it into the stylesheet 
      stylesheet.insertRule(selector + '{background-color: color-mix(in srgb, #' + val + ' 15%, var(--white) 85%); border-color: #' + val + ' !important;}');
      // Also save the value into the formVals object so it is stored
      formVals[idx] = val;
    }
  });
}

// !--- MAIN ---!
// Attempt to set up the color select listeners, from which all else flows
listenToColorSelect();