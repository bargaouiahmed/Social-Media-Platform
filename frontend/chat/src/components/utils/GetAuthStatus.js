export default function GetAuthStatus() {
    let refresh = localStorage.getItem("refresh") || sessionStorage.getItem("refresh");
    let access = localStorage.getItem("access") || sessionStorage.getItem("access");

    if (!refresh || !access) {
        throw new Error("Authentication status is missing");
    }

    return { access, refresh };
}
