import { useParams } from "react-router-dom";
import DProfileShow from "./DProfileShow";
import DProfilePosts from "./DProfilePosts";

export default function DProfilePage() {
  const { userId } = useParams();

  return (
    <div className="bg-gradient-to-b from-blue-100 via-blue-50 to-white min-h-screen pb-8 sm:pb-16">
      <div className="container mx-auto px-3 sm:px-4 md:px-6 pt-5 sm:pt-10 space-y-6 sm:space-y-10">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-blue-800 mb-4 sm:mb-8 animate-fade-in">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-800 to-indigo-600">Profile</span>
        </h1>
        
        {/* Profile card with subtle animation and shadow */}
        <div className="max-w-4xl mx-auto transform transition-all duration-300 hover:scale-[1.01] px-1 sm:px-0">
          {userId && <DProfileShow userId={userId} />}
        </div>
        
        {/* Posts section with improved spacing */}
        <div className="max-w-4xl mx-auto mt-6 sm:mt-12 px-1 sm:px-0">
          <h2 className="text-xl sm:text-2xl font-semibold text-center md:text-left text-blue-700 mb-4 sm:mb-8 border-b border-blue-200 pb-2">
            Activity & Posts
          </h2>
          <DProfilePosts userId={userId} />
        </div>
      </div>
    </div>
  );
}
