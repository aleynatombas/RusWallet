/**
 * Web ile aynı — giriş / kayıt başlıkları. ACTIVE_* anahtarlarını web ile senkron tutun.
 */
export const LOGIN_SETS = {
  modern: {
    title: 'Hoş geldin',
    description: 'E-posta ve şifrenizle giriş yapın.',
  },
  minimal: {
    title: 'Giriş yap',
    description: 'E-posta adresiniz ve şifrenizle oturum açın.',
  },
  friendly: {
    title: 'Hoş geldin',
    description: 'Devam etmek için bilgilerinizi girin.',
  },
  brandFirst: {
    title: 'RusWallet',
    description: 'Hesabınıza giriş yapın.',
  },
} as const;

export const REGISTER_SETS = {
  modern: {
    title: 'Hesap oluşturun',
    description: 'Kayıt olmak için aşağıdaki bilgileri doldurun.',
  },
  minimal: {
    title: 'Kayıt ol',
    description: 'Yeni hesap için bilgilerinizi girin.',
  },
  friendly: {
    title: 'Aramıza katılın',
    description: 'Birkaç adımda hesabınızı oluşturun.',
  },
  brandFirst: {
    title: 'RusWallet',
    description: 'Yeni hesap oluşturun.',
  },
} as const;

export type LoginSetKey = keyof typeof LOGIN_SETS;
export type RegisterSetKey = keyof typeof REGISTER_SETS;

export const ACTIVE_LOGIN: LoginSetKey = 'brandFirst';
export const ACTIVE_REGISTER: RegisterSetKey = 'brandFirst';
