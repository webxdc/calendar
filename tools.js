
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
        return '#FAD02C';
    }
}