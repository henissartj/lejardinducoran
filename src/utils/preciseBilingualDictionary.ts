/**
 * Dictionnaire de correspondances exactes français-arabe pour le surlignage précis
 * Chaque entrée garantit une traduction correcte et vérifiée
 */

export interface PreciseTranslation {
  french: string;
  arabic: string;
  variations?: {
    french?: string[];
    arabic?: string[];
  };
  context?: string; // Contexte coranique spécifique
}

// Dictionnaire de correspondances exactes et vérifiées
export const PRECISE_BILINGUAL_DICTIONARY: PreciseTranslation[] = [
  // === NOMS DIVINS ===
  {
    french: "Allah",
    arabic: "الله",
    variations: {
      french: ["allah", "Dieu"],
      arabic: ["اللَّه", "اللَّهِ", "اللَّهُ", "ٱللَّه", "ٱللَّهِ", "ٱللَّهُ"]
    },
    context: "nom_divin"
  },
  {
    french: "Miséricordieux",
    arabic: "الرحمن",
    variations: {
      french: ["miséricordieux", "Tout Miséricordieux", "Clément"],
      arabic: ["الرَّحْمَن", "الرَّحْمَنِ", "رحمن", "ٱلرَّحْمَٰن", "ٱلرَّحْمَٰنِ"]
    },
    context: "nom_divin"
  },
  {
    french: "Très Miséricordieux",
    arabic: "الرحيم",
    variations: {
      french: ["très miséricordieux", "Miséricordieux", "Compatissant"],
      arabic: ["الرَّحِيم", "الرَّحِيمِ", "رحيم", "ٱلرَّحِيم", "ٱلرَّحِيمِ"]
    },
    context: "nom_divin"
  },
  {
    french: "Seigneur",
    arabic: "رب",
    variations: {
      french: ["seigneur", "Maître", "Éducateur"],
      arabic: ["ربّ", "الرب", "ربك", "ربنا", "ربهم", "ربي", "ربكم", "ٱلرَّبّ", "رَبّ"]
    },
    context: "nom_divin"
  },

  // === HUMANITÉ ET SOCIÉTÉ ===
  {
    french: "gens",
    arabic: "الناس",
    variations: {
      french: ["Gens", "hommes", "humanité", "personnes", "peuple"],
      arabic: ["ناس", "النَّاس", "ٱلنَّاس", "ٱلنَّاسُ", "ٱلنَّاسِ", "النَّاسُ", "النَّاسِ"]
    },
    context: "humanite"
  },
  {
    french: "homme",
    arabic: "الإنسان",
    variations: {
      french: ["Homme", "être humain", "humain"],
      arabic: ["إنسان", "الإِنسَان", "ٱلْإِنسَٰن", "إِنسَان"]
    },
    context: "humanite"
  },
  {
    french: "femmes",
    arabic: "النساء",
    variations: {
      french: ["femme", "épouses"],
      arabic: ["نساء", "النِّسَاء", "ٱلنِّسَآء"]
    },
    context: "humanite"
  },

  // === CONCEPTS RELIGIEUX ===
  {
    french: "croyants",
    arabic: "المؤمنون",
    variations: {
      french: ["croyant", "fidèles", "fidèle"],
      arabic: ["مؤمنون", "مؤمنين", "المؤمنين", "مؤمن", "مؤمنة", "ٱلْمُؤْمِنُون", "ٱلْمُؤْمِنِين"]
    },
    context: "religion"
  },
  {
    french: "mécréants",
    arabic: "الكافرون",
    variations: {
      french: ["mécréant", "incroyants", "négateurs"],
      arabic: ["كافرون", "كافر", "الكافرين", "ٱلْكَٰفِرُون", "ٱلْكَٰفِرِين"]
    },
    context: "religion"
  },
  {
    french: "prière",
    arabic: "الصلاة",
    variations: {
      french: ["prières", "office"],
      arabic: ["صلاة", "صلوات", "الصلوات", "ٱلصَّلَوٰة", "صَلَوٰة"]
    },
    context: "culte"
  },
  {
    french: "aumône",
    arabic: "الزكاة",
    variations: {
      french: ["zakât", "zakat", "aumône légale"],
      arabic: ["زكاة", "الزَّكَاة", "ٱلزَّكَوٰة", "زَكَوٰة"]
    },
    context: "culte"
  },
  {
    french: "jeûne",
    arabic: "الصيام",
    variations: {
      french: ["jeûner", "ramadan"],
      arabic: ["صيام", "صوم", "الصوم", "ٱلصِّيَام"]
    },
    context: "culte"
  },
  {
    french: "pèlerinage",
    arabic: "الحج",
    variations: {
      french: ["hajj", "hadj"],
      arabic: ["حج", "الحَجّ", "ٱلْحَجّ"]
    },
    context: "culte"
  },

  // === SCRIPTURE ===
  {
    french: "Coran",
    arabic: "القرآن",
    variations: {
      french: ["coran", "Lecture", "Récitation"],
      arabic: ["قرآن", "قُرْآن", "ٱلْقُرْءَان"]
    },
    context: "scripture"
  },
  {
    french: "verset",
    arabic: "آية",
    variations: {
      french: ["versets", "signe", "signes"],
      arabic: ["الآية", "آيات", "الآيات", "ءَايَة", "ءَايَٰت", "ٱلْءَايَٰت"]
    },
    context: "scripture"
  },
  {
    french: "sourate",
    arabic: "سورة",
    variations: {
      french: ["sourates", "chapitre"],
      arabic: ["السورة", "سُورَة", "سُوَر"]
    },
    context: "scripture"
  },
  {
    french: "Livre",
    arabic: "الكتاب",
    variations: {
      french: ["livre", "Écriture", "écrit"],
      arabic: ["كتاب", "الكِتَاب", "ٱلْكِتَٰب"]
    },
    context: "scripture"
  },

  // === PROPHÈTES ===
  {
    french: "Messager",
    arabic: "الرسول",
    variations: {
      french: ["messager", "envoyé", "apôtre"],
      arabic: ["رسول", "الرَّسُول", "ٱلرَّسُول"]
    },
    context: "prophete"
  },
  {
    french: "Prophète",
    arabic: "النبي",
    variations: {
      french: ["prophète", "prophètes"],
      arabic: ["نبي", "النَّبِيّ", "ٱلنَّبِيّ", "أنبياء", "الأنبياء"]
    },
    context: "prophete"
  },
  {
    french: "Moïse",
    arabic: "موسى",
    variations: {
      french: ["moïse", "Musa"],
      arabic: ["مُوسَىٰ"]
    },
    context: "prophete"
  },
  {
    french: "Jésus",
    arabic: "عيسى",
    variations: {
      french: ["jésus", "Issa"],
      arabic: ["عِيسَى", "ٱلْمَسِيح"]
    },
    context: "prophete"
  },
  {
    french: "Abraham",
    arabic: "إبراهيم",
    variations: {
      french: ["abraham", "Ibrahim"],
      arabic: ["إِبْرَٰهِيم", "إِبْرَٰهَام"]
    },
    context: "prophete"
  },

  // === ESCHATOLOGIE ===
  {
    french: "Paradis",
    arabic: "الجنة",
    variations: {
      french: ["paradis", "Jardin", "jardins"],
      arabic: ["جنة", "جنات", "الجنات", "ٱلْجَنَّة", "جَنَّٰت"]
    },
    context: "eschatologie"
  },
  {
    french: "Feu",
    arabic: "النار",
    variations: {
      french: ["feu", "Enfer", "Géhenne"],
      arabic: ["نار", "نَار", "ٱلنَّار"]
    },
    context: "eschatologie"
  },
  {
    french: "Jour",
    arabic: "يوم",
    variations: {
      french: ["jour", "journée"],
      arabic: ["اليوم", "يَوْم", "ٱلْيَوْم"]
    },
    context: "temps"
  },
  {
    french: "Résurrection",
    arabic: "القيامة",
    variations: {
      french: ["résurrection", "relèvement"],
      arabic: ["قيامة", "القِيَامَة", "ٱلْقِيَٰمَة"]
    },
    context: "eschatologie"
  },

  // === CONCEPTS MORAUX ===
  {
    french: "bien",
    arabic: "خير",
    variations: {
      french: ["Bien", "bonté", "bienfait"],
      arabic: ["الخير", "خَيْر", "ٱلْخَيْر"]
    },
    context: "moral"
  },
  {
    french: "mal",
    arabic: "شر",
    variations: {
      french: ["Mal", "méchanceté", "malheur"],
      arabic: ["الشر", "شَرّ", "ٱلشَّرّ"]
    },
    context: "moral"
  },
  {
    french: "vérité",
    arabic: "الحق",
    variations: {
      french: ["Vérité", "droit", "justice"],
      arabic: ["حق", "حَقّ", "ٱلْحَقّ"]
    },
    context: "moral"
  },
  {
    french: "mensonge",
    arabic: "الباطل",
    variations: {
      french: ["faux", "vanité", "futilité"],
      arabic: ["باطل", "البَاطِل", "ٱلْبَٰطِل"]
    },
    context: "moral"
  },
  {
    french: "patience",
    arabic: "صبر",
    variations: {
      french: ["Patience", "endurance", "persévérance"],
      arabic: ["الصبر", "صَبْر", "ٱلصَّبْر"]
    },
    context: "vertu"
  },
  {
    french: "justice",
    arabic: "العدل",
    variations: {
      french: ["Justice", "équité"],
      arabic: ["عدل", "العَدْل", "ٱلْعَدْل"]
    },
    context: "vertu"
  },

  // === COSMOS ===
  {
    french: "cieux",
    arabic: "السماوات",
    variations: {
      french: ["ciel", "firmament"],
      arabic: ["سماء", "السماء", "سماوات", "ٱلسَّمَٰوَٰت", "سَمَٰوَٰت"]
    },
    context: "cosmos"
  },
  {
    french: "terre",
    arabic: "الأرض",
    variations: {
      french: ["Terre", "sol"],
      arabic: ["أرض", "أَرْض", "ٱلْأَرْض"]
    },
    context: "cosmos"
  },
  {
    french: "eau",
    arabic: "الماء",
    variations: {
      french: ["Eau", "eaux"],
      arabic: ["ماء", "المَاء", "ٱلْمَآء"]
    },
    context: "cosmos"
  },
  {
    french: "soleil",
    arabic: "الشمس",
    variations: {
      french: ["Soleil"],
      arabic: ["شمس", "الشَّمْس", "ٱلشَّمْس"]
    },
    context: "cosmos"
  },
  {
    french: "lune",
    arabic: "القمر",
    variations: {
      french: ["Lune"],
      arabic: ["قمر", "القَمَر", "ٱلْقَمَر"]
    },
    context: "cosmos"
  },

  // === ACTIONS SPIRITUELLES ===
  {
    french: "adorer",
    arabic: "عبد",
    variations: {
      french: ["adorent", "adore", "culte"],
      arabic: ["يعبد", "اعبد", "عبادة", "العبادة", "ٱعْبُد", "يَعْبُد"]
    },
    context: "culte"
  },
  {
    french: "invoquer",
    arabic: "دعا",
    variations: {
      french: ["invoque", "invoquent", "appeler"],
      arabic: ["يدعو", "ادع", "دعوة", "ٱدْع", "يَدْعُو"]
    },
    context: "culte"
  },
  {
    french: "remercier",
    arabic: "شكر",
    variations: {
      french: ["remercie", "reconnaissance", "gratitude"],
      arabic: ["يشكر", "اشكر", "شُكْر", "ٱشْكُر"]
    },
    context: "culte"
  },

  // === FAMILLE ===
  {
    french: "parents",
    arabic: "الوالدين",
    variations: {
      french: ["parent", "père", "mère"],
      arabic: ["والد", "الوالد", "والدين", "ٱلْوَٰلِدَيْن"]
    },
    context: "famille"
  },
  {
    french: "enfants",
    arabic: "الأولاد",
    variations: {
      french: ["enfant", "fils", "descendants"],
      arabic: ["ولد", "أولاد", "الولد", "ٱلْأَوْلَٰد"]
    },
    context: "famille"
  },

  // === TERMES CORANIQUES SPÉCIFIQUES ===
  {
    french: "révélé",
    arabic: "أنزل",
    variations: {
      french: ["révèle", "révélation", "fait descendre"],
      arabic: ["نزل", "أنزلنا", "المنزل", "أَنزَل", "نَزَّل"]
    },
    context: "revelation"
  },
  {
    french: "guidée",
    arabic: "هدى",
    variations: {
      french: ["guide", "guidance", "dirigé"],
      arabic: ["الهدى", "يهدي", "اهتدى", "هُدًى", "يَهْدِي"]
    },
    context: "guidance"
  },
  {
    french: "égaré",
    arabic: "ضل",
    variations: {
      french: ["égarés", "égarement", "perdus"],
      arabic: ["ضلال", "الضلال", "يضل", "ضَلَّ", "ضَلَٰل"]
    },
    context: "guidance"
  },
  {
    french: "pardonner",
    arabic: "غفر",
    variations: {
      french: ["pardonne", "pardon", "absoudre"],
      arabic: ["يغفر", "اغفر", "غفور", "مغفرة", "غَفَر", "يَغْفِر"]
    },
    context: "misericorde"
  },

  // === TEMPS ET ESPACE ===
  {
    french: "monde",
    arabic: "العالمين",
    variations: {
      french: ["mondes", "univers", "créatures"],
      arabic: ["عالمين", "العَالَمِين", "ٱلْعَٰلَمِين"]
    },
    context: "cosmos"
  },
  {
    french: "vie",
    arabic: "الحياة",
    variations: {
      french: ["Vie", "existence"],
      arabic: ["حياة", "الحَيَاة", "ٱلْحَيَوٰة"]
    },
    context: "existence"
  },
  {
    french: "mort",
    arabic: "الموت",
    variations: {
      french: ["Mort", "décès", "trépas"],
      arabic: ["موت", "المَوْت", "ٱلْمَوْت"]
    },
    context: "existence"
  },

  // === ÉMOTIONS ET ÉTATS ===
  {
    french: "crainte",
    arabic: "الخوف",
    variations: {
      french: ["peur", "craindre", "redouter"],
      arabic: ["خوف", "يخاف", "الخَوْف", "خَاف"]
    },
    context: "emotion"
  },
  {
    french: "espoir",
    arabic: "الرجاء",
    variations: {
      french: ["espérer", "espérance"],
      arabic: ["رجاء", "يرجو", "الرَّجَاء", "رَجَا"]
    },
    context: "emotion"
  },
  {
    french: "amour",
    arabic: "الحب",
    variations: {
      french: ["aimer", "affection"],
      arabic: ["حب", "يحب", "الحُبّ", "أَحَبّ"]
    },
    context: "emotion"
  }
];

