"use client";

import { useEffect, useState } from "react";

const CACHE_VERSION = "v3";

const STOIC_QUOTES = [
  { quote: "You have power over your mind, not outside events. Realize this, and you will find strength.", byline: "- Marcus Aurelius" },
  { quote: "The impediment to action advances action. What stands in the way becomes the way.", byline: "- Marcus Aurelius" },
  { quote: "Waste no more time arguing about what a good man should be. Be one.", byline: "- Marcus Aurelius" },
  { quote: "It is not death that a man should fear, but he should fear never beginning to live.", byline: "- Marcus Aurelius" },
  { quote: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", byline: "- Marcus Aurelius" },
  { quote: "The best revenge is to be unlike him who performed the injustice.", byline: "- Marcus Aurelius" },
  { quote: "If it is not right, do not do it; if it is not true, do not say it.", byline: "- Marcus Aurelius" },
  { quote: "Accept the things to which fate binds you, and love the people with whom fate brings you together.", byline: "- Marcus Aurelius" },
  { quote: "The first rule is to keep an untroubled spirit. The second is to look things in the face and know them for what they are.", byline: "- Marcus Aurelius" },
  { quote: "Never esteem anything as of advantage to you that will make you break your word or lose your self-respect.", byline: "- Marcus Aurelius" },
  { quote: "He who fears death will never do anything worth of a man who is alive.", byline: "- Seneca" },
  { quote: "We suffer more in imagination than in reality.", byline: "- Seneca" },
  { quote: "Begin at once to live, and count each separate day as a separate life.", byline: "- Seneca" },
  { quote: "It is not that I'm so smart, it's just that I stay with problems longer.", byline: "- Seneca" },
  { quote: "Luck is what happens when preparation meets opportunity.", byline: "- Seneca" },
  { quote: "Retire into yourself as much as you can. Associate with those who are likely to improve you.", byline: "- Seneca" },
  { quote: "No person has the power to have everything they want, but it is in their power not to want what they don't have.", byline: "- Seneca" },
  { quote: "It is the power of the mind to be unconquerable.", byline: "- Seneca" },
  { quote: "You act like mortals in all that you fear, and like immortals in all that you desire.", byline: "- Seneca" },
  { quote: "Omnia aliena sunt, tempus tantum nostrum est. All things are alien; time alone is ours.", byline: "- Seneca" },
  { quote: "Make the best use of what is in your power, and take the rest as it happens.", byline: "- Epictetus" },
  { quote: "He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.", byline: "- Epictetus" },
  { quote: "First say to yourself what you would be; then do what you have to do.", byline: "- Epictetus" },
  { quote: "Seek not that the things which happen should happen as you wish; but wish the things which happen to be as they are, and you will have a tranquil flow of life.", byline: "- Epictetus" },
  { quote: "Don't explain your philosophy. Embody it.", byline: "- Epictetus" },
  { quote: "Of all existing things some are in our power, and others are not in our power.", byline: "- Epictetus" },
  { quote: "It's not what happens to you, but how you react to it that matters.", byline: "- Epictetus" },
  { quote: "No man is free who is not master of himself.", byline: "- Epictetus" },
  { quote: "If anyone tells you that a certain person speaks ill of you, do not make excuses about what is said of you, but answer: he did not know my other faults, else he would not have mentioned only these.", byline: "- Epictetus" },
  { quote: "Freedom is the only worthy goal in life. It is won by disregarding things that lie beyond our control.", byline: "- Epictetus" },
  { quote: "Man conquers the world by conquering himself.", byline: "- Zeno of Citium" },
  { quote: "Well-being is attained by little and little, and nevertheless is no little thing itself.", byline: "- Zeno of Citium" },
  { quote: "The goal of life is living in agreement with nature.", byline: "- Zeno of Citium" },
  { quote: "Better to trip with the feet than with the tongue.", byline: "- Zeno of Citium" },
  { quote: "Fate leads the willing and drags along the reluctant.", byline: "- Cleanthes" },
  { quote: "A gem cannot be polished without friction, nor a man perfected without trials.", byline: "- Stoic Proverb" },
  { quote: "True happiness is to enjoy the present, without anxious dependence upon the future.", byline: "- Seneca" },
  { quote: "If you want to improve, be content to be thought foolish and stupid.", byline: "- Epictetus" },
  { quote: "The things that truly matter are within us; the rest is noise.", byline: "- Marcus Aurelius" },
  { quote: "Confine yourself to the present.", byline: "- Marcus Aurelius" },
  { quote: "You could leave life right now. Let that determine what you do, say, and think.", byline: "- Marcus Aurelius" },
  { quote: "The soul becomes dyed with the colour of its thoughts.", byline: "- Marcus Aurelius" },
  { quote: "How much more grievous are the consequences of anger than the causes of it.", byline: "- Marcus Aurelius" },
  { quote: "Perfection of character is this: to live each day as if it were your last, without frenzy, without apathy, without pretense.", byline: "- Marcus Aurelius" },
  { quote: "Associate with people who are likely to improve you.", byline: "- Seneca" },
  { quote: "There is no easy way from the earth to the stars.", byline: "- Seneca" },
  { quote: "Difficulties strengthen the mind, as labor does the body.", byline: "- Seneca" },
  { quote: "I judge you unfortunate because you have never lived through misfortune. You have passed through life without an opponent.", byline: "- Seneca" },
  { quote: "Do not indulge in dreams of what you do not have, but count up the chief of the blessings you do have.", byline: "- Marcus Aurelius" },
  { quote: "To bear trials with a calm mind robs misfortune of its strength and burden.", byline: "- Seneca" },
];

function todayKey() {
  return `affirmation-${CACHE_VERSION}-${new Date().toLocaleDateString("en-CA")}`;
}

function getDailyFallback(): { quote: string; byline: string } {
  // Deterministic rotation by day - different every day, no API needed
  const daysSinceEpoch = Math.floor(Date.now() / 86_400_000);
  return STOIC_QUOTES[daysSinceEpoch % STOIC_QUOTES.length];
}

interface AffirmationData {
  quote: string;
  byline: string;
}

export function DailyAffirmation({ color = "#F7C948" }: { color?: string }) {
  const [data, setData] = useState<AffirmationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const key = todayKey();
    try {
      const cached = localStorage.getItem(key);
      if (cached) {
        setData(JSON.parse(cached));
        setLoading(false);
        return;
      }
    } catch {}

    // Try AI for a fresh stoic quote; fall back to curated list on any failure
    fetch("/api/ai/affirmation", { method: "POST" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d: AffirmationData) => {
        setData(d);
        try { localStorage.setItem(key, JSON.stringify(d)); } catch {}
      })
      .catch(() => {
        const fallback = getDailyFallback();
        setData(fallback);
        try { localStorage.setItem(key, JSON.stringify(fallback)); } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  const handleCopy = async () => {
    if (!data) return;
    const text = data.byline ? `"${data.quote}" ${data.byline}` : data.quote;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  if (loading) {
    return <p className="text-xs animate-pulse-soft text-paper-ink-light" style={{ fontFamily: "var(--font-body)" }}>…</p>;
  }

  return (
    <div
      onClick={handleCopy}
      className="relative cursor-pointer select-none group"
      style={{ borderLeft: `3px solid ${color}`, paddingLeft: "12px" }}
      title="Click to copy"
    >
      <span
        className="absolute top-0 right-0 text-[9px] uppercase tracking-widest transition-opacity duration-300"
        style={{ fontFamily: "var(--font-body)", color, opacity: copied ? 1 : 0 }}
      >
        Copied
      </span>
      <p className="text-sm leading-relaxed text-paper-ink mb-2" style={{ fontFamily: "var(--font-body)" }}>
        {data?.quote}
      </p>
      {data?.byline && (
        <p className="text-[11px] text-paper-ink-light tracking-wide" style={{ fontFamily: "var(--font-body)" }}>
          {data.byline}
        </p>
      )}
    </div>
  );
}
