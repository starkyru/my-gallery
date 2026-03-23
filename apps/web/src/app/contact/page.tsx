'use client';

import { useState, useMemo } from 'react';
import { api } from '@/lib/api';
import { useNotification } from '@/hooks/useNotification';

function generateChallenge() {
  const a = Math.floor(Math.random() * 10) + 1;
  const b = Math.floor(Math.random() * 10) + 1;
  return { question: `${a} + ${b}`, answer: a + b };
}

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
    if (honeypot) return; // bot trap
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
    } catch (e: unknown) {
      notify.error(e instanceof Error ? e.message : 'Failed to send message');
      setChallenge(generateChallenge());
      setCaptchaInput('');
    } finally {
      setSending(false);
    }
  }

  const inputClass =
    'w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder:text-gallery-gray focus:outline-none focus:border-gallery-accent transition-colors';

  if (sent) {
    return (
      <div className="mx-auto max-w-xl px-6 pt-28 pb-24 text-center">
        <h1 className="font-serif text-4xl mb-4">Thank you!</h1>
        <p className="text-gallery-gray">
          Your message has been sent. We&apos;ll get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 pt-28 pb-24">
      <h1 className="font-serif text-4xl mb-8">Contact</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-gallery-gray mb-1">Name</label>
          <input
            type="text"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            maxLength={200}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-gallery-gray mb-1">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm text-gallery-gray mb-1">Message</label>
          <textarea
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            required
            rows={5}
            maxLength={5000}
            className={inputClass}
          />
        </div>

        {/* Honeypot — hidden from real users */}
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
        <div>
          <label className="block text-sm text-gallery-gray mb-1">
            What is {challenge.question}?
          </label>
          <input
            type="text"
            inputMode="numeric"
            value={captchaInput}
            onChange={(e) => setCaptchaInput(e.target.value)}
            required
            className={`${inputClass} max-w-[120px]`}
          />
        </div>

        <button
          type="submit"
          disabled={sending || !captchaValid}
          className="w-full py-3 bg-gallery-accent text-gallery-black rounded-lg font-medium hover:bg-gallery-accent-light transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </form>
    </div>
  );
}
