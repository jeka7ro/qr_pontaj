import React from 'react';
import { useTranslation } from '../utils/i18n.jsx';
import { Globe } from 'lucide-react';

// Steaguri vectoriale SVG clare, fără emoji, scalabile pe orice rezoluție
const FlagRO = () => (
  <svg viewBox="0 0 640 480" className="w-3.5 h-2.5 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#002B7F" d="M0 0h213.3v480H0z" />
      <path fill="#FCD116" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#CE1126" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

const FlagEN = () => (
  <svg viewBox="0 0 640 480" className="w-3.5 h-2.5 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <path fill="#012169" d="M0 0h640v480H0z" />
    <path fill="#FFF" d="m75 0 245 180L565 0h75v60L435 240l205 180v60h-75L320 300 75 480H0v-60l205-180L0 60V0h75z" />
    <path fill="#C8102E" d="m424 288 216 156v36h-48L376 312zm-208-96L0 36V0h48l216 156zm176-36 248-180v24L416 156zM224 324 0 456v-24l224-132z" />
    <path fill="#FFF" d="M256 0h128v480H256zM0 176h640v128H0z" />
    <path fill="#C8102E" d="M280 0h80v480h-80zM0 200h640v80H0z" />
  </svg>
);

const FlagFR = () => (
  <svg viewBox="0 0 640 480" className="w-3.5 h-2.5 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#002654" d="M0 0h213.3v480H0z" />
      <path fill="#ECEFF4" d="M213.3 0h213.4v480H213.3z" />
      <path fill="#CE1126" d="M426.7 0H640v480H426.7z" />
    </g>
  </svg>
);

const FlagNL = () => (
  <svg viewBox="0 0 640 480" className="w-3.5 h-2.5 rounded-[2px] shadow-2xs shrink-0 overflow-hidden" aria-hidden="true">
    <g fillRule="evenodd">
      <path fill="#AE1C28" d="M0 0h640v160H0z" />
      <path fill="#FFF" d="M0 160h640v160H0z" />
      <path fill="#21468B" d="M0 320h640v160H0z" />
    </g>
  </svg>
);

export default function LanguageToggle({ className = '', variant = 'segmented', countryCode = 'RO' }) {
  const { language, setLanguage } = useTranslation();

  // Pentru România: RO, ENG, FR
  // Pentru Belgia: NL, FR, ENG
  const isBelgium = (countryCode || '').toUpperCase() === 'BE';

  const languages = isBelgium
    ? [
        { code: 'nl', label: 'NL', Flag: FlagNL, title: 'Nederlands' },
        { code: 'fr', label: 'FR', Flag: FlagFR, title: 'Français' },
        { code: 'en', label: 'ENG', Flag: FlagEN, title: 'English' }
      ]
    : [
        { code: 'ro', label: 'RO', Flag: FlagRO, title: 'Română' },
        { code: 'en', label: 'ENG', Flag: FlagEN, title: 'English' },
        { code: 'fr', label: 'FR', Flag: FlagFR, title: 'Français' }
      ];

  if (variant === 'compact') {
    return (
      <div className={`relative inline-flex items-center gap-1.5 ${className}`}>
        <Globe size={14} className="text-slate-400 dark:text-slate-500" />
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value, true)}
          className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer py-1 pr-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Select Language / Selectează limba"
        >
          {languages.map((l) => (
            <option key={l.code} value={l.code} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">
              {l.label} ({l.title})
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div 
      className={`inline-flex items-center p-0.5 bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-full shadow-xs ${className}`}
      role="group"
      aria-label="Language Selector"
    >
      {languages.map((l) => {
        const isActive = language === l.code;
        const FlagComponent = l.Flag;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => setLanguage(l.code, true)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-extrabold tracking-wide rounded-full transition-all cursor-pointer ${
              isActive
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
            title={`Schimbă limba în ${l.title}`}
          >
            <FlagComponent />
            <span>{l.label}</span>
          </button>
        );
      })}
    </div>
  );
}
