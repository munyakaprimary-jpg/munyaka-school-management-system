import { useTheme } from "next-themes";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      /** Global defaults applied to every toast created by this provider. */
            toastOptions={{
              /** Auto-dismiss after 3 seconds. */
              duration: 3000,
              /** Cap visible toasts so the screen never gets cluttered. */
              unstyled: false,
              className: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
            }}
      /** Limit concurrent visible toasts to 2. */
      maxVisibleToasts={2}
      /** Show close / dismiss button on every toast. */
      closeButton
      {...props}
    />
  );
};

export { Toaster };
