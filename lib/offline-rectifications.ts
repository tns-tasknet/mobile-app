import AsyncStorage from "@react-native-async-storage/async-storage";


/**
 * Guarda una orden pendiente localmente
 */
export const savePendingRectification = async (reportId: string, data: any) => {

    try {
        const existing = JSON.parse(await AsyncStorage.getItem("pendingRectifications") || "[]");
        const updated = existing.filter((o: any) => o.reportId !== reportId);
        updated.push({ reportId, data, timestamp: Date.now() });
        await AsyncStorage.setItem("pendingRectifications", JSON.stringify(updated));
    } catch (e) {
        console.error("Error al guardar pendiente:", e);
    }
};

/**
 * Sincroniza todas las órdenes pendientes si hay conexión
 */
export const syncPendingRectification = async (
    baseURL: string,
    organizationSlug: string,
    authClient: any,
    isOnline: boolean
) => {
    if (!isOnline) return;
    try {
        const stored = JSON.parse(await AsyncStorage.getItem("pendingRectifications") || "[]");
        if (!stored.length) return;

        const remaining: any[] = [];

        for (const { reportId, data } of stored) {
            try {
                const res = (await authClient.$fetch(
                    `${baseURL}/api/v1/${organizationSlug}/reports/${reportId}/corrections`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                    }
                )) as { data: any };

            } catch (err: any) {
                remaining.push({ reportId, data });
            }
        }

        await AsyncStorage.setItem("pendingRectifications", JSON.stringify(remaining));
    } catch (e) {
        console.error("Error al sincronizar pendientes:", e);
    }
};
