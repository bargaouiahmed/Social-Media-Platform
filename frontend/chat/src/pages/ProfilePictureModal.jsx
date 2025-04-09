import { useEffect, useState, useRef } from "react";
import { djangoApi } from "../api";

export default function ProfilePictureModal({ profilePicture, onClose, onUploadSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(profilePicture);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB in bytes

  useEffect(() => {
    setPreviewUrl(profilePicture);
  }, [profilePicture]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setError(null);

    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setError("File size exceeds 5MB limit");
      return;
    }

    // Validate file type
    if (!file.type.match(/image\/(jpeg|jpg|png|gif)/)) {
      setError("Only JPG, PNG or GIF images are allowed");
      return;
    }

    setSelectedFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const response = await djangoApi.updateProfilePic(selectedFile);
      onUploadSuccess(response.profile_picture);
      onClose();
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Failed to upload image. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Update Profile Picture</h2>

          {/* Preview Area */}
          <div className="flex justify-center mb-6">
            <div className="relative w-40 h-40 rounded-full overflow-hidden border-4 border-indigo-100">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Profile preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No image selected</span>
                </div>
              )}
            </div>
          </div>

          {/* File Input (hidden) */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png, image/gif"
            className="hidden"
          />

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={triggerFileSelect}
              className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium rounded-lg transition"
            >
              Select Image
            </button>

            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`flex-1 py-2 px-4 text-white font-medium rounded-lg transition ${
                isUploading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload Picture'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="px-6 pb-4">
          <button
            onClick={onClose}
            className="w-full py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
