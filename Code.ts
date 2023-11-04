/**
 * Parses a damage dice string (1d8 + 4) and returns a floating point representation.
 *
 * @param {string} input - The input value to parse.
 * @param {boolean} critical - Determines if damage dice are doubled or not.
 * @param {boolean} [minOnly=false] - Optional. If true, uses `1` in place of dice rolls.
 * @param {boolean} [maxOnly=false] - Optional. If true, uses the max roll of a dice.
 * @returns {number} The expected value of the damage dice.
 */
export const parseDamage = (input: string, critical: boolean, minOnly: boolean = false, maxOnly: boolean = false): number => {
  let match: RegExpExecArray;
  let roll = 0;
  if (String(input).indexOf("==") > -1) {
    const formula = input.split("==");
    input = formula[formula.length - 1];
  }
  const diceRegex = /(^|[+-/*^ ])\s*(\d+)d?(\d*)/gm;
  while ((match = diceRegex.exec(input))) {
    const operator = match[1];
    const count = parseInt(match[2]);
    let value = 0;
    if (match[3]) {
      const sides = parseInt(match[3]);
      const damage = (minOnly ? 1 : maxOnly ? sides : (sides + 1) / 2);
      value = (critical ? 2 * count : count) * damage;
    }
    else {
      value = count;
    }
    const impliedAddition = !operator || operator === " ";
    if ((impliedAddition && match[3]) || operator === "+") {
      roll += value;
    }
    else if (operator === "-") {
      roll -= value;
    }
    else if (operator === "*") {
      roll *= value;
    }
    else if (operator === "/") {
      roll /= value;
    }
    else if (operator === "^") {
      roll **= value;
    }
  }
  return roll;
};

/**
 * Returns the critical hit chance, based on advantage and disadvantage.
 *
 * @param {boolean} advantage - Indicates if the roll is advantaged.
 * @param {boolean} disadvantage - Indicates if the roll is disadvantaged.
 * @param {number} minCrit - The minimum roll on a D20 to score a critical.
 * @param {boolean} elvenAccuracy - Whether elven accuracy is applied.
 * @returns {number} The critical hit chance
 */
export const calculateToCrit = (advantage: boolean, disadvantage: boolean, minCrit: number = 20, elvenAccuracy: boolean = false): number => {
  const success = (21 - minCrit) / 20;
  const failure = 1.0 - success;
  return elvenAccuracy ? 1.0 - failure**3 :
         advantage     ? 1.0 - failure**2 :
         disadvantage  ? success**2 :
                         success;
};

/**
 * This function calculates the hit-once chance based on various parameters. It does
 * not factor in critical success, it returns the chance excluding that.
 * As an example, on a simple DC10 check with no modifier:
 * * 1 critical fails (5%)
 * * 2 - 9 fail (45%)
 * * 10 - 19 succeed (50%)
 * * 20 critical succeeds (5%)
 *
 * This would return 0.50 accordingly.
 * @param {number} toHit - The base to-hit modifier.
 * @param {number} extraAttackToHit - The additional to-hit modifier for each extra attack.
 * @param {number} extraTurnToHit - The additional to-hit modifier applied once a turn.
 * @param {number} expectedAc - The expected armor class of the target.
 * @param {boolean} advantage - Whether advantage is applied.
 * @param {boolean} disadvantage - Whether disadvantage is applied.
 * @param {number} minCrit - The minimum roll on a D20 to score a critical.
 * @param {boolean} elvenAccuracy - Whether elven accuracy is applied.
 * @returns {number} The calculated hit chance.
 */
export const calculateToHit = (toHit: number, extraAttackToHit: number, extraTurnToHit: number, expectedAc: number, advantage: boolean, disadvantage: boolean, minCrit: number = 20, elvenAccuracy: boolean = false): number => {
  const successChance = 0.05 + (20 - expectedAc + toHit + extraAttackToHit + extraTurnToHit) / 20;
  const failureChance = 1.0 - successChance;
  const critChance    = calculateToCrit(advantage, disadvantage, minCrit, elvenAccuracy);
  if (elvenAccuracy) {
    return 1 - (failureChance ** 3) - critChance;
  }
  else if (advantage) {
    return 1 - (failureChance ** 2) - critChance;
  }
  else if (disadvantage) {
    return successChance**2 - critChance;
  }
  else {
    return successChance - critChance;
  }
};

/**
 * Calculates the damage per round (DPR) based on various parameters.
 *
 * @param {number} numAttacks - The number of attacks.
 * @param {number} toHit - The base 'to hit' value.
 * @param {string} attackDamage - The base attack damage.
 * @param {string} [extraAttackDamage=""] - Optional. Extra damage applied on each attack.
 * @param {string} [extraTurnDamage=""] - Optional. Extra damage applied once a turn.
 * @param {string} [extraAttackModifier=""] - Optional. Extra 'to hit' modifier for each attack.
 * @param {string} [extraTurnModifier=""] - Optional. Extra 'to hit' modifier for each turn.
 * @param {string} [challengeAc="0"] - Optional. The challenge rating armor class.
 * @param {boolean} [minDmg=false] - Optional. If true, only 1s are used in dice roll calculations.
 * @param {boolean} [maxDmg=false] - Optional. If true, only maximum rolls are used in dice roll calculations.
 * @param {boolean} [advantage=false] - Optional. If true, advantage is considered in the calculation.
 * @param {boolean} [disadvantage=false] - Optional. If true, disadvantage is considered in the calculation.
 * @param {number} minCrit - The minimum roll on a D20 to score a critical.
 * @returns {number} The given damage as described by the parameters
 */
// eslint-disable-next-line camelcase
export const calculate_dpr = (numAttacks: number,
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
                              elvenAccuracy = false): number => {
  const critDamage           = parseDamage(attackDamage, true, minDmg, maxDmg);
  const baseDamage           = parseDamage(attackDamage, false, minDmg, maxDmg);
  const perAttackCritBonus   = parseDamage(extraAttackDamage, true, minDmg, maxDmg);
  const perAttackBonus       = parseDamage(extraAttackDamage, false, minDmg, maxDmg);
  const perTurnCritBonus     = parseDamage(extraTurnDamage, true, minDmg, maxDmg);
  const perTurnBonus         = parseDamage(extraTurnDamage, false, minDmg, maxDmg);
  const extraAttackToHit     = parseDamage(extraAttackModifier, false, minDmg, maxDmg);
  const extraTurnToHit       = parseDamage(extraTurnModifier, false, minDmg, maxDmg);
  let dpr = 0.0;
  const expectedAc = parseInt(challengeAc);
  // dpr = (crit damage * crit chance) + (normal damage * normal chance)
  const toCritChance = calculateToCrit(advantage, disadvantage, minCrit, elvenAccuracy);
  let toHitChance: number = calculateToHit(toHit, extraAttackToHit, extraTurnToHit, expectedAc, advantage, disadvantage, minCrit, elvenAccuracy);
  dpr = (critDamage + perAttackCritBonus + perTurnCritBonus) * toCritChance +
        (baseDamage + perAttackBonus + perTurnBonus) * Math.min(toHitChance, 0.90);
  // subsequent attacks (no extra_turn_tohit applied)
  if (--numAttacks > 0) {
    toHitChance = calculateToHit(toHit, extraAttackToHit, 0, expectedAc, advantage, disadvantage, minCrit, elvenAccuracy);
    dpr += numAttacks * ((critDamage + perAttackCritBonus) * toCritChance +
                         (baseDamage + perAttackBonus)     * Math.min(toHitChance, 0.90));
  }
  return dpr;
};

/**
 * This function calculates the spell damage based on various parameters.
 *
 * @param {number} spellDc - The spell's check DC.
 * @param {string} attackDamage - The base damage of the attack.
 * @param {string} extraAttackDamage - The additional damage applied once per hit.
 * @param {string} extraTurnDamage - The additional damage applied once a turn.
 * @param {boolean} noDamageOnSave - If true, a save results in no damage.
 * @param {number} expectedSave - The expected save roll modifier.
 * @param {number} numberOfTargets - The number of targets affected.
 * @returns {number} The calculated spell damage.
 */
export const calculateSpellDamage = (spellDc: number,
                                     attackDamage: string,
                                     extraAttackDamage: string,
                                     extraTurnDamage: string,
                                     noDamageOnSave: boolean = false,
                                     expectedSave: number = 0,
                                     numberOfTargets: number = 1): number => {
  // spell damage is:
  // (chance for full damage)*(full damage) + (1 - (chance for full damage))*(half damage)
  const fullChance = (20 - spellDc + expectedSave)/20;
  const fullDamage = parseDamage(attackDamage, false);
  const halfChance = noDamageOnSave ? 0.0 : 1 - fullChance;
  const extraDamage = parseDamage(extraAttackDamage, false);
  const extraOnetimeDamage = parseDamage(extraTurnDamage, false);
  const dpr = (fullChance + halfChance * 0.5) * (fullDamage + extraDamage + extraOnetimeDamage);
  // either all-or-nothing (full only), or 100% chance (full and half)
  return dpr * numberOfTargets;
};

/**
 * Groups rows in a table by a specific column value.
 *
 * @param {string} tabName - The tab name.
 * @param {string} specialColumn - The column to group rows by.
 * @returns {void}
 */
export const groupRowsByColumnValue = (tabName: string, specialColumn: string): void => {
  // eslint-disable-next-line no-undef
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  
  const lr = sheet.getDataRange().getLastRow();
  
  for (let row = 1; row < lr; row++) {
    const depth = sheet.getRowGroupDepth(row);
    if (depth < 1) continue;
    sheet.getRowGroup(row, depth).remove();
  }

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  const columnToGroup = dataRange.getValues()[0].indexOf(specialColumn) + 1;
  const numRows = values.length;
  
  // Create an object to store the grouped row ranges
  const groupedRows = {};
  
  // Iterate through each row and group them by the column value
  for (let i = 1; i < numRows; i++) {
    const cellValue = values[i][columnToGroup - 1] + "-" + values[i][columnToGroup];
    
    if (!groupedRows[cellValue]) {
      groupedRows[cellValue] = 1;
    }
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
  const campaigns: string[] = [
    "🔪 A Deadly Deal DPRs",
    "🗼 Clockwise Tower DPRs",
    "🏫 Breckenridge 3 DPRs"
  ];
  for (const campaign of campaigns)
    groupRowsByColumnValue(campaign, "Character");
};
