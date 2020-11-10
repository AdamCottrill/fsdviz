import { isValidDate } from "../components/form_utils";

describe("tests to verify isValidDate works as expected", () => {
  test("isValidDate return true for good dates", () => {
    expect(isValidDate(2010, 10, 10)).toBeTruthy();
    expect(isValidDate(2010, 5, 1)).toBeTruthy();
    expect(isValidDate(2010, 1, 1)).toBeTruthy();
    expect(isValidDate(1999, 12, 31)).toBeTruthy();
  });

  test("isValidDate return false for bad or incomplete dates", () => {
    expect(isValidDate(2010, 10)).toBeFalsy();
    expect(isValidDate(2010, 13, 1)).toBeFalsy();
    expect(isValidDate(2010, 2, 30)).toBeFalsy();
    expect(isValidDate(2010, 2, 31)).toBeFalsy();
    expect(isValidDate(2010, 4, 31)).toBeFalsy();
    expect(isValidDate(2010, 6, 31)).toBeFalsy();
    expect(isValidDate(2010, 9, 31)).toBeFalsy();
    expect(isValidDate(1999, 11, 31)).toBeFalsy();
    expect(isValidDate(1999, 11, 32)).toBeFalsy();
    expect(isValidDate(2010, -2, 30)).toBeFalsy();
  });
});
