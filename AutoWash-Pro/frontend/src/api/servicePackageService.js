import axiosClient from "./axiosClient";

export const getActiveServices = () =>
    axiosClient.get("/service-packages/active");