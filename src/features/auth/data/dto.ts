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
	created_at: string;
};

// The API has no password/avatar/updatedAt; fill domain-only fields with safe
// defaults so the existing AuthUser-shaped UI keeps working.
export function mapUser(dto: UserResponseDto): AuthUser {
	return {
		id: dto.id,
		name: dto.name,
		email: dto.email,
		password: "",
		avatarDataUrl: null,
		createdAt: dto.created_at,
		updatedAt: dto.created_at,
	};
}
