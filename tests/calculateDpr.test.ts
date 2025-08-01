import { calculate_dpr as calculateDpr } from "@/Code";

describe("calculateDpr", () => {
  it("fist (+0) on skin (AC10)", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d6", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    const correct = 2.1;
    expect(result).toBe(correct);
  });

  it("fist (+0) on skin (AC10), advantage", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d6", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      true, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    const correct = 3.1325; // 0.7*3.5 + 0.0975*7
    expect(result).toBeCloseTo(correct, 2);
  });

  it("fist (+0) on skin (AC10), disadvantage", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d6", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      true // disadvantage on dice rolls
    );
    const correct = 1.0675; // (1 - 0.6975 - 0.0025)*3.5 + 0.0025*7
    expect(result).toBeCloseTo(correct);
  });

  it("fist (+0) on skin (AC10), elven accuracy", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d6", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false, // disadvantage on dice rolls,
      20, // min roll to crit
      true // elven accuracy on dice rolls
    );
    const correct = 3.68025; // 0.7663*3.5 + 0.1426*7
    expect(result).toBeCloseTo(correct, 2);
  });

  it("fist (+0) on skin (AC10), brutal critical", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d6", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false, // disadvantage on dice rolls
      20, // minimum crit
      false, // elven accuracy
      3 // extra critical dice
    );
    const correct = 3.5 * 0.5 + 3.5 * 5 * 0.05;
    expect(result).toBe(correct);
  });

  it("fist (+0) on skin (AC10), piercer (1 reroll)", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d6 piercing damage", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false, // disadvantage on dice rolls
      20, // minimum crit
      false, // elven accuracy
      1, // extra critical dice
      1, // # re-rolled dice count
      3 // highest re-rolled face
    );
    const correct = 4.25 * 0.5 + (4.25 + 3.5 + 3.5) * 0.05;
    expect(result).toBe(correct);
  });

  it("2d6 (+0) on skin (AC10), great weapon fighter (reroll < 3)", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "2d6 hammer fists", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false, // disadvantage on dice rolls
      20, // minimum crit
      false, // elven accuracy
      0, // extra critical dice
      4, // # re-rolled dice count
      2 // highest re-rolled face
    );
    const ev = 2 * ((1 / 3) * 3.5 + (1 / 6) * (3 + 4 + 5 + 6));
    const correct = 0.5 * ev + 0.05 * 2 * ev;
    expect(result).toBe(correct);
  });

  it("fist (+0) on skin (AC10), crit on 18+", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d6", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false, // disadvantage on dice rolls
      18 // minimum crit roll
    );
    const correct = 2.45;
    expect(result).toBe(correct);
  });

  it("fist (+0) on skin (AC10), crit on 18+, advantage", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d6", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      true, // advantage on dice rolls
      false, // disadvantage on dice rolls
      18 // minimum crit roll
    );
    const correct = 3.7625; // (1-0.2025-0.2775)*3.5 + 0.2775*7
    expect(result).toBeCloseTo(correct);
  });

  it("two swords (+2) on studded leather (AC12)", () => {
    const result = calculateDpr(
      2, // # attacks
      2, // to-hit
      "1d6", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "12", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    const correct = 4.2;
    expect(result).toBe(correct);
  });

  it("two swords (+3/+2) on studded leather (AC12)", () => {
    const result = calculateDpr(
      2, // # attacks
      2, // to-hit
      "1d6", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "+1", // extra to-hit per-turn
      "12", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    const correct = 2.1 + 2.28;
    expect(result).toBeCloseTo(correct);
  });

  it("hand xbow (+0) on skin (AC10), sharpshooter", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d6", // attack damage
      "+10", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    // 0.50*(3.5+10) + 0.05*(7+10)
    const correct = 7.6;
    expect(result).toBe(correct);
  });

  it("3x hand xbow (+0) on skin (AC10), sharpshooter (+10), favored foe (1d4)", () => {
    const result = calculateDpr(
      3, // # attacks
      0, // to-hit
      "1d6", // attack damage
      "+10", // extra per-hit damage
      "1d4", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    // 3*(0.50*(3.5+10) + 0.05*(7+10)) + (0.50*2.5 + 0.05*5)
    const correct = 24.3;
    expect(result).toBeCloseTo(correct);
  });

  it("max dmg rolls: warhammer (+0) on skin (AC10)", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d10", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      true, // max damage on dice rolls
      false, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    const correct = 6; // 0.5*10 + 0.05*20
    expect(result).toBe(correct);
  });

  it("min dmg rolls: dagger (+0) on skin (AC10)", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d4", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      true, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    const correct = 0.6; // 0.5*1 + 0.05*2
    expect(result).toBe(correct);
  });

  it("multiple attacks (1-12)", () => {
    for (let i = 1; i <= 12; i++) {
      const result = calculateDpr(
        i,
        0,
        "1d6",
        "",
        "",
        "",
        "",
        "10",
        false,
        false,
        false,
        false
      );
      const correct = i * 2.1;
      expect(result).toBeCloseTo(correct);
    }
  });

  it("complex: bruce vilanch 12x attack", () => {
    const result = calculateDpr(
      12, // # attacks
      14, // to-hit
      "1d6 + 3d6 + 10",
      "large sized weapons 1d6",
      "enlarged extra 1d8",
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "19", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    const correct = 278.325;
    expect(result).toBe(correct);
  });

  it("complex: lvl5 sorlock scorching ray/quickened eldritch blast", () => {
    const result = calculateDpr(
      3, // # attacks
      7, // to-hit
      "2d6",
      "hex 1d6 sneak attack 2d6",
      `2 eldritch blasts 2d10+6
       extra fake level 69 hex/beam 2d6
       extra sneak attacks 4d6
      `, // extra to-hit per-turn
      "",
      "",
      "15", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    const correct = 63.05;
    expect(result).toBe(correct);
  });

  it("complex: DAN's ridiculous 7x crossbow barrage", () => {
    const result = calculateDpr(
      7, // # attacks
      12, // to-hit
      "1d6 + 6",
      `poison xbow   1d4
       necrotic bolt 1d6
       crimson rite  1d4
       sharpshooter +10`,
      `favored foe      1d4
       bonus attack dmg 1d8
       sneak attack     3d6`,
      "",
      "",
      "19", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false // disadvantage on dice rolls
    );
    const correct = 154.525;
    expect(result).toBeCloseTo(correct);
  });

  it("damage on miss: dagger (+0) on skin (AC10)", () => {
    const missDamage = 6;
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d4", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false, // disadvantage on dice rolls
      20, // crit range
      false, // elven advantage
      0, // extra criticals
      0, // # of damage die to reroll
      0, // # on face to reroll,
      0, // # to use in re-roll (doesnt matter here)
      missDamage // damage on miss
    );
    const correct = 0.05 * 5 + 0.5 * 2.5 + (1 - 0.55) * missDamage;
    expect(result).toBeCloseTo(correct, 4);
  });

  it("gwm damage re-roll: {1, 2} -> {3, 3}", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d4", // attack damage
      "", // extra per-hit damage
      "", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false, // disadvantage on dice rolls
      20, // crit range
      false, // elven advantage
      0, // extra criticals
      2, // # of damage die to reroll
      2, // # on face to reroll,
      3 // # to use in re-roll (doesnt matter here)
    );
    const ev = (3 + 3 + 3 + 4) / 4;
    const correct = 0.05 * 2 * ev + 0.5 * ev;
    expect(result).toBeCloseTo(correct, 4);
  });

  it("handle damage re-roll on all damage fields", () => {
    const result = calculateDpr(
      1, // # attacks
      0, // to-hit
      "1d4", // attack damage
      "1d4", // extra per-hit damage
      "1d4", // extra per-turn damage
      "", // extra to-hit per-hit
      "", // extra to-hit per-turn
      "10", // challenge ac
      false, // min damage on dice rolls
      false, // max damage on dice rolls
      false, // advantage on dice rolls
      false, // disadvantage on dice rolls
      20, // crit range
      false, // elven advantage
      0, // extra criticals
      100 // # of damage die to reroll
    );
    const ev = 3 * ((2.5 + 2.5 + 3 + 4) / 4);
    const correct = 0.05 * 2 * ev + 0.5 * ev;
    expect(result).toBeCloseTo(correct, 4);
  });
});
