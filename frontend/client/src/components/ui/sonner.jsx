import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        className: "loader",
        style: {
          width: "fit-content",
          height: "fit-content",
          backgroundColor: "rgb(58, 58, 58)",
          borderRadius: "7px",
          padding: "10px 16px 10px 20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: "pointer",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 8px 30px rgba(0, 0, 0, 0.5)",
          color: "rgba(255, 255, 255, 0.92)",
          fontSize: "13px",
          fontWeight: "500",
          fontFamily: '"Space Grotesk", ui-sans-serif, system-ui, sans-serif',
          gap: "10px",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

