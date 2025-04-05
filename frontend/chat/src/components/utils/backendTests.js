
import { djangoApi } from "../../api";




export const massHandlerTest =async () =>{
    for (let i =10 ;i<1000;i++){
        const username = `test${i}`
        const password = `test${i}isHere`
        const email = `test${i}@test.com`
        const password2 = `test${i}isHere`

        const data = {
            username,
            password,
            email,
            password2

        }

        await djangoApi.register(data)
    }



}
export const massDelete = async() =>{
    for (let i =0;i<1000;i++){
       try{ const username = `test${i}`
        await djangoApi.deleteUser(username)
    }catch(e){
        continue
    }
}}
