import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-[rgba(217,154,43,0.5)] focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#D99A2B] to-[#F0B84B] text-white shadow-sm hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        secondary: "bg-[#292B32] text-white hover:bg-[#171821] shadow-sm",
        outline: "border-2 border-[#D9DDDE] bg-white text-[#202127] hover:border-[#D99A2B] hover:bg-[rgba(217,154,43,0.04)]",
        ghost: "text-[#202127] hover:bg-[#F5F6F3]",
        link: "text-[#D99A2B] underline-offset-4 hover:underline",
        success: "bg-[#607C57] text-white hover:bg-[#4d6346] shadow-sm",
        destructive: "bg-[#C94B4B] text-white hover:bg-[#b33d3d] shadow-sm",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 px-4 text-xs",
        lg: "h-12 px-7 text-base",
        icon: "size-10",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant, size, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
