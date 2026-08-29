import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        style: {
          background: "#112557",
          color: "#f8fbff",
          border: "1px solid rgba(183, 242, 58, 0.35)",
          borderLeft: "4px solid #b7f23a",
          borderRadius: "8px",
          boxShadow:
            "0 8px 32px rgba(17, 37, 87, 0.35), 0 0 0 1px rgba(255,255,255,0.06)",
          padding: "14px 18px",
          fontSize: "13px",
          fontWeight: "600",
          fontFamily:
            '"Manrope", ui-sans-serif, system-ui, sans-serif',
          gap: "10px",
        },
        classNames: {
          toast: "toaster-item",
          title: "toaster-title",
          description: "toaster-desc",
          actionButton: "toaster-action",
          cancelButton: "toaster-cancel",
          icon: "toaster-icon",
          success: "toaster-success",
          error: "toaster-error",
          warning: "toaster-warning",
          info: "toaster-info",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

