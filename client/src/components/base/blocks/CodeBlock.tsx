import {PropsWithChildren, useEffect, useRef} from "react";
import Prism from "prismjs";
import {CopyButton} from "@/components/buttons/CopyButton";
import {cn} from "@/lib/utils";
import './prism.css';

type CodeBlockProps = PropsWithChildren<{classes?: {root?: string, pre?: string, code?: string}, code: string, language: 'javascript'}>;
export function CodeBlock({classes, code, language}: CodeBlockProps) {
  const codeRef = useRef<HTMLPreElement>(null);

  const element = codeRef.current;
  useEffect(() => {
    if (element) {
      Prism.highlightElement(element);
    }
  }, [code, element]);

  return (
      <div className={classes?.root}>
        <div className='flex items-center justify-between bg-slate-700 py-2 px-4 rounded-t-md'>
          <p>{language}</p>
          <CopyButton className='text-slate-100 hover:bg-slate-600 active:bg-slate-800' value={code} />
        </div>
        <pre className={cn('!rounded-t-none !mt-0', language &&  `language-${language}`, classes?.pre)}>
          <code className={cn(`language-${language}`, classes?.code)} ref={codeRef}>{code}</code>
        </pre>
      </div>
  );
}
