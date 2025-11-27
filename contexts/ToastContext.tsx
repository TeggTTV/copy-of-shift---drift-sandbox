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
			const id = Math.random().toString(36).substring(7);
			setToasts((prev) => [
				...prev,
				{ id, message, type, duration: 2000 },
			]);
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
					/>
				))}
			</div>
		</ToastContext.Provider>
	);
};
