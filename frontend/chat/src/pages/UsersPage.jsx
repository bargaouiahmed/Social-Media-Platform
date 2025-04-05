import { useState, useEffect } from "react";
import { djangoApi } from "../api";

export default function UsersPage() {
    const [usersData, setUsersData] = useState({
        results: [],
        count: 0,
        next: null,
        previous: null
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);

    const sendFriendRequest = async (receiver) => {
        const sender = Number(sessionStorage.getItem("user_id"));
        try {
            const response = await djangoApi.sendFriendRequest(sender, receiver);
            console.log("Friend request sent:", response);
        } catch (e) {
            console.error("Failed to send friend request:", e);
        }finally{
            window.location.reload()

        }
    };

    const fetchUsers = async (page = 1) => {
        try {
            setLoading(true);
            const response = await djangoApi.listAllUsers(page);

            // Now using the direct response from your API
            setUsersData({
                results: response.data.results || [],
                count: response.data.count || 0,
                next: response.data.next,
                previous: response.data.previous
            });
            setCurrentPage(page);
            setError(null);
        } catch (error) {
            console.error("Error fetching users:", error);
            setError("Failed to load users. Please try again.");
            setUsersData(prev => ({ ...prev, results: [] }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handlePageChange = (newPage) => {
        if (newPage === currentPage) return;
        fetchUsers(newPage);
    };

    if (loading && usersData.results.length === 0) {
        return <div className="flex items-center justify-center h-48 text-gray-600">Loading users...</div>;
    }

    if (error && usersData.results.length === 0) {
        return <div className="p-4 text-red-600 bg-red-100 rounded-md">{error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Users</h1>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mb-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!usersData.previous || loading}
                    className={`px-4 py-2 rounded-md text-sm transition-colors ${!usersData.previous || loading
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {loading ? 'Loading...' : 'Previous'}
                </button>

                <span className="text-gray-600 text-sm">
                    Page {currentPage} of {Math.ceil(usersData.count / 10)}
                </span>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!usersData.next || loading}
                    className={`px-4 py-2 rounded-md text-sm transition-colors ${!usersData.next || loading
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {loading ? 'Loading...' : 'Next'}
                </button>
            </div>

            {/* Users List */}
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
                {usersData.results.map(user => (
                    <li key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                        <div className="user-info">
                            <span className="block font-medium text-gray-800">{user.username}</span>
                            {user.first_name && <span className="text-sm text-gray-600">{user.first_name} {user.last_name}</span>}
                        </div>
                        <button
                            onClick={() => sendFriendRequest(user.id)}
                            className={`px-3 py-1 rounded-md text-sm transition-colors ${loading
                                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                : 'bg-green-500 text-white hover:bg-green-600'}`}
                            disabled={loading}
                        >
                            Add Friend
                        </button>
                    </li>
                ))}
            </ul>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between mt-4">
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={!usersData.previous || loading}
                    className={`px-4 py-2 rounded-md text-sm transition-colors ${!usersData.previous || loading
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {loading ? 'Loading...' : 'Previous'}
                </button>

                <span className="text-gray-600 text-sm">
                    Page {currentPage} of {Math.ceil(usersData.count / 10)}
                </span>

                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={!usersData.next || loading}
                    className={`px-4 py-2 rounded-md text-sm transition-colors ${!usersData.next || loading
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {loading ? 'Loading...' : 'Next'}
                </button>
            </div>
        </div>
    );
}
