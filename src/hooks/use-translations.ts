import { useTranslations as useNextIntlTranslations, useLocale } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';

export function useTranslations() {
  const t = useNextIntlTranslations();
  const locale = useLocale() as 'es' | 'en';
  const router = useRouter();
  const pathname = usePathname();

  const changeLanguage = (newLocale: 'es' | 'en') => {
    // Remove current locale from pathname
    const pathWithoutLocale = pathname.replace(/^\/[a-z]{2}/, '') || '/';
    
    // Navigate to new locale
    router.push(`/${newLocale}${pathWithoutLocale}`);
  };

  return {
    locale,
    t,
    changeLanguage,
    isLoading: false
  };
}