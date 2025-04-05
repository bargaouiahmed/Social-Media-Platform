
import { useState, useEffect } from "react"
import {jwtDecode} from "jwt-decode"
import GetAuthStatus from "../components/utils/GetAuthStatus"
export default function AuthentificationTest(){
    const [decoded, setDecoded] = useState({})
    useEffect(()=>{
        try{
            const {access, refresh} = GetAuthStatus();
            console.log(jwtDecode(access))
        }catch(e){
            console.error(e)
        }
    })
    return (
        <div>
            <h1>
                you are authentificated, your decoded jwt token is:
            </h1>

        </div>
    )
}
