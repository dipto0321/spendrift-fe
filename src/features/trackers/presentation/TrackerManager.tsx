import { Globe, Pencil, Plus, Trash2 } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { Tracker } from "../domain/types";

type TrackerManagerProps = {
	readonly trackers: Tracker[];
	readonly activeTrackerId: string;
	readonly onCreate: (name: string, currency: string) => Promise<void>;
	readonly onUpdate: (
		id: string,
		name: string,
		currency: string,
	) => Promise<void>;
	readonly onDelete: (id: string) => Promise<void>;
	readonly onActivate: (id: string) => void;
};

export function TrackerManager({
	trackers,
	activeTrackerId,
	onCreate,
	onUpdate,
	onDelete,
	onActivate,
}: TrackerManagerProps) {
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [editCurrency, setEditCurrency] = useState("USD");
	const [showCreate, setShowCreate] = useState(false);
	const [newName, setNewName] = useState("");
	const [newCurrency, setNewCurrency] = useState("USD");
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const canDelete = trackers.length > 1;
	const deleteTarget = trackers.find((t) => t.id === deleteId);

	function startEdit(tracker: Tracker) {
		setEditingId(tracker.id);
		setEditName(tracker.name);
		setEditCurrency(tracker.currency);
	}

	function cancelEdit() {
		setEditingId(null);
		setEditName("");
		setEditCurrency("USD");
	}

	async function handleUpdate() {
		if (!editingId || !editName.trim() || !editCurrency.trim()) return;
		await onUpdate(
			editingId,
			editName.trim(),
			editCurrency.trim().toUpperCase(),
		);
		cancelEdit();
	}

	async function handleCreate() {
		if (!newName.trim() || !newCurrency.trim()) return;
		await onCreate(newName.trim(), newCurrency.trim().toUpperCase());
		setNewName("");
		setNewCurrency("USD");
		setShowCreate(false);
	}

	return (
		<>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between gap-4">
						<div className="flex flex-col gap-1">
							<CardTitle>Trackers</CardTitle>
							<CardDescription>
								Each tracker keeps its own currency, budget, and expenses.
							</CardDescription>
						</div>
						<Button size="sm" onClick={() => setShowCreate(true)} disabled={showCreate}>
							<Plus className="size-4" />
							Add tracker
						</Button>
					</div>
				</CardHeader>
				<CardContent className="flex flex-col gap-2">
					{showCreate && (
						<div className="flex flex-wrap items-center gap-2 rounded-lg border border-dashed border-border p-3">
							<Input
								type="text"
								placeholder="Tracker name"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
								className="min-w-32 flex-1"
								autoFocus
							/>
							<Input
								type="text"
								placeholder="USD"
								value={newCurrency}
								onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
								className="w-24 uppercase"
							/>
							<Button
								size="sm"
								onClick={() => void handleCreate()}
								disabled={!newName.trim() || !newCurrency.trim()}
							>
								Create
							</Button>
							<Button
								size="sm"
								variant="outline"
								onClick={() => {
									setShowCreate(false);
									setNewName("");
									setNewCurrency("USD");
								}}
							>
								Cancel
							</Button>
						</div>
					)}

					{trackers.map((tracker) => (
						<div
							key={tracker.id}
							className="flex items-center gap-3 rounded-lg border border-border p-3"
						>
							<div className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
								<Globe className="size-4" />
							</div>

							{editingId === tracker.id ? (
								<>
									<Input
										type="text"
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										placeholder="Tracker name"
										className="h-8 min-w-0 flex-1"
										autoFocus
									/>
									<Input
										type="text"
										value={editCurrency}
										onChange={(e) =>
											setEditCurrency(e.target.value.toUpperCase())
										}
										placeholder="USD"
										className="h-8 w-20 uppercase"
									/>
									<Button size="sm" onClick={() => void handleUpdate()}>
										Save
									</Button>
									<Button size="sm" variant="outline" onClick={cancelEdit}>
										Cancel
									</Button>
								</>
							) : (
								<>
									<div className="flex flex-1 flex-col">
										<div className="flex items-center gap-2">
											<span className="text-sm font-medium text-foreground">
												{tracker.name}
											</span>
											{activeTrackerId === tracker.id && (
												<Badge variant="secondary" className="text-xs">
													Active
												</Badge>
											)}
										</div>
										<span className="text-xs text-muted-foreground">
											{tracker.currency}
										</span>
									</div>
									{activeTrackerId !== tracker.id && (
										<Button
											size="sm"
											variant="outline"
											onClick={() => onActivate(tracker.id)}
										>
											Use
										</Button>
									)}
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Edit ${tracker.name}`}
										onClick={() => startEdit(tracker)}
									>
										<Pencil className="size-4" />
									</Button>
									<Button
										variant="ghost"
										size="icon"
										aria-label={`Delete ${tracker.name}`}
										disabled={!canDelete}
										onClick={() => setDeleteId(tracker.id)}
									>
										<Trash2 className="size-4" />
									</Button>
								</>
							)}
						</div>
					))}
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
						<AlertDialogTitle>Delete "{deleteTarget?.name}"?</AlertDialogTitle>
						<AlertDialogDescription>
							This permanently removes the tracker and all of its expenses and
							budgets. This can't be undone.
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
