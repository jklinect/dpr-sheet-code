/**
 * Returns the value of a re-rolled die with `sides` sides.
 *
 * @param {number} sides - The number of sides.
 * @param {boolean} [incremental=false] - Optional. If true, returns the
 *     difference between the rerolled and original values.
 * @param {number} [maxReroll=sides / 2] - Optional. Specifies what the
 *     maximum value is that gets re-rolled.
 * @param {number} [count=1] - Optional. The number of dice to re-roll.
 * @param {number} [rerollValue=undefined] - Optional. The value to re-roll
 *     with. If undefined, the expected value of the die is used.
 * @returns {number} The expected value of the re-rolled die.
 */
export const getEvRerolled = (
  sides: number,
  incremental: boolean = false,
  maxReroll: number = sides / 2,
  count: number = 1,
  rerollValue: number = undefined
): number => {
  const summer = (x: number) => (x > 1 ? x + summer(x - 1) : 1);
  const expected = (sides + 1) / 2;
  const rerollEv = rerollValue || expected;
  const rerollChance = maxReroll < 1 ? maxReroll : maxReroll / sides;
  const rerolled =
    rerollChance * rerollEv +
    (1 / sides) *
      (summer(sides) - summer(maxReroll < 1 ? maxReroll * sides : maxReroll));
  return count * (incremental ? rerolled - expected : rerolled);
};

/**
 * Parses a damage dice string (1d8 + 4) and returns a floating point
 *    representation.
 *
 * @param {string} input - The input value to parse.
 * @param {boolean} [critical=false] - Determines if damage dice are doubled
 *     or not.
 * @param {boolean} [minOnly=false] - Optional. If true, uses `1` in place of
 *     dice rolls.
 * @param {boolean} [maxOnly=false] - Optional. If true, uses the max roll of
 *     a dice.
 * @param {number} [extraCriticals=0] - Optional. If > 0, adds that many extra
 *     damage die to critical hits.
 * @param {number} [rerolledDamageDieCount=0] - Optional. The # of damage dice
 *     to re-roll. Include critical damage dice in this count.
 * @param {number} [rerolledDamageDieFindValue=undefined] - Optional. The highest
 *     value to re-roll damage dice on.
 * @param {number} [rerolledDamageDieReplaceValue=undefined] - Optional. The value
 *     to replace the re-rolled damage die with.
 * @returns {number} The expected value of the damage dice.
 */
export const parseDamage = (
  input: string,
  critical: boolean = false,
  minOnly: boolean = false,
  maxOnly: boolean = false,
  extraCriticals: number = 0,
  rerolledDamageDieCount: number = 0,
  rerolledDamageDieFindValue: number = undefined,
  rerolledDamageDieReplaceValue: number = undefined
): number => {
  let match: RegExpExecArray;
  let roll = 0;
  const formula = input.split("==");
  const { [formula.length - 1]: diceFormula } = formula;
  const diceRegex = /(^|[+-/÷*×^ ])\s*(\d+)d?(\d*)/gm;
  while ((match = diceRegex.exec(diceFormula))) {
    const operator = match[1];
    const count = parseInt(match[2]);
    let value = 0;
    if (match[3]) {
      const sides = parseInt(match[3]);
      const damage = minOnly ? 1 : maxOnly ? sides : (sides + 1) / 2;
      const diceCount = critical ? 2 * count + extraCriticals : count;
      value = diceCount * damage;
      value += getEvRerolled(
        sides,
        true,
        rerolledDamageDieFindValue || sides / 2,
        Math.min(diceCount, rerolledDamageDieCount),
        rerolledDamageDieReplaceValue
      );
    } else {
      value = count;
    }
    const impliedAddition = !operator || operator === " ";
    if ((impliedAddition && match[3]) || operator === "+") {
      roll += value;
    } else if (operator === "-") {
      roll -= value;
    } else if (["*", "×"].includes(operator)) {
      roll *= value;
    } else if (["/", "÷"].includes(operator)) {
      roll /= value;
    } else if (operator === "^") {
      roll **= value;
    }
  }
  return roll;
};

