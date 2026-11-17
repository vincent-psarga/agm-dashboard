import { useI18n } from '../i18n/I18nProvider';
import { LANGUAGES } from '../i18n/translations';

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <div className="language-switcher no-print" role="group" aria-label={t('languageLabel')}>
      {LANGUAGES.map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={language === option}
          onClick={() => setLanguage(option)}
        >
          {option.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
