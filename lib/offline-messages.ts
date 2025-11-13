import AsyncStorage from "@react-native-async-storage/async-storage";


/**
 * Guarda una orden pendiente localmente
 */
export const savePendingMessages = async (orderId: string, data: any) => {

    try {
        const existing = JSON.parse(await AsyncStorage.getItem("pendingMessages") || "[]");
        const updated = existing.filter((o: any) => o.orderId !== orderId);
        updated.push({ orderId, data, timestamp: Date.now() });
        await AsyncStorage.setItem("pendingMessages", JSON.stringify(updated));
    } catch (e) {
        console.error("Error al guardar pendiente:", e);
    }
};

/**
 * Sincroniza todas las órdenes pendientes si hay conexión
 */
export const syncPendingMessages = async (
    baseURL: string,
    organizationSlug: string,
    authClient: any,
    isOnline: boolean
) => {
    if (!isOnline) return;
    try {
        const stored = JSON.parse(await AsyncStorage.getItem("pendingMessages") || "[]");
        if (!stored.length) return;

        const remaining: any[] = [];

        for (const { orderId, data } of stored) {
            try {
                const res = (await authClient.$fetch(
                    `${baseURL}/api/v1/${organizationSlug}/orders/${orderId}/messages`,
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                    }
                )) as { data: any };

            } catch (err: any) {
                remaining.push({ orderId, data });
            }
        }

        await AsyncStorage.setItem("pendingMessages", JSON.stringify(remaining));
    } catch (e) {
        console.error("Error al sincronizar pendientes:", e);
    }
};
