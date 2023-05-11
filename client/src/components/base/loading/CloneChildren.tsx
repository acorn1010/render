import React, { useMemo } from "react";

type CloneChildrenProps = {
  className?: string;
  count: number;
  as?: "div" | "fragment";
} & React.PropsWithChildren;

/** Creates an array of children with the given count. Useful for creating loading skeletons.
 * @returns An array of children.
 * @example
 * <CloneChildren count={3}>
 *   <div>Child</div>
 * </CloneChildren>
 */
export const CloneChildren = ({
  count,
  children,
}: CloneChildrenProps) => {

  const childrenArray = useMemo(() => {
    const array:React.ReactNode[] = []
    for (let i = 0; i < count; i++) {
      array.push(< React.Fragment key={i}>{children}</React.Fragment>)
    }
    return array;
  },[count,children])

    return <>{childrenArray}</>;
};