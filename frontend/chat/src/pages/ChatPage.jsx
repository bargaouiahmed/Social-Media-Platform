import { useState } from "react";
import ChatSideBar from "./ChatSideBar";
import ConversationMainSection from "./ConversationMainSection";

export default function ChatPage() {
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleSelectConversation = (conversationId, friend) => {
    setActiveConversationId(conversationId);
    setSelectedFriend(friend);
    setSidebarOpen(false);
  };

  const updateConversations = (newConversations) => {
    setConversations(newConversations);
    if (!activeConversationId && newConversations.length > 0) {
      setActiveConversationId(newConversations[0]._id || newConversations[0].id);
      setSelectedFriend(newConversations[0].friend);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden">
      {/* Mobile header */}
      <div className="lg:hidden bg-blue-900 p-3 flex justify-between items-center">
        <h1 className="text-lg font-bold truncate">
          {selectedFriend ? `Chat with ${selectedFriend.username}` : "Chat App"}
        </h1>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="text-white focus:outline-none"
          aria-label="Toggle sidebar"
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
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div
          className={`fixed lg:static inset-y-0 left-0 z-30 w-64 bg-gray-900 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
            sidebarOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <ChatSideBar
            onSelectConversation={handleSelectConversation}
            onConversationsUpdate={updateConversations}
            activeConversationId={activeConversationId}
            onClose={() => setSidebarOpen(false)}
          />
        </div>

        {/* Main chat area */}
        <div className="flex-1 flex flex-col bg-gray-900">
          {selectedFriend ? (
            <>
              <div className="bg-blue-800 text-white p-3 border-b border-blue-700 flex items-center">
                <button
                  onClick={() => setSidebarOpen(true)}
                  className="mr-2 lg:hidden text-white focus:outline-none"
                  aria-label="Open sidebar"
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
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                </button>
                <div className="flex items-center min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-sm font-bold mr-2">
                    {selectedFriend.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-semibold truncate">{selectedFriend.username}</h2>

                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden bg-gray-800">
                <ConversationMainSection conversationId={activeConversationId} />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-gray-800 text-gray-400 p-6">
              <svg
                className="w-14 h-14 mb-4 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p className="text-center mb-4">Select a conversation to start chatting</p>
              <button
                onClick={() => setSidebarOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors lg:hidden"
              >
                Open Friends List
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
