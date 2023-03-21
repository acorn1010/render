import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {createTRPCReact, httpBatchLink} from '@trpc/react-query';
import {AppRouter} from 'prerender-server';
import {PropsWithChildren} from "react";

// Notice the <AppRouter> generic here.
const trpc = createTRPCReact<AppRouter>();

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'https://render.acorn1010.com/api',
      headers() {
        return {
          // FIXME(acorn1010): Include Firebase JWT token
          // authorization: getToken(),
        };
      },
    }),
  ],
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000 /** 1 minute */,
    },
  },
});

export function TrpcProvider({children}: PropsWithChildren<{}>) {
  return (
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </trpc.Provider>
  )
}
