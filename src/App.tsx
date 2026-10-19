// src/App.tsx
// Shell Principal da Aplicação Ontabs com Rotas Reconciliadas

import { Routes, Route } from 'react-router-dom';
import { Sidebar, MobileNav } from '@/components/Navigation';
import { HomePage } from '@/pages/HomePage';
import { ConverterPage } from '@/pages/ConverterPage';
import { PlayPage } from '@/pages/PlayPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { PlansPage } from '@/pages/PlansPage';
import { TabViewerPage } from '@/pages/TabViewerPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';

export default function App() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/converter" element={<ConverterPage />} />
          <Route path="/app/importar" element={<ConverterPage />} />
          <Route path="/play" element={<PlayPage />} />
          <Route path="/play/:songId" element={<PlayPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/app/biblioteca" element={<LibraryPage />} />
          <Route path="/tab/:id" element={<TabViewerPage />} />
          <Route path="/app/tab/:id" element={<TabViewerPage />} />
          <Route path="/planos" element={<PlansPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/configuracoes" element={<SettingsPage />} />
        </Routes>
      </main>
      <MobileNav />
    </div>
  );
}
