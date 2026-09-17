import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-[rgba(18,165,184,0.5)] focus-visible:outline-offset-2",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-[#0B4F58] to-[#0E7C8A] text-[#FFFFFF] border border-[#12A5B8]/40 shadow-[0_0_15px_rgba(18,165,184,0.2)] hover:shadow-[0_0_20px_rgba(18,165,184,0.4)] hover:-translate-y-0.5 active:translate-y-0 cursor-pointer",
        secondary: "bg-[#132127] text-[#FFFFFF] hover:bg-[#1C323B] border border-[#1C323B] shadow-sm cursor-pointer",
        outline: "border border-[#1C323B] bg-[#0D171C] text-[#F0F6F8] hover:border-[#12A5B8] hover:bg-[#132127] hover:text-[#FFFFFF] cursor-pointer",
        ghost: "text-[#F0F6F8] hover:bg-[#132127] hover:text-[#FFFFFF] cursor-pointer",
        link: "text-[#12A5B8] underline-offset-4 hover:underline cursor-pointer",
        success: "bg-[#0E7C8A] text-[#FFFFFF] hover:bg-[#12A5B8] shadow-sm cursor-pointer",
        destructive: "bg-[#B9654D] text-[#FFFFFF] hover:bg-[#994732] shadow-sm cursor-pointer",
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
