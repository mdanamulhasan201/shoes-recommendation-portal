/**
 * Single source for kiosk shoe families: home-slider presentation +
 * matching `question_category.id` (`qc_selected_category_id` /
 * kiosk flow `question_category_id`).
 */

export const KIOSK_SLIDER_FAMILY_SLIDES = [
  {
    kioskLabel: 'Laufschuhe',
    questionCategoryId: 'cmp5lrlzn000tsmvwws4j6jy4',
    primaryLine: 'LAUF',
    highlight: 'SCHUHE',
    subtitle: 'Der passende Schuh. In Sekunden.',
    background: 'url("/images/img1.jpeg")'
  },
  {
    kioskLabel: 'Skischuhe',
    questionCategoryId: 'cmp5mu1du0035smvwc7c8r76v',
    primaryLine: 'SKI',
    highlight: 'SCHUHE',
    subtitle: 'Der passende Schuh. In Sekunden.',
    background: 'url("/images/img2.jpeg")'
  },
  {
    kioskLabel: 'Tourenskischuhe',
    questionCategoryId: 'cmp8auelm0001kwvw767gacc1',
    primaryLine: 'TOURENSKI',
    highlight: 'SCHUHE',
    subtitle: 'Finde den passenden Schuh in Sekunden.',
    breakAfterPrimary: true,
    background: 'url("/images/img3.jpeg")'
  },
  {
    kioskLabel: 'Outdoorschuhe',
    questionCategoryId: 'cmp5m9d65002nsmvw89ystf9y',
    primaryLine: 'OUTDOOR',
    highlight: 'SCHUHE',
    subtitle: 'Finde den passenden Schuh in Sekunden.',
    breakAfterPrimary: true,
    background: 'url("/images/img4.jpeg")'
  },
  
  {
    kioskLabel: 'Sneaker',
    questionCategoryId: 'cmp8avf100002kwvwgfwowqvp',
    primaryLine: 'ALLTAGS',
    highlight: 'SCHUHE',
    subtitle: 'Finde den passenden Schuh in Sekunden.',
    breakAfterPrimary: true,
    background: 'url("/images/img5.jpeg")'
  }
] as const

export type KioskFamilyLabel =
  typeof KIOSK_SLIDER_FAMILY_SLIDES[number]['kioskLabel']
