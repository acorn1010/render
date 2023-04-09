import {Input} from "@/components/base/inputs/Input";
import {useState} from "react";
import {FaCheck, FaCopy, FaEye, FaEyeSlash} from "react-icons/all";
import {cn} from "@/lib/utils";
import {poll} from "@/api/call";
import {IconButton} from "@/components/base/buttons/IconButton";

export function ApiToken() {
  const [isHidden, setIsHidden] = useState(true);
  const token = poll.use('getProfile')?.token ?? '';

  const EyeIcon = isHidden ? FaEyeSlash : FaEye;
  return (
      <div className='flex-center gap-2'>
        <p>API Token</p>
        <div className='flex relative w-72'>
          <Input className='font-mono' type={isHidden ? 'password' : 'text'} value={token} />
          <IconButton
              icon={EyeIcon}
              className='absolute top-1/2 -translate-y-1/2 right-0 my-auto mr-1'
              onClick={() => setIsHidden(prevState => !prevState)} />
        </div>
        <CopyButton value={token} />
      </div>
  )
}

/** A button that allows copying `value` to the clipboard. */
function CopyButton({value}: {value: string}) {
  const [isCopied, setIsCopied] = useState(false);

  const CopyIcon = isCopied ? FaCheck : FaCopy;
  return (
      <IconButton icon={CopyIcon}
          className={cn(isCopied && 'text-green-700 hover:text-green-500')}
          onClick={() => {
            navigator.clipboard.writeText(value).then(() => {
              setIsCopied(true);
              setTimeout(() => setIsCopied(false), 1_500);
            });
          }} />
  )
}
