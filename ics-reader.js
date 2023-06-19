
function icsStringToEventArray(icsString) {
    const keyMap = {
        ['UID']: "uid",
        ['DTSTART']: "dtStart",
        ['DTEND']: "dtEnd",
        ['SUMMARY']: "summary",
        ['X-XDC-COLOR']: "color",
        ['X-XDC-CREATOR']: "creator",
        ['DESCRIPTION']: "description", // will be added to summary
        ['LOCATION']: "location",       // will be added to summary
    };
    let currentObj = new CalEvent();
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
                    currentObj = new CalEvent();
                } else if (value === 'VALARM') {
                    isAlarm = true; // VEVENT may include VALARM: ignore DESCRIPTION of VALARM
                }
                break;
            case 'END':
                isAlarm = false;
                if (value === 'VEVENT') {
                    if (currentObj.uid == '') {
                        currentObj.uid = generateUid();
                    }
                    if (currentObj.description !== undefined) {
                        currentObj.summary += "\n\n" + currentObj.description;
                        currentObj.description = undefined;
                    }
                    if (currentObj.location !== undefined) {
                        currentObj.summary += "\n\n" + currentObj.location;
                        currentObj.location = undefined;
                    }
                    ret.push(currentObj);
                }
                break;
            case 'UID':
                currentObj[keyMap['UID']] = unescapeIcsValue(value);
                break;
            case 'DTSTART':
                currentObj[keyMap['DTSTART']] = unifyIcsDateString(value, param);
                break;
            case 'DTEND':
                currentObj[keyMap['DTEND']] = unifyIcsDateString(value, param);
                break;
            case 'DESCRIPTION':
                if (!isAlarm) currentObj[keyMap['DESCRIPTION']] = unescapeIcsValue(value);
                break;
            case 'SUMMARY':
                currentObj[keyMap['SUMMARY']] = unescapeIcsValue(value);
                break;
            case 'LOCATION':
                currentObj[keyMap['LOCATION']] = unescapeIcsValue(value);
                break;
            case 'X-XDC-CREATOR':
                currentObj[keyMap['X-XDC-CREATOR']] = unescapeIcsValue(value);
                break;
            case 'X-XDC-COLOR':
                currentObj[keyMap['X-XDC-COLOR']] = unescapeIcsValue(value);
                break;
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
