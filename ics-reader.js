
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

//parse ics file into JSON
function parseIcsToJSON(icsData) {
	const NEW_LINE = /\r\n|\n|\r/;
	const EVENT = "VEVENT";
	const EVENT_START = "BEGIN";
	const EVENT_END = "END";
	const START_DATE = "DTSTART";
	const END_DATE = "DTEND";
	const DESCRIPTION = "DESCRIPTION";
	const SUMMARY = "SUMMARY";
	const LOCATION = "LOCATION";
	const ALARM = "VALARM";
	const UID = "UID";
	const TZID = "TZID";
	const X_COLOR = "X-CALENDAR-XDC-COLOR"

	const keyMap = {
		[UID]: "uid",
		[START_DATE]: "startDate",
		[END_DATE]: "endDate",
		[DESCRIPTION]: "description",
		[SUMMARY]: "summary",
		[LOCATION]: "location",
		[TZID]: "timeZone",
		[X_COLOR]: "color"
	};

	const clean = (string) => unescape(string).trim();

	// const icsToJson = icsData => {
	const array = [];
	let currentObj = {};
	let lastKey = "";

	const lines = icsData.split(NEW_LINE);

	let isAlarm = false;
	for (let i = 0, iLen = lines.length; i < iLen; ++i) {
		const line = lines[i];
		const lineData = line.split(":");

		let key = lineData[0];
		let keyParam = "";
		const value = lineData[1];

		if (key.indexOf(";") !== -1) {
			const keyParts = key.split(";");
			key = keyParts[0];
			// Maybe do something with that second part later
			keyParam = keyParts[1];
		}

		if (lineData.length < 2) {
			if (key.startsWith(" ") && lastKey !== undefined && lastKey.length) {
				currentObj[lastKey] += clean(line.substr(1));
			}
			continue;
		} else {
			lastKey = keyMap[key];
		}

		switch (key) {
			case EVENT_START:
				if (value === EVENT) {
					currentObj = {};
				} else if (value === ALARM) {
					isAlarm = true;
				}
				break;
			case EVENT_END:
				isAlarm = false;
				if (value === EVENT) array.push(currentObj);
				break;
			case UID:
				currentObj[keyMap[UID]] = clean(Math.floor(Math.random() * 10000 + 1)); //calendar webxdc is not able to delete events if their id isn't a number
				break;
			case START_DATE:
				// parse TZID=<TIMEZONE>
				keyParam = keyParam.split("=");
				currentObj[keyMap[TZID]] = keyParam[1];
				currentObj[keyMap[START_DATE]] = icsDateToUnixTimestamp(value, keyParam[1]);
				break;
			case END_DATE:
				currentObj[keyMap[END_DATE]] = icsDateToUnixTimestamp(value);
				break;
			case DESCRIPTION:
				if (!isAlarm) currentObj[keyMap[DESCRIPTION]] = clean(value);
				break;
			case SUMMARY:
				currentObj[keyMap[SUMMARY]] = clean(value);
				break;
			case LOCATION:
				currentObj[keyMap[LOCATION]] = clean(value);
			case X_COLOR:
				currentObj[keyMap[X_COLOR]] = clean(value);
			default:
				continue;
		}
	}
	return array
}

function parseJSONToWebxdcUpdate(events) {
	for (const evt in events) {
		cal.importEventObj = events[evt];
		cal.doAddEvent();
	}
	cal.importEventObj = undefined;
}
