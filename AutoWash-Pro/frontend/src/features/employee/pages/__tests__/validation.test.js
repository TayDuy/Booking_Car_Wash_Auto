const PHONE_REGEX = /^(0|\+84)[0-9]{9,10}$/;

function validatePhone(phone) {
  return PHONE_REGEX.test(phone.trim());
}

function validateLicensePlate(plate) {
  return plate.trim().length > 0;
}

describe("WalkInBooking validation", () => {
  test.each([
    ["0912345678", true],
    ["+84912345678", true],
    ["09123456789", true],
    ["+84123456789", true],
    ["", false],
    ["12345", false],
    ["09123abc", false],
    ["+8491234", false],
  ])("phone %s -> %s", (input, expected) => {
    expect(validatePhone(input)).toBe(expected);
  });

  test.each([
    ["51A-99999", true],
    ["", false],
    ["  ", false],
  ])("license plate %s -> %s", (input, expected) => {
    expect(validateLicensePlate(input)).toBe(expected);
  });
});
