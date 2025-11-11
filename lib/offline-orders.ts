import AsyncStorage from "@react-native-async-storage/async-storage";


/**
 * Guarda una orden pendiente localmente
 */
export const savePendingOrder = async (orderId: string, data: any) => {

    try {
        const existing = JSON.parse(await AsyncStorage.getItem("pendingOrders") || "[]");
        const updated = existing.filter((o: any) => o.orderId !== orderId);
        updated.push({ orderId, data, timestamp: Date.now() });
        await AsyncStorage.setItem("pendingOrders", JSON.stringify(updated));
    } catch (e) {
        console.error("Error al guardar pendiente:", e);
    }
};

/**
 * Sincroniza todas las órdenes pendientes si hay conexión
 */
export const syncPendingOrders = async (
    baseURL: string,
    organizationSlug: string,
    authClient: any,
    isOnline: boolean
) => {
    if (!isOnline) return;
    try {
        const stored = JSON.parse(await AsyncStorage.getItem("pendingOrders") || "[]");
        if (!stored.length) return;

        const remaining: any[] = [];

        for (const { orderId, data } of stored) {
            try {
                const res = (await authClient.$fetch(
                    `${baseURL}/api/v1/${organizationSlug}/orders/${orderId}`,
                    {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(data),
                    }
                )) as { data: any };

            } catch (err: any) {
                remaining.push({ orderId, data });
            }
        }

        await AsyncStorage.setItem("pendingOrders", JSON.stringify(remaining));
    } catch (e) {
        console.error("Error al sincronizar pendientes:", e);
    }
};
