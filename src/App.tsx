// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { Sidebar, MobileNav } from '@/components/Navigation';
import { HomePage } from '@/pages/HomePage';
import { ConverterPage } from '@/pages/ConverterPage';
import { PlayPage } from '@/pages/PlayPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { SettingsPage } from '@/pages/SettingsPage';

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/converter" element={<ConverterPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/play/:songId" element={<PlayPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </main>
      <MobileNav />
    </div>
  );
}
