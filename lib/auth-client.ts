import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

export const authClient = createAuthClient({
    baseURL: baseURL, // Base URL of your Better Auth backend.
    plugins: [
        expoClient({
            scheme: "tnsnet-tasknet",
            storagePrefix: "tnsnet-tasknet",
            storage: SecureStore,
        })
    ]
});