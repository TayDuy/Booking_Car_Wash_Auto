import axiosClient from "./axiosClient";

const vehicleApi={

    list:()=>axiosClient.get("/vehicles"),

    get:(id)=>axiosClient.get(`/vehicles/${id}`),

    create:(data)=>axiosClient.post("/vehicles",data),

    update:(id,data)=>axiosClient.put(`/vehicles/${id}`,data),

    delete:(id)=>axiosClient.delete(`/vehicles/${id}`)
}

export default vehicleApi;