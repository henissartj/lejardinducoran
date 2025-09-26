import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, BookOpen, ArrowLeft, ArrowRight, Volume2, Star, Info } from 'lucide-react';

interface DictionaryProps {
  isOpen: boolean;
  onClose: () => void;
  initialWord?: string;
  language: string;
}

interface DictionaryEntry {
  word: string;
  definition: string;
  pronunciation?: string;
  etymology?: string;
  examples?: string[];
  relatedWords?: string[];
  category?: string;
}

// Base de données de mots arabes simplifiée pour la démonstration
const ARABIC_DICTIONARY: Record<string, DictionaryEntry> = {
  'الله': {
    word: 'الله',
    definition: 'Allah, Dieu unique dans l\'Islam. Le nom propre de Dieu en arabe.',
    pronunciation: 'Allah',
    etymology: 'Du sémitique commun *ʾil-āh-',
    examples: [
      'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ - Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux',
      'لَا إِلَهَ إِلَّا اللَّهُ - Il n\'y a de divinité qu\'Allah'
    ],
    relatedWords: ['إله', 'رب', 'الرحمن'],
    category: 'Théologie'
  },
  'الرحمن': {
    word: 'الرحمن',
    definition: 'Le Tout Miséricordieux, l\'un des 99 noms d\'Allah. Exprime la miséricorde universelle de Dieu.',
    pronunciation: 'Ar-Rahman',
    etymology: 'De la racine ر-ح-م (miséricorde)',
    examples: [
      'الرَّحْمَنُ عَلَى الْعَرْشِ اسْتَوَى - Le Tout Miséricordieux S\'est établi sur le Trône',
      'قُلِ ادْعُوا اللَّهَ أَوِ ادْعُوا الرَّحْمَنَ - Dis: "Invoquez Allah, ou invoquez le Tout Miséricordieux"'
    ],
    relatedWords: ['الرحيم', 'رحمة', 'الله'],
    category: 'Noms divins'
  },
  'الرحيم': {
    word: 'الرحيم',
    definition: 'Le Très Miséricordieux, l\'un des 99 noms d\'Allah. Exprime la miséricorde particulière envers les croyants.',
    pronunciation: 'Ar-Rahim',
    etymology: 'De la racine ر-ح-م (miséricorde)',
    examples: [
      'إِنَّ اللَّهَ غَفُورٌ رَحِيمٌ - Certes, Allah est Pardonneur et Miséricordieux',
      'وَاللَّهُ رَءُوفٌ بِالْعِبَادِ رَحِيمٌ - Et Allah est Compatissant envers Ses serviteurs, Miséricordieux'
    ],
    relatedWords: ['الرحمن', 'رحمة', 'غفور'],
    category: 'Noms divins'
  },
  'رب': {
    word: 'رب',
    definition: 'Seigneur, Maître, Éducateur. Désigne Allah comme le Créateur, le Pourvoyeur et l\'Éducateur de toute la création.',
    pronunciation: 'Rabb',
    etymology: 'De la racine ر-ب-ب (élever, éduquer, être maître)',
    examples: [
      'رَبِّ اشْرَحْ لِي صَدْرِي - Mon Seigneur, dilate-moi la poitrine',
      'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ - Louange à Allah, Seigneur des mondes'
    ],
    relatedWords: ['الله', 'مالك', 'خالق'],
    category: 'Noms divins'
  },
  'إله': {
    word: 'إله',
    definition: 'Divinité, dieu. Dans le contexte islamique, désigne ce qui est adoré, qu\'il soit vrai (Allah) ou faux.',
    pronunciation: 'Ilah',
    etymology: 'De la racine أ-ل-ه (adorer)',
    examples: [
      'لَا إِلَهَ إِلَّا اللَّهُ - Il n\'y a de divinité qu\'Allah',
      'أَفَرَأَيْتَ مَنِ اتَّخَذَ إِلَهَهُ هَوَاهُ - As-tu vu celui qui a pris sa passion pour divinité ?'
    ],
    relatedWords: ['الله', 'معبود', 'آلهة'],
    category: 'Théologie'
  },
  'بسم': {
    word: 'بسم',
    definition: 'Au nom de, avec le nom de. Formule d\'invocation pour demander la bénédiction divine.',
    pronunciation: 'Bismi',
    etymology: 'Préposition ب + اسم (nom)',
    examples: [
      'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ - Au nom d\'Allah, le Tout Miséricordieux, le Très Miséricordieux',
      'بِسْمِ اللَّهِ مَجْرَاهَا وَمُرْسَاهَا - Au nom d\'Allah sera sa course et son mouillage'
    ],
    relatedWords: ['اسم', 'الله', 'باسم'],
    category: 'Invocation'
  },
  'اسم': {
    word: 'اسم',
    definition: 'Nom, appellation. Dans le contexte coranique, souvent lié aux noms et attributs divins.',
    pronunciation: 'Ism',
    etymology: 'De la racine س-م-و (élever, nommer)',
    examples: [
      'وَلِلَّهِ الْأَسْمَاءُ الْحُسْنَى - Et c\'est à Allah qu\'appartiennent les plus beaux noms',
      'سَبِّحِ اسْمَ رَبِّكَ الْأَعْلَى - Glorifie le nom de ton Seigneur, le Très-Haut'
    ],
    relatedWords: ['أسماء', 'بسم', 'تسمية'],
    category: 'Linguistique'
  },
  'الناس': {
    word: 'الناس',
    definition: 'Les gens, les hommes, l\'humanité. Désigne l\'ensemble des êtres humains.',
    pronunciation: 'An-Nas',
    etymology: 'De la racine أ-ن-س (être familier, sociable)',
    examples: [
      'يَا أَيُّهَا النَّاسُ اعْبُدُوا رَبَّكُمْ - Ô gens ! Adorez votre Seigneur',
      'وَمِنَ النَّاسِ مَنْ يَقُولُ آمَنَّا بِاللَّهِ - Et parmi les gens, il y en a qui disent : "Nous croyons en Allah"'
    ],
    relatedWords: ['إنسان', 'بشر', 'آدم'],
    category: 'Humanité'
  },
  'يا': {
    word: 'يا',
    definition: 'Ô ! Particule d\'appel et d\'interpellation utilisée pour attirer l\'attention.',
    pronunciation: 'Ya',
    etymology: 'Particule d\'appel en arabe',
    examples: [
      'يَا أَيُّهَا النَّاسُ - Ô gens !',
      'يَا رَبِّ - Ô mon Seigneur !'
    ],
    relatedWords: ['أي', 'نداء'],
    category: 'Grammaire'
  },
  'أيها': {
    word: 'أيها',
    definition: 'Particule d\'interpellation renforcée, utilisée avec "يا" pour s\'adresser solennellement.',
    pronunciation: 'Ayyuha',
    etymology: 'أي (lequel) + ها (particule d\'attention)',
    examples: [
      'يَا أَيُّهَا الَّذِينَ آمَنُوا - Ô vous qui avez cru !',
      'يَا أَيُّهَا النَّاسُ - Ô gens !'
    ],
    relatedWords: ['يا', 'أي', 'نداء'],
    category: 'Grammaire'
  },
  'الذين': {
    word: 'الذين',
    definition: 'Ceux qui, lesquels. Pronom relatif masculin pluriel.',
    pronunciation: 'Alladhina',
    etymology: 'Pronom relatif défini',
    examples: [
      'الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ - Ceux qui ont cru et fait de bonnes œuvres',
      'وَالَّذِينَ كَفَرُوا - Et ceux qui ont mécru'
    ],
    relatedWords: ['التي', 'اللذان', 'اللواتي'],
    category: 'Grammaire'
  },
  'آمنوا': {
    word: 'آمنوا',
    definition: 'Ils ont cru, ils ont eu foi. Verbe à la forme accomplie, 3ème personne du masculin pluriel.',
    pronunciation: 'Amanu',
    etymology: 'De la racine أ-م-ن (être en sécurité, croire)',
    examples: [
      'الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ - Ceux qui ont cru et fait de bonnes œuvres',
      'وَالَّذِينَ آمَنُوا بِاللَّهِ وَرُسُلِهِ - Et ceux qui ont cru en Allah et en Ses messagers'
    ],
    relatedWords: ['إيمان', 'مؤمن', 'أمان'],
    category: 'Foi'
  },
  'إيمان': {
    word: 'إيمان',
    definition: 'Foi, croyance. Conviction profonde en Allah, Ses anges, Ses livres, Ses messagers, le Jour dernier et le destin.',
    pronunciation: 'Iman',
    etymology: 'De la racine أ-م-ن (être en sécurité, croire)',
    examples: [
      'وَلَكِنَّ اللَّهَ حَبَّبَ إِلَيْكُمُ الْإِيمَانَ - Mais Allah vous a fait aimer la foi',
      'فَزَادَهُمْ إِيمَانًا - Cela accrut leur foi'
    ],
    relatedWords: ['آمنوا', 'مؤمن', 'يقين'],
    category: 'Foi'
  },
  'مؤمن': {
    word: 'مؤمن',
    definition: 'Croyant, fidèle. Celui qui a la foi en Allah et suit Ses commandements.',
    pronunciation: 'Mu\'min',
    etymology: 'Participe actif de la racine أ-م-ن',
    examples: [
      'وَمَا كَانَ لِمُؤْمِنٍ وَلَا مُؤْمِنَةٍ - Il n\'appartient pas à un croyant ou à une croyante',
      'إِنَّمَا الْمُؤْمِنُونَ إِخْوَةٌ - Les croyants ne sont que des frères'
    ],
    relatedWords: ['إيمان', 'آمنوا', 'مؤمنة'],
    category: 'Foi'
  },
  'صلاة': {
    word: 'صلاة',
    definition: 'Prière rituelle en Islam, l\'un des cinq piliers de l\'Islam.',
    pronunciation: 'Salah',
    etymology: 'De la racine ص-ل-و (prier, bénir)',
    examples: [
      'وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ - Et accomplissez la prière et acquittez-vous de la Zakât',
      'إِنَّ الصَّلَاةَ تَنْهَى عَنِ الْفَحْشَاءِ وَالْمُنْكَرِ - Certes, la prière préserve de la turpitude et du blâmable'
    ],
    relatedWords: ['مصلى', 'صلى', 'دعاء'],
    category: 'Culte'
  },
  'صلى': {
    word: 'صلى',
    definition: 'Il a prié, il a accompli la prière. Verbe signifiant accomplir la prière rituelle.',
    pronunciation: 'Salla',
    etymology: 'De la racine ص-ل-و (prier, bénir)',
    examples: [
      'وَصَلَّى عَلَيْهِمْ - Et prie pour eux',
      'صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ - Qu\'Allah prie sur lui et le salue'
    ],
    relatedWords: ['صلاة', 'مصلى', 'يصلي'],
    category: 'Culte'
  },
  'أقيموا': {
    word: 'أقيموا',
    definition: 'Accomplissez, établissez. Impératif pluriel signifiant accomplir correctement et régulièrement.',
    pronunciation: 'Aqimu',
    etymology: 'De la racine ق-و-م (se tenir debout, établir)',
    examples: [
      'وَأَقِيمُوا الصَّلَاةَ - Et accomplissez la prière',
      'أَقِيمُوا الدِّينَ - Établissez la religion'
    ],
    relatedWords: ['قام', 'إقامة', 'قيام'],
    category: 'Action'
  },
  'قرآن': {
    word: 'قرآن',
    definition: 'Le Coran, livre saint de l\'Islam, révélé au prophète Muhammad.',
    pronunciation: 'Qur\'an',
    etymology: 'De la racine ق-ر-أ (lire, réciter)',
    examples: [
      'إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ - En vérité c\'est Nous qui avons fait descendre le Coran, et c\'est Nous qui en sommes gardien',
      'وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ - Et Nous avons rendu le Coran facile pour la méditation'
    ],
    relatedWords: ['كتاب', 'آية', 'سورة'],
    category: 'Révélation'
  },
  'آتوا': {
    word: 'آتوا',
    definition: 'Donnez, apportez. Impératif pluriel signifiant donner ou apporter quelque chose.',
    pronunciation: 'Atu',
    etymology: 'De la racine أ-ت-ي (venir, apporter)',
    examples: [
      'وَآتُوا الزَّكَاةَ - Et acquittez-vous de la Zakât',
      'آتُوا الْيَتَامَى أَمْوَالَهُمْ - Donnez aux orphelins leurs biens'
    ],
    relatedWords: ['أتى', 'إيتاء', 'يؤتي'],
    category: 'Action'
  },
  'كتاب': {
    word: 'كتاب',
    definition: 'Livre, écrit, écriture. Dans le contexte coranique, désigne souvent les Écritures révélées.',
    pronunciation: 'Kitab',
    etymology: 'De la racine ك-ت-ب (écrire)',
    examples: [
      'ذَلِكَ الْكِتَابُ لَا رَيْبَ فِيهِ - Ce Livre, nul doute là-dessus',
      'يَا أَهْلَ الْكِتَابِ - Ô gens du Livre'
    ],
    relatedWords: ['كتب', 'مكتوب', 'كاتب'],
    category: 'Révélation'
  },
  'قرأ': {
    word: 'قرأ',
    definition: 'Il a lu, il a récité. Verbe signifiant lire ou réciter un texte.',
    pronunciation: 'Qara\'a',
    etymology: 'De la racine ق-ر-أ (lire, réciter)',
    examples: [
      'اقْرَأْ بِاسْمِ رَبِّكَ - Lis au nom de ton Seigneur',
      'فَإِذَا قَرَأْنَاهُ فَاتَّبِعْ قُرْآنَهُ - Quand Nous le récitons, suis sa récitation'
    ],
    relatedWords: ['قرآن', 'قراءة', 'قارئ'],
    category: 'Action'
  },
  'اقرأ': {
    word: 'اقرأ',
    definition: 'Lis ! Récite ! Premier mot révélé du Coran, impératif du verbe lire.',
    pronunciation: 'Iqra\'',
    etymology: 'Impératif de la racine ق-ر-أ',
    examples: [
      'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ - Lis au nom de ton Seigneur qui a créé',
      'اقْرَأْ وَرَبُّكَ الْأَكْرَمُ - Lis, et ton Seigneur est le Très Généreux'
    ],
    relatedWords: ['قرأ', 'قرآن', 'قراءة'],
    category: 'Révélation'
  },
  'آية': {
    word: 'آية',
    definition: 'Verset, signe, miracle. Unité du Coran, mais aussi signe de la puissance divine.',
    pronunciation: 'Ayah',
    etymology: 'De la racine أ-ي-ي (signe, miracle)',
    examples: [
      'تِلْكَ آيَاتُ اللَّهِ - Tels sont les versets d\'Allah',
      'وَفِي أَنْفُسِكُمْ أَفَلَا تُبْصِرُونَ - Et en vous-mêmes. N\'observez-vous donc pas ?'
    ],
    relatedWords: ['آيات', 'بينة', 'علامة'],
    category: 'Révélation'
  },
  'آيات': {
    word: 'آيات',
    definition: 'Versets, signes, miracles. Pluriel d\'آية, désigne les versets du Coran ou les signes divins.',
    pronunciation: 'Ayat',
    etymology: 'Pluriel de آية',
    examples: [
      'تِلْكَ آيَاتُ الْكِتَابِ الْحَكِيمِ - Tels sont les versets du Livre sage',
      'وَآيَاتُهُ الَّيْلُ وَالنَّهَارُ - Et parmi Ses signes sont la nuit et le jour'
    ],
    relatedWords: ['آية', 'علامات', 'بينات'],
    category: 'Révélation'
  },
  'سورة': {
    word: 'سورة',
    definition: 'Sourate, chapitre du Coran. Division principale du texte coranique.',
    pronunciation: 'Surah',
    etymology: 'De la racine س-و-ر (entourer, élever)',
    examples: [
      'سُورَةٌ أَنْزَلْنَاهَا - Une sourate que Nous avons fait descendre',
      'هَذِهِ سُورَةُ الْبَقَرَةِ - Ceci est la sourate de la Vache'
    ],
    relatedWords: ['سور', 'فصل', 'باب'],
    category: 'Révélation'
  },
  'نزل': {
    word: 'نزل',
    definition: 'Il est descendu, il a été révélé. Verbe utilisé pour la révélation divine.',
    pronunciation: 'Nazala',
    etymology: 'De la racine ن-ز-ل (descendre)',
    examples: [
      'نَزَلَ بِهِ الرُّوحُ الْأَمِينُ - L\'Esprit fidèle est descendu avec cela',
      'وَأَنْزَلْنَا إِلَيْكَ الْكِتَابَ - Et Nous avons fait descendre vers toi le Livre'
    ],
    relatedWords: ['أنزل', 'تنزيل', 'منزل'],
    category: 'Révélation'
  },
  'أنزل': {
    word: 'أنزل',
    definition: 'Il a fait descendre, il a révélé. Forme causative du verbe نزل.',
    pronunciation: 'Anzala',
    etymology: 'Forme IV de la racine ن-ز-ل',
    examples: [
      'وَأَنْزَلْنَا إِلَيْكَ الذِّكْرَ - Et Nous avons fait descendre vers toi le Rappel',
      'أَنْزَلَ اللَّهُ عَلَيْكَ الْكِتَابَ - Allah a fait descendre sur toi le Livre'
    ],
    relatedWords: ['نزل', 'تنزيل', 'منزل'],
    category: 'Révélation'
  },
  'رسول': {
    word: 'رسول',
    definition: 'Messager, envoyé. Prophète chargé de transmettre un message divin à l\'humanité.',
    pronunciation: 'Rasul',
    etymology: 'De la racine ر-س-ل (envoyer)',
    examples: [
      'مُحَمَّدٌ رَسُولُ اللَّهِ - Muhammad est le Messager d\'Allah',
      'وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِلْعَالَمِينَ - Et Nous ne t\'avons envoyé qu\'en miséricorde pour les mondes'
    ],
    relatedWords: ['أرسل', 'رسالة', 'مرسل'],
    category: 'Prophétie'
  },
  'نبي': {
    word: 'نبي',
    definition: 'Prophète. Homme choisi par Allah pour recevoir et transmettre Sa révélation.',
    pronunciation: 'Nabi',
    etymology: 'De la racine ن-ب-أ (informer, annoncer)',
    examples: [
      'مَا كَانَ مُحَمَّدٌ أَبَا أَحَدٍ مِنْ رِجَالِكُمْ وَلَكِنْ رَسُولَ اللَّهِ وَخَاتَمَ النَّبِيِّينَ - Muhammad n\'est le père d\'aucun de vos hommes, mais le messager d\'Allah et le sceau des prophètes',
      'وَإِذْ أَخَذْنَا مِنَ النَّبِيِّينَ مِيثَاقَهُمْ - Et quand Nous prîmes des prophètes leur engagement'
    ],
    relatedWords: ['نبوة', 'أنبياء', 'رسول'],
    category: 'Prophétie'
  },
  'محمد': {
    word: 'محمد',
    definition: 'Muhammad, le loué, le digne de louange. Nom du dernier prophète de l\'Islam.',
    pronunciation: 'Muhammad',
    etymology: 'Participe passif de la racine ح-م-د (louer)',
    examples: [
      'مُحَمَّدٌ رَسُولُ اللَّهِ - Muhammad est le Messager d\'Allah',
      'وَمَا مُحَمَّدٌ إِلَّا رَسُولٌ - Muhammad n\'est qu\'un messager'
    ],
    relatedWords: ['أحمد', 'حمد', 'محمود'],
    category: 'Prophétie'
  },
  'خلق': {
    word: 'خلق',
    definition: 'Il a créé, création. Verbe et nom désignant l\'acte créateur divin.',
    pronunciation: 'Khalaqa / Khalq',
    etymology: 'De la racine ख-ل-ق (créer, façonner)',
    examples: [
      'اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ - Lis au nom de ton Seigneur qui a créé',
      'وَخَلَقَ كُلَّ شَيْءٍ فَقَدَّرَهُ تَقْدِيرًا - Et Il a créé toute chose en lui donnant ses justes proportions'
    ],
    relatedWords: ['خالق', 'خليقة', 'مخلوق'],
    category: 'Création'
  },
  'خالق': {
    word: 'خالق',
    definition: 'Créateur. Celui qui crée, attribut exclusif d\'Allah.',
    pronunciation: 'Khaliq',
    etymology: 'Participe actif de la racine خ-ل-ق',
    examples: [
      'هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ - Il est Allah, le Créateur, Celui qui donne un commencement à toute chose, le Formateur',
      'أَفَمَنْ يَخْلُقُ كَمَنْ لَا يَخْلُقُ - Celui qui crée est-il semblable à celui qui ne crée pas ?'
    ],
    relatedWords: ['خلق', 'بارئ', 'مصور'],
    category: 'Noms divins'
  },
  'عبد': {
    word: 'عبد',
    definition: 'Serviteur, adorateur. Celui qui adore et sert Allah.',
    pronunciation: 'Abd',
    etymology: 'De la racine ع-ب-د (servir, adorer)',
    examples: [
      'وَمَا خَلَقْتُ الْجِنَّ وَالْإِنْسَ إِلَّا لِيَعْبُدُونِ - Je n\'ai créé les djinns et les hommes que pour qu\'ils M\'adorent',
      'سُبْحَانَ الَّذِي أَسْرَى بِعَبْدِهِ - Gloire à Celui qui, de nuit, fit voyager Son serviteur'
    ],
    relatedWords: ['عبادة', 'يعبد', 'معبود'],
    category: 'Culte'
  },
  'عبادة': {
    word: 'عبادة',
    definition: 'Adoration, culte. Acte d\'adoration et de soumission à Allah.',
    pronunciation: 'Ibadah',
    etymology: 'Nom d\'action de la racine ع-ب-د',
    examples: [
      'وَمَا أُمِرُوا إِلَّا لِيَعْبُدُوا اللَّهَ مُخْلِصِينَ لَهُ الدِّينَ - Il ne leur a été commandé, cependant, que d\'adorer Allah, Lui vouant un culte exclusif',
      'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ - C\'est Toi que nous adorons, et c\'est Toi dont nous implorons secours'
    ],
    relatedWords: ['عبد', 'يعبد', 'معبود'],
    category: 'Culte'
  },
  'دين': {
    word: 'دين',
    definition: 'Religion, foi, jugement. Système de croyances et de pratiques spirituelles.',
    pronunciation: 'Din',
    etymology: 'De la racine د-ي-ن (juger, rendre compte)',
    examples: [
      'إِنَّ الدِّينَ عِنْدَ اللَّهِ الْإِسْلَامُ - Certes, la religion acceptée d\'Allah, c\'est l\'Islam',
      'لَكُمْ دِينُكُمْ وَلِيَ دِينِ - À vous votre religion, et à moi ma religion'
    ],
    relatedWords: ['دان', 'يدين', 'مدين'],
    category: 'Religion'
  },
  'إسلام': {
    word: 'إسلام',
    definition: 'Islam, soumission. Religion révélée basée sur la soumission totale à Allah.',
    pronunciation: 'Islam',
    etymology: 'Nom d\'action de la racine س-ل-م (être sauf, se soumettre)',
    examples: [
      'إِنَّ الدِّينَ عِنْدَ اللَّهِ الْإِسْلَامُ - Certes, la religion acceptée d\'Allah, c\'est l\'Islam',
      'وَمَنْ يَبْتَغِ غَيْرَ الْإِسْلَامِ دِينًا فَلَنْ يُقْبَلَ مِنْهُ - Et quiconque désire une religion autre que l\'Islam, on ne l\'agréera jamais'
    ],
    relatedWords: ['أسلم', 'مسلم', 'سلام'],
    category: 'Religion'
  },
  'مسلم': {
    word: 'مسلم',
    definition: 'Musulman, celui qui se soumet. Adepte de l\'Islam qui se soumet à Allah.',
    pronunciation: 'Muslim',
    etymology: 'Participe actif de la racine س-ل-م',
    examples: [
      'وَمَنْ أَحْسَنُ دِينًا مِمَّنْ أَسْلَمَ وَجْهَهُ لِلَّهِ - Qui est meilleur en religion que celui qui soumet à Allah son être',
      'إِنَّ الْمُسْلِمِينَ وَالْمُسْلِمَاتِ - Certes, les Musulmans et Musulmanes'
    ],
    relatedWords: ['إسلام', 'أسلم', 'سلام'],
    category: 'Religion'
  },
  'سلام': {
    word: 'سلام',
    definition: 'Paix, salut. Concept central en Islam signifiant la paix avec Dieu et entre les hommes.',
    pronunciation: 'Salam',
    etymology: 'De la racine س-ل-م (être sauf, en paix)',
    examples: [
      'وَاللَّهُ يَدْعُو إِلَى دَارِ السَّلَامِ - Et Allah appelle à la demeure de la paix',
      'السَّلَامُ عَلَيْكُمْ وَرَحْمَةُ اللَّهِ - Que la paix soit sur vous ainsi que la miséricorde d\'Allah'
    ],
    relatedWords: ['إسلام', 'مسلم', 'سلم'],
    category: 'Concepts spirituels'
  },
  'جنة': {
    word: 'جنة',
    definition: 'Paradis, jardin. Demeure éternelle des bienheureux dans l\'au-delà.',
    pronunciation: 'Jannah',
    etymology: 'De la racine ج-ن-ن (couvrir, cacher)',
    examples: [
      'وَأُدْخِلَ الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ جَنَّاتٍ - Et ceux qui auront cru et fait de bonnes œuvres seront introduits dans les Jardins',
      'لَهُمْ جَنَّاتُ عَدْنٍ - Ils auront les jardins d\'Eden'
    ],
    relatedWords: ['جنات', 'فردوس', 'نعيم'],
    category: 'Eschatologie'
  },
  'نار': {
    word: 'نار',
    definition: 'Feu, Enfer. Châtiment des mécréants dans l\'au-delà.',
    pronunciation: 'Nar',
    etymology: 'De la racine ن-و-ر (briller, éclairer)',
    examples: [
      'وَاتَّقُوا النَّارَ الَّتِي أُعِدَّتْ لِلْكَافِرِينَ - Et craignez le Feu qui a été préparé pour les mécréants',
      'كُلَّمَا أَرَادُوا أَنْ يَخْرُجُوا مِنْهَا مِنْ غَمٍّ أُعِيدُوا فِيهَا - Chaque fois qu\'ils voudront en sortir (pour échapper) à la détresse, ils y seront ramenés'
    ],
    relatedWords: ['جهنم', 'سعير', 'حريق'],
    category: 'Eschatologie'
  },
  'يوم': {
    word: 'يوم',
    definition: 'Jour. Souvent utilisé pour désigner le Jour du Jugement dernier.',
    pronunciation: 'Yawm',
    etymology: 'De la racine ي-و-م (jour)',
    examples: [
      'يَوْمَ الدِّينِ - Le Jour du Jugement',
      'وَمَا أَدْرَاكَ مَا يَوْمُ الدِّينِ - Et qui te dira ce qu\'est le Jour du Jugement ?'
    ],
    relatedWords: ['أيام', 'يومئذ', 'اليوم'],
    category: 'Temps'
  },
  'قيامة': {
    word: 'قيامة',
    definition: 'Résurrection, Jour du Jugement. Jour où tous les morts ressusciteront.',
    pronunciation: 'Qiyamah',
    etymology: 'De la racine ق-و-م (se lever, ressusciter)',
    examples: [
      'وَيَوْمَ الْقِيَامَةِ تَرَى الَّذِينَ كَذَبُوا عَلَى اللَّهِ - Et au Jour de la Résurrection, tu verras ceux qui mentaient sur Allah',
      'لَا رَيْبَ فِيهِ وَلَا رَيْبَ فِي السَّاعَةِ - Il n\'y a pas de doute à son sujet, et il n\'y a pas de doute au sujet de l\'Heure'
    ],
    relatedWords: ['قام', 'بعث', 'حشر'],
    category: 'Eschatologie'
  },
  'ملائكة': {
    word: 'ملائكة',
    definition: 'Anges. Créatures spirituelles d\'Allah créées de lumière pour L\'adorer et exécuter Ses ordres.',
    pronunciation: 'Mala\'ikah',
    etymology: 'Pluriel de ملك (ange)',
    examples: [
      'آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ - Le Messager a cru en ce qu\'on a fait descendre vers lui venant de son Seigneur, et aussi les croyants : tous ont cru en Allah, en Ses anges',
      'وَالْمَلَائِكَةُ يُسَبِّحُونَ بِحَمْدِ رَبِّهِمْ - Et les Anges célèbrent les louanges de leur Seigneur'
    ],
    relatedWords: ['ملك', 'جبريل', 'ميكائيل'],
    category: 'Créatures spirituelles'
  },
  'جبريل': {
    word: 'جبريل',
    definition: 'Gabriel (Jibril). Archange chargé de transmettre la révélation aux prophètes.',
    pronunciation: 'Jibril',
    etymology: 'Nom propre d\'origine hébraïque',
    examples: [
      'نَزَلَ بِهِ الرُّوحُ الْأَمِينُ - L\'Esprit fidèle est descendu avec cela',
      'مَنْ كَانَ عَدُوًّا لِجِبْرِيلَ - Quiconque est ennemi de Gabriel'
    ],
    relatedWords: ['ملائكة', 'روح', 'أمين'],
    category: 'Créatures spirituelles'
  },
  'شيطان': {
    word: 'شيطان',
    definition: 'Satan, diable. Créature rebelle qui tente d\'égarer les humains.',
    pronunciation: 'Shaytan',
    etymology: 'De la racine ش-ط-ن (s\'éloigner, se rebeller)',
    examples: [
      'وَقُلْنَا يَا آدَمُ اسْكُنْ أَنْتَ وَزَوْجُكَ الْجَنَّةَ وَلَا تَقْرَبَا هَذِهِ الشَّجَرَةَ فَتَكُونَا مِنَ الظَّالِمِينَ فَأَزَلَّهُمَا الشَّيْطَانُ - Et Nous dîmes : "Ô Adam, habite le Paradis toi et ton épouse, et ne vous approchez pas de cet arbre sinon vous seriez du nombre des injustes." Puis le Diable les fit glisser de là',
      'إِنَّ الشَّيْطَانَ لَكُمْ عَدُوٌّ مُبِينٌ - Certes, le Diable est pour vous un ennemi déclaré'
    ],
    relatedWords: ['إبليس', 'شياطين', 'وسوسة'],
    category: 'Créatures spirituelles'
  },
  'آدم': {
    word: 'آدم',
    definition: 'Adam. Premier homme et premier prophète créé par Allah.',
    pronunciation: 'Adam',
    etymology: 'De la racine أ-د-م (être brun, terre)',
    examples: [
      'وَعَلَّمَ آدَمَ الْأَسْمَاءَ كُلَّهَا - Et Il enseigna à Adam tous les noms',
      'يَا بَنِي آدَمَ خُذُوا زِينَتَكُمْ عِنْدَ كُلِّ مَسْجِدٍ - Ô enfants d\'Adam, dans chaque lieu de Salât portez votre parure'
    ],
    relatedWords: ['بني', 'إنسان', 'بشر'],
    category: 'Prophètes'
  },
  'موسى': {
    word: 'موسى',
    definition: 'Moïse (Musa). Prophète d\'Allah qui reçut la Torah et guida les Enfants d\'Israël.',
    pronunciation: 'Musa',
    etymology: 'Nom propre d\'origine égyptienne',
    examples: [
      'وَآتَيْنَا مُوسَى الْكِتَابَ - Et Nous donnâmes à Moïse le Livre',
      'وَكَلَّمَ اللَّهُ مُوسَى تَكْلِيمًا - Et Allah parla effectivement à Moïse'
    ],
    relatedWords: ['توراة', 'هارون', 'فرعون'],
    category: 'Prophètes'
  },
  'عيسى': {
    word: 'عيسى',
    definition: 'Jésus (Isa). Prophète d\'Allah né miraculeusement de la Vierge Marie.',
    pronunciation: 'Isa',
    etymology: 'Nom propre d\'origine araméenne',
    examples: [
      'وَقَفَّيْنَا عَلَى آثَارِهِمْ بِعِيسَى ابْنِ مَرْيَمَ - Et Nous avons envoyé après eux Jésus, fils de Marie',
      'إِنَّ مَثَلَ عِيسَى عِنْدَ اللَّهِ كَمَثَلِ آدَمَ - Pour Allah, Jésus est comme Adam'
    ],
    relatedWords: ['مريم', 'مسيح', 'إنجيل'],
    category: 'Prophètes'
  },
  'مريم': {
    word: 'مريم',
    definition: 'Marie (Maryam). Mère du prophète Jésus, femme pieuse choisie par Allah.',
    pronunciation: 'Maryam',
    etymology: 'Nom propre d\'origine hébraïque',
    examples: [
      'وَاذْكُرْ فِي الْكِتَابِ مَرْيَمَ - Et mentionne, dans le Livre, Marie',
      'يَا مَرْيَمُ إِنَّ اللَّهَ اصْطَفَاكِ وَطَهَّرَكِ - Ô Marie, certes Allah t\'a élue et purifiée'
    ],
    relatedWords: ['عيسى', 'عمران', 'طهر'],
    category: 'Personnages'
  },
  'إبراهيم': {
    word: 'إبراهيم',
    definition: 'Abraham (Ibrahim). Prophète et ami d\'Allah, père des prophètes.',
    pronunciation: 'Ibrahim',
    etymology: 'Nom propre d\'origine hébraïque',
    examples: [
      'وَاتَّخَذَ اللَّهُ إِبْرَاهِيمَ خَلِيلًا - Et Allah prit Abraham pour ami privilégié',
      'مِلَّةَ إِبْرَاهِيمَ حَنِيفًا - La religion d\'Abraham, musulman primordial'
    ],
    relatedWords: ['خليل', 'حنيف', 'ملة'],
    category: 'Prophètes'
  },
  'حج': {
    word: 'حج',
    definition: 'Pèlerinage à La Mecque. Cinquième pilier de l\'Islam, obligation pour celui qui en a les moyens.',
    pronunciation: 'Hajj',
    etymology: 'De la racine ح-ج-ج (argumenter, se diriger vers)',
    examples: [
      'وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ مَنِ اسْتَطَاعَ إِلَيْهِ سَبِيلًا - Et c\'est un devoir envers Allah pour les gens qui ont les moyens, d\'aller faire le pèlerinage de la Maison',
      'الْحَجُّ أَشْهُرٌ مَعْلُومَاتٌ - Le pèlerinage a lieu dans des mois connus'
    ],
    relatedWords: ['حاج', 'بيت', 'كعبة'],
    category: 'Culte'
  },
  'صيام': {
    word: 'صيام',
    definition: 'Jeûne. Abstention de nourriture, boisson et relations conjugales du lever au coucher du soleil.',
    pronunciation: 'Siyam',
    etymology: 'De la racine ص-و-م (jeûner, s\'abstenir)',
    examples: [
      'يَا أَيُّهَا الَّذِينَ آمَنُوا كُتِبَ عَلَيْكُمُ الصِّيَامُ - Ô les croyants ! On vous a prescrit le jeûne',
      'فَمَنْ شَهِدَ مِنْكُمُ الشَّهْرَ فَلْيَصُمْهُ - Donc, quiconque d\'entre vous est présent en ce mois, qu\'il jeûne !'
    ],
    relatedWords: ['صام', 'رمضان', 'إفطار'],
    category: 'Culte'
  },
  'رمضان': {
    word: 'رمضان',
    definition: 'Ramadan. Neuvième mois du calendrier lunaire islamique, mois du jeûne.',
    pronunciation: 'Ramadan',
    etymology: 'De la racine ر-م-ض (être brûlant)',
    examples: [
      'شَهْرُ رَمَضَانَ الَّذِي أُنْزِلَ فِيهِ الْقُرْآنُ - Le mois de Ramadan au cours duquel le Coran a été descendu',
      'فَمَنْ شَهِدَ مِنْكُمُ الشَّهْرَ فَلْيَصُمْهُ - Donc, quiconque d\'entre vous est présent en ce mois, qu\'il jeûne !'
    ],
    relatedWords: ['صيام', 'شهر', 'قرآن'],
    category: 'Temps'
  },
  'تقوى': {
    word: 'تقوى',
    definition: 'Piété, crainte révérencielle d\'Allah. Conscience constante d\'Allah qui guide vers le bien.',
    pronunciation: 'Taqwa',
    etymology: 'De la racine و-ق-ي (protéger, préserver)',
    examples: [
      'وَتَزَوَّدُوا فَإِنَّ خَيْرَ الزَّادِ التَّقْوَى - Et prenez vos provisions ; mais vraiment la meilleure provision est la piété',
      'إِنَّ أَكْرَمَكُمْ عِنْدَ اللَّهِ أَتْقَاكُمْ - Le plus noble d\'entre vous, auprès d\'Allah, est le plus pieux'
    ],
    relatedWords: ['اتقى', 'متقي', 'وقاية'],
    category: 'Vertu'
  },
  'اتقوا': {
    word: 'اتقوا',
    definition: 'Craignez, soyez pieux ! Impératif pluriel signifiant avoir la crainte révérencielle d\'Allah.',
    pronunciation: 'Ittaqu',
    etymology: 'Impératif de la racine و-ق-ي',
    examples: [
      'يَا أَيُّهَا النَّاسُ اتَّقُوا رَبَّكُمْ - Ô gens, craignez votre Seigneur',
      'اتَّقُوا اللَّهَ وَقُولُوا قَوْلًا سَدِيدًا - Craignez Allah et parlez avec droiture'
    ],
    relatedWords: ['تقوى', 'متقي', 'وقاية'],
    category: 'Vertu'
  },
  'صبر': {
    word: 'صبر',
    definition: 'Patience, endurance. Vertu consistant à supporter les épreuves avec constance.',
    pronunciation: 'Sabr',
    etymology: 'De la racine ص-ب-ر (être patient, endurer)',
    examples: [
      'وَاصْبِرْ فَإِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ - Et patiente, car Allah ne fait pas perdre la récompense des bienfaisants',
      'إِنَّمَا يُوَفَّى الصَّابِرُونَ أَجْرَهُمْ بِغَيْرِ حِسَابٍ - Les endurants auront leur pleine récompense sans compter'
    ],
    relatedWords: ['صابر', 'اصبر', 'مصابرة'],
    category: 'Vertu'
  },
  'شكر': {
    word: 'شكر',
    definition: 'Gratitude, reconnaissance. Action de remercier Allah pour Ses bienfaits.',
    pronunciation: 'Shukr',
    etymology: 'De la racine ش-ك-ر (remercier)',
    examples: [
      'وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ - Remerciez-Moi donc et ne soyez pas ingrats envers Moi',
      'لَئِنْ شَكَرْتُمْ لَأَزِيدَنَّكُمْ - Si vous êtes reconnaissants, très certainement J\'augmenterai [Mes bienfaits] pour vous'
    ],
    relatedWords: ['شاكر', 'اشكر', 'مشكور'],
    category: 'Vertu'
  },
  'حمد': {
    word: 'حمد',
    definition: 'Louange, éloge. Action de louer Allah pour Sa perfection et Ses bienfaits.',
    pronunciation: 'Hamd',
    etymology: 'De la racine ح-م-د (louer)',
    examples: [
      'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ - Louange à Allah, Seigneur des mondes',
      'وَقُلِ الْحَمْدُ لِلَّهِ الَّذِي لَمْ يَتَّخِذْ وَلَدًا - Et dis : "Louange à Allah qui ne S\'est point attribué d\'enfant !"'
    ],
    relatedWords: ['حامد', 'محمود', 'أحمد'],
    category: 'Louange'
  },
  'سبح': {
    word: 'سبح',
    definition: 'Il a glorifié, il a proclamé la transcendance. Verbe signifiant déclarer Allah exempt de tout défaut.',
    pronunciation: 'Sabbaha',
    etymology: 'De la racine س-ب-ح (nager, être pur)',
    examples: [
      'سَبَّحَ لِلَّهِ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ - Tout ce qui est dans les cieux et tout ce qui est sur la terre glorifie Allah',
      'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ - Gloire à Allah et par Sa louange'
    ],
    relatedWords: ['سبحان', 'تسبيح', 'مسبح'],
    category: 'Louange'
  },
  'سبحان': {
    word: 'سبحان',
    definition: 'Gloire à, transcendance. Expression de glorification proclamant la perfection d\'Allah.',
    pronunciation: 'Subhan',
    etymology: 'Nom d\'action de la racine س-ب-ح',
    examples: [
      'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ سُبْحَانَ اللَّهِ الْعَظِيمِ - Gloire à Allah et par Sa louange, gloire à Allah l\'Immense',
      'سُبْحَانَ الَّذِي أَسْرَى بِعَبْدِهِ - Gloire à Celui qui, de nuit, fit voyager Son serviteur'
    ],
    relatedWords: ['سبح', 'تسبيح', 'مسبح'],
    category: 'Louange'
  }
};

