
function removeAllChildren(el) {
	while (el.lastChild) {
		el.removeChild(el.lastChild);
	}
}

function getShortMonthNames() {
	try {
		const format = new Intl.DateTimeFormat(undefined, {
			month: "short",
			timeZone: "UTC",
		});
		const monthNames = [];
		for (let i = 0; i < 12; i++) {
			const date = Date.UTC(2023, i, 1);
			const month = format
				.formatToParts(date)
				.find(p => p.type === "month")
				.value;
			monthNames.push(month);
		}
		return monthNames;
	} catch (e) {
		return [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
	}
}

function getShortWeekdayNamesStartingFromSun() {
	try {
		const format = new Intl.DateTimeFormat(undefined, {
			weekday: "short",
			timeZone: "UTC",
		});
		const weekdayNames = [];
		for (let i = 0; i < 7; i++) {
			// 2023-01-01 is a known Sunday.
			const date = Date.UTC(2023, 0, 1 + i);
			const weekday = format
				.formatToParts(date)
				.find(p => p.type === "weekday")
				.value;
			weekdayNames.push(weekday);
		}
		return weekdayNames;
	} catch (e) {
		return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
	}
}

function getShortWeekdayNamesStartingFromMon() {
	const arr = getShortWeekdayNamesStartingFromSun();
	const sun = arr.shift();
	arr.push(sun);
	return arr;
}

// 1 is Monday, 7 is Sunday, like in
// https://tc39.es/proposal-intl-locale-info/#sec-week-info-of-locale
function getWeekFirstDay() {
	try {
		const currLocale = (new Intl.DateTimeFormat()).resolvedOptions().locale;
		return (new Intl.Locale(currLocale)).weekInfo.firstDay;
	} catch (e) {
		return 1;
	}
}

function getDateString(year, monthIndex, day, options = {}) {
    const date = new Date(year, monthIndex, day);
    if (year == new Date().getFullYear()) {
        return date.toLocaleDateString(undefined, { ...options, ...{month: "short", day: "numeric"} });
    } else {
        return date.toLocaleDateString(undefined, { ...options, ...{year: "numeric", month: "short", day: "numeric"} });
    }
}

function getTimezoneOffsetMilliseconds(timeZoneStr) {
    var minutesOffset = 0;
    try {
        // get timezone specific date for "now" as `MM/DD/YYYY, GMT+HH:mm`
        const dateStr = Intl.DateTimeFormat('en-US', {timeZone: timeZoneStr, timeZoneName: "longOffset"}).format(new Date());
        const gmtStr = dateStr.split(" ")[1].slice(3) || '+0'; // `+0` is needed when the timezone is missing the number part. Ex. Africa/Bamako -> GMT
        minutesOffset = parseInt(gmtStr.split(':')[0])*60;
        if (gmtStr.includes(":")) {
           minutesOffset = minutesOffset + parseInt(gmtStr.split(':')[1]);
        }
    } catch(e) {
        console.error(e);
    }
    return minutesOffset * 60 * 1000;
}

function generateUid() {
    try {
        return crypto.randomUUID();
    } catch(e) {
        return Date.now() + '-' + Math.floor(Math.random() * 2000000000);
    }
}

function simplifyString(str) {
    const MAX_LEN = 32;
    var ret = str.replace(/\n/g, " ");
    if (ret.length > MAX_LEN) {
        ret = ret.substring(0, MAX_LEN-1).trim() + "…";
    }
    return ret;
}

function validateColor(color) {
    if (typeof color === 'string' && color[0] === '#') {
        return color;
    } else {
        return '#ffb800';
    }
}

function addLeadingZeros(num, size) {
    var s = "000000000" + num;
    return s.substring(s.length - size);
}

function icsDateStringToIsoString(icsDateString) {
    const year   = icsDateString.substr(0,  4);
    const month  = icsDateString.substr(4,  2);
    const day    = icsDateString.substr(6,  2);
    const hour   = icsDateString.substr(9,  2);
    const min    = icsDateString.substr(11, 2);
    const sec    = icsDateString.substr(13, 2);
    return year + '-' + month + '-' + day + 'T' + hour + ':' + min + ':' + sec + '.000Z';
}

function ymdToIcsDateString(year, monthIndex, day) {
    return addLeadingZeros(year, 4) + addLeadingZeros(monthIndex + 1, 2) + addLeadingZeros(day, 2);
}

function unifyIcsDateString(icsDateString, param = {}) {
    try {
        icsDateString = icsDateString.trim();
        if (icsDateString.length >= 15) {
            var dateObj = new Date(icsDateStringToIsoString(icsDateString));
            if (icsDateString.substr(15, 1) != 'Z' && typeof param.TZID == 'string') {
                var unixTimestamp = dateObj.getTime();
                unixTimestamp -= getTimezoneOffsetMilliseconds(param.TZID);
                dateObj = new Date(unixTimestamp);
            }
            return dateToIcsDateString(dateObj);
        } else {
            return icsDateString.substring(0, 8);
        }
    } catch (e) {
        console.error(e);
        return dateToIcsDateString(new Date())
    }
}

function ununifyIcsDateString(unifiedIcsStr) {
    if (unifiedIcsStr.length == 8) {
        return ';VALUE=DATE:' + unifiedIcsStr;
    } else {
        return ':' + unifiedIcsStr;
    }
}

function unifiedIcsDateStringToDateObj(icsDateString) {
    if (icsDateString.length >= 15) {
        return new Date(icsDateStringToIsoString(icsDateString));
    } else {
        const year       = parseInt(icsDateString.substr(0,  4), 10);
        const monthIndex = parseInt(icsDateString.substr(4,  2) - 1, 10);
        const day        = parseInt(icsDateString.substr(6,  2), 10);
        return new Date(year, monthIndex, day);
    }
}

function getLocalIcsTimeString(icsDateString) {
    if (icsDateString.length != 16) {
        return '';
    }
    const date = unifiedIcsDateStringToDateObj(icsDateString);
    return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: 'numeric' });
}