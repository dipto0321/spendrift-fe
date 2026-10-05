import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/shared/ui/DatePicker";

type BulkDateEditModalProps = {
	readonly count: number;
	readonly onSubmit: (date: string) => void;
	readonly onClose: () => void;
	readonly isSubmitting?: boolean;
};

// Date-only bulk edit: exposes a single DatePicker so the user can change the
// date of the selected expenses and nothing else.
export function BulkDateEditModal({
	count,
	onSubmit,
	onClose,
	isSubmitting,
}: Readonly<BulkDateEditModalProps>) {
	const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

	return (
		<Dialog open onOpenChange={(open) => !open && !isSubmitting && onClose()}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Change date</DialogTitle>
					<DialogDescription>
						Move {count} {count === 1 ? "expense" : "expenses"} to a new date.
						Only the date is changed.
					</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="bulk-date">New date</Label>
					<DatePicker value={date} onChange={setDate} aria-label="New date" />
				</div>
				<DialogFooter>
					<Button
						variant="outline"
						type="button"
						onClick={onClose}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={() => onSubmit(date)}
						disabled={isSubmitting}
					>
						{isSubmitting ? "Updating…" : "Update dates"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
