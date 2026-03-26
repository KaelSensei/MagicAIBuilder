// Shared deck constants

/** Card layouts that have two distinct faces (MDFC, transform, reversible) */
export const MDFC_LAYOUTS = ['modal_dfc', 'transform', 'reversible_card'] as const;
export type MdfcLayout = typeof MDFC_LAYOUTS[number];

/** Minimum color-pip imbalance (%) before flagging a mana base issue */
export const MANA_IMBALANCE_THRESHOLD = 15;
