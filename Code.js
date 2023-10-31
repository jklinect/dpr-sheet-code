function parseDamage(input, critical, min_only = false, max_only = false) {
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
    if (critical == true) {
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

function calculate_to_crit(advantage, disadvantage) {
  return advantage    ? 1.0 - 0.95**2 :
         disadvantage ? 0.05**2 :
         0.05;
}
function calculate_to_hit(to_hit, extra_attack_tohit, extra_turn_tohit, expected_ac, advantage, disadvantage) {
  var success_chance = 0.05 + (20 - expected_ac + to_hit + extra_attack_tohit + extra_turn_tohit) / 20;
  var failure_chance = 1.0 - success_chance;
  if (advantage) {
    return 0.9025 - (failure_chance * failure_chance);
  }
  else if (disadvantage) {
    return success_chance * success_chance;
  }
  else {
    return success_chance - 0.05;
  }
}

function calculate_dpr(num_attacks, 
                       to_hit,
                       attack_damage,
                       extra_attack_damage = "",
                       extra_turn_damage = "",
                       extra_attack_tohit = "",
                       extra_turn_tohit = "",
                       expected_ac = 0,
                       min_dmg = false,
                       max_dmg = false,
                       advantage = false,
                       disadvantage = false) 
{
  var crit_damage           = parseDamage(attack_damage, true, min_dmg, max_dmg);
  var base_damage           = parseDamage(attack_damage, false, min_dmg, max_dmg);
  var per_attack_crit_bonus = parseDamage(extra_attack_damage, true, min_dmg, max_dmg);
  var per_attack_bonus      = parseDamage(extra_attack_damage, false, min_dmg, max_dmg);
  var per_turn_crit_bonus   = parseDamage(extra_turn_damage, true, min_dmg, max_dmg);
  var per_turn_bonus        = parseDamage(extra_turn_damage, false, min_dmg, max_dmg);
  var extra_attack_tohit    = parseDamage(extra_attack_tohit, false, min_dmg, max_dmg);
  var extra_turn_tohit      = parseDamage(extra_turn_tohit, false, min_dmg, max_dmg);
  var dpr = 0.0;
  expected_ac = parseInt(expected_ac)
  // expected attack has 65% chance to hit:
  // 5% chance to do critical hit
  // 60% chance to do a normal hit (to_hit modifiers may adjust this)
  // dpr = damages multiplied by those percentages
  // dpr = (crit damage * crit chance) + (normal damage * normal chance)
  var to_crit_chance = calculate_to_crit(advantage, disadvantage);
  var to_hit_chance = calculate_to_hit(to_hit, extra_attack_tohit, extra_turn_tohit, expected_ac, advantage, disadvantage);
  dpr = (crit_damage + per_attack_crit_bonus + per_turn_crit_bonus) * to_crit_chance + 
        (base_damage + per_attack_bonus + per_turn_bonus) * Math.min(to_hit_chance, 0.90);
  // subsequent attacks (no extra_turn_tohit applied)
  if (num_attacks > 1) {
    num_attacks--;
    to_hit_chance = calculate_to_hit(to_hit, extra_attack_tohit, 0, expected_ac, advantage, disadvantage)
    dpr += num_attacks * ((crit_damage + per_attack_crit_bonus) * to_crit_chance + 
                          (base_damage + per_attack_bonus)      * Math.min(to_hit_chance, 0.90));
  }
  return dpr;
}

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
  var half_damage = 0.5 * parseDamage(attack_damage, false);  // unless there's non-dice figures, this is fine
  var extra_damage = parseDamage(extra_attack_damage, false);
  var extra_turn_damage = parseDamage(extra_turn_damage, false);
  var dpr = full_chance * (full_damage + extra_damage) + half_chance * (half_damage + extra_attack_damage);
  // either all-or-nothing (full only), or 100% chance (full and half)
  // to apply the extra turn damage here at the end
  dpr += (full_chance + half_chance) * extra_turn_damage;
  return 0;
}

function groupRowsByColumnValue(tabName, specialColumn) {
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
    } else {
      var newRange = sheet.getRange(i + 1, 1);
      newRange.shiftRowGroupDepth(1);
    }
  }
}

function modifySheet() {
  groupRowsByColumnValue("🎓 Breckenridge DPRs", "Character");
  // groupRowsByColumnValue("🥷 Rogue One DPRs", "Character");
  // groupRowsByColumnValue("⛏️ Deep Gnome DPRs", "Character");
  // groupRowsByColumnValue("🔪 A Deadly Deal DPRs", "Character");
  // groupRowsByColumnValue("🤡 noobpen", "Character");
}
