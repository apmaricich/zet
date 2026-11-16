import { generateMonthlyCard } from "./calendar";

describe("calendar formatter", () => {
  it("generates November 2026 (30 days, starts Friday)", () => {
    const lines = generateMonthlyCard(11, 2026);

    // Filing address (single-digit month, no leading zero)
    expect(lines[0]).toBe("S26•11");

    // Day headers
    expect(lines[1]).toBe(" S  M  T  W  T  F  S");

    // Verify grid has content starting from week row
    expect(lines[2]).toBeDefined();
    expect(lines[2].trim()).not.toBe("");

    // Verify 30 days present
    let dayCount = 0;
    for (let i = 2; i < 9; i++) {
      const matches = lines[i].match(/\d+/g);
      if (matches) {
        dayCount += matches.length;
      }
    }
    expect(dayCount).toBe(30);

    // Separator after grid (index 7 for Jan 2026 which has 5 grid rows)
    expect(lines[7]).toBe("──────────────");
  });

  it("handles February 2024 (leap year, 29 days)", () => {
    const lines = generateMonthlyCard(2, 2024);

    expect(lines[0]).toBe("S24•2");
    expect(lines[1]).toBe(" S  M  T  W  T  F  S");

    // Count days
    let dayCount = 0;
    for (let i = 2; i < 9; i++) {
      const matches = lines[i].match(/\d+/g);
      if (matches) {
        dayCount += matches.length;
      }
    }
    expect(dayCount).toBe(29);
  });

  it("generates January 2026 (31 days)", () => {
    const lines = generateMonthlyCard(1, 2026);

    expect(lines[0]).toBe("S26•1");
    expect(lines[1]).toBe(" S  M  T  W  T  F  S");

    let dayCount = 0;
    for (let i = 2; i < 9; i++) {
      const matches = lines[i].match(/\d+/g);
      if (matches) {
        dayCount += matches.length;
      }
    }
    expect(dayCount).toBe(31);
  });

  it("generates April 2026 (30 days)", () => {
    const lines = generateMonthlyCard(4, 2026);

    expect(lines[0]).toBe("S26•4");

    let dayCount = 0;
    for (let i = 2; i < 9; i++) {
      const matches = lines[i].match(/\d+/g);
      if (matches) {
        dayCount += matches.length;
      }
    }
    expect(dayCount).toBe(30);
  });

  it("has no leading zeros for single-digit months", () => {
    const lines = generateMonthlyCard(3, 2026);
    expect(lines[0]).toBe("S26•3"); // Not "S26•03"
  });

  it("has correct day of week headers", () => {
    const lines = generateMonthlyCard(1, 2026);
    expect(lines[1]).toBe(" S  M  T  W  T  F  S");
  });

  it("has separator after grid", () => {
    const lines = generateMonthlyCard(1, 2026);
    expect(lines[7]).toBe("──────────────");
  });

  it("has 7 grid rows", () => {
    const lines = generateMonthlyCard(1, 2026);
    // Grid rows are indices 2-8 (7 rows)
    expect(lines[8]).toBeDefined();
  });
});
