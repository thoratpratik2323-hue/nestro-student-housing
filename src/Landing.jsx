import React, { useState, useEffect, useRef } from "react";

const TOKENS = {
  ink: "#241016", wineDark: "#1E0C15", wine: "#3F1B2C", wineMid: "#5A2438",
  plum: "#6B2C42", copper: "#C17A54", copperLight: "#E7BA96",
  cream: "#FBF6F1", paper: "#FFFDFB", fog: "#B79A9F",
};

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setVisible(true)),
      { threshold: 0.18 }
    );
    io.observe(el); return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useReveal();
  return (
    <div ref={ref} className={`n-reveal ${visible ? "n-reveal--in" : ""} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

const IconArrow = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}>
    <path d="M5 12h13M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconPercent = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}>
    <line x1="19" y1="5" x2="5" y2="19" strokeLinecap="round" />
    <circle cx="7" cy="7" r="2.4" /><circle cx="17" cy="17" r="2.4" />
  </svg>
);
const IconBrain = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
    <path d="M9 3.5c-2 0-3.4 1.4-3.4 3.1 0 .6.15 1.1.4 1.6-1 .5-1.7 1.5-1.7 2.7 0 1 .5 1.9 1.3 2.4-.2.5-.3 1-.3 1.6 0 2 1.6 3.6 3.6 3.6h.1V3.5H9Z" />
    <path d="M15 3.5c2 0 3.4 1.4 3.4 3.1 0 .6-.15 1.1-.4 1.6 1 .5 1.7 1.5 1.7 2.7 0 1-.5 1.9-1.3 2.4.2.5.3 1 .3 1.6 0 2-1.6 3.6-3.6 3.6h-.1V3.5H15Z" />
  </svg>
);
const IconShield = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
    <path d="M12 3l7 3v5c0 4.6-3 8.4-7 10-4-1.6-7-5.4-7-10V6l7-3Z" strokeLinejoin="round" />
    <path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const IconBolt = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M13 2 4 14h6l-1 8 9-12h-6l1-8Z" />
  </svg>
);
const IconCloud = (p) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...p}>
    <path d="M7 18a4.5 4.5 0 0 1-.4-9 5.5 5.5 0 0 1 10.7-1.6A4.2 4.2 0 0 1 17 18H7Z" />
  </svg>
);
const IconPhone = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
    <path d="M6 3h3l1.5 4-2 2a12 12 0 0 0 6.5 6.5l2-2 4 1.5v3a2 2 0 0 1-2.2 2A17 17 0 0 1 4 6.2 2 2 0 0 1 6 3Z" strokeLinejoin="round" />
  </svg>
);
const IconMail = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="M3.5 6.5 12 13l8.5-6.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const PILLARS = [
  { Icon: IconPercent, title: "0% Brokerage", body: "Students connect directly with hosts — no middlemen, no hidden commissions, ever." },
  { Icon: IconBrain, title: "AI-Powered Matching", body: "Matched on budget, distance from campus, and lifestyle — not guesswork." },
  { Icon: IconShield, title: "Verified Listings", body: "Every host and property is checked and onboarded before it goes live." },
  { Icon: IconBolt, title: "Live & Ready Today", body: "Not a concept — fully deployed on Google Cloud & Cloud Firestore, right now." },
];

const STEPS = [
  { n: "01", title: "Set your nest criteria", body: "Budget, distance from campus, lifestyle — takes under two minutes." },
  { n: "02", title: "AI finds your matches", body: "NESTRO surfaces verified rooms near Sanjivani that actually fit." },
  { n: "03", title: "Connect, broker-free", body: "Message the host directly and finalize — zero commission, always." },
  { n: "04", title: "Move in & review", body: "Settle in, then rate the stay to strengthen trust for the next student." },
];

const EXPANSION = [
  { tag: "BEACHHEAD", title: "Sanjivani University & Kopargaon", body: "Our live pilot — every off-campus student needs verified, affordable housing near campus." },
  { tag: "EXPANSION", title: "50+ Maharashtra campuses", body: "A repeatable playbook: onboard local hosts, activate students, expand college by college." },
  { tag: "VISION", title: "India's trusted housing layer", body: "The default way every student finds a verified, brokerage-free home near their institution." },
];

const TEAM = [
  { initials: "SR", name: "Samruddhi Rajesh Gangad", role: "Team Leader — UX / Product Design", lead: true },
  { initials: "PT", name: "Pratik Thorat", role: "Full-Stack Developer — AI / Technical Lead" },
  { initials: "KH", name: "Kirti Honde", role: "Market Analysis & Student Relations" },
  { initials: "PP", name: "Parth Pachpute", role: "Operations & Host Onboarding" },
];

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap');
.n-root{--ink:#241016;--wine-dark:#1E0C15;--wine:#3F1B2C;--wine-mid:#5A2438;--plum:#6B2C42;--copper:#C17A54;--copper-light:#E7BA96;--cream:#FBF6F1;--paper:#FFFDFB;--fog:#B79A9F;font-family:'Inter',sans-serif;background:var(--paper);color:var(--ink);overflow-x:hidden}
.n-root *{box-sizing:border-box}
.n-wrap{max-width:1180px;margin:0 auto;padding:0 28px}
.n-nav{position:fixed;top:0;left:0;right:0;z-index:50;padding:18px 0;transition:background .35s,box-shadow .35s,padding .35s}
.n-nav--solid{background:rgba(251,246,241,0.9);backdrop-filter:blur(12px);box-shadow:0 1px 0 rgba(36,16,22,0.08);padding:12px 0}
.n-nav__inner{display:flex;align-items:center;justify-content:space-between}
.n-logo{display:flex;align-items:center;gap:10px;font-family:'Fraunces',serif;font-weight:600;font-size:22px;color:var(--wine)}
.n-logo__mark{width:30px;height:30px;border-radius:50%;background:linear-gradient(145deg,var(--wine),var(--wine-mid));display:flex;align-items:center;justify-content:center;color:var(--copper-light);font-family:'Fraunces',serif;font-weight:700;font-size:15px}
.n-navlinks{display:flex;gap:30px;align-items:center}
.n-navlinks a{color:var(--ink);text-decoration:none;font-size:14.5px;font-weight:500;opacity:.75;transition:opacity .2s}
.n-navlinks a:hover{opacity:1}
.n-btn{display:inline-flex;align-items:center;gap:8px;padding:11px 20px;border-radius:100px;font-weight:600;font-size:14px;text-decoration:none;border:none;cursor:pointer;transition:transform .2s,box-shadow .2s;white-space:nowrap;font-family:'Inter',sans-serif}
.n-btn:hover{transform:translateY(-1px)}
.n-btn--copper{background:var(--copper);color:var(--wine-dark);box-shadow:0 8px 20px -8px rgba(193,122,84,0.7)}
.n-btn--ghost{background:transparent;color:var(--wine);border:1.4px solid rgba(63,27,44,0.25)}
.n-btn--ghostLight{background:transparent;color:var(--paper);border:1.4px solid rgba(255,255,255,0.35)}
.n-icon-sm{width:15px;height:15px}
.n-hero{position:relative;background:radial-gradient(120% 90% at 18% -10%,var(--wine-mid) 0%,var(--wine) 42%,var(--wine-dark) 100%);color:var(--paper);padding:150px 0 110px;overflow:hidden}
.n-hero::before,.n-hero::after{content:'';position:absolute;border-radius:50%}
.n-hero::before{width:560px;height:560px;right:-180px;top:-220px;background:radial-gradient(circle,rgba(193,122,84,0.28),transparent 70%)}
.n-hero::after{width:420px;height:420px;left:-160px;bottom:-220px;background:radial-gradient(circle,rgba(107,44,66,0.5),transparent 70%)}
.n-hero__grid{position:relative;display:grid;grid-template-columns:1.05fr 0.95fr;gap:56px;align-items:center}
.n-eyebrow{display:inline-flex;align-items:center;gap:8px;font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:1.6px;text-transform:uppercase;color:var(--copper-light);background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.14);padding:7px 14px;border-radius:100px;margin-bottom:26px}
.n-eyebrow__dot{width:6px;height:6px;border-radius:50%;background:var(--copper);box-shadow:0 0 0 4px rgba(193,122,84,0.25)}
.n-hero h1{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(38px,4.4vw,58px);line-height:1.06;margin:0 0 22px;letter-spacing:-.5px}
.n-hero h1 em{font-style:italic;color:var(--copper-light)}
.n-hero p.n-lead{font-size:17.5px;line-height:1.6;color:rgba(251,246,241,0.82);max-width:480px;margin:0 0 36px}
.n-hero__ctas{display:flex;gap:14px;margin-bottom:44px;flex-wrap:wrap}
.n-trustrow{display:flex;gap:28px;flex-wrap:wrap}
.n-trust{display:flex;align-items:center;gap:9px;font-size:13px;color:rgba(251,246,241,0.75)}
.n-trust svg{width:17px;height:17px;color:var(--copper-light)}
.n-widget{background:rgba(255,253,251,0.06);border:1px solid rgba(255,255,255,0.14);backdrop-filter:blur(14px);border-radius:22px;padding:30px 28px 26px}
.n-widget__head{display:flex;align-items:center;gap:10px;font-family:'IBM Plex Mono',monospace;font-size:12.5px;letter-spacing:.6px;text-transform:uppercase;color:var(--copper-light);margin-bottom:22px}
.n-widget__dot{width:8px;height:8px;border-radius:50%;background:#6FCF97;box-shadow:0 0 0 4px rgba(111,207,151,0.22)}
.n-widget__row{margin-bottom:20px}
.n-widget__label{display:flex;justify-content:space-between;font-size:13.5px;color:rgba(251,246,241,0.85);margin-bottom:10px}
.n-widget__label strong{color:var(--paper);font-family:'IBM Plex Mono',monospace;font-weight:500}
.n-slider{-webkit-appearance:none;width:100%;height:4px;border-radius:4px;background:rgba(255,255,255,0.2);outline:none}
.n-slider::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:var(--copper);border:3px solid var(--paper);cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.35)}
.n-slider::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--copper);border:3px solid var(--paper);cursor:pointer}
.n-widget__result{display:flex;align-items:baseline;gap:12px;padding:18px 0 6px;margin-top:6px;border-top:1px dashed rgba(255,255,255,0.18)}
.n-widget__count{font-family:'Fraunces',serif;font-size:44px;font-weight:600;color:var(--copper-light);line-height:1}
.n-widget__resultLabel{font-size:12.5px;color:rgba(251,246,241,0.65);max-width:190px;line-height:1.4}
.n-widget__cta{width:100%;justify-content:center;margin-top:18px}
section{padding:108px 0;position:relative}
.n-kicker{font-family:'IBM Plex Mono',monospace;font-size:11.5px;letter-spacing:1.8px;text-transform:uppercase;color:var(--copper);font-weight:500;margin-bottom:14px;display:block}
.n-h2{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(28px,3.4vw,42px);line-height:1.12;letter-spacing:-.4px;margin:0 0 18px;color:var(--ink)}
.n-sub{font-size:16px;line-height:1.65;color:#5E5157;max-width:560px}
.n-reveal{opacity:0;transform:translateY(22px);transition:opacity .7s cubic-bezier(.2,.7,.2,1),transform .7s cubic-bezier(.2,.7,.2,1)}
.n-reveal--in{opacity:1;transform:translateY(0)}
.n-compare{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:52px}
.n-card{border-radius:20px;padding:32px}
.n-card--old{background:#F3EBE7;border:1px solid #E7D9D4}
.n-card--new{background:linear-gradient(155deg,var(--wine),var(--wine-dark));color:var(--paper)}
.n-card__tag{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.4px;text-transform:uppercase;opacity:.6;margin-bottom:14px;display:block}
.n-card--new .n-card__tag{color:var(--copper-light);opacity:1}
.n-card h3{font-family:'Fraunces',serif;font-size:24px;margin:0 0 20px}
.n-list{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:14px}
.n-list li{display:flex;gap:12px;font-size:14.5px;line-height:1.5}
.n-list li::before{content:"\\00D7";flex:none;font-weight:700;color:#B0554A;font-size:16px;line-height:1.4}
.n-card--new .n-list li::before{content:"\\2713";color:var(--copper-light)}
.n-card--old .n-list li{color:#5E5157}
.n-card--new .n-list li{color:rgba(251,246,241,0.88)}
.n-steps{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:52px}
.n-step{position:relative;padding:30px 22px;border-radius:18px;background:var(--cream);border:1px solid #EFE2DB}
.n-step__num{font-family:'Fraunces',serif;font-size:34px;font-weight:600;color:#E3CFC5;margin-bottom:30px;display:block}
.n-step h4{font-family:'Fraunces',serif;font-size:18px;margin:0 0 10px;color:var(--ink)}
.n-step p{font-size:13.5px;line-height:1.55;color:#6B5E64;margin:0}
.n-step__connector{position:absolute;top:44px;right:-22px;width:22px;height:1px;background:repeating-linear-gradient(90deg,#D9C2C9 0 6px,transparent 6px 10px)}
.n-pillars{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:52px}
.n-pillar{padding:30px 24px;border-radius:18px;background:var(--paper);border:1px solid #EFE2DB;box-shadow:0 18px 40px -30px rgba(63,27,44,0.4)}
.n-pillar__icon{width:48px;height:48px;border-radius:14px;margin-bottom:20px;display:flex;align-items:center;justify-content:center;background:var(--wine);color:var(--copper-light)}
.n-pillar__icon svg{width:23px;height:23px}
.n-pillar h4{font-family:'Fraunces',serif;font-size:18px;margin:0 0 8px;color:var(--ink)}
.n-pillar p{font-size:13.5px;line-height:1.55;color:#6B5E64;margin:0}
.n-expansion-wrap{background:var(--wine-dark);color:var(--paper)}
.n-expansion-wrap .n-sub{color:rgba(251,246,241,0.72)}
.n-expansion{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:52px}
.n-exp-card{padding:32px 26px;border-radius:20px;border:1px solid rgba(255,255,255,0.14);background:rgba(255,255,255,0.04)}
.n-exp-card__tag{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:1.6px;color:var(--copper-light);display:block;margin-bottom:16px}
.n-exp-card h4{font-family:'Fraunces',serif;font-size:21px;margin:0 0 12px;line-height:1.2}
.n-exp-card p{font-size:13.5px;line-height:1.6;color:rgba(251,246,241,0.72);margin:0}
.n-exp-card--accent{background:var(--copper);border-color:var(--copper);color:var(--wine-dark)}
.n-exp-card--accent .n-exp-card__tag,.n-exp-card--accent p{color:rgba(30,12,21,0.72)}
.n-team{display:grid;grid-template-columns:repeat(4,1fr);gap:22px;margin-top:52px}
.n-member{text-align:center;padding:30px 18px;border-radius:18px;background:var(--cream);border:1px solid #EFE2DB}
.n-avatar{width:64px;height:64px;border-radius:50%;margin:0 auto 16px;background:linear-gradient(155deg,var(--copper),var(--copper-light));display:flex;align-items:center;justify-content:center;font-family:'Fraunces',serif;font-weight:600;font-size:21px;color:var(--wine-dark)}
.n-member__tag{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1px;background:var(--wine);color:var(--copper-light);padding:3px 10px;border-radius:100px;margin-bottom:10px}
.n-member h5{font-family:'Fraunces',serif;font-size:16px;margin:0 0 6px;color:var(--ink)}
.n-member p{font-size:12.5px;color:#6B5E64;margin:0;line-height:1.4}
.n-cta{background:radial-gradient(120% 140% at 50% 0%,var(--wine-mid),var(--wine-dark) 65%);color:var(--paper);text-align:center;padding:100px 0 80px}
.n-cta h2{font-family:'Fraunces',serif;font-size:clamp(30px,4vw,46px);margin:0 0 18px}
.n-cta p{color:rgba(251,246,241,0.75);font-size:16px;max-width:480px;margin:0 auto 36px}
.n-cta__ctas{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
.n-footer{background:var(--wine-dark);color:rgba(251,246,241,0.6);padding:40px 0}
.n-footer__inner{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:16px;font-size:13px}
.n-footer__contact{display:flex;gap:22px;flex-wrap:wrap}
.n-footer__contact a{color:rgba(251,246,241,0.75);text-decoration:none;display:inline-flex;align-items:center;gap:7px}
.n-footer__contact svg{width:15px;height:15px;color:var(--copper-light)}
@media(max-width:880px){.n-navlinks{display:none}.n-hero__grid{grid-template-columns:1fr}.n-compare,.n-steps,.n-pillars,.n-expansion,.n-team{grid-template-columns:1fr 1fr}.n-step__connector{display:none}}
@media(max-width:560px){.n-compare,.n-steps,.n-pillars,.n-expansion,.n-team{grid-template-columns:1fr}.n-hero{padding:120px 0 80px}}
@media(prefers-reduced-motion:reduce){.n-reveal{transition:none;opacity:1;transform:none}}
`;

function MatchWidget({ onLaunchApp }) {
  const [budget, setBudget] = useState(7000);
  const [radius, setRadius] = useState(2);
  const base = 6, bf = Math.max(0.3, Math.min(1.6, budget / 7000)), rf = Math.max(0.4, Math.min(1.8, radius / 2));
  const matches = Math.max(1, Math.round(base * bf * rf + (radius > 3 ? 4 : 0)));
  return (
    <div className="n-widget">
      <div className="n-widget__head"><span className="n-widget__dot" />Find your nest near Sanjivani</div>
      <div className="n-widget__row">
        <div className="n-widget__label"><span>Monthly budget</span><strong>&#8377;{budget.toLocaleString("en-IN")}</strong></div>
        <input type="range" min="3000" max="15000" step="500" value={budget} onChange={e => setBudget(+e.target.value)} className="n-slider" aria-label="Monthly budget" />
      </div>
      <div className="n-widget__row">
        <div className="n-widget__label"><span>Distance from campus</span><strong>{radius} km</strong></div>
        <input type="range" min="0.5" max="5" step="0.5" value={radius} onChange={e => setRadius(+e.target.value)} className="n-slider" aria-label="Distance from campus" />
      </div>
      <div className="n-widget__result">
        <span className="n-widget__count">{matches}</span>
        <span className="n-widget__resultLabel">verified homes match — illustrative estimate</span>
      </div>
      <button onClick={onLaunchApp} className="n-btn n-btn--copper n-widget__cta">
        Open Full Booking App <IconArrow className="n-icon-sm" />
      </button>
    </div>
  );
}

export default function NestroLanding({ onLaunchApp }) {
  const [navSolid, setNavSolid] = useState(false);
  useEffect(() => {
    const h = () => setNavSolid(window.scrollY > 40);
    window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h);
  }, []);
  const launch = onLaunchApp || (() => {});

  return (
    <div className="n-root">
      <style>{CSS}</style>
      <nav className={`n-nav ${navSolid ? "n-nav--solid" : ""}`}>
        <div className="n-wrap n-nav__inner">
          <div className="n-logo"><span className="n-logo__mark">N</span>NESTRO</div>
          <div className="n-navlinks">
            <a href="#how">How it works</a><a href="#why">Why Nestro</a>
            <a href="#expansion">Expansion</a><a href="#team">Team</a>
          </div>
          <button onClick={launch} className="n-btn n-btn--copper">
            Open Booking App <IconArrow className="n-icon-sm" />
          </button>
        </div>
      </nav>

      <header className="n-hero">
        <div className="n-wrap n-hero__grid">
          <div>
            <span className="n-eyebrow"><span className="n-eyebrow__dot" />Live now &middot; Sanjivani University, Kopargaon</span>
            <h1>Find your nest.<br />Skip the <em>broker.</em></h1>
            <p className="n-lead">NESTRO is India&apos;s first AI-powered, 0% brokerage student housing platform &mdash; matching students directly with verified hosts near campus.</p>
            <div className="n-hero__ctas">
              <button onClick={launch} className="n-btn n-btn--copper">Open Full Booking App <IconArrow className="n-icon-sm" /></button>
              <a href="#how" className="n-btn n-btn--ghostLight">How it works</a>
            </div>
            <div className="n-trustrow">
              <div className="n-trust"><IconPercent /> 0% brokerage, always</div>
              <div className="n-trust"><IconBolt /> 100% live product</div>
              <div className="n-trust"><IconCloud /> Google Cloud &amp; Firestore</div>
            </div>
          </div>
          <MatchWidget onLaunchApp={launch} />
        </div>
      </header>

      <section className="n-wrap">
        <Reveal>
          <span className="n-kicker">The problem</span>
          <h2 className="n-h2">Renting near campus shouldn&apos;t<br />feel like guesswork</h2>
          <p className="n-sub">Brokers, WhatsApp groups, and unverified listings make finding safe student housing slow, expensive, and stressful.</p>
        </Reveal>
        <div className="n-compare">
          <Reveal delay={80}><div className="n-card n-card--old"><span className="n-card__tag">The old way</span><h3>Broker-run housing</h3><ul className="n-list"><li>10&ndash;30% of monthly rent lost to broker commissions</li><li>Listings scattered across WhatsApp groups and posters</li><li>No verification &mdash; students and parents move in blind</li><li>Zero matching on budget, distance, or lifestyle</li></ul></div></Reveal>
          <Reveal delay={180}><div className="n-card n-card--new"><span className="n-card__tag">The Nestro way</span><h3>AI-matched, broker-free</h3><ul className="n-list"><li>0% brokerage &mdash; students connect directly with hosts</li><li>Every listing verified and onboarded before going live</li><li>AI matches on budget, campus distance &amp; lifestyle fit</li><li>Live today, built on Google Cloud &amp; Cloud Firestore</li></ul></div></Reveal>
        </div>
      </section>

      <section className="n-wrap" id="how">
        <Reveal><span className="n-kicker">The product</span><h2 className="n-h2">How NESTRO works</h2><p className="n-sub">Four steps from &ldquo;I need a room&rdquo; to moved in &mdash; no broker calls required.</p></Reveal>
        <div className="n-steps">{STEPS.map((s, i) => (<Reveal key={s.n} delay={i * 90}><div className="n-step"><span className="n-step__num">{s.n}</span><h4>{s.title}</h4><p>{s.body}</p>{i < STEPS.length - 1 && <span className="n-step__connector" />}</div></Reveal>))}</div>
      </section>

      <section className="n-wrap" id="why">
        <Reveal><span className="n-kicker">Why Nestro</span><h2 className="n-h2">Built for trust, priced for students</h2><p className="n-sub">Every pillar of NESTRO exists to remove a cost or a risk from student housing.</p></Reveal>
        <div className="n-pillars">{PILLARS.map((p, i) => (<Reveal key={p.title} delay={i * 90}><div className="n-pillar"><div className="n-pillar__icon"><p.Icon /></div><h4>{p.title}</h4><p>{p.body}</p></div></Reveal>))}</div>
      </section>

      <section className="n-expansion-wrap" id="expansion">
        <div className="n-wrap">
          <Reveal><span className="n-kicker" style={{color:"#E7BA96"}}>Market opportunity</span><h2 className="n-h2" style={{color:"#FBF6F1"}}>From one campus to a<br />statewide network</h2><p className="n-sub">A repeatable, campus-by-campus playbook &mdash; starting where our pilot already lives.</p></Reveal>
          <div className="n-expansion">{EXPANSION.map((e, i) => (<Reveal key={e.tag} delay={i * 100}><div className={`n-exp-card ${i === 2 ? "n-exp-card--accent" : ""}`}><span className="n-exp-card__tag">{e.tag}</span><h4>{e.title}</h4><p>{e.body}</p></div></Reveal>))}</div>
        </div>
      </section>

      <section className="n-wrap" id="team">
        <Reveal><span className="n-kicker">Team Velora</span><h2 className="n-h2">The people behind NESTRO</h2><p className="n-sub">Velocity + Aura &mdash; Integrated M.Tech AI-ML, Year I, Sanjivani University, Kopargaon.</p></Reveal>
        <div className="n-team">{TEAM.map((m, i) => (<Reveal key={m.initials} delay={i * 80}><div className="n-member"><div className="n-avatar">{m.initials}</div>{m.lead && <span className="n-member__tag">LEAD</span>}<h5>{m.name}</h5><p>{m.role}</p></div></Reveal>))}</div>
      </section>

      <section className="n-cta">
        <div className="n-wrap">
          <Reveal>
            <h2>Ready to skip the broker?</h2>
            <p>NESTRO is live at Sanjivani University, Kopargaon &mdash; matching students with verified homes right now.</p>
            <div className="n-cta__ctas">
              <button onClick={launch} className="n-btn n-btn--copper">Open Full Booking App <IconArrow className="n-icon-sm" /></button>
              <a href="mailto:nestrosupport@gmail.com" className="n-btn n-btn--ghostLight">Email us</a>
            </div>
          </Reveal>
        </div>
      </section>

      <footer className="n-footer">
        <div className="n-wrap n-footer__inner">
          <div>&copy; 2026 NESTRO &middot; Built by Team Velora for EUREKA 2026, Sanjivani University</div>
          <div className="n-footer__contact">
            <a href="tel:+919834620537"><IconPhone /> +91 98346 20537</a>
            <a href="mailto:nestrosupport@gmail.com"><IconMail /> nestrosupport@gmail.com</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
