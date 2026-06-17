import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authRepository, useAuthSnapshot } from "../data/repository";

const MAX_AVATAR_SIZE = 1_000_000;

export function ProfilePage() {
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

	if (!user) {
		return null;
	}

	return (
		<main className="page-wrap rise-in px-4 pb-14 pt-10 sm:pt-12">
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
						<p>Only your name, email, and password are stored.</p>
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
								<div className="grid gap-2">
									<Label htmlFor="profile-name">Name</Label>
									<Input
										id="profile-name"
										name="name"
										type="text"
										defaultValue={user.name}
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="profile-email">Email</Label>
									<Input
										id="profile-email"
										name="email"
										type="email"
										defaultValue={user.email}
										required
									/>
								</div>
							</div>
							{profileError ? (
								<p className="text-sm text-destructive">{profileError}</p>
							) : null}
							<div className="flex justify-end">
								<Button
									type="submit"
									disabled={updateProfileMutation.isPending}
								>
									{updateProfileMutation.isPending
										? "Saving..."
										: "Save profile"}
								</Button>
							</div>
						</form>
					</section>

					<section className="rounded-2xl border border-border/60 bg-card/30 p-6">
						<h2 className="m-0 text-base font-semibold text-foreground">
							Profile picture
						</h2>
						<div className="mt-4 grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
							<div className="grid gap-2">
								<Label htmlFor="avatar-image">Avatar image</Label>
								<Input
									id="avatar-image"
									type="file"
									accept="image/*"
									onChange={async (event) => {
										setAvatarError(null);
										const file = event.currentTarget.files?.[0];
										if (!file) return;
										if (file.size > MAX_AVATAR_SIZE) {
											setAvatarError("Avatar must be 1 MB or smaller.");
											event.currentTarget.value = "";
											return;
										}
										await updateAvatarMutation.mutateAsync(file);
										event.currentTarget.value = "";
									}}
								/>
							</div>
							<Button
								type="button"
								variant="outline"
								onClick={async () => updateAvatarMutation.mutateAsync(null)}
							>
								Remove image
							</Button>
						</div>
						{avatarError ? (
							<p className="mt-3 text-sm text-destructive">{avatarError}</p>
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
								<div className="grid gap-2">
									<Label htmlFor="current-password">Current password</Label>
									<Input
										id="current-password"
										name="currentPassword"
										type="password"
										autoComplete="current-password"
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="new-password">New password</Label>
									<Input
										id="new-password"
										name="newPassword"
										type="password"
										autoComplete="new-password"
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="confirm-password">Confirm password</Label>
									<Input
										id="confirm-password"
										name="confirmPassword"
										type="password"
										autoComplete="new-password"
										required
									/>
								</div>
							</div>
							{passwordError ? (
								<p className="text-sm text-destructive">{passwordError}</p>
							) : null}
							<div className="flex justify-end">
								<Button
									type="submit"
									disabled={updatePasswordMutation.isPending}
								>
									{updatePasswordMutation.isPending
										? "Updating..."
										: "Update password"}
								</Button>
							</div>
						</form>
					</section>
				</div>
			</section>
		</main>
	);
}
