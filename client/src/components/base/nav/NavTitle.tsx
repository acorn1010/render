import {Link} from "wouter";

export function NavTitle() {
  return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-shrink-0 items-center">
          <Link to='/'>
            <h1 className="text-neutral-300 hover:text-white">Home</h1>
          </Link>
        </div>
      </div>
  );
}
