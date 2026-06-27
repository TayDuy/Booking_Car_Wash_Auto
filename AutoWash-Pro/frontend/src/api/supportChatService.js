import axiosClient from "./axiosClient";

export const askSupportChat = async (message, history = []) => {
    const response = await axiosClient.post("/support/chat", { message, history });
    return response.data?.data?.reply ?? "";
};