import axios from "axios";
import {io} from "socket.io-client"
const BACKEND_URL =process.env.NODE_ENV == "production"?"https://backend_exp.bahwebdev.com":"http://localhost:5000";
const DJANGO_URL =  process.env.NODE_ENV=="production"?"https://backend.bahwebdev.com":"http://localhost:8000";
const axiosInstance = axios.create({
    baseURL:DJANGO_URL,
    headers:{
    }
})
const SOCKET_URL =
process.env.NODE_ENV === "production"
  ? "wss://backend_exp.bahwebdev.com" // Use "wss://" for production (secure WebSocket)
  : "ws://localhost:5000"; // Use "ws://" for development

const socket = io(SOCKET_URL);

export const socketClient=socket


axiosInstance.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem('access') || sessionStorage.getItem("access");
    if (accessToken) {
        config.headers['Authorization'] = "Bearer " + accessToken;
    }

    // Add Content-Type only for non-FormData requests
    if (!(config.data instanceof FormData)) {
        config.headers['Content-Type'] = 'application/json';
    }

    return config;
});
const authentificatedApi = axiosInstance;

class DjangoApi {
    constructor() {
        this.url = DJANGO_URL;
    }

    async register(formData) {
        const response = await axios.post(this.url + "/api/user/register/", formData, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response;
    }

    async login(formData) {
        const rememberMe = formData.rememberMe;
        delete formData.rememberMe;
        if( formData.username.includes("@")){
            formData.email=formData.username
            delete formData.username
        }
        console.log(formData)
        const response = await axios.post(this.url + "/api/token/", formData, {
            headers: {
                "Content-Type": 'application/json'
            }
        });
        const { refresh, access } = response.data;
        if (rememberMe) {
            localStorage.setItem("refresh", refresh);
            localStorage.setItem("access", access);
        } else {
            sessionStorage.setItem("refresh", refresh);
            sessionStorage.setItem("access", access);
        }
        return response;
    }

    logout() {
        localStorage.clear();
        sessionStorage.clear();
    }
    async deleteUser(username) {
        try {
            const response = await authentificatedApi.delete(
                "/api/users/delete/",
                { data: { username: username } }  // DELETE with body requires `data`
            );
            return response.data;
        } catch (error) {
            console.error("Delete failed:", error.response?.data);
            throw error;
        }
    }
    mixFriendsRelationships(friends, relationships) {
        const result = [];
        // Get the current username directly (no JSON.parse needed)
        const currentUser = sessionStorage.getItem('username') || localStorage.getItem('username');

        relationships.forEach(relationship => {
            // Determine which user in the relationship is the friend (not the current user)
            const friend = relationship.sender.username === currentUser
                ? relationship.receiver
                : relationship.sender;

            // Find this friend in the friends list
            const matchedFriend = friends.data.find(f => f.username === friend.username);

            if (matchedFriend) {
                result.push({
                    ...matchedFriend,
                    relationship_id: relationship.id,
                    status: relationship.status
                });
            }
        });

        return result;
    }
    async getFriends() {
        try {
            const response = await authentificatedApi.get("/api/friends/");
            console.log(response)
            const relationships = await this.listUserRelationships();
            console.log(relationships)

            // Ensure friends.data is an array
            const friendsData = Array.isArray(response.data) ? response.data : [];

            const mixedFriends = this.mixFriendsRelationships(
                { data: friendsData },
                Array.isArray(relationships) ? relationships : []
            );

            return mixedFriends;
        } catch (e) {
            console.error("Friends fetch error:", e);
            return [];
        }
    }

    async listUserRelationships(){
        const response = await authentificatedApi.get(this.url+"/api/relationships/")
        console.log(response)
        return response.data.results

    }
    async listAllUsers(page = null) {
        try {
            const response = !page
                ? await authentificatedApi.get(this.url + "/api/users/")
                : await authentificatedApi.get(this.url + `/api/users/?page=${page}`);
            console.log('response ', response);
            return response;
        } catch (e) {
            console.error("Error fetching users:", e);
            return [];
        }
    }
    async unfriend(relationship_id){
        try {
            const response = await authentificatedApi.post(
                this.url+'/api/relationships/'+relationship_id+"/unfriend/"

            )
            console.log(response);
            return response.data;
    }catch(e){
        console.error(e)
    }
}
    async sendFriendRequest(sender, receiver){
        try{
            const response = await authentificatedApi.post(this.url+"/api/relationships/", {
                sender_id: sender,
                receiver_id: receiver
                })
                return response.data
        }catch(e){
            console.error("Error sending friend request:", e);
            return false;

        }
    }

    async getPendingFriendRequests(){
        try{
            const response = await authentificatedApi.get(this.url+'/api/friends/pending_requests/')
            return Array.isArray(response.data)?response.data:[]

        }catch(e){
            console.error(e)
        }
    }
    async respondToQuestion(username, answer){
        try{
            const response = await authentificatedApi.post(this.url+"/api/user/verify-answer/",{
                username:username,
                answer:answer
            })
            console.log(response)
            return response
        }catch(e){
            console.error(e)
            throw e
        }
    }
    async changePassword(username, answer, new_password, confirm_password){
        try{
            const response = await authentificatedApi.post(this.url+"/api/user/password-reset/",
                {
                    username:username,
                    answer:answer,
                    new_password:new_password,
                    confirm_password:confirm_password
                }
            )
            console.log(response)
            return response
        }
        catch(e){
            console.error(e)
            throw e
        }
    }
    async acceptFriendRequest(request_id){
        try{
            const response = await authentificatedApi.post(this.url+"/api/relationships/"+request_id+"/accept/")
            return response.data





        }catch(e){
            console.error(e)
        }



    }
    async declineFriendRequest(request_id){
        try{
            const response = await authentificatedApi.post(this.url+"/api/relationships/"+request_id+"/reject/")
                return response.data
                }catch(e){
                    console.error(e)
                    }




}
async checkSecurityQuestion(username){
    try{
        const response = await authentificatedApi.post(this.url+"/api/user/check-security/",
            {username}
        )
        console.log(response)
        return response
    }
    catch(error){ // Changed 'e' to 'error' to match the variable used below
        if (error.response?.status === 404) {
            // Convert 404 to a specific error that we can handle
            throw {
                response: {
                    status: 404,
                    data: { message: "No security question found" }
                }
            };
        }
        throw error;
    }
}
async createSecurityQuestion(question, answer){
    try{
        const response = await authentificatedApi.post(this.url+"/api/user/security-question/",{
            question:question,
            answer:answer
        })
        console.log(response)
        return response

    }
    catch(e){
        console.error(e)
    }
}
async makePost(formData) {
    try {
        const response = await authentificatedApi.post(
            `${this.url}/api/posts/`,
            formData  // Let axios handle headers automatically
        );
        console.log("FOCUS",response)

        return response.data;
    } catch (e) {
        console.error("Post creation failed:", e.response?.data || e.message);
        throw e;
    }
}
async react(data){
    try{
        const response = await authentificatedApi.post(this.url+'/api/reactions/react/',{
            post:data.post_id,
            reaction:data.reaction_type
        })
        console.log(response)
        return response
    }catch(e){
        console.error(e)
    }

}
async editPost(postData){
    try{
        const response = await authentificatedApi.put(this.url+`/api/posts/${id}/`,
            {title:postData.title,
                content:postData.content,
            }
        )
    }catch(e){
        console.error(e)
    }
}
async getCurrentPosts(){
    try{
        const response = await authentificatedApi.get(this.url+"/api/posts/my_posts/")
        console.log(response)
        return response
}catch(e){
    console.error(e)
}}
async getSpecificUserPosts(userId){
    try{
        const response = await authentificatedApi.get(this.url+"/api/posts/user/"+userId+'/')
        console.log(response)
        return response
        }catch(e){
            console.error(e)
            }
}
async getMyReactionToPost(postId){
    try{
        const response = await authentificatedApi.get(this.url+'/api/reactions/?post='+postId+'/');
        console.log("FOCUS",response)
        return response
    }catch(e){console.error(e)}
}
async updatePost(postId,updatedPost){
    try{
        const response = await authentificatedApi.put(this.url+"/api/posts/"+postId+"/",
            {title:updatedPost.title,
                content:updatedPost.content,
                }
        )
        console.log(response)
        return response
        }catch(e){
            console.error(e)
            }
}
async deletePost(postId){
    try{
        const response = await authentificatedApi.delete(this.url+"/api/posts/"+postId+"/")
        console.log(response)
        return response
        }catch(e){
            console.error(e)
            }
}


async unreact(postId){
    try{
    await authentificatedApi.post(this.url+'/api/reactions/unreact/',
        {post:postId}
    )}catch(e){
        console.log(e)
    }
}


async comment(content,post, parent=null){
    try{
        const response = parent?await authentificatedApi.post(this.url+"/api/comments/",
            {content:content,
                post:post,
                parent:parent
            }):
            await authentificatedApi.post(this.url+"/api/comments/",
                {content:content,
                    post:post
                    }
                    )
                    console.log(response)


    }
    catch(e){
        console.error(e)
        }
}

async getCommentsForPost(postId){
    try{
        const response = await authentificatedApi.get(this.url+'/api/comments/post/'+postId)
        console.log(response)
        return response
    }
    catch(e){
        console.error(e)
    }

}
async getReactionsToPost(post){
    try{
        const response = await authentificatedApi.get(this.url+'/api/posts/'+post+"/reactions/")
        console.log(response)
        return response


    }catch(e){
        console.log(e)
    }
}

async deleteAttachment(attachmentId){
    try{
        const response = await authentificatedApi.delete(this.url+"/api/attachments/"+attachmentId+"/")
        console.log(response)
        return response
    }catch(e){
        console.error(e)
    }
}

async addAttachment(file, postId) {
    const formData = new FormData();
    formData.append('post', postId);
    formData.append('file', file);

    try {
      const response = await authentificatedApi.post(
        `${this.url}/api/attachments/`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data', // Let axios set boundary automatically
          },
        }
      );
      return response.data;
    } catch (e) {
      console.error('Attachment upload failed:', e);
      throw e;
    }
  }











}




class ExpressApi {
    constructor() {
        this.url = BACKEND_URL;
    }

    async createConversation(userIds){
        const response = await axios.post(this.url+"/api/conversations",{
            userIds:userIds
        })
        return response
    }
    async verifyExistance(userIds){
        try{
            const response = await axios.post(this.url+"/api/conversations/verify", {
                userIds:userIds
            })
            console.log(response)
            return response
        }
        catch(e){
            console.error(e)
            try{
                const response = await this.createConversation(userIds);
                console.log(response)
                return response
            }
            catch(e){
                console.error(e)
                return false
            }
        }

    }
    async getMessagesInAGivenConvo(conversationId){
        try{
            const response = await axios.get(this.url+'/api/conversations/'+conversationId+"/messages");
            if (response?.data){
                console.log(response)
                return response.data
            }
        }catch(e){
            console.error(e)
        }
    }

}

export const djangoApi = new DjangoApi();
export const expressApi = new ExpressApi();
