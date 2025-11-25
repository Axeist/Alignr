import { useToast } from "@/hooks/use-toast";
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, XCircle } from "lucide-react";

// Icon mapping based on variant
const getToastIcon = (variant?: string) => {
  switch (variant) {
    case "success":
      return <CheckCircle2 className="h-5 w-5 text-[#CAFF00] flex-shrink-0 drop-shadow-[0_0_8px_rgba(202,255,0,0.6)]" />;
    case "destructive":
      return <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]" />;
    case "warning":
      return <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(234,179,8,0.6)]" />;
    case "info":
      return <Info className="h-5 w-5 text-cyan-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]" />;
    default:
      return <Info className="h-5 w-5 text-gray-400 flex-shrink-0" />;
  }
};

export function Toaster() {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const icon = getToastIcon(variant);
        
        return (
          <Toast key={id} variant={variant as any} {...props}>
            <div className="flex gap-3 flex-1 min-w-0">
              {/* Icon */}
              <div className="flex-shrink-0 mt-0.5">
                {icon}
              </div>
              
              {/* Content */}
              <div className="grid gap-1 flex-1 min-w-0">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
