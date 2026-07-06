import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { buildPageList, pageCount } from "../domain/services";

export type ExpensePaginationProps = {
	readonly page: number;
	readonly pageSize: number;
	readonly total: number;
	readonly onPageChange: (page: number) => void;
	readonly className?: string;
};

export function ExpensePagination({
	page,
	pageSize,
	total,
	onPageChange,
	className,
}: ExpensePaginationProps) {
	const lastPage = pageCount(total, pageSize);
	// Collapse the control when there's nothing to paginate, mirroring the
	// behaviour of the surrounding "show only when needed" UI elements.
	if (total <= pageSize) return null;

	const pages = buildPageList(page, lastPage);
	const isFirst = page <= 1;
	const isLast = page >= lastPage;

	return (
		<Pagination className={cn("mt-2", className)}>
			<PaginationContent>
				<PaginationItem>
					<PaginationPrevious
						href="#"
						onClick={(e) => {
							e.preventDefault();
							if (!isFirst) onPageChange(page - 1);
						}}
						aria-disabled={isFirst}
						className={isFirst ? "pointer-events-none opacity-50" : undefined}
					/>
				</PaginationItem>

				{pages.map((p, idx) =>
					p === "ellipsis" ? (
						// biome-ignore lint/suspicious/noArrayIndexKey: ellipsis slots are positional
						<PaginationItem key={`ellipsis-${idx}`}>
							<PaginationEllipsis />
						</PaginationItem>
					) : (
						<PaginationItem key={p}>
							<PaginationLink
								href="#"
								isActive={p === page}
								onClick={(e) => {
									e.preventDefault();
									if (p !== page) onPageChange(p);
								}}
							>
								{p}
							</PaginationLink>
						</PaginationItem>
					),
				)}

				<PaginationItem>
					<PaginationNext
						href="#"
						onClick={(e) => {
							e.preventDefault();
							if (!isLast) onPageChange(page + 1);
						}}
						aria-disabled={isLast}
						className={isLast ? "pointer-events-none opacity-50" : undefined}
					/>
				</PaginationItem>
			</PaginationContent>
		</Pagination>
	);
}
