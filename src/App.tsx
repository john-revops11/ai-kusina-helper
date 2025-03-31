
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

import "./App.css";

function App() {
  return (
    <Router>
      <Toaster position="top-center" />
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/explore" element={<ExplorePage />} />
        <Route path="/recipe/:id" element={<RecipeDetail />} />
        <Route path="/search" element={<RecipeSearchPage />} />
        <Route path="/cook/:id" element={<CookPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/cooking-history" element={<CookingHistoryPage />} />
        <Route path="/shopping-list" element={<ShoppingListPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/recipes" element={<AdminRecipesPage />} />
        <Route path="/admin/import" element={<AdminImportPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
