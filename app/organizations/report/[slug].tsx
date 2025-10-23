import { authClient } from "@/lib/auth-client";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Button, Text, View } from "react-native";

const baseURL = process.env.EXPO_PUBLIC_API_URL;

export default function OrganizationReport() {
    const { slug } = useLocalSearchParams();
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
                setLoading(true);
                setErrorMsg(null);

                const res = await authClient.$fetch<any[]>(`${baseURL}/api/v1/${slug}/reports`, {
                    method: "GET",
                });

                if (res.error) {
                    throw new Error(res.error.message || "Error desconocido");
                }

                if (res.data) {
                    console.log("Reportes:", res.data);
                    setReports(res.data);
                } else {
                    setReports([]);
                }
            } catch (err: any) {
                console.error("Error al obtener los reportes:", err);
                setErrorMsg(err.message || "Error desconocido");
            } finally {
                setLoading(false);
            }
        };

        fetchReports();
    }, [session, isPending]);

    if (loading) return <Text>Cargando organizaciones...</Text>;
    if (errorMsg) return <Text>Error: {errorMsg}</Text>;

    const goToReportDetails = (reportId: any) => {
        router.push(`/organizations/report/details/${reportId}`);
    };

    return (
        <View>
            {reports.length > 0 ? (
                reports.map((report, index) => (
                    <View key={index} style={{ marginBottom: 10 }}>
                        <Text>ID: {JSON.stringify(report)}</Text>
                        <Button
                            title="Ver detalles"
                            onPress={() => goToReportDetails(report.id)}
                        />
                    </View>
                ))
            ) : (
                <Text>No hay reportes disponibles.</Text>
            )}
        </View>

    );
}