/**
 * Returns the critical hit chance, based on advantage and disadvantage.
 *
 * @param {boolean} [advantage=false] - Indicates if the roll is advantaged.
 * @param {boolean} [disadvantage=false] - Indicates if the roll is
 *     disadvantaged.
 * @param {number} [minCrit=20] - The minimum roll on a D20 to score a
 *     critical, if not a 20. Features like Superior Critical lower this.
 * @param {boolean} [elvenAccuracy=false] - Whether elven accuracy is applied.
 * @returns {number} The critical hit chance
 */
export const calculateToCrit = (
  advantage: boolean = false,
  disadvantage: boolean = false,
  minCrit: number = 20,
  elvenAccuracy: boolean = false
): number => {
  const success = (21 - minCrit) / 20;
  const failure = 1.0 - success;
  return elvenAccuracy
    ? 1.0 - failure ** 3
    : advantage
    ? 1.0 - failure ** 2
    : disadvantage
    ? success ** 2
    : success;
};

/**
 * This function calculates the hit-once chance based on various parameters.
 * It does not factor in critical success, it returns the chance excluding
 * that. As an example, on a simple DC10 check with no modifier:
 * * 1 critical fails (5%)
 * * 2 - 9 fail (45%)
 * * 10 - 19 succeed (50%)
 * * 20 critical succeeds (5%)
 *
 * This would return 0.50 accordingly.
 * @param {number} toHit - The base to-hit modifier.
 * @param {number} expectedAc - The expected armor class of the target.
 * @param {boolean} [advantage=false] - Whether advantage is applied.
 * @param {boolean} [disadvantage=false] - Whether disadvantage is applied.
 * @param {number} [minCrit=20] - The minimum roll on a d20 to score a
 *     critical, if not a 20.
 * @param {boolean} [elvenAccuracy=false] - Whether elven accuracy is applied.
 * @returns {number} The calculated hit chance.
 */
export const calculateToHit = (
  toHit: number,
  expectedAc: number,
  advantage: boolean = false,
  disadvantage: boolean = false,
  minCrit: number = 20,
  elvenAccuracy: boolean = false
): number => {
  // chance isin [0.05, 0.95]
  const successChance = Math.min(
    0.95,
    Math.max((21 - minCrit) / 20, (21 - expectedAc + toHit) / 20)
  );
  const failureChance = 1.0 - successChance;
  const critChance = calculateToCrit(
    advantage,
    disadvantage,
    minCrit,
    elvenAccuracy
  );
  if (elvenAccuracy) {
    return 1 - failureChance ** 3 - critChance;
  } else if (advantage) {
    return 1 - failureChance ** 2 - critChance;
  } else if (disadvantage) {
    return successChance ** 2 - critChance;
  } else {
    return successChance - critChance;
  }
};

/**
 * Calculates the damage per round (DPR) based on various parameters.
 *
 * @param {number} numAttacks - The number of attacks.
 * @param {number} toHit - The base 'to hit' value.
 * @param {string} attackDamage - The base attack damage.
 * @param {string} [extraAttackDamage=""] - Optional. Extra damage applied on
 *     each attack.
 * @param {string} [extraTurnDamage=""] - Optional. Extra damage applied once
 *     a turn.
 * @param {string} [extraAttackModifier=""] - Optional. Extra 'to hit'
 *     modifier for each attack.
 * @param {string} [extraTurnModifier=""] - Optional. Extra 'to hit'
 *     modifier for each turn.
 * @param {string} [challengeAc="0"] - Optional. The challenge rating armor
 *     class.
 * @param {boolean} [minDmg=false] - Optional. If true, only 1s are used in
 *     dice roll calculations.
 * @param {boolean} [maxDmg=false] - Optional. If true, only maximum rolls are
 *     used in dice roll calculations.
 * @param {boolean} [advantage=false] - Optional. If true, advantage is
 *     considered in the calculation.
 * @param {boolean} [disadvantage=false] - Optional. If true, disadvantage is
 *     considered in the calculation.
 * @param {number} [minCrit=20] - The minimum roll on a D20 to score a
 *     critical.
 * @param {boolean} [elvenAccuracy=false] - Optional. If true, elven accuracy
 *     is applied.
 * @param {number} [extraCriticals=0] - Optional. If true, adds that many extra
 *     damage die to critical hits.
 * @param {number} [rerolledDamageDieCount=0] - Optional. The # of damage dice
 *     to re-roll. Include critical damage dice.
 * @param {number} [rerolledDamageDieFindValue=undefined] - Optional. The highest
 *     value to re-roll damage dice on.
 * @param {number} [rerolledDamageDieReplaceValue=undefined] - Optional. The value
 *     to replace the re-rolled damage die with.
 * @param {number} [missDamage=0] - Optional. The damage to apply on attack
 *     miss, defaults to 0.
 * @returns {number} The given damage as described by the parameters
 */
