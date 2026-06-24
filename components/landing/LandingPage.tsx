/**
 * LandingPage — React port of the "GymCentre Landing" Claude Design.
 *
 * Editorial / warm aesthetic: cream canvas, near-black ink, a single green
 * accent, Zilla Slab serif headings + IBM Plex Sans/Mono, a dotted-grid
 * texture, and a hero with a floating desktop dashboard mockup.
 *
 * Static markup → server component. Hover/animation/responsive live in the
 * co-located CSS module; per-element styling is inlined to mirror the design.
 */

import Link from 'next/link';
import styles from './landing.module.css';

const ACCENT = '#2D6A4F';
const INK = '#1A1A1A';
const CREAM = '#F5F2ED';

const STATS = [
  { label: 'Total Members', value: '4', color: INK, sub: null },
  { label: 'Active', value: '3', color: '#2D6A4F', sub: '7+ days remaining' },
  { label: 'Expiring Soon', value: '1', color: '#C77A14', sub: 'within 7 days' },
  { label: 'Expired', value: '0', color: '#C0392B', sub: 'need renewal' },
] as const;

const PAYMENTS = [
  { date: '15 Jan 2025', member: 'niraj vaidya', plan: 'Monthly', amount: '₹1,000', mode: 'UPI' },
  { date: '10 Jan 2025', member: 'arjun mehta', plan: 'Quarterly', amount: '₹3,000', mode: 'Card' },
  { date: '5 Jan 2025', member: 'priya nair', plan: 'Yearly', amount: '₹6,500', mode: 'UPI' },
] as const;

const FEATURES = [
  {
    title: 'Member management',
    body: 'Add, search, and track every member in seconds — profiles, contact details, and status at a glance.',
    icon: (
      <>
        <circle cx="6" cy="6" r="2.6" />
        <path d="M2 14c0-2.4 1.9-4 4-4s4 1.6 4 4" />
        <circle cx="12.5" cy="6.6" r="2" />
        <path d="M11 10.4c2 0 3.5 1.4 3.5 3.6" />
      </>
    ),
  },
  {
    title: 'Flexible plans',
    body: 'Monthly, quarterly, yearly — define your plans once and assign them with a single tap.',
    icon: (
      <>
        <rect x="3" y="3" width="11" height="11" rx="2" />
        <path d="M6 6.5h5M6 9h5M6 11.5h3" />
      </>
    ),
  },
  {
    title: 'Payments & dues',
    body: 'Log payments, see who has paid and who is due, and keep revenue clear without a spreadsheet in sight.',
    icon: (
      <>
        <rect x="2.5" y="4" width="12" height="9" rx="2" />
        <path d="M2.5 7.5h12" />
        <path d="M5 10.5h3" />
      </>
    ),
  },
  {
    title: 'Workout access',
    body: 'Control who can train and when. Access stays in sync with each member’s plan and expiry.',
    icon: (
      <>
        <path d="M8.5 2l4.5 1.7v3.6c0 3.2-2.2 5-4.5 6-2.3-1-4.5-2.8-4.5-6V3.7z" />
        <path d="M6.6 8l1.3 1.3 2.4-2.6" />
      </>
    ),
  },
  {
    title: 'Live dashboard',
    body: 'Active members, expiries, and revenue — the pulse of your gym, updated in real time.',
    icon: (
      <>
        <path d="M2.5 13h12" />
        <path d="M5 13V8M8.5 13V4.5M12 13V9.5" />
      </>
    ),
  },
  {
    title: 'Smart register',
    body: 'Snap a photo of your paper register and let GymCentre read it. No more manual data entry.',
    icon: (
      <>
        <path d="M3 5.5V4a1 1 0 0 1 1-1h1.5M13 5.5V4a1 1 0 0 0-1-1h-1.5M3 10.5V12a1 1 0 0 0 1 1h1.5M13 10.5V12a1 1 0 0 1-1 1h-1.5" />
        <path d="M2.5 8h11" />
      </>
    ),
  },
] as const;

type Tier = {
  name: string;
  price: string;
  unit: string;
  blurb: string;
  perks: readonly string[];
  featured: boolean;
};

