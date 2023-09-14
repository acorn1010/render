import React, { useMemo } from "react";

type CloneChildrenProps = {
  count: number;
} & React.PropsWithChildren;

/** Creates an array of cloned children elements with the specified count. Useful for creating loading skeletons.
 * @param count The number of times to clone the children.
 * @returns An array of cloned children elements.
 * @example
 * ```tsx
 * <CloneChildren count={3}>
 *   <div>Child</div>
 * </CloneChildren>
 * 
 * //The above example will render:
 * <div>Child</div>
 * <div>Child</div>
 * <div>Child</div>
 * ```
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