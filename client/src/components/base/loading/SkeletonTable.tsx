import { CloneChildren } from "./CloneChildren";
import { Skeleton } from "./Skeleton";

export function SkeletonTable({className}:{className?:string}){
    return (
        <div className={className}>
            <CloneChildren count={10} as="fragment">
              <SkeletonTableRow/>
            </CloneChildren>
        </div>
    )
}

function SkeletonTableRow(){
    return (
        <div className="flex p-4 even:border-y border-slate-700">
          <CloneChildren count={3} as="fragment">
            <div className="flex-1">
              <Skeleton className="w-24 h-6"/>
            </div>
          </CloneChildren>      
        </div>
    )
}