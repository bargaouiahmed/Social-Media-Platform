import { useState } from 'react'
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
import ReactionBar from './components/ReactionBar'
function App() {

  return (<>

    <BrowserRouter>
    <NavBar/>
    <Routes>
    <Route path="/register" element={<Registration/>}/>
    <Route path="/login" element={<Login/>}/>
    <Route element={<ProtectedRoute/>}>
      <Route path="/test" element={<AuthentificationTest/>}/>
      <Route path="/testing" element={
        <Testing/>}/>
        <Route path="/profile" element={<ProfilePage/>}/>
        <Route path="/users" element={<UsersPage/>}/>
        <Route path="/" element={<Navigate to="/profile"/>}/>
        <Route path='/feed' element={<Feed/>}/>
        <Route path='/reactions' element={<ReactionBar postId={15}/>}/>
    </Route>


    </Routes>






    </BrowserRouter>
    </>
  )
}

export default App
