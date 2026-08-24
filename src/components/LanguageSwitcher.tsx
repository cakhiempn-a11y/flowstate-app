import React from 'react';
import { Globe } from 'lucide-react';
import { useStore } from '../store/useStore';
import { Select } from './ui/Select';
import { cn } from '../lib/utils';
import { useTranslation } from '../i18n/useTranslation';

export const LanguageSwitcher: React.FC = () => {
  const language = useStore(s => s.language) || 'en';
  const setLanguage = useStore(s => s.setLanguage);
  const { t } = useTranslation();

  const options = [
    { value: 'en', label: t('languages.en') || 'English' },
    { value: 'vi', label: t('languages.vi') || 'Tiếng Việt' },
    { value: 'zh', label: t('languages.zh') || '中文' },
    { value: 'ko', label: t('languages.ko') || '한국어' },
  ];

  return (
    <div className="flex items-center space-x-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select
        value={language}
        onChange={(val) => setLanguage(val)}
        options={options}
        className="w-32"
      />
    </div>
  );
};