const TIERS: readonly Tier[] = [
  {
    name: 'Starter',
    price: '₹0',
    unit: '/ forever',
    blurb: 'For new gyms finding their feet.',
    perks: ['Up to 50 members', 'Plans & payments', 'Core dashboard'],
    featured: false,
  },
  {
    name: 'Pro',
    price: '₹1,499',
    unit: '/ month',
    blurb: 'Everything a busy gym runs on.',
    perks: ['Unlimited members', 'Workout access control', 'Smart register (OCR)', 'Priority support'],
    featured: true,
  },
  {
    name: 'Studio',
    price: 'Custom',
    unit: '',
    blurb: 'For chains & multi-branch setups.',
    perks: ['Multiple locations', 'Team roles & access', 'Onboarding & training'],
    featured: false,
  },
] as const;

const eyebrowStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '11.5px',
  fontWeight: 500,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: ACCENT,
};

const sectionH2Style: React.CSSProperties = {
  fontFamily: "'Zilla Slab', serif",
  fontWeight: 700,
  fontSize: '42px',
  lineHeight: 1.08,
  letterSpacing: '-0.02em',
  margin: '16px 0 0',
  color: INK,
  textWrap: 'balance',
};

const navLinkStyle: React.CSSProperties = {
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: '12.5px',
  fontWeight: 500,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: INK,
  textDecoration: 'none',
};

const sideItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '9px 11px',
  borderRadius: '9px',
  fontSize: '12.5px',
  color: 'rgba(26,26,26,0.62)',
};

const tableGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1.1fr 1.3fr 1fr 0.9fr 0.8fr',
  gap: '8px',
};

