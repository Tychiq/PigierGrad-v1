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
import { Trash2, AlertTriangle, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ResetEverythingButtonProps {
  diplomaType: string;
  target: "planning" | "directors";
}

export function ResetEverythingButton({ diplomaType = "", target }: ResetEverythingButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!diplomaType) {
      toast.error("Type de diplôme non spécifié");
      return;
    }

    setLoading(true);
    try {
      if (target === "planning") {
        // Delete all soutenances for this diploma type
        const { error: soutenancesError } = await supabase
          .from("soutenances")
          .delete()
          .eq("diploma_type", diplomaType);
        
        if (soutenancesError) throw soutenancesError;

        // Also delete related notifications for this diploma type
        const { error: notificationsError } = await supabase
          .from("notifications")
          .delete()
          .ilike("message", `%${diplomaType}%`);
        
        if (notificationsError) throw notificationsError;

        toast.success(`Toutes les données de planification ${diplomaType} ont été supprimées.`);
      } else {
        // Clear only director fields for this diploma type
        const { error: directorsError } = await supabase
          .from("soutenances")
          .update({ 
            directeur: "", 
            grade_directeur: "" 
          })
          .eq("diploma_type", diplomaType);
        
        if (directorsError) throw directorsError;

        toast.success(`Tous les directeurs assignés en ${diplomaType} ont été retirés.`);
      }
      
      router.refresh();
      // Use window.location.reload() as a fallback to ensure state is cleared
      setTimeout(() => window.location.reload(), 500);
    } catch (error: any) {
      console.error("Error resetting data:", error);
      toast.error("Erreur lors de l'opération: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const safeDiplomaType = diplomaType || "";
  const displayDiplomaType = safeDiplomaType.toUpperCase();

  const title = target === "planning" 
    ? `RÉINITIALISER LE PLANNING ${displayDiplomaType}`
    : `RÉINITIALISER LES DIRECTEURS ${displayDiplomaType}`;

  const description = target === "planning"
    ? `Cette action supprimera définitivement TOUS les étudiants et planifications pour le diplôme ${safeDiplomaType}.`
    : `Cette action retirera TOUS les directeurs assignés aux soutenances de type ${safeDiplomaType}. Les étudiants et thèmes seront conservés.`;

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
