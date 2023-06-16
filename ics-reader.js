
function icsStringToEventArray(icsString) {
    const keyMap = {
        ['UID']: "uid",
        ['DTSTART']: "startDate",
        ['DTEND']: "endDate",
        ['DESCRIPTION']: "description",
        ['SUMMARY']: "summary",
        ['LOCATION']: "location",
        ['X-CALENDAR-XDC-COLOR']: "color"
    };
    let currentObj = {};
    let lastKey = "";
    let isAlarm = false;
    var ret = [];
    const lines = icsString.split(/\r\n|\n|\r/);

    for (const line of lines) {
        // unfold lines
        if (line.startsWith(" ")) {
            if (lastKey != "") {
                currentObj[lastKey] += unescapeIcsValue(line.substr(1));
            }
            continue;
        }

        // very basic splitting of lines as `KEY;PARAMNAME=PARAM:VALUE`
        // (following spec, PARAM may be quoted and contain `:` ... we'll see how that non-tokenizing implementation does in the wild :)
        const colonPos = line.indexOf(":");
        if (colonPos == -1) {
            continue;
        }
        let key = line.substring(0, colonPos);
        let param = {};
        const value = line.substring(colonPos + 1);
        if (key.indexOf(";") !== -1) {
            const keyParts = key.split(";");
            key = keyParts[0];
            const p = keyParts[1].split("=");
            param[p[0]] = p[1];
        }

        lastKey = keyMap[key];
        switch (key) {
            case 'BEGIN':
                if (value === 'VEVENT') {
                    currentObj = {};
                } else if (value === 'VALARM') {
                    isAlarm = true; // VEVENT may include VALARM: ignore DESCRIPTION of VALARM
                }
                break;
            case 'END':
                isAlarm = false;
                if (value === 'VEVENT') {
                    ret.push(currentObj);
                }
                break;
            case 'UID':
                currentObj[keyMap['UID']] = unescapeIcsValue(Math.floor(Math.random() * 10000 + 1)); //calendar webxdc is not able to delete events if their id isn't a number
                break;
            case 'DTSTART':
                currentObj[keyMap['DTSTART']] = icsDateStringToUnixTimestamp(value, param);
                break;
            case 'DTEND':
                currentObj[keyMap['DTEND']] = icsDateStringToUnixTimestamp(value, param);
                break;
            case 'DESCRIPTION':
                if (!isAlarm) currentObj[keyMap['DESCRIPTION']] = unescapeIcsValue(value);
                break;
            case 'SUMMARY':
                currentObj[keyMap['SUMMARY']] = unescapeIcsValue(value);
                break;
            case 'LOCATION':
                currentObj[keyMap['LOCATION']] = unescapeIcsValue(value);
            case 'X-CALENDAR-XDC-COLOR':
                currentObj[keyMap['X-CALENDAR-XDC-COLOR']] = unescapeIcsValue(value);
            default:
                continue;
        }
    }

    return ret;
}

function unescapeIcsValue(str) {
    if (typeof str === "string") {
        return str.replaceAll("\\n", "\n")
                  .replaceAll("\\N", "\n") // yes, uppercase linebreak allowed in the spec
                  .replaceAll("\\,", ",")
                  .replaceAll("\\;", ";")
                  .replaceAll("\\\\", "\\");
    } else {
        return "" + str;
    }
}

function icsDateStringToUnixTimestamp(icsDateString, param) {
    // ics date strings are `YYYYMMDDTHHmmSSZ` for UTC, otherwise the last `Z` is omitted
    const year   = icsDateString.substr(0,  4);
    const month  = icsDateString.substr(4,  2);
    const day    = icsDateString.substr(6,  2);
    const hour   = icsDateString.substr(9,  2);
    const min    = icsDateString.substr(11, 2);
    const sec    = icsDateString.substr(13, 2);
    const isoStr = year + '-' + month + '-' + day + 'T' + hour + ':' + min + ':' + sec + '.000Z';
    const dateObj = new Date(isoStr);
    var unixTimestamp = dateObj.getTime();
    if (icsDateString.substr(15, 1) != 'Z' && typeof param.TZID == 'string') {
        unixTimestamp -= getTimezoneOffsetMilliseconds(param.TZID);
    }
    return unixTimestamp;
}
