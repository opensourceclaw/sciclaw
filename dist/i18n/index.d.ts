/**
 * Internationalization (i18n) module
 * Supports Chinese (zh) and English (en) languages.
 */
declare class I18nSingleton {
    private currentLang;
    private translations;
    constructor();
    setLanguage(lang: string): void;
    getLanguage(): string;
    t(key: string, ...args: unknown[]): string;
    availableLanguages(): string[];
}
export declare function setLanguage(lang: string): void;
export declare function getLanguage(): string;
export declare function t(key: string, ...args: unknown[]): string;
export { I18nSingleton as I18n };
//# sourceMappingURL=index.d.ts.map