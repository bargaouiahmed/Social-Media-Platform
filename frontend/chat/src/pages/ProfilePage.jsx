import { useState, useEffect } from "react";
import FriendsPage from "./FriendsPage";
import RequestsPage from "./RequestsPage";
import CreatePost from "./CreatePost";
import MyPosts from "./MyPosts";
import { djangoApi } from "../api";
import ProfileShow from "./ProfileShow";
import ProfilePictureModal from "./ProfilePictureModal";

export default function ProfilePage() {
    // State management
    const [profileLoading, setProfileLoading] = useState(true);
    const [makingPost, setMakingPost] = useState(false);
    const [refreshPosts, setRefreshPosts] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showPictureModal, setShowPictureModal] = useState(false);
    const [formErrors, setFormErrors] = useState({});

    // Profile data states
    const [profileData, setProfileData] = useState({
        username: "",
        email: "",
        first_name: "",
        last_name: "",
        bio: "",
        profilePic: "",
        location: "",
        website: "",
        dateOfBirth: ""
    });

    const [editForm, setEditForm] = useState({...profileData});

    // Fetch profile data
    const fetchAssociatedProfile = async () => {
        try {
            const response = await djangoApi.assureLoginFlow();
            const formattedProfilePic = response.profile_picture?.replace(
                "http://localhost:8000",
                "https://backend.bahwebdev.com"
            );

            const profile = {
                username: response.user.username,
                email: response.user.email,
                first_name: response.user.first_name,
                last_name: response.user.last_name,
                bio: response.bio,
                profilePic: formattedProfilePic ? `${formattedProfilePic}?${Date.now()}` : null,
                dateOfBirth: response.dateOfBirth,
                location: response.location,
                website: response.website,
            };

            setProfileData(profile);
            setEditForm(profile);

            // Store in session
            sessionStorage.setItem("profile_id", response.id);
            sessionStorage.setItem('first_name', response.user.first_name);
            sessionStorage.setItem('last_name', response.user.last_name);
            sessionStorage.setItem('username', response.user.username);

            setProfileLoading(false);
        } catch (e) {
            console.error(e);
            setProfileLoading(false);
        }
    };

    useEffect(() => {
        fetchAssociatedProfile();
    }, []);

    // Form handling
    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditForm(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const validateForm = () => {
        const errors = {};
        if (!editForm.first_name?.trim()) errors.first_name = "First name is required";
        if (!editForm.last_name?.trim()) errors.last_name = "Last name is required";
        if (editForm.website && !/^https?:\/\/.+\..+/.test(editForm.website)) {
            errors.website = "Please enter a valid URL (include http:// or https://)";
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveProfile = async () => {
        if (!validateForm()) return;

        try {
            // Prepare update data
            const updateData = Object.fromEntries(
                Object.entries(editForm)
                    .filter(([_, v]) => v !== "" && v !== null)
                    .map(([k, v]) => [k, k === 'dateOfBirth' && v ? new Date(v).toISOString() : v])
            );

            await djangoApi.updateProfileData(updateData);
            await fetchAssociatedProfile();
            setIsEditing(false);
        } catch (error) {
            console.error("Failed to update profile:", error);
            setFormErrors({ general: "Failed to update profile. Please try again." });
        }
    };

    // Picture upload handling
    const handleUploadSuccess = async (newUrl) => {
        await fetchAssociatedProfile();
    };

    // Post handling
    const openPostModal = () => setMakingPost(true);
    const handleClosePostModal = () => setMakingPost(false);
    const handleNewPostCreated = () => {
        setRefreshPosts(prev => !prev);
        handleClosePostModal();
    };

    if (profileLoading) {
        return <div className="flex items-center justify-center h-48 text-gray-600">Loading profile...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-6">
            {/* Header with edit controls */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Profile Page</h1>

                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-md transition flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                        Edit Profile
                    </button>
                ) : (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsEditing(false)}
                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md transition flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                            </svg>
                            Cancel
                        </button>
                        <button
                            onClick={handleSaveProfile}
                            className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition flex items-center gap-2"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            Save Changes
                        </button>
                    </div>
                )}
            </div>

            {/* Main content */}
            {isEditing ? (
                <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
                    {/* Profile picture section */}
                    <div className="bg-gray-50 p-6 border-b">
                        <div className="flex flex-col items-center">
                            <div
                                className="relative w-32 h-32 rounded-full border-4 border-white shadow-lg cursor-pointer group"
                                onClick={() => setShowPictureModal(true)}
                            >
                                <img
                                    src={editForm.profilePic || `https://ui-avatars.com/api/?name=${editForm.first_name}+${editForm.last_name}&background=7c3aed&color=fff`}
                                    alt="Profile"
                                    className="w-full h-full object-cover"
                                />
                                <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPictureModal(true)}
                                className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                            >
                                Change Profile Picture
                            </button>
                        </div>
                    </div>

                    {/* Form sections */}
                    <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Personal Information */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                                        <input
                                            type="text"
                                            name="first_name"
                                            value={editForm.first_name || ""}
                                            onChange={handleEditChange}
                                            className={`w-full px-3 py-2 border rounded-md ${formErrors.first_name ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {formErrors.first_name && <p className="mt-1 text-sm text-red-600">{formErrors.first_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                                        <input
                                            type="text"
                                            name="last_name"
                                            value={editForm.last_name || ""}
                                            onChange={handleEditChange}
                                            className={`w-full px-3 py-2 border rounded-md ${formErrors.last_name ? 'border-red-500' : 'border-gray-300'}`}
                                        />
                                        {formErrors.last_name && <p className="mt-1 text-sm text-red-600">{formErrors.last_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                                        <input
                                            type="text"
                                            name="location"
                                            value={editForm.location || ""}
                                            onChange={handleEditChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            placeholder="City, Country"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                        <input
                                            type="date"
                                            name="dateOfBirth"
                                            value={editForm.dateOfBirth?.split('T')[0] || ""}
                                            onChange={handleEditChange}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Additional Information */}
                            <div>
                                <h2 className="text-lg font-semibold text-gray-800 mb-4">Additional Information</h2>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                                        <textarea
                                            name="bio"
                                            value={editForm.bio || ""}
                                            onChange={handleEditChange}
                                            rows="3"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                            placeholder="Tell us about yourself..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                                        <input
                                            type="url"
                                            name="website"
                                            value={editForm.website || ""}
                                            onChange={handleEditChange}
                                            className={`w-full px-3 py-2 border rounded-md ${formErrors.website ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="https://example.com"
                                        />
                                        {formErrors.website && <p className="mt-1 text-sm text-red-600">{formErrors.website}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-8">
                    <ProfileShow
                        profileData={profileData}
                        setProfileData={setProfileData}
                        reloadData={fetchAssociatedProfile}
                    />
                </div>
            )}

            {/* Social and Posts Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1 space-y-6">
                    <FriendsPage />
                    <RequestsPage />
                </div>

                <div className="md:col-span-2">
                    <button
                        onClick={openPostModal}
                        className="mb-4 bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-md transition duration-300 flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create New Post
                    </button>

                    <div className="bg-white rounded-lg shadow-md p-6">
                        <MyPosts refreshTrigger={refreshPosts} />
                    </div>
                </div>
            </div>

            {/* Modals */}
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

            {showPictureModal && (
                <ProfilePictureModal
                    profilePicture={profileData.profilePic}
                    onClose={() => setShowPictureModal(false)}
                    onUploadSuccess={handleUploadSuccess}
                />
            )}
        </div>
    );
}
