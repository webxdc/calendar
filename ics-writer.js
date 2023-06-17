
function eventArrayToIcsString(events) {
    const LINEEND = "\r\n";

    let icsString =
          "BEGIN:VCALENDAR" + LINEEND
        + "VERSION:2.0" + LINEEND
        + "PRODID:-//calendar/webxdc//EN" + LINEEND
        + "X-WR-CALNAME:" + window.webxdc.selfName + " calendar" + LINEEND;
    let lastUid = '';
    for (const event of events) {
        if (event.uid === lastUid) { // multi-day events have the same UID
            continue;
        }
        lastUid = event.uid;
        icsString +=
              "BEGIN:VEVENT"   + LINEEND
            + "UID:"           + lastUid + LINEEND
            + "DTSTAMP:"       + dateToIcsDateString(new Date()) + LINEEND
            + "DTSTART:"       + dateToIcsDateString(new Date(event.startTimestamp)) + LINEEND
            + "DTEND:"         + dateToIcsDateString(new Date(event.endTimestamp)) + LINEEND
            + "SUMMARY:"       + escapeIcsValue(event.summary) + LINEEND
            + "X-XDC-CREATOR:" + escapeIcsValue(event.creator) + LINEEND
            + "X-XDC-COLOR:"   + escapeIcsValue(event.color) + LINEEND
            + "END:VEVENT"     + LINEEND;

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