export const Dictionary: React.FC<DictionaryProps> = ({ isOpen, onClose, initialWord = '', language }) => {
  const [searchTerm, setSearchTerm] = useState(initialWord);
  const [currentEntry, setCurrentEntry] = useState<DictionaryEntry | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (initialWord) {
      setSearchTerm(initialWord);
      searchWord(initialWord);
    }
  }, [initialWord]);

  useEffect(() => {
    // Charger les favoris depuis localStorage
    const savedFavorites = localStorage.getItem('dictionaryFavorites');
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error('Error loading favorites:', e);
      }
    }
  }, []);

  const searchWord = async (word: string) => {
    if (!word.trim()) return;

    setLoading(true);
    
    // Simuler un délai de recherche
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const normalizedWord = word.trim();
    const entry = ARABIC_DICTIONARY[normalizedWord];
    
    if (entry) {
      setCurrentEntry(entry);
      // Ajouter à l'historique
      setSearchHistory(prev => {
        const newHistory = [normalizedWord, ...prev.filter(w => w !== normalizedWord)];
        return newHistory.slice(0, 10); // Garder seulement les 10 derniers
      });
    } else {
      setCurrentEntry(null);
    }
    
    setLoading(false);
  };

  const handleSearch = () => {
    searchWord(searchTerm);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleFavorite = (word: string) => {
    const newFavorites = favorites.includes(word)
      ? favorites.filter(w => w !== word)
      : [...favorites, word];
    
    setFavorites(newFavorites);
    localStorage.setItem('dictionaryFavorites', JSON.stringify(newFavorites));
  };

  const playPronunciation = (word: string) => {
    // Simuler la lecture de la prononciation
    console.log(`Playing pronunciation for: ${word}`);
    // Dans une vraie application, on utiliserait une API de synthèse vocale
  };

  const searchRelatedWord = (word: string) => {
    setSearchTerm(word);
    searchWord(word);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${language === 'ar' ? 'rtl' : 'ltr'} transition-colors duration-200`}>
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-teal-800 dark:text-teal-300 flex items-center">
            <BookOpen size={24} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {language === 'fr' ? 'Dictionnaire Arabe-Français' : 'القاموس العربي-الفرنسي'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-grow">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={language === 'fr' ? 'Rechercher un mot arabe...' : 'البحث عن كلمة عربية...'}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 text-lg font-arabic"
                  dir="rtl"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={loading || !searchTerm.trim()}
                className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center min-w-[120px]"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    <Search size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                    <span className="hidden sm:inline">{language === 'fr' ? 'Rechercher' : 'بحث'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Access */}
          {(searchHistory.length > 0 || favorites.length > 0) && (
            <div className="mb-6 space-y-4">
              {/* Favorites */}
              {favorites.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
                    <Star size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                    {language === 'fr' ? 'Favoris' : 'المفضلة'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {favorites.map((word) => (
                      <button
                        key={word}
                        onClick={() => searchRelatedWord(word)}
                        className="px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 rounded-full text-sm font-arabic hover:bg-yellow-200 dark:hover:bg-yellow-900/30 transition-colors"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Search History */}
              {searchHistory.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {language === 'fr' ? 'Recherches récentes' : 'البحث الأخير'}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {searchHistory.slice(0, 5).map((word) => (
                      <button
                        key={word}
                        onClick={() => searchRelatedWord(word)}
                        className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-arabic hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                      >
                        {word}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Dictionary Entry */}
          {loading ? (
            <div className="text-center py-8">
              <Loader2 size={32} className="mx-auto text-teal-600 dark:text-teal-400 animate-spin mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {language === 'fr' ? 'Recherche en cours...' : 'جاري البحث...'}
              </p>
            </div>
          ) : currentEntry ? (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-6 transition-colors duration-200">
              {/* Word Header */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-4 gap-4">
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-3xl font-bold text-teal-800 dark:text-teal-300 font-arabic" dir="rtl">
                      {currentEntry.word}
                    </h3>
                    <button
                      onClick={() => toggleFavorite(currentEntry.word)}
                      className={`p-2 rounded-full transition-colors ${
                        favorites.includes(currentEntry.word)
                          ? 'text-yellow-500 hover:text-yellow-600'
                          : 'text-gray-400 dark:text-gray-500 hover:text-yellow-500'
                      }`}
                      title={favorites.includes(currentEntry.word) 
                        ? (language === 'fr' ? 'Retirer des favoris' : 'إزالة من المفضلة')
                        : (language === 'fr' ? 'Ajouter aux favoris' : 'إضافة إلى المفضلة')
                      }
                    >
                      <Star size={20} className={favorites.includes(currentEntry.word) ? 'fill-current' : ''} />
                    </button>
                  </div>
                  
                  {currentEntry.pronunciation && (
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' ? 'Prononciation:' : 'النطق:'}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                        {currentEntry.pronunciation}
                      </span>
                      <button
                        onClick={() => playPronunciation(currentEntry.word)}
                        className="p-1 text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                        title={language === 'fr' ? 'Écouter la prononciation' : 'استمع للنطق'}
                      >
                        <Volume2 size={16} />
                      </button>
                    </div>
                  )}
                  
                  {currentEntry.category && (
                    <span className="inline-block px-2 py-1 bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-full text-xs font-medium">
                      {currentEntry.category}
                    </span>
                  )}
                </div>
              </div>

              {/* Definition */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  {language === 'fr' ? 'Définition' : 'التعريف'}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {currentEntry.definition}
                </p>
              </div>

              {/* Etymology */}
              {currentEntry.etymology && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2 flex items-center">
                    <Info size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                    {language === 'fr' ? 'Étymologie' : 'أصل الكلمة'}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm italic">
                    {currentEntry.etymology}
                  </p>
                </div>
              )}

              {/* Examples */}
              {currentEntry.examples && currentEntry.examples.length > 0 && (
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    {language === 'fr' ? 'Exemples' : 'أمثلة'}
                  </h4>
                  <div className="space-y-3">
                    {currentEntry.examples.map((example, index) => (
                      <div key={index} className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                        <p className="text-gray-800 dark:text-gray-200 font-arabic text-lg leading-relaxed" dir="rtl">
                          {example}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Related Words */}
              {currentEntry.relatedWords && currentEntry.relatedWords.length > 0 && (
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-3">
                    {language === 'fr' ? 'Mots apparentés' : 'كلمات ذات صلة'}
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {currentEntry.relatedWords.map((word) => (
                      <button
                        key={word}
                        onClick={() => searchRelatedWord(word)}
                        className="px-3 py-2 bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-lg text-sm font-arabic hover:bg-teal-200 dark:hover:bg-teal-900/30 transition-colors flex items-center gap-1"
                      >
                        {word}
                        <ArrowRight size={14} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : searchTerm && !loading ? (
            <div className="text-center py-8">
              <BookOpen size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {language === 'fr' ? 'Mot non trouvé' : 'الكلمة غير موجودة'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500">
                {language === 'fr' 
                  ? `Le mot "${searchTerm}" n'est pas dans notre dictionnaire.`
                  : `الكلمة "${searchTerm}" غير موجودة في قاموسنا.`}
              </p>
            </div>
          ) : (
            <div className="text-center py-8">
              <BookOpen size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400 mb-2">
                {language === 'fr' ? 'Dictionnaire Arabe-Français' : 'القاموس العربي-الفرنسي'}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 max-w-md mx-auto">
                {language === 'fr' 
                  ? 'Recherchez la définition, la prononciation et des exemples d\'usage des mots arabes du Coran.'
                  : 'ابحث عن تعريف ونطق وأمثلة استخدام الكلمات العربية في القرآن.'}
              </p>
              
              {/* Suggested Words */}
              <div className="mt-6">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                  {language === 'fr' ? 'Mots suggérés:' : 'كلمات مقترحة:'}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {Object.keys(ARABIC_DICTIONARY).slice(0, 6).map((word) => (
                    <button
                      key={word}
                      onClick={() => searchRelatedWord(word)}
                      className="px-3 py-1 bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 rounded-full text-sm font-arabic hover:bg-teal-200 dark:hover:bg-teal-900/30 transition-colors"
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};