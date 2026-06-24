import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AuthPage from './pages/AuthPage'
import FeedPage from './pages/FeedPage'
import WritePage from './pages/WritePage'
import PostDetailPage from './pages/PostDetailPage'
import MyPage from './pages/MyPage'

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { firebaseUser, loading } = useAuth()
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-[#444] text-xs font-mono">
        ...
      </div>
    )
  }
  return firebaseUser ? <>{children}</> : <Navigate to="/auth" replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/" element={<PrivateRoute><FeedPage /></PrivateRoute>} />
      <Route path="/write" element={<PrivateRoute><WritePage /></PrivateRoute>} />
      <Route path="/post/:postId" element={<PrivateRoute><PostDetailPage /></PrivateRoute>} />
      <Route path="/my" element={<PrivateRoute><MyPage /></PrivateRoute>} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter basename="/gitmark">
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
