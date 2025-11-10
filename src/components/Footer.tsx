'use client'
import React from 'react'
import ThemeToggle from './theme-toggle'
import { FaCoffee, FaGithub, FaTwitter } from 'react-icons/fa'
import { useLanguage } from '@/contexts/LanguageContext';

const Footer = () => {
    const { messages } = useLanguage();
    
      // Create a simple translation function
      const t = (key: string, params: Record<string, string | number> = {}): string => {
        // Split the key by dots to access nested properties
        const keys = key.split('.');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let value: any = messages;
    
        // Navigate through the nested properties
        for (const k of keys) {
          if (value && typeof value === 'object' && k in value) {
            value = value[k];
          } else {
            // Return the key if the translation is not found
            return key;
          }
        }
    
        // If the value is a string, replace parameters
        if (typeof value === 'string') {
          return Object.entries(params).reduce((acc: string, [paramKey, paramValue]) => {
            return acc.replace(`{${paramKey}}`, String(paramValue));
          }, value);
        }
    
        // Return the key if the value is not a string
        return key;
      };
    return (
        <footer className="max-w-6xl mx-auto my-8 flex flex-col gap-4 w-full">
            <div
                className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[var(--card-bg)] rounded-lg p-4 border border-[var(--border-color)] shadow-custom">
                <p className="text-[var(--muted)] text-sm font-serif">{t('footer.copyright')}</p>

                <div className="flex items-center gap-6">
                    <div className="flex items-center space-x-5">
                        <a href="https://github.com/AsyncFuncAI/deepwiki-open" target="_blank" rel="noopener noreferrer"
                            className="text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors">
                            <FaGithub className="text-xl" />
                        </a>
                        <a href="https://buymeacoffee.com/sheing" target="_blank" rel="noopener noreferrer"
                            className="text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors">
                            <FaCoffee className="text-xl" />
                        </a>
                        <a href="https://x.com/sashimikun_void" target="_blank" rel="noopener noreferrer"
                            className="text-[var(--muted)] hover:text-[var(--accent-primary)] transition-colors">
                            <FaTwitter className="text-xl" />
                        </a>
                    </div>
                    <ThemeToggle />
                </div>
            </div>
        </footer>
    )
}

export default Footer