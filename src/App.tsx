
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";

import Index from "./pages/Index";
import ExplorePage from "./pages/ExplorePage";
import RecipeDetail from "./pages/RecipeDetail";
import RecipeSearchPage from "./pages/RecipeSearchPage";
import CookPage from "./pages/CookPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import CookingHistoryPage from "./pages/CookingHistoryPage";
import ShoppingListPage from "./pages/ShoppingListPage";
import AdminPage from "./pages/AdminPage";
import AdminRecipesPage from "./pages/AdminRecipesPage";
import AdminImportPage from "./pages/AdminImportPage";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

// Import agent system to initialize it
import '@/agents';

import "./App.css";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-center" />
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Index />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/recipe/:id" element={<RecipeDetail />} />
          <Route path="/search" element={<RecipeSearchPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected routes - require authentication */}
          <Route path="/cook/:id" element={
            <ProtectedRoute>
              <CookPage />
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          } />
          <Route path="/cooking-history" element={
            <ProtectedRoute>
              <CookingHistoryPage />
            </ProtectedRoute>
          } />
          <Route path="/shopping-list" element={
            <ProtectedRoute>
              <ShoppingListPage />
            </ProtectedRoute>
          } />

          {/* Admin-only routes */}
          <Route path="/admin" element={
            <ProtectedRoute requiresAdmin>
              <AdminPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/recipes" element={
            <ProtectedRoute requiresAdmin>
              <AdminRecipesPage />
            </ProtectedRoute>
          } />
          <Route path="/admin/import" element={
            <ProtectedRoute requiresAdmin>
              <AdminImportPage />
            </ProtectedRoute>
          } />

          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