/**
 * Normalise un terme pour la comparaison précise
 */
function normalizeForComparison(term: string, isArabic: boolean): string {
  if (isArabic) {
    // Pour l'arabe : supprimer diacritiques et normaliser
    return term
      .replace(/[\u064B-\u065F\u0670\u0651]/g, '') // Supprimer diacritiques
      .replace(/[آأإٱ]/g, 'ا') // Normaliser alif
      .replace(/ى/g, 'ي') // Normaliser ya
      .replace(/ة/g, 'ه') // Normaliser ta marbouta
      .trim();
  } else {
    // Pour le français : minuscules et trim
    return term.toLowerCase().trim();
  }
}

/**
 * Trouve la traduction exacte d'un terme
 */
export function findExactTranslation(
  searchTerm: string, 
  targetLanguage: 'french' | 'arabic'
): string | null {
  const isSearchArabic = /[\u0600-\u06FF]/.test(searchTerm);
  const normalizedSearch = normalizeForComparison(searchTerm, isSearchArabic);

  for (const entry of PRECISE_BILINGUAL_DICTIONARY) {
    // Déterminer les termes source et cible
    const sourceTerms = targetLanguage === 'french' 
      ? [entry.arabic, ...(entry.variations?.arabic || [])]
      : [entry.french, ...(entry.variations?.french || [])];
    
    const targetTerm = targetLanguage === 'french' ? entry.french : entry.arabic;

    // Vérifier correspondance exacte
    for (const sourceTerm of sourceTerms) {
      const normalizedSource = normalizeForComparison(sourceTerm, !isSearchArabic);
      
      if (normalizedSource === normalizedSearch) {
        return targetTerm;
      }
    }
  }

  return null;
}

