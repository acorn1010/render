import {cn} from "@/lib/utils";

/** Adds a focus ring to the class. Used for elements that can be focused (e.g. Button). */
export const focusStyle = cn`
  dark:focus:ring-offset-slate-900
  dark:focus:ring-slate-400

  focus:outline-none
  focus:ring-2
  focus:ring-offset-2
  focus:ring-slate-400
`;
