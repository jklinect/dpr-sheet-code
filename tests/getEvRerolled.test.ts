import { getEvRerolled } from "../src/Code";

describe("getEvRerolled", () => {
  const dice = {
    4: 0.5 * 2.5 + 0.25 * (3 + 4),
    6: 0.5 * 3.5 + (1 / 6) * (4 + 5 + 6),
    8: 0.5 * 4.5 + (1 / 8) * (5 + 6 + 7 + 8),
    10: 0.5 * 5.5 + (1 / 10) * (6 + 7 + 8 + 9 + 10),
    12: 0.5 * 6.5 + (1 / 12) * (7 + 8 + 9 + 10 + 11 + 12),
    20:
      0.5 * 10.5 + (1 / 20) * (11 + 12 + 13 + 14 + 15 + 16 + 17 + 18 + 19 + 20),
  };

  it("calculate re-rolled dice values correctly", () => {
    for (const die in dice) {
      const result = getEvRerolled(Number(die));
      expect(result).toBe(dice[die]);
    }
  });

  it("handle calculating incremental re-rolled values", () => {
    for (const d in dice) {
      const die = Number(d);
      const result = getEvRerolled(die, true);
      expect(result).toBe(dice[d] - (die + 1) / 2);
    }
  });

  it("handle smaller re-roll ranges (e.g. 1s and 2s only, great weapon fighting)", () => {
    const gwDice = {
      4: (1 / 2) * 2.5 + 0.25 * (3 + 4),
      6: (1 / 3) * 3.5 + (1 / 6) * (3 + 4 + 5 + 6),
      8: (1 / 4) * 4.5 + (1 / 8) * (3 + 4 + 5 + 6 + 7 + 8),
      10: (1 / 5) * 5.5 + (1 / 10) * (3 + 4 + 5 + 6 + 7 + 8 + 9 + 10),
      12: (1 / 6) * 6.5 + (1 / 12) * (3 + 4 + 5 + 6 + 7 + 8 + 9 + 10 + 11 + 12),
      20:
        (1 / 10) * 10.5 +
        (1 / 20) *
          (3 +
            4 +
            5 +
            6 +
            7 +
            8 +
            9 +
            10 +
            11 +
            12 +
            13 +
            14 +
            15 +
            16 +
            17 +
            18 +
            19 +
            20),
    };

    for (const d in gwDice) {
      const die = Number(d);
      const result = getEvRerolled(die, false, 2);
      expect(result).toBe(gwDice[d]);
    }
  });
});
