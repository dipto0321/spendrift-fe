import { useMutation } from "@tanstack/react-query";
import { Save, Trash2, Upload } from "lucide-react";
import { useRef, useState } from "react";
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

	const [name, setName] = useState(user?.name ?? "");
	const [email, setEmail] = useState(user?.email ?? "");
	const [avatarError, setAvatarError] = useState<string | null>(null);
	const [profileError, setProfileError] = useState<string | null>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const updateProfileMutation = useMutation({
		mutationFn: authRepository.updateProfile,
	});

	const updateAvatarMutation = useMutation({
		mutationFn: authRepository.updateAvatar,
	});

	if (!user) return null;

	const initials = name
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
					description="Manage your personal account information and preferences."
				/>

				<Card>
					<form
						onSubmit={async (event) => {
							event.preventDefault();
							setProfileError(null);
							try {
								await updateProfileMutation.mutateAsync({
									name: name.trim(),
									email: email.trim(),
								});
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
							<CardTitle>Account</CardTitle>
							<CardDescription>
								This information is shown across your Spendrift account.
							</CardDescription>
						</CardHeader>
						<CardContent className="flex flex-col gap-6">
							<div className="flex items-center gap-4">
								<Avatar className="size-16">
									{user.avatarDataUrl ? (
										<AvatarImage src={user.avatarDataUrl} alt={name} />
									) : null}
									<AvatarFallback className="bg-linear-to-br from-amber-400/80 to-orange-500/80 text-lg text-white">
										{initials || name.slice(0, 1).toUpperCase() || "U"}
									</AvatarFallback>
								</Avatar>
								<div className="flex flex-col gap-2">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-medium text-foreground">
											{name || "Your name"}
										</span>
										<span className="text-xs text-muted-foreground">{email}</span>
									</div>
									<div className="flex gap-2">
										<Button
											type="button"
											variant="outline"
											size="sm"
											disabled={updateAvatarMutation.isPending}
											onClick={() => {
												setAvatarError(null);
												fileInputRef.current?.click();
											}}
										>
											<Upload className="size-3.5" />
											{user.avatarDataUrl ? "Change" : "Upload"}
										</Button>
										{user.avatarDataUrl ? (
											<Button
												type="button"
												variant="ghost"
												size="sm"
												disabled={updateAvatarMutation.isPending}
												onClick={async () => {
													setAvatarError(null);
													await updateAvatarMutation.mutateAsync(null);
												}}
											>
												<Trash2 className="size-3.5" />
												{updateAvatarMutation.isPending ? "Removing…" : "Remove"}
											</Button>
										) : null}
										<input
											ref={fileInputRef}
											type="file"
											accept="image/*"
											className="hidden"
											onChange={async (event) => {
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
									{avatarError ? (
										<p className="text-xs text-destructive">{avatarError}</p>
									) : null}
								</div>
							</div>

							<div className="grid gap-4 sm:grid-cols-2">
								<div className="grid gap-2">
									<Label htmlFor="profile-name">Full name</Label>
									<Input
										id="profile-name"
										type="text"
										autoComplete="name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										required
									/>
								</div>
								<div className="grid gap-2">
									<Label htmlFor="profile-email">Email</Label>
									<Input
										id="profile-email"
										type="email"
										autoComplete="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										required
									/>
								</div>
								{profileError ? (
									<p className="col-span-full text-sm text-destructive">
										{profileError}
									</p>
								) : null}
							</div>
						</CardContent>
						<CardFooter className="justify-end border-t border-border">
							<Button type="submit" disabled={updateProfileMutation.isPending}>
								<Save className="size-4" />
								{updateProfileMutation.isPending ? "Saving…" : "Save changes"}
							</Button>
						</CardFooter>
					</form>
				</Card>
			</div>
		</main>
	);
}
