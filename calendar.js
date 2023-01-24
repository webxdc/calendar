var cal = {
	// (A) PROPERTIES
	// (A1) COMMON CALENDAR
	sMon: true, // Week start on Monday?
	mName: [
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
	], // Month Names

	// (A2) CALENDAR DATA
	sDay: 0,
	sMth: 0,
	sYear: 0, // Current selected day, month, year

	// (A3) COMMON HTML ELEMENTS
	//current date
	now: null,
	nowMth: null,
	nowYear: null,
	nowDay: null,

	nxt: null,
	prev: null,
	nxtDay: null,
	prevDay: null,
	hMth: null,
	hYear: null, // month/year selector
	hForm: null,
	hfDate: null,
	container: null,
	hfTxt: null, //event form
	btnSave: null,
	events: null,
	eventsView: null,
	evCards: null,
	date: null,
	dateSel: null,
	okDate: null,
	cancelDate: null,
	color: null,
	days: null,
	touchstartX: 0,
	touchendX: 0,
	calendar: null,
	import: null,
	export: null,
	importScreen: null,
	importScrBtn: null,
	importArea: null,
	closeImportBtn: null,
	todayBtn: null,
	addEvent: null,
	addEventDetails: null,
	addEventClose: null,
	addImport: null,
	importEventObj: undefined,
	getExport: null,
	copyBtn: null,
	multiDayCheck: null,
	multiDayForm: null,
	recurringCheck: null,

	// (B) INIT CALENDAR
	init: () => {
		// (B1) GET + SET COMMON HTML ELEMENTS
		// current date
		cal.now = new Date();
		cal.nowMth = cal.now.getMonth(); // current month
		cal.nowYear = parseInt(cal.now.getFullYear()); // current year
		cal.nowDay = cal.now.getDate(); //current day

		cal.container = document.getElementById("cal-container");
		cal.nxtDay = document.getElementById("nxtDay");
		cal.nxtDay.onclick = cal.nextDay;
		cal.prevDay = document.getElementById("prevDay");
		cal.prevDay.onclick = cal.previousDay;
		cal.nxt = document.getElementById("nxtMonth");
		cal.nxt.onclick = cal.next;
		cal.prev = document.getElementById("prevMonth");
		cal.prev.onclick = cal.previous;
		cal.hMth = document.getElementById("cal-mth");
		cal.hYear = document.getElementById("cal-yr");
		cal.hfDate = document.getElementById("evt-date");
		cal.hfTxt = document.getElementById("evt-details");
		cal.btnSave = document.getElementById("evt-save");
		cal.btnSave.classList.add("unclickable");
		document.getElementById("evt-close").onclick = cal.close;
		cal.btnSave.onclick = cal.save;
		cal.events = [];
		events = cal.events; //link to the export var
		cal.eventsView = document.getElementById("eventsDay");
		cal.eventsView.classList.add("ninja");
		cal.evCards = document.getElementById("evt-cards");
		cal.date = document.getElementById("date");
		cal.date.onclick = cal.showDateSel;
		cal.dateSel = document.getElementById("dateSel");
		cal.dateSel.classList.add("ninja");
		cal.okDate = document.getElementById("okDate");
		cal.okDate.onclick = cal.okDateSel;
		cal.cancelDate = document.getElementById("cancelDate");
		cal.cancelDate.onclick = cal.closeDateSel;
		cal.color = "#FAD02C";
		cal.days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
		cal.calendar = document.getElementById("cal");
		cal.calendar.classList.add("ninja");
		cal.import = document.getElementById("evt-import");
		cal.import.onclick = () => {
			getClipboard(cal.importArea.value);
			cal.closeImport();
		};
		cal.export = document.getElementById("evt-export");
		cal.export.onclick = () => {
			cal.exporter();
		};
		cal.importScreen = document.getElementById("importScreen");
		cal.importScreen.classList.add("ninja");
		cal.importScrBtn = document.getElementById("evt-imp-exp");
		cal.importScrBtn.onclick = cal.openImport;
		cal.importArea = document.getElementById("importArea");
		cal.closeImportBtn = document.getElementById("closeImport");
		cal.closeImportBtn.onclick = cal.closeImport;
		cal.addEventDetails = document.getElementById("addEventDetails");
		cal.addEventDetails.classList.add("ninja");
		cal.addEvent = document.getElementById("addEvent");
		cal.addEvent.onclick = cal.showAddEvent;
		cal.todayBtn = document.getElementById("today");
		cal.todayBtn.onclick = () => {
			cal.sDay = cal.nowDay;
			cal.sMth = cal.nowMth;
			cal.sYear = cal.nowYear;
			cal.hMth.value = cal.nowMth;
			cal.hYear.value = cal.nowYear;
			cal.list();
			cal.show(cal.nowYear, cal.nowMth, cal.nowDay);
		};
		cal.addEventClose = document.getElementById("addEvent-close");
		cal.addEventClose.onclick = cal.closeAddEventDetails;
		cal.addImport = document.getElementById("addImport");
		cal.getExport = document.getElementById("getExport");
		cal.copyBtn = document.getElementById("i-clipboard");
		cal.copyBtn.onclick = cal.copyExporter;
		cal.multiDayCheck = document.getElementById("multi-day");
		cal.multiDayCheck.onchange = (ev) => {
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
		cal.multiDayForm = document.getElementsByClassName("multi-day-form"); //watch out is an array!
		cal.recurringCheck = document.getElementById("recurring");

		// swipe listeners for mobile
		cal.container.addEventListener(
			"touchstart",
			function (event) {
				cal.touchstartX = event.changedTouches[0].screenX;
			},
			false
		);

		cal.container.addEventListener(
			"touchend",
			function (event) {
				cal.touchendX = event.changedTouches[0].screenX;
				if (cal.touchendX < cal.touchstartX - 100) {
					cal.next();
				} else if (cal.touchendX > cal.touchstartX + 100) {
					cal.previous();
				}
			},
			false
		);

		// handle past and future state updates
		window.webxdc.setUpdateListener(function (update) {
			if (update.payload.addition) {
				cal.events.push(update.payload);
			} else {
				let index = cal.events.findIndex((obj) => {
					return Number.parseInt(obj.id) === Number.parseInt(update.payload.id);
				});
				if (index != -1) cal.events.splice(index, 1);
			}

			cal.list();
		});

		// (B3) APPEND MONTHS SELECTOR
		for (let i = 0; i < 12; i++) {
			let opt = document.createElement("option");
			opt.value = i;
			opt.innerHTML = cal.mName[i];
			if (i == cal.nowMth) {
				opt.selected = true;
			}
			cal.hMth.appendChild(opt);
		}

		// (B4) APPEND YEARS SELECTOR
		// Set to 30 years range. Change this as you like.
		for (let i = cal.nowYear - 30; i <= cal.nowYear + 30; i++) {
			let opt = document.createElement("option");
			opt.value = i;
			opt.innerHTML = i;
			if (i == cal.nowYear) {
				opt.selected = true;
			}
			cal.hYear.appendChild(opt);
		}

		// (B5) START - DRAW CALENDAR
		cal.list();
	},

	//PREVIOUS DAY
	previousDay: () => {
		let daysInMonth = () => {
			return new Date(cal.sYear, cal.sMth + 1, 0).getDate();
		};
		if (cal.sDay - 1 > 0) {
			cal.show(cal.sYear, cal.sMth, cal.sDay - 1);
		} else {
			if (cal.sMth - 1 >= 0) {
				cal.sMth--;
				cal.show(cal.sYear, cal.sMth, daysInMonth());
			} else {
				cal.sMth = 11;
				cal.sYear--;
				cal.show(cal.sYear, cal.sMth, daysInMonth());
			}
		}
	},

	//NEXT DAY
	nextDay: () => {
		let daysInMonth = () => {
			return new Date(cal.sYear, cal.sMth + 1, 0).getDate();
		};
		if (cal.sDay + 1 <= daysInMonth()) {
			cal.show(cal.sYear, cal.sMth, cal.sDay + 1);
		} else {
			if (cal.sMth + 1 > 11) {
				cal.sMth = 0;
				cal.sYear++;
				cal.show(cal.sYear, cal.sMth, 1);
			} else {
				cal.sMth++;
				cal.show(cal.sYear, cal.sMth, 1);
			}
		}
	},

	//PREVIOUS MONTH
	previous: () => {
		if (cal.hMth.value > 0) {
			cal.hMth.value = Number.parseInt(cal.hMth.value) - 1;
		} else {
			cal.hYear.value = Number.parseInt(cal.hYear.value) - 1;
			cal.hMth.value = "11";
		}
		cal.list();
	},

	//NEXT MONTH
	next: () => {
		if (cal.hMth.value < 11) {
			cal.hMth.value = Number.parseInt(cal.hMth.value) + 1;
		} else {
			cal.hYear.value = Number.parseInt(cal.hYear.value) + 1;
			cal.hMth.value = "0";
		}
		cal.list();
	},

	// (C) DRAW CALENDAR FOR SELECTED MONTH
	list: () => {
		// (C1) BASIC CALCULATIONS - DAYS IN MONTH, START + END DAY
		// Note - Jan is 0 & Dec is 11
		// Note - Sun is 0 & Sat is 6
		cal.sMth = parseInt(cal.hMth.value); // selected month
		cal.sYear = parseInt(cal.hYear.value); // selected year
		let daysInMth = new Date(cal.sYear, cal.sMth + 1, 0).getDate(), // number of days in selected month
			startDay = new Date(cal.sYear, cal.sMth, 1).getDay(), // first day of the month
			endDay = new Date(cal.sYear, cal.sMth, daysInMth).getDay(); // last day of the month

		// (C3) DRAWING CALCULATIONS
		// Blank squares before start of month
		let squares = [];
		if (cal.sMon && startDay != 1) {
			let blanks = startDay == 0 ? 7 : startDay;
			for (let i = 1; i < blanks; i++) {
				squares.push("b");
			}
		}
		if (!cal.sMon && startDay != 0) {
			for (let i = 0; i < startDay; i++) {
				squares.push("b");
			}
		}

		// Days of the month
		for (let i = 1; i <= daysInMth; i++) {
			squares.push(i);
		}

		// Blank squares after end of month
		if (cal.sMon && endDay != 0) {
			let blanks = endDay == 6 ? 1 : 7 - endDay;
			for (let i = 0; i < blanks; i++) {
				squares.push("b");
			}
		}
		if (!cal.sMon && endDay != 6) {
			let blanks = endDay == 0 ? 6 : 6 - endDay;
			for (let i = 0; i < blanks; i++) {
				squares.push("b");
			}
		}

		// (C4) DRAW HTML CALENDAR
		// Get container reset
		cal.container.innerHTML = "";

		// First row - Day names
		let week = document.createElement("div");
		let days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
		for (let d of days) {
			let cCell = document.createElement("div");
			cCell.innerHTML = d;
			week.appendChild(cCell);
		}
		cal.container.appendChild(week);
		week.classList.add("head");

		// Today's date
		cal.date.innerHTML = cal.mName[cal.sMth] + " " + cal.sYear;

		// Days in Month
		let total = squares.length;
		for (let i = 0; i < total; i++) {
			var day = squares[i];
			let cCell = document.createElement("div");
			if (day == "b") {
				cCell.classList.add("blank");
			} else {
				if (
					cal.nowDay == day &&
					cal.nowMth == cal.sMth &&
					cal.nowYear == cal.sYear
				) {
					cCell.classList.add("today");
				} else {
					cCell.classList.add("day");
				}
				cCell.innerHTML = `<div class="dd">${day}</div>`;

				//retrieve events for this day
				var eventsDay = cal.getEvents(cal.sYear, cal.sMth, day);
				if (eventsDay.length !== 0) {
					for (let j = 0; j < eventsDay.length; j++) {
						var evt = document.createElement("div");
						evt.classList.add("evt");
						evt.textContent = eventsDay[j].data;
						evt.style.backgroundColor = eventsDay[j].color;
						cCell.appendChild(evt);
					}
				}
				cCell.onclick = () => {
					cal.getDayToShow(cCell);
				};
			}
			cal.container.appendChild(cCell);
		}
		cal.calendar.classList.remove("ninja");
	},

	// (D) SHOW EDIT EVENT DOCKET FOR SELECTED DAY
	getDayToShow: (el) => {
		let day = Number.parseInt(el.getElementsByClassName("dd")[0].innerHTML);
		cal.show(cal.sYear, cal.sMth, day);
	},

	show: (year, month, day) => {
		// (D1) FETCH EXISTING DATA
		cal.sDay = day;
		let dayEvents = cal.getEvents(year, month, day);

		//ADD EVENT BOXES
		cal.hfTxt.value = "";
		cal.btnSave.classList.add("unclickable");
		cal.hfTxt.addEventListener("input", () => {
			if (cal.hfTxt.value.trim() != "") {
				cal.btnSave.classList.remove("unclickable");
			} else {
				cal.btnSave.classList.add("unclickable");
			}
		});

		cal.evCards.innerHTML = "";
		for (const i in dayEvents) {
			var eventBox = document.createElement("div");
			var remove = document.createElement("span");
			var exportBtn = document.createElement("span");
			var data = document.createElement("p");
			var author = document.createElement("p");
			var lilHeader = document.createElement("div");

			exportBtn.innerHTML =
				'<svg id="i-export" viewBox="0 0 32 32" width="18" height="18" fill="none" stroke="currentcolor" stroke-linecap="round" stroke-linejoin="round" stroke-width="3.5"><path d="M28 22 L28 30 4 30 4 22 M16 4 L16 24 M8 12 L16 4 24 12" /></svg>';
			exportBtn.setAttribute("data-id", dayEvents[i].id);
			exportBtn.setAttribute("class", "event-export");

			// ------ EXPORT BUTTON
			exportBtn.onclick = (ev) => {
				cal.exporter(ev.currentTarget.getAttribute("data-id"));
			};
			remove.innerHTML =
				"<svg id='i-close' viewBox='0 0 32 32' width='15' height='15' fill='none' stroke='currentcolor' stroke-linecap='round' stroke-linejoin='round' stroke-width='3.5'><path d='M2 30 L30 2 M30 30 L2 2' /></svg>";
			remove.setAttribute("data-id", dayEvents[i].id);

			// ------ REMOVE BUTTON
			remove.onclick = (ev) => {
				cal.del(ev.currentTarget.getAttribute("data-id"));
			};
			author.textContent = dayEvents[i].creator;
			author.classList.add("evt-view-name");
			lilHeader.appendChild(author);
			lilHeader.appendChild(remove);
			lilHeader.appendChild(exportBtn);
			eventBox.appendChild(lilHeader);
			data.textContent = dayEvents[i].data;
			data.classList.add("evt-data");
			eventBox.style.backgroundColor = dayEvents[i].color;
			eventBox.appendChild(data);
			eventBox.classList.add("evt-view");
			eventBox.classList.add("block");
			cal.evCards.appendChild(eventBox);
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

		cal.container.classList.add("ninja");
		cal.eventsView.classList.remove("ninja");

		// // (D2) UPDATE EVENT FORM
		let fullDate = new Date(year, month, day);
		cal.hfDate.innerHTML = `${cal.days[fullDate.getDay()]} ${day} ${cal.mName[month]
			} ${year}`;
	},

	showAddEvent: () => {
		cal.evCards.classList.add("ninja");
		cal.addEventDetails.classList.remove("ninja");
		cal.addEvent.classList.add("ninja");
		cal.multiDayCheck.checked = false;
		for (let i = 0; i < cal.multiDayForm.length; i++) {
			cal.multiDayForm[i].style.display = "none";
		}
		document.getElementById("start-day").value = `${cal.sYear}-${cal.sMth + 1 < 10 ? "0" + (cal.sMth + 1) : cal.sMth + 1
			}-${cal.sDay < 10 ? "0" + cal.sDay : cal.sDay}`;
		document.getElementById("end-day").value = `${cal.sYear}-${cal.sMth + 1 < 10 ? "0" + (cal.sMth + 1) : cal.sMth + 1
			}-${cal.sDay < 10 ? "0" + cal.sDay : cal.sDay}`;
	},

	closeAddEventDetails: () => {
		cal.evCards.classList.remove("ninja");
		cal.addEventDetails.classList.add("ninja");
		cal.addEvent.classList.remove("ninja");
	},

	// (E) CLOSE EVENT DOCKET
	close: () => {
		cal.eventsView.classList.add("ninja");
		cal.container.classList.remove("ninja");
		cal.closeAddEventDetails();
	},

	// GET ALL EVENTS FROM A DAY
	getEvents: (year, month, day) => {
		var events = cal.events.filter((event) => {
			let startDate = new Date(event.startDate);
			let endDate = new Date(event.endDate);
			return startDate.getFullYear() <= year && startDate.getMonth() <= month && startDate.getDate() <= day && endDate.getFullYear() >= year && endDate.getMonth() >= month && endDate.getDate() >= day;
		});
		return events;
	},

	// (F) SAVE EVENT
	//if gets an eventObject as a parameter it can be reused for imports
	save: () => {
		let dateSt, dateEnd, color, data, info, id;

		//if is not an imported event
		if (cal.importEventObj === undefined) {
			if (cal.multiDayCheck.checked) {
				// console.log(document.getElementById("start-day").value);
				dateSt = new Date(document.getElementById("start-day").value);
				// console.log(document.getElementById("end-day").value);
				dateEnd = new Date(document.getElementById("end-day").value);
			} else {
				dateSt = new Date(cal.sYear, cal.sMth, cal.sDay);
				dateEnd = dateSt;
			}
			data = cal.hfTxt.value;
			color = cal.color;
			info =
				window.webxdc.selfName +
				" created \"" +
				cal.hfTxt.value.replace(/\n/g, " ") +
				"\" on " +
				cal.mName[dateSt.getMonth()] +
				" " +
				dateSt.getDate();
			id = Date.now();
		} else {
			//if is an imported event
			dateSt = new Date(cal.importEventObj.startDate);
			dateEnd = new Date(cal.importEventObj.endDate);
			data = cal.importEventObj.summary;
			color = "black";
			info =
				window.webxdc.selfName +
				" imported an event " +
				cal.hfTxt.value.replace(/\n/g, " ") +
				" on " +
				cal.mName[dateSt.getMonth()] +
				" " +
				dateSt.getDate();
			id = cal.importEventObj.uid;
		}

		//if is a recurring event
		if (cal.recurringCheck.checked) {
			let dateInR = dateSt;
			let dateEndR = dateEnd;
			console.log("date format " + dateInR);


			for (let i = 0; i < 30; i++) {
				//add years
				dateInR.setFullYear(cal.sYear + i);
				dateEndR.setFullYear(cal.sYear + i);
				// send new updates
				window.webxdc.sendUpdate(
					{
						payload: {
							id: id,
							startDate: dateInR,
							endDate: dateEndR,
							data: data,
							color: color,
							addition: true,
							creator: window.webxdc.selfName,
							//send timezone?
						},
						info,
					},
					info
				);

			}
			cal.close();
			return;
		}

		// send new updates
		window.webxdc.sendUpdate(
			{
				payload: {
					id: id,
					startDate: dateSt.getTime(),
					endDate: dateEnd.getTime(),
					data: data,
					color: color,
					addition: true,
					creator: window.webxdc.selfName,
					//send timezone?
				},
				info,
			},
			info
		);
		cal.close();
		return false;
	},

	// (G) DELETE EVENT FOR SELECTED DATE
	del: (id) => {
		let eventToDelete = cal.events.find((evnt) => evnt.id == id);
		//ask for confirmation
		let confirmationBox = document.querySelector("#confirmation");
		confirmationBox.innerHTML = "";
		confirmationBox.style.display = "block";

		let confirmationText = document.createElement("p");
		confirmationText.textContent =
			"Do you really want to delete '" + eventToDelete.data + "'?";
		confirmationBox.appendChild(confirmationText);

		let btnYes = document.createElement("button");
		btnYes.classList.add("eventBtn");
		btnYes.innerHTML = "Yes";
		btnYes.onclick = () => {
			// send new updates
			var info =
				window.webxdc.selfName +
				" deleted \"" + eventToDelete.data + "\" from " +
				cal.mName[cal.sMth] +
				" " +
				cal.sDay;
			window.webxdc.sendUpdate(
				{
					payload: {
						id: id,
						addition: false,
						deleter: window.webxdc.selfName,
					},
					info,
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
		btnNo.innerHTML = "No";
		btnNo.onclick = () => {
			confirmationBox.style.display = "none";
		};
		confirmationBox.appendChild(btnNo);
	},

	showDateSel: () => {
		cal.container.classList.add("ninja");
		cal.dateSel.classList.remove("ninja");
	},

	okDateSel: () => {
		cal.list();
		cal.closeDateSel();
	},

	closeDateSel: () => {
		cal.container.classList.remove("ninja");
		cal.dateSel.classList.add("ninja");
	},

	openImport: () => {
		cal.importScreen.classList.remove("ninja");
		cal.getExport.firstChild.innerHTML = "";
		cal.getExport.classList.add("ninja");
		cal.container.classList.add("ninja");
		cal.addImport.classList.remove("ninja");
	},

	closeImport: () => {
		cal.importArea.value = "";
		cal.importScreen.classList.add("ninja");
		cal.container.classList.remove("ninja");
	},

	exporter: (id = undefined) => {
		cal.copyBtn.style.color = "#333652";
		cal.addImport.classList.add("ninja");
		//check if id is one or more events
		if (id === undefined) {
			cal.getExport.classList.remove("ninja");
			document.querySelector("#exportData").innerHTML = setClipboard();
		} else {
			let event = cal.events.filter((ev) => {
				return Number.parseInt(ev.id) === Number.parseInt(id);
			});
			let icsString = makeString(event);
			cal.importScreen.classList.remove("ninja");
			cal.eventsView.classList.add("ninja");
			cal.getExport.classList.remove("ninja");
			document.querySelector("#exportData").innerHTML = icsString;
		}
	},

	//CAN'T USE CLIPBOARD API IN DELTACHAT NOR 
	copyExporter: () => {
		// navigator.clipboard.writeText(
		// 	document.querySelector("#exportData").innerHTML
		// );
		const temp = document.createElement("input");
		const text = document.getElementById("exportData").innerHTML;
		temp.setAttribute("value", text);
		document.body.appendChild(temp);
		temp.select();
		document.execCommand("copy");
		document.body.removeChild(temp);
		cal.copyBtn.style.color = "#FAD02C";
	},
};
window.addEventListener("load", cal.init);
