import { djangoApi } from "../../api";

export default async function feedFetching(friends){
    let feed = []
    console.log(friends)
    for (let friend of friends){
        let friendId=friend.id
        let friendPosts = await djangoApi.getSpecificUserPosts(friendId)
        feed.push(...friendPosts.data   )
    }
    return feed
}
