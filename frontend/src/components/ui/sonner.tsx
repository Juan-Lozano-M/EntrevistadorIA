import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/theme/ThemeProvider";

function Toaster(props: ToasterProps) {
  const { theme } = useTheme();
  return <Sonner theme={theme} className="toaster group" {...props} />;
}

export { Toaster };
