import { Outlet, Navigate } from "react-router-dom";
import GetAuthStatus from "./GetAuthStatus";
import { jwtDecode } from "jwt-decode";


export default function ProtectedRoute(){
    let user = null;
    try{
        const {access, refresh} = GetAuthStatus()
        if(access,refresh){
            user=true
        }
        const userData = jwtDecode(access)
        const keysToSet = ['user_id',"first_name", "last_name","username","email"]
        for (let key in userData){
            if(keysToSet.includes(key)){
                sessionStorage.setItem(key,userData[key])
            }

        }
    }catch(e){
        console.error(e)
    }
    return user?<Outlet/>:<Navigate to="/login"/>
}
