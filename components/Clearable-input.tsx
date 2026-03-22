import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ClearableInputProps extends React.ComponentProps<typeof Input> {
  onClear: () => void;
}

export function ClearableInput({
  value,
  onChange,
  onClear,
  ...props
}: ClearableInputProps) {
  return (
    <div className="relative">
      <Input value={value} onChange={onChange} {...props} />
      {value && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
