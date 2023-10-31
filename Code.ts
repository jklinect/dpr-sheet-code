/**
 * Parses a damage dice string (1d8 + 4) and returns a floating point representation.
 *
 * @param {string} input - The input value to parse.
 * @param {boolean} critical - Determines if damage dice are doubled or not.
 * @param {boolean} [min_only=false] - Optional. If true, uses `1` in place of dice rolls.
 * @param {boolean} [max_only=false] - Optional. If true, uses the max roll of a dice.
 * @returns {number} The expected value of the damage dice.
 */
export function parseDamage(input, critical, min_only = false, max_only = false) {
  var diceRegex = /(\d+)d(\d+)/gm;
  var match;
  var roll = 0;
  if (String(input).indexOf("==") > -1) {
    input = input.split("==");
    input = input[input.length - 1]
  }
  while (match = diceRegex.exec(input)) {
    var count = parseInt(match[1]);
    var sides = parseInt(match[2]);
    if (critical) {
      count *= 2;
    }
    for (var i = 0; i < count; i++) {
      // min only? adds 1
      // max only? adds max roll
      // otherwise? adds expected (N+1)/2
      roll += min_only ? 1 : max_only ? sides : (sides + 1) / 2
    }
  }
  var modifierRegex = /([+-])\s*(\d+)$/gm;
  while (match = modifierRegex.exec(input)) {
    var operator = match[1];
    var value = parseInt(match[2]);
    if (operator === "+") {
      roll += value;
    } else {
      roll -= value;
    }
  }
  return roll;
}

/**
 * Returns the critical hit chance, based on advantage and disadvantage.
 *
 * @param {boolean} advantage - Indicates if the roll is advantaged.
 * @param {boolean} disadvantage - Indicates if the roll is disadvantaged.
 * @returns {number} The critical hit chance
 */
export function calculate_to_crit(advantage, disadvantage) {
  return advantage    ? 1.0 - 0.95**2 :
         disadvantage ? 0.05**2 :
         0.05;
}

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
 * @param {number} to_hit - The base to-hit modifier.
 * @param {number} extra_attack_tohit - The additional to-hit modifier for each extra attack.
 * @param {number} extra_turn_tohit - The additional to-hit modifier applied once a turn.
 * @param {number} expected_ac - The expected armor class of the target.
 * @param {boolean} advantage - Whether advantage is applied.
 * @param {boolean} disadvantage - Whether disadvantage is applied.
 * @returns {number} The calculated hit chance.
 */
export function calculate_to_hit(to_hit, extra_attack_tohit, extra_turn_tohit, expected_ac, advantage, disadvantage) {
  var success_chance = 0.05 + (20 - expected_ac + to_hit + extra_attack_tohit + extra_turn_tohit) / 20;
  var failure_chance = 1.0 - success_chance;
  if (advantage) {
    // 0.9025 = 1 - 0.0975
    return 0.9025 - (failure_chance * failure_chance);
  }
  else if (disadvantage) {
    return success_chance * success_chance;
  }
  else {
    return success_chance - 0.05;
  }
}

/**
 * Calculates the damage per round (DPR) based on various parameters.
 *
 * @param {number} num_attacks - The number of attacks.
 * @param {number} to_hit - The base 'to hit' value.
 * @param {number} attack_damage - The base attack damage.
 * @param {string} [extra_attack_damage=""] - Optional. Extra damage applied on each attack.
 * @param {string} [extra_turn_damage=""] - Optional. Extra damage applied once a turn.
 * @param {string} [extra_attack_to_hit=""] - Optional. Extra 'to hit' modifier for each attack.
 * @param {string} [extra_turn_to_hit=""] - Optional. Extra 'to hit' modifier for each turn.
 * @param {string} [challenge_ac="0"] - Optional. The challenge rating armor class.
 * @param {boolean} [min_dmg=false] - Optional. If true, only 1s are used in dice roll calculations.
 * @param {boolean} [max_dmg=false] - Optional. If true, only maximum rolls are used in dice roll calculations.
 * @param {boolean} [advantage=false] - Optional. If true, advantage is considered in the calculation.
 * @param {boolean} [disadvantage=false] - Optional. If true, disadvantage is considered in the calculation.
 * @returns {type} The given damage as described by the parameters
 */