// eslint-disable-next-line camelcase
export const calculate_dpr = (
  numAttacks: number,
  toHit: number,
  attackDamage: string,
  extraAttackDamage: string = "",
  extraTurnDamage: string = "",
  extraAttackModifier: string = "",
  extraTurnModifier: string = "",
  challengeAc: string = "0",
  minDmg: boolean = false,
  maxDmg: boolean = false,
  advantage: boolean = false,
  disadvantage: boolean = false,
  minCrit: number = 20,
  elvenAccuracy: boolean = false,
  extraCriticals: number = 0,
  rerolledDamageDieCount: number = 0,
  rerolledDamageDieFindValue: number = undefined,
  rerolledDamageDieReplaceValue: number = undefined,
  missDamage: number = 0
): number => {
  const critDamage = parseDamage(
    attackDamage,
    true,
    minDmg,
    maxDmg,
    extraCriticals,
    rerolledDamageDieCount,
    rerolledDamageDieFindValue,
    rerolledDamageDieReplaceValue
  );
  const baseDamage = parseDamage(
    attackDamage,
    false,
    minDmg,
    maxDmg,
    0,
    rerolledDamageDieCount,
    rerolledDamageDieFindValue,
    rerolledDamageDieReplaceValue
  );
  const perAttackCritBonus = parseDamage(
    extraAttackDamage,
    true,
    minDmg,
    maxDmg,
    extraCriticals,
    rerolledDamageDieCount,
    rerolledDamageDieFindValue,
    rerolledDamageDieReplaceValue
  );
  const perAttackBonus = parseDamage(
    extraAttackDamage,
    false,
    minDmg,
    maxDmg,
    0,
    rerolledDamageDieCount,
    rerolledDamageDieFindValue,
    rerolledDamageDieReplaceValue
  );
  const perTurnCritBonus = parseDamage(
    extraTurnDamage,
    true,
    minDmg,
    maxDmg,
    extraCriticals,
    rerolledDamageDieCount,
    rerolledDamageDieFindValue,
    rerolledDamageDieReplaceValue
  );
  const perTurnBonus = parseDamage(
    extraTurnDamage,
    false,
    minDmg,
    maxDmg,
    0,
    rerolledDamageDieCount,
    rerolledDamageDieFindValue,
    rerolledDamageDieReplaceValue
  );
  const extraAttackToHit = parseDamage(
    extraAttackModifier,
    false,
    minDmg,
    maxDmg
  );
  const extraTurnToHit = parseDamage(extraTurnModifier, false, minDmg, maxDmg);
  let dpr = 0.0;
  const expectedAc = parseInt(challengeAc);
  // dpr = (crit damage * crit chance) + (normal damage * normal chance) + (miss damage * miss chance)
  const toCritChance = calculateToCrit(
    advantage,
    disadvantage,
    minCrit,
    elvenAccuracy
  );
  let toHitChance: number = calculateToHit(
    toHit + extraAttackToHit + extraTurnToHit,
    expectedAc,
    advantage,
    disadvantage,
    minCrit,
    elvenAccuracy
  );
  let toMissChance: number = 1 - toHitChance - toCritChance;
  dpr =
    toCritChance * (critDamage + perAttackCritBonus + perTurnCritBonus) +
    toHitChance * (baseDamage + perAttackBonus + perTurnBonus) +
    toMissChance * missDamage;
  // subsequent attacks (no extraTurnToHit applied)
  if (--numAttacks > 0) {
    toHitChance = calculateToHit(
      toHit + extraAttackToHit,
      expectedAc,
      advantage,
      disadvantage,
      minCrit,
      elvenAccuracy
    );
    toMissChance = 1 - toHitChance - toCritChance;
    dpr +=
      numAttacks *
      (toCritChance * (critDamage + perAttackCritBonus) +
        toHitChance * (baseDamage + perAttackBonus) +
        toMissChance * missDamage);
  }
  return dpr;
};

