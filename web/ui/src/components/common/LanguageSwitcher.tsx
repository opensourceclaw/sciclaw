import React from 'react';
import { Globe } from 'lucide-react';
import { useTranslation } from '../../i18n';

export const LanguageSwitcher: React.FC = () => {
  const { language, setLanguage, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      title={t('common.language')}
    >
      <Globe size={18} />
      <span className="font-medium">{language === 'en' ? 'EN' : '中'}</span>
    </button>
  );
};

export default LanguageSwitcher;
