import { expect, describe, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { icsFiles } from "./data/properties";
import "./webxdc"

import { icsStringToEventArray } from "./js/ics-reader";
import { eventArrayToIcsString } from "./js/ics-writer";
import { newEvent } from "./js/calendar";

describe('eventArrayToIcsString()', () => {
    for (const ics of icsFiles) {
        it(ics.name, () => {
            let icsData = readFileSync('./test/data/' + ics.name).toString();
            const events = icsStringToEventArray(icsData, newEvent);

            icsData = eventArrayToIcsString(events);
            expect(icsData.length).not.toBe(0);

            const events2 = icsStringToEventArray(icsData, newEvent);
            expect(events2.length).toBe(events.length);
        });
    }
});
