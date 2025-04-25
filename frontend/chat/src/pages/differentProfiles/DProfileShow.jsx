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
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-blue-200 h-14 w-14"></div>
          <div className="flex-1 space-y-4 py-1">
            <div className="h-4 bg-blue-200 rounded w-3/4"></div>
            <div className="space-y-2">
              <div className="h-4 bg-blue-200 rounded"></div>
              <div className="h-4 bg-blue-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md my-4 shadow-sm">
        <div className="flex items-center text-red-700">
          <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-medium">{error}</span>
        </div>
      </div>
    );
  }

  // No profile data state
  if (!profileData) {
    return <div className="text-center py-12 text-gray-500 bg-blue-50 rounded-lg">Profile not found</div>;
  }

  // Extract user data with fallbacks
  const user = profileData.user || {};
  const profilePicture = profileData.profile_picture_url ||
    `https://ui-avatars.com/api/?name=${user.first_name || ''}+${user.last_name || ''}&background=3b82f6&color=ffffff`;

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl border border-blue-100">
      {/* Profile Header with enhanced gradient */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080">
            <path fill="#FFF" d="M0 0h1920v1080H0z" />
            <path fill="none" stroke="#FFF" strokeWidth="2" d="M0 120h1920M0 240h1920M0 360h1920M0 480h1920M0 600h1920M0 720h1920M0 840h1920M0 960h1920" />
          </svg>
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:space-x-6 relative z-10">
          <div className="relative group mb-4 md:mb-0 flex-shrink-0">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-white/20 backdrop-blur-sm p-1 shadow-inner">
              <img
                src={profilePicture}
                alt={`${user.first_name || 'User'}'s profile`}
                className="w-full h-full rounded-full object-cover border-2 border-white/60 shadow-lg"
                onError={(e) => {
                  e.target.src = `https://ui-avatars.com/api/?name=user&background=3b82f6&color=ffffff`;
                }}
              />
            </div>
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {user.first_name || 'No first name'} {user.last_name || 'No last name'}
            </h1>
            <p className="text-blue-100 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              @{user.username || 'No username'}
            </p>
            <p className="text-blue-100 text-sm mt-2 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Member since {formatDate(profileData.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Profile Content with improved card design */}
      <div className="p-6 md:p-8 space-y-6">
        {profileData.bio && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
            <h2 className="text-sm font-medium text-blue-600 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Bio
            </h2>
            <p className="text-gray-800 italic">{profileData.bio}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Email */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 transition-all hover:bg-blue-100">
            <h2 className="text-sm font-medium text-blue-600 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email
            </h2>
            <p className="text-gray-800 break-all">{user.email || 'No email provided'}</p>
          </div>

          {/* User ID */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 transition-all hover:bg-blue-100">
            <h2 className="text-sm font-medium text-blue-600 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
              </svg>
              User ID
            </h2>
            <p className="text-gray-800 font-mono">{user.id || 'N/A'}</p>
          </div>

          {/* Location */}
          {profileData.location && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 transition-all hover:bg-blue-100">
              <h2 className="text-sm font-medium text-blue-600 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Location
              </h2>
              <p className="text-gray-800">{profileData.location}</p>
            </div>
          )}

          {/* Date of Birth */}
          {profileData.date_of_birth && (
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 transition-all hover:bg-blue-100">
              <h2 className="text-sm font-medium text-blue-600 mb-2 flex items-center">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Date of Birth
              </h2>
              <p className="text-gray-800">{formatDate(profileData.date_of_birth)}</p>
            </div>
          )}

          {/* Profile ID */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 transition-all hover:bg-blue-100">
            <h2 className="text-sm font-medium text-blue-600 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              Profile ID
            </h2>
            <p className="text-gray-800 font-mono">{profileData.id || 'N/A'}</p>
          </div>

          {/* Last Updated */}
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 transition-all hover:bg-blue-100">
            <h2 className="text-sm font-medium text-blue-600 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last Updated
            </h2>
            <p className="text-gray-800">{formatDate(profileData.updated_at)}</p>
          </div>
        </div>

        {/* Website - Only show if not empty */}
        {profileData.website && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-100">
            <h2 className="text-sm font-medium text-blue-600 mb-2 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
              Website
            </h2>
            <a
              href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 hover:underline break-all flex items-center"
            >
              <svg className="w-4 h-4 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {profileData.website.replace(/(^\w+:|^)\/\//, '')}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
