import { useEffect, useState } from "react";
import ProfilePictureModal from "./ProfilePictureModal";

export default function ProfileShow({ profileData, setProfileData, reloadData }) {
  const [showPictureModal, setShowPictureModal] = useState(false);

  const formatProfilePicUrl = () => {
    if (profileData.profilePic !== null) {
      setProfileData({
        ...profileData,
        profilePic: profileData.profilePic.replace(
          "http://localhost:8000",
          "https://backend.bahwebdev.com"
        ),
      });
    }
  };

  useEffect(() => {
    formatProfilePicUrl();
  }, [profileData]);

// In ProfileShow.js
const handleUploadSuccess = async (newUrl) => {
    await reloadData();
    // Force refresh by adding a timestamp to the image URL
    setProfileData({
      ...profileData,
      profilePic: `${newUrl}?${Date.now()}` // This forces the browser to fetch a fresh copy
    });
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-gradient-to-br from-indigo-900 to-purple-800 rounded-2xl shadow-xl text-white">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        {/* Profile Picture with hover effect and click handler */}
        <div
          className="relative w-32 h-32 rounded-full border-4 border-indigo-300 overflow-hidden shadow-lg group cursor-pointer transition-all duration-300 hover:border-indigo-200 hover:shadow-indigo-300/30"
          onClick={() => setShowPictureModal(true)}
        >
          <img
            src={
              profileData.profilePic ||
              `https://ui-avatars.com/api/?name=${profileData.first_name}+${profileData.last_name}&background=7c3aed&color=fff`
            }
            alt="Profile"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          {/* Camera icon overlay */}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <svg
              className="w-10 h-10 text-white transform transition-transform group-hover:scale-110"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </div>
          {/* "Change" text indicator */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent py-1 text-center text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            Change Photo
          </div>
        </div>

        {/* Name and Username */}
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold">
            {profileData.first_name} {profileData.last_name}
          </h1>
          <p className="text-indigo-200">@{profileData.username}</p>
        </div>
      </div>

      {/* Bio */}
      {profileData.bio && (
        <p className="mb-6 px-4 py-3 bg-white/10 rounded-lg backdrop-blur-sm">
          {profileData.bio}
        </p>
      )}

      {/* Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {profileData.email && (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span>{profileData.email}</span>
          </div>
        )}

        {profileData.location && (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{profileData.location}</span>
          </div>
        )}

        {profileData.website && (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <a
              href={profileData.website.startsWith('http') ? profileData.website : `https://${profileData.website}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline"
            >
              {profileData.website.replace(/(^\w+:|^)\/\//, '')}
            </a>
          </div>
        )}

        {profileData.dateOfBirth && (
          <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
            <svg className="w-5 h-5 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{new Date(profileData.dateOfBirth).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Profile Picture Modal */}
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
