import {cn} from "@/lib/utils";
import {IconButton} from "@/components/base/buttons/IconButton";
import {FaCheck, FaCopy} from "react-icons/all";
import {useState} from "react";

/** A button that allows copying `value` to the clipboard. */
export function CopyButton({className, value}: {className?: string, value: string}) {
  const [isCopied, setIsCopied] = useState(false);

  const CopyIcon = isCopied ? FaCheck : FaCopy;
  return (
      <IconButton
          icon={CopyIcon}
          className={cn(isCopied && 'text-green-700 hover:text-green-500', className)}
          onClick={() => {
            navigator.clipboard.writeText(value).then(() => {
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 1_500);
            });
          }} />
  )
}
