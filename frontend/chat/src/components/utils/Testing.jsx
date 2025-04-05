
import { djangoApi } from "../../api";
import { massHandlerTest, massDelete } from "./backendTests";

export default function Testing(){
    const testRelationships = async () =>{
        const data = await djangoApi.listUserRelationships();
        console.log(data)
    }
    const testALlUsersEndpoint = async() =>{
        const data = await djangoApi.listAllUsers();
        console.log(data)
    }

    return (
        <>
        <button onClick={testRelationships}>test relationships</button>
        <button onClick={testALlUsersEndpoint}>test all users endpoint</button>
        <button onClick={massHandlerTest}>mass handler test</button>
        <button onClick={massDelete}>mass delete</button>
        </>
    )

}
