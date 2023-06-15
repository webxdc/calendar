
// transform ics dates to Date timestamps;
// ics dates are expected as YYYYMMDDTHHmmSS format in UTC (what else appears in the wild?)
function icsDateToUnixTimestamp(icalStr, timezone) {
    const year = icalStr.substr(0, 4);
    const month = icalStr.substr(4, 2);
    const day = icalStr.substr(6, 2);
    const hour = icalStr.substr(9, 2);
    const min = icalStr.substr(11, 2);
    const sec = icalStr.substr(13, 2);
    const isoStr = year + '-' + month + '-' + day + 'T' + hour + ':' + min + ':' + sec + '.000Z';
    var oDate = new Date(isoStr);

	//convert to local time if timezone is not undefined
	// if (timezone != undefined) {
	// // 	const dateString = oDate.toISOString(); //example "2019-05-05T10:30:00Z"
	// // 	const userOffset = new Date().getTimezoneOffset() * 60 * 1000;
	// // 	const localDate = new Date(dateString);
	// // 	const utcDate = new Date(localDate.getTime() + userOffset);
	// 	const timezones = JSON.parse("./timezones.json");

	// }

	return oDate.getTime();
}

function parseIcsToJSON(icsData) {
	const NEW_LINE = /\r\n|\n|\r/;
	const keyMap = {
		['UID']: "uid",
		['DTSTART']: "startDate",
		['DTEND']: "endDate",
		['DESCRIPTION']: "description",
		['SUMMARY']: "summary",
		['LOCATION']: "location",
		['TZID']: "timeZone",
		['X-CALENDAR-XDC-COLOR']: "color"
	};
	const clean = (string) => unescape(string).trim();
	let currentObj = {};
	let lastKey = "";
	var ret = [];

	const lines = icsData.split(NEW_LINE);

	let isAlarm = false;
	for (let i = 0; i < lines.length; i++) {
		// split ical lines as KEY;PARAM:VALUE
		const line = lines[i];
		const lineData = line.split(":");
		let key = lineData[0];
		let keyParam = "";
		const value = lineData[1];
		if (key.indexOf(";") !== -1) {
			const keyParts = key.split(";");
			key = keyParts[0];
			keyParam = keyParts[1];
		}

		// lines starting with a space continue last VALUE
		if (lineData.length < 2) {
			if (key.startsWith(" ") && lastKey !== undefined && lastKey.length) {
				currentObj[lastKey] += clean(line.substr(1));
			}
			continue;
		} else {
			lastKey = keyMap[key];
		}

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
				currentObj[keyMap['UID']] = clean(Math.floor(Math.random() * 10000 + 1)); //calendar webxdc is not able to delete events if their id isn't a number
				break;
			case 'DTSTART':
				// parse TZID=<TIMEZONE>
				keyParam = keyParam.split("=");
				currentObj[keyMap['TZID']] = keyParam[1];
				currentObj[keyMap['DTSTART']] = icsDateToUnixTimestamp(value, keyParam[1]);
				break;
			case 'DTEND':
				currentObj[keyMap['DTEND']] = icsDateToUnixTimestamp(value);
				break;
			case 'DESCRIPTION':
				if (!isAlarm) currentObj[keyMap['DESCRIPTION']] = clean(value);
				break;
			case 'SUMMARY':
				currentObj[keyMap['SUMMARY']] = clean(value);
				break;
			case 'LOCATION':
				currentObj[keyMap['LOCATION']] = clean(value);
			case 'X-CALENDAR-XDC-COLOR':
				currentObj[keyMap['X-CALENDAR-XDC-COLOR']] = clean(value);
			default:
				continue;
		}
	}

	return ret;
}
