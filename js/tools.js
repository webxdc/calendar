export function removeAllChildren(el) {
  while (el.lastChild) {
    el.removeChild(el.lastChild);
  }
}

export function getShortMonthNames() {
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
        .find((p) => p.type === "month").value;
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

export function getShortWeekdayNamesStartingFromSun() {
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
        .find((p) => p.type === "weekday").value;
      weekdayNames.push(weekday);
    }
    return weekdayNames;
  } catch (e) {
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  }
}

export function getShortWeekdayNamesStartingFromMon() {
  const arr = getShortWeekdayNamesStartingFromSun();
  const sun = arr.shift();
  arr.push(sun);
  return arr;
}

// 1 is Monday, 7 is Sunday, like in
// https://tc39.es/proposal-intl-locale-info/#sec-week-info-of-locale
export function getWeekFirstDay() {
  try {
    const currLocale = new Intl.DateTimeFormat().resolvedOptions().locale;
    return new Intl.Locale(currLocale).weekInfo.firstDay;
  } catch (e) {
    return 1;
  }
}

export function getDateString(year, monthIndex, day, options = {}) {
  const date = new Date(year, monthIndex, day);
  if (year == new Date().getFullYear()) {
    return date.toLocaleDateString(undefined, {
      ...options,
      ...{ month: "short", day: "numeric" },
    });
  } else {
    return date.toLocaleDateString(undefined, {
      ...options,
      ...{ year: "numeric", month: "short", day: "numeric" },
    });
  }
}

export function generateUid() {
  try {
    return crypto.randomUUID();
  } catch (e) {
    return Date.now() + "-" + Math.floor(Math.random() * 2000000000);
  }
}

export function simplifyString(str) {
  const MAX_LEN = 32;
  let ret = str.replace(/\n/g, " ");
  if (ret.length > MAX_LEN) {
    ret = ret.substring(0, MAX_LEN - 1).trim() + "…";
  }
  return ret;
}

export function validateColor(color) {
  if (typeof color === "string" && color[0] === "#") {
    return color;
  } else {
    return "#ffb200";
  }
}

export function addLeadingZeros(num, size) {
  const s = "000000000" + num;
  return s.substring(s.length - size);
}

export function icsDateStringToIsoString(icsDateString) {
  const year = icsDateString.substr(0, 4);
  const month = icsDateString.substr(4, 2);
  const day = icsDateString.substr(6, 2);
  const hour = icsDateString.substr(9, 2);
  const min = icsDateString.substr(11, 2);
  const sec = icsDateString.substr(13, 2);
  return (
    year +
    "-" +
    month +
    "-" +
    day +
    "T" +
    hour +
    ":" +
    min +
    ":" +
    sec +
    ".000Z"
  );
}

export function ymdToIcsDateString(year, monthIndex, day) {
  return (
    addLeadingZeros(year, 4) +
    addLeadingZeros(monthIndex + 1, 2) +
    addLeadingZeros(day, 2)
  );
}

export function unifiedIcsDateStringToDateObj(icsDateString) {
  if (icsDateString.length >= 15) {
    return new Date(icsDateStringToIsoString(icsDateString));
  } else {
    const year = parseInt(icsDateString.substr(0, 4), 10);
    const monthIndex = parseInt(icsDateString.substr(4, 2) - 1, 10);
    const day = parseInt(icsDateString.substr(6, 2), 10);
    return new Date(year, monthIndex, day);
  }
}

export function dateToIcsDateString(date) {
  const isoString = date.toISOString();
  const formattedString = isoString.replace(/[-:.]/g, "");
  return formattedString.substring(0, formattedString.length - 4) + "Z";
}

export function icsDateStringToLocalTimeString(
  icsDateString,
  options = { editable: false }
) {
  if (icsDateString.length != 16) {
    return "";
  }
  const date = unifiedIcsDateStringToDateObj(icsDateString);
  if (options.editable) {
    return (
      addLeadingZeros(date.getHours(), 2) +
      ":" +
      addLeadingZeros(date.getMinutes(), 2)
    );
  } else {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "numeric",
    });
  }
}
