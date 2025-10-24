import { authClient } from "@/lib/auth-client";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Text, View } from "react-native";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

export default function OrganizationReport() {
    const { reportId, slug } = useLocalSearchParams();
    const { data: session, isPending } = authClient.useSession();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);


    useEffect(() => {
        if (isPending) return;
        if (!session) {
            console.log("No hay sesión activa, redirigiendo al login...");
            router.push("/login");
            return;
        }
        const fetchReports = async () => {
            try {
                console.log(reportId);
                setLoading(true);
                setErrorMsg(null);

                const res = await authClient.$fetch<any[]>(`${baseURL}/api/v1/${slug}/reports/${reportId}`, {
                    method: "GET",
                });

                if (res.error) {
                    throw new Error(res.error.message || "Error desconocido");
                }

                if (res.data) {
                    console.log("Detalles:", res.data);
                    setReports(res.data);
                } else {
                    setReports([]);
                }
            } catch (err: any) {
                console.error("Error al obtener los detalles:", err);
                setErrorMsg(err.message || "Error desconocido");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [session, isPending]);

    if (loading) return <Text>Cargando Detalles...</Text>;
    if (errorMsg) return <Text>Error: {errorMsg}</Text>;

    return (
        <View>
                <Text>Error.</Text>
        </View>

    );
}
