import {FaAngular, FaReact, FaVuejs} from "react-icons/all";
import {poll} from "@/api/call";
import {DashboardCard} from "@/components/cards/DashboardCard";

export default function GettingStartedPage() {
  const token = poll.use('getProfile')?.token;
  const tokenText = token && <span className='text-gray-400'> (the script already has your API key)</span>;
  return (
      <DashboardCard className='flex-center flex-col'>
        <h1 className='text-3xl text-center mb-4'>How to Render Your Single Page App for SEO</h1>
        <div className='flex-center text-3xl gap-2'>
          <FaReact className='text-[#43c3ec]' /><FaVuejs className='text-[#42b883]' /><FaAngular className='text-[#dd1b16]' />
        </div>
        <p className='text-gray-300 mt-4'>Boost the SEO of your JavaScript Single Page App (SPA) by rendering your content to HTML. This allows search engines to index your website, making it more visible to users. Follow these simple steps to pre-render your SPA using a Cloudflare Worker.</p>

        <h2 className='text-2xl mt-6 text-center'>Requirements</h2>
        <ul className='flex flex-col gap-2 list-disc m-4'>
          <li>Assumes you're using Cloudflare's CDN.</li>
        </ul>

        <h2 className='text-2xl mt-6 text-center'>Steps</h2>
        <ol className='flex flex-col gap-2 list-decimal m-4'>
          <li>Open your <a className='text-blue-400 hover:text-blue-300' href='https://dash.cloudflare.com' target='_blank'>CloudFlare dashboard</a>.</li>
          <li>Go to <span className='bg-zinc-800 p-1 rounded'>{'Workers > Overview'}</span>.</li>
          <li>Click on <span className='bg-zinc-800 p-1 rounded'>Create a Service</span>.</li>
          <li>Give your service a name you'll remember (e.g. <StringText text='"spa-seo"' />).</li>
          <li>Paste the following worker script{tokenText}:</li>
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

function StringText({text}: {text: string}) {
  return <span className='text-green-600'>{text}</span>;
}

function CommandListItem({text}: {text: string}) {
  return <li className='bg-zinc-800 rounded px-2 text-zinc-200 font-mono'>{text}</li>
}