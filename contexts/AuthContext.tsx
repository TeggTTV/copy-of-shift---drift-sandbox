import React, { createContext, useContext, useState, useEffect } from 'react';
import { getFullUrl } from '../utils/prisma';

// Basic JWT Decode Helper
const decodeJwt = (token: string) => {
	try {
		const base64Url = token.split('.')[1];
		const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
		const jsonPayload = decodeURIComponent(
			window
				.atob(base64)
				.split('')
				.map(function (c) {
					return (
						'%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
					);
				})
				.join('')
		);
		return JSON.parse(jsonPayload);
	} catch (e) {
		return null;
	}
};

export interface User {
	id: string;
	username: string;
	email: string;
	partyId?: string;
	level?: number;
	partyInvites?: string[];
}

interface AuthContextType {
	user: User | null;
	token: string | null;
	isOnline: boolean;
	login: (token: string, userData: User) => void;
	logout: () => void;
	refreshUser: () => Promise<void>;
	isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<User | null>(null);
	const [token, setToken] = useState<string | null>(null);
	const [isOnline, setIsOnline] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Check for token in localStorage on mount
		const storedToken = localStorage.getItem('auth_token');
		const storedUser = localStorage.getItem('auth_user');

		if (storedToken && storedUser) {
			// Basic expiration check using helper
			const decoded = decodeJwt(storedToken);
			// If mock token, skip expiration
			const isMock = storedToken === 'mock-token';

			if (isMock || (decoded && decoded.exp * 1000 > Date.now())) {
				setToken(storedToken);
				setUser(JSON.parse(storedUser));
				setIsOnline(true);
			} else {
				// Expired
				localStorage.removeItem('auth_token');
				localStorage.removeItem('auth_user');
			}
		} else {
			// No token found - User remains offline
			setIsLoading(false);
		}
		setIsLoading(false);
		setIsLoading(false);
	}, []);

	const login = (newToken: string, userData: User) => {
		setToken(newToken);
		setUser(userData);
		setIsOnline(true);
		localStorage.setItem('auth_token', newToken);
		localStorage.setItem('auth_user', JSON.stringify(userData));
	};

	const logout = () => {
		setToken(null);
		setUser(null);
		setIsOnline(false);
		localStorage.removeItem('auth_token');
		localStorage.removeItem('auth_user');
	};

	const refreshUser = async () => {
		if (!token || !user) return;

		// Mock Refresh
		if (token === 'mock-token') {
			// Just indicate success
			return;
		}

		try {
			const res = await fetch(
				getFullUrl('/api/users/:id').replace(':id', user.id),
				{
					headers: { Authorization: `Bearer ${token}` },
				}
			);
			if (res.ok) {
				const data = await res.json();
				const updatedUser = { ...user, ...data };
				setUser(updatedUser);
				localStorage.setItem('auth_user', JSON.stringify(updatedUser));
			}
		} catch (e) {
			console.error(e);
		}
	};

	return (
		<AuthContext.Provider
			value={{
				user,
				token,
				isOnline,
				login,
				logout,
				refreshUser,
				isLoading,
			}}
		>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};
