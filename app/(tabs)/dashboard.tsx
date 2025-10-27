import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function Dashboard() {
    const { data: session, isPending } = authClient.useSession();

    useEffect(() => {
        if (!session && !isPending) {
            router.replace("/login");
        }
    }, [session, isPending]);

    const handleLogout = async () => {
        await authClient.signOut()
    };

    const goToOrganizations = () => {
        router.push("/organizations");
    };

    return (
        <View style={styles.container}>
            <Text style={styles.saludo}>Hola! {session?.user.name}.</Text>
            <View style={styles.buttons}>
                <Pressable onPress={goToOrganizations} style={styles.button}>
                    <Text style={styles.buttonText}>Organizaciones</Text>
                </Pressable>
                <Pressable onPress={handleLogout} style={styles.button}>
                    <Text style={styles.buttonText}>Cerrar Sesion</Text>
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#273F7D",
    },
    saludo: {
        fontSize: 24,
        color: "#FAF9F6",
    },
    buttons: {
        marginTop: 20,
        flexDirection: "row",
        gap: 10,
    },
    button: {
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 6,
        backgroundColor: '#3862CC',
    },
    buttonText: {
        color: "#FAF9F6",
        fontSize: 16,
        textAlign: "center",
    },
});