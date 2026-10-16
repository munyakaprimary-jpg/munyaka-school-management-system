import { toast } from "sonner";

/** Re-export the raw sonner `toast` for callers that need direct access. */
export { toast };

/** Default auto-dismiss duration in milliseconds. */
const DEFAULT_DURATION_MS = 3000;

/** Dismiss all existing toasts before showing a new one — prevents stacking
 *  when buttons are clicked rapidly or multiple handlers fire in sequence. */
const dismissAllBeforeNew = () => {
  toast.dismiss();
};

export const showSuccess = (message: string, duration: number = DEFAULT_DURATION_MS) => {
  dismissAllBeforeNew();
  toast.success(message, {
    duration,
  });
};

export const showError = (message: string, duration: number = DEFAULT_DURATION_MS) => {
  dismissAllBeforeNew();
  toast.error(message, {
    duration,
  });
};

export const showWarning = (message: string, duration: number = DEFAULT_DURATION_MS) => {
  dismissAllBeforeNew();
  toast.warning(message, {
    duration,
  });
};

export const showLoading = (message: string) => {
  return toast.loading(message, {
    duration: Infinity, // Loading toasts must be manually dismissed via dismissToast()
  });
};

export const dismissToast = (toastId?: string | number) => {
  if (toastId !== undefined && toastId !== null) {
    toast.dismiss(toastId);
  } else {
    toast.dismiss(); // Dismiss all
  }
};

/**
 * Show a rich success toast with an optional action button.
 * Use this when a download may be blocked by pop-up blockers so the user
 * has an immediate "Download Certificate PDF" fallback.
 *
 * @param message       Primary success message shown in the toast body.
 * @param actionLabel   Label for the optional button (e.g. "Download Certificate PDF").
 * @param onAction      Callback fired when the action button is clicked.
 * @param actionAriaLabel Accessibility label for the action button.
 */
export function showSuccessWithAction(
  message: string,
  actionLabel?: string,
  onAction?: () => void,
  _actionAriaLabel?: string
) {
  if (actionLabel && onAction) {
    toast.success(message, {
      action: {
        label: actionLabel,
        onClick: onAction,
      },
      duration: 10000, // Keep the toast visible longer when there's an action
    });
  } else {
    toast.success(message);
  }
}
