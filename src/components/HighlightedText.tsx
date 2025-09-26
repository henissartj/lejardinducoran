import React from 'react';
import { highlightArabicSearch, containsArabic } from '../utils/arabicNormalization';
import { findExactTranslation, areExactTranslations } from '../utils/preciseBilingualDictionary';

interface HighlightedTextProps {
  text: string;
  searchTerm: string;
  searchOptions: {
    ignoreDiacritics: boolean;
    caseSensitive: boolean;
    exactMatch: boolean;
    arabicSearchMode?: 'words' | 'partial' | 'exact';
  };
  language: string;
  className?: string;
  enableBilingualHighlighting?: boolean;
  otherLanguageText?: string;
}

interface TermToHighlight {
  term: string;
  isTranslation: boolean;
  highlightClass: string;
}

export const HighlightedText: React.FC<HighlightedTextProps> = ({
  text,
  searchTerm,
  searchOptions,
  language,
  className = '',
  enableBilingualHighlighting = true,
  otherLanguageText = ''
}) => {
  if (!text || !searchTerm.trim()) {
    return <span className={className}>{text}</span>;
  }

  // Fonction pour créer le HTML avec surlignage bilingue précis
  const createHighlightedHTML = (): string => {
    const { 
      ignoreDiacritics, 
      caseSensitive, 
      exactMatch,
      arabicSearchMode = 'words'
    } = searchOptions;
    
    // Éviter de traiter du texte déjà surligné
    if (text.includes('<mark')) {
      return text;
    }

    // Collecter tous les termes à surligner
    const termsToHighlight: TermToHighlight[] = [];
    
    // Ajouter le terme de recherche principal
    termsToHighlight.push({
      term: searchTerm.trim(),
      isTranslation: false,
      highlightClass: 'bg-yellow-300 text-yellow-900 px-0.5 rounded font-semibold'
    });

    // Trouver la traduction exacte si le surlignage bilingue est activé
    if (enableBilingualHighlighting && otherLanguageText) {
      const isSearchingInArabic = containsArabic(searchTerm);
      const isCurrentTextArabic = containsArabic(text);
      
      // Chercher la traduction exacte seulement si on est dans le bon contexte linguistique
      if (isSearchingInArabic !== isCurrentTextArabic) {
        const targetLanguage = isCurrentTextArabic ? 'arabic' : 'french';
        const exactTranslation = findExactTranslation(searchTerm, targetLanguage);
        
        if (exactTranslation && isTermPresentInText(exactTranslation, text, isCurrentTextArabic)) {
          termsToHighlight.push({
            term: exactTranslation,
            isTranslation: true,
            highlightClass: 'bg-yellow-300 text-yellow-900 px-0.5 rounded font-semibold border-2 border-yellow-500'
          });
        }
      }
    }

    // Trier les termes par longueur (plus long en premier) pour éviter les chevauchements
    termsToHighlight.sort((a, b) => b.term.length - a.term.length);

    // Appliquer le surlignage
    return applyHighlighting(text, termsToHighlight, {
      ignoreDiacritics,
      caseSensitive,
      exactMatch,
      arabicSearchMode
    });
  };

  // Fonction pour appliquer le surlignage à tous les termes
  const applyHighlighting = (
    inputText: string,
    terms: TermToHighlight[],
    options: {
      ignoreDiacritics: boolean;
      caseSensitive: boolean;
      exactMatch: boolean;
      arabicSearchMode: string;
    }
  ): string => {
    let result = inputText;
    const isTextArabic = containsArabic(inputText);

    for (const termInfo of terms) {
      const { term, highlightClass } = termInfo;
      const isTermArabic = containsArabic(term);

      // Appliquer le surlignage selon la langue
      if (isTextArabic && isTermArabic) {
        // Texte arabe, terme arabe
        const wholeWords = options.arabicSearchMode === 'words' || options.arabicSearchMode === 'exact';
        result = highlightArabicSearch(result, term, {
          ignoreDiacritics: options.ignoreDiacritics,
          highlightClass,
          wholeWords
        });
      } else if (!isTextArabic && !isTermArabic) {
        // Texte français, terme français
        result = highlightFrenchTerm(result, term, {
          caseSensitive: options.caseSensitive,
          exactMatch: options.exactMatch || termInfo.isTranslation // Toujours utiliser des mots entiers pour les traductions
        }, highlightClass);
      }
    }

    return result;
  };

  // Fonction utilitaire pour surligner un terme français
  const highlightFrenchTerm = (
    inputText: string,
    term: string,
    options: { caseSensitive: boolean; exactMatch: boolean },
    highlightClass: string
  ): string => {
    if (!term.trim()) return inputText;
    
    // Éviter de surligner du texte déjà surligné
    if (inputText.includes('<mark')) {
      return inputText;
    }
    
    let processedTerm = term.trim();
    
    // Appliquer les options de recherche
    if (!options.caseSensitive) {
      processedTerm = processedTerm.toLowerCase();
    }
    
    // Échapper les caractères spéciaux pour l'expression régulière
    const escapedTerm = processedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    
    // Créer l'expression régulière - toujours utiliser des mots entiers pour plus de précision
    const regexPattern = `\\b${escapedTerm}\\b`;
    const flags = options.caseSensitive ? 'g' : 'gi';
    
    try {
      const regex = new RegExp(regexPattern, flags);
      
      // Appliquer le surlignage
      return inputText.replace(regex, (match) => {
        return `<mark class="${highlightClass}">${match}</mark>`;
      });
    } catch (error) {
      console.warn('Regex error for term:', term, error);
      return inputText;
    }
  };

  // Fonction utilitaire pour vérifier si un terme est présent dans le texte
  const isTermPresentInText = (term: string, textToCheck: string, isArabic: boolean): boolean => {
    if (isArabic) {
      // Pour l'arabe, utiliser la normalisation
      const normalizedText = textToCheck.replace(/[\u064B-\u065F\u0670\u0651]/g, '');
      const normalizedTerm = term.replace(/[\u064B-\u065F\u0670\u0651]/g, '');
      
      // Vérifier la présence comme mots entiers
      const words = normalizedText.split(/[\s\u060C\u061B\u061F\u06D4]+/);
      const searchWords = normalizedTerm.split(/[\s\u060C\u061B\u061F\u06D4]+/);
      
      return searchWords.every(searchWord => 
        words.some(word => word === searchWord)
      );
    } else {
      // Pour le français, recherche de mots entiers insensible à la casse
      const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(textToCheck);
    }
  };

  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ 
        __html: createHighlightedHTML() 
      }} 
    />
  );
};