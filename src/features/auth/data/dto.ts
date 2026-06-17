import type { AuthUser } from "../domain/types";

// Wire shapes from the API (snake_case). Kept inside the data layer; the rest
// of the app only ever sees the camelCase domain types.

export type TokenResponseDto = {
	access_token: string;
	refresh_token: string;
	token_type: string;
};

export type UserResponseDto = {
	id: string;
	name: string;
	email: string;
	is_active: boolean;
	avatar_url: string | null;
	created_at: string;
	updated_at: string;
};

export function mapUser(dto: UserResponseDto): AuthUser {
	return {
		id: dto.id,
		name: dto.name,
		email: dto.email,
		password: "",
		avatarDataUrl: dto.avatar_url,
		createdAt: dto.created_at,
		updatedAt: dto.updated_at,
	};
}