/**
 * This function calculates the spell damage based on various parameters.
 *
 * @param {number} spellDc - The spell's check DC.
 * @param {string} attackDamage - The base damage of the attack.
 * @param {string} [extraAttackDamage=""] - The additional damage applied once
 *     per hit.
 * @param {string} [extraTurnDamage=""] - The additional damage applied once a
 *     turn.
 * @param {boolean} [noDamageOnSave=false] - If true, a save results in no
 *     damage.
 * @param {number} [expectedSave=0] - The expected save roll modifier.
 * @param {number} [numberOfTargets=1] - The number of targets affected.
 * @returns {number} The calculated spell damage.
 */
export const calculateSpellDamage = (
  spellDc: number,
  attackDamage: string,
  extraAttackDamage: string = "",
  extraTurnDamage: string = "",
  noDamageOnSave: boolean = false,
  expectedSave: number = 0,
  numberOfTargets: number = 1
): number => {
  // spell damage is:
  // (chance for full damage)*(full damage) +
  //   (1 - (chance for full damage))*(half damage)
  const fullChance = 1 - Math.max(20 - spellDc + expectedSave, 1) / 20;
  const fullDamage = parseDamage(attackDamage, false);
  const halfChance = noDamageOnSave ? 0.0 : 1 - fullChance;
  const extraDamage = parseDamage(extraAttackDamage, false);
  const extraOnetimeDamage = parseDamage(extraTurnDamage, false);
  const dpr =
    (fullChance + halfChance * 0.5) *
    (fullDamage + extraDamage + extraOnetimeDamage);
  // either all-or-nothing (full only), or 100% chance (full and half)
  return dpr * numberOfTargets;
};

/**
 * Groups rows in a table by a specific column value.
 *
 * @param {string} tabName - The tab name. If undefined, uses the currently selected tab instead.
 * @param {string} specialColumn - The column to group rows by.
 * @returns {void}
 */
export const groupRowsByColumnValue = (
  tabName: string | undefined,
  specialColumn: string
): void => {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = tabName
    ? spreadsheet.getSheetByName(tabName)
    : spreadsheet.getActiveSheet();

  const lr = sheet.getDataRange().getLastRow();

  for (let row = 2; row < lr; row++) {
    const depth = sheet.getRowGroupDepth(row);
    if (depth < 1) continue;
    sheet.getRowGroup(row, depth).remove();
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const columnToGroup = dataRange.getValues()[1].indexOf(specialColumn) + 1;
  const numRows = values.length;

  // Create an object to store the grouped row ranges
  const groupedRows = {};

  // Iterate through each row and group them by the column value
  for (let i = 2; i < numRows; i++) {
    const cellValue =
      values[i][columnToGroup - 1] + "-" + values[i][columnToGroup];

    if (!groupedRows[cellValue]) groupedRows[cellValue] = 1;
    else {
      const newRange = sheet.getRange(i + 1, 1);
      newRange.shiftRowGroupDepth(1);
    }
  }
};

/**
 * This function groups the various sheets active.
 *
 * @returns {void} No return value.
 */
export const modifySheet = (): void => {
  const campaigns: string[] = ["🧟‍♂️ Immortal Vigil DPRs", "🛸 Prometheus DPRs"];
  for (const campaign of campaigns)
    groupRowsByColumnValue(campaign, "Character");
};

/**
 * This function groups the characters on the current sheet.
 *
 * @returns {void} No return value.
 */
export const modifyCurrentSheet = (): void => {
  groupRowsByColumnValue(undefined, "Character");
};

/**
 * Method that gets run when the sheet opens. Adds a menu button.
 *
 * @returns {void}
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const onOpen = (): void => {
  const ui = SpreadsheetApp.getUi();
  ui.createMenu("Run")
    .addItem("Clean Active Campaigns", "modifySheet")
    .addItem("Clean Current Sheet", "modifyCurrentSheet")
    .addToUi();
};
