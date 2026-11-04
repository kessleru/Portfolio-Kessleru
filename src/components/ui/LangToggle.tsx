import { setLang, useLang } from '@/lib/i18n';

/** Troca o site entre português e inglês: as duas siglas, com a atual no destaque. */
export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, t } = useLang();
  const next = lang === 'pt' ? 'en' : 'pt';

  return (
    <button
      type="button"
      onClick={() => setLang(next)}
      aria-label={t('Mudar para inglês', 'Switch to Portuguese')}
      title={t('English', 'Português')}
      data-kess-mood="animado"
      data-kess-say={t('i can speak english too', 'eu também falo português')}
      className={`lang-toggle ${className}`}
    >
      <span data-on={lang === 'pt' ? '' : undefined}>PT</span>
      <span aria-hidden="true">/</span>
      <span data-on={lang === 'en' ? '' : undefined}>EN</span>
    </button>
  );
}
