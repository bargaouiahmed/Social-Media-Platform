import { djangoApi } from "../../api";
import { useState, useEffect } from "react";
export default function DProfilePostModal({ post }) {
  const [comments, setComments] = useState([]);
  const getCommentsForPost = async () =>{
    try{
      const response = await djangoApi.getCommentsForPost(post.id)
      console.log("comments for post "+post.id, response);
      setComments(response.data);
    }catch(e){
      console.error(e);
    }
  }
  useEffect(()=>{
    getCommentsForPost();
  },[])
  // Function to process attachment URLs
  const getAttachmentUrl = (url) => {
    if (!url) return '';
    
    // Replace localhost:8000 with production domain if needed
    if (process.env.NODE_ENV === 'production') {
      return url.replace(
        'http://localhost:8000', 
        'https://backend.bahwebdev.com'
      );
    }
    return url;
  };

  // Function to determine if attachment is an image
  const isImage = (fileUrl) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const lowerUrl = fileUrl.toLowerCase();
    return imageExtensions.some(ext => lowerUrl.endsWith(ext));
  };

  return (
    <div className="bg-white shadow-lg rounded-lg p-6 space-y-4">
      {/* Post Header (Author Info & Timestamp) */}
      <div className="flex items-center space-x-3">
        <div className="font-bold text-gray-800">
          {post.author.first_name} {post.author.last_name}
        </div>
        <div className="text-sm text-gray-500">
          {new Date(post.created_at).toLocaleDateString()}
        </div>
      </div>

      {/* Post Title */}
      <h2 className="text-xl font-semibold text-gray-900">
        {post.title}
      </h2>

      {/* Post Content */}
      <p className="text-gray-700">{post.content}</p>

      {/* Attachments */}
      {post.attachments.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-medium text-gray-800">
            Attachments:
          </h3>
          <div className="space-y-4">
            {post.attachments.map((attachment) => {
              const fileUrl = getAttachmentUrl(attachment.file_url);
              const fileName = attachment.file.split("/").pop();
              
              return (
                <div key={attachment.id} className="border rounded-lg p-3">
                  {isImage(fileUrl) ? (
                    <div className="flex flex-col space-y-2">
                      <img 
                        src={fileUrl} 
                        alt={fileName} 
                        className="max-w-full h-auto rounded-md max-h-64 object-contain"
                      />
                      <a
                        href={fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-500 hover:underline text-sm"
                      >
                        View full image
                      </a>
                    </div>
                  ) : (
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline flex items-center space-x-2"
                    >
                      <span className="text-gray-700">{fileName}</span>
                      <span className="text-xs text-gray-500">(Click to download)</span>
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reactions Section */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <span className="text-gray-600">Reactions:</span>
          {post.reaction_counts.map((reaction) => (
            <div
              key={reaction.reaction}
              className="flex items-center space-x-1"
            >
              <span className="text-sm text-gray-800">
                {reaction.reaction === "like" ? "👍" : "❤️"}
              </span>
              <span className="text-sm text-gray-700">
                {reaction.count}
              </span>
            </div>
          ))}
        </div>

        {/* User Reaction */}
        {post.user_reaction && (
          <div className="text-sm text-gray-600">
            You reacted with{" "}
            {post.user_reaction === "like" ? "👍" : "❤️"}
          </div>
        )}
      </div>
    </div>
  );
}