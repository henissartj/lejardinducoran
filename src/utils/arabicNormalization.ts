/**
 * Utilitaires pour la normalisation du texte arabe - Version améliorée pour plus de précision
 */

// Plages Unicode pour les diacritiques arabes
const ARABIC_DIACRITICS_REGEX = /[\u064B-\u065F\u0670\u0651]/g;

// Plages Unicode pour les caractères arabes de base
const ARABIC_LETTERS_REGEX = /[\u0600-\u06FF]/;

// Caractères arabes de substitution pour normalisation (plus conservateur)
const ARABIC_NORMALIZATIONS: Record<string, string> = {
  // Alif avec différentes formes - seulement les plus courantes
  'آ': 'ا', // Alif avec madda
  'أ': 'ا', // Alif avec hamza au-dessus
  'إ': 'ا', // Alif avec hamza au-dessous
  'ٱ': 'ا', // Alif Wasl
  
  // Ya final
  'ى': 'ي', // Alif maqsura -> Ya
  
  // Ta marbouta (optionnel)
  'ة': 'ة', // Garder tel quel pour plus de précision
};

/**
 * Supprime tous les diacritiques (harakat) d'un texte arabe
 */
export function removeDiacritics(text: string): string {
  if (!text) return text;
  return text.replace(ARABIC_DIACRITICS_REGEX, '');
}

/**
 * Normalise les caractères arabes de manière conservatrice
 */
export function normalizeArabicChars(text: string): string {
  if (!text) return text;
  
  let normalized = text;
  
  // Appliquer seulement les substitutions essentielles
  Object.entries(ARABIC_NORMALIZATIONS).forEach(([original, replacement]) => {
    normalized = normalized.replace(new RegExp(original, 'g'), replacement);
  });
  
  return normalized;
}

/**
 * Normalisation complète du texte arabe pour la recherche
 */
export function normalizeArabicText(
  text: string, 
  options: {
    removeDiacritics?: boolean;
    normalizeChars?: boolean;
    toLowerCase?: boolean;
    trimSpaces?: boolean;
  } = {}
): string {
  if (!text) return text;
  
  const {
    removeDiacritics: shouldRemoveDiacritics = true,
    normalizeChars = true,
    toLowerCase = false, // Pas nécessaire pour l'arabe
    trimSpaces = true
  } = options;
  
  let normalized = text;
  
  // Supprimer les diacritiques si demandé
  if (shouldRemoveDiacritics) {
    normalized = removeDiacritics(normalized);
  }
  
  // Normaliser les caractères arabes si demandé
  if (normalizeChars) {
    normalized = normalizeArabicChars(normalized);
  }
  
  // Nettoyer les espaces si demandé
  if (trimSpaces) {
    normalized = normalized.trim().replace(/\s+/g, ' ');
  }
  
  return normalized;
}

/**
 * Vérifie si un texte contient des caractères arabes
 */
export function containsArabic(text: string): boolean {
  return ARABIC_LETTERS_REGEX.test(text);
}

/**
 * Prépare une requête de recherche pour optimiser la recherche arabe
 */
export function prepareArabicSearchQuery(
  query: string,
  searchOptions: {
    ignoreDiacritics?: boolean;
    caseSensitive?: boolean;
    exactMatch?: boolean;
  } = {}
): string {
  if (!query || !containsArabic(query)) {
    return query;
  }
  
  const {
    ignoreDiacritics = true,
    exactMatch = false
  } = searchOptions;
  
  let processedQuery = query;
  
  // Normaliser le texte arabe selon les options
  processedQuery = normalizeArabicText(processedQuery, {
    removeDiacritics: ignoreDiacritics,
    normalizeChars: true,
    toLowerCase: false,
    trimSpaces: true
  });
  
  return processedQuery;
}

/**
 * Recherche précise dans un texte arabe
 */
export function findArabicMatches(
  text: string,
  searchTerm: string,
  options: {
    ignoreDiacritics?: boolean;
    exactMatch?: boolean;
    wholeWords?: boolean;
  } = {}
): boolean {
  const {
    ignoreDiacritics = true,
    exactMatch = false,
    wholeWords = false
  } = options;
  
  if (!text || !searchTerm) return false;
  
  // Normaliser les textes
  const normalizedText = normalizeArabicText(text, {
    removeDiacritics: ignoreDiacritics,
    normalizeChars: true
  });
  
  const normalizedSearchTerm = normalizeArabicText(searchTerm.trim(), {
    removeDiacritics: ignoreDiacritics,
    normalizeChars: true
  });
  
  if (!normalizedSearchTerm) return false;
  
  if (exactMatch) {
    // Recherche exacte du terme complet
    return normalizedText === normalizedSearchTerm;
  }
  
  if (wholeWords) {
    // Recherche de mots entiers - diviser par espaces et caractères de ponctuation
    const textWords = normalizedText.split(/[\s\u060C\u061B\u061F\u06D4]+/).filter(w => w.length > 0);
    const searchWords = normalizedSearchTerm.split(/[\s\u060C\u061B\u061F\u06D4]+/).filter(w => w.length > 0);
    
    // Vérifier si tous les mots de recherche sont trouvés comme mots entiers
    return searchWords.every(searchWord => 
      textWords.some(textWord => textWord === searchWord)
    );
  }
  
  // Recherche de sous-chaîne
  return normalizedText.includes(normalizedSearchTerm);
}

