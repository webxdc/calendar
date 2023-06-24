import { dateToIcsDateString } from "./tools.js";

export function eventArrayToIcsString(events) {
  const LINEEND = "\r\n";

  let icsString =
    "BEGIN:VCALENDAR" +
    LINEEND +
    "VERSION:2.0" +
    LINEEND +
    "PRODID:-//calendar/webxdc//EN" +
    LINEEND +
    "X-WR-CALNAME:" +
    window.webxdc.selfName +
    " calendar" +
    LINEEND;
  let lastUid = "";
  for (const event of events) {
    if (event.uid === lastUid) {
      // multi-day events have the same UID
      continue;
    }
    lastUid = event.uid;
    icsString +=
      "BEGIN:VEVENT" +
      LINEEND +
      "UID:" +
      lastUid +
      LINEEND +
      "DTSTAMP:" +
      dateToIcsDateString(new Date()) +
      LINEEND +
      "DTSTART" +
      ununifyIcsDateString(event.dtStart) +
      LINEEND + // colon added by ununify
      "SUMMARY:" +
      escapeIcsValue(event.summary) +
      LINEEND +
      "X-XDC-CREATOR:" +
      escapeIcsValue(event.creator) +
      LINEEND +
      "X-XDC-COLOR:" +
      escapeIcsValue(event.color) +
      LINEEND;
    if (event.dtEnd != "") {
      icsString += "DTEND" + ununifyIcsDateString(event.dtEnd) + LINEEND; // colon added by ununify
    }
    icsString += "END:VEVENT" + LINEEND;
  }
  icsString += "END:VCALENDAR" + LINEEND;
  return icsString;
}

function escapeIcsValue(str) {
  // see https://datatracker.ietf.org/doc/html/rfc5545#section-3.3.11 for escaping;
  // leaving UTF-8 and line lengths as is until that makes problems in the wild.
  return str
    .replace(/([;,\\])/g, "\\$1")
    .replaceAll("\n", "\\n")
    .replaceAll("\r", "");
}

function ununifyIcsDateString(unifiedIcsStr) {
  if (unifiedIcsStr.length == 8) {
    return ";VALUE=DATE:" + unifiedIcsStr;
  } else {
    return ":" + unifiedIcsStr;
  }
}
