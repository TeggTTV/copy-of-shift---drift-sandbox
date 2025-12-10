import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	useCallback,
} from 'react';
import { useAuth, User } from './AuthContext';
import { useToast } from './ToastContext';
import { getFullUrl } from '../utils/prisma';

export interface PartyMember {
	id: string;
	username: string;
	level: number;
}

export interface Party {
	id: string;
	hostId: string;
	members: PartyMember[];
	activeRaceId?: string;
	status?: string; // e.g. 'COUNTDOWN', 'RACING'
}

interface PartyContextType {
	party: Party | null;
	isLoading: boolean;
	createParty: () => Promise<void>;
	leaveParty: () => Promise<void>;
	joinParty: (partyId: string) => Promise<void>;
	startRace: () => Promise<void>;
}

const PartyContext = createContext<PartyContextType | null>(null);

export const useParty = () => {
	const context = useContext(PartyContext);
	if (!context)
		throw new Error('useParty must be used within a PartyProvider');
	return context;
};

export const PartyProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const { user, token, isOnline, refreshUser } = useAuth();
	const { showToast } = useToast();
	const [party, setParty] = useState<Party | null>(null);
	const [isLoading, setIsLoading] = useState(false);

	// Poll Party Status
	useEffect(() => {
		if (!isOnline || !user?.partyId || !token) {
			setParty(null);
			return;
		}

		console.log('Poll Party Status active', { userPartyId: user.partyId });

		const fetchParty = async () => {
			if (token === 'mock-token') {
				// Mock Data Logic
				const currentParty = {
					id: 'party-123',
					hostId: 'dev-123',
					members: [
						{ id: 'dev-123', username: 'Devracer', level: 5 },
						{ id: 'p2', username: 'SpeedKing', level: 8 },
						{ id: 'p3', username: 'DriftQueen', level: 12 },
					],
					activeRaceId: undefined as string | undefined, // Explicit type for TS
				};

				// Simulate race state if needed (can add mock logic here later to toggle activeRaceId)
				// For now, we keep it simple or allow manual triggers via console if we want to test deeper
				setParty(currentParty);
				return;
			}

			try {
				const res = await fetch(getFullUrl('/api/party'), {
					headers: { Authorization: `Bearer ${token}` },
				});
				if (res.ok) {
					const data = await res.json();
					if (data) {
						setParty(data as Party);
					} else {
						setParty(null);
					}
				} else {
					// 404 or other error probably means no party
					setParty(null);
				}
			} catch (e) {
				// Silent fail
			}
		};

		fetchParty();
		const interval = setInterval(fetchParty, 1000); // Polling every 1s for better responsiveness
		return () => clearInterval(interval);
	}, [isOnline, user?.partyId, token]);

	const createParty = async () => {
		// API call to create party (usually implicit if not in one, or specific endpoint)
		// For now assuming joining/hosting is handled, but if we need a create button:
		if (!token) return;
		try {
			// Assuming there's a create endpoint or simply joining creates one?
			// Based on `api/party` POST, it might be join.
			// `api/race` handling might check if party exists.
			// Currently our HostMenu implied "if in party -> show menu".
			// To Create: logic might be missing or automated.
			// Let's assume for now we reuse existing endpoints.
			// Actually, typical flow: click "Host", calls API to make party.
			// If not exists, maybe `POST /api/party?action=create`?
			// Let's stub this for now as user didn't ask for "Create" button explicitly yet, just "HostMenu" which appears when in party.
		} catch (e) {
			showToast('Failed to create party', 'ERROR');
		}
	};

	const joinParty = async (partyId: string) => {
		if (!token) return;
		setIsLoading(true);
		try {
			const res = await fetch(getFullUrl('/api/party/join'), {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`,
				},
				body: JSON.stringify({ partyId }),
			});
			if (res.ok) {
				showToast('Joined Party!', 'SUCCESS');
				if (refreshUser) await refreshUser();
			} else {
				const data = (await res.json()) as any;
				showToast(data.message, 'ERROR');
			}
		} catch (e) {
			showToast('Error joining', 'ERROR');
		} finally {
			setIsLoading(false);
		}
	};

	const leaveParty = async () => {
		if (!token) return;
		try {
			await fetch(getFullUrl('/api/party'), {
				method: 'DELETE',
				headers: { Authorization: `Bearer ${token}` },
			});
			setParty(null);
			if (refreshUser) await refreshUser();
			// No reload, just state update
		} catch (e) {
			showToast('Failed to leave', 'ERROR');
		}
	};

	const startRace = async () => {
		if (!token) return;
		try {
			const res = await fetch(getFullUrl('/api/race', 'action=create'), {
				method: 'POST',
				headers: { Authorization: `Bearer ${token}` },
			});
			if (res.ok) {
				showToast('Race Initialized!', 'SUCCESS');
				// Polling will pick up the activeRaceId
			}
		} catch (e) {
			showToast('Failed to start', 'ERROR');
		}
	};

	return (
		<PartyContext.Provider
			value={{
				party,
				isLoading,
				createParty,
				leaveParty,
				joinParty,
				startRace,
			}}
		>
			{children}
		</PartyContext.Provider>
	);
};
