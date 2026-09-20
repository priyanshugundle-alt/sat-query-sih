import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        style: {
          width: "fit-content",
          height: "fit-content",
          backgroundColor: "#0D171C",
          borderRadius: "12px",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          cursor: "pointer",
          border: "1px solid #1C323B",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.6), 0 0 15px rgba(18, 165, 184, 0.15)",
          color: "#F0F6F8",
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

