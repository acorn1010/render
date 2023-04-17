import {Input} from "@/components/base/inputs/Input";
import {useState} from "react";
import {FaEye, FaEyeSlash} from "react-icons/all";
import {poll} from "@/api/call";
import {IconButton} from "@/components/base/buttons/IconButton";
import {CopyButton} from "@/components/buttons/CopyButton";

export function ApiToken() {
  const [isHidden, setIsHidden] = useState(true);
  const token = poll.use('getProfile')?.token ?? '';

  const EyeIcon = isHidden ? FaEyeSlash : FaEye;
  return (
      <div className='flex-center gap-2'>
        <p>API Token</p>
        <div className='flex relative w-72'>
          <Input className='font-mono' type={isHidden ? 'password' : 'text'} value={token} readOnly />
          <IconButton
              icon={EyeIcon}
              className='absolute top-1/2 -translate-y-1/2 right-0 my-auto mr-1'
              onClick={() => setIsHidden(prevState => !prevState)} />
        </div>
        <CopyButton value={token} />
      </div>
  )
}

