import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/shared/ui/PageHeader";
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

	if (!user) return null;

	const initials = user.name
		.split(" ")
		.map((p) => p[0])
		.filter(Boolean)
		.slice(0, 2)
		.join("")
		.toUpperCase();

	return (
		<main className="flex flex-col gap-6 px-4 pb-14 pt-6">
			<div className="mx-auto w-full max-w-3xl flex flex-col gap-6">
				<PageHeader
					title="Profile"
					description="Update your name, email, password, and profile picture."
				/>

				<Card>
					<form
						onSubmit={async (event) => {
							event.preventDefault();
							setProfileError(null);
							const form = event.currentTarget;
							const data = new FormData(form);
							const name = ((data.get("name") as string | null) ?? "").trim();
							const email = ((data.get("email") as string | null) ?? "").trim();
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
						<CardHeader>
							<div className="flex items-center gap-4">
								<Avatar className="size-16">
									{user.avatarDataUrl ? (
										<AvatarImage src={user.avatarDataUrl} alt={user.name} />
									) : null}
									<AvatarFallback className="bg-linear-to-br from-amber-400/80 to-orange-500/80 text-white text-lg">
										{initials || user.name.slice(0, 1).toUpperCase()}
									</AvatarFallback>
								</Avatar>
								<div>
									<CardTitle>{user.name}</CardTitle>
									<CardDescription>{user.email}</CardDescription>
								</div>
							</div>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-2">
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
							{profileError ? (
								<p className="col-span-full text-sm text-destructive">
									{profileError}
								</p>
							) : null}
						</CardContent>
						<CardFooter className="justify-end border-t border-border">
							<Button type="submit" disabled={updateProfileMutation.isPending}>
								{updateProfileMutation.isPending ? "Saving…" : "Save profile"}
							</Button>
						</CardFooter>
					</form>
				</Card>

				<Card>
					<CardHeader>
						<CardTitle>Profile picture</CardTitle>
						<CardDescription>
							Upload an image up to 1 MB. Only you can see it.
						</CardDescription>
					</CardHeader>
					<CardContent>
						{user.avatarDataUrl ? (
							<div className="flex items-center gap-4">
								<Avatar className="size-12">
									<AvatarImage src={user.avatarDataUrl} alt={user.name} />
									<AvatarFallback>{initials}</AvatarFallback>
								</Avatar>
								<div className="flex flex-col gap-1">
									<p className="text-sm text-muted-foreground">
										Remove the current image to upload a new one.
									</p>
									<Button
										type="button"
										variant="outline"
										size="sm"
										className="w-fit"
										disabled={updateAvatarMutation.isPending}
										onClick={async () => {
											setAvatarError(null);
											await updateAvatarMutation.mutateAsync(null);
										}}
									>
										{updateAvatarMutation.isPending
											? "Removing…"
											: "Remove image"}
									</Button>
								</div>
							</div>
						) : (
							<div className="grid gap-2 sm:max-w-xs">
								<Label htmlFor="avatar-image">Avatar image</Label>
								<Input
									id="avatar-image"
									type="file"
									accept="image/*"
									disabled={updateAvatarMutation.isPending}
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
						)}
						{avatarError ? (
							<p className="mt-3 text-sm text-destructive">{avatarError}</p>
						) : null}
					</CardContent>
				</Card>

				<Card>
					<form
						onSubmit={async (event) => {
							event.preventDefault();
							setPasswordError(null);
							const form = event.currentTarget;
							const data = new FormData(form);
							const currentPassword = (
								(data.get("currentPassword") as string | null) ?? ""
							).trim();
							const newPassword = (
								(data.get("newPassword") as string | null) ?? ""
							).trim();
							const confirmPassword = (
								(data.get("confirmPassword") as string | null) ?? ""
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
						<CardHeader>
							<CardTitle>Change password</CardTitle>
							<CardDescription>
								Choose a strong password you don't use elsewhere.
							</CardDescription>
						</CardHeader>
						<CardContent className="grid gap-4 sm:grid-cols-3">
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
							{passwordError ? (
								<p className="col-span-full text-sm text-destructive">
									{passwordError}
								</p>
							) : null}
						</CardContent>
						<CardFooter className="justify-end border-t border-border">
							<Button
								type="submit"
								disabled={updatePasswordMutation.isPending}
							>
								{updatePasswordMutation.isPending
									? "Updating…"
									: "Update password"}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</div>
		</main>
	);
}
