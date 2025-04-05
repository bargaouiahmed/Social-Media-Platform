import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogOutC from "./LogOutC";
import { AUTH_EVENTS } from "./authEvents";

export default function NavBar() {
  const [authed, setAuthed] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthStatus = () => {
      const email = sessionStorage.getItem('email');
      setAuthed(!!email);
    };

    checkAuthStatus();

    const handleAuthChange = () => checkAuthStatus();

    window.addEventListener(AUTH_EVENTS.LOGIN, handleAuthChange);
    window.addEventListener(AUTH_EVENTS.LOGOUT, handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_EVENTS.LOGIN, handleAuthChange);
      window.removeEventListener(AUTH_EVENTS.LOGOUT, handleAuthChange);
    };
  }, []);

  if (!authed) {
    return (
      <nav className="bg-white shadow-md py-3 px-4 md:py-4 md:px-6 flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-4">
        <div
          onClick={() => navigate('/login')}
          className="cursor-pointer py-2 px-4 hover:bg-gray-100 text-blue-600 rounded-md transition-colors text-center text-sm md:text-base"
        >
          Login
        </div>
        <div
          onClick={() => navigate('/register')}
          className="cursor-pointer py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-center text-sm md:text-base"
        >
          Register
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-md py-3 px-4 md:py-4 md:px-6">
      <div className="flex justify-between items-center">
        <div className="text-lg md:text-xl font-bold text-blue-600">MyApp</div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-4">
          <NavLink onClick={() => navigate("/profile")} label="Profile" />
          <NavLink onClick={() => navigate("/users")} label="Community" />
          <NavLink onClick={() => navigate("/feed")} label="Feed" />
          <LogOutC />
        </div>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="md:hidden p-2 rounded-lg hover:bg-gray-100"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Dropdown Menu */}
      {isMenuOpen && (
        <div className="md:hidden mt-3 space-y-2">
          <MobileNavLink onClick={() => { navigate("/profile"); setIsMenuOpen(false); }} label="Profile" />
          <MobileNavLink onClick={() => { navigate("/users"); setIsMenuOpen(false); }} label="Community" />
          <MobileNavLink onClick={() => { navigate("/feed"); setIsMenuOpen(false); }} label="Feed" />
          <div className="pt-2 border-t border-gray-100">
            <LogOutC mobile />
          </div>
        </div>
      )}
    </nav>
  );
}

// Reusable component for desktop nav links
const NavLink = ({ onClick, label }) => (
  <div
    onClick={onClick}
    className="cursor-pointer py-2 px-3 hover:bg-gray-100 rounded-md transition-colors text-sm md:text-base"
  >
    {label}
  </div>
);

// Reusable component for mobile nav links
const MobileNavLink = ({ onClick, label }) => (
  <div
    onClick={onClick}
    className="cursor-pointer py-3 px-4 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors text-base"
  >
    {label}
  </div>
);
