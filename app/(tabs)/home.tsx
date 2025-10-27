import { authClient } from "@/lib/auth-client";
import { router } from "expo-router";
import { useEffect } from "react";

export default function Home() {
  const {data: session, isPending} = authClient.useSession();

  useEffect(() => {
      if (!isPending && !session) {
        router.replace("/login");
      }
    }, [isPending, session]);
    
}