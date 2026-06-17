export type AuthUser = {
	id: string;
	name: string;
	email: string;
	password: string;
	avatarDataUrl: string | null;
	createdAt: string;
	updatedAt: string;
};

export type SignInInput = {
	email: string;
	password: string;
};

export type SignUpInput = {
	name: string;
	email: string;
	password: string;
};

export type UpdateProfileInput = {
	name: string;
	email: string;
};

export type UpdatePasswordInput = {
	currentPassword: string;
	newPassword: string;
};
