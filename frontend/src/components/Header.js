import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';


function Header() {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setShowUserMenu(false);
  };

  const getDashboardLink = () => {
    switch (user?.role) {
      case 'jobseeker':
        return '/jobseeker/dashboard';
      case 'employer':
        return '/employer/dashboard';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const getRoleColor = () => {
    switch (user?.role) {
      case 'jobseeker':
        return 'bg-blue-100 text-blue-800';
      case 'employer':
        return 'bg-green-100 text-green-800';
      case 'admin':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRoleIcon = () => {
    switch (user?.role) {
      case 'jobseeker':
        return <span className="text-sm">👤</span>;
      case 'employer':
        return <span className="text-sm">🏢</span>;
      case 'admin':
        return <span className="text-sm">🛡️</span>;
      default:
        return <span className="text-sm">👤</span>;
    }
  };

  return (
    <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center space-x-4">
            <Link to="/" className="text-2xl font-bold flex items-center hover:text-gray-200 transition-colors">
              <span className="mr-2">💼</span>
              JobPortal
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="hover:text-gray-200 transition-colors font-medium">
              Home
            </Link>
            <Link to="/search" className="hover:text-gray-200 transition-colors font-medium">
              Find Jobs
            </Link>
            {isAuthenticated && (
              <Link to={getDashboardLink()} className="hover:text-gray-200 transition-colors font-medium">
                Dashboard
              </Link>
            )}
          </nav>

          {/* Right side - Auth & User Menu */}
          <div className="flex items-center space-x-4">
          
            
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-3 py-2 rounded-lg transition-colors"
                >
                  <img
                    src={user?.avatar}
                    alt={user?.name}
                    className="w-8 h-8 rounded-full"
                  />
                  <div className="text-left hidden sm:block">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getRoleColor()}`}>
                      {getRoleIcon()}
                      <span className="ml-1 capitalize">{user?.role}</span>
                    </div>
                  </div>
                  <span className="text-sm">▼</span>
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
                    <Link
                      to={getDashboardLink()}
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowUserMenu(false)}
                    >
                      {getRoleIcon()}
                      <span className="ml-2">Dashboard</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      <span className="text-sm">🚪</span>
                      <span className="ml-2">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/login-signup"
                className="flex items-center space-x-1 bg-white text-blue-600 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                <span>Login / Signup</span>
              </Link>
            )}

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="text-white hover:text-gray-200 p-2"
              >
                {showMobileMenu ? <span className="text-xl">✕</span> : <span className="text-xl">☰</span>}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="md:hidden mt-4 pb-4 border-t border-white/20">
            <nav className="flex flex-col space-y-2 mt-4">
              <Link
                to="/"
                className="block px-3 py-2 text-white hover:bg-white/10 rounded transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Home
              </Link>
              <Link
                to="/search"
                className="block px-3 py-2 text-white hover:bg-white/10 rounded transition-colors"
                onClick={() => setShowMobileMenu(false)}
              >
                Find Jobs
              </Link>
              {isAuthenticated && (
                <Link
                  to={getDashboardLink()}
                  className="block px-3 py-2 text-white hover:bg-white/10 rounded transition-colors"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Dashboard
                </Link>
              )}
              
              {!isAuthenticated && (
                <div className="pt-2 border-t border-white/20 mt-2">
                  <Link
                    to="/LoginSignup"
                    className="block px-3 py-2 text-white hover:bg-white/10 rounded transition-colors"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Login/Signup
                  </Link>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;