export function LandingPage() {
  return (
    <div className={styles.page}>
      {/* Dotted-grid texture, masked toward the upper-right */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 0,
          backgroundImage:
            'radial-gradient(rgba(26,26,26,0.16) 1px, transparent 1.4px), linear-gradient(rgba(26,26,26,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(26,26,26,0.05) 1px, transparent 1px)',
          backgroundSize: '26px 26px, 26px 26px, 26px 26px',
          WebkitMaskImage:
            'radial-gradient(ellipse 120% 90% at 72% 34%, #000 30%, transparent 78%)',
          maskImage: 'radial-gradient(ellipse 120% 90% at 72% 34%, #000 30%, transparent 78%)',
        }}
      />

      <div className={styles.container}>
        {/* NAV */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: '84px',
            borderBottom: '1px solid rgba(26,26,26,0.14)',
          }}
        >
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                background: INK,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontWeight: 700,
                fontSize: '14px',
                letterSpacing: '0.02em',
                color: CREAM,
              }}
            >
              GC
            </div>
            <span
              style={{
                fontFamily: "'Zilla Slab', serif",
                fontWeight: 700,
                fontSize: '22px',
                letterSpacing: '-0.01em',
              }}
            >
              GymCentre
            </span>
          </Link>

          <div
            className={styles.navLinks}
            style={{ display: 'flex', alignItems: 'center', gap: '36px' }}
          >
            <a href="#features" className={styles.navLink} style={navLinkStyle}>
              Features
            </a>
            <a href="#pricing" className={styles.navLink} style={navLinkStyle}>
              Pricing
            </a>
            <a href="#demo" className={styles.navLink} style={navLinkStyle}>
              Demo
            </a>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
            <Link
              href="/login"
              className={`${styles.navLink} ${styles.navActionsLogin}`}
              style={navLinkStyle}
            >
              Log in
            </Link>
            <Link
              href="/login"
              className={styles.ctaBtn}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '12.5px',
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: CREAM,
                background: INK,
                textDecoration: 'none',
                padding: '11px 18px',
                borderRadius: '8px',
              }}
            >
              Get GymCentre
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section className={styles.hero}>
          {/* LEFT */}
          <div style={{ maxWidth: '520px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11.5px',
                fontWeight: 500,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: ACCENT,
              }}
            >
              <span
                style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT }}
              />
              Gym management, simplified
            </span>

            <h1 className={styles.h1}>
              Run your whole gym
              <br />
              from one screen.
            </h1>

            <p
              style={{
                fontFamily: "'IBM Plex Sans', sans-serif",
                fontSize: '18px',
                lineHeight: 1.55,
                color: 'rgba(26,26,26,0.66)',
                margin: '22px 0 0',
                maxWidth: '440px',
              }}
            >
              Members, plans, payments, and workout access — all managed from one clean admin
              dashboard. No spreadsheets.
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginTop: '32px' }}>
              <Link
                href="/login"
                className={styles.primaryBtn}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  background: INK,
                  color: CREAM,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  padding: '15px 24px',
                  borderRadius: '10px',
                }}
              >
                Get started free
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M3 8h9M8 4l4 4-4 4"
                    stroke={CREAM}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>

              <Link
                href="/login"
                className={styles.secondaryBtn}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  background: '#FFFFFF',
                  color: INK,
                  border: '1px solid rgba(26,26,26,0.2)',
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  padding: '14px 22px',
                  borderRadius: '10px',
                }}
              >
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: ACCENT,
                  }}
                >
                  <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                    <path d="M1.5 1L6.5 4L1.5 7V1Z" fill="#fff" />
                  </svg>
                </span>
                See a live demo
              </Link>
            </div>

            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: '11.5px',
                letterSpacing: '0.06em',
                color: 'rgba(26,26,26,0.5)',
                margin: '22px 0 0',
              }}
            >
              MEMBERS · PLANS · PAYMENTS · WORKOUT ACCESS
            </p>
          </div>

          {/* RIGHT: desktop dashboard mockup */}
          <div className={styles.heroRight}>
            <span
              style={{
                position: 'absolute',
                top: '6px',
                left: '18px',
                width: '9px',
                height: '9px',
                borderRadius: '50%',
                background: ACCENT,
                zIndex: 3,
              }}
            />
            <span
              style={{
                position: 'absolute',
                bottom: '18px',
                right: '30px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: INK,
                zIndex: 3,
              }}
            />

            <div className={styles.mockScale}>
              <div
                className={styles.float}
                style={{
                  width: '780px',
                  background: '#FFFFFF',
                  border: '1px solid rgba(26,26,26,0.13)',
                  borderRadius: '14px',
                  boxShadow:
                    '0 40px 90px -34px rgba(26,26,26,0.42), 0 0 0 1px rgba(26,26,26,0.03)',
                  overflow: 'hidden',
                }}
              >
                {/* browser bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '11px 16px',
                    background: '#F1EEE8',
                    borderBottom: '1px solid rgba(26,26,26,0.08)',
                  }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E0563A' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E4B14E' }} />
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#4F9D69' }} />
                  <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '7px',
                        background: '#FFFFFF',
                        border: '1px solid rgba(26,26,26,0.1)',
                        borderRadius: '7px',
                        padding: '5px 14px',
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '11px',
                        color: 'rgba(26,26,26,0.55)',
                      }}
                    >
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <rect x="2.5" y="5" width="7" height="5" rx="1" stroke="rgba(26,26,26,0.45)" strokeWidth="1" />
                        <path d="M4 5V3.6a2 2 0 0 1 4 0V5" stroke="rgba(26,26,26,0.45)" strokeWidth="1" />
                      </svg>
                      app.gymcentre.io/dashboard
                    </div>
                  </div>
                </div>

                {/* app body */}
                <div style={{ display: 'flex', height: '478px' }}>
                  {/* sidebar */}
                  <div
                    style={{
                      width: '176px',
                      flexShrink: 0,
                      background: '#FFFFFF',
                      borderRight: '1px solid rgba(26,26,26,0.09)',
                      padding: '16px 12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 6px 14px' }}>
                      <div
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          background: INK,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '10px',
                          color: '#fff',
                        }}
                      >
                        GC
                      </div>
                      <span style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '15px' }}>
                        GymCentre
                      </span>
                    </div>

                    {/* active */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '9px 11px',
                        borderRadius: '9px',
                        background: '#F1EEE8',
                        fontSize: '12.5px',
                        fontWeight: 600,
                        color: INK,
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke={INK} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8l5-4 5 4v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8z" />
                      </svg>
                      Dashboard
                    </div>

                    <div style={sideItemStyle}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="rgba(26,26,26,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6" cy="6" r="2.2" />
                        <path d="M2.5 13c0-2 1.6-3.4 3.5-3.4S9.5 11 9.5 13" />
                        <circle cx="11" cy="6.4" r="1.6" />
                      </svg>
                      Members
                    </div>
                    <div style={sideItemStyle}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="rgba(26,26,26,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="6" cy="5.5" r="2.2" />
                        <path d="M2.5 13c0-2 1.6-3.2 3.5-3.2 1 0 1.9.3 2.5.9" />
                        <path d="M11 9v4M9 11h4" />
                      </svg>
                      Add Member
                    </div>
                    <div style={sideItemStyle}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="rgba(26,26,26,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="4" y="3" width="8" height="11" rx="1.5" />
                        <path d="M6 6h4M6 8.5h4M6 11h2.5" />
                      </svg>
                      Plans
                    </div>
                    <div style={sideItemStyle}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="rgba(26,26,26,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6v4M5 4.5v7M11 4.5v7M13 6v4M5 8h6" />
                      </svg>
                      Workouts
                    </div>
                    <div style={sideItemStyle}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="rgba(26,26,26,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M8 2.4l4.2 1.6v3.4c0 3-2.1 4.7-4.2 5.6-2.1-.9-4.2-2.6-4.2-5.6V4z" />
                      </svg>
                      Workout Access
                    </div>
                    <div style={sideItemStyle}>
                      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="rgba(26,26,26,0.55)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="8" cy="8" r="2.1" />
                        <path d="M8 1.8v1.8M8 12.4v1.8M1.8 8h1.8M12.4 8h1.8M3.6 3.6l1.3 1.3M11.1 11.1l1.3 1.3M12.4 3.6l-1.3 1.3M4.9 11.1l-1.3 1.3" />
                      </svg>
                      Settings
                    </div>
                  </div>

                  {/* main */}
                  <div style={{ flex: 1, background: '#FCFBF8', padding: '22px 24px', overflow: 'hidden' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '20px' }}>
                      <div>
                        <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '19px' }}>
                          Dashboard
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'rgba(26,26,26,0.5)', marginTop: '2px' }}>
                          GymCentre management overview
                        </div>
                      </div>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: INK,
                          color: '#fff',
                          fontSize: '11.5px',
                          fontWeight: 600,
                          padding: '8px 13px',
                          borderRadius: '8px',
                        }}
                      >
                        + Add Member
                      </span>
                    </div>

                    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '13px', marginBottom: '11px' }}>
                      Member Statistics
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '22px' }}>
                      {STATS.map((s) => (
                        <div key={s.label} style={{ border: '1px solid rgba(26,26,26,0.11)', borderRadius: '11px', padding: '13px' }}>
                          <div style={{ fontSize: '10.5px', color: 'rgba(26,26,26,0.5)' }}>{s.label}</div>
                          <div
                            style={{
                              fontFamily: "'IBM Plex Sans', sans-serif",
                              fontWeight: 700,
                              fontSize: '26px',
                              lineHeight: 1.1,
                              marginTop: '6px',
                              color: s.color,
                            }}
                          >
                            {s.value}
                          </div>
                          {s.sub && (
                            <div style={{ fontSize: '9px', color: 'rgba(26,26,26,0.42)', marginTop: '4px' }}>{s.sub}</div>
                          )}
                        </div>
                      ))}
                    </div>

                    <div style={{ fontFamily: "'IBM Plex Sans', sans-serif", fontWeight: 700, fontSize: '13px', marginBottom: '11px' }}>
                      Recent Payments
                    </div>
                    <div style={{ border: '1px solid rgba(26,26,26,0.1)', borderRadius: '11px', overflow: 'hidden' }}>
                      <div
                        style={{
                          ...tableGrid,
                          padding: '10px 14px',
                          background: '#F6F4EF',
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '9.5px',
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          color: 'rgba(26,26,26,0.5)',
                        }}
                      >
                        <span>Date</span>
                        <span>Member</span>
                        <span>Plan</span>
                        <span>Amount</span>
                        <span>Mode</span>
                      </div>
                      {PAYMENTS.map((p) => (
                        <div
                          key={p.member}
                          style={{
                            ...tableGrid,
                            padding: '11px 14px',
                            borderTop: '1px solid rgba(26,26,26,0.07)',
                            fontSize: '11.5px',
                            alignItems: 'center',
                          }}
                        >
                          <span style={{ color: 'rgba(26,26,26,0.6)' }}>{p.date}</span>
                          <span style={{ fontWeight: 600 }}>{p.member}</span>
                          <span style={{ color: 'rgba(26,26,26,0.6)' }}>{p.plan}</span>
                          <span style={{ fontWeight: 600 }}>{p.amount}</span>
                          <span style={{ color: 'rgba(26,26,26,0.6)' }}>{p.mode}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className={styles.section}>
          <div style={{ maxWidth: '620px' }}>
            <span style={eyebrowStyle}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT }} />
              Features
            </span>
            <h2 style={sectionH2Style}>Everything you need to run the floor.</h2>
            <p
              style={{
                fontSize: '17px',
                lineHeight: 1.55,
                color: 'rgba(26,26,26,0.66)',
                margin: '16px 0 0',
              }}
            >
              One clean admin surface for the whole operation — no spreadsheets, no scattered tools.
            </p>
          </div>

          <div className={styles.featureGrid}>
            {FEATURES.map((f) => (
              <div key={f.title} className={styles.featureCard}>
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#F1EEE8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke={INK}
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {f.icon}
                  </svg>
                </div>
                <h3
                  style={{
                    fontFamily: "'Zilla Slab', serif",
                    fontWeight: 600,
                    fontSize: '20px',
                    letterSpacing: '-0.01em',
                    margin: '18px 0 0',
                  }}
                >
                  {f.title}
                </h3>
                <p
                  style={{
                    fontSize: '14px',
                    lineHeight: 1.55,
                    color: 'rgba(26,26,26,0.64)',
                    margin: '8px 0 0',
                  }}
                >
                  {f.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className={styles.section}>
          <div style={{ maxWidth: '620px' }}>
            <span style={eyebrowStyle}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT }} />
              Pricing
            </span>
            <h2 style={sectionH2Style}>Simple pricing that scales with you.</h2>
            <p
              style={{
                fontSize: '17px',
                lineHeight: 1.55,
                color: 'rgba(26,26,26,0.66)',
                margin: '16px 0 0',
              }}
            >
              Start free, upgrade when you grow. Fair, transparent, no surprises.
            </p>
          </div>

          <div className={styles.pricingGrid}>
            {TIERS.map((t) => {
              const fg = t.featured ? CREAM : INK;
              const muted = t.featured ? 'rgba(245,242,237,0.66)' : 'rgba(26,26,26,0.6)';
              return (
                <div
                  key={t.name}
                  className={styles.priceCard}
                  style={{
                    background: t.featured ? INK : '#FFFFFF',
                    border: t.featured ? '1px solid #1A1A1A' : '1px solid rgba(26,26,26,0.13)',
                    color: fg,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span
                      style={{
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: '12px',
                        fontWeight: 600,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: t.featured ? CREAM : INK,
                      }}
                    >
                      {t.name}
                    </span>
                    {t.featured && (
                      <span
                        style={{
                          fontFamily: "'IBM Plex Mono', monospace",
                          fontSize: '10px',
                          fontWeight: 600,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          color: CREAM,
                          background: ACCENT,
                          padding: '4px 9px',
                          borderRadius: '999px',
                        }}
                      >
                        Most popular
                      </span>
                    )}
                  </div>

                  <div style={{ margin: '22px 0 0', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                    <span
                      style={{
                        fontFamily: "'Zilla Slab', serif",
                        fontWeight: 700,
                        fontSize: '40px',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {t.price}
                    </span>
                    {t.unit && (
                      <span style={{ fontSize: '13px', color: muted }}>{t.unit}</span>
                    )}
                  </div>
                  <p style={{ fontSize: '14px', color: muted, margin: '8px 0 0' }}>{t.blurb}</p>

                  <div
                    style={{
                      height: '1px',
                      background: t.featured ? 'rgba(245,242,237,0.18)' : 'rgba(26,26,26,0.1)',
                      margin: '22px 0',
                    }}
                  />

                  <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
                    {t.perks.map((perk) => (
                      <li key={perk} style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', color: fg }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '17px',
                            height: '17px',
                            borderRadius: '50%',
                            background: ACCENT,
                            flexShrink: 0,
                          }}
                        >
                          <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6.2l2.2 2.2L9.5 3.6" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                        {perk}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href="/login"
                    className={t.featured ? styles.secondaryBtn : styles.primaryBtn}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '9px',
                      marginTop: '26px',
                      background: t.featured ? CREAM : INK,
                      color: t.featured ? INK : CREAM,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: '12.5px',
                      fontWeight: 600,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                      textDecoration: 'none',
                      padding: '13px 20px',
                      borderRadius: '10px',
                    }}
                  >
                    {t.price === 'Custom' ? 'Contact us' : 'Get started'}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* DEMO / CLOSING CTA */}
        <section id="demo" className={styles.section}>
          <div
            style={{
              background: INK,
              borderRadius: '20px',
              padding: '64px 48px',
              textAlign: 'center',
            }}
          >
            <span style={{ ...eyebrowStyle, color: '#8FBFA4', justifyContent: 'center' }}>
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ACCENT }} />
              Live demo
            </span>
            <h2
              style={{
                fontFamily: "'Zilla Slab', serif",
                fontWeight: 700,
                fontSize: '44px',
                lineHeight: 1.08,
                letterSpacing: '-0.02em',
                color: CREAM,
                margin: '16px auto 0',
                maxWidth: '620px',
                textWrap: 'balance',
              }}
            >
              See GymCentre in action.
            </h2>
            <p
              style={{
                fontSize: '17px',
                lineHeight: 1.55,
                color: 'rgba(245,242,237,0.68)',
                margin: '16px auto 0',
                maxWidth: '480px',
              }}
            >
              Sign in to explore the full dashboard — members, plans, payments, and workout access.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '30px', flexWrap: 'wrap' }}>
              <Link
                href="/login"
                className={styles.primaryBtn}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  background: CREAM,
                  color: INK,
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  textDecoration: 'none',
                  padding: '15px 24px',
                  borderRadius: '10px',
                }}
              >
                Open the dashboard
                <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h9M8 4l4 4-4 4" stroke={INK} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </section>
      </div>

      {/* FOOTER */}
      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid rgba(26,26,26,0.14)' }}>
        <div className={styles.container} style={{ padding: '52px 48px' }}>
          <div className={styles.footerRow}>
            <div style={{ maxWidth: '300px' }}>
              <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: INK,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
                    color: CREAM,
                  }}
                >
                  GC
                </div>
                <span style={{ fontFamily: "'Zilla Slab', serif", fontWeight: 700, fontSize: '20px' }}>GymCentre</span>
              </Link>
              <p style={{ fontSize: '14px', color: 'rgba(26,26,26,0.6)', margin: '14px 0 0', lineHeight: 1.55 }}>
                Run your whole gym from one screen.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '52px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.45)' }}>
                  Product
                </span>
                <a href="#features" className={styles.navLink} style={{ ...navLinkStyle, fontSize: '13.5px', textTransform: 'none', letterSpacing: 0 }}>Features</a>
                <a href="#pricing" className={styles.navLink} style={{ ...navLinkStyle, fontSize: '13.5px', textTransform: 'none', letterSpacing: 0 }}>Pricing</a>
                <a href="#demo" className={styles.navLink} style={{ ...navLinkStyle, fontSize: '13.5px', textTransform: 'none', letterSpacing: 0 }}>Demo</a>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(26,26,26,0.45)' }}>
                  Account
                </span>
                <Link href="/login" className={styles.navLink} style={{ ...navLinkStyle, fontSize: '13.5px', textTransform: 'none', letterSpacing: 0 }}>Log in</Link>
                <Link href="/login" className={styles.navLink} style={{ ...navLinkStyle, fontSize: '13.5px', textTransform: 'none', letterSpacing: 0 }}>Get started</Link>
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '20px',
              flexWrap: 'wrap',
              marginTop: '44px',
              paddingTop: '24px',
              borderTop: '1px solid rgba(26,26,26,0.1)',
            }}
          >
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11.5px', letterSpacing: '0.04em', color: 'rgba(26,26,26,0.5)' }}>
              © {new Date().getFullYear()} GYMCENTRE · ALL RIGHTS RESERVED
            </span>
            <div style={{ display: 'flex', gap: '10px' }}>
              {[
                { label: 'Instagram', d: 'M4 1.5h8A2.5 2.5 0 0 1 14.5 4v8a2.5 2.5 0 0 1-2.5 2.5H4A2.5 2.5 0 0 1 1.5 12V4A2.5 2.5 0 0 1 4 1.5z M8 5.2A2.8 2.8 0 1 0 8 10.8 2.8 2.8 0 0 0 8 5.2z M11.6 4.4h.01' },
                { label: 'X', d: 'M2.5 2.5l11 11M13.5 2.5l-11 11' },
                { label: 'LinkedIn', d: 'M4 6.5v6M4 3.6v.01M7 12.5v-3.2a1.8 1.8 0 0 1 3.6 0v3.2M7 6.5v6' },
              ].map((s) => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className={styles.social}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: '34px',
                    height: '34px',
                    borderRadius: '9px',
                    border: '1px solid rgba(26,26,26,0.18)',
                    color: INK,
                  }}
                >
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d={s.d} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
