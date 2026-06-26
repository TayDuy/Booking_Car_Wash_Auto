import axiosClient from "./axiosClient";

export const getBranches = async () => {
   return axiosClient.get("/branches");
};