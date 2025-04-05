import { djangoApi } from "../api";
import { useNavigate } from "react-router-dom";
import { dispatchAuthEvent, AUTH_EVENTS } from "./authEvents";
export default function LogOutC() {
    const navigate=useNavigate()
    const logout = () => {
        djangoApi.logout()
        dispatchAuthEvent(AUTH_EVENTS.LOGOUT)
        navigate('/login')

    }

    return (
        <div className="logout">
            <button
                onClick={logout}
                className="py-2 px-4 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
            >
                Log out
            </button>
        </div>
    )
}
