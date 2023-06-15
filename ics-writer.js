
/**
 * Output ICS as a string
 * @param {(import('./types').CalEvent)[]} events - The array of events
 * @returns {String} String representation of the ICS events
 */
function createIcsData(events) {
    const LINEEND = "\r\n";

    let icsString =
          "BEGIN:VCALENDAR" + LINEEND
        + "VERSION:2.0" + LINEEND
        + "PRODID:-//calendar/webxdc//EN" + LINEEND
        + "X-WR-CALNAME:" + window.webxdc.selfName + " calendar" + LINEEND;
        let lastID = 0;
    for (const event of events) {
        // if is the same ID is a multi-day event, so skip iteration
        if (Number.parseInt(event.id) === Number.parseInt(lastID)) {
            continue;
        }
        lastID = event.id;
        let dateStart = new Date(event.startDate);
        let dateEnd = new Date(event.endDate);
        icsString +=
              "BEGIN:VEVENT" + LINEEND
            + `UID:${lastID}` + LINEEND
            + `DTSTAMP:${dateToIcsDate(new Date())}` + LINEEND
            + `CREATED:${dateToIcsDate(new Date())}` + LINEEND
            + `DTSTART:${dateToIcsDate(dateStart)}` + LINEEND
            + `DTEND:${dateToIcsDate(dateEnd)}` + LINEEND
            + `SUMMARY:${event.data}` + LINEEND
            + `DESCRIPTION:${event.data}` + LINEEND
            + `LOCATION:${event[location] ? event.location : ""}` + LINEEND
            + `X-CALENDAR-XDC-COLOR:${escape(event.color)}` + LINEEND
            + "END:VEVENT" + LINEEND;

    }
    icsString += "END:VCALENDAR" + LINEEND;
    return icsString;
}

function dateToIcsDate(date) {
    const isoString = date.toISOString();
    const formattedString = isoString.replace(/[-:.]/g, "");
    return formattedString.substring(0, formattedString.length - 4) + "Z";
}
