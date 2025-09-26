import React, { useState } from 'react';
import { X, Search, Book, AlignLeft, Hash, BookOpen, BookMarked, PlayCircle, Languages, ChevronRight, Settings2, FileText, Info, Mic2, BookmarkCheck, Heart, Sun, Moon } from 'lucide-react';

interface HelpPageProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

const HelpPage: React.FC<HelpPageProps> = ({ isOpen, onClose, language }) => {
  const [activeSection, setActiveSection] = useState<string>('search');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4 overflow-auto">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${language === 'ar' ? 'rtl' : 'ltr'} transition-colors duration-200`}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center z-10">
          <h2 className="text-xl sm:text-2xl font-bold text-teal-800 dark:text-teal-300">
            {language === 'fr' ? 'Guide d\'utilisation' : 'دليل الاستخدام'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Sidebar Navigation */}
            <div className="w-full sm:w-1/3 md:w-1/4 space-y-2">
              <button
                className={`w-full text-left p-3 rounded-lg flex items-center ${
                  activeSection === 'search' 
                    ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveSection('search')}
              >
                <Search size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                <span>{language === 'fr' ? 'Recherche' : 'البحث'}</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              
              <button
                className={`w-full text-left p-3 rounded-lg flex items-center ${
                  activeSection === 'theme' 
                    ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveSection('theme')}
              >
                <Moon size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                <span>{language === 'fr' ? 'Thème' : 'المظهر'}</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              
              <button
                className={`w-full text-left p-3 rounded-lg flex items-center ${
                  activeSection === 'bookmarks' 
                    ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveSection('bookmarks')}
              >
                <BookmarkCheck size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                <span>{language === 'fr' ? 'Favoris' : 'المفضلة'}</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              
              <button
                className={`w-full text-left p-3 rounded-lg flex items-center ${
                  activeSection === 'dictionary' 
                    ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveSection('dictionary')}
              >
                <BookOpen size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                <span>{language === 'fr' ? 'Dictionnaire' : 'القاموس'}</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              
              <button
                className={`w-full text-left p-3 rounded-lg flex items-center ${
                  activeSection === 'notes' 
                    ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveSection('notes')}
              >
                <BookMarked size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                <span>{language === 'fr' ? 'Notes' : 'الملاحظات'}</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              
              <button
                className={`w-full text-left p-3 rounded-lg flex items-center ${
                  activeSection === 'audio' 
                    ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveSection('audio')}
              >
                <PlayCircle size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                <span>{language === 'fr' ? 'Audio' : 'الصوت'}</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
              
              <button
                className={`w-full text-left p-3 rounded-lg flex items-center ${
                  activeSection === 'language' 
                    ? 'bg-teal-100 dark:bg-teal-900/20 text-teal-800 dark:text-teal-300' 
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setActiveSection('language')}
              >
                <Languages size={18} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                <span>{language === 'fr' ? 'Langue' : 'اللغة'}</span>
                <ChevronRight size={16} className="ml-auto" />
              </button>
            </div>

            {/* Content Area */}
            <div className="w-full sm:w-2/3 md:w-3/4 bg-gray-50 dark:bg-gray-700 rounded-lg p-4 transition-colors duration-200">
              {activeSection === 'search' && (
                <div>
                  <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-300 mb-3">
                    {language === 'fr' ? 'Comment rechercher dans le Coran' : 'كيفية البحث في القرآن'}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <Book size={18} className="text-teal-600 dark:text-teal-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Recherche par sourate' : 'البحث بالسورة'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Sélectionnez "Sourate" et entrez un numéro de sourate (1-114) pour afficher tous les versets de cette sourate.' 
                          : 'اختر "سورة" وأدخل رقم السورة (١-١١٤) لعرض جميع آيات هذه السورة.'}
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <Hash size={18} className="text-teal-600 dark:text-teal-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Recherche par verset' : 'البحث بالآية'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Sélectionnez "Verset" et utilisez le format "sourate:verset" (ex: 1:1) pour afficher un verset spécifique.' 
                          : 'اختر "آية" واستخدم تنسيق "سورة:آية" (مثال: ١:١) لعرض آية محددة.'}
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <AlignLeft size={18} className="text-teal-600 dark:text-teal-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Recherche par texte' : 'البحث بالنص'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Sélectionnez "Texte" et entrez un mot ou une phrase pour rechercher dans tout le Coran. Utilisez les options de recherche pour affiner vos résultats.' 
                          : 'اختر "نص" وأدخل كلمة أو عبارة للبحث في كل القرآن. استخدم خيارات البحث لتنقية نتائجك.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'theme' && (
                <div>
                  <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-300 mb-3">
                    {language === 'fr' ? 'Mode sombre et clair' : 'الوضع المظلم والمضيء'}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <Sun size={18} className="text-yellow-600 dark:text-yellow-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Basculer entre les thèmes' : 'التبديل بين المظاهر'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Cliquez sur l\'icône soleil/lune dans l\'en-tête pour basculer entre le mode clair et le mode sombre. Votre préférence sera sauvegardée automatiquement.' 
                          : 'انقر على أيقونة الشمس/القمر في الرأس للتبديل بين الوضع المضيء والمظلم. سيتم حفظ تفضيلك تلقائياً.'}
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <Moon size={18} className="text-blue-600 dark:text-blue-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Avantages du mode sombre' : 'فوائد الوضع المظلم'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Le mode sombre réduit la fatigue oculaire dans des environnements peu éclairés et peut économiser la batterie sur les écrans OLED.' 
                          : 'يقلل الوضع المظلم من إجهاد العين في البيئات قليلة الإضاءة ويمكن أن يوفر البطارية على شاشات OLED.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeSection === 'dictionary' && (
                <div>
                  <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-300 mb-3">
                    {language === 'fr' ? 'Utiliser le dictionnaire' : 'استخدام القاموس'}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <BookOpen size={18} className="text-teal-600 dark:text-teal-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Accès au dictionnaire' : 'الوصول إلى القاموس'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Cliquez sur le bouton "Dictionnaire" en haut de la page ou sur l\'icône du dictionnaire dans les actions d\'un verset pour ouvrir le dictionnaire.' 
                          : 'انقر على زر "قاموس" في أعلى الصفحة أو على أيقونة القاموس في إجراءات الآية لفتح القاموس.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeSection === 'notes' && (
                <div>
                  <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-300 mb-3">
                    {language === 'fr' ? 'Prendre des notes' : 'تدوين الملاحظات'}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <BookMarked size={18} className="text-teal-600 dark:text-teal-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Ajouter une note' : 'إضافة ملاحظة'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Cliquez sur l\'icône de notes dans les actions d\'un verset pour ajouter ou consulter vos notes personnelles pour ce verset spécifique.' 
                          : 'انقر على أيقونة الملاحظات في إجراءات الآية لإضافة أو مراجعة ملاحظاتك الشخصية لهذه الآية المحددة.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeSection === 'bookmarks' && (
                <div>
                  <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-300 mb-3">
                    {language === 'fr' ? 'Gérer vos versets favoris' : 'إدارة الآيات المفضلة'}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <Heart size={18} className="text-teal-600 dark:text-teal-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Ajouter aux favoris' : 'إضافة إلى المفضلة'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Cliquez sur l\'icône de cœur dans les actions d\'un verset pour l\'ajouter ou le retirer de vos favoris.' 
                          : 'انقر على أيقونة القلب في إجراءات الآية لإضافتها أو إزالتها من المفضلة.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeSection === 'audio' && (
                <div>
                  <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-300 mb-3">
                    {language === 'fr' ? 'Écouter la récitation' : 'الاستماع إلى التلاوة'}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <PlayCircle size={18} className="text-teal-600 dark:text-teal-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Lecture audio' : 'تشغيل الصوت'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Cliquez sur l\'icône de lecture dans les actions d\'un verset pour écouter sa récitation. Cliquez à nouveau pour arrêter la lecture.' 
                          : 'انقر على أيقونة التشغيل في إجراءات الآية للاستماع إلى تلاوتها. انقر مرة أخرى لإيقاف التشغيل.'}
                      </p>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <Mic2 size={18} className="text-teal-600 dark:text-teal-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Changer de récitateur' : 'تغيير القارئ'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Cliquez sur l\'icône de microphone à côté du bouton de lecture pour sélectionner un récitateur différent.' 
                          : 'انقر على أيقونة الميكروفون بجانب زر التشغيل لاختيار قارئ مختلف.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {activeSection === 'language' && (
                <div>
                  <h3 className="text-lg font-semibold text-teal-800 dark:text-teal-300 mb-3">
                    {language === 'fr' ? 'Changer de langue' : 'تغيير اللغة'}
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-white dark:bg-gray-600 p-3 rounded-lg border border-gray-200 dark:border-gray-500">
                      <div className="flex items-center mb-2">
                        <Languages size={18} className="text-teal-600 dark:text-teal-400 mr-2" />
                        <h4 className="font-medium text-gray-800 dark:text-gray-200">
                          {language === 'fr' ? 'Français et Arabe' : 'الفرنسية والعربية'}
                        </h4>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'fr' 
                          ? 'Notre application prend en charge le français et l\'arabe. Utilisez les boutons de langue en haut de la page pour basculer entre ces langues.' 
                          : 'يدعم تطبيقنا اللغتين الفرنسية والعربية. استخدم أزرار اللغة في أعلى الصفحة للتبديل بين هاتين اللغتين.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HelpPage;