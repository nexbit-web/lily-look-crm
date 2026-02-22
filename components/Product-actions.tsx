"use client";

import React from "react";
import { toast } from "react-hot-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2Icon } from "lucide-react";

type ProductActionsProps = {
  productId: string; // string потому что cuid()
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string) => void;
};

export default function ProductActions({
  productId,
  onDelete,
  onEdit,
}: ProductActionsProps) {
  const [open, setOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleDelete = async () => {
    setLoading(true);
    setOpen(false);

    await toast
      .promise(onDelete(productId), {
        loading: "Видалення продукту...",
        success: <b>Продукт видалено!</b>,
        error: <b>Помилка при видаленні!</b>,
      })
      .finally(() => setLoading(false));
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="px-3 py-1 rounded hover:bg-gray-200 dark:hover:bg-gray-800 cursor-pointer">
          ⋮
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem
            onClick={() => onEdit(productId)}
            className="cursor-pointer"
          >
            Редагувати
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setOpen(true)}
            className="text-red-500 cursor-pointer"
          >
            Видалити
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Видалити товар?</AlertDialogTitle>
            <AlertDialogDescription>
              Ця дія видалить товар назавжди. Ви впевнені, що хочете продовжити?
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel variant="outline" disabled={loading}>
              Ні
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={loading}
              onClick={handleDelete}
              className="flex items-center justify-center gap-2"
            >
              {loading ? "Видаляю..." : "Так, видалити"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
