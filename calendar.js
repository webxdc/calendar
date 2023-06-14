//@ts-check
/** @typedef {import('./webxdc').Webxdc} Webxdc */
/** @typedef {import('./types').CalEvent} CalEvent */

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

    monthSelScreen: document.getElementById("monthSelScreen"),
    monthSelMonth: document.getElementById("monthSelMonth"),
    monthSelYear: document.getElementById("monthSelYear"),
    possibleLines: -1,

    dayScreen: document.getElementById("dayScreen"),
    dayTitle: document.getElementById("dayTitle"),
    eventBoxes: document.getElementById("eventBoxes"),
    addEventFloatingButton: document.getElementById("addEventFloatingButton"),
    addEventText: document.getElementById("addEventText"),
    multiDayCheckbox: document.getElementById("multiDayCheckbox"),
    multiDayForm: document.getElementsByClassName("multiDayForm"), // watch out is an Array!
    addEventDetailsDiv: document.getElementById("addEventDetailsDiv"),
    addEventOkButton: document.getElementById("addEventOkButton"),

    importScreen: document.getElementById("importScreen"),

    init: () => {
        const now = new Date();
        cal.nowMonth = now.getMonth();
        cal.nowYear = parseInt(now.getFullYear());
        cal.nowDay = now.getDate();

        cal.events = [];
        cal.weekdayNames = cal.weekStartsMonday ? getShortWeekdayNamesStartingFromMon() : getShortWeekdayNamesStartingFromSun();

        cal.monthTitle.onclick = cal.showDateSel;
        document.getElementById("nextDay").onclick = cal.nextDay;
        document.getElementById("prevDay").onclick = cal.prevDay;
        document.getElementById("nextMonth").onclick = cal.nextMonth;
        document.getElementById("prevMonth").onclick = cal.prevMonth;

        document.getElementById("monthSelCancelButton").onclick = cal.closeDateSel;
        document.getElementById("monthSelOkButton").onclick = cal.doMonthSel;

        cal.addEventOkButton.classList.add("disabled");
        document.getElementById("dayScreenCloseButton").onclick = cal.closeDayScreen;
        cal.addEventOkButton.onclick = cal.doAddEvent;
        cal.color = "#FAD02C";
        document.getElementById("importFromFileButton").onclick = cal.importFromFile;
        document.getElementById("exportToFileButton").onclick = () => {
            cal.sendToChat();
        };
        document.getElementById("mainmenu").onclick = cal.openImport;
        document.getElementById("importCloseButton").onclick = cal.closeImport;
        cal.addEventFloatingButton.onclick = cal.showAddEvent;
        document.getElementById("todayMonth").onclick = cal.gotoToday;
        document.getElementById("todayDayScreen").onclick = cal.gotoToday;
        document.getElementById("addEventCancelButton").onclick = cal.cancelAddEvent;
        cal.multiDayCheckbox.onchange = (ev) => {
            //set the default date in form
            if (ev.target.checked) {
                for (let i = 0; i < cal.multiDayForm.length; i++) {
                    cal.multiDayForm[i].style.display = "block";
                }
            } else {
                for (let i = 0; i < cal.multiDayForm.length; i++) {
                    cal.multiDayForm[i].style.display = "none";
                }
            }
        };

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
                        cal.events.push(action);
                    } else {
                        let index = cal.events.findIndex((obj) => {
                            return Number.parseInt(obj.id) === Number.parseInt(action.id);
                        });
                        if (index != -1) cal.events.splice(index, 1);
                    }
                });
            } catch(e) {
                console.error(e);
            }
            if (cal.initDone) {
                cal.renderSelectedMonth();
            }
        }).then(() => {
          cal.renderSelectedMonth();
          cal.initDone = true;
      });
    },

    prevDay: () => {
        let daysInMonth = () => {
            return new Date(cal.selYear, cal.selMonth + 1, 0).getDate();
        };
        if (cal.selDay - 1 > 0) {
            cal.renderAndSelectDay(cal.selYear, cal.selMonth, cal.selDay - 1);
        } else {
            if (cal.selMonth - 1 >= 0) {
                cal.selMonth--;
                cal.renderAndSelectDay(cal.selYear, cal.selMonth, daysInMonth());
            } else {
                cal.selMonth = 11;
                cal.selYear--;
                cal.renderAndSelectDay(cal.selYear, cal.selMonth, daysInMonth());
            }
        }
    },

    nextDay: () => {
        let daysInMonth = () => {
            return new Date(cal.selYear, cal.selMonth + 1, 0).getDate();
        };
        if (cal.selDay + 1 <= daysInMonth()) {
            cal.renderAndSelectDay(cal.selYear, cal.selMonth, cal.selDay + 1);
        } else {
            if (cal.selMonth + 1 > 11) {
                cal.selMonth = 0;
                cal.selYear++;
                cal.renderAndSelectDay(cal.selYear, cal.selMonth, 1);
            } else {
                cal.selMonth++;
                cal.renderAndSelectDay(cal.selYear, cal.selMonth, 1);
            }
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

    renderSelectedMonth: () => {
        // (C1) BASIC CALCULATIONS - DAYS IN MONTH, START + END DAY
        // Note - Jan is 0 & Dec is 11
        // Note - Sun is 0 & Sat is 6
        cal.selMonth = parseInt(cal.monthSelMonth.value); // selected month
        cal.selYear = parseInt(cal.monthSelYear.value); // selected year
        let daysInMth = new Date(cal.selYear, cal.selMonth + 1, 0).getDate(), // number of days in selected month
            startDay = new Date(cal.selYear, cal.selMonth, 1).getDay(), // first day of the month
            endDay = new Date(cal.selYear, cal.selMonth, daysInMth).getDay(); // last day of the month

        // (C3) DRAWING CALCULATIONS
        // Blank squares before start of month
        let squares = [];
        if (cal.weekStartsMonday && startDay != 1) {
            let blanks = startDay == 0 ? 7 : startDay;
            for (let i = 1; i < blanks; i++) {
                squares.push("b");
            }
        }
        if (!cal.weekStartsMonday && startDay != 0) {
            for (let i = 0; i < startDay; i++) {
                squares.push("b");
            }
        }

        // Days of the month
        for (let i = 1; i <= daysInMth; i++) {
            squares.push(i);
        }

        // Blank squares after end of month
        if (cal.weekStartsMonday && endDay != 0) {
            let blanks = endDay == 6 ? 1 : 7 - endDay;
            for (let i = 0; i < blanks; i++) {
                squares.push("b");
            }
        }
        if (!cal.weekStartsMonday && endDay != 6) {
            let blanks = endDay == 0 ? 6 : 6 - endDay;
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
        var daysAdded = 7; // 7 == out of range, start new row
        const rowsCount = Math.ceil(squares.length / 7);
        const rowHeightPercent = parseInt(87/rowsCount); // this "87" works for firefox/chrome/safari

        cal.possibleLines = cal.calcPossibleLines();
        const linesPerRow = parseInt(cal.possibleLines / rowsCount);
        const maxEventLines = Math.max(1, linesPerRow - 1);
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

                var eventsDay = cal.getEvents(cal.selYear, cal.selMonth, day);

                for (let j = 0; j < eventsDay.length; j++) {
                    if (j >= maxEventLines-1 && eventsDay.length != maxEventLines) {
                        var evt = document.createElement("div");
                        evt.classList.add("evtMore");
                        evt.textContent = '+' + (eventsDay.length-j) + ' events';
                        cCell.appendChild(evt);
                        break;
                    }
                    var evt = document.createElement("div");
                    evt.classList.add("evtSmall");
                    evt.textContent = eventsDay[j].data;
                    evt.style.backgroundColor = eventsDay[j].color;
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

    renderAndSelectDay: (year, month, day) => {
        // (D1) FETCH EXISTING DATA
        cal.selDay = day;
        let dayEvents = cal.getEvents(year, month, day);

        //ADD EVENT BOXES
        cal.addEventText.value = "";
        cal.addEventOkButton.classList.add("disabled");
        cal.addEventText.addEventListener("input", () => {
            if (cal.addEventText.value.trim() != "") {
                cal.addEventOkButton.classList.remove("disabled");
            } else {
                cal.addEventOkButton.classList.add("disabled");
            }
        });

        removeAllChildren(cal.eventBoxes);
        for (const i in dayEvents) {
            var eventBox = document.createElement("div");
            var removeButton = document.createElement("span");
            var exportButton = document.createElement("span");
            var data = document.createElement("p");
            var author = document.createElement("p");
            var lilHeader = document.createElement("div");

            exportButton.innerText = 'Share';
            exportButton.setAttribute("data-id", dayEvents[i].id);
            exportButton.setAttribute("class", "event-export");

            exportButton.onclick = (ev) => {
                cal.sendToChat(ev.currentTarget.getAttribute("data-id"));
            };
            removeButton.innerHTML =
                "<svg id='i-close' viewBox='0 0 32 32' width='15' height='15' fill='none' stroke='currentcolor' stroke-linecap='round' stroke-linejoin='round' stroke-width='3.5'><path d='M2 30 L30 2 M30 30 L2 2' /></svg>";
            removeButton.setAttribute("data-id", dayEvents[i].id);

            removeButton.onclick = (ev) => {
                cal.deleteEvent(ev.currentTarget.getAttribute("data-id"));
            };
            author.textContent = dayEvents[i].creator;
            author.classList.add("evt-view-name");
            lilHeader.appendChild(author);
            lilHeader.appendChild(removeButton);
            lilHeader.appendChild(exportButton);
            eventBox.appendChild(lilHeader);
            data.textContent = dayEvents[i].data;
            data.classList.add("evt-data");
            eventBox.style.backgroundColor = dayEvents[i].color;
            eventBox.appendChild(data);
            eventBox.classList.add("evt-view");
            eventBox.classList.add("block");
            cal.eventBoxes.appendChild(eventBox);
        }

        //color buttons
        var yellow = document.getElementById("yellow"),
            red = document.getElementById("red"),
            blue = document.getElementById("blue"),
            green = document.getElementById("green");

        selectColor(yellow);

        yellow.onclick = (ev) => selectColor(ev.target);
        red.onclick = (ev) => selectColor(ev.target);
        blue.onclick = (ev) => selectColor(ev.target);
        green.onclick = (ev) => selectColor(ev.target);

        function selectColor(el) {
            cal.color = el.getAttribute("data-color");
            var buttons = document.getElementsByClassName("colorBtns");
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].getAttribute("data-color") == cal.color) {
                    buttons[i].style.backgroundColor = cal.color;
                    buttons[i].style.color = "white";
                } else {
                    buttons[i].style.backgroundColor = "transparent";
                    buttons[i].style.color = "#333652";
                }
            }
        }

        cal.dayScreen.classList.remove("hidden");

        // // (D2) UPDATE EVENT FORM
        let fullDate = new Date(year, month, day);
        cal.dayTitle.textContent = `${cal.weekdayNames[fullDate.getDay()]} ${day} ${cal.monthNames[month]} ${year}`;
    },

    showAddEvent: () => {
        cal.eventBoxes.classList.add("hidden");
        cal.addEventDetailsDiv.classList.remove("hidden");
        cal.addEventFloatingButton.classList.add("hidden");
        cal.multiDayCheckbox.checked = false;
        for (let i = 0; i < cal.multiDayForm.length; i++) {
            cal.multiDayForm[i].style.display = "none";
        }
        document.getElementById("start-day").value = `${cal.selYear}-${cal.selMonth + 1 < 10 ? "0" + (cal.selMonth + 1) : cal.selMonth + 1
            }-${cal.selDay < 10 ? "0" + cal.selDay : cal.selDay}`;
        document.getElementById("end-day").value = `${cal.selYear}-${cal.selMonth + 1 < 10 ? "0" + (cal.selMonth + 1) : cal.selMonth + 1
            }-${cal.selDay < 10 ? "0" + cal.selDay : cal.selDay}`;
    },

    cancelAddEvent: () => {
        cal.eventBoxes.classList.remove("hidden");
        cal.addEventDetailsDiv.classList.add("hidden");
        cal.addEventFloatingButton.classList.remove("hidden");
    },

    closeDayScreen: () => {
        cal.dayScreen.classList.add("hidden");
        cal.cancelAddEvent();
    },

    // GET ALL EVENTS FROM A DAY
    /**
     *
     * @param {number} year
     * @param {number} month
     * @param {number} day
     * @returns {CalEvent[]}
     */
    getEvents: (year, month, day) => {
        var events = cal.events.filter((event) => {
            let startDate = new Date(event.startDate);
            let endDate = new Date(event.endDate);
            return startDate.getFullYear() <= year && startDate.getMonth() <= month && startDate.getDate() <= day
                && endDate.getFullYear() >= year && endDate.getMonth() >= month && endDate.getDate() >= day;
        });
        return events;
    },

    doAddEvent: () => {
        let dateSt, dateEnd, color, data, info, id;
        if (cal.multiDayCheckbox.checked) {
            dateSt = new Date(document.getElementById("start-day").value);
            dateEnd = new Date(document.getElementById("end-day").value);
        } else {
            dateSt = new Date(cal.selYear, cal.selMonth, cal.selDay);
            dateEnd = dateSt;
        }
        data = cal.addEventText.value;
        color = cal.color;
        info = window.webxdc.selfName + " created \"" + simplifyString(cal.addEventText.value) +
               "\" on " + cal.monthNames[dateSt.getMonth()] + " " + dateSt.getDate();
        id = Date.now();

        window.webxdc.sendUpdate({
                payload: { actions: [{
                    action: 'add',
                    id: id,
                    startDate: dateSt.getTime(),
                    endDate: dateEnd.getTime(),
                    data: data,
                    color: color,
                    creator: window.webxdc.selfName,
                }]},
                info: info,
                summary: "" + (cal.events.length+1) + " events"
            },
            info
        );
        cal.closeDayScreen();
        return false;
    },

    deleteEvent: (id) => {
        let eventToDelete = cal.events.find((evnt) => evnt.id == id);

        let confirmationBox = document.querySelector("#confirmation");
        removeAllChildren(confirmationBox);
        confirmationBox.style.display = "block";

        let confirmationText = document.createElement("p");
        confirmationText.textContent =
            "Do you really want to delete '" + simplifyString(eventToDelete.data) + "'?";
        confirmationBox.appendChild(confirmationText);

        let btnYes = document.createElement("button");
        btnYes.classList.add("eventBtn");
        btnYes.textContent = "Yes";
        btnYes.onclick = () => {
            // send new updates
            var info =
                window.webxdc.selfName +
                " deleted \"" + simplifyString(eventToDelete.data) + "\" from " +
                cal.monthNames[cal.selMonth] + " " + cal.selDay;
            window.webxdc.sendUpdate({
                    payload: { actions: [{
                        action: 'delete',
                        id: id,
                        deleter: window.webxdc.selfName,
                    }]},
                    info: info,
                    summary: "" + (cal.events.length-1) + " events"
                },
                info
            );
            document
                .querySelector('[data-id="' + id + '"]')
                .parentElement.parentElement.remove();
            confirmationBox.style.display = "none";
        };
        confirmationBox.appendChild(btnYes);

        let btnNo = document.createElement("button");
        btnNo.classList.add("eventBtn");
        btnNo.textContent = "No";
        btnNo.onclick = () => {
            confirmationBox.style.display = "none";
        };
        confirmationBox.appendChild(btnNo);
    },

    showDateSel: () => {
        cal.monthSelScreen.classList.remove("hidden");
    },

    doMonthSel: () => {
        cal.renderSelectedMonth();
        cal.closeDateSel();
    },

    closeDateSel: () => {
        cal.monthSelScreen.classList.add("hidden");
    },

    openImport: () => {
        cal.importScreen.classList.remove("hidden");
    },

    closeImport: () => {
        cal.importScreen.classList.add("hidden");
    },

    sendToChat: (id = undefined) => {
        var data = '';
        var title = '';
        if (id === undefined) {
            data = createIcsData(cal.events);
        } else {
            let event = cal.events.filter((ev) => {
                return Number.parseInt(ev.id) === Number.parseInt(id);
            });
            data = createIcsData(event);
            if (event.length === 1) {
                title = event[0].data;
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
        const [file] = await window.webxdc.importFiles({mimeTypes: ["text/calendar"], extensions: [".ics"]});
        const text = await file.text();
        const events = parseIcsToJSON(text);

        var actions = [];
        for (const i in events) {
            const eventObj = events[i];
            actions.push({
                action: 'add',
                id: eventObj.uid,
                startDate: new Date(eventObj.startDate).getTime(),
                endDate: new Date(eventObj.endDate).getTime(),
                data: eventObj.summary,
                color: eventObj.color,
                creator: window.webxdc.selfName,
            });
        }
        const info = window.webxdc.selfName + ' imported ' + actions.length + ' events';
        window.webxdc.sendUpdate({
                payload: { actions: actions },
                info: info,
                summary: '' + (cal.events.length + actions.length) + ' events'
            },
            info
        );
        cal.closeImport();
    }
};

window.addEventListener("load", cal.init);
