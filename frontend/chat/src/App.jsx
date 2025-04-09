import {BrowserRouter, Routes, Route} from 'react-router-dom'
import Registration from './pages/Registration'
import ProtectedRoute from './components/utils/ProtectedRoutes'
import AuthentificationTest from './pages/AuthentificationTest'
import Login from './pages/Login'
import Testing from './components/utils/Testing'
import ProfilePage from './pages/ProfilePage'
import UsersPage from './pages/UsersPage'
import NavBar from './components/NavBar'
import { Navigate } from 'react-router-dom'
import Feed from './pages/Feed'
import CreateSecurityQuestion from './pages/CreateSecurityQuestion'
import ReactionBar from './components/ReactionBar'
import ResetPassword from './pages/ResetPassword'
import UnauthProtectedRoute from './components/UnauthProtectedRoutes'
import SpecialProtectedRoutes from './components/SpecialProtectedRoutes'
import ChatPage from './pages/ChatPage'
import DProfilePage from './pages/differentProfiles/DProfilePage'
function App() {
  return (
    <>
      <BrowserRouter>
        <NavBar/>
        <Routes>
          {/* Unauthenticated-only routes */}
          <Route element={<UnauthProtectedRoute />}>
            <Route path="/register" element={<Registration/>}/>
            <Route path="/login" element={<Login/>}/>
            <Route path="/reset-password" element={<ResetPassword/>}/>
          </Route>

          {/* Authenticated-only routes */}
          <Route element={<ProtectedRoute/>}>
            <Route path="/test" element={<AuthentificationTest/>}/>
            <Route path="/testing" element={<Testing/>}/>
            <Route path="/profile" element={<ProfilePage/>}/>
            <Route path="/users" element={<UsersPage/>}/>
            <Route path="/feed" element={<Feed/>}/>
            <Route path="/chat" element={<ChatPage/>}/>
            <Route path='/profiles/:userId' element={<DProfilePage />}/>
            <Route path="/" element={<Navigate to="/profile"/>}/>

          </Route>

          {/* Special case - security question setup (accessible when authenticated but no question set) */}
          <Route element={<SpecialProtectedRoutes/>}>
          <Route path="/create-security-question" element={<CreateSecurityQuestion/>}/>
          </Route>
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
