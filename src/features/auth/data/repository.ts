import { useSyncExternalStore } from "react";
import { resetTrackerMockData } from "@/features/trackers/data/repository";
import type {
	AuthUser,
	SignInInput,
	SignUpInput,
	UpdatePasswordInput,
	UpdateProfileInput,
} from "../domain/types";

type AuthSnapshot = {
	user: AuthUser | null;
	hasAccount: boolean;
	isAuthenticated: boolean;
};

const USERS_KEY = "fintrack.mock-auth.users";
const SESSION_KEY = "fintrack.mock-auth.session";

const listeners = new Set<() => void>();

const delay = (ms: number) =>
	new Promise<void>((resolve) => setTimeout(resolve, ms));

function readUsers(): AuthUser[] {
	if (globalThis.window === undefined) return [];
	const raw = globalThis.window.localStorage.getItem(USERS_KEY);
	if (!raw) return [];
	try {
		const parsed = JSON.parse(raw) as AuthUser[];
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

function writeUsers(users: AuthUser[]) {
	if (globalThis.window === undefined) return;
	globalThis.window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function readSessionId() {
	if (globalThis.window === undefined) return null;
	return globalThis.window.localStorage.getItem(SESSION_KEY);
}

function writeSessionId(userId: string | null) {
	if (globalThis.window === undefined) return;
	if (userId) {
		globalThis.window.localStorage.setItem(SESSION_KEY, userId);
	} else {
		globalThis.window.localStorage.removeItem(SESSION_KEY);
	}
}

function notify() {
	for (const listener of listeners) {
		listener();
	}
}

function getCurrentUser(users: AuthUser[]) {
	const sessionId = readSessionId();
	if (!sessionId) return null;
	return users.find((user) => user.id === sessionId) ?? null;
}

function cloneUser(user: AuthUser): AuthUser {
	return { ...user };
}

function persistCurrentUser(user: AuthUser) {
	const users = readUsers();
	const updatedUsers = users.map((item) => (item.id === user.id ? user : item));
	writeUsers(updatedUsers);
	writeSessionId(user.id);
	notify();
	return cloneUser(user);
}

export const authRepository = {
	getSnapshot(): AuthSnapshot {
		const users = readUsers();
		const user = getCurrentUser(users);
		return {
			user: user ? cloneUser(user) : null,
			hasAccount: users.length > 0,
			isAuthenticated: Boolean(user),
		};
	},

	subscribe(listener: () => void) {
		listeners.add(listener);
		return () => listeners.delete(listener);
	},

	async signIn(input: SignInInput): Promise<AuthUser> {
		await delay(220);
		const users = readUsers();
		const user = users.find(
			(item) => item.email.toLowerCase() === input.email.toLowerCase(),
		);
		if (!user || user.password !== input.password) {
			throw new Error("Invalid email or password.");
		}
		writeSessionId(user.id);
		notify();
		return cloneUser(user);
	},

	async signUp(input: SignUpInput): Promise<AuthUser> {
		await delay(260);
		const users = readUsers();
		const existing = users.find(
			(item) => item.email.toLowerCase() === input.email.toLowerCase(),
		);
		if (existing) {
			throw new Error("An account with this email already exists.");
		}
		const now = new Date().toISOString();
		const user: AuthUser = {
			id: crypto.randomUUID(),
			name: input.name,
			email: input.email.toLowerCase(),
			password: input.password,
			avatarDataUrl: null,
			createdAt: now,
			updatedAt: now,
		};
		writeUsers([...users, user]);
		resetTrackerMockData();
		writeSessionId(user.id);
		notify();
		return cloneUser(user);
	},

	async signOut(): Promise<void> {
		await delay(120);
		writeSessionId(null);
		notify();
	},

	async updateProfile(input: UpdateProfileInput): Promise<AuthUser> {
		await delay(220);
		const users = readUsers();
		const current = getCurrentUser(users);
		if (!current) {
			throw new Error("No authenticated user.");
		}
		const emailTaken = users.some(
			(item) =>
				item.id !== current.id &&
				item.email.toLowerCase() === input.email.toLowerCase(),
		);
		if (emailTaken) {
			throw new Error("That email is already in use.");
		}
		const updated: AuthUser = {
			...current,
			name: input.name,
			email: input.email.toLowerCase(),
			updatedAt: new Date().toISOString(),
		};
		return persistCurrentUser(updated);
	},

	async updatePassword(input: UpdatePasswordInput): Promise<AuthUser> {
		await delay(220);
		const users = readUsers();
		const current = getCurrentUser(users);
		if (!current) {
			throw new Error("No authenticated user.");
		}
		if (current.password !== input.currentPassword) {
			throw new Error("Current password is incorrect.");
		}
		const updated: AuthUser = {
			...current,
			password: input.newPassword,
			updatedAt: new Date().toISOString(),
		};
		return persistCurrentUser(updated);
	},

	async updateAvatar(dataUrl: string | null): Promise<AuthUser> {
		await delay(180);
		const users = readUsers();
		const current = getCurrentUser(users);
		if (!current) {
			throw new Error("No authenticated user.");
		}
		const updated: AuthUser = {
			...current,
			avatarDataUrl: dataUrl,
			updatedAt: new Date().toISOString(),
		};
		return persistCurrentUser(updated);
	},
};

export function useAuthSnapshot() {
	return useSyncExternalStore(
		authRepository.subscribe,
		authRepository.getSnapshot,
		authRepository.getSnapshot,
	);
}
