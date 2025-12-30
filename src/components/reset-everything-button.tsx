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

export function ResetEverythingButton() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    setLoading(true);
    try {
      // Delete all soutenances
      const { error: soutenancesError } = await supabase
        .from("soutenances")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Standard way to delete all if RLS allows or if using service role, but here we just want to clear the table. 
        // Note: .delete().match({}) or .delete().gt('id', 0) might also work depending on ID type.
        // Actually, in many cases .delete().neq('id', 'uuid-that-does-not-exist') is used to delete all.
      
      if (soutenancesError) throw soutenancesError;

      // Delete all notifications
      const { error: notificationsError } = await supabase
        .from("notifications")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (notificationsError) throw notificationsError;

      toast.success("Toutes les données ont été supprimées avec succès.");
      router.refresh();
      window.location.reload(); // Force reload to clear all states
    } catch (error: any) {
      console.error("Error resetting data:", error);
      toast.error("Erreur lors de la suppression des données: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          variant="destructive" 
          className="h-12 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-lg shadow-red-600/30 transition-all hover:shadow-xl hover:shadow-red-600/40"
        >
          <AlertTriangle className="w-4 h-4 mr-2" />
          TOUT RÉINITIALISER
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-2xl font-black text-red-600 uppercase tracking-tighter flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" />
            ATTENTION : ACTION IRRÉVERSIBLE
          </AlertDialogTitle>
          <AlertDialogDescription className="text-blue-900/70 dark:text-blue-400 font-medium">
            Cette action supprimera <strong>définitivement</strong> tous les étudiants, toutes les planifications et toutes les notifications de la base de données. 
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
            OUI, TOUT SUPPRIMER
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
