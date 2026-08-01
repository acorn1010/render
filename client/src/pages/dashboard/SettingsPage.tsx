import {call, poll} from "@/api/call";
import {Button} from "@/components/base/buttons/Button";
import {ApiToken} from "@/components/inputs/ApiToken";
import {DashboardCard} from "@/components/cards/DashboardCard";
import {Input} from "@/components/base/inputs/Input";
import {useState} from "react";

type RefreshRule = { pattern: string; refreshTime: number };

export default function SettingsPage() {
  const [rules, setRules] = useState<RefreshRule[]>([]);
  const [newPattern, setNewPattern] = useState("");
  const [newTime, setNewTime] = useState("");

  const addRule = () => {
    if (newPattern && newTime) {
      setRules(prev => [...prev, { pattern: newPattern, refreshTime: parseInt(newTime, 10) }]);
      setNewPattern("");
      setNewTime("");
    }
  };

  const removeRule = (index: number) => {
    setRules(prev => prev.filter((_, i) => i !== index));
  };

  const saveRules = async () => {
    await call.setCustomRefreshRules({ rules });
  };

  return (
      <DashboardCard>
        <h1 className='text-3xl text-center mb-4'>Settings</h1>
        <div className='flex-center flex-col gap-4'>
          <ApiToken />
          <Button variant='destructive' onClick={async () => {
            const token = await call.refreshToken();
            if (token) {
              poll.update('getProfile')({token});
            }
          }}>Invalidate & Renew Token</Button>

          <div className='w-full mt-8 border-t border-zinc-700 pt-4'>
            <h2 className='text-xl mb-2'>Custom Refresh Times</h2>
            <p className='text-sm text-zinc-400 mb-4'>Specify URL regex patterns and their custom refresh intervals in seconds.</p>

            <div className='flex gap-2 mb-4'>
              <Input
                placeholder="URL Regex (e.g. /blog/*)"
                value={newPattern}
                onChange={e => setNewPattern(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Refresh (sec)"
                type="number"
                value={newTime}
                onChange={e => setNewTime(e.target.value)}
                className="w-32"
              />
              <Button onClick={addRule}>Add</Button>
            </div>

            <div className='space-y-2'>
              {rules.map((rule, idx) => (
                <div key={idx} className='flex items-center justify-between bg-zinc-800 p-2 rounded'>
                  <span className='font-mono text-sm'>{rule.pattern} → {rule.refreshTime}s</span>
                  <Button variant='destructive' size='sm' onClick={() => removeRule(idx)}>Remove</Button>
                </div>
              ))}
            </div>

            <Button className='mt-4' onClick={saveRules} disabled={rules.length === 0}>Save Custom Refresh Rules</Button>
          </div>
        </div>
      </DashboardCard>
  );
}
