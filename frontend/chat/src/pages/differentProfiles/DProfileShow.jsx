import { useEffect, useState } from 'react';
import { djangoApi } from '../../api';

export default function UserProfileViewer({ userId }) {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await djangoApi.getProfileData(userId);
        console.log("API Response:", response); // Debug log
        setProfileData(response);
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setError("Could not load profile data");
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchProfile();
  }, [userId]);

  // Format dates for display
  const formatDate = (dateString) => {
    if (!dateString) return "Not specified";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-600" />
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
        <div className="flex items-center text-red-700">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      </div>
    );
  }

  // No profile data state
  if (!profileData) {
    return <div className="text-center py-10 text-gray-500">Profile not found</div>;
  }

  // Extract user data with fallbacks
  const user = profileData.user || {};
  const profilePicture = profileData.profile_picture_url ||
    `https://ui-avatars.com/api/?name=${user.first_name || ''}+${user.last_name || ''}&background=random`;

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
      {/* Profile Header */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-6 text-white">
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <img
              src={profilePicture}
              alt="Profile"
              className="w-20 h-20 rounded-full border-4 border-white/80 object-cover shadow-md"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=user&background=random`;
              }}
            />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              {user.first_name || 'No first name'} {user.last_name || 'No last name'}
            </h1>
            <p className="text-blue-100">@{user.username || 'No username'}</p>
            <p className="text-blue-100 text-sm mt-1">
              Member since {formatDate(profileData.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6 space-y-6">
        {profileData.bio && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-sm font-medium text-gray-500 mb-1">Bio</h2>
            <p className="text-gray-800">{profileData.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-sm font-medium text-gray-500 mb-1">Email</h2>
            <p className="text-gray-800 break-all">{user.email || 'No email provided'}</p>
          </div>

          {/* User ID */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-sm font-medium text-gray-500 mb-1">User ID</h2>
            <p className="text-gray-800">{user.id || 'N/A'}</p>
          </div>

          {/* Location */}
          {profileData.location && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Location</h2>
              <p className="text-gray-800">{profileData.location}</p>
            </div>
          )}

          {/* Date of Birth */}
          {profileData.date_of_birth && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-sm font-medium text-gray-500 mb-1">Date of Birth</h2>
              <p className="text-gray-800">{formatDate(profileData.date_of_birth)}</p>
            </div>
          )}

          {/* Profile ID */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-sm font-medium text-gray-500 mb-1">Profile ID</h2>
            <p className="text-gray-800">{profileData.id || 'N/A'}</p>
          </div>

          {/* Last Updated */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-sm font-medium text-gray-500 mb-1">Last Updated</h2>
            <p className="text-gray-800">{formatDate(profileData.updated_at)}</p>
          </div>
        </div>

        {/* Website - Only show if not empty */}
        {profileData.website && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <h2 className="text-sm font-medium text-gray-500 mb-1">Website</h2>
            <a
              href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {profileData.website.replace(/(^\w+:|^)\/\//, '')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
