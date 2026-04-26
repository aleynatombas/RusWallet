import {
  CommonActions,
  type NavigationHelpers,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';

/** Tab bar `navigation` prop’u `NavigationHelpers` tipinde olabilir — ikisi de dispatch/getParent taşır. */
type NavForSettings = NavigationProp<ParamListBase> | NavigationHelpers<ParamListBase>;

/**
 * App stack’teki `Settings` ekranına gider.
 * `getParent()?.navigate` tab bar / bazı alt ağaçlarda `undefined` kalıp sessizce çalışmıyordu;
 * önce üst stack, yoksa `CommonActions` ile kök yönlendirme.
 */
export function navigateToAppSettings(navigation: NavForSettings) {
  const parent = navigation.getParent();
  if (parent) {
    (parent as NavigationProp<ParamListBase>).navigate('Settings' as never);
    return;
  }
  navigation.dispatch(
    CommonActions.navigate({
      name: 'Settings',
    })
  );
}

/** Web navbar «Akıllı tanıtım» / `/onboarding` (gönüllü güncelleme). */
export function navigateToOnboardingRevisit(navigation: NavForSettings) {
  navigation.dispatch(
    CommonActions.navigate({ name: 'Onboarding', params: { mode: 'revisit' } })
  );
}
