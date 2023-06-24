import { expect, describe, it } from "vitest";
import { readFileSync } from "node:fs";
import { icsFiles } from "./data/properties";

import { icsStringToEventArray } from "./js/ics-reader";
import { newEvent } from "./js/calendar";

describe("icsStringToEventArray()", () => {
  for (const ics of icsFiles) {
    it(ics.name, () => {
      const icsData = readFileSync("./test/data/" + ics.name).toString();

      const events = icsStringToEventArray(icsData, newEvent);
      expect(events.length).toBe(ics.count);
    });
  }
});
