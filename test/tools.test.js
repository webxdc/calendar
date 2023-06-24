import { expect, describe, it } from "vitest";

import * as tools from "./js/tools";

describe("tools", () => {
  it("getShortMonthNames()", () => {
    expect(tools.getShortMonthNames().length).toBe(12);
  });

  it("generateUid()", () => {
    expect(tools.generateUid().length).not.toBe(0);
  });

  it("simplifyString()", () => {
    const text = tools.simplifyString(
      "testing long string with more than 32 characters"
    );
    expect(text.length).toBe(32);
  });

  it("validateColor()", () => {
    expect(tools.validateColor("#ff00ff")).toBe("#ff00ff");
    expect(tools.validateColor("ff00ff")).toBe("#ffb200");
  });

  it("addLeadingZeros()", () => {
    const text = tools.addLeadingZeros(1, 3);
    expect(text).toBe("001");
  });

  it("icsDateStringToIsoString()", () => {
    expect(tools.icsDateStringToIsoString("20230623T020000")).toBe(
      "2023-06-23T02:00:00.000Z"
    );
  });

  it("ymdToIcsDateString()", () => {
    expect(tools.ymdToIcsDateString(2023, 6 - 1, 23)).toBe("20230623");
  });
});
