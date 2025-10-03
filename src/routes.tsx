import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import HomePage from './pages/HomePage';
import SurahPage from './pages/SurahPage';
import VersePage from './pages/VersePage';
import ReaderPage from './pages/ReaderPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: 'reader',
        element: <ReaderPage />
      },
      {
        path: 'surah/:surahNumber',
        element: <SurahPage />
      },
      {
        path: 'verse/:surahNumber/:verseNumber',
        element: <VersePage />
      }
    ]
  }
]);
