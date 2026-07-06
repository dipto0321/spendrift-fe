import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ColorPicker } from "@/shared/ui/ColorPicker";
import type { Category, CategoryColor } from "../domain/types";

type CategoryManagerProps = {
	readonly categories: Category[];
	readonly onCreate: (name: string, color: CategoryColor) => Promise<void>;
	readonly onUpdate: (
		id: string,
		name: string,
		color: CategoryColor,
	) => Promise<void>;
	readonly onDelete: (id: string) => Promise<void>;
};

export function CategoryManager({
	categories,
	onCreate,
	onUpdate,
	onDelete,
}: CategoryManagerProps) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [editColor, setEditColor] = useState<CategoryColor>("#3B82F6");
	const [newName, setNewName] = useState("");
	const [newColor, setNewColor] = useState<CategoryColor>("#3B82F6");
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const userCategories = categories.filter((c) => c.name !== "Uncategorized");
	const deleteTarget = userCategories.find((c) => c.id === deleteId);

	function startEdit(category: Category) {
		setEditingId(category.id);
		setEditName(category.name);
		setEditColor(category.color);
	}

	function cancelEdit() {
		setEditingId(null);
		setEditName("");
	}

	async function handleUpdate() {
		if (!editingId || !editName.trim()) return;
		await onUpdate(editingId, editName.trim(), editColor);
		cancelEdit();
	}

	async function handleCreate() {
		if (!newName.trim()) return;
		await onCreate(newName.trim(), newColor);
		setNewName("");
		setNewColor("#3B82F6");
	}

	return (
		<>
			<Card>
				<CardHeader>
					<CardTitle>Categories</CardTitle>
					<CardDescription>
						Add, rename, recolor, or remove the categories used to tag expenses.
					</CardDescription>
				</CardHeader>
				<CardContent className="flex flex-col gap-4">
					<form
						onSubmit={(e) => { e.preventDefault(); void handleCreate(); }}
						className="flex flex-wrap items-center gap-2"
					>
						<ColorPicker value={newColor} onChange={setNewColor} />
						<Input
							value={newName}
							onChange={(e) => setNewName(e.target.value)}
							placeholder="New category name"
							aria-label="New category name"
							className="min-w-40 flex-1"
						/>
						<Button type="submit" disabled={!newName.trim()}>
							<Plus className="size-4" />
							Add
						</Button>
					</form>

					<Separator />

					<div className="flex flex-col gap-2">
						{userCategories.map((category) => (
							<div
								key={category.id}
								className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
							>
								{editingId === category.id ? (
									<>
										<ColorPicker value={editColor} onChange={setEditColor} />
										<Input
											value={editName}
											onChange={(e) => setEditName(e.target.value)}
											className="h-9 min-w-40 flex-1"
											aria-label={`Rename ${category.name}`}
											autoFocus
										/>
										<Button
											variant="ghost"
											size="icon"
											aria-label="Save"
											onClick={handleUpdate}
										>
											<Check className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											aria-label="Cancel"
											onClick={cancelEdit}
										>
											<X className="size-4" />
										</Button>
									</>
								) : (
									<>
										<span
											className="size-5 shrink-0 rounded-full border border-border"
											style={{ backgroundColor: category.color }}
											aria-hidden
										/>
										<span className="flex-1 truncate text-sm font-medium text-foreground">
											{category.name}
										</span>
										<span className="text-xs uppercase text-muted-foreground">
											{category.color}
										</span>
										<Button
											variant="ghost"
											size="icon"
											aria-label={`Edit ${category.name}`}
											onClick={() => startEdit(category)}
										>
											<Pencil className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											aria-label={`Delete ${category.name}`}
											disabled={userCategories.length <= 1}
											onClick={() => setDeleteId(category.id)}
										>
											<Trash2 className="size-4" />
										</Button>
									</>
								)}
							</div>
						))}
					</div>
				</CardContent>
			</Card>

			<AlertDialog
				open={deleteId !== null}
				onOpenChange={(open) => {
					if (!open) setDeleteId(null);
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							Delete "{deleteTarget?.name}"?
						</AlertDialogTitle>
						<AlertDialogDescription>
							This category will be removed and any expenses using it moved to
							Uncategorized. This can't be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							variant="destructive"
							onClick={() => {
								if (deleteId) {
									void onDelete(deleteId);
									setDeleteId(null);
								}
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}