/**
 * Vérifie si deux termes sont des traductions exactes l'un de l'autre
 */
export function areExactTranslations(term1: string, term2: string): boolean {
  const isFirstArabic = /[\u0600-\u06FF]/.test(term1);
  const isSecondArabic = /[\u0600-\u06FF]/.test(term2);

  // Les deux termes doivent être dans des langues différentes
  if (isFirstArabic === isSecondArabic) return false;

  const arabicTerm = isFirstArabic ? term1 : term2;
  const frenchTerm = isFirstArabic ? term2 : term1;

  const normalizedArabic = normalizeForComparison(arabicTerm, true);
  const normalizedFrench = normalizeForComparison(frenchTerm, false);

  for (const entry of PRECISE_BILINGUAL_DICTIONARY) {
    // Vérifier si les termes correspondent à une entrée
    const arabicTerms = [entry.arabic, ...(entry.variations?.arabic || [])];
    const frenchTerms = [entry.french, ...(entry.variations?.french || [])];

    const arabicMatch = arabicTerms.some(term => 
      normalizeForComparison(term, true) === normalizedArabic
    );
    
    const frenchMatch = frenchTerms.some(term => 
      normalizeForComparison(term, false) === normalizedFrench
    );

    if (arabicMatch && frenchMatch) {
      return true;
    }
  }

  return false;
}

/**
 * Obtient toutes les variations d'un terme
 */
export function getTermVariations(term: string): string[] {
  const isArabic = /[\u0600-\u06FF]/.test(term);
  const normalizedTerm = normalizeForComparison(term, isArabic);

  for (const entry of PRECISE_BILINGUAL_DICTIONARY) {
    const terms = isArabic 
      ? [entry.arabic, ...(entry.variations?.arabic || [])]
      : [entry.french, ...(entry.variations?.french || [])];

    const isMatch = terms.some(t => 
      normalizeForComparison(t, isArabic) === normalizedTerm
    );

    if (isMatch) {
      return terms;
    }
  }

  return [term];
}