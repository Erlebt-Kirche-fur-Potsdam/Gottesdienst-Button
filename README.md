Erlebt Website
==============

Invisible Code Section
----------------------

On the home page, there's an invisible code section. The only way you can see it is by activating Visual Builder and switching to wireframe mode. Scroll down to the bottom of the page, and it should be the last thing you see.

button.html
-----------

Calculates the date for the next Gottesdienst and puts that text in the "godibox" button.

This code gets copy/pasted to four places (well, two places, each with a Deutsch and English version).

* On the home page the code is copy/pasted into a "Code" module at the bottom of the page in the invisible code section. _Do not_ include the top `div`. Only copy/paste the `script` tag plus its contents.
* On the Gottesdienst / Worship Service page, we don't have a proper "Visual Builder" button. It's actually just a `div`. That's what the `div` tag is all about in `button.html`. _Everything_ in `button.html` gets pasted to a code module on the Gottesdienst / Worship Service page.
