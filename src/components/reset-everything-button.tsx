"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { Button } from "@/components/ui/button";

import {
    Trash2,
    AlertTriangle,
    RefreshCcw
} from "lucide-react";

import { toast } from "sonner";

import { useRouter } from "next/navigation";

interface ResetEverythingButtonProps {

    diplomaType: string;

    target:
        | "planning"
        | "directors"
        | "jury";
}

export function ResetEverythingButton({
                                          diplomaType = "",
                                          target
                                      }: ResetEverythingButtonProps) {

    const [loading, setLoading] = useState(false);

    const router = useRouter();

    // ===== SAFE NORMALIZER =====

    const normalize = (
        value?: string | null
    ) =>
        String(value || "")
            .trim()
            .replace(/\s+/g, " ")
            .toUpperCase();

    const handleReset = async () => {

        if (!diplomaType) {

            toast.error(
                "Type de diplôme non spécifié"
            );

            return;
        }

        setLoading(true);

        try {

            const normalizedDiploma =
                normalize(diplomaType);

            // ============================================
            // FETCH MATCHING IDS SAFELY
            // ============================================

            const {
                data: soutenances,
                error: fetchError
            } = await supabase
                .from("soutenances")
                .select(`
                    id,
                    diploma_type
                `);

            if (fetchError) {
                throw fetchError;
            }

            const matchingIds =
                (soutenances || [])
                    .filter(item =>
                        normalize(item.diploma_type)
                        ===
                        normalizedDiploma
                    )
                    .map(item => item.id);

            if (matchingIds.length === 0) {

                toast.error(
                    "Aucune donnée trouvée."
                );

                return;
            }

            // ============================================
            // PLANNING RESET
            // ============================================

            if (target === "planning") {

                const {
                    error: deleteError
                } = await supabase
                    .from("soutenances")
                    .delete()
                    .in("id", matchingIds);

                if (deleteError) {
                    throw deleteError;
                }

                // ===== DELETE RELATED NOTIFICATIONS =====

                await supabase
                    .from("notifications")
                    .delete()
                    .ilike(
                        "message",
                        `%${diplomaType}%`
                    );

                toast.success(
                    `Toutes les soutenances ${normalizedDiploma} ont été supprimées.`
                );
            }

                // ============================================
                // DIRECTORS RESET
            // ============================================

            else if (target === "directors") {

                const {
                    error: directorsError
                } = await supabase
                    .from("soutenances")
                    .update({

                        directeur: "",
                        grade_directeur: "",

                        codirecteur: "",
                        grade_codirecteur: ""
                    })
                    .in("id", matchingIds);

                if (directorsError) {
                    throw directorsError;
                }

                toast.success(
                    `Tous les directeurs ${normalizedDiploma} ont été réinitialisés.`
                );
            }

                // ============================================
                // JURY RESET
            // ============================================

            else if (target === "jury") {

                const {
                    error: juryError
                } = await supabase
                    .from("soutenances")
                    .update({

                        jury: null,

                        president: "",
                        grade_president: "",

                        examinateur: "",
                        grade_examinateur: "",

                        rapporteur: "",
                        grade_rapporteur: ""
                    })
                    .in("id", matchingIds);

                if (juryError) {
                    throw juryError;
                }

                toast.success(
                    `Tous les jurys ${normalizedDiploma} ont été réinitialisés.`
                );
            }

            // ============================================
            // FORCE UI REFRESH
            // ============================================

            router.refresh();

            setTimeout(() => {
                window.location.reload();
            }, 400);

        } catch (error: any) {

            console.error(
                "RESET ERROR:",
                error
            );

            toast.error(
                error.message ||
                "Erreur lors de la réinitialisation."
            );

        } finally {

            setLoading(false);
        }
    };

    const safeDiplomaType =
        normalize(diplomaType);

    // ============================================
    // TITLES
    // ============================================

    const title =
        target === "planning"
            ? `RÉINITIALISER LE PLANNING ${safeDiplomaType}`
            : target === "directors"
                ? `RÉINITIALISER LES DIRECTEURS ${safeDiplomaType}`
                : `RÉINITIALISER LES JURYS ${safeDiplomaType}`;

    const description =
        target === "planning"

            ? `Cette action supprimera définitivement toutes les soutenances ${safeDiplomaType}.`

            : target === "directors"

                ? `Cette action retirera tous les directeurs et co-directeurs des soutenances ${safeDiplomaType}.`

                : `Cette action retirera tous les jurys et membres de jury des soutenances ${safeDiplomaType}.`;


    return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="h-12 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30 transition-all hover:shadow-xl hover:shadow-red-600/40"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          RÉINITIALISER
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-black text-red-600 uppercase tracking-tighter flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            ATTENTION : ACTION IRRÉVERSIBLE
          </AlertDialogTitle>
          <AlertDialogDescription className="text-blue-900/70 dark:text-blue-400 font-medium">
            {description}
            <br /><br />
            Êtes-vous absolument sûr de vouloir continuer ?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="rounded-xl border-blue-100 dark:border-blue-900 font-bold">Annuler</AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleReset}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold"
            disabled={loading}
          >
            {loading ? (
              <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4 mr-2" />
            )}
            OUI, CONFIRMER
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
