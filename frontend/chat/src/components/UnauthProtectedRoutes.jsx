import { Navigate, Outlet } from "react-router-dom";


export default function UnauthProtectedRoute() {
    const access = localStorage.getItem("access") || sessionStorage.getItem('access');

    const refresh = localStorage.getItem("refresh") || sessionStorage.getItem('refresh');

    // If user is authenticated, redirect to profile page
    if (access && refresh) {
        return <Navigate to="/profile" />;
    }

    // If user is not authenticated, allow access to the route
    return <Outlet />;
    }
