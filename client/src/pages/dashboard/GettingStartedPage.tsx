import {FaAngular, FaReact, FaVuejs} from "react-icons/all";
import {DashboardCard} from "@/components/cards/DashboardCard";
import cloudflareWorker from './cloudflare_worker.js?raw';
import {CodeBlock} from "@/components/base/blocks/CodeBlock";
import {useApiToken} from "@/auth/useApiToken";

export default function GettingStartedPage() {
  const token = useApiToken();
  const tokenText = token && <span className='text-gray-400'> (the script already has your API key)</span>;
  const code = cloudflareWorker.replace("API_KEY = '';", `API_KEY = '${token}';`);
  return (
      <DashboardCard className='flex flex-col'>
        <h1 className='text-3xl text-center mb-4'>How to Render Your Single Page App for SEO</h1>
        <div className='flex-center text-3xl gap-2'>
          <FaReact className='text-[#43c3ec]' /><FaVuejs className='text-[#42b883]' /><FaAngular className='text-[#dd1b16]' />
        </div>
        <p className='text-gray-300 mt-4'>Boost the SEO of your JavaScript Single Page App (SPA) by rendering your content to HTML. This allows search engines to index your website, making it more visible to users. Follow these simple steps to pre-render your SPA using a Cloudflare Worker.</p>

        <h2 className='text-2xl mt-6 text-center'>Requirements</h2>
        <ul className='flex flex-col m-auto gap-2 list-disc mt-2 [&_*::marker]:text-zinc-500'>
          <li>Assumes you're using Cloudflare's CDN.</li>
        </ul>

        <h2 className='text-2xl mt-6 text-center'>Steps</h2>
        <ol className='flex flex-col gap-2 list-decimal m-4 [&_*::marker]:text-zinc-500'>
          <li>Open your <a className='text-blue-400 hover:text-blue-300' href='https://dash.cloudflare.com' target='_blank'>CloudFlare dashboard</a>.</li>
          <li>Go to <span className='bg-zinc-800 p-1 rounded'>{'Workers > Overview'}</span>.</li>
          <li>Click on <FakeCloudflareButton text='Create a Service' />.</li>
          <li>Give your service a name you'll remember (e.g. <StringText text='"spa-seo"' />), then click <FakeCloudflareButton text='Create service' />.</li>
          <li>Click on Triggers then <FakeCloudflareButton text='Add route' />.</li>
          <li>Add your route (e.g. <span className='bg-zinc-800 p-1 rounded'>example.com/*</span>)</li>
          <li>Now click on <FakeCloudflareButton text='Quick edit' /> in the top-right.</li>
          <li>
            <span>Paste the following worker script{tokenText}:</span>
            <CodeBlock
                classes={{
                  root: 'mt-2',
                  pre: 'max-h-96',
                  code: '[&>:nth-child(5)]:!text-transparent [&>:nth-child(5)]:text-shadow-none',
                }}
                code={code}
                language='javascript'>
            </CodeBlock>
          </li>
          <li>Finally, click <FakeCloudflareButton text='Save and deploy' />.</li>
          <li>Test that you're being served rendered HTML by changing your UserAgent to <StringText text='"bingbot"' /> or <StringText text='"googlebot"' />:
            <ul className='flex items-start flex-col gap-2 list-disc ml-4'>
              <CommandListItem text='curl -A bingbot https://yourdomain.com' />
              <CommandListItem text='lynx --useragent bingbot https://yourdomain.com' />
            </ul>
          </li>
        </ol>
      </DashboardCard>
  );
}

function FakeCloudflareButton({text}: {text: string}) {
  return <span className='bg-blue-900 p-1 rounded'>{text}</span>;
}

function StringText({text}: {text: string}) {
  return <span className='text-green-600'>{text}</span>;
}

function CommandListItem({text}: {text: string}) {
  return <li className='bg-zinc-800 rounded px-2 text-zinc-200 font-mono'>{text}</li>
}