export function calculate_dpr(num_attacks,
                              to_hit,
                              attack_damage,
                              extra_attack_damage = "",
                              extra_turn_damage = "",
                              extra_attack_to_hit = "",
                              extra_turn_to_hit = "",
                              challenge_ac = "0",
                              min_dmg = false,
                              max_dmg = false,
                              advantage = false,
                              disadvantage = false)
{
  const crit_damage           = parseDamage(attack_damage, true, min_dmg, max_dmg);
  const base_damage           = parseDamage(attack_damage, false, min_dmg, max_dmg);
  const per_attack_crit_bonus = parseDamage(extra_attack_damage, true, min_dmg, max_dmg);
  const per_attack_bonus      = parseDamage(extra_attack_damage, false, min_dmg, max_dmg);
  const per_turn_crit_bonus   = parseDamage(extra_turn_damage, true, min_dmg, max_dmg);
  const per_turn_bonus        = parseDamage(extra_turn_damage, false, min_dmg, max_dmg);
  const extra_attack_tohit    = parseDamage(extra_attack_to_hit, false, min_dmg, max_dmg);
  const extra_turn_tohit      = parseDamage(extra_turn_to_hit, false, min_dmg, max_dmg);
  let dpr = 0.0;
  const expected_ac = parseInt(challenge_ac)
  // expected attack has 65% chance to hit:
  // 5% chance to do critical hit
  // 60% chance to do a normal hit (to_hit modifiers may adjust this)
  // dpr = damages multiplied by those percentages
  // dpr = (crit damage * crit chance) + (normal damage * normal chance)
  const to_crit_chance = calculate_to_crit(advantage, disadvantage);
  let to_hit_chance: number = calculate_to_hit(to_hit, extra_attack_tohit, extra_turn_tohit, expected_ac, advantage, disadvantage);
  dpr = (crit_damage + per_attack_crit_bonus + per_turn_crit_bonus) * to_crit_chance + 
        (base_damage + per_attack_bonus + per_turn_bonus) * Math.min(to_hit_chance, 0.90);
  // subsequent attacks (no extra_turn_tohit applied)
  if (--num_attacks > 0) {
    to_hit_chance = calculate_to_hit(to_hit, extra_attack_tohit, 0, expected_ac, advantage, disadvantage)
    dpr += num_attacks * ((crit_damage + per_attack_crit_bonus) * to_crit_chance + 
                          (base_damage + per_attack_bonus)      * Math.min(to_hit_chance, 0.90));
  }
  return dpr;
}

/**
 * This function calculates the spell damage based on various parameters.
 *
 * @param {number} spell_dc - The spell's difficulty class.
 * @param {number} attack_damage - The base damage of the attack.
 * @param {number} extra_attack_damage - The additional damage applied once per hit.
 * @param {number} extra_turn_damage - The additional damage applied once a turn.
 * @param {boolean} no_damage_on_save - If true, a save results in no damage.
 * @param {number} expected_save - The expected save roll.
 * @returns {number} The calculated spell damage.
 */
function calculate_spell_damage(spell_dc,
                                attack_damage,
                                extra_attack_damage,
                                extra_turn_damage,
                                no_damage_on_save = false,
                                expected_save = 0)
{
  // spell damage is:
  // (chance for full damage)*(full damage) - (1 - (chance for full damage))*(half damage)
  var full_chance = (20 - spell_dc + expected_save)/20;
  var full_damage = parseDamage(attack_damage, false);
  var half_chance = no_damage_on_save ? 0.0 : 1 - full_chance;
  var half_damage = 0.5 * full_damage;  // unless there's non-dice figures, this is fine
  var extra_damage = parseDamage(extra_attack_damage, false);
  var extra_onetime_damage = parseDamage(extra_turn_damage, false);
  var dpr = full_chance * (full_damage + extra_damage) + half_chance * (half_damage + extra_attack_damage);
  // either all-or-nothing (full only), or 100% chance (full and half)
  // to apply the extra turn damage here at the end
  dpr += (full_chance + half_chance) * extra_onetime_damage;
  return 0;
}

/**
 * Groups rows in a table by a specific column value.
 *
 * @param {string} tabName - The tab name.
 * @param {string} specialColumn - The column to group rows by.
 * @returns {void}
 */
function groupRowsByColumnValue(tabName: string, specialColumn: string): void {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(tabName);
  
  let lr = sheet.getDataRange().getLastRow();
  
  for (let row = 1; row < lr; row++) {
    let depth = sheet.getRowGroupDepth(row);
    if (depth < 1) continue;
    sheet.getRowGroup(row, depth).remove();
  }

  var dataRange = sheet.getDataRange();
  var values = dataRange.getValues();
  var columnToGroup = dataRange.getValues()[0].indexOf(specialColumn) + 1;
  var numRows = values.length;
  
  // Create an object to store the grouped row ranges
  var groupedRows = {};
  
  // Iterate through each row and group them by the column value
  for (var i = 1; i < numRows; i++) {
    var cellValue = values[i][columnToGroup - 1] + "-" + values[i][columnToGroup];
    
    if (!groupedRows[cellValue]) {
      groupedRows[cellValue] = 1
    }
    else {
      var newRange = sheet.getRange(i + 1, 1);
      newRange.shiftRowGroupDepth(1);
    }
  }
}

/**
 * This function groups the various sheets active.
 *
 * @returns {void} No return value.
 */
function modifySheet(): void {
  const campaigns: string[] = [
    "🔪 A Deadly Deal DPRs",
    "🗼 Clockwise Tower DPRs",
    "🏫 Breckenridge 3 DPRs"
  ]
  for (let campaign of campaigns)
    groupRowsByColumnValue(campaign, "Character");
}
