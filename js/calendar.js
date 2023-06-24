import { eventArrayToIcsString } from "./ics-writer";
import { icsStringToEventArray } from "./ics-reader";
import * as tools from "./tools";

class CalEvent {
  uid = "";

  /** unified to `yyyymmdd` for whole day events or `yyyymmddThhmmssZ` for UTC times */
  dtStart = "";

  /** whole day or UTC time after the event (does not belong to the event), empty when unset */
  dtEnd = "";

  summary = "";
  color = "";
  creator = "";

  constructor() {}
}

export function newEvent() {
  return new CalEvent();
}

export const cal = {
  // current date
  nowDay: 0,
  nowMonth: 0,
  nowYear: 0,

  // selected date
  selDay: 0,
  selMonth: 0,
  selYear: 0,

  /** @type {CalEvent[]} */
  events: null,

  monthNames: tools.getShortMonthNames(),
  weekStartsMonday: tools.getWeekFirstDay() === 1,
  weekdayNames: null,
  color: null,
  touchstartX: 0,

  // html elements
  monthScreen: document.getElementById("monthScreen"),
  monthTitle: document.getElementById("monthTitle"),
  daysGrid: document.getElementById("daysGrid"),

  monthSelMonth: document.getElementById("monthSelMonth"),
  monthSelYear: document.getElementById("monthSelYear"),
  possibleLines: -1,

  dayScreen: document.getElementById("dayScreen"),
  dayTitle: document.getElementById("dayTitle"),
  eventBoxes: document.getElementById("eventBoxes"),
  eventBoxesButtonBar: document.getElementById("eventBoxesButtonBar"),
  editEventText: document.getElementById("editEventText"),
  editEventUseTime: document.getElementById("editEventUseTime"),
  editEventStartTime: document.getElementById("editEventStartTime"),
  editEventDetailsDiv: document.getElementById("editEventDetailsDiv"),

  drawer: document.getElementById("drawer"),

  init: () => {
    const now = new Date();
    cal.nowMonth = now.getMonth();
    cal.nowYear = parseInt(now.getFullYear());
    cal.nowDay = now.getDate();

    cal.events = [];
    cal.weekdayNames = cal.weekStartsMonday
      ? tools.getShortWeekdayNamesStartingFromMon()
      : tools.getShortWeekdayNamesStartingFromSun();

    document.getElementById("nextDay").onclick = cal.nextDay;
    document.getElementById("prevDay").onclick = cal.prevDay;
    document.getElementById("nextMonth").onclick = cal.nextMonth;
    document.getElementById("prevMonth").onclick = cal.prevMonth;

    document.getElementById("monthSelOkButton").onclick = cal.doMonthSel;

    document.getElementById("dayScreenCloseButton").onclick =
      cal.closeDayScreen;
    document.getElementById("importFromFileButton").onclick =
      cal.importFromFile;
    document.getElementById("exportToFileButton").onclick = () =>
      cal.sendToChat();

    document.getElementById("mainmenu").onclick = cal.openDrawer;
    document.getElementById("drawerCloseButton").onclick = cal.closeDrawer;
    cal.drawer.onclick = (e) => {
      if (e.target == cal.drawer) {
        cal.closeDrawer();
      }
    };
    document.getElementById("addEventButton").onclick = () =>
      cal.showEditEvent();
    document.getElementById("todayMonth").onclick = cal.gotoToday;

    // swipe listeners for mobile
    cal.daysGrid.addEventListener(
      "touchstart",
      (event) => {
        cal.touchstartX = event.changedTouches[0].screenX;
      },
      false
    );
    cal.daysGrid.addEventListener(
      "touchend",
      (event) => {
        const touchendX = event.changedTouches[0].screenX;
        if (touchendX < cal.touchstartX - 100) {
          cal.nextMonth();
        } else if (touchendX > cal.touchstartX + 100) {
          cal.prevMonth();
        }
      },
      false
    );
    addEventListener("resize", (event) => {
      if (
        cal.possibleLines != -1 &&
        cal.possibleLines != cal.calcPossibleLines()
      ) {
        cal.renderSelectedMonth();
      }
    });

    addEventListener("keyup", (e) => {
      if (e.key === "Escape") {
        if (!document.getElementById("alert").classList.contains("hidden")) {
          document.getElementById("alert").classList.add("hidden");
        } else if (!cal.editEventDetailsDiv.classList.contains("hidden")) {
          // do nothing to avoid loss of changed data
        } else if (!cal.dayScreen.classList.contains("hidden")) {
          cal.closeDayScreen();
        } else if (!cal.drawer.classList.contains("hidden")) {
          cal.closeDrawer();
        }
      }
    });

    // init month and day selectors
    for (let i = 0; i < 12; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = cal.monthNames[i];
      if (i == cal.nowMonth) {
        opt.selected = true;
      }
      cal.monthSelMonth.appendChild(opt);
    }
    for (let i = cal.nowYear - 30; i <= cal.nowYear + 30; i++) {
      const opt = document.createElement("option");
      opt.value = String(i);
      opt.textContent = String(i);
      if (i == cal.nowYear) {
        opt.selected = true;
      }
      cal.monthSelYear.appendChild(opt);
    }

    // handle past and future state updates
    window.webxdc
      .setUpdateListener((update) => {
        try {
          update.payload.actions.forEach((action) => {
            if (action.action == "add") {
              if (
                cal.events.find((e) => e.uid === action.event.uid) === undefined
              ) {
                cal.events.push(action.event);
              } else {
                console.error(
                  "event already exists: " +
                    tools.simplifyString(action.event.summary) +
                    " (" +
                    action.event.uid +
                    ")"
                );
              }
            } else if (action.action == "edit") {
              const i = cal.events.findIndex((e) => e.uid === action.event.uid);
              if (i != -1) {
                cal.events[i] = action.event;
              } else {
                console.error(
                  "event not found: " +
                    tools.simplifyString(action.event.summary) +
                    " (" +
                    action.event.uid +
                    ")"
                );
              }
            } else if (action.action == "delete") {
              const index = cal.events.findIndex((e) => e.uid === action.uid);
              if (index != -1) cal.events.splice(index, 1);
            }
          });
        } catch (e) {
          console.error(e);
        }
        if (cal.initDone) {
          cal.sortEvents();
          cal.renderSelectedMonth();
          if (!cal.dayScreen.classList.contains("hidden")) {
            cal.renderAndSelectDay(cal.selYear, cal.selMonth, cal.selDay);
          }
        }
      })
      .then(() => {
        cal.sortEvents();
        cal.renderSelectedMonth();
        cal.initDone = true;
      });
  },

  daysInSelMonth: () => {
    return new Date(cal.selYear, cal.selMonth + 1, 0).getDate();
  },

  prevDay: () => {
    if (cal.selDay - 1 > 0) {
      cal.renderAndSelectDay(cal.selYear, cal.selMonth, cal.selDay - 1);
    } else {
      if (cal.selMonth - 1 >= 0) {
        cal.selMonth--;
      } else {
        cal.selMonth = 11;
        cal.selYear--;
      }
      cal.renderAndSelectDay(cal.selYear, cal.selMonth, cal.daysInSelMonth());
    }
  },

  nextDay: () => {
    if (cal.selDay + 1 <= cal.daysInSelMonth()) {
      cal.renderAndSelectDay(cal.selYear, cal.selMonth, cal.selDay + 1);
    } else {
      if (cal.selMonth + 1 > 11) {
        cal.selMonth = 0;
        cal.selYear++;
      } else {
        cal.selMonth++;
      }
      cal.renderAndSelectDay(cal.selYear, cal.selMonth, 1);
    }
  },

  prevMonth: () => {
    if (cal.monthSelMonth.value > 0) {
      cal.monthSelMonth.value = Number.parseInt(cal.monthSelMonth.value) - 1;
    } else {
      cal.monthSelYear.value = Number.parseInt(cal.monthSelYear.value) - 1;
      cal.monthSelMonth.value = "11";
    }
    cal.renderSelectedMonth();
  },

  nextMonth: () => {
    if (cal.monthSelMonth.value < 11) {
      cal.monthSelMonth.value = Number.parseInt(cal.monthSelMonth.value) + 1;
    } else {
      cal.monthSelYear.value = Number.parseInt(cal.monthSelYear.value) + 1;
      cal.monthSelMonth.value = "0";
    }
    cal.renderSelectedMonth();
  },

  gotoToday: () => {
    cal.selDay = cal.nowDay;
    cal.selMonth = cal.nowMonth;
    cal.selYear = cal.nowYear;
    cal.monthSelMonth.value = cal.nowMonth;
    cal.monthSelYear.value = cal.nowYear;
    cal.renderSelectedMonth();
    if (!cal.dayScreen.classList.contains("hidden")) {
      cal.renderAndSelectDay(cal.nowYear, cal.nowMonth, cal.nowDay);
    }
  },

  calcPossibleLines: () => {
    const allHeight = Math.max(1, cal.daysGrid.offsetHeight);
    const lineHeight = Math.max(1, parseInt(cal.monthTitle.offsetHeight * 0.9)); // use sth. that is already on screen
    return parseInt(allHeight / lineHeight);
  },

  sortEvents: () => {
    cal.events.sort((a, b) => {
      // sort whole days before concrete times by adding a prefix
      const aa = (a.dtStart.length == 8 ? "X" : "Y") + a.dtStart;
      const bb = (b.dtStart.length == 8 ? "X" : "Y") + b.dtStart;
      if (aa < bb) {
        return -1;
      }
      if (aa > bb) {
        return 1;
      }
      return 0;
    });
  },

  getEventsForDay: (year, month, day) => {
    const dayStart = new Date(year, month, day).getTime();
    const dayEnd = new Date(year, month, day + 1).getTime(); // Date() takes care of overflows
    const events = cal.events.filter((event) => {
      const eventStart = tools
        .unifiedIcsDateStringToDateObj(event.dtStart)
        .getTime();
      return eventStart >= dayStart && eventStart < dayEnd;
    });
    return events; // CalEvent[]
  },

  renderSelectedMonth: () => {
    cal.selMonth = parseInt(cal.monthSelMonth.value); // 0=jan, 11=dec
    cal.selYear = parseInt(cal.monthSelYear.value);
    const daysInMonth = cal.daysInSelMonth();
    const startWeekday = new Date(cal.selYear, cal.selMonth, 1).getDay(); // 0=sun, 6=sat
    const endWeekday = new Date(
      cal.selYear,
      cal.selMonth,
      daysInMonth
    ).getDay(); // 0=sun, 6=sat

    // blank squares before start of month
    const squares = [];
    if (cal.weekStartsMonday && startWeekday != 1) {
      const blanks = startWeekday == 0 ? 7 : startWeekday;
      for (let i = 1; i < blanks; i++) {
        squares.push("b");
      }
    }
    if (!cal.weekStartsMonday && startWeekday != 0) {
      for (let i = 0; i < startWeekday; i++) {
        squares.push("b");
      }
    }

    // squares for each day of the month
    for (let i = 1; i <= daysInMonth; i++) {
      squares.push(i);
    }

    // blank squares after end of month
    if (cal.weekStartsMonday && endWeekday != 0) {
      const blanks = endWeekday == 6 ? 1 : 7 - endWeekday;
      for (let i = 0; i < blanks; i++) {
        squares.push("b");
      }
    }
    if (!cal.weekStartsMonday && endWeekday != 6) {
      const blanks = endWeekday == 0 ? 6 : 6 - endWeekday;
      for (let i = 0; i < blanks; i++) {
        squares.push("b");
      }
    }

    // draw month overview
    tools.removeAllChildren(cal.daysGrid);
    cal.monthTitle.textContent =
      cal.monthNames[cal.selMonth] + " " + cal.selYear;

    // first row are day names
    const weekdaysTr = document.createElement("tr");
    weekdaysTr.classList.add("weekdays");
    for (const day of cal.weekdayNames) {
      const cCell = document.createElement("td");
      cCell.textContent = day;
      weekdaysTr.appendChild(cCell);
    }
    cal.daysGrid.appendChild(weekdaysTr);

    // subsequent rows are a week with dayNumber and events each
    let weekTr = null;
    let daysAdded = 7; // 7 = out of range, start new row
    const rowsCount = Math.ceil(squares.length / 7);
    const rowHeightPercent = parseInt(87 / rowsCount); // this "87" works for firefox/chrome/safari

    cal.possibleLines = cal.calcPossibleLines();
    const linesPerRow = parseInt(cal.possibleLines / rowsCount);
    const maxEventLines = Math.max(2, linesPerRow - 1);
    for (let i = 0; i < squares.length; i++) {
      const day = squares[i];
      const cCell = document.createElement("td");
      if (day == "b") {
        cCell.classList.add("blank");
      } else {
        if (
          cal.nowDay === day &&
          cal.nowMonth === cal.selMonth &&
          cal.nowYear === cal.selYear
        ) {
          cCell.classList.add("today");
        }
        if (
          (cal.weekStartsMonday && (daysAdded == 5 || daysAdded == 6)) ||
          (!cal.weekStartsMonday && (daysAdded == 7 || daysAdded == 6))
        ) {
          cCell.classList.add("weekend");
        }
        const dayNumber = document.createElement("span");
        dayNumber.classList.add("dayNumber");
        dayNumber.textContent = String(day);
        const dayLine = document.createElement("div");
        dayLine.classList.add("dayInfoLine");
        dayLine.appendChild(dayNumber);
        cCell.appendChild(dayLine);

        const eventsDay = cal.getEventsForDay(cal.selYear, cal.selMonth, day);

        for (let j = 0; j < eventsDay.length; j++) {
          if (j >= maxEventLines - 1 && eventsDay.length != maxEventLines) {
            const evt = document.createElement("div");
            evt.classList.add("evtMore");
            evt.textContent = "+" + (eventsDay.length - j);
            cCell.appendChild(evt);
            break;
          }
          const evt = document.createElement("div");
          evt.classList.add("evtSmall");
          evt.textContent = eventsDay[j].summary;
          evt.style.backgroundColor = tools.validateColor(eventsDay[j].color);
          cCell.appendChild(evt);
        }
        cCell.onclick = () => {
          const day = Number.parseInt(
            cCell.getElementsByClassName("dayNumber")[0].textContent
          );
          cal.renderAndSelectDay(cal.selYear, cal.selMonth, day);
        };
      }
      if (daysAdded === 7) {
        weekTr = document.createElement("tr");
        weekTr.setAttribute("height", rowHeightPercent + "%");
        cal.daysGrid.appendChild(weekTr);
        daysAdded = 0;
      }
      weekTr.appendChild(cCell);
      daysAdded++;
    }
  },

  // day view

  renderAndSelectDay: (year, month, day) => {
    cal.selDay = day;
    const dayEvents = cal.getEventsForDay(year, month, day);

    tools.removeAllChildren(cal.eventBoxes);
    if (dayEvents.length > 0) {
      for (const event of dayEvents) {
        const eventBox = document.createElement("div");
        eventBox.style.backgroundColor = tools.validateColor(event.color);

        const eventMeta = document.createElement("div");
        eventMeta.classList.add("eventMeta");

        const info = document.createElement("div");
        let str = tools.icsDateStringToLocalTimeString(event.dtStart);
        if (event.creator != "") {
          str += (str == "" ? "" : ", ") + event.creator;
        }
        info.textContent = str;

        const exportButton = document.createElement("span");
        exportButton.innerText = "Share";
        exportButton.setAttribute("class", "eventAction");
        exportButton.setAttribute("data-id", event.uid);
        exportButton.onclick = (ev) =>
          cal.sendToChat(ev.currentTarget.getAttribute("data-id"));

        const editButton = document.createElement("span");
        editButton.innerText = "Edit";
        editButton.setAttribute("class", "eventAction");
        editButton.setAttribute("data-id", event.uid);
        editButton.onclick = (ev) =>
          cal.showEditEvent(ev.currentTarget.getAttribute("data-id"));

        const summary = document.createElement("div");
        summary.textContent = event.summary;

        eventMeta.appendChild(editButton);
        eventMeta.appendChild(exportButton);
        eventMeta.appendChild(info);
        eventBox.appendChild(eventMeta);
        eventBox.appendChild(summary);
        cal.eventBoxes.appendChild(eventBox);
      }
    } else {
      const p = document.createElement("p");
      p.setAttribute("class", "noEvents");
      p.innerText = 'Tap "New Event" to add events.';
      cal.eventBoxes.appendChild(p);
    }

    cal.dayTitle.textContent = tools.getDateString(year, month, day, {
      weekday: "short",
      year: "numeric",
    });
    cal.dayScreen.classList.remove("hidden");
  },

  closeDayScreen: () => {
    cal.dayScreen.classList.add("hidden");
    cal.closeEditEvent();
  },

  // event editor

  /** show dialog to add (editUid undefined) or edit an event (editUid defined) */
  showEditEvent: (editUid = undefined) => {
    const okButton = document.getElementById("editEventOkButton");
    const deleteButton = document.getElementById("editEventDeleteButton");
    const colorButtons = document.getElementsByClassName("colorBtns");
    document.getElementById("editEventCancelButton").onclick =
      cal.closeEditEvent;

    for (const button of colorButtons) {
      button.onclick = (ev) => selectColor(ev.target);
    }
    function selectColor(el) {
      cal.color = el.getAttribute("data-color");
      for (const button of colorButtons) {
        if (button.getAttribute("data-color") == cal.color) {
          button.style.backgroundColor = cal.color;
          button.style.color = "white";
        } else {
          button.style.backgroundColor = "transparent";
          button.style.color = "inherit";
        }
      }
    }

    cal.editEventText.value = "";
    cal.editEventUseTime.checked = false;
    selectColor(document.getElementById("defaultColor"));
    if (editUid) {
      const event = cal.events.find((e) => e.uid === editUid);
      cal.editEventText.value = event.summary;
      for (const button of colorButtons) {
        if (button.getAttribute("data-color") == event.color) {
          selectColor(button);
        }
      }
      cal.editEventStartTime.value = tools.icsDateStringToLocalTimeString(
        event.dtStart,
        { editable: true }
      );
      cal.editEventUseTime.checked = cal.editEventStartTime.value != "";
      deleteButton.classList.remove("hidden");
      deleteButton.onclick = (ev) => cal.deleteEvent(editUid);
      okButton.classList.remove("disabled");
      okButton.onclick = () => {
        cal.doEditEvent(editUid);
        cal.closeEditEvent();
      };
      okButton.innerText = "Save";
    } else {
      cal.editEventText.addEventListener("input", () => {
        if (cal.editEventText.value.trim() != "") {
          okButton.classList.remove("disabled");
        } else {
          okButton.classList.add("disabled");
        }
      });
      deleteButton.classList.add("hidden");
      okButton.classList.add("disabled");
      okButton.onclick = () => {
        cal.doEditEvent(editUid);
        cal.closeDayScreen();
      };
      okButton.innerText = "Add Event";
    }

    if (!cal.editEventUseTime.checked) {
      cal.editEventStartTime.value =
        tools.addLeadingZeros(new Date().getHours(), 2) + ":00";
    }

    cal.eventBoxes.classList.add("hidden");
    cal.eventBoxesButtonBar.classList.add("hidden");
    cal.editEventDetailsDiv.classList.remove("hidden");
  },

  /** adds (editUid undefined) or edits an event (editUid defined) */
  doEditEvent: (editUid) => {
    const event = new CalEvent();
    event.uid = editUid ? editUid : tools.generateUid();
    event.summary = cal.editEventText.value;
    event.color = cal.color;
    event.creator = window.webxdc.selfName;

    const time = cal.editEventStartTime.value.split(":");
    const hour = parseInt(time[0]);
    const minute = parseInt(time[1]);
    if (
      cal.editEventUseTime.checked &&
      time.length == 2 &&
      hour >= 0 &&
      hour <= 23 &&
      minute >= 0 &&
      minute <= 59
    ) {
      event.dtStart = tools.dateToIcsDateString(
        new Date(cal.selYear, cal.selMonth, cal.selDay, hour, minute, 0)
      );
      event.dtEnd = "";
    } else {
      event.dtStart = tools.ymdToIcsDateString(
        cal.selYear,
        cal.selMonth,
        cal.selDay
      );
      const end = new Date(cal.selYear, cal.selMonth, cal.selDay + 1); // Date() takes care of overflows
      event.dtEnd = tools.ymdToIcsDateString(
        end.getFullYear(),
        end.getMonth(),
        end.getDate()
      );
    }

    const info =
      window.webxdc.selfName +
      (editUid ? ' edited "' : ' created "') +
      tools.simplifyString(cal.editEventText.value) +
      '" on ' +
      tools.getDateString(cal.selYear, cal.selMonth, cal.selDay);
    if (editUid) {
      const old = cal.events.find((e) => e.uid === editUid);
      if (
        event.summary === old.summary &&
        event.dtStart === old.dtStart &&
        event.dtEnd === old.dtEnd &&
        event.color === old.color
      ) {
        console.log("no changes");
        return;
      }
      window.webxdc.sendUpdate(
        {
          payload: { actions: [{ action: "edit", event }] },
          info: undefined,
          summary: "" + cal.events.length + " events",
        },
        info
      );
    } else {
      window.webxdc.sendUpdate(
        {
          payload: { actions: [{ action: "add", event }] },
          info: info,
          summary: "" + (cal.events.length + 1) + " events",
        },
        info
      );
    }
  },

  deleteEvent: (uid) => {
    const eventToDelete = cal.events.find((e) => e.uid === uid);
    cal.showAlert(
      "Delete '" + tools.simplifyString(eventToDelete.summary) + "'?",
      "Delete",
      "Cancel",
      () => {
        const info =
          window.webxdc.selfName +
          ' deleted "' +
          tools.simplifyString(eventToDelete.summary) +
          '" from ' +
          tools.getDateString(cal.selYear, cal.selMonth, cal.selDay);
        window.webxdc.sendUpdate(
          {
            payload: { actions: [{ action: "delete", uid: uid }] },
            info: info,
            summary: "" + (cal.events.length - 1) + " events",
          },
          info
        );
        cal.closeEditEvent();
      }
    );
  },

  closeEditEvent: () => {
    cal.eventBoxes.classList.remove("hidden");
    cal.editEventDetailsDiv.classList.add("hidden");
    cal.eventBoxesButtonBar.classList.remove("hidden");
  },

  // drawer

  openDrawer: () => {
    cal.drawer.classList.remove("hidden");
  },

  doMonthSel: () => {
    cal.renderSelectedMonth();
    cal.closeDrawer();
  },

  sendToChat: (uid = undefined) => {
    if (!window.webxdc.sendToChat) {
      cal.showAlert(
        "Please update to Delta Chat 1.38 or compatible to use this function.",
        "OK"
      );
      return;
    }

    let data = "";
    let title = "";
    if (uid === undefined) {
      data = eventArrayToIcsString(cal.events);
    } else {
      const event = cal.events.filter((e) => e.uid === uid);
      data = eventArrayToIcsString(event);
      if (event.length === 1) {
        title = event[0].summary;
      }
    }

    window.webxdc
      .sendToChat({
        file: { name: "event.ics", plainText: data },
        text: title,
      })
      .catch((error) => {
        console.error("export failed", error);
      });
  },

  importFromFile: async () => {
    if (!window.webxdc.importFiles) {
      cal.showAlert(
        "Please update to Delta Chat 1.38 or compatible to use this function.",
        "OK"
      );
      return;
    }

    const [file] = await window.webxdc.importFiles({
      mimeTypes: ["text/calendar"],
      extensions: [".ics"],
    });
    const text = await file.text();
    const events = icsStringToEventArray(text, newEvent);

    if (events.length == 0) {
      cal.showAlert(
        '"' +
          file.name +
          '" cannot be read. No events were added to your calendar.',
        "OK"
      );
      cal.closeDrawer();
      return;
    }

    const actions = [];
    let notDuplicateEvents = 0;
    for (const event of events) {
      if (cal.events.find((e) => e.uid === event.uid) === undefined) {
        notDuplicateEvents++;
      }
      // also send duplicates: this may have some sync advantages (receiver checks for duplicates as well)
      actions.push({ action: "add", event });
    }
    const info =
      window.webxdc.selfName + " imported " + actions.length + " events";
    window.webxdc.sendUpdate(
      {
        payload: { actions: actions },
        info: info,
        summary: "" + (cal.events.length + notDuplicateEvents) + " events",
      },
      info
    );
    cal.showAlert(
      "" +
        notDuplicateEvents +
        " new event(s) " +
        "and " +
        (events.length - notDuplicateEvents) +
        " duplicate(s) " +
        'imported from "' +
        file.name +
        '".',
      "OK"
    );
    cal.closeDrawer();
  },

  closeDrawer: () => {
    cal.drawer.classList.add("hidden");
  },

  // tools

  showAlert: (
    msg,
    primaryLabel,
    cancelLabel = undefined,
    primaryCallback = undefined
  ) => {
    const dlg = document.getElementById("alert");
    const cancel = document.getElementById("alertCancel");
    const primary = document.getElementById("alertPrimary");

    primary.textContent = primaryLabel;
    primary.onclick = () => {
      dlg.classList.add("hidden");
      if (primaryCallback !== undefined) {
        primaryCallback();
      }
    };
    if (cancelLabel === undefined) {
      cancel.classList.add("hidden");
    } else {
      cancel.classList.remove("hidden");
      cancel.textContent = cancelLabel;
      cancel.onclick = () => dlg.classList.add("hidden");
    }
    document.getElementById("alertText").textContent = msg;
    dlg.classList.remove("hidden");
  },
};

window.addEventListener("load", cal.init);
