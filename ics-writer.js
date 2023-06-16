
function eventArrayToIcsString(events) {
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
            + "UID:"         + lastID + LINEEND
            + "DTSTAMP:"     + dateToIcsDateString(new Date()) + LINEEND
            + "CREATED:"     + dateToIcsDateString(new Date()) + LINEEND
            + "DTSTART:"     + dateToIcsDateString(dateStart) + LINEEND
            + "DTEND:"       + dateToIcsDateString(dateEnd) + LINEEND
            + "SUMMARY:"     + escapeIcsValue(event.data) + LINEEND
            + "DESCRIPTION:" + escapeIcsValue(event.data) + LINEEND
            + "LOCATION:"    + escapeIcsValue(event[location] ? event.location : "") + LINEEND
            + "X-CALENDAR-XDC-COLOR:" + escapeIcsValue(event.color) + LINEEND
            + "END:VEVENT" + LINEEND;

    }
    icsString += "END:VCALENDAR" + LINEEND;
    return icsString;
}

function escapeIcsValue(str) {
    // see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.11 for escaping;
    // leaving UTF-8 and line lengths as is until that makes problems in the wild.
    return str.replace(/([;,\\])/g, "\\$1")
              .replaceAll("\n", "\\n")
              .replaceAll("\r", "");
}

function dateToIcsDateString(date) {
    const isoString = date.toISOString();
    const formattedString = isoString.replace(/[-:.]/g, "");
    return formattedString.substring(0, formattedString.length - 4) + "Z";
}
