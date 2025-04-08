import { useState } from "react";
import { djangoApi,socketClient } from "../api";
import { useNavigate, Link } from "react-router-dom"; // Added Link import
import { dispatchAuthEvent, AUTH_EVENTS } from "../components/authEvents";
import { jwtDecode } from "jwt-decode";
export default function Login() {
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        rememberMe: false
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: type === 'checkbox' ? !checked : value
        }));
        // Clear error when user starts typing
        if (error) setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await djangoApi.login(formData);
            if (response && response.user && response.user.email) {
                sessionStorage.setItem('email', response.user.email);
            } else {
                sessionStorage.setItem('email', formData.username);
            }
            dispatchAuthEvent(AUTH_EVENTS.LOGIN);
            const userId = jwtDecode(localStorage.getItem('access') || sessionStorage.getItem('access')).user_id
            socketClient.emit("user_connected", userId)
            navigate('/profile');
        } catch (error) {
            console.error("Login error:", error);
            if (error.response) {
                // Handle different types of errors from your API
                if (error.response.status === 401) {
                    setError("Invalid username or password");
                } else if (error.response.status === 400) {
                    setError("Please fill in all fields correctly");
                } else {
                    setError("An error occurred. Please try again later.");
                }
            } else if (error.request) {
                setError("Network error. Please check your connection.");
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Login</h2>

            {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-gray-700 mb-2" htmlFor="username">Username:</label>
                    <input
                        id="username"
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                </div>

                <div>
                    <label className="block text-gray-700 mb-2" htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    {/* Added Forgot Password link */}
                    <div className="mt-1 text-right">
                        <Link
                            to="/reset-password"
                            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            Forgot password?
                        </Link>
                    </div>
                </div>

                <div className="flex items-center">
                    <input
                        id="rememberMe"
                        type="checkbox"
                        name="rememberMe"
                        checked={!formData.rememberMe}
                        onChange={handleChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label className="ml-2 block text-gray-700" htmlFor="rememberMe">
                        Log off when you close tab?
                    </label>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className={`w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
                        isLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                >
                    {isLoading ? 'Logging in...' : 'Log In'}
                </button>
            </form>
        </div>
    );
}
