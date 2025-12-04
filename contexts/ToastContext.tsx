import React, {
	createContext,
	useContext,
	useState,
	useCallback,
	useEffect,
	ReactNode,
} from 'react';
import { Toast } from '../components/Toast';
import { ToastType } from '../types';

interface ToastContextType {
	showToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error('useToast must be used within a ToastProvider');
	}
	return context;
};

interface ToastItem {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
	count: number;
}

interface ToastProviderProps {
	children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
	const [toasts, setToasts] = useState<ToastItem[]>([]);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((t) => t.id !== id));
	}, []);

	const showToast = useCallback(
		(message: string, type: ToastType = 'INFO') => {
			setToasts((prev) => {
				// Check if the last toast is identical
				if (prev.length > 0) {
					const lastToast = prev[prev.length - 1];
					if (
						lastToast.message === message &&
						lastToast.type === type
					) {
						// Update the count of the last toast
						// We create a new array with the updated last item
						const updatedLastToast = {
							...lastToast,
							count: lastToast.count + 1,
							// Reset duration? If we want it to stay longer.
							// But the useEffect removes based on ID.
							// If we keep ID, the original timeout is still running.
							// We should probably generate a new ID to reset the timer?
							// OR we just accept that the timer doesn't reset for simplicity first.
							// Actually, if I spam, I want it to stay visible.
							// If I change the ID, it's a "new" toast in the eyes of the useEffect?
							// The useEffect watches `toasts`.
							// If I change ID, `toasts` changes.
							// If I DON'T change ID, `toasts` still changes (count updated).
							// The useEffect:
							// if (toasts.length > 0) { const top = toasts[0]; setTimeout(..., top.duration) }
							// It only sets timeout for the *first* toast.
							// If I am spamming the *latest* toast (end of array), it doesn't affect the *first* toast's timer unless it IS the first toast.
							// If it IS the first toast (only one), and I update it.
							// The useEffect runs again.
							// It sets a NEW timeout for the SAME ID.
							// But the OLD timeout is cleared?
							// Yes, `return () => clearTimeout(timer)`.
							// So updating the state (even just count) will reset the timer for the first toast!
							// Perfect.
						};
						return [...prev.slice(0, -1), updatedLastToast];
					}
				}

				// New toast
				const id = Math.random().toString(36).substring(7);
				return [
					...prev,
					{ id, message, type, duration: 2000, count: 1 },
				];
			});
		},
		[]
	);

	useEffect(() => {
		if (toasts.length > 0) {
			const topToast = toasts[0];
			const timer = setTimeout(() => {
				removeToast(topToast.id);
			}, topToast.duration);
			return () => clearTimeout(timer);
		}
	}, [toasts, removeToast]);

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			<div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-[9999] flex flex-col items-center pointer-events-none">
				{toasts.map((toast, index) => (
					<Toast
						key={toast.id}
						message={toast.message}
						type={toast.type}
						index={index}
						total={toasts.length}
						count={toast.count}
					/>
				))}
			</div>
		</ToastContext.Provider>
	);
};
