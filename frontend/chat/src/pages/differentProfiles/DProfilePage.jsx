import {useParams} from "react-router-dom";
import { useEffect, useState } from "react";
import DProfileShow from "./DProfileShow";
import DProfilePosts from "./DProfilePosts";
export default function DProfilePage(){
    const { userId } = useParams();





    return (<>
        <div className="flex flex-col items-center justify-center h-screen">
            <h1 className="text-3xl font-bold mb-4">Profile Page</h1>
            {userId && <DProfileShow userId={userId} />}
        </div>

        <div>
            <DProfilePosts userId={userId} />
        </div>
        
        
        
        
        
        
        
        </>
        
    );
}
