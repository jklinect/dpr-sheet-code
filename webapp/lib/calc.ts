// Ported from src/Code.ts (Google Apps Script) for client-side DPR calculation

export const getEvRerolled = (
  sides: number,
  incremental: boolean = false,
  maxReroll: number = sides / 2,
  count: number = 1,
  rerollValue: number | undefined = undefined
): number => {
  const summer = (x: number): number => (x > 1 ? x + summer(x - 1) : 1);
  const expected = (sides + 1) / 2;
  const rerollEv = rerollValue ?? expected;
  const rerollChance = maxReroll < 1 ? maxReroll : maxReroll / sides;
  const rerolled =
    rerollChance * rerollEv +
    (1 / sides) *
      (summer(sides) - summer(maxReroll < 1 ? maxReroll * sides : maxReroll));
  return count * (incremental ? rerolled - expected : rerolled);
};

export const parseDamage = (
  input: string,
  critical: boolean = false,
  minOnly: boolean = false,
  maxOnly: boolean = false,
  extraCriticals: number = 0,
  rerolledDamageDieCount: number = 0,
  rerolledDamageDieFindValue: number | undefined = undefined,
  rerolledDamageDieReplaceValue: number | undefined = undefined
): number => {
  let match: RegExpExecArray | null;
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
        rerolledDamageDieFindValue ?? sides / 2,
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

export const calculateToHit = (
  toHit: number,
  expectedAc: number,
  advantage: boolean = false,
  disadvantage: boolean = false,
  minCrit: number = 20,
  elvenAccuracy: boolean = false
): number => {
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

export const calculateDpr = (
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
  rerolledDamageDieFindValue: number | undefined = undefined,
  rerolledDamageDieReplaceValue: number | undefined = undefined,
  missDamage: number = 0
): number => {
  const pd = (
    dmg: string,
    crit: boolean,
    extraCrits: number = 0,
    rerollCount: number = 0
  ) =>
    parseDamage(
      dmg,
      crit,
      minDmg,
      maxDmg,
      extraCrits,
      rerollCount,
      rerolledDamageDieFindValue,
      rerolledDamageDieReplaceValue
    );

  const critDamage = pd(
    attackDamage,
    true,
    extraCriticals,
    rerolledDamageDieCount
  );
  const baseDamage = pd(attackDamage, false, 0, rerolledDamageDieCount);
  const perAttackCritBonus = pd(
    extraAttackDamage,
    true,
    extraCriticals,
    rerolledDamageDieCount
  );
  const perAttackBonus = pd(
    extraAttackDamage,
    false,
    0,
    rerolledDamageDieCount
  );
  const perTurnCritBonus = pd(
    extraTurnDamage,
    true,
    extraCriticals,
    rerolledDamageDieCount
  );
  const perTurnBonus = pd(extraTurnDamage, false, 0, rerolledDamageDieCount);
  const extraAttackToHit = parseDamage(
    extraAttackModifier,
    false,
    minDmg,
    maxDmg
  );
  const extraTurnToHit = parseDamage(extraTurnModifier, false, minDmg, maxDmg);

  const expectedAc = parseInt(challengeAc);
  const toCritChance = calculateToCrit(
    advantage,
    disadvantage,
    minCrit,
    elvenAccuracy
  );

  let toHitChance = calculateToHit(
    toHit + extraAttackToHit + extraTurnToHit,
    expectedAc,
    advantage,
    disadvantage,
    minCrit,
    elvenAccuracy
  );
  let toMissChance = 1 - toHitChance - toCritChance;

  let dpr =
    toCritChance * (critDamage + perAttackCritBonus + perTurnCritBonus) +
    toHitChance * (baseDamage + perAttackBonus + perTurnBonus) +
    toMissChance * missDamage;

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

export const calculateSpellDamage = (
  spellDc: number,
  attackDamage: string,
  extraAttackDamage: string = "",
  extraTurnDamage: string = "",
  noDamageOnSave: boolean = false,
  expectedSave: number = 0,
  numberOfTargets: number = 1
): number => {
  const fullChance = 1 - Math.max(20 - spellDc + expectedSave, 1) / 20;
  const halfChance = noDamageOnSave ? 0.0 : 1 - fullChance;
  const dpr =
    (fullChance + halfChance * 0.5) *
    (parseDamage(attackDamage, false) +
      parseDamage(extraAttackDamage, false) +
      parseDamage(extraTurnDamage, false));
  return dpr * numberOfTargets;
};
