'use client';

import { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useNotification } from '@/hooks/useNotification';

function generateChallenge() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b}`, answer: a + b };
}

const inputStyle =
  'w-full border-0 border-b border-ot-line bg-transparent py-2 font-sans text-[15px] text-ot-ink outline-none focus:border-ot-ochre transition-colors resize-none';

export default function ContactPage() {
  const notify = useNotification();
  const [form, setForm] = useState({ name: '', email: '', message: '' });
  const [honeypot, setHoneypot] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [challenge, setChallenge] = useState(generateChallenge);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const captchaValid = useMemo(
    () => captchaInput.trim() === String(challenge.answer),
    [captchaInput, challenge.answer],
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (honeypot) return;
    if (!captchaValid) {
      notify.error('Incorrect answer, please try again');
      setChallenge(generateChallenge());
      setCaptchaInput('');
      return;
    }
    setSending(true);
    try {
      await api.contacts.create(form);
      setSent(true);
      notify.success('Message sent!');
    } catch (err: unknown) {
      notify.error(err instanceof Error ? err.message : 'Failed to send message');
      setChallenge(generateChallenge());
      setCaptchaInput('');
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="max-w-xl mx-auto px-5 pt-20 md:pt-28 pb-24 text-center">
        <h1 className="ot-display text-[48px] md:text-[80px] m-0 leading-[1.02]">Thank you!</h1>
        <p className="text-ot-ink-soft mt-4">
          Your message has been sent. We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <main>
      <section className="py-10 md:py-20 pb-20 md:pb-[120px]">
        <div className="px-5 md:px-10 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-20 max-w-[1200px] mx-auto">
          {/* Left: info */}
          <div>
            <div className="ot-eyebrow mb-[18px]">Get in touch</div>
            <h1 className="ot-display text-[48px] md:text-[80px] m-0 leading-[1.02]">
              Let&apos;s <span className="italic text-ot-ochre">talk.</span>
            </h1>
            <p className="text-[15px] text-ot-ink-soft leading-relaxed mt-6 max-w-[460px]">
              Have a question about a piece, want to discuss a commission, or just want to say
              hello? Drop us a message and we&apos;ll get back to you soon.
            </p>
            <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2.5">
              <dt className="ot-meta">EMAIL</dt>
              <dd className="m-0">hello@overtone.art</dd>
              <dt className="ot-meta">BASED IN</dt>
              <dd className="m-0">Charlotte, NC</dd>
            </dl>
          </div>

          {/* Right: form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <label className="flex flex-col gap-2">
              <span className="ot-eyebrow">Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
                maxLength={200}
                className={inputStyle}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="ot-eyebrow">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                required
                className={inputStyle}
              />
            </label>
            <label className="flex flex-col gap-2">
              <span className="ot-eyebrow">What brings you here?</span>
              <textarea
                value={form.message}
                onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                required
                rows={5}
                maxLength={5000}
                className={inputStyle}
              />
            </label>

            {/* Honeypot */}
            <div className="absolute -left-[9999px]" aria-hidden="true">
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
              />
            </div>

            {/* Math captcha */}
            <label className="flex flex-col gap-2">
              <span className="ot-eyebrow">What is {challenge.question}?</span>
              <input
                type="text"
                inputMode="numeric"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                required
                className={`${inputStyle} max-w-[120px]`}
              />
            </label>

            <button
              type="submit"
              disabled={sending || !captchaValid}
              className="ot-btn ot-btn--solid self-start"
            >
              {sending ? 'Sending...' : 'Send \u2192'}
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
