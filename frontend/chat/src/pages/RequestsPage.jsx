import { useState, useEffect } from "react";
import { djangoApi } from "../api";

export default function RequestsPage() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const getReqs = async() => {
            setLoading(true);
            try {
                const res = await djangoApi.getPendingFriendRequests();
                setRequests(res);
                console.log("res,data", res);
                setError(null);
            } catch(err) {
                console.log(err);
                setError("Failed to load friend requests");
            } finally {
                setLoading(false);
            }
        }
        getReqs()
    }, []);

    useEffect(() => {
        console.log(requests)
    }, [requests]);

    const handleAccept = async (id) => {
        try {
            await djangoApi.acceptFriendRequest(id);
            setRequests(requests.filter(req => req.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    const handleDecline = async (id) => {
        try {
            await djangoApi.declineFriendRequest(id);
            setRequests(requests.filter(req => req.id !== id));
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Friend Requests</h2>

            {loading ? (
                <div className="text-gray-600 py-4">Loading requests...</div>
            ) : error ? (
                <div className="bg-red-100 text-red-600 p-3 rounded-md mb-4">
                    {error}
                </div>
            ) : requests.length === 0 ? (
                <p className="text-gray-600 py-4">You don't have any pending friend requests.</p>
            ) : (
                <ul className="divide-y divide-gray-200">
                    {requests.map((req, index) => (
                        <li key={index} className="py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
                            <p className="font-medium text-gray-800 mb-2 sm:mb-0">
                                {req.sender.username}
                            </p>
                            <div className="flex space-x-2">
                                <button
                                    onClick={() => handleAccept(req.id)}
                                    className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                                >
                                    Accept
                                </button>
                                <button
                                    onClick={() => handleDecline(req.id)}
                                    className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
                                >
                                    Decline
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
