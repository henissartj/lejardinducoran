import React, { useState, useEffect } from 'react';
import { BookMarked, X, Save, Trash, Filter, ArrowUpRight, Search } from 'lucide-react';

interface NotesProps {
  isOpen: boolean;
  onClose: () => void;
  ayahReference: string;
  language: string;
  viewAll?: boolean;
}

interface Note {
  id: string;
  ayahRef: string;
  text: string;
  createdAt: number;
  updatedAt: number;
}

export const Notes: React.FC<NotesProps> = ({ isOpen, onClose, ayahReference, language, viewAll = false }) => {
  const [currentNote, setCurrentNote] = useState('');
  const [allNotes, setAllNotes] = useState<Note[]>([]);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'surah'>('newest');

  // Charger les notes depuis le localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem('quranNotes');
    if (savedNotes) {
      try {
        setAllNotes(JSON.parse(savedNotes));
      } catch (e) {
        console.error('Error parsing saved notes:', e);
        setAllNotes([]);
      }
    }
  }, []);

  const filteredNotes = allNotes.filter(note => {
    if (!viewAll && ayahReference) {
      return note.ayahRef === ayahReference;
    }
    
    if (searchTerm) {
      return note.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
             note.ayahRef.includes(searchTerm);
    }
    
    return true;
  });

  const sortedNotes = [...filteredNotes].sort((a, b) => {
    if (sortBy === 'newest') {
      return b.updatedAt - a.updatedAt;
    } else if (sortBy === 'oldest') {
      return a.updatedAt - b.updatedAt;
    } else if (sortBy === 'surah') {
      const getSurahNumber = (ref: string) => {
        const parts = ref.split(':');
        return parts.length > 0 ? parseInt(parts[0], 10) : 0;
      };
      return getSurahNumber(a.ayahRef) - getSurahNumber(b.ayahRef);
    }
    return 0;
  });

  const saveAllNotes = (notes: Note[]) => {
    localStorage.setItem('quranNotes', JSON.stringify(notes));
    setAllNotes(notes);
  };

  const saveNote = () => {
    if (!currentNote.trim()) return;

    if (editingNote) {
      const updatedNotes = allNotes.map(note => 
        note.id === editingNote.id 
          ? { ...note, text: currentNote, updatedAt: Date.now() } 
          : note
      );
      saveAllNotes(updatedNotes);
      setEditingNote(null);
    } else {
      const newNote: Note = {
        id: Date.now().toString(),
        ayahRef: ayahReference,
        text: currentNote,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      saveAllNotes([...allNotes, newNote]);
    }
    
    setCurrentNote('');
  };

  const editNote = (note: Note) => {
    setEditingNote(note);
    setCurrentNote(note.text);
  };

  const deleteNote = (id: string) => {
    const updatedNotes = allNotes.filter(note => note.id !== id);
    saveAllNotes(updatedNotes);
    
    if (editingNote && editingNote.id === id) {
      setEditingNote(null);
      setCurrentNote('');
    }
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(
      language === 'fr' ? 'fr-FR' : 'ar-SA',
      { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto ${language === 'ar' ? 'rtl' : 'ltr'}`}>
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center">
            <BookMarked size={24} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
            {viewAll 
              ? (language === 'fr' ? 'Toutes mes notes' : 'جميع ملاحظاتي')
              : (language === 'fr' ? 'Notes personnelles' : 'ملاحظات شخصية')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            <X size={24} />
          </button>
        </div>

        {!viewAll && (
          <div className="mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {language === 'fr' 
                ? `Verset: ${ayahReference}` 
                : `الآية: ${ayahReference}`}
            </p>
            <textarea
              value={currentNote}
              onChange={(e) => setCurrentNote(e.target.value)}
              placeholder={language === 'fr' 
                ? 'Écrivez vos notes et réflexions ici...' 
                : 'اكتب ملاحظاتك وتأملاتك هنا...'}
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
            <div className="flex justify-end mt-2">
              <button
                onClick={saveNote}
                disabled={!currentNote.trim()}
                className={`bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors flex items-center ${
                  !currentNote.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <Save size={16} className={language === 'ar' ? 'ml-2' : 'mr-2'} />
                {editingNote 
                  ? (language === 'fr' ? 'Mettre à jour' : 'تحديث') 
                  : (language === 'fr' ? 'Enregistrer' : 'حفظ')}
              </button>
            </div>
          </div>
        )}

        <div className={viewAll ? '' : 'border-t border-gray-200 dark:border-gray-700 pt-4'}>
          {viewAll && (
            <div className="mb-4">
              <div className="flex flex-col sm:flex-row gap-2 mb-4">
                <div className="relative flex-grow">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={language === 'fr' ? 'Rechercher dans les notes...' : 'البحث في الملاحظات...'}
                    className="w-full px-4 py-2 pl-10 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                  <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                </div>
                <div className="flex justify-end">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'surah')}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  >
                    <option value="newest">{language === 'fr' ? 'Plus récentes' : 'الأحدث'}</option>
                    <option value="oldest">{language === 'fr' ? 'Plus anciennes' : 'الأقدم'}</option>
                    <option value="surah">{language === 'fr' ? 'Par sourate' : 'حسب السورة'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-3">
            {language === 'fr' 
              ? viewAll 
                ? `Notes (${sortedNotes.length})` 
                : 'Notes sauvegardées'
              : viewAll 
                ? `الملاحظات (${sortedNotes.length})` 
                : 'الملاحظات المحفوظة'}
          </h3>
          
          {sortedNotes.length > 0 ? (
            <div className="space-y-4">
              {sortedNotes.map((note) => (
                <div key={note.id} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      {viewAll && (
                        <div className="mb-1">
                          <span className="text-xs font-medium bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 px-2 py-0.5 rounded-full">
                            {note.ayahRef}
                          </span>
                        </div>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {language === 'fr' ? 'Créée le:' : 'تم إنشاؤها في:'} {formatDate(note.createdAt)}
                        {note.createdAt !== note.updatedAt && (
                          <span>
                            {' '}• {language === 'fr' ? 'Modifiée le:' : 'تم تعديلها في:'} {formatDate(note.updatedAt)}
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => editNote(note)}
                        className="text-teal-600 dark:text-teal-400 hover:text-teal-700 dark:hover:text-teal-300"
                        title={language === 'fr' ? 'Modifier cette note' : 'تعديل هذه الملاحظة'}
                      >
                        <BookMarked size={16} />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                        title={language === 'fr' ? 'Supprimer cette note' : 'حذف هذه الملاحظة'}
                      >
                        <Trash size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{note.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <BookMarked size={32} className="mx-auto text-gray-400 dark:text-gray-500 mb-2" />
              <p className="text-gray-500 dark:text-gray-400">
                {language === 'fr' 
                  ? viewAll 
                    ? 'Aucune note enregistrée' 
                    : 'Aucune note pour ce verset'
                  : viewAll 
                    ? 'لا توجد ملاحظات مسجلة' 
                    : 'لا توجد ملاحظات لهذه الآية'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};