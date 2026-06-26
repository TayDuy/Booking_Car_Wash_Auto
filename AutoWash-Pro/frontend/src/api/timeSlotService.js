import axiosClient from "./axiosClient";

export const getAvailableSlots = (branchId,date)=>

    axiosClient.get("/time-slots/available",{
        params:{
            branchId,
            date
        }
    });