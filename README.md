# The Survey Text Formatting Helper

_Greg Jensen (Concept & Design) & Kayde Arcane (Design & Programming)_

This is the repository for the files needed to host a standalone website that uses a text parser to convert a simple markup to inline HTML. This allows the user to rapidly create short passages of text that incorporate inline HTML and CSS formatting. The intent of this tool is to facilitate the production of content for web surveys, online research tasks, quizzes, and other contexts in which there are concerns that the material may either be processed by bots or may be copied and pasted into LLMs (Large Language Models).

For example, consider the following HTML:

`<p>Please <span style="font-size: 0%;">do not </span>press the red button before you advance to the next page.</p>`

Because the "font-size: 0%;" modification to the website's default text style shrinks those two words down to an invisible size, a human viewing this text on a website would see the following instructions:

> Please press the Red button before you advance to the next page.

However, despite being invisible, the hidden text would still present on such a website and could be selected. If this passage was selected, copied to the clipboard, and pasted elsewhere, the pasted text would read:

> Please do not press the Red button before you advance to the next page.

By providing easy access to a variety of formatting tools, we hope to help researchers, instructors, and others making material for the web create materials with a more defensive, or even adversarial, design philosophy. While a balance must be struck to impact good-faith users as little as possible, and to promote accessibility, we believe that creative use of inline text formatting can help detect, as well as actively interfere with, efforts by bad-faith actors to scrape content, cut corners, and defraud researchers with bogus data.

## Special Thanks

This work follows directly from collaboration with Megan Bruun and Lisa Velkoff.
