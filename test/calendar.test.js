import { expect, describe, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import "./webxdc"

import { CalEvent, cal } from "./js/calendar";

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const dom = new JSDOM(readFileSync('./index.html').toString());
const document = dom.window.document;
vi.stubGlobal("document", document);

// mock basic properties
cal.nowDay = 23;
cal.nowMonth = 6 - 1;
cal.nowYear = 2023;
cal.selDay = 23;
cal.selMonth = 6 - 1;
cal.selYear = 2023;
cal.events = [
    {
        uid: "a2",
        dtStart: '20230623',
        dtEnd: '',
        summary: 'event2',
        color: '',
        creator: '',
    },
    {
        uid: "b1",
        dtStart: '20230622',
        dtEnd: '',
        summary: 'z-event1',
        color: '',
        creator: '',
    },
    {
        uid: "4",
        dtStart: '20230624T020100Z',
        dtEnd: '',
        summary: 'event4',
        color: '',
        creator: '',
    },
    {
        uid: "3",
        dtStart: '20230624T010100Z',
        dtEnd: '',
        summary: 'event3',
        color: '',
        creator: '',
    },
];
cal.weekdayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// mock html elements
cal.monthScreen = document.getElementById("monthScreen");
cal.monthTitle = document.getElementById("monthTitle");
cal.daysGrid = document.getElementById("daysGrid");
cal.monthSelMonth = document.getElementById("monthSelMonth");
cal.monthSelYear = document.getElementById("monthSelYear");
cal.dayScreen = document.getElementById("dayScreen");
cal.dayTitle = document.getElementById("dayTitle");
cal.eventBoxes = document.getElementById("eventBoxes");
cal.eventBoxesButtonBar = document.getElementById("eventBoxesButtonBar");
cal.editEventText = document.getElementById("editEventText");
cal.editEventUseTime = document.getElementById("editEventUseTime");
cal.editEventStartTime = document.getElementById("editEventStartTime");
cal.editEventDetailsDiv = document.getElementById("editEventDetailsDiv");
cal.drawer = document.getElementById("drawer");

describe("cal", () => {
    it("daysInSelMonth()", () => {
        expect(cal.daysInSelMonth()).toBe(30);
    });

    it("prevDay()", () => {
        cal.selDay = 23;
        cal.prevDay();
        expect(cal.selDay).toBe(22);
    });

    it("nextDay()", () => {
        cal.selDay = 23;
        cal.nextDay();
        expect(cal.selDay).toBe(24);
    });

    it("gotoToday()", () => {
        cal.selDay = cal.nowDay + 1;
        cal.gotoToday();
        expect(cal.selDay).toBe(cal.nowDay);
    });

    it("closeEditEvent()", () => {
        cal.closeEditEvent();
    });

    it("openDrawer()", () => {
        cal.openDrawer();
    });

    it("doMonthSel()", () => {
        cal.doMonthSel();
    });

    it("sendToChat()", () => {
        cal.sendToChat();
    });

    it("importFromFile()", () => {
        cal.importFromFile();
    });

    it("showAlert()", () => {
        cal.showAlert();
    });

    it("sortEvents()", () => {
        expect(cal.events[0].uid).toBe("a2");
        expect(cal.events[3].uid).toBe("3");

        cal.sortEvents();

        expect(cal.events[0].uid).toBe("b1");
        expect(cal.events[3].uid).toBe("4");
    });

    it("getEventsForDay()", () => {
        const events = cal.getEventsForDay(2023, 6-1, 23);
        expect(events.length).toBe(1);
        expect(events[0].uid).toBe("a2");

        expect(cal.getEventsForDay(2000, 1, 1).length).toBe(0);
        expect(cal.getEventsForDay(2023, 6-1, 24).length).toBe(2);
    });

    it("deleteEvent()", () => {
        cal.deleteEvent("a2");
    });

    it("renderAndSelectDay()", () => {
        expect(cal.getEventsForDay(2023, 6-1, 23).length).toBe(1);
        cal.renderAndSelectDay(2023, 6-1, 23);

        expect(cal.getEventsForDay(2000, 1, 1).length).toBe(0);
        cal.renderAndSelectDay(2000, 1, 1);
    });
});
