Erlebt Website
==============

Invisible Code Sections
-----------------------

On some pages on our website, there's an invisible code section. The only way you can see it is by activating Visual Builder and switching to wireframe mode. It should be the first section on the page. If you see any refernces here to a "code section," this is what that's referring to.

godibox.ts
----------

A script that queries the Google calendar API to populate the Gottesdienst text boxes on our website.

It queries the [Erlebt public calendar](https://calendar.google.com/calendar/embed?src=erlebt-potsdam.de_p9f0ev454afa5g8m919tfa7qoo%40group.calendar.google.com&ctz=Europe%2FBerlin) for the next event with the text `#gottesdienst` in the description. It then uses that date, time, and location information to dynamically update the "Next worship service" message on the website.

As of this writing (2018-07-07) both [Christoph](mailto:christoph@erlebt-potsdam.de) and [Phil](mailto:phil@erlebt-potsdam.de) have read/write access to this calendar.

This Typescript is compiled into Javascript. To build it, run

    npm install
    npm run-script build

The Javascript then gets copy/pasted into 4 places:

* The German home page's code section
* The German Gottesdienst page's code section
* The English home page's code section
* The English worship service page's code section

test.html
---------

A small sandbox where you can test your code without putting it on our live website. Just open the HTML file in your browser.
