import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

/** Eye toggle that reveals the password ONLY while held down (press-and-hold). */
export function PasswordRevealButton({ onChange }: { onChange: (shown: boolean) => void }) {
  const [shown, setShown] = useState(false);
  const show = () => { setShown(true); onChange(true); };
  const hide = () => { setShown(false); onChange(false); };

  return (
    <button
      type="button"
      tabIndex={-1}
      aria-label={shown ? "Mostrando contraseña" : "Mantén pulsado para ver la contraseña"}
      onMouseDown={show}
      onMouseUp={hide}
      onMouseLeave={hide}
      onTouchStart={show}
      onTouchEnd={hide}
      onTouchCancel={hide}
      onContextMenu={(e) => e.preventDefault()}
      style={{ WebkitTouchCallout: "none" }}
      className="absolute right-2.5 top-1/2 grid h-7 w-7 -translate-y-1/2 select-none place-items-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
    >
      {shown ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
    </button>
  );
}