/**
 * Compare deux textes arabes avec plus de précision
 */
export function compareArabicTexts(
  text1: string,
  text2: string,
  options: {
    ignoreDiacritics?: boolean;
    exactMatch?: boolean;
  } = {}
): boolean {
  return findArabicMatches(text1, text2, {
    ignoreDiacritics: options.ignoreDiacritics,
    exactMatch: options.exactMatch
  });
}

/**
 * Recherche de mots arabes avec différents niveaux de précision
 */
export function searchArabicWords(
  text: string,
  searchTerms: string[],
  options: {
    ignoreDiacritics?: boolean;
    requireAll?: boolean;
    wholeWords?: boolean;
  } = {}
): boolean {
  const {
    ignoreDiacritics = true,
    requireAll = false,
    wholeWords = true
  } = options;
  
  if (!text || !searchTerms.length) return false;
  
  const results = searchTerms.map(term => 
    findArabicMatches(text, term, {
      ignoreDiacritics,
      wholeWords
    })
  );
  
  return requireAll ? results.every(r => r) : results.some(r => r);
}

/**
 * Surligne les termes de recherche dans un texte arabe avec plus de précision
 */
export function highlightArabicSearch(
  text: string,
  searchTerm: string,
  options: {
    ignoreDiacritics?: boolean;
    highlightClass?: string;
    wholeWords?: boolean;
  } = {}
): string {
  if (!text || !searchTerm) return text;
  
  const {
    ignoreDiacritics = true,
    highlightClass = 'bg-yellow-300 text-yellow-900 px-0.5 rounded',
    wholeWords = true
  } = options;
  
  // Éviter de surligner du texte déjà surligné
  if (text.includes('<mark')) return text;
  
  // Normaliser le terme de recherche
  const normalizedSearchTerm = normalizeArabicText(searchTerm.trim(), {
    removeDiacritics: ignoreDiacritics,
    normalizeChars: true
  });
  
  if (!normalizedSearchTerm) return text;
  
  // Diviser le texte en mots en préservant les séparateurs
  const parts = text.split(/(\s+|[\u060C\u061B\u061F\u06D4]+)/);
  
  return parts.map(part => {
    // Ne traiter que les mots (pas les espaces ou ponctuations)
    if (!/[\u0600-\u06FF]/.test(part) || part.includes('<mark')) return part;
    
    // Normaliser le mot pour la comparaison
    const normalizedPart = normalizeArabicText(part, {
      removeDiacritics: ignoreDiacritics,
      normalizeChars: true
    });
    
    // Vérifier la correspondance selon les options
    let matches = false;
    
    if (wholeWords) {
      // Recherche de mots entiers
      const searchWords = normalizedSearchTerm.split(/\s+/);
      matches = searchWords.some(word => normalizedPart === word);
    } else {
      // Recherche de sous-chaînes
      matches = normalizedPart.includes(normalizedSearchTerm);
    }
    
    if (matches) {
      return `<mark class="${highlightClass}">${part}</mark>`;
    }
    
    return part;
  }).join('');
}

/**
 * Fonction de recherche arabe améliorée avec différents modes
 */
export function performArabicSearch(
  text: string,
  query: string,
  mode: 'exact' | 'words' | 'partial' | 'flexible' = 'words',
  options: {
    ignoreDiacritics?: boolean;
    fuzzyThreshold?: number;
  } = {}
): boolean {
  const { ignoreDiacritics = true, fuzzyThreshold = 0.8 } = options;
  
  if (!text || !query) return false;
  
  switch (mode) {
    case 'exact':
      return findArabicMatches(text, query, {
        ignoreDiacritics,
        exactMatch: true
      });
      
    case 'words':
      const queryWords = query.trim().split(/\s+/);
      return searchArabicWords(text, queryWords, {
        ignoreDiacritics,
        requireAll: false, // Au moins un mot doit correspondre
        wholeWords: true
      });
      
    case 'partial':
      return findArabicMatches(text, query, {
        ignoreDiacritics,
        wholeWords: false
      });
      
    case 'flexible':
      // Essayer d'abord la recherche de mots, puis partielle
      const wordsMatch = performArabicSearch(text, query, 'words', { ignoreDiacritics });
      if (wordsMatch) return true;
      
      const partialMatch = performArabicSearch(text, query, 'partial', { ignoreDiacritics });
      if (partialMatch) return true;
      
      // Recherche floue en dernier recours
      return fuzzyArabicSearch(text, query, { ignoreDiacritics, threshold: fuzzyThreshold });
      
    default:
      return findArabicMatches(text, query, { ignoreDiacritics });
  }
}

/**
 * Recherche floue pour l'arabe - calcule la similarité entre deux chaînes
 */
