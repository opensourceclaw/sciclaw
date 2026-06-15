import { describe, it, expect } from 'vitest';
import { setLanguage, getLanguage, t, I18n } from '../../src/i18n/index.js';

describe('I18n', () => {
  it('should default to English', () => {
    expect(getLanguage()).toBe('en');
  });

  it('should set language', () => {
    setLanguage('zh');
    expect(getLanguage()).toBe('zh');
    setLanguage('en');
    expect(getLanguage()).toBe('en');
  });

  it('should translate keys', () => {
    setLanguage('en');
    expect(t('general.topic')).toBe('Topic');
    expect(t('general.success')).toBe('Success');
  });

  it('should return key if not found', () => {
    expect(t('nonexistent.key')).toBe('nonexistent.key');
  });

  it('should translate in Chinese', () => {
    setLanguage('zh');
    expect(t('general.topic')).toBe('主题');
    expect(t('general.success')).toBe('成功');
    setLanguage('en');
  });

  it('should support format arguments', () => {
    expect(t('search.found', { count: '5' })).toBe('Found 5 results');
  });

  it('should throw for unsupported language', () => {
    expect(() => setLanguage('fr')).toThrow('Unsupported language');
  });

  it('should list available languages', () => {
    const i18n = new I18n();
    const langs = i18n.availableLanguages();
    expect(langs).toContain('en');
    expect(langs).toContain('zh');
  });
});
