
import { useState } from "react";
import { djangoApi } from "../../api";
export default function Comment({parentId, postId}){
    const [comment, setComment] = useState("");

    const handleChange = (e) =>{
        setComment(e.target.value);

    }

    const handleSubmit = async(e) => {
        e.preventDefault();
        try{
            const parent = parentId ? parentId:null; 
            const response = djangoApi.comment(comment, post, parent);
        }catch(e){
            console.log(e);
        }
    }


    return 
    (
        <div>
            <form onSubmit={handleSubmit}>
                <input type="text" placeholder="Comment" onChange={handleChange}/>
            </form>

        </div>




    )

}