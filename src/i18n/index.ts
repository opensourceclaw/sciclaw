/**
 * Internationalization (i18n) module
 * Supports Chinese (zh) and English (en) languages.
 */

type TranslationMap = Record<string, string>;

const EN: TranslationMap = {
  'banner.title': 'DeepClaw',
  'banner.subtitle': 'Deep Research Framework',
  'general.topic': 'Topic',
  'general.depth': 'Depth',
  'general.engine': 'Engine',
  'general.output': 'Output',
  'general.format': 'Format',
  'general.success': 'Success',
  'general.error': 'Error',
  'general.warning': 'Warning',
  'general.complete': 'Complete',
  'general.duration': 'Duration',
  'general.sections': 'Sections',
  'research.title': 'Researching',
  'research.complete': 'Research Complete',
  'research.sources': 'Sources',
  'research.saved': 'Report saved to',
  'search.title': 'Searching',
  'search.found': 'Found {count} results',
  'search.no_results': 'No results found',
  'error.api_key': '{engine} requires API key',
};

const ZH: TranslationMap = {
  'banner.title': 'DeepClaw',
  'banner.subtitle': '深度研究框架',
  'general.topic': '主题',
  'general.depth': '深度',
  'general.engine': '引擎',
  'general.output': '输出',
  'general.format': '格式',
  'general.success': '成功',
  'general.error': '错误',
  'general.warning': '警告',
  'general.complete': '完成',
  'general.duration': '耗时',
  'general.sections': '章节',
  'research.title': '研究中',
  'research.complete': '研究完成',
  'research.sources': '来源',
  'research.saved': '报告已保存至',
  'search.title': '搜索中',
  'search.found': '找到 {count} 条结果',
  'search.no_results': '未找到结果',
  'error.api_key': '{engine} 需要 API 密钥',
};

const TRANSLATIONS: Record<string, TranslationMap> = { en: EN, zh: ZH };

class I18nSingleton {
  private currentLang = 'en';
  private translations: Record<string, TranslationMap>;

  constructor() {
    this.translations = TRANSLATIONS;
  }

  setLanguage(lang: string): void {
    if (!this.translations[lang]) {
      throw new Error(`Unsupported language: ${lang}. Supported: ${Object.keys(this.translations).join(', ')}`);
    }
    this.currentLang = lang;
  }

  getLanguage(): string {
    return this.currentLang;
  }

  t(key: string, ...args: unknown[]): string {
    const map = this.translations[this.currentLang] ?? this.translations.en!;
    let result = map[key] ?? key;

    // Support {0}, {1} positional or {name} named
    if (args.length > 0) {
      if (typeof args[0] === 'object' && args[0] !== null) {
        const params = args[0] as Record<string, unknown>;
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }
      } else {
        for (let i = 0; i < args.length; i++) {
          result = result.replace(new RegExp(`\\{${i}\\}`, 'g'), String(args[i]));
        }
      }
    }

    return result;
  }

  availableLanguages(): string[] {
    return Object.keys(this.translations);
  }
}

const instance = new I18nSingleton();

export function setLanguage(lang: string): void {
  instance.setLanguage(lang);
}

export function getLanguage(): string {
  return instance.getLanguage();
}

export function t(key: string, ...args: unknown[]): string {
  return instance.t(key, ...args);
}

export { I18nSingleton as I18n };
