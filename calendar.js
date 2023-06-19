
class CalEvent {
    uid              = '';

    /** unified to `yyyymmdd` for whole day events or `yyyymmddThhmmssZ` for UTC times */
    dtStart          = '';

    /** whole day or UTC time after the event (does not belong to the event), empty when unset */
    dtEnd            = '';

    summary          = '';
    color            = '';
    creator          = '';

    constructor() {
    }
}

var cal = {
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

    monthNames: getShortMonthNames(),
    weekStartsMonday: getWeekFirstDay() === 1,
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
    editEventDetailsDiv: document.getElementById("editEventDetailsDiv"),

    drawer: document.getElementById("drawer"),

    init: () => {
        const now = new Date();
        cal.nowMonth = now.getMonth();
        cal.nowYear = parseInt(now.getFullYear());
        cal.nowDay = now.getDate();

        cal.events = [];
        cal.weekdayNames = cal.weekStartsMonday ? getShortWeekdayNamesStartingFromMon() : getShortWeekdayNamesStartingFromSun();

        document.getElementById("nextDay").onclick = cal.nextDay;
        document.getElementById("prevDay").onclick = cal.prevDay;
        document.getElementById("nextMonth").onclick = cal.nextMonth;
        document.getElementById("prevMonth").onclick = cal.prevMonth;

        document.getElementById("monthSelOkButton").onclick = cal.doMonthSel;

        document.getElementById("dayScreenCloseButton").onclick = cal.closeDayScreen;
        document.getElementById("importFromFileButton").onclick = cal.importFromFile;
        document.getElementById("exportToFileButton").onclick = () => cal.sendToChat();

        document.getElementById("mainmenu").onclick = cal.openDrawer;
        document.getElementById("drawerCloseButton").onclick = cal.closeDrawer;
        cal.drawer.onclick = (e) => {
            if (e.target == cal.drawer) {
                cal.closeDrawer();
            }
        };
        document.getElementById("addEventButton").onclick = () => cal.showEditEvent();
        document.getElementById("todayMonth").onclick = cal.gotoToday;

        // swipe listeners for mobile
        cal.daysGrid.addEventListener("touchstart", (event) => {
                cal.touchstartX = event.changedTouches[0].screenX;
            }, false);
        cal.daysGrid.addEventListener("touchend", (event) => {
                const touchendX = event.changedTouches[0].screenX;
                if (touchendX < cal.touchstartX - 100) {
                    cal.nextMonth();
                } else if (touchendX > cal.touchstartX + 100) {
                    cal.prevMonth();
                }
            }, false);
        addEventListener("resize", (event) => {
            if (cal.possibleLines != -1 && cal.possibleLines != cal.calcPossibleLines()) {
                cal.renderSelectedMonth();
            }
        });

        // init month and day selectors
        for (let i = 0; i < 12; i++) {
            let opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = cal.monthNames[i];
            if (i == cal.nowMonth) {
                opt.selected = true;
            }
            cal.monthSelMonth.appendChild(opt);
        }
        for (let i = cal.nowYear - 30; i <= cal.nowYear + 30; i++) {
            let opt = document.createElement("option");
            opt.value = String(i);
            opt.textContent = String(i);
            if (i == cal.nowYear) {
                opt.selected = true;
            }
            cal.monthSelYear.appendChild(opt);
        }

        // handle past and future state updates
        window.webxdc.setUpdateListener((update) => {
            try {
                update.payload.actions.forEach((action) => {
                    if (action.action == 'add') {
                        if (cal.events.find((e) => e.uid === action.event.uid) === undefined) {
                            cal.events.push(action.event);
                        } else {
                            console.log('event already exists: ' + simplifyString(action.event.summary) + ' (' + action.event.uid + ')');
                        }
                    } else if (action.action == 'edit') {
                        let i = cal.events.findIndex((e) => e.uid === action.event.uid);
                        if (i != -1) {
                            cal.events[i] = action.event;
                        } else {
                            console.log('event not found: ' + simplifyString(action.event.summary) + ' (' + action.event.uid + ')');
                        }
                    } else if (action.action == 'delete') {
                        let index = cal.events.findIndex((e) => e.uid === action.uid);
                        if (index != -1) cal.events.splice(index, 1);
                    }
                });
            } catch(e) {
                console.error(e);
            }
            if (cal.initDone) {
                cal.renderSelectedMonth();
                if (!dayScreen.classList.contains("hidden")) {
                    cal.renderAndSelectDay(cal.selYear, cal.selMonth, cal.selDay);
                }
            }
        }).then(() => {
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
        if (!dayScreen.classList.contains("hidden")) {
            cal.renderAndSelectDay(cal.nowYear, cal.nowMonth, cal.nowDay);
        }
    },

    calcPossibleLines: () => {
        const allHeight = Math.max(1, cal.daysGrid.offsetHeight);
        const lineHeight = Math.max(1, parseInt(cal.monthTitle.offsetHeight*.9)); // use sth. that is already on screen
        return parseInt(allHeight / lineHeight);
    },

    getEventsForDay: (year, month, day) => {
        const dayStart = new Date(year, month, day).getTime();
        const dayEnd = new Date(year, month, day + 1).getTime(); // Date() takes care of overflows
        var events = cal.events.filter((event) => {
            const eventStart = unifiedIcsDateStringToDateObj(event.dtStart).getTime();
            return eventStart >= dayStart && eventStart < dayEnd;
        });
        return events; // CalEvent[]
    },

    renderSelectedMonth: () => {
        cal.selMonth = parseInt(cal.monthSelMonth.value); // 0=jan, 11=dec
        cal.selYear = parseInt(cal.monthSelYear.value);
        const daysInMonth = cal.daysInSelMonth();
        const startWeekday = new Date(cal.selYear, cal.selMonth, 1).getDay(); // 0=sun, 6=sat
        const endWeekday = new Date(cal.selYear, cal.selMonth, daysInMonth).getDay(); // 0=sun, 6=sat

        // blank squares before start of month
        let squares = [];
        if (cal.weekStartsMonday && startWeekday != 1) {
            let blanks = startWeekday == 0 ? 7 : startWeekday;
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
            let blanks = endWeekday == 6 ? 1 : 7 - endWeekday;
            for (let i = 0; i < blanks; i++) {
                squares.push("b");
            }
        }
        if (!cal.weekStartsMonday && endWeekday != 6) {
            let blanks = endWeekday == 0 ? 6 : 6 - endWeekday;
            for (let i = 0; i < blanks; i++) {
                squares.push("b");
            }
        }

        // draw month overview
        removeAllChildren(cal.daysGrid);
        cal.monthTitle.textContent = cal.monthNames[cal.selMonth] + " " + cal.selYear;

        // first row are day names
        let weekdaysTr = document.createElement("tr");
        weekdaysTr.classList.add("weekdays");
        for (let d of cal.weekdayNames) {
            let cCell = document.createElement("td");
            cCell.textContent = d;
            weekdaysTr.appendChild(cCell);
        }
        cal.daysGrid.appendChild(weekdaysTr);

        // subsequent rows are a week with dayNumber and events each
        let weekTr = null;
        var daysAdded = 7; // 7 = out of range, start new row
        const rowsCount = Math.ceil(squares.length / 7);
        const rowHeightPercent = parseInt(87/rowsCount); // this "87" works for firefox/chrome/safari

        cal.possibleLines = cal.calcPossibleLines();
        const linesPerRow = parseInt(cal.possibleLines / rowsCount);
        const maxEventLines = Math.max(2, linesPerRow - 1);
        for (let i = 0; i < squares.length; i++) {
            var day = squares[i];
            let cCell = document.createElement("td");
            if (day == "b") {
                cCell.classList.add("blank");
            } else {
                if (cal.nowDay === day && cal.nowMonth === cal.selMonth && cal.nowYear === cal.selYear) {
                    cCell.classList.add("today");
                }
                if ( cal.weekStartsMonday && (daysAdded == 5 || daysAdded == 6)
                 || !cal.weekStartsMonday && (daysAdded == 7 || daysAdded == 6)) {
                    cCell.classList.add("weekend");
                }
                const dayNumber = document.createElement('span');
                dayNumber.classList.add("dayNumber");
                dayNumber.textContent = String(day);
                const dayLine = document.createElement('div');
                dayLine.classList.add("dayInfoLine");
                dayLine.appendChild(dayNumber)
                cCell.appendChild(dayLine);

                var eventsDay = cal.getEventsForDay(cal.selYear, cal.selMonth, day);

                for (let j = 0; j < eventsDay.length; j++) {
                    if (j >= maxEventLines-1 && eventsDay.length != maxEventLines) {
                        var evt = document.createElement("div");
                        evt.classList.add("evtMore");
                        evt.textContent = '+' + (eventsDay.length-j);
                        cCell.appendChild(evt);
                        break;
                    }
                    var evt = document.createElement("div");
                    evt.classList.add("evtSmall");
                    evt.textContent = eventsDay[j].summary;
                    evt.style.backgroundColor = validateColor(eventsDay[j].color);
                    cCell.appendChild(evt);
                }
                cCell.onclick = () => {
                    let day = Number.parseInt(cCell.getElementsByClassName("dayNumber")[0].textContent);
                    cal.renderAndSelectDay(cal.selYear, cal.selMonth, day);
                };
            }
            if (daysAdded === 7) {
                weekTr = document.createElement("tr");
                weekTr.setAttribute("height", rowHeightPercent + '%');
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
        let dayEvents = cal.getEventsForDay(year, month, day);

        removeAllChildren(cal.eventBoxes);
        if (dayEvents.length > 0) {
            for (event of dayEvents) {
                var eventBox = document.createElement("div");
                eventBox.style.backgroundColor = validateColor(event.color);

                var eventMeta = document.createElement("div");
                eventMeta.classList.add("eventMeta");

                var author = document.createElement("div");
                author.textContent = event.creator;

                var exportButton = document.createElement("span");
                exportButton.innerText = 'Share';
                exportButton.setAttribute("class", "eventAction");
                exportButton.setAttribute("data-id", event.uid);
                exportButton.onclick = (ev) => cal.sendToChat(ev.currentTarget.getAttribute("data-id"));

                var editButton = document.createElement("span");
                editButton.innerText = 'Edit';
                editButton.setAttribute("class", "eventAction");
                editButton.setAttribute("data-id", event.uid);
                editButton.onclick = (ev) => cal.showEditEvent(ev.currentTarget.getAttribute("data-id"));

                var summary = document.createElement("div");
                summary.textContent = event.summary;

                eventMeta.appendChild(editButton);
                eventMeta.appendChild(exportButton);
                eventMeta.appendChild(author);
                eventBox.appendChild(eventMeta);
                eventBox.appendChild(summary);
                cal.eventBoxes.appendChild(eventBox);
            }
        } else {
            var p = document.createElement("p");
            p.setAttribute("class", "noEvents");
            p.innerText = 'Tap "New Event" to add events.';
            cal.eventBoxes.appendChild(p);
        }

        cal.dayTitle.textContent = getDateString(year, month, day, {weekday: "short", year: "numeric"});
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
        const deleteButton = document.getElementById('editEventDeleteButton');
        const colorButtons = document.getElementsByClassName("colorBtns");
        document.getElementById("editEventCancelButton").onclick = cal.closeEditEvent;

        for (button of colorButtons) {
            button.onclick = (ev) => selectColor(ev.target);
        }
        function selectColor(el) {
            cal.color = el.getAttribute("data-color");
            for (button of colorButtons) {
                if (button.getAttribute("data-color") == cal.color) {
                    button.style.backgroundColor = cal.color;
                    button.style.color = "white";
                } else {
                    button.style.backgroundColor = "transparent";
                    button.style.color = "#333652";
                }
            }
        }

        cal.editEventText.value = "";
        selectColor(document.getElementById("defaultColor"));
        if (editUid) {
            const event = cal.events.find((e) => e.uid === editUid);
            cal.editEventText.value = event.summary;
            for (button of colorButtons) {
                if (button.getAttribute("data-color") == event.color) {
                    selectColor(button);
                }
            }
            deleteButton.classList.remove("hidden");
            deleteButton.onclick = (ev) => cal.deleteEvent(editUid);
            okButton.classList.remove("disabled");
            okButton.onclick = () => { cal.doEditEvent(editUid); cal.closeEditEvent(); };
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
            okButton.onclick = () => { cal.doEditEvent(editUid); cal.closeDayScreen(); };
            okButton.innerText = "Add Event";
        }

        cal.eventBoxes.classList.add("hidden");
        cal.eventBoxesButtonBar.classList.add("hidden");
        cal.editEventDetailsDiv.classList.remove("hidden");
    },

    /** adds (editUid undefined) or edits an event (editUid defined) */
    doEditEvent: (editUid) => {
        var event = new CalEvent();
        event.uid       = editUid ? editUid : generateUid();
        event.summary   = cal.editEventText.value;
        event.dtStart   = ymdToIcsDateString(cal.selYear, cal.selMonth, cal.selDay);
        var end = new Date(cal.selYear, cal.selMonth, cal.selDay + 1); // Date() takes care of overflows
        event.dtEnd     = ymdToIcsDateString(end.getFullYear(), end.getMonth(), end.getDate());
        event.color     = cal.color;
        event.creator   = window.webxdc.selfName;

        if (editUid) {
            const old = cal.events.find((e) => e.uid === editUid);
            if (event.summary   === old.summary
             && event.dtStart   === old.dtStart
             && event.dtEnd     === old.dtEnd
             && event.color     === old.color) {
                console.log("no changes");
                return;
            }
        }

        const info = window.webxdc.selfName + (editUid ? " edited \"" : " created \"") + simplifyString(cal.editEventText.value) +
               "\" on " + getDateString(cal.selYear, cal.selMonth, cal.selDay);
        window.webxdc.sendUpdate({
                payload: { actions: [{ action: editUid ? 'edit' : 'add', event }]},
                info: editUid ? undefined : info,
                summary: "" + (cal.events.length+1) + " events"
            },
            info
        );
    },

    deleteEvent: (uid) => {
        const eventToDelete = cal.events.find((e) => e.uid === uid);
        cal.showAlert("Delete '" + simplifyString(eventToDelete.summary) + "'?", "Delete", "Cancel", () => {
            const info = window.webxdc.selfName + " deleted \"" + simplifyString(eventToDelete.summary)
                + "\" from " + getDateString(cal.selYear, cal.selMonth, cal.selDay);
            window.webxdc.sendUpdate({
                    payload: { actions: [{ action: 'delete', uid: uid }]},
                    info: info,
                    summary: "" + (cal.events.length-1) + " events"
                },
                info
            );
            cal.closeEditEvent();
        });
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
            cal.showAlert("Please update to Delta Chat 1.38 or compatible to use this function.", "OK");
            return;
        }

        var data = '';
        var title = '';
        if (uid === undefined) {
            data = eventArrayToIcsString(cal.events);
        } else {
            let event = cal.events.filter((e) => e.uid === uid);
            data = eventArrayToIcsString(event);
            if (event.length === 1) {
                title = event[0].summary;
            }
        }

        window.webxdc.sendToChat({
            file: { name: "event.ics", plainText: data },
            text: title,
        }).catch((error) => {
            console.error("export failed", error);
        });
    },

    importFromFile: async () => {
        if (!window.webxdc.importFiles) {
            cal.showAlert("Please update to Delta Chat 1.38 or compatible to use this function.", "OK");
            return;
        }

        const [file] = await window.webxdc.importFiles({mimeTypes: ["text/calendar"], extensions: [".ics"]});
        const text = await file.text();
        const events = icsStringToEventArray(text);

        if (events.length == 0) {
            cal.showAlert('"' + file.name + '" cannot be read. No events were added to your calendar.', 'OK');
            cal.closeDrawer();
            return;
        }

        var actions = [];
        for (const event of events) {
            actions.push({ action: 'add', event});
        }
        const info = window.webxdc.selfName + ' imported ' + actions.length + ' events';
        window.webxdc.sendUpdate({
                payload: { actions: actions },
                info: info,
                summary: '' + (cal.events.length + actions.length) + ' events'
            },
            info
        );
        cal.showAlert('' + events.length + ' event(s) imported from "' + file.name + '".', 'OK');
        cal.closeDrawer();
    },

    closeDrawer: () => {
        cal.drawer.classList.add("hidden");
    },


    // tools

    showAlert: (msg, primaryLabel, cancelLabel = undefined, primaryCallback = undefined) => {
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
