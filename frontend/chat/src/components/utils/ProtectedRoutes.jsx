import { useState, useEffect } from "react";
import { Navigate, Outlet } from "react-router-dom";
import GetAuthStatus from "./GetAuthStatus";
import { djangoApi } from "../../api";
import { jwtDecode } from "jwt-decode";
import { socketClient } from "../../api";
export default function ProtectedRoute() {
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

          // Store username for later use
          sessionStorage.setItem('username', username);
          sessionStorage.setItem("first_name", userData.first_name)
            sessionStorage.setItem("last_name",
                userData.last_name
            )
            sessionStorage.setItem('user_id', userData.user_id)
            sessionStorage.setItem("email",
                userData.email
            )

          // or sessionStorage depending on your login persistence

          // Check security question
          try {
            await djangoApi.checkSecurityQuestion(username);
            setAuthState({
              loading: false,
              isVerified: true,
              hasSecurityQuestion: true
            });
          } catch (securityError) {
            if (securityError.response?.status === 404) {
              // User needs to set up security question
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

    if (!authState.hasSecurityQuestion) {
      return <Navigate to="/create-security-question" replace />;
    }

    return <Outlet />;
  }
