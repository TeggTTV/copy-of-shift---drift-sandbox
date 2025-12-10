import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { getFullUrl } from '../../utils/prisma';

interface LoginModalProps {
	isOpen: boolean;
	onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
	const { login } = useAuth();
	const { showToast } = useToast();
	const [isSignup, setIsSignup] = useState(false);
	const [email, setEmail] = useState(''); // or username
	const [username, setUsername] = useState('');
	const [password, setPassword] = useState('');
	const [loading, setLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		const endpoint = isSignup
			? getFullUrl('/api/auth/signup')
			: getFullUrl('/api/auth/login');
		const body = isSignup
			? { username, email, password }
			: { email, password }; // Login with email or username? API supports email often, let's assume email.

		try {
			const res = await fetch(endpoint, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			});

			const data = (await res.json()) as any;

			if (res.ok) {
				showToast(
					isSignup ? 'Account created!' : 'Logged in!',
					'SUCCESS'
				);

				// If signup, maybe assume auto-login or ask to login?
				// For now, API returns token on signup too?
				// Let's assume login returns token.
				// If signup doesn't return token, we simulate login or ask to login.
				// Usually signup returns token. If not, switch to login.
				if (data.token) {
					login(data.token, data.user);
					onClose();
				} else {
					setIsSignup(false);
				}
			} else {
				showToast(data.message || 'Error', 'ERROR');
			}
		} catch (err) {
			showToast('Network error', 'ERROR');
		} finally {
			setLoading(false);
		}
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 font-pixel">
			<div className="bg-gray-900 border-2 border-cyan-500 p-6 w-full max-w-sm relative shadow-2xl">
				<button
					onClick={onClose}
					className="absolute top-2 right-2 text-gray-500 hover:text-white"
				>
					[X]
				</button>

				<h2 className="text-2xl text-cyan-400 mb-6 text-center">
					{isSignup ? 'NEW DRIVER' : 'DRIVER LOGIN'}
				</h2>

				<form onSubmit={handleSubmit} className="space-y-4">
					{isSignup && (
						<div>
							<label className="block text-gray-400 text-xs mb-1">
								USERNAME
							</label>
							<input
								type="text"
								value={username}
								onChange={(e) =>
									setUsername(
										(e.target as HTMLInputElement).value
									)
								}
								className="w-full bg-black border border-gray-700 text-white p-2 focus:border-cyan-500 outline-none"
								required
							/>
						</div>
					)}

					<div>
						<label className="block text-gray-400 text-xs mb-1">
							EMAIL
						</label>
						<input
							type="email"
							value={email}
							onChange={(e) =>
								setEmail((e.target as HTMLInputElement).value)
							}
							className="w-full bg-black border border-gray-700 text-white p-2 focus:border-cyan-500 outline-none"
							required
						/>
					</div>

					<div>
						<label className="block text-gray-400 text-xs mb-1">
							PASSWORD
						</label>
						<input
							type="password"
							value={password}
							onChange={(e) =>
								setPassword(
									(e.target as HTMLInputElement).value
								)
							}
							className="w-full bg-black border border-gray-700 text-white p-2 focus:border-cyan-500 outline-none"
							required
						/>
					</div>

					<button
						type="submit"
						disabled={loading}
						className="w-full bg-cyan-700 hover:bg-cyan-600 text-white py-3 mt-4 border-b-4 border-cyan-900 active:border-b-0 active:mt-5 transition-all"
					>
						{loading
							? 'PROCESSING...'
							: isSignup
							? 'CREATE ACCOUNT'
							: 'LOGIN'}
					</button>
				</form>

				<div className="mt-4 text-center text-xs text-gray-500">
					<button
						onClick={() => setIsSignup(!isSignup)}
						className="underline hover:text-cyan-300"
					>
						{isSignup
							? 'Already have an account? Login'
							: 'No account? Create one'}
					</button>
				</div>
			</div>
		</div>
	);
};
