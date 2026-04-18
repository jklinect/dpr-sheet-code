export interface AttackParams {
  numAttacks: number;
  toHit: number;
  attackDamage: string;
  extraAttackDamage: string;
  extraTurnDamage: string;
  extraAttackModifier: string;
  extraTurnModifier: string;
  challengeAc: string;
}

export interface RollOptions {
  minDmg: boolean;
  maxDmg: boolean;
  advantage: boolean;
  disadvantage: boolean;
  elvenAccuracy: boolean;
  minCrit: number;
  extraCriticals: number;
  rerolledDamageDieCount: number;
  rerolledDamageDieFindValue: number | undefined;
  rerolledDamageDieReplaceValue: number | undefined;
  missDamage: number;
}

export interface SpellParams {
  spellDc: number;
  attackDamage: string;
  extraAttackDamage: string;
  extraTurnDamage: string;
  noDamageOnSave: boolean;
  expectedSave: number;
  numberOfTargets: number;
}

export interface FormValues {
  numAttacks: number;
  toHit: number;
  attackDamage: string;
  extraAttackDamage: string;
  extraTurnDamage: string;
  extraAttackModifier: string;
  extraTurnModifier: string;
  challengeAc: string;
  level: number;
  minDmg: boolean;
  maxDmg: boolean;
  minCrit: number;
  extraCriticals: number;
  rerolledDamageDieCount: number;
  rerolledDamageDieFindValue: string;
  rerolledDamageDieReplaceValue: string;
  missDamage: number;
  characterName: string;
}
