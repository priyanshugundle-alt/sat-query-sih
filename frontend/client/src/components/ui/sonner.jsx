import { Toaster as Sonner } from "sonner";

const Toaster = ({ ...props }) => {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        className: "satquery-toast-item",
      }}
      {...props}
    />
  );
};

export { Toaster };

