import { useState } from "react";
import { djangoApi } from "../api";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

export default function Registration() {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: "",
        password: "",
        password2: "",
        first_name: "",
        last_name: "",
        email: ""
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState({
        username: "",
        password: "",
        password2: "",
        email: "",
        general: ""
    });

    const validateForm = () => {
        let isValid = true;
        const newErrors = {
            username: "",
            password: "",
            password2: "",
            email: "",
            general: ""
        };

        // Username validation
        if (!formData.username.trim()) {
            newErrors.username = "Username is required";
            isValid = false;
        } else if (formData.username.length < 4) {
            newErrors.username = "Username must be at least 4 characters";
            isValid = false;
        }

        // Password validation
        if (!formData.password) {
            newErrors.password = "Password is required";
            isValid = false;
        } else if (formData.password.length < 8) {
            newErrors.password = "Password must be at least 8 characters";
            isValid = false;
        } else if (formData.password === formData.username) {
            newErrors.password = "Password cannot be the same as username";
            isValid = false;
        }

        // Confirm password validation
        if (formData.password !== formData.password2) {
            newErrors.password2 = "Passwords do not match";
            isValid = false;
        }

        // Email validation
        if (!formData.email) {
            newErrors.email = "Email is required";
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Please enter a valid email address";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleChange = (e) => {
        setFormData({...formData, [e.target.name]: e.target.value});
        // Clear error when user types
        if (errors[e.target.name]) {
            setErrors({...errors, [e.target.name]: ""});
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const response = await djangoApi.register(formData);
            const loginResponse = await djangoApi.login({
                username: formData.username,
                password: formData.password
            });

            navigate('/profile');
            window.location.reload();

        } catch (error) {
            console.error("Registration error:", error);

            if (error.response) {
                // Handle backend validation errors
                const backendErrors = error.response.data;
                let errorMessages = {
                    username: "",
                    password: "",
                    email: "",
                    general: ""
                };

                if (backendErrors.username) {
                    errorMessages.username = backendErrors.username.join(" ");
                }
                if (backendErrors.password) {
                    errorMessages.password = backendErrors.password.join(" ");
                }
                if (backendErrors.email) {
                    errorMessages.email = backendErrors.email.join(" ");
                }
                if (typeof backendErrors === 'string') {
                    errorMessages.general = backendErrors;
                } else if (backendErrors.non_field_errors) {
                    errorMessages.general = backendErrors.non_field_errors.join(" ");
                }

                setErrors(errorMessages);
            } else {
                setErrors({
                    ...errors,
                    general: "Network error. Please try again later."
                });
            }
        }
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    return (
        <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Create Account</h2>

            {errors.general && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                    {errors.general}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Username"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            errors.username ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                        }`}
                        required
                    />
                    {errors.username && (
                        <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                    )}
                </div>

                <div className="relative">
                    <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Password"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            errors.password ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                        }`}
                        required
                    />
                    <button
                        type="button"
                        onClick={togglePasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                        {showPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                            <EyeIcon className="h-5 w-5" />
                        )}
                    </button>
                    {errors.password && (
                        <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                    )}
                </div>

                <div className="relative">
                    <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="password2"
                        value={formData.password2}
                        onChange={handleChange}
                        placeholder="Confirm Password"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            errors.password2 ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                        }`}
                        required
                    />
                    <button
                        type="button"
                        onClick={toggleConfirmPasswordVisibility}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500 hover:text-gray-700"
                    >
                        {showConfirmPassword ? (
                            <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                            <EyeIcon className="h-5 w-5" />
                        )}
                    </button>
                    {errors.password2 && (
                        <p className="text-red-500 text-sm mt-1">{errors.password2}</p>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <input
                            type="text"
                            name="first_name"
                            value={formData.first_name}
                            onChange={handleChange}
                            placeholder="First Name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <div>
                        <input
                            type="text"
                            name="last_name"
                            value={formData.last_name}
                            onChange={handleChange}
                            placeholder="Last Name"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                            errors.email ? "border-red-500 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                        }`}
                        required
                    />
                    {errors.email && (
                        <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                    )}
                </div>

                <button
                    type="submit"
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                >
                    Register
                </button>
            </form>
        </div>
    );
}
