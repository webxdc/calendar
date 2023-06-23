import { expect, describe, it } from 'vitest';

import * as tools from "./js/tools";

describe('tools', () => {
    it("simplifyString()", () => {
        const text = tools.simplifyString("testing long string with more than 32 characters");
        expect(text.length).toBe(32);
    });

    it("addLeadingZeros()", () => {
        const text = tools.addLeadingZeros(1, 3);
        expect(text).toBe("001");
    });
});
