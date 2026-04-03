import { useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import PlayerPage from './pages/PlayerPage';
import AdminPage from './pages/AdminPage';
import CompletePage from './pages/CompletePage';
import { useAdminStore } from './store/adminStore';
import { loadConfig } from './utils/storage';

export default function App() {
  const setConfig = useAdminStore(s => s.setConfig);

  useEffect(() => {
    loadConfig().then(config => {
      if (config) setConfig(config);
    });
  }, [setConfig]);

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PlayerPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/complete" element={<CompletePage />} />
      </Routes>
    </HashRouter>
  );
}
