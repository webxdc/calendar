let events;
const SEPARATOR = "\r\n";
// const SEPARATOR = "\\n"; //to import in Outlook calendar

// /**
//  * Write ICS to a file in the current directory called event.ics
//  * @param {Date} start - Starting time of the event.
//  * @param {Date} end - Ending time of the event.
//  * @param {String} title - Title of the event.
//  * @param {String} location - Location of the event.
//  */
// function makeICS(start, end, title = "", location = "") {
// 	fs.writeFile(
// 		__dirname + "/calendar-events.ics",
// 		makeString(startDate, endDate, title, location),
// 		function (err) {
// 			if (err) {
// 				return console.log(err);
// 			}
// 		}
// 	);
// }

/**
 * Output ICS as a string
 * @param {Array} events - The array of events
 * @returns {String} String representation of the ICS events
 */
function makeString(events) {
	let icsString = "BEGIN:VCALENDAR" + SEPARATOR;
	console.log(events);

	icsString +=
		"VERSION:2.0" +
		SEPARATOR +
		"PRODID:-//calendar/webxdc//EN" +
		SEPARATOR +
		"X-WR-CALNAME:" +
		window.webxdc.selfName +
		" calendar" +
		SEPARATOR;
		let lastID = 0;
	for (const i in events) {
		//if is the same ID is a multi-day event, so skip iteration
		if (Number.parseInt(events[i].id) === Number.parseInt(lastID)) continue;
		//compound the event in ics format
			lastID = events[i].id;
			let dateStart = new Date(events[i].startDate);
			let dateEnd = new Date(events[i].endDate);
			icsString +=
				"BEGIN:VEVENT" +
				SEPARATOR +
				`UID:${lastID}` +
				SEPARATOR +
				`DTSTAMP:${toDateTime(new Date())}` +
				SEPARATOR +
				`CREATED:${toDateTime(new Date())}` +
				SEPARATOR +
				`DTSTART;VALUE=DATE:${toDateTime(dateStart)}` +
				SEPARATOR +
				//maybe do something with this longer than a day events later
				`DTEND;VALUE=DATE:${toDateTime(dateEnd)}` +
				SEPARATOR +
				`SUMMARY:${events[i].data}` +
				SEPARATOR +
				`DESCRIPTION:${events[i].data}` +
				SEPARATOR +
				`LOCATION:${events[i][location] ? events[i].location : ""}` +
				SEPARATOR +
				`X-CALENDAR-XDC-COLOR:${escape(events[i].color)}` +
				SEPARATOR +
				"END:VEVENT" +
				SEPARATOR;
		
	}
	icsString += "END:VCALENDAR";
	return icsString;
}

// JS Date Format -> ICS Date Format
function toDateTime(date) {
	const isoString = date.toISOString();
	const formattedString = isoString.replace(/[-:.]/g, "");
	return formattedString.substring(0, formattedString.length - 4) + "Z";
}

// Set info in the clipboard
function setClipboard() {
	let data = makeString(events);
	console.log(data);
	return data;
}
