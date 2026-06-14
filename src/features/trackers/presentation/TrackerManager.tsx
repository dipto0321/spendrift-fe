import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
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
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import type { Tracker } from "../domain/types";

type TrackerManagerProps = {
	trackers: Tracker[];
	activeTrackerId: string;
	onCreate: (name: string, currency: string) => Promise<void>;
	onUpdate: (id: string, name: string, currency: string) => Promise<void>;
	onDelete: (id: string) => Promise<void>;
	onActivate: (id: string) => void;
};

export function TrackerManager({
	trackers,
	activeTrackerId,
	onCreate,
	onUpdate,
	onDelete,
	onActivate,
}: Readonly<TrackerManagerProps>) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editName, setEditName] = useState("");
	const [editCurrency, setEditCurrency] = useState("USD");
	const [showCreate, setShowCreate] = useState(false);
	const [newName, setNewName] = useState("");
	const [newCurrency, setNewCurrency] = useState("USD");

	const canDelete = trackers.length > 1;

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
		<Collapsible
			open={isExpanded}
			onOpenChange={setIsExpanded}
			className="rounded-2xl border border-border/60 bg-card/30"
		>
			<CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/20">
				<span className="text-sm font-medium text-foreground">
					Manage Trackers
				</span>
				{isExpanded ? (
					<ChevronDown className="h-4 w-4 text-muted-foreground" />
				) : (
					<ChevronRight className="h-4 w-4 text-muted-foreground" />
				)}
			</CollapsibleTrigger>

			<CollapsibleContent className="border-t border-border/50 px-4 pb-4">
				<div className="space-y-2 pt-3">
					{trackers.map((tracker) => (
						<div
							key={tracker.id}
							className="flex flex-wrap items-center gap-2 rounded-lg border border-border/40 bg-card/50 p-2"
						>
							{editingId === tracker.id ? (
								<>
									<Input
										type="text"
										value={editName}
										onChange={(e) => setEditName(e.target.value)}
										placeholder="Tracker name"
										className="h-8 min-w-0 flex-1"
									/>
									<Input
										type="text"
										value={editCurrency}
										onChange={(e) =>
											setEditCurrency(e.target.value.toUpperCase())
										}
										placeholder="USD"
										className="h-8 w-24 uppercase"
									/>
									<Button
										type="button"
										size="sm"
										onClick={handleUpdate}
										className="shrink-0"
									>
										Save
									</Button>
									<Button
										type="button"
										size="sm"
										variant="outline"
										onClick={cancelEdit}
										className="shrink-0"
									>
										Cancel
									</Button>
								</>
							) : (
								<>
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="truncate text-sm text-foreground">
												{tracker.name}
											</span>
											<span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
												{tracker.currency}
											</span>
											{activeTrackerId === tracker.id ? (
												<span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
													Active
												</span>
											) : null}
										</div>
									</div>
									{activeTrackerId !== tracker.id ? (
										<Button
											type="button"
											size="sm"
											variant="outline"
											onClick={() => onActivate(tracker.id)}
											className="shrink-0"
										>
											Use
										</Button>
									) : null}
									<button
										type="button"
										onClick={() => startEdit(tracker)}
										className="shrink-0 rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
										aria-label={`Edit ${tracker.name}`}
									>
										<Pencil className="h-3.5 w-3.5" />
									</button>
									<AlertDialog>
										<AlertDialogTrigger asChild>
											<button
												type="button"
												disabled={!canDelete}
												className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:cursor-not-allowed disabled:opacity-40"
												aria-label={`Delete ${tracker.name}`}
												title={
													canDelete
														? `Delete ${tracker.name}`
														: "At least one tracker is required"
												}
											>
												<Trash2 className="h-3.5 w-3.5" />
											</button>
										</AlertDialogTrigger>
										<AlertDialogContent>
											<AlertDialogHeader>
												<AlertDialogTitle>
													Delete "{tracker.name}"?
												</AlertDialogTitle>
												<AlertDialogDescription>
													This permanently removes the tracker and all of its
													expenses and budgets. This can't be undone.
												</AlertDialogDescription>
											</AlertDialogHeader>
											<AlertDialogFooter>
												<AlertDialogCancel>Cancel</AlertDialogCancel>
												<AlertDialogAction
													variant="destructive"
													onClick={() => onDelete(tracker.id)}
												>
													Delete
												</AlertDialogAction>
											</AlertDialogFooter>
										</AlertDialogContent>
									</AlertDialog>
								</>
							)}
						</div>
					))}

					{showCreate ? (
						<div className="space-y-2 rounded-lg border border-border/40 bg-card/50 p-3">
							<Input
								type="text"
								placeholder="Tracker name"
								value={newName}
								onChange={(e) => setNewName(e.target.value)}
							/>
							<Input
								type="text"
								placeholder="USD"
								value={newCurrency}
								onChange={(e) => setNewCurrency(e.target.value.toUpperCase())}
								className="uppercase"
							/>
							<div className="flex gap-2">
								<Button
									type="button"
									variant="outline"
									onClick={() => {
										setShowCreate(false);
										setNewName("");
										setNewCurrency("USD");
									}}
									className="flex-1"
								>
									Cancel
								</Button>
								<Button
									type="button"
									onClick={handleCreate}
									disabled={!newName.trim() || !newCurrency.trim()}
									className="flex-1"
								>
									Create
								</Button>
							</div>
						</div>
					) : (
						<button
							type="button"
							onClick={() => setShowCreate(true)}
							className="flex w-full items-center gap-2 rounded-lg border border-dashed border-border/60 px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
						>
							<Plus className="h-4 w-4" />
							Add tracker
						</button>
					)}
				</div>
			</CollapsibleContent>
		</Collapsible>
	);
}
