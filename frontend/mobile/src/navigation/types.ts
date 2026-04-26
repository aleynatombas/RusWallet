export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Transactions: undefined;
  /** Anasayfadaki profil kartından hedef bölümüne kaydırmak için */
  Analysis: { scrollToGoal?: boolean } | undefined;
  /** Alt menü: yalnızca hesap menüsü tetikleyicisi; ekrana geçiş yapılmaz */
  Profile: undefined;
};

export type AppStackParamList = {
  MainTabs: undefined;
  Settings: undefined;
  /** Kayıt sonrası zorunlu veya navbar’dan “profili güncelle” (mode: revisit). */
  Onboarding: { mode?: 'revisit' } | undefined;
};
