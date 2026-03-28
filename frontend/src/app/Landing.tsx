import { NavLink } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { PageWrapper } from '../components/PageWrapper';

const navLinks = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Stories', href: '#stories' }
];

const featureCards = [
  {
    title: 'Have perfect control',
    body: 'All cash, bank, and wallet activity in one place.'
  },
  {
    title: 'Get quick insight',
    body: 'See where money goes and what to change.'
  },
  {
    title: 'Use it every day',
    body: 'Fast capture, smart rules, simple habits.'
  }
];

const steps = [
  {
    title: 'Track your cash flow',
    points: ['Connect accounts and wallets.', 'Add cash expenses in seconds.', 'See balances update live.']
  },
  {
    title: 'Understand your habits',
    points: ['Spot trends and category leaks.', 'See income vs expense clearly.', 'Know your safe-to-spend.']
  },
  {
    title: 'Make spending stress-free',
    points: ['Set budgets for focus.', 'Automate rules and alerts.', 'Stay ahead of bills.']
  }
];

const testimonials = [
  {
    quote: 'Clean, calm, and actually useful.',
    name: 'Maya'
  },
  {
    quote: 'I finally understand where my money goes.',
    name: 'Arman'
  },
  {
    quote: 'Budgeting doesn’t feel heavy anymore.',
    name: 'Harriet'
  }
];

export function LandingPage() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <PageWrapper pageKey="landing" className="landing-page">
      <header className="landing-nav">
        <div className="landing-brand">
          <span className="landing-brand-mark">P</span>
          <span className="landing-brand-text">Personal Finance Tracker</span>
        </div>
        <nav className="landing-links">
          {navLinks.map((link) => (
            <a key={link.href} className="landing-link" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="landing-actions">
          <NavLink className="btn-secondary" to="/login">
            Log in
          </NavLink>
          <NavLink className="btn-primary" to="/register">
            Create account
          </NavLink>
        </div>
      </header>

      <main className="landing-main">
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-pill">Money in shape</div>
            <h1 className="landing-title">The calm way to run your finances.</h1>
            <p className="landing-subtitle">
              Track balances, budget with clarity, and stay ahead of what’s next.
            </p>
            <div className="landing-cta">
              <NavLink className="btn-primary" to="/register">
                Get started
              </NavLink>
              <NavLink className="btn-secondary" to="/login">
                Sign in
              </NavLink>
            </div>
            <div className="landing-proof">
              <div className="landing-stars">4.7</div>
              <div className="landing-proof-text">App store rating</div>
            </div>
          </div>
          <div className="landing-hero-media">
            <div className="landing-ring" aria-hidden="true" />
            <motion.div
              className="landing-device-grid"
              initial={prefersReducedMotion ? false : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 90, damping: 18 }}
            >
              <div className="landing-phone">
                <div className="landing-phone-header" />
                <div className="landing-phone-chart">
                  <span />
                  <span />
                  <span />
                </div>
                <div className="landing-phone-metrics">
                  <div />
                  <div />
                </div>
              </div>
              <div className="landing-laptop">
                <div className="landing-laptop-top" />
                <div className="landing-laptop-screen">
                  <div className="landing-laptop-bars">
                    <span />
                    <span />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="landing-laptop-lines">
                    <span />
                    <span />
                    <span />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section id="features" className="landing-features">
          {featureCards.map((card) => (
            <div key={card.title} className="landing-feature-card">
              <div className="landing-feature-icon" />
              <h3>{card.title}</h3>
              <p>{card.body}</p>
            </div>
          ))}
        </section>

        <section id="how" className="landing-steps">
          <div className="landing-section-title">
            <p>How it works</p>
            <h2>Get your money in shape.</h2>
          </div>
          <div className="landing-step-grid">
            {steps.map((step, index) => (
              <div key={step.title} className="landing-step">
                <div className="landing-step-index">{index + 1}</div>
                <h3>{step.title}</h3>
                <ul>
                  {step.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section id="stories" className="landing-testimonials">
          <div className="landing-section-title">
            <p>Why people stay</p>
            <h2>Simple, clear, and reliable.</h2>
          </div>
          <div className="landing-testimonial-grid">
            {testimonials.map((item) => (
              <div key={item.name} className="landing-testimonial">
                <p>{item.quote}</p>
                <span>{item.name}</span>
              </div>
            ))}
          </div>
          <div className="landing-press">
            <span>THE VERGE</span>
            <span>BUSINESS INSIDER</span>
            <span>WALL STREET JOURNAL</span>
            <span>LIFEHACKER</span>
            <span>NBC NEWS</span>
          </div>
        </section>

        <section className="landing-newsletter">
          <div>
            <h2>Monthly money tips</h2>
            <p>Short, useful, and never spammy.</p>
          </div>
          <form className="landing-newsletter-form">
            <input type="email" placeholder="Email address" />
            <button className="btn-primary" type="button">
              Subscribe
            </button>
          </form>
        </section>
      </main>
    </PageWrapper>
  );
}
