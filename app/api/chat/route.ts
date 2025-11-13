import { NextResponse } from 'next/server';
import { runAgent, type AgentInput } from '@/lib/agent';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as AgentInput;
    const result = runAgent(body);

    // If status lookup fields included in conversation, simulate a status response
    const lastUser = [...(body.messages || [])].reverse().find((m) => m.role === 'user');
    const txt = (lastUser?.content || '').toLowerCase();
    const refMatch = txt.match(/(dj[-\s]?\d{4,6})/i);
    const regMatch = txt.match(/([a-z]{2,3}\s?\d{2,3}\s?[a-z]{2,3})/i);
    if (result.action === 'status_lookup' && refMatch) {
      const ref = refMatch[1].toUpperCase().replace(/\s+/, '-');
      const stageList = [
        'Checked in',
        'Assessment complete',
        'Parts ordered',
        'Panel beating in progress',
        'Spray painting',
        'Final polish and QA',
        'Ready for collection',
      ];
      const stageIdx = (ref.length + (regMatch?.[1]?.length || 0)) % stageList.length;
      const stage = stageList[stageIdx];
      const en = `Status for ${ref}: ${stage}. Estimated completion in ${1 + (stageIdx % 3)}?${2 + (stageIdx % 4)} days.`;
      const af = `Status vir ${ref}: ${stage}. Geskatte voltooiing oor ${1 + (stageIdx % 3)}?${2 + (stageIdx % 4)} dae.`;
      result.reply = result.language === 'af' ? af : en;
      result.suggestions = result.language === 'af' ? ['Maak ?n bespreking', 'Kontak ons'] : ['Book my car in', 'Contact us'];
    }

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { reply: 'Server error', language: 'en' },
      { status: 500 }
    );
  }
}
