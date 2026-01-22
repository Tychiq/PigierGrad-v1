import { Suspense } from "react";
import CallbackClient from "./callback-client";

export default function CallbackPage() {
    return (
        <Suspense fallback={<div>Connexion...</div>}>
            <CallbackClient />
        </Suspense>
    );
}
