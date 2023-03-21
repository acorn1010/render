import {Button as MuiButton, ButtonProps as MuiButtonProps} from '@mui/material';

type ButtonProps = Pick<MuiButtonProps, 'children' | 'className' | 'onClick'>;
export function Button(props: ButtonProps) {
  const {children, className, onClick} = props;
  return (
      <MuiButton className={className} onClick={onClick}>
        {children}
      </MuiButton>
  );
}
