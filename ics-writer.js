const SEPARATOR = "\r\n";
// const SEPARATOR = "\\n"; //to import in Outlook calendar


/**
 * Output ICS as a string
 * @param {(import('./types').CalEvent)[]} events - The array of events
 * @returns {String} String representation of the ICS events
 */
function createIcsData(events) {
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
	for (const event of events) {
		//if is the same ID is a multi-day event, so skip iteration
		if (Number.parseInt(event.id) === Number.parseInt(lastID)) continue;
		//compound the event in ics format
			lastID = event.id;
			let dateStart = new Date(event.startDate);
			let dateEnd = new Date(event.endDate);
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
				`DTEND;VALUE=DATE:${toDateTime(dateEnd)}` +
				SEPARATOR +
				`SUMMARY:${event.data}` +
				SEPARATOR +
				`DESCRIPTION:${event.data}` +
				SEPARATOR +
				`LOCATION:${event[location] ? event.location : ""}` +
				SEPARATOR +
				`X-CALENDAR-XDC-COLOR:${escape(event.color)}` +
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
