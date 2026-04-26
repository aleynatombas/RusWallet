import type { ViewStyle } from 'react-native';

/**
 * Kart gölgesinin yanlarda kesilmemesi için scroll / sütuna eklenen yatay iç boşluk (iOS blur alanı).
 * İçerik kenarı ile ekran kenarı arasındaki mevcut padding buna eklenir.
 */
export const CARD_SHADOW_BLEED = 6;

/**
 * Kart / panel — yumuşak, dağınık gölge (keskin kenar yerine ambient derinlik).
 * Anasayfa / analiz kartlarıyla aynı tek kaynak.
 */
export function getCardShadow(dark: boolean): ViewStyle {
  return dark
    ? {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.28,
        shadowRadius: 22,
        elevation: 6,
      }
    : {
        shadowColor: '#64748b',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.07,
        shadowRadius: 28,
        elevation: 4,
      };
}
