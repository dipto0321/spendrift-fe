import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { Category, CategoryColor } from "../domain/types";
import { CategoryColorPicker } from "./CategoryColorPicker";

type CategoryManagerProps = {
	categories: Category[];
	onCreate: (name: string, color: CategoryColor) => Promise<void>;
	onUpdate: (id: string, name: string, color: CategoryColor) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
};

export function CategoryManager({
	categories,
	onCreate,
	onUpdate,
	onDelete,
}: CategoryManagerProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [editColor, setEditColor] = useState<CategoryColor>("#3B82F6");
	const [showCreate, setShowCreate] = useState(false);
	const [newName, setNewName] = useState("");
	const [newColor, setNewColor] = useState<CategoryColor>("#3B82F6");
	const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

	const userCategories = categories.filter((c) => c.id !== "uncategorized");

	function startEdit(category: Category) {
		setEditingId(category.id);
		setEditName(category.name);
		setEditColor(category.color);
	}

	function cancelEdit() {
		setEditingId(null);
		setEditName("");
		setConfirmDeleteId(null);
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
		setShowCreate(false);
	}

	async function handleDelete(id: string) {
		await onDelete(id);
		setConfirmDeleteId(null);
	}

	return (
		<div className="rounded-2xl border border-border/60 bg-card/30">
			<button
				type="button"
				onClick={() => setIsExpanded(!isExpanded)}
				className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/20 transition-colors"
			>
				<span className="text-sm font-medium text-foreground">
					Manage Categories
				</span>
				{isExpanded ? (
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				) : (
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
				)}
			</button>

			{isExpanded && (
				<div className="border-t border-border/50 px-4 pb-4">
					<div className="space-y-2 pt-3">
						{userCategories.map((category) => (
							<div
								key={category.id}
								className="flex items-center gap-2 rounded-lg border border-border/40 bg-card/50 p-2"
							>
								<span
									className="h-3 w-3 shrink-0 rounded-full"
									style={{ backgroundColor: category.color }}
								/>

								{editingId === category.id ? (
									<>
										<input
											type="text"
											value={editName}
											onChange={(e) => setEditName(e.target.value)}
											className="flex-1 rounded border border-input bg-background px-2 py-1 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
										/>
										<CategoryColorPicker
											value={editColor}
											onChange={setEditColor}
										/>
										<button
											type="button"
											onClick={handleUpdate}
											className="shrink-0 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground"
										>
											Save
										</button>
										<button
											type="button"
											onClick={cancelEdit}
											className="shrink-0 rounded border border-input bg-background px-2 py-1 text-xs font-medium"
										>
											Cancel
										</button>
									</>
								) : confirmDeleteId === category.id ? (
									<>
										<span className="flex-1 truncate text-sm text-muted-foreground">
											Delete "{category.name}"?
										</span>
										<button
											type="button"
											onClick={() => handleDelete(category.id)}
											className="shrink-0 rounded bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground"
										>
											Confirm
										</button>
										<button
											type="button"
											onClick={() => setConfirmDeleteId(null)}
											className="shrink-0 rounded border border-input bg-background px-2 py-1 text-xs font-medium"
										>
											Cancel
										</button>
									</>
								) : (
									<>
										<span className="flex-1 truncate text-sm text-foreground">
											{category.name}
										</span>
										<button
											type="button"
											onClick={() => startEdit(category)}
											className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
											aria-label={`Edit ${category.name}`}
										>
											<Pencil className="h-3.5 w-3.5" />
										</button>
										<button
											type="button"
											onClick={() => setConfirmDeleteId(category.id)}
											className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
											aria-label={`Delete ${category.name}`}
										>
											<Trash2 className="h-3.5 w-3.5" />
										</button>
									</>
								)}
							</div>
						))}

						{showCreate ? (
							<div className="space-y-2 rounded-lg border border-border/40 bg-card/50 p-3">
								<input
									type="text"
									placeholder="Category name"
									value={newName}
									onChange={(e) => setNewName(e.target.value)}
									className="w-full rounded border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
								/>
								<CategoryColorPicker value={newColor} onChange={setNewColor} />
								<div className="flex gap-2">
									<button
										type="button"
										onClick={() => {
											setShowCreate(false);
											setNewName("");
										}}
										className="flex-1 rounded border border-input bg-background px-3 py-1.5 text-sm font-medium"
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={handleCreate}
										disabled={!newName.trim()}
										className="flex-1 rounded bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
									>
										Create
									</button>
								</div>
							</div>
						) : (
							<button
								type="button"
								onClick={() => setShowCreate(true)}
								className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
							>
								<Plus className="h-4 w-4" />
								Add category
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
