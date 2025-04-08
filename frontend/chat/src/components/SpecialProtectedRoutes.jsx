import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import GetAuthStatus from "./utils/GetAuthStatus";
import { djangoApi } from "../api";
import { jwtDecode } from "jwt-decode";

export default function SpecialProtectedRoutes() {
  const [authState, setAuthState] = useState({
    isVerified: false,
    hasSecurityQuestion: false,
    loading: true
  });

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { access, refresh } = GetAuthStatus();

        // No tokens found
        if (!access || !refresh) {
          setAuthState({ loading: false, isVerified: false, hasSecurityQuestion: false });
          return;
        }

        // Decode token to get user info
        const userData = jwtDecode(access);
        const username = userData.username;

        // Check security question
        try {
          await djangoApi.checkSecurityQuestion(username);
          // User already has security question, prevent access to create route
          setAuthState({
            loading: false,
            isVerified: true,
            hasSecurityQuestion: true
          });
        } catch (securityError) {
          if (securityError.response?.status === 404) {
            // User needs to set up security question, allow access
            setAuthState({
              loading: false,
              isVerified: true,
              hasSecurityQuestion: false
            });
          } else {
            // Other error - treat as unverified
            setAuthState({
              loading: false,
              isVerified: false,
              hasSecurityQuestion: false
            });
          }
        }
      } catch (error) {
        console.error("Authentication error:", error);
        setAuthState({
          loading: false,
          isVerified: false,
          hasSecurityQuestion: false
        });
      }
    };

    verifyAuth();
  }, []);

  if (authState.loading) {
    return <div>Loading authentication status...</div>;
  }

  if (!authState.isVerified) {
    return <Navigate to="/login" replace />;
  }

  // The key difference: redirect away from create-security-question if they already have one
  if (authState.hasSecurityQuestion) {
    return <Navigate to="/profile" replace />;
  }

  // Only users without a security question can access routes wrapped by this component
  return <Outlet />;
}
