{

    const apiRoot = 'https://www.googleapis.com/calendar/v3/';
    const calendarId = 'erlebt-potsdam.de_p9f0ev454afa5g8m919tfa7qoo@group.calendar.google.com'
    const eventSearchQuery = '#gottesdienst'

    const gApiKey = 'AIzaSyC_W6txNNzFUfaYFvePRqO1Tti3aJ73pHs';
    // Normally Google API keys should be kept secret. However:
    //
    //   1. We can use this API key for 1 million queries per day, after which it
    //      will stop working. We will not be billed.
    //   2. We restrict this key so that it can only be used from the referrer
    //      "https://erlebt-potsdam.de/*".
    //
    // While these are not bulletproof protections, it at least makes it unlikely
    // we will be harmed by publicly exposing our key.

    let locale = "de-DE";
    let isEnglish = location.pathname.match(/\/en\//);
    if (isEnglish) {
        locale = "en-GB";
    }

    interface ICalendarEvent {
        readonly kind: 'calendar#event';
        readonly id: string;
        readonly summary: string;
        readonly htmlLink: string;
        readonly location: string;
        readonly description: string;
        readonly start: {
            readonly date?: string;
            readonly dateTime?: string;
        };
        readonly end: {
            readonly date?: string;
            readonly dateTime?: string;
        };
    }

    interface ICalendarEventList {
        readonly kind: 'calendar#events';
        readonly items: ICalendarEvent[];
    }

    interface IRequestParameters {
        readonly relativeUrl: string,
        readonly parameters?: { [key: string]: string }
    }

    let httpGetAsync = (requestParams: IRequestParameters, success: (response: any) => void, error: (response: any) => void) => {

        let request = new XMLHttpRequest();
        let timeoutEventHandle: number;

        request.onreadystatechange = () => {
            if (request.readyState !== XMLHttpRequest.DONE) {
                return;
            } else if (request.status === 200) {
                let parsedResult = JSON.parse(request.response);
                success(parsedResult);
            } else {
                error(request.response);
            }

            clearTimeout(timeoutEventHandle);
        }

        let queryStringParams: { [key: string]: string };
        if (typeof requestParams.parameters === 'object') {
            queryStringParams = requestParams.parameters;
        } else {
            queryStringParams = {};
        }

        queryStringParams['key'] = gApiKey;

        let queryString = Object.keys(queryStringParams)
            .map(key => escape(key) + '=' + escape(queryStringParams[key]))
            .join('&');

        let fullUrl = apiRoot + requestParams.relativeUrl + '?' + queryString;

        timeoutEventHandle = setTimeout(() => {
            request.abort();
            error('Timeout');
        }, 7000);

        request.open('GET', fullUrl, true);
        request.send(null);
    };

    let getNextGottesdienstMessage = (event: ICalendarEvent) => {

        let isSpecificTime = typeof event.start.dateTime === 'string';
        let date: Date;
        if (isSpecificTime) {
            date = new Date(<string> event.start.dateTime);
        } else {
            date = new Date(<string> event.start.date);
        }

        let dateString = date.toLocaleDateString(locale, { day: 'numeric', month: 'long'});
        let timeString = date.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric' });

        if (locale === 'de-DE') {

            let resultText = 'Der nächste Gottesdienst ist am ' + dateString;
            if (isSpecificTime) {
                resultText += ' um ' + timeString;
            }
            return resultText;

        } else {

            let resultText = 'The next worship service is on ' + dateString;
            if (isSpecificTime) {
                resultText += ' at ' + timeString;
            }
            return resultText;
        }
    };

    let getLocationLink = (event: ICalendarEvent) => {

        let locationText = event.location;
        if (typeof locationText !== 'string') {
            return null;
        }

        let eventDescription = event.description;
        if (typeof eventDescription !== 'string') {
            eventDescription = '';
        }

        let locationUrlMatch = eventDescription.match(/#location (.+)/);

        if (locationUrlMatch === null) {
            let gottesdienstElement = document.createElement('span');
            gottesdienstElement.innerHTML = getNextGottesdienstMessage(event);

            let br = document.createElement('br');
            
            let locationElement = document.createElement('span');
            locationElement.innerHTML = 'Location: ' + locationText;

            let divElement = document.createElement('div');
            divElement.appendChild(gottesdienstElement);
            divElement.appendChild(br);
            divElement.appendChild(locationElement);

            return divElement;
        } else {
            let locationUrl = locationUrlMatch[1];
            let linkElement = document.createElement('a');
            linkElement.href = locationUrl;
            linkElement.target = '_blank'; // Open new tab
            linkElement.rel = 'noopener noreferrer'; // See note under "target" at https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a

            let timeDateSpan = document.createElement('span');
            timeDateSpan.innerHTML = getNextGottesdienstMessage(event);

            let br = document.createElement('br');

            let locationSpan = document.createElement('span');
            locationSpan.innerHTML = 'Location: ' + locationText;

            linkElement.appendChild(timeDateSpan);
            linkElement.appendChild(br);
            linkElement.appendChild(locationSpan);

            return linkElement;
        }
    };

    let windowLoaded = false;
    let calendarQueryResult: object;

    let setGodiboxText = (): void => {
        let eventList = <ICalendarEventList> calendarQueryResult;
        if (!(Array.isArray(eventList.items) && eventList.items.length >= 1)) {
            console.error('No events found.');
            return;
        }
        
        let event = eventList.items[0];
        let buttons = document.getElementsByClassName('godibox');
        Array.prototype.forEach.call(buttons, (x: HTMLElement) => {
            x.innerHTML = getNextGottesdienstMessage(event);
        });

        let locationDivs = document.getElementsByClassName('gottesdienst-location');
        Array.prototype.forEach.call(locationDivs, (x: HTMLElement) => {
            let contents = getLocationLink(event);
            if (contents !== null) {
                x.appendChild(contents);
                x.hidden = false;
            }
        });
    };

    let onCalendarResponse = (data: object) => {

        calendarQueryResult = data;
        if (windowLoaded) {
            setGodiboxText();
        }
    };

    httpGetAsync(
        {
            relativeUrl: 'calendars/' + calendarId + '/events',
            parameters: {
                maxResults: '1',
                orderBy: 'startTime',
                timeMin: new Date().toISOString(),
                singleEvents: 'true',
                q: eventSearchQuery
            }
        },
        onCalendarResponse,
        x => console.error(x)
    );

    let currentOnLoadFunction = window.onload;
    window.onload = (event: Event) => {

        if (typeof currentOnLoadFunction === 'function') {
            currentOnLoadFunction.call(window, event);
        }

        windowLoaded = true;
        if (calendarQueryResult) {
            setGodiboxText();
        }
    };

}
