export type ToastKind = 'success' | 'error' | 'info';

type UseToastReturn = {
	addToast: (message: string, type: ToastKind) => void;
};

export function useToast(): UseToastReturn {
	return {
		addToast: () => {
			// intentionally no-op to fully remove toast behavior without breaking callers
		},
	};
}