export function fuzzyArabicSearch(
  text: string,
  query: string,
  options: {
    ignoreDiacritics?: boolean;
    threshold?: number;
  } = {}
): boolean {
  const { ignoreDiacritics = true, threshold = 0.8 } = options;
  
  if (!text || !query) return false;
  
  // Normaliser les textes
  const normalizedText = normalizeArabicText(text, {
    removeDiacritics: ignoreDiacritics,
    normalizeChars: true
  });
  
  const normalizedQuery = normalizeArabicText(query, {
    removeDiacritics: ignoreDiacritics,
    normalizeChars: true
  });
  
  // Diviser en mots et chercher la meilleure correspondance
  const textWords = normalizedText.split(/\s+/);
  const queryWords = normalizedQuery.split(/\s+/);
  
  for (const queryWord of queryWords) {
    for (const textWord of textWords) {
      const similarity = calculateLevenshteinSimilarity(queryWord, textWord);
      if (similarity >= threshold) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Calcule la similarité entre deux chaînes en utilisant la distance de Levenshtein
 */
function calculateLevenshteinSimilarity(str1: string, str2: string): number {
  if (str1.length === 0) return str2.length === 0 ? 1 : 0;
  if (str2.length === 0) return 0;
  
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,     // deletion
        matrix[j - 1][i] + 1,     // insertion
        matrix[j - 1][i - 1] + indicator   // substitution
      );
    }
  }
  
  const maxLength = Math.max(str1.length, str2.length);
  return (maxLength - matrix[str2.length][str1.length]) / maxLength;
}

/**
 * Recherche par racine de mot arabe (version simplifiée)
 */
export function searchByArabicRoot(
  text: string,
  root: string,
  options: {
    ignoreDiacritics?: boolean;
  } = {}
): boolean {
  const { ignoreDiacritics = true } = options;
  
  if (!text || !root || root.length < 2) return false;
  
  // Normaliser les textes
  const normalizedText = normalizeArabicText(text, {
    removeDiacritics: ignoreDiacritics,
    normalizeChars: true
  });
  
  const normalizedRoot = normalizeArabicText(root, {
    removeDiacritics: ignoreDiacritics,
    normalizeChars: true
  });
  
  // Extraire les lettres de la racine
  const rootLetters = normalizedRoot.split('').filter(char => /[\u0600-\u06FF]/.test(char));
  
  if (rootLetters.length < 2) return false;
  
  // Diviser le texte en mots
  const words = normalizedText.split(/\s+/);
  
  // Chercher des mots qui contiennent toutes les lettres de la racine dans l'ordre
  for (const word of words) {
    if (containsRootPattern(word, rootLetters)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Vérifie si un mot contient un motif de racine
 */
function containsRootPattern(word: string, rootLetters: string[]): boolean {
  if (word.length < rootLetters.length) return false;
  
  let rootIndex = 0;
  
  for (let i = 0; i < word.length && rootIndex < rootLetters.length; i++) {
    if (word[i] === rootLetters[rootIndex]) {
      rootIndex++;
    }
  }
  
  return rootIndex === rootLetters.length;
}

/**
 * Recherche avancée combinant plusieurs techniques
 */
export function advancedArabicSearch(
  text: string,
  query: string,
  options: {
    searchMode?: 'exact' | 'words' | 'partial' | 'fuzzy' | 'root' | 'flexible';
    ignoreDiacritics?: boolean;
    fuzzyThreshold?: number;
    caseSensitive?: boolean;
  } = {}
): boolean {
  const {
    searchMode = 'flexible',
    ignoreDiacritics = true,
    fuzzyThreshold = 0.8,
    caseSensitive = false
  } = options;
  
  if (!text || !query) return false;
  
  // Si ce n'est pas de l'arabe, utiliser une recherche standard
  if (!containsArabic(text) && !containsArabic(query)) {
    const processedText = caseSensitive ? text : text.toLowerCase();
    const processedQuery = caseSensitive ? query : query.toLowerCase();
    
    switch (searchMode) {
      case 'exact':
        return processedText === processedQuery;
      case 'words':
        const words = processedQuery.split(/\s+/);
        return words.some(word => processedText.includes(word));
      case 'fuzzy':
        return calculateLevenshteinSimilarity(processedText, processedQuery) >= fuzzyThreshold;
      default:
        return processedText.includes(processedQuery);
    }
  }
  
  // Recherche arabe selon le mode
  switch (searchMode) {
    case 'exact':
      return performArabicSearch(text, query, 'exact', { ignoreDiacritics });
    
    case 'words':
      return performArabicSearch(text, query, 'words', { ignoreDiacritics });
    
    case 'partial':
      return performArabicSearch(text, query, 'partial', { ignoreDiacritics });
    
    case 'fuzzy':
      return fuzzyArabicSearch(text, query, { ignoreDiacritics, threshold: fuzzyThreshold });
    
    case 'root':
      return searchByArabicRoot(text, query, { ignoreDiacritics });
    
    case 'flexible':
    default:
      return performArabicSearch(text, query, 'flexible', { ignoreDiacritics, fuzzyThreshold });
  }
}