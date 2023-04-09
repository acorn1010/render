import {focusStyle} from "@/components/base/styles";
import {cn} from "@/lib/utils";
import {IconType} from "react-icons";

/** A button that displays an icon. */
export function IconButton(props: {className?: string, icon: IconType, onClick?: () => void}) {
  const {className, icon: Icon, onClick} = props;
  return (
      <button className={cn(focusStyle, iconStyle, className)} onClick={onClick}>
        <Icon />
      </button>
  );
}

const iconStyle = cn`
  rounded
  h-8
  w-8
  p-2
  text-zinc-500

  cursor-pointer
  hover:bg-zinc-800
  hover:text-white
`;
