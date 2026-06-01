// !--- VARS ---!
// Variable that references the input textarea element
let inputForm = getInputForm();
// Variable that references the output element
let textMarked = getTextMarked();
// Variable that references the output element
let textOutput = getTextOutput();
// Variable that references the raw HTML output element
let htmlOutput = getHtmlOutput();

// Object to store current html options states
let toggles = {
  accessibility: 'on',
  perChar: null
};

// Variable to store current output of the parser
let htmlOut = '';

// Variable for the regex to detect HTML tags in the input
const htmlRegex = /(<([^>]+)>)/gi;

// Set up a variable to hold the input listener and a counter for how many attempts the listener setup function has made
let inputListener, formSubmit, inputListenerSetupTries = 0;

const parseRules = [
  // Null
  {
    // Detects instances of [null]
    regex: /\[null\]/g,
    // Intermediate markup
    marked: '<span class="null mark">',
    // Replaces with <span>
    out: function (str) {
      // Set what the HTML element string is
      return '<span>';
    }
  },
  // Bold
  {
    // Detects instances of [bold]
    regex: /\[bold\]/g,
    // Intermediate markup
    marked: '<span class="bold mark">',
    // Replaces with <span style="font-weight:bold;">
    out: function (str) {
      // Set what the HTML element string is
      let formatting = '<span style="font-weight:bold;">';
      return formatting;
    }
  },
  // Italic
  {
    // Detects instances of [italic]
    regex: /\[italic\]/g,
    // Intermediate markup
    marked: '<span class="italic mark">',
    // Replaces with <span style="font-style:italic;">
    out: function (str) {
      // Set what the HTML element string is
      let formatting = '<span style="font-style:italic;">';
      return formatting;
    }
  },
  // Strikethrough
  {
    // Detects instances of [strike]val1[/strike]
    regex: /\[strike\]/g,
    // Intermediate markup
    marked: '<span class="strike mark">',
    // Replaces with <span style="text-decoration:line-through;">
    out: function (str) {
      // Set what the HTML element string is
      let formatting = '<span style="text-decoration:line-through;"'
        // If accessibility toggle is on, add aria-hidden="true" to the tag
        + (toggles.accessibility ? ' aria-hidden="true" >' : '>');
      return formatting;
    }
  },
  // No Select
  {
    // Detects instances of [noselect]
    regex: /\[noselect\]/g,
    // Intermediate markup
    marked: '<span class="noselect mark">',
    // Replaces with <span style="-webkit-user-select: none; -ms-user-select: none; user-select:none;">
    out: function (str) {
      // Set what the HTML element string is
      let formatting = '<span style="-webkit-user-select: none; -ms-user-select: none; user-select:none;">'
      return formatting;
    }
  },
  // Font Size
  {
    // Detects instances of [size:val1]
    regex: /\[size:((?:\d*?|\d+?.\d+?)(?:%|px|rem|em))\]/g,
    // Intermediate markup
    marked: '<span class="size mark">',
    // Replaces with <span style="font-size:val1;">
    out: function (str, group1) {
      // Set what the HTML element string is
      let formatting = '<span style="font-size:'
        + group1
        // If accessibility toggle is on and the font size value is 0, add aria-hidden="true" to the span
        + (toggles.accessibility && (/^0+?(?:%|px|rem|em)$/.test(group1)) ? ';" aria-hidden="true">' : ';">');
      return formatting;
    }
  },
  // Opacity
  {
    // Detects instances of [opacity:val1]
    regex: /\[opacity:((?:0|1)(?:\.\d+?)*?)\]/g,
    // Intermediate markup
    marked: '<span class="opacity mark">',
    // Replaces with <span style="opacity:val1;">
    out: function (str, group1) {
      // Set what the HTML element string is
      let formatting = '<span style="opacity:'
        + group1
        // If accessibility toggle is on and the opacity value is 0, add aria-hidden="true" to the span
        + (toggles.accessibility && (/0$|0.0$/.test(group1)) ? ';" aria-hidden="true">' : ';">');
      return formatting;
    }
  },
  // Text Color
  {
    // Detects instances of [color:val1]
    regex: /\[color:(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}))\]/g,
    // Intermediate markup
    marked: '<span class="color mark">',
    // Replaces with <span style="color:val1;">
    out: function (str, group1) {
      // Set what the HTML element string is
      let formatting = '<span style="color:'
        + group1
        + ';">';
      return formatting;
    }
  },
  // Highlight Color
  {
    // Detects instances of [mark:val1]
    regex: /\[mark:(#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}))\]/g,
    // Intermediate markup
    marked: '<span class="marked mark">',
    // Replaces with <span style="background-color:val1;">
    out: function (str, group1, group2) {
      // Set what the HTML element string is
      let formatting = '<span style="background-color:'
        + group1
        + ';">';
      return formatting;
    }
  },
  // Uppercase
  {
    // Detects instances of [upper]
    regex: /\[upper\]/g,
    // Intermediate markup
    marked: '<span class="upper mark">',
    // Replaces with <span style="text-transform:uppercase;">
    out: function (str) {
      // Set what the HTML element string is
      let formatting = '<span style="text-transform:uppercase;">';
      return formatting;
    }
  },
  // Lowercase
  {
    // Detects instances of [lower]
    regex: /\[lower\]/g,
    // Intermediate markup
    marked: '<span class="lower mark">',
    // Replaces with <span style="text-transform:lowercase;">
    out: function (str) {
      // Set what the HTML element string is
      let formatting = '<span style="text-transform:lowercase;">';
      return formatting;
    }
  },
  // Blurred
  {
    // Detects instances of [blur:val1]
    regex: /\[blur:(\d+(?:\.\d+?)*?(?:px|rem|em))\]/g,
    // Intermediate markup
    marked: '<span class="blur mark">',
    // Replaces with <span style="filter:blur(val1);">
    out: function (str, group1) {
      // Set what the HTML element string is
      let formatting = '<span style="filter:blur('
        + group1
        // If accessibility toggle is on, add aria-hidden="true" to the span 
        + (toggles.accessibility ? ');" aria-hidden="true">' : ');">');
      return formatting;
    }
  },
  // Reversed
  {
    // Detects instances of [rev]
    regex: /\[rev\]/g,
    // Intermediate markup
    marked: '<span class="rev mark">',
    // Replaces with <span style="direction:rtl; unicode-bidi:bidi-override;">
    // Optionally adds a second span that has the readable value but is invisible if the accessibility toggle is on
    out: function (str) {
      // Returns the new span, which starts with a bonus, invisible span if the accessibility toggle is on
      return (toggles.accessibility ? '<span style="font-size:0; -webkit-user-select: none; -ms-user-select: none; user-select:none;">%%rev-text-to-be-replaced%%</span>'
        // If the accessibility toggle is off, it skips that
        : '')
        // ...Then inserts the span with the inline style to reverse the text
        + '<span style="direction:rtl; unicode-bidi:bidi-override;"'
        //  ...and marks it with 'aria-hidden' if the accessibility toggle is on
        + (toggles.accessibility ? ' aria-hidden="true">' : '>');
    }
  },
];

// !--- FUNCTIONS ---!
// Function to search the HTML for an element with the 'text-input' ID and return that element
function getInputForm() {
  return document.getElementById('text-input');
}
// Function to search the HTML for an element with the 'text-marked' ID and return that element
function getTextMarked() {
  return document.getElementById('text-marked');
}
// Function to search the HTML for an element with the 'text-output' ID and return that element
function getTextOutput() {
  return document.getElementById('text-output');
}
// Function to search the HTML for an element with the 'text-output' ID and return that element
function getHtmlOutput() {
  return document.getElementById('html-output');
}

// Function to set up the input listener
function listenToInput() {
  // Get the input form, marked field, and output field elements, as well as the parser option checkboxes
  inputForm = getInputForm();
  textMarked = getTextMarked();
  textOutput = getTextOutput();
  htmlOutput = getHtmlOutput();

  // Check if all the above fields do exist, and if not, loop the function to try again - unless it has tried too many times
  if (!inputForm || !textMarked || !textOutput || !htmlOutput) {
    // Send an error if it's tried this 5 times and hasn't found one of the elements yet
    if (inputListenerSetupTries >= 5) {
      if (!inputForm) {
        console.error(new Error('Input form element could not be found.'));
      }
      if (!textMarked) {
        console.error(new Error('Marked field element could not be found.'));
      }
      if (!textOutput) {
        console.error(new Error('Output field element could not be found.'));
      }
      if (!htmlOutput) {
        console.error(new Error('HTML output field element could not be found.'));
      }
    } else {
      // Wait half a second...
      setTimeout(() => {
        // ...then increment inputListenerSetupTries
        inputListenerSetupTries++;
        // And recursively call the function to try again
        listenToInput();
      }, 500);
    }
  }
  // If text input field exists and at least one of the listeners isn't set up...
  if (inputForm && (!inputListener || !formSubmit)) {
    // Check if the input listener is set up
    if (!inputListener) {
      // If the input listener isn't set up, then set it up!
      inputListener = inputForm.addEventListener("input", (e) => {
        // Prevent page reload
        e.preventDefault();
        // When any text changes in the form area or any of the toggles are clicked, request to submit the form
        inputForm.requestSubmit();
      });
    }
    // Check if the form submit listener is set up
    if (!formSubmit) {
      // If the form submit listener isn't set up, then set it up!
      formSubmit = inputForm.addEventListener("submit", (e) => {
        // Prevent page reload
        e.preventDefault();
        // When the form is submitted, create a FormData object with the current values in the form (text input and toggle values)
        const formData = new FormData(event.target);

        // Extract option toggles from form into the toggles object
        toggles.accessibility = formData.get('accessibility-toggle');
        toggles.perChar = formData.get('per-character-toggle');

        // If per character toggle is on
        if (toggles.perChar) {
          // Add the class that will add borders around each span tag
          textMarked.classList.add('per-char');
        } else {
          // Otherwise remove that class
          textMarked.classList.remove('per-char');
        }

        // Notif management
        if (document.getElementById('notifications')) {
          // Remove all notifications
          while (document.getElementById('notifications').firstChild) {
            document.getElementById('notifications').removeChild(document.getElementById('notifications').lastChild);
          }
          // Add notifications for toggles
          if (formData.get('accessibility-toggle')) {
            insertNotif('accessibility-notif', 'Screen reader accessibility rules applied.');
          }
          if (toggles.perChar) {
            insertNotif('per-char-notif', 'Per-character formatting applied.');
          }
        }

        // Call the function that runs the parser, passing in the current form values
        parse(formData);
      });
      // Also run the parser routine to set the outputs to reflect the default input
      inputForm.requestSubmit();
    }
  }
}

// Function to run the parser and update the output elements
function parse(formData) {
  // Extract input text from form textarea into a variable, replacing all angle brackets with temp placeholders
  const str = formData.get('textarea-input').replaceAll('<', '⸦').replaceAll('>', '⸧');
  // Create variables for the eventual outputs
  let marked = '', output = '';

  // Set the regex that detects any square bracket tags
  let tagRegex = /(\[(?:\/?[^\]^\/^ ^\n]+?)\])/;

  // Split the input string into an array
  let strArray = str.split(tagRegex);
  // Create an empty tag array to store opening tags as the parser goes through the input
  let tagArray = [];
  let maxDepth = 0;
  // Create an empty tag array just for the reverse tags for special nesting necessities, and an empty string for assembling accessibility alt text
  let revTags = [];
  let revAltText = [];
  // Iterate through the input string array
  strArray.forEach((val, idx) => {
    // If the current chunk in the array is a tag
    if (tagRegex.exec(val)) {
      // If the current chunk is a closing tag
      if (val.startsWith('[/')) {
        // Check if the tag array has a value in it
        if (tagArray.at(-1)) {
          // Get the name of the last tag in the tag array
          let currTag = tagArray.at(-1).replace(/(\[|\/|\])/g, '').split(':')[0];
          // And check if the incoming closing tag matches it
          if (val.includes(currTag)) {
            // If so, pop that tag off the tag array
            tagArray.pop();
            // Also update the reverse tags array in case a reverse tag was removed
            revTags = tagArray.filter((val) => /\[rev\]/.exec(val));
            // Then add a closing span to the outputs
            marked += replaceCloseTag(val);
            output += replaceCloseTag(val);
          } else {
            // If not, there's a tag ordering issue that needs to be handled
            // First, find the index in the tag array of the last tag that matches
            let idxOfMatchingTag = tagArray.findLastIndex((elem) => elem.includes(val.replace(/(\[|\/|\])/g, '')));
            // If it finds a match in the tag array
            if (idxOfMatchingTag > -1) {
              // Add closing spans to the outputs equal to the number of tags between the tag that needs closing and the last tag in the array
              for (let index = idxOfMatchingTag; index < tagArray.length; index++) {
                marked += replaceCloseTag(tagArray[index]);
                output += replaceCloseTag(tagArray[index]);
              }
              // Remove the closed tag from the tag array
              tagArray.splice(idxOfMatchingTag, 1);
              // Also update the reverse tags array in case a reverse tag was removed
              revTags = tagArray.filter((val) => /\[rev\]/.exec(val));
              // Then re-open all of the rest of the tags that came after that removed tag
              for (let index = idxOfMatchingTag; index < tagArray.length; index++) {
                let reAddedTag = replaceOpenTag(tagArray[index]);
                marked += reAddedTag.marked;
                output += reAddedTag.output;
              }
            } else {
              // In the case that there's not a matching tag, throw a warning
              // insertNotif('warning-notif-close', 'Warning: Possible mismatched closing tag.');
              // Then just pass the tag through literal (with error styling)
              marked += '<span class="tag-error">' + val + '</span>';
              output += val;
            }
          }
        } else {
          // In the case that there's a closing tag with no current opening tags, throw a warning
          // insertNotif('warning-notif-orphan', 'Warning: Closing tag with no related opening tag.');
          // Then just pass the tag through literal (with error styling)
          marked += '<span class="tag-error">' + val + '</span>';
          output += val;
        }
      } else {
        // Otherwise, it's an opening tag to be replaced
        // Run the replacement function
        let addedTag = replaceOpenTag(val);
        // And check if the output differs from the input
        if (val !== addedTag.output) {
          // If so, it's a valid tag, and should be pushed to the tag array
          if (/\[rev\]/.exec(val)) {
            // Reverse tags are special and need to add closing spans to the outputs equal to the number of tags currently open
            let tempMarked = '', tempOutput = '';
            // First find the most recently opened reverse tag, if there is one
            let idxOfMatchingTag = tagArray.findLastIndex((elem) => elem.includes(val.replace(/(\[|\/|\])/g, '')));
            // If there is, increment the index so it doesn't re-establish the rev tag; if not, just start at the beginning
            idxOfMatchingTag = idxOfMatchingTag > -1 ? idxOfMatchingTag + 1 : 0;
            // Then close all tags up to the first reverse tag
            for (let index = idxOfMatchingTag; index < tagArray.length; index++) {
              tempMarked += replaceCloseTag(tagArray[index]);
              tempOutput += replaceCloseTag(tagArray[index]);
            }
            // Add the reverse tag to the beginning of the array
            tagArray.unshift(val);
            // Also update the reverse tags array
            revTags = tagArray.filter((val) => /\[rev\]/.exec(val));
            // Then re-open all of the rest of the tags that were already there
            for (let index = idxOfMatchingTag; index < tagArray.length; index++) {
              let reAddedTag = replaceOpenTag(tagArray[index]);
              tempMarked += reAddedTag.marked;
              tempOutput += reAddedTag.output;
            }
            addedTag.marked = tempMarked;
            addedTag.output = tempOutput;
            // Reversed text accessibility/nesting stuff
            // If this is not the first reverse tag in the current stack
            if (revTags.length > 1) {
              // Remove the added accessibility stuff meant to assist screen readers - it will be handled by the top level reverse tag
              addedTag.output = addedTag.output.replace(/<span style="(?:.*?)">%%rev-text-to-be-replaced%%<\/span>/, '');
            }
            // If even number of rev tags
            if (revTags.length % 2 === 0) {
              // Swap the direction value of the current reverse tag to left-to-right
              addedTag.output = addedTag.output.replace(/direction:rtl;/, 'direction:ltr;');
            }
          } else {
            // Otherwise it's not a reverse tag and doesn't need any special handling
            tagArray.push(val);
          }
        } else {
          // Otherwise, the opening tag is invalid, so throw a warning
          // insertNotif('warning-notif-open', 'Warning: Invalid opening tag.');
          // Then set the marked value to the invalid tag's literal text (with error styling)
          addedTag.marked = '<span class="tag-error">' + addedTag.marked + '</span>';
        }

        marked += addedTag.marked;
        output += addedTag.output;
      }
    } else {
      // Otherwise, it's just raw input text
      let tempMarked = '', tempOutput = '';
      // If the per character toggle is on, we need to do some extra funky stuff
      // If there's a most recent opened tag and it's not the reverse tag, do the per character stuff
      if (toggles.perChar && tagArray.at(-1) && /\[rev\]/.exec(tagArray.at(-1)) === null) {
        // First, get the values for the opening tag that'll be repeatedly opened for each character
        let openTag = replaceOpenTag(tagArray.at(-1));
        // Split the input val into individual characters
        let valSplit = val.split('');
        // Iterate through that array of characters
        for (let index = 0; index < valSplit.length; index++) {
          // Append a closing span and then an opening span to the end of each character except the last one
          tempMarked += valSplit[index] + (index !== valSplit.length - 1 ? replaceCloseTag(tagArray.at(-1)) + openTag.marked : '');
          tempOutput += valSplit[index] + (index !== valSplit.length - 1 ? replaceCloseTag(tagArray.at(-1)) + openTag.output : '');
        }
      } else {
        // Otherwise, no extra work needed, pass the val through
        tempMarked = val;
        tempOutput = val;
      }
      marked += tempMarked;
      output += tempOutput;

      // Additionally, if there's currently at least one reverse tag in play, we have to check how many
      if (revTags.length > 0) {
        // Then we check to make sure there's not a tag in the tag array that would need to be ignored by screen readers
        if (tagArray.findLastIndex((elem) => /\[strike\]/.exec(elem)) < 0
          && tagArray.findLastIndex((elem) => /\[blur:/.exec(elem)) < 0
          && tagArray.findLastIndex((elem) => /\[size:0+?(?:%|px|rem|em)\]/.exec(elem)) < 0
          && tagArray.findLastIndex((elem) => /\[opacity:(?:0|0.0+?)\]/.exec(elem)) < 0) {
          // If an even number of reverse tags
          if (!revAltText[revTags.length - 1]) {
            revAltText[revTags.length - 1] = '';
          }
          if (revTags.length % 2 === 0) {
            // Add the raw input text to the alt text string as is - no need to reverse it
            revAltText[revTags.length - 1] = revAltText[revTags.length - 1] + val;
          } else {
            // Otherwise, the text needs to be reversed and then added to the alt text string
            revAltText[revTags.length - 1] = val.split('').reverse().join('') + revAltText[revTags.length - 1];
          }
        }
      }
    }

    if (tagArray.length > maxDepth) {
      maxDepth = tagArray.length;
    }

    // Check if the current item is a closing reverse tag and that there's at least 1 other reverse tag in the array
    if (/\[\/rev\]/.exec(val) && revTags.length > 0) {
      // If so, add the alt text of the just-closed reverse tag to the alt text of the reverse tag above it
      if (revTags.length % 2 === 0) {
        // If even layers deep, append to the end of the prior string
        revAltText[revTags.length - 1] = revAltText[revTags.length - 1] + revAltText[revTags.length];
      } else {
        // If odd layers deep, prepend to the start of the prior string
        revAltText[revTags.length - 1] = revAltText[revTags.length] + revAltText[revTags.length - 1];
      }
      // And empty the alt text of the just-closed reverse tag
      revAltText[revTags.length] = undefined;
    }

    // Check if there's a string built in the alt text variable while there's no reverse tags in the array
    if (revTags.length === 0 && revAltText[0] !== undefined) {
      // If so, that means we've completely escaped a string of reverse tags and need to add the alt text into the proper place
      output = output.replace(/%%rev-text-to-be-replaced%%/, revAltText[0]);
      // And then empty the alt text string for the next time it's needed
      revAltText = [];
    }
  });

  // Variably adjust the line height of the markup column - add 0.15 to the base line height for every layer deep the input stacked (up to 6)
  const heightAdjust = 0.15 * Math.min(Math.max(maxDepth, 0), 6);
  textMarked.style.lineHeight = 1.5 + heightAdjust;
  // Also adjust the top padding so it looks nice and even with the other columns
  textMarked.style.paddingTop = "calc(var(--spacing) - (" + heightAdjust + " / 2) * 1rem)";

  // If we reach the end of the string and there's some unclosed tags remaining
  if (tagArray.length > 0) {
    // Loop through the tag array and add in closing spans for each one
    for (let index = 0; index < tagArray.length; index++) {
      marked += replaceCloseTag(tagArray[index]);
      output += replaceCloseTag(tagArray[index]);
    }
  }

  // If we reach the end of the string and there's some unclosed reverse tags
  if (revTags.length > 0) {
    // Loop through the reverse tag array and build the alt text string from what's currently there
    for (let index = revTags.length - 1; index >= 0; index--) {
      if (index % 2 === 0) {
        // If even layers deep, append to the end of the prior string
        revAltText[index - 1] = revAltText[index - 1] + revAltText[index];
      } else {
        // If odd layers deep, prepend to the start of the prior string
        revAltText[index - 1] = revAltText[index] + revAltText[index - 1];
      }
    }
    // Then add the alt text to the output in the proper place
    output = output.replace(/%%rev-text-to-be-replaced%%/, revAltText[0]);
  }

  // Replace the placeholder chars for angle brackets with the HTML entity implementations of angle brackets
  marked = marked.replaceAll('⸦', '&lt;').replaceAll('⸧', '&gt;');
  output = output.replaceAll('⸦', '&lt;').replaceAll('⸧', '&gt;');

  // Set the marked element's innerHTML (aka displayed text) to the marked version of the string
  textMarked.innerHTML = marked;
  // Set the output element's innerHTML (aka displayed text) to the parsed version of the string
  textOutput.innerHTML = output;
  // Set the element's text to the parsed version of the string, but escaped (so that it shows the HTML code)
  htmlOutput.innerText = output;

  // Save the parsed output to a variable (so that it can be copied by the user)
  htmlOut = output;
}

// Function to replace opening tags with the relevant opening spans
function replaceOpenTag(tag) {
  let marked = tag, output = tag;
  // For each rule, find all instances that match the rule and replace with the related output formatting
  parseRules.forEach((rule) => {
    // First for the marked version
    marked = marked.replace(rule.regex, rule.marked);
    // Then for the output version
    output = output.replace(rule.regex, rule.out);
  });
  return { marked: marked, output: output };
}

// Function to replace closing tags with closing spans (not really that necessary to do this way, but i did it to allow adding extra stuff to closing spans if needed)
function replaceCloseTag(tag) {
  return '</span>';
}

// Function to insert notifications into the notification area
function insertNotif(id, text) {
  // Get the notification section element
  const notifSection = document.getElementById('notifications');
  // If the notification section exists, and the id of the new notification doesn't already exist as an element
  if (notifSection && !document.getElementById(id)) {
    // Create a new div element
    const newNotif = document.createElement('div');
    // Add the 'notification' class to it
    newNotif.classList.add('notification');
    if (id.endsWith('-warn')) {
      newNotif.classList.add('warning');
    }
    // Create a new text node with the notification text in it
    const notifContent = document.createTextNode(text);
    // Append that content to the new div element
    newNotif.appendChild(notifContent);
    // Set the new div element's id to the notification id
    newNotif.id = id;
    // And append the new div as a child of the notification section element
    notifSection.appendChild(newNotif);
  }
}

// Function to copy the current output to user clipboard
async function copyOutput() {
  // Setup for creating the item to put in the clipboard
  const type = "text/plain";
  const clipboardItemData = {
    [type]: htmlOut,
  };
  const clipboardItem = new ClipboardItem(clipboardItemData);
  // Put the new clipboard item with the parsed output into the clipboard when available to
  await navigator.clipboard.write([clipboardItem]);
}

// !--- MAIN ---!
// Attempt to set up the input listener, from which all else flows
listenToInput();