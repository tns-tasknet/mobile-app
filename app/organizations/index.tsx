import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

export default function Index() {
    const { data: session, isPending } = authClient.useSession();
    const [organizations, setOrganizations] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (isPending) return;
        if (!session) {
            console.log("No hay sesión activa, redirigiendo al login...");
            router.push("/login");
            return;
        }

        const fetchOrganizations = async () => {
            try {
                setLoading(true);
                setErrorMsg(null);

                const res = await authClient.$fetch<any[]>(`${baseURL}/api/v1/organizations`, {
                    method: "GET",
                });

                if (res.error) {
                    throw new Error(res.error.message || "Error desconocido");
                }

                if (res.data) {
                    console.log("Organizaciones:", res.data);
                    setOrganizations(res.data);
                } else {
                    setOrganizations([]);
                }
            } catch (err: any) {
                console.error("Error al obtener organizaciones:", err);
                setErrorMsg(err.message || "Error desconocido");
            } finally {
                setLoading(false);
            }
        };

        fetchOrganizations();
    }, [session, isPending]);

    if (loading) return <Text>Cargando organizaciones...</Text>;
    if (errorMsg) return <Text>Error: {errorMsg}</Text>;

    return (
        <View>
            {organizations.length > 0 ? (
                organizations.map((org, index) => (
                    <Text key={index}>{JSON.stringify(org)}</Text>
                ))
            ) : (
                <Text>No hay organizaciones disponibles.</Text>
            )}
        </View>
    );
}
