import {Button as MuiButton, ButtonProps as MuiButtonProps} from '@mui/material';

type ButtonProps = Pick<MuiButtonProps, 'children' | 'onClick'>;
export function Button(props: ButtonProps) {
  const {children, onClick} = props;
  return <MuiButton onClick={onClick}>{children}</MuiButton>;
}
