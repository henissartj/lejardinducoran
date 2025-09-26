import React, { useState, useEffect } from 'react';
import { X, Search, Loader2, Trash, BookmarkCheck } from 'lucide-react';

interface BookmarksProps {
  isOpen: boolean;
  onClose: () => void;
  language: string;
}

interface Bookmark {
  ayahRef: string;
  text: string;
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  timestamp: number;
}

export const Bookmarks: React.FC<BookmarksProps> = ({ isOpen, onClose, language }) => {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    if (isOpen) {
      loadBookmarks();
    }
  }, [isOpen]);
  
  const loadBookmarks = () => {
    try {
      setError(null);
      const savedBookmarks = localStorage.getItem('quranBookmarks');
      if (savedBookmarks) {
        const parsedBookmarks = JSON.parse(savedBookmarks);
        // Sort bookmarks by timestamp, most recent first
        const sortedBookmarks = parsedBookmarks.sort((a: Bookmark, b: Bookmark) => b.timestamp - a.timestamp);
        setBookmarks(sortedBookmarks);
      }
    } catch (err) {
      console.error('Error loading bookmarks:', err);
      setError(language === 'fr' 
        ? 'Erreur lors du chargement des favoris' 
        : 'خطأ في تحميل المفضلة');
    }
  };

  const removeBookmark = (ayahRef: string) => {
    try {
      setError(null);
      const updatedBookmarks = bookmarks.filter(b => b.ayahRef !== ayahRef);
      localStorage.setItem('quranBookmarks', JSON.stringify(updatedBookmarks));
      setBookmarks(updatedBookmarks);
    } catch (err) {
      console.error('Error removing bookmark:', err);
      setError(language === 'fr'
        ? 'Erreur lors de la suppression du favori'
        : 'خطأ في إزالة المفضلة');
    }
  };
  
  const filteredBookmarks = bookmarks.filter(bookmark => 
    bookmark.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bookmark.ayahRef.includes(searchTerm) ||
    bookmark.surahName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto ${language === 'ar' ? 'rtl' : 'ltr'}`}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <BookmarkCheck size={24} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {language === 'fr' ? 'Versets favoris' : 'الآيات المفضلة'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'fr' ? 'Rechercher dans les favoris...' : 'البحث في المفضلة...'}
              className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {error ? (
          <div className="text-center py-8">
            <p className="text-red-500 dark:text-red-400">{error}</p>
          </div>
        ) : filteredBookmarks.length > 0 ? (
          <div className="space-y-4">
            {filteredBookmarks.map((bookmark) => (
              <div key={bookmark.ayahRef} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <span className="text-xs font-medium bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
                      {bookmark.ayahRef}
                    </span>
                    <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                      {bookmark.surahName}
                    </span>
                  </div>
                  <button
                    onClick={() => removeBookmark(bookmark.ayahRef)}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1"
                    title={language === 'fr' ? 'Retirer des favoris' : 'إزالة من المفضلة'}
                  >
                    <Trash size={16} />
                  </button>
                </div>
                <p className={`text-gray-800 dark:text-gray-200 ${language === 'ar' ? 'text-right font-arabic' : ''}`}>
                  {bookmark.text}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <BookmarkCheck size={32} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {language === 'fr' 
                ? 'Aucun verset favori' 
                : 'لا توجد آيات مفضلة'}
            </p>
            <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
              {language === 'fr'
                ? 'Cliquez sur l\'icône de cœur (♥) à côté d\'un verset pour l\'ajouter aux favoris'
                : 'انقر على أيقونة القلب (♥) بجانب الآية لإضافتها إلى المفضلة'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};