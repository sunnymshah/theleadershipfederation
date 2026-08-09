/**
 * Partner enterprises. Rendered as typographic wordmarks in the marquee —
 * drop real SVG/PNG logos into /public/partners and add a `logo` field when
 * they are cleared for use.
 */
export type Partner = {
  name: string;
  logo?: string;
};

export const PARTNERS: Partner[] = [
  { name: 'IDFC FIRST Bank' },
  { name: 'Regalia Business Parks' },
  { name: 'RBL Bank' },
  { name: 'Happiest Minds' },
  { name: 'BenQ' },
  { name: 'BITSoM' },
  { name: 'Planview' },
  { name: 'Ascendion' },
  { name: 'Airbus' },
  { name: 'SAP Fioneer' },
  { name: 'bp' },
  { name: '3M' },
  { name: 'Toast' },
  { name: 'Ericsson' },
  { name: 'Progress' },
  { name: 'Delta Capita' },
  { name: 'Carelon' },
  { name: 'Sinch' },
  { name: 'DevRev' },
  { name: 'FIS Global' },
  { name: 'Fiserv' },
  { name: 'Kenvue' },
  { name: 'Amdocs' },
  { name: 'XPO Logistics' },
];
