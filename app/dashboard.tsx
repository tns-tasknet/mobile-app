import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useEffect } from "react";
import { Button, Text, View } from "react-native";

export default function Dashboard() {
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (!session && !isPending) {
            router.push("/login");
        }
    }, [session, isPending]);

    const handleLogout = async () => {
        await authClient.signOut()
    };

    const goToOrganizations = () => {
        router.push("/organizations");
    };


    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <Text>Hello `{session?.user.name}`.</Text>
            <Button title="Logout" onPress={handleLogout} />
            <Button title="Organizations" onPress={goToOrganizations} />
        </View>
    )
}