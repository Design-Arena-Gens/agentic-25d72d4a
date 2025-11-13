"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';

type Role = 'user' | 'assistant' | 'system';

type Message = {
  id: string;
  role: Role;
  content: string;
  attachments?: { name: string; type: string; dataUrl: string }[];
  timestamp: number;
};

type AgentResponse = {
  reply: string;
  language: 'en' | 'af';
  action?:
    | 'general_info'
    | 'list_services'
    | 'estimate_flow'
    | 'booking_flow'
    | 'status_lookup'
    | 'tips'
    | 'insurance_info';
  fieldsRequested?: string[];
  suggestions?: string[];
};

const initialGreeting = {
  en: "Welcome! I?m your assistant for De Jongh?s Panelbeating Centre. How can I help today?",
  af: "Welkom! Ek is jou assistent vir De Jongh?s Paneelklop Sentrum. Hoe kan ek help vandag?",
};

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [language, setLanguage] = useState<'en' | 'af'>('en');
  const [isSending, setIsSending] = useState(false);
  const [attachments, setAttachments] = useState<{ name: string; type: string; dataUrl: string }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: initialGreeting[language],
          timestamp: Date.now(),
        },
      ]);
    }
  }, [language, messages.length]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const suggestions = useMemo(() => {
    return language === 'en'
      ? [
          'What services do you offer?',
          'Can I get a repair estimate?',
          'Help with an insurance claim',
          'Book my car in',
          'Check my job status',
          'How long do repairs take?',
          'Paint care tips',
        ]
      : [
          'Watter dienste bied julle?',
          'Kan ek ?n skatting kry?',
          'Hulp met ?n versekeringseis',
          'Maak ?n bespreking',
          'Kontroleer my werkstatus',
          'Hoe lank neem herstelwerk?',
          'Verfsorg wenke',
        ];
  }, [language]);

  async function handleSend(e?: FormEvent) {
    e?.preventDefault();
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    const newUserMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      attachments: attachments.length ? attachments : undefined,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setAttachments([]);
    setIsSending(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          messages: [...messages, newUserMessage].slice(-12),
        }),
      });
      const data: AgentResponse = await res.json();
      if (data.language && data.language !== language) {
        setLanguage(data.language);
      }
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const fallback: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content:
          language === 'en'
            ? 'Sorry, I had trouble responding. Please try again.'
            : 'Jammer, ek het probleme ondervind. Probeer asseblief weer.',
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, fallback]);
    } finally {
      setIsSending(false);
    }
  }

  function onPickSuggestion(text: string) {
    setInput(text);
    // send immediately to keep flow snappy
    setTimeout(() => handleSend(), 0);
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const list = Array.from(files).slice(0, 3); // limit to 3
    const readers = list.map(
      (file) =>
        new Promise<{ name: string; type: string; dataUrl: string }>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: String(reader.result) });
          reader.onerror = reject;
          reader.readAsDataURL(file);
        })
    );
    Promise.all(readers).then((items) => setAttachments(items));
  }

  return (
    <section className="chat">
      <div className="toolbar">
        <div className="lang">
          <label htmlFor="lang">Language</label>
          <select
            id="lang"
            value={language}
            onChange={(e) => setLanguage(e.target.value as 'en' | 'af')}
          >
            <option value="en">English</option>
            <option value="af">Afrikaans</option>
          </select>
        </div>
        <div className="tips">
          {suggestions.map((s) => (
            <button key={s} className="chip" onClick={() => onPickSuggestion(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="messages" role="log" aria-live="polite">
        {messages.map((m) => (
          <div key={m.id} className={`msg ${m.role}`}>
            <div className="bubble">
              <p>{m.content}</p>
              {m.attachments?.length ? (
                <div className="attachments">
                  {m.attachments.map((a, i) => (
                    <img key={i} src={a.dataUrl} alt={a.name} />
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <form className="composer" onSubmit={handleSend}>
        <input
          type="text"
          placeholder={
            language === 'en'
              ? 'Type your message?'
              : 'Tik jou boodskap?'
          }
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label="Message"
        />
        <label className="upload">
          <input type="file" accept="image/*" multiple onChange={onFileChange} />
          <span>{language === 'en' ? 'Add photos' : 'Voeg foto?s by'}</span>
        </label>
        <button type="submit" disabled={isSending}>
          {isSending ? (language === 'en' ? 'Sending?' : 'Stuur?') : (language === 'en' ? 'Send' : 'Stuur')}
        </button>
      </form>
    </section>
  );
}
