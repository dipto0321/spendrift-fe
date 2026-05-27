import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { categoryRepository } from "@/features/expenses/data/repository";
import type { CategoryColor } from "@/features/expenses/domain/types";
import { CategoryManager } from "@/features/expenses/presentation/CategoryManager";

export const Route = createFileRoute("/settings")({
	component: SettingsPage,
});

function SettingsPage() {
	const queryClient = useQueryClient();

	const { data: categories = [] } = useQuery({
		queryKey: ["categories"],
		queryFn: () => categoryRepository.getAll(),
	});

	const createMutation = useMutation({
		mutationFn: ({ name, color }: { name: string; color: string }) =>
			categoryRepository.create(name, color as CategoryColor),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			name,
			color,
		}: {
			id: string;
			name: string;
			color: string;
		}) =>
			categoryRepository.update(id, {
				name,
				color: color as CategoryColor,
			}),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});

	const deleteMutation = useMutation({
		mutationFn: (id: string) => categoryRepository.delete(id, "uncategorized"),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ["categories"] });
		},
	});

	return (
		<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
			<header className="mb-6">
				<p className="island-kicker mb-2">Settings</p>
				<h1 className="display-title m-0 text-3xl font-semibold text-foreground sm:text-5xl">
					Workspace settings
				</h1>
				<p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
					Manage your expense categories, account preferences, and more.
				</p>
			</header>

			<section className="mb-6">
				<div className="mb-3">
					<h2 className="text-base font-semibold text-foreground">
						Expense Categories
					</h2>
					<p className="m-0 text-sm text-muted-foreground">
						Create, rename, and delete categories for your expenses.
					</p>
				</div>
				<CategoryManager
					categories={categories}
					onCreate={async (name, color) => {
						await createMutation.mutateAsync({ name, color });
					}}
					onUpdate={async (id, name, color) => {
						await updateMutation.mutateAsync({ id, name, color });
					}}
					onDelete={async (id) => {
						await deleteMutation.mutateAsync(id);
					}}
				/>
			</section>
		</main>
	);
}
