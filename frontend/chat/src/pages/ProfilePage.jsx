import { useState, useEffect } from "react";
import FriendsPage from "./FriendsPage";
import RequestsPage from "./RequestsPage";
import CreatePost from "./CreatePost";
import MyPosts from "./MyPosts";

export default function ProfilePage() {
    const [profileData, setProfileData] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
    });
    const [profileLoading, setProfileLoading] = useState(true);
    const [makingPost, setMakingPost] = useState(false);
    const [posts, setPosts] = useState([]); // New state for posts
    const [refreshPosts, setRefreshPosts] = useState(false); // New state to trigger refresh

    useEffect(() => {
        // Simulating loading profile data
        const loadProfileData = () => {
            try {
                const username = sessionStorage.getItem('username') || 'Unknown';
                const email = sessionStorage.getItem('email') || 'No email provided';
                const first_name = sessionStorage.getItem('first_name') || '';
                const last_name = sessionStorage.getItem('last_name') || '';

                setProfileData({
                    username,
                    email,
                    first_name,
                    last_name,
                });
            } catch (error) {
                console.error("Error loading profile data:", error);
            } finally {
                setProfileLoading(false);
            }
        };

        loadProfileData();
    }, []);

    const openPostModal = () => {
        setMakingPost(true);
    };

    const handleClosePostModal = () => {
        setMakingPost(false);
    };

    // New function to handle new post creation
    const handleNewPostCreated = (newPost) => {
        setRefreshPosts(prev => !prev);
        handleClosePostModal();

    };

    if (profileLoading) {
        return <div className="flex items-center justify-center h-48 text-gray-600">Loading profile...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">Profile Page</h1>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h2 className="text-lg font-medium text-gray-700">Username</h2>
                        <p className="text-xl text-gray-900">{profileData.username}</p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-medium text-gray-700">Email</h2>
                        <p className="text-xl text-gray-900">{profileData.email}</p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-medium text-gray-700">First Name</h2>
                        <p className="text-xl text-gray-900">{profileData.first_name || 'Not provided'}</p>
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-lg font-medium text-gray-700">Last Name</h2>
                        <p className="text-xl text-gray-900">{profileData.last_name || 'Not provided'}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Social side (left column) */}
                <div className="md:col-span-1">
                    {/* Friends section */}
                    <FriendsPage />

                    {/* Friend Requests section */}
                    <div className="mt-6">
                        <RequestsPage />
                    </div>
                </div>

                {/* Right column - Posts */}
                <div className="md:col-span-2">
                    {/* Create Post Button */}
                    <button
                        onClick={openPostModal}
                        className="mb-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create New Post
                    </button>

                    {/* My Posts section styled to match the rest of the UI */}
                    <div className="bg-white rounded-lg shadow-md p-6">
                        <MyPosts refreshTrigger={refreshPosts} />
                    </div>
                </div>
            </div>

            {/* Modal for creating posts */}
            {makingPost && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                        <CreatePost
                            onClose={handleClosePostModal}
                            onPostCreated={handleNewPostCreated}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}
