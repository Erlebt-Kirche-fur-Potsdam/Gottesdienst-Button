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
    let locationNoun = 'Ort';
    let isEnglish = location.pathname.match(/\/en\//);
    if (isEnglish) {
        locale = "en-GB";
        locationNoun = 'Location';
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

    interface IGodiInfo {
        date: string,
        time?: string,
        locationName?: string,
        locationUrl?: string,
        liveStreamUrl?: string
    }

    const httpGetAsync = (requestParams: IRequestParameters, success: (response: any) => void, error: (response: any) => void) => {

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

    const getGodiDateTimeMessage = (event: IGodiInfo): string => {

        if (locale === 'de-DE') {

            let resultText = `Der nächste Gottesdienst ist am ${event.date}`;
            if (typeof event.time === 'string') {
                resultText += ` um ${event.time}`;
            }
            return resultText;

        } else {

            let resultText = `The next worship service is on ${event.date}`;
            if (typeof event.time === 'string') {
                resultText += ` at ${event.time}`;
            }
            return resultText;
        }
    };

    const getGodiButtonMessage = (event: IGodiInfo): string => {

        let resultText = getGodiDateTimeMessage(event);

        if (locale === 'de-DE') {
            if (typeof event.locationName === 'string') {
                resultText += ` (${event.locationName})`;
            }
            if (typeof event.liveStreamUrl === 'string') {
                resultText += ' (Live Stream verfügbar)';
            }
        } else {
            if (typeof event.locationName === 'string') {
                resultText += ` at ${event.locationName}`;
            }
            if (typeof event.liveStreamUrl === 'string') {
                resultText += ' (Live stream available)'
            }
        }
        return resultText;
    };

    const createElement = function<K extends keyof HTMLElementTagNameMap>(elementType: K, children?: Node[]): HTMLElement {
        let elem = document.createElement(elementType);
        if (Array.isArray(children)) {
            children.forEach(x => elem.appendChild(x));
        }
        return elem;
    };

    const createLink = (href: string, children: Node[]): HTMLAnchorElement => {
        let linkElement = document.createElement('a');
        linkElement.href = href;
        linkElement.target = '_blank'; // Open new tab
        linkElement.rel = 'noopener noreferrer'; // See note under "target" at https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a
        (<any>linkElement).style = 'color: #ffffff'; // Background is red and default link color is also red. This fixes that.
        children.forEach(x => linkElement.appendChild(x));
        return linkElement;
    };

    let getGodiInfo = (event: ICalendarEvent): IGodiInfo => {

        let isSpecificTime = typeof event.start.dateTime === 'string';
        let date: Date;
        if (isSpecificTime) {
            date = new Date(<string> event.start.dateTime);
        } else {
            date = new Date(<string> event.start.date);
        }

        let info: IGodiInfo = {
            date: date.toLocaleDateString(locale, { day: 'numeric', month: 'long'})
        };

        if (isSpecificTime) {
            info.time = date.toLocaleTimeString(locale, { hour: 'numeric', minute: 'numeric' });
        }

        if (typeof event.location === 'string') {
            info.locationName = event.location;
        }

        let eventDescription = event.description;
        if (typeof eventDescription !== 'string') {
            eventDescription = '';
        }

        let locationUrlMatch = eventDescription.match(/#location (.+)/);
        if (locationUrlMatch !== null && locationUrlMatch !== undefined) {
            info.locationUrl = locationUrlMatch[1]
        }

        let liveStreamUrlMatch = eventDescription.match(/#livestream (.+)/);
        if (liveStreamUrlMatch !== null && liveStreamUrlMatch !== undefined) {
            info.liveStreamUrl = liveStreamUrlMatch[1]
        }

        return info;
    };

    let getGodiDiv = (event: ICalendarEvent): HTMLElement | null => {

        let godiInfo = getGodiInfo(event);

        let timeDateSpan = createElement('span');
        timeDateSpan.innerHTML = getGodiDateTimeMessage(godiInfo);

        let divContents = [ timeDateSpan ];

        if (typeof godiInfo.locationName === 'string') {

            divContents.push(createElement('br'));

            let locationSpan = createElement('span');
            if (typeof godiInfo.locationUrl === 'string') {
                (<any>locationSpan).style = 'text-decoration: underline';
                locationSpan.innerHTML = locationNoun + ': ' + godiInfo.locationName;
                let locationLink = createLink(godiInfo.locationUrl, [ locationSpan ]);
                divContents.push(locationLink);
            } else {
                locationSpan.innerHTML = locationNoun + ': ' + godiInfo.locationName;
                divContents.push(locationSpan);
            }
        }

        if (typeof godiInfo.liveStreamUrl === 'string') {
            divContents.push(createElement('br'));
            let liveStreamSpan = createElement('span');
            (<any>liveStreamSpan).style = 'text-decoration: underline';
            liveStreamSpan.innerHTML = 'Live Stream';
            let liveStreamLink = createLink(godiInfo.liveStreamUrl, [ liveStreamSpan ]);
            divContents.push(liveStreamLink);
        }

        return createElement('div', divContents);

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
        let godiInfo = getGodiInfo(event);
        let buttons = document.getElementsByClassName('godibox');
        Array.prototype.forEach.call(buttons, (x: HTMLElement) => {
            x.innerHTML = getGodiButtonMessage(godiInfo);
        });

        let locationDivs = document.getElementsByClassName('gottesdienst-location');
        Array.prototype.forEach.call(locationDivs, (x: HTMLElement) => {
            let contents = getGodiDiv(event);
            if (contents !== null) {
                x.appendChild(contents);
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
