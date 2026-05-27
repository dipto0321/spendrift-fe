import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { authRepository, useAuthSnapshot } from "../data/repository";

const MAX_AVATAR_SIZE = 1_000_000;

export function ProfilePage() {
	const navigate = useNavigate();
	const auth = useAuthSnapshot();
	const user = auth.user;
	const [avatarError, setAvatarError] = useState<string | null>(null);
	const [profileError, setProfileError] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);

	const updateProfileMutation = useMutation({
		mutationFn: authRepository.updateProfile,
	});

	const updatePasswordMutation = useMutation({
		mutationFn: authRepository.updatePassword,
	});

	const updateAvatarMutation = useMutation({
		mutationFn: authRepository.updateAvatar,
	});

	const signOutMutation = useMutation({
		mutationFn: authRepository.signOut,
		onSuccess: async () => {
			await navigate({ to: "/sign-in" });
		},
	});

	if (!user) {
		return null;
	}

	return (
		<main className="page-wrap px-4 pb-14 pt-10 sm:pt-12">
			<header className="mb-6 flex items-end justify-between gap-4">
				<div>
					<p className="island-kicker mb-2">Profile</p>
					<h1 className="display-title m-0 text-3xl font-semibold text-foreground sm:text-5xl">
						Your account
					</h1>
					<p className="m-0 mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
						Update your name, email, password, and profile picture.
					</p>
				</div>
				<button
					type="button"
					onClick={() => signOutMutation.mutate()}
					className="rounded-xl border border-border/60 bg-card/40 px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
				>
					Sign out
				</button>
			</header>

			<section className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
				<div className="rounded-2xl border border-border/60 bg-card/30 p-6">
					<div className="flex flex-col items-center text-center">
						<div className="grid h-24 w-24 place-items-center overflow-hidden rounded-full bg-muted/50 ring-1 ring-border/60">
							{user.avatarDataUrl ? (
								<img
									src={user.avatarDataUrl}
									alt={user.name}
									className="h-full w-full object-cover"
								/>
							) : (
								<span className="text-2xl font-semibold text-foreground">
									{user.name.slice(0, 1).toUpperCase()}
								</span>
							)}
						</div>
						<p className="mt-4 text-lg font-semibold text-foreground">
							{user.name}
						</p>
						<p className="text-sm text-muted-foreground">{user.email}</p>
					</div>

					<div className="mt-6 space-y-3 text-xs text-muted-foreground">
						<p>Avatar limit: 1 MB</p>
						<p>
							Only name, email, and password are stored in this mock profile.
						</p>
					</div>
				</div>

				<div className="space-y-6">
					<section className="rounded-2xl border border-border/60 bg-card/30 p-6">
						<h2 className="m-0 text-base font-semibold text-foreground">
							Profile details
						</h2>
						<form
							className="mt-4 grid gap-4"
							onSubmit={async (event) => {
								event.preventDefault();
								setProfileError(null);
								const form = event.currentTarget;
								const data = new FormData(form);
								const name = String(data.get("name") ?? "").trim();
								const email = String(data.get("email") ?? "").trim();
								try {
									await updateProfileMutation.mutateAsync({ name, email });
								} catch (error) {
									setProfileError(
										error instanceof Error
											? error.message
											: "Unable to update profile.",
									);
								}
							}}
						>
							<div className="grid gap-4 sm:grid-cols-2">
								<label className="grid gap-2">
									<span className="text-sm font-medium text-foreground">
										Name
									</span>
									<input
										name="name"
										type="text"
										defaultValue={user.name}
										className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
										required
									/>
								</label>
								<label className="grid gap-2">
									<span className="text-sm font-medium text-foreground">
										Email
									</span>
									<input
										name="email"
										type="email"
										defaultValue={user.email}
										className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
										required
									/>
								</label>
							</div>
							{profileError ? (
								<p className="text-sm text-red-500">{profileError}</p>
							) : null}
							<div className="flex justify-end">
								<button
									type="submit"
									disabled={updateProfileMutation.isPending}
									className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
								>
									{updateProfileMutation.isPending
										? "Saving..."
										: "Save profile"}
								</button>
							</div>
						</form>
					</section>

					<section className="rounded-2xl border border-border/60 bg-card/30 p-6">
						<h2 className="m-0 text-base font-semibold text-foreground">
							Profile picture
						</h2>
						<div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
							<label className="grid gap-2">
								<span className="text-sm font-medium text-foreground">
									Avatar image
								</span>
								<input
									type="file"
									accept="image/*"
									className="block w-full text-sm text-muted-foreground file:mr-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-medium file:text-primary-foreground hover:file:bg-primary/90"
									onChange={async (event) => {
										setAvatarError(null);
										const file = event.currentTarget.files?.[0];
										if (!file) return;
										if (file.size > MAX_AVATAR_SIZE) {
											setAvatarError("Avatar must be 1 MB or smaller.");
											event.currentTarget.value = "";
											return;
										}
										const dataUrl = await readFileAsDataUrl(file);
										await updateAvatarMutation.mutateAsync(dataUrl);
										event.currentTarget.value = "";
									}}
								/>
							</label>
							<button
								type="button"
								onClick={async () => updateAvatarMutation.mutateAsync(null)}
								className="rounded-xl border border-border/60 bg-background px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted/30"
							>
								Remove image
							</button>
						</div>
						{avatarError ? (
							<p className="mt-3 text-sm text-red-500">{avatarError}</p>
						) : null}
					</section>

					<section className="rounded-2xl border border-border/60 bg-card/30 p-6">
						<h2 className="m-0 text-base font-semibold text-foreground">
							Change password
						</h2>
						<form
							className="mt-4 grid gap-4"
							onSubmit={async (event) => {
								event.preventDefault();
								setPasswordError(null);
								const form = event.currentTarget;
								const data = new FormData(form);
								const currentPassword = String(
									data.get("currentPassword") ?? "",
								).trim();
								const newPassword = String(
									data.get("newPassword") ?? "",
								).trim();
								const confirmPassword = String(
									data.get("confirmPassword") ?? "",
								).trim();
								if (newPassword !== confirmPassword) {
									setPasswordError(
										"New password and confirmation do not match.",
									);
									return;
								}
								try {
									await updatePasswordMutation.mutateAsync({
										currentPassword,
										newPassword,
									});
									form.reset();
								} catch (error) {
									setPasswordError(
										error instanceof Error
											? error.message
											: "Unable to update password.",
									);
								}
							}}
						>
							<div className="grid gap-4 sm:grid-cols-3">
								<label className="grid gap-2">
									<span className="text-sm font-medium text-foreground">
										Current password
									</span>
									<input
										name="currentPassword"
										type="password"
										autoComplete="current-password"
										className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
										required
									/>
								</label>
								<label className="grid gap-2">
									<span className="text-sm font-medium text-foreground">
										New password
									</span>
									<input
										name="newPassword"
										type="password"
										autoComplete="new-password"
										className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
										required
									/>
								</label>
								<label className="grid gap-2">
									<span className="text-sm font-medium text-foreground">
										Confirm password
									</span>
									<input
										name="confirmPassword"
										type="password"
										autoComplete="new-password"
										className="rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
										required
									/>
								</label>
							</div>
							{passwordError ? (
								<p className="text-sm text-red-500">{passwordError}</p>
							) : null}
							<div className="flex justify-end">
								<button
									type="submit"
									disabled={updatePasswordMutation.isPending}
									className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-60"
								>
									{updatePasswordMutation.isPending
										? "Updating..."
										: "Update password"}
								</button>
							</div>
						</form>
					</section>
				</div>
			</section>
		</main>
	);
}

function readFileAsDataUrl(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string") {
				resolve(reader.result);
			} else {
				reject(new Error("Unable to read image file."));
			}
		};
		reader.onerror = () => reject(new Error("Unable to read image file."));
		reader.readAsDataURL(file);
	});
}
