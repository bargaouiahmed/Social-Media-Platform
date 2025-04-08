import { useState, useEffect } from "react";
import { djangoApi, expressApi } from "../api";
import { jwtDecode } from "jwt-decode";

export default function ChatSideBar({ onSelectConversation, onConversationsUpdate, activeConversationId, onClose }) {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [conversations, setConversations] = useState([]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const friendsData = await djangoApi.getFriends();
      if (friendsData) {
        const uniqueFriends = Array.from(
          new Map(friendsData.map((friend) => [friend.id, friend])).values()
        );
        setFriends(uniqueFriends);
      }
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setError(err);
    }
  };

  const establishConnection = async () => {
    if (friends.length === 0) return;

    const currentUserId = jwtDecode(
      sessionStorage.getItem("access") || localStorage.getItem("access")
    ).user_id;

    const newConversations = [];

    for (let friend of friends) {
      const friendId = friend.id;
      try {
        const conversation = await expressApi.verifyExistance([currentUserId, friendId]);
        if (conversation) {
          newConversations.push({
            ...conversation.data,
            friend
          });
        }
      } catch (err) {
        console.error("No conversation found for friend:", friend.username);
      }
    }

    setConversations(newConversations);
    if (onConversationsUpdate) onConversationsUpdate(newConversations);
  };

  useEffect(() => {
    fetchFriends();
  }, []);

  useEffect(() => {
    if (friends.length > 0 && !isConnecting) {
      setIsConnecting(true);
      establishConnection().finally(() => setIsConnecting(false));
    }
  }, [friends]);

  const handleSelectChat = (friend) => {
    const conversation = conversations.find(
      (conv) => conv.friend && conv.friend.id === friend.id
    );

    if (conversation) {
      const conversationId = conversation._id || conversation.id;
      onSelectConversation(conversationId, friend);
    }
    if (onClose) onClose();
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white overflow-y-auto p-3">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold">Friends</h2>
        <button
          className="text-gray-400 hover:text-white lg:hidden"
          onClick={onClose}
          aria-label="Close sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {loading && <p className="text-gray-400 text-center py-4">Loading friends...</p>}
      {error && <p className="text-red-500 text-center py-4">Error loading friends.</p>}
      {friends.length === 0 && !loading && !error && (
        <p className="text-gray-400 text-center py-4">No friends available.</p>
      )}

      <ul className="space-y-2">
        {friends.map((friend) => {
          const conversation = conversations.find(
            (conv) => conv.friend && conv.friend.id === friend.id
          );
          const conversationId = conversation ? (conversation._id || conversation.id) : null;
          const isActive = activeConversationId === conversationId;

          return (
            <li
              key={friend.id}
              className={`flex items-center justify-between p-2 ${
                isActive ? "bg-blue-700" : "bg-gray-800"
              } rounded-lg hover:bg-gray-700 transition-colors cursor-pointer`}
              onClick={() => handleSelectChat(friend)}
            >
              <div className="flex items-center min-w-0">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold mr-2 shrink-0">
                  {friend.username.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold truncate">{friend.username}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {friend.status === "accepted" ? "Online" : "Pending"}
                  </p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
