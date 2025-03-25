import { Suspense } from "react";
import { useRoutes, Routes, Route, Navigate } from "react-router-dom";
import Home from "./components/home";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from './pages/auth/RegisterPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { SettingsPage } from './pages/SettingsPage';
import { DiagramsPage } from './pages/DiagramsPage';
import routes from "tempo-routes";
import { EmailSettingsPage } from './pages/settings/EmailSettingsPage';

function App() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/home" element={<Home />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/settings/email" element={<EmailSettingsPage />} />
          <Route path="/diagrams" element={<DiagramsPage />} />
        </Routes>
        {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
      </>
    </Suspense>
  );
}

export default App;
