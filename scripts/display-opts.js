// !--- VARS ---!
// Variable that references the input for the text color input element
let textColorInput = getTextColorInput();
// Variable that references the input for the background color input element
let backgroundColorInput = getBackgroundColorInput();

// Set up a stylesheet to be maintained by this javascript file
let stylesheet = new CSSStyleSheet();
stylesheet.insertRule('.input-area #text-output.dynamic-colors { color: #000000; background-color: #ffffff }');
document.adoptedStyleSheets = [stylesheet];

// Set up a variable to hold the select listener and a counter for how many attempts the listener setup function has made
let textColorListener, backgroundColorListener, colorListenerSetupTries = 0;

// !--- FUNCTIONS ---!
// Function to search the HTML for an element with the 'text-color-input' ID and return that element
function getTextColorInput() {
  return document.getElementById('text-color-input');
}
// Function to search the HTML for an element with the 'background-color-input' ID and return that element
function getBackgroundColorInput() {
  return document.getElementById('background-color-input');
}

// Function to set up the input listener
function listenToColorSelect() {
  // Get the color input fields
  textColorInput = getTextColorInput();
  backgroundColorInput = getBackgroundColorInput();
  // Check if all the above fields do exist, and if not, loop the function to try again - unless it has tried too many times
  if (!textColorInput || !backgroundColorInput) {
    // Send an error if it's tried this 5 times and hasn't found one of the elements yet
    if (colorListenerSetupTries >= 5) {
      if (!textColorInput) {
        console.error(new Error('Text color input element could not be found.'));
      }
      if (!backgroundColorInput) {
        console.error(new Error('Background color input element could not be found.'));
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
}

// Function to update the page to reflect the selected font type
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

// !--- MAIN ---!
// Attempt to set up the select listener, from which all else flows
listenToColorSelect();