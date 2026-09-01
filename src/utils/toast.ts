import { toast } from "sonner";

export const showSuccess = (message: string) => {
  toast.success(message);
};

export const showError = (message: string) => {
  toast.error(message);
};

export const showLoading = (message: string) => {
  return toast.loading(message);
};

export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
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
  actionAriaLabel?: string
) {
  if (actionLabel && onAction) {
    toast.success(message, {
      action: {
        label: actionLabel,
        onClick: onAction,
        ariaLabel: actionAriaLabel,
      },
      duration: 10000, // Keep the toast visible longer when there's an action
    });
  } else {
    toast.success(message);
  }
}
