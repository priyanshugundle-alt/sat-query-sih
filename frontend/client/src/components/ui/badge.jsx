import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border-2 px-3 py-1 text-xs font-bold w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none font-mono uppercase tracking-wider transition-all overflow-hidden shadow-lg",
  {
    variants: {
      variant: {
        default:
          "border-cyan-400 bg-cyan-500/20 text-cyan-300 shadow-cyan-500/30 [a&]:hover:bg-cyan-500/30 [a&]:hover:shadow-cyan-500/50",
        secondary:
          "border-slate-600 bg-slate-700/50 text-slate-300 shadow-slate-700/30 [a&]:hover:bg-slate-600/70",
        destructive:
          "border-orange-400 bg-orange-500/20 text-orange-300 shadow-orange-500/30 [a&]:hover:bg-orange-500/30 [a&]:hover:shadow-orange-500/50",
        outline:
          "border-slate-600 bg-transparent text-slate-300 [a&]:hover:bg-slate-800",
        success:
          "border-emerald-400 bg-emerald-500/20 text-emerald-300 shadow-emerald-500/30 [a&]:hover:bg-emerald-500/30 [a&]:hover:shadow-emerald-500/50",
        live:
          "border-cyan-300 bg-cyan-400/20 text-cyan-200 shadow-cyan-400/40 animate-pulse [a&]:hover:bg-cyan-400/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);
function Badge({ className, variant, asChild = false, ...props }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}
export { Badge, badgeVariants };
