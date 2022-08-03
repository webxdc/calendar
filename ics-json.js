// let icsText = "";

//get text from the clipboard
function getClipboard(text) {
	if (text !== "") {
		// console.log(responseText);
		console.log(parseIcsToJSON(text));
	} else {
		console.log("No text on the clipboard!");
	}
}

//transform ics dates to Date timestamps
//ics dates are YYYYMMDDTHHmmSS format
function calenDate(icalStr, timezone) {
	// icalStr = '20110914T184000Z'
	var strYear = icalStr.substr(0, 4);
	var strMonth = parseInt(icalStr.substr(4, 2), 10) - 1;
	var strDay = icalStr.substr(6, 2);
	var strHour = icalStr.substr(9, 2);
	var strMin = icalStr.substr(11, 2);
	var strSec = icalStr.substr(13, 2);

	var oDate = new Date(strYear, strMonth, strDay, strHour, strMin, strSec);

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
	const UID = "UID"; //then I can get this for the ID of the event in the calendar
	const TZID = "TZID";

	const keyMap = {
		[UID]: "uid",
		[START_DATE]: "startDate",
		[END_DATE]: "endDate",
		[DESCRIPTION]: "description",
		[SUMMARY]: "summary",
		[LOCATION]: "location",
		[TZID]: "timeZone",
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
				// currentObj[keyMap[UID]] = clean(value);
				currentObj[keyMap[UID]] = clean(Math.floor(Math.random() * 10000 + 1)); //calendar webxdc is not able to delete events if their id isn't a number
				break;
			case START_DATE:
				//save the timezone
				keyParam = keyParam.split("=");
				currentObj[keyMap[TZID]] = keyParam[1];
				//try to get the date value
				currentObj[keyMap[START_DATE]] = calenDate(value, keyParam[1]); //JSON.stringify(calenDate(value));
				break;
			case END_DATE:
				currentObj[keyMap[END_DATE]] = calenDate(value);
				break;
			case DESCRIPTION:
				if (!isAlarm) currentObj[keyMap[DESCRIPTION]] = clean(value);
				break;
			case SUMMARY:
				currentObj[keyMap[SUMMARY]] = clean(value);
				break;
			case LOCATION:
				currentObj[keyMap[LOCATION]] = clean(value);
			default:
				continue;
		}
	}
	parseJSONToWebxdcUpdate(array);
	//to return a json object
	// return JSON.stringify(array);
	// };

	// export default icsToJson;
}

function parseJSONToWebxdcUpdate(JSON) {
	for (const evt in JSON) {
		cal.importEventObj = JSON[evt];
		cal.save();
		// let date = new Date(event.startDate);
		// let info =
		// 	window.webxdc.selfName + " imported an event on " + date.toDateString();
		// let color = "black";
		// let timeZone = event.timeZone; //time zone of the imported event!!
		// window.webxdc.sendUpdate(
		// 	{
		// 		payload: {
		// 			id: event.uid,
		// 			day: date.getDate(),
		// 			month: date.getMonth(),
		// 			year: date.getFullYear(),
		// 			data: event.summary,
		// 			color: color,
		// 			addition: true,
		// 			creator: window.webxdc.selfName,
		// 			// timeZone: timeZone,
		// 		},
		// 		info,
		// 	},
		// 	info
		// );
	}
	cal.importEventObj = undefined;
}
