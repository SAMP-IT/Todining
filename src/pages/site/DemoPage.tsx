import { useState } from 'react';
import { submitDemoRequest } from '@/lib/api';

/**
 * Public marketing "Book a demo" page. Ported from
 * design-samples/screens/site/demo.html. Renders only the `<main>` content; the
 * shared nav, grain and footer come from MarketingLayout.
 *
 * The prototype's inline submit-toggle script is replaced with a real controlled
 * form that posts the lead to our own API via `submitDemoRequest`. On success we
 * swap the form for the success card in place; on failure we keep the form and
 * surface the error inline next to the button.
 */
export function DemoPage() {
  const [name, setName] = useState('');
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [locations, setLocations] = useState('1');
  const [message, setMessage] = useState('');

  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('submitting');
    setError('');
    const r = await submitDemoRequest({ name, restaurantName, email, phone, locations, message });
    if (r.ok) {
      setStatus('done');
    } else {
      setError(r.error);
      setStatus('idle');
    }
  }

  return (
    <>
      {/* HERO */}
      <header className="phero">
        <div className="wrap">
          <span className="kick">A short walkthrough, on your floor</span>
          <h1>See it on your <em>tables</em></h1>
          <p className="lede">Fifteen minutes, your menu, your room. We'll show you the guest's flow and the boards your team would run, and answer whatever you bring.</p>
        </div>
      </header>

      {/* DEMO GRID */}
      <section className="sec">
        <div className="wrap">
          <div className="demo-grid">

            {/* LEFT: intro + what happens next */}
            <div className="left-intro">
              <span className="kick">How it goes</span>
              <h2>A look, not a <em>pitch.</em></h2>
              <p className="lede">Tell us a little about your room and what you'd like to see. We'll set a time and walk your team through ToDining on your own menu and tables.</p>

              <div className="next">
                <div className="nh">What happens next</div>
                <div className="step-row"><span className="n">1</span><div><h4>We read your note</h4><p>We look at your room, your menu, and how you run service today.</p></div></div>
                <div className="step-row"><span className="n">2</span><div><h4>We book a time</h4><p>A short walkthrough at a time that suits your floor, not ours.</p></div></div>
                <div className="step-row" style={{ borderBottom: 0 }}><span className="n">3</span><div><h4>You see it live</h4><p>Your menu, your tables, the guest flow and the boards, no slides.</p></div></div>
              </div>
            </div>

            {/* RIGHT: the form (or success state) */}
            <div id="form">
              {status === 'done' ? (
                <div className="form success" id="demoSuccess">
                  <div className="seal-ok"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg></div>
                  <h3>Thank you · consider it <em>noted</em></h3>
                  <p>We've got your request. Keep an eye on your inbox; we'll be in touch to set a time that works for your floor. Welcome to ToDining.</p>
                </div>
              ) : (
                <form className="form" id="demoForm" onSubmit={handleSubmit}>
                  <div className="field two">
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label htmlFor="name">Your name</label>
                      <input className="inp" id="name" name="name" type="text" placeholder="Manoj V" required value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label htmlFor="restaurant">Restaurant name</label>
                      <input className="inp" id="restaurant" name="restaurant" type="text" placeholder="Velans" value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} />
                    </div>
                  </div>
                  <div className="field two">
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label htmlFor="email">Email</label>
                      <input className="inp" id="email" name="email" type="email" placeholder="you@restaurant.com" required value={email} onChange={(e) => setEmail(e.target.value)} />
                    </div>
                    <div className="field" style={{ marginBottom: 0 }}>
                      <label htmlFor="phone">Phone (optional)</label>
                      <input className="inp" id="phone" name="phone" type="tel" placeholder="+91 " value={phone} onChange={(e) => setPhone(e.target.value)} />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="locations">Number of locations</label>
                    <select className="inp" id="locations" name="locations" value={locations} onChange={(e) => setLocations(e.target.value)}>
                      <option value="1">1</option>
                      <option value="2-5">2 to 5</option>
                      <option value="6+">6+</option>
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="message">What would you like to see?</label>
                    <textarea className="inp" id="message" name="message" placeholder="The guest ordering flow, the kitchen board, billing..." value={message} onChange={(e) => setMessage(e.target.value)} />
                  </div>
                  <button className="btn btn-ember" type="submit" style={{ width: '100%', justifyContent: 'center' }} disabled={status === 'submitting'}>
                    {status === 'submitting' ? 'Sending…' : 'Request a demo'}
                  </button>
                  {error ? (
                    <p style={{ marginTop: '.8rem', fontSize: '.8rem', fontWeight: 600, color: 'var(--ember-2)' }}>{error}</p>
                  ) : null}
                  <p className="reassure">No obligation, no pressure, no card. Just a look at whether ToDining fits your room.</p>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* CLOSING LINE */}
      <section className="closing-line">
        <div className="wrap">
          <p>A good service starts with a warm welcome. So does this one.</p>
        </div>
      </section>
    </>
  );
}
