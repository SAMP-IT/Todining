import { Link } from 'react-router-dom';

/**
 * Public marketing "Pricing" page. Ported from
 * design-samples/screens/site/pricing.html. Renders only the `<main>` content;
 * the shared nav, grain and footer come from MarketingLayout.
 */
export function PricingPage() {
  return (
    <>
      {/* HERO */}
      <header className="phero">
        <div className="wrap">
          <span className="kick">Plans for one room or many</span>
          <h1>Priced by the <em>house</em></h1>
          <p className="lede">Pick the plan that fits your room today. Move up when you grow. Every plan runs on the same platform, with your data kept to your restaurant.</p>
          <div className="cta">
            <Link className="btn btn-ember" to="/demo">Book a demo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
            <Link className="btn btn-out" to="/features">See the features</Link>
          </div>
        </div>
      </header>

      {/* PLANS */}
      <section className="sec">
        <div className="wrap">
          <div className="sec-head"><span className="kick">Three plans</span><h2>Start small, grow into the <em>whole</em> service.</h2></div>
          <div className="plans">

            {/* STARTER */}
            <div className="plan">
              <div className="pn">Starter</div>
              <h3>Starter</h3>
              <p className="who">A single small venue getting off the clipboard.</p>
              <div className="price"><span className="amt tnum">₹1,999</span><span className="per">/mo per venue</span></div>
              <ul>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>QR ordering and the digital menu</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Shared table tab, one bill per visit</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Kitchen and waiter boards</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Service requests</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Tables and QR generation</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Basic feedback</li>
              </ul>
              <Link className="btn btn-out" to="/demo">Book a demo</Link>
            </div>

            {/* GROWTH */}
            <div className="plan pop">
              <span className="tag">Most popular</span>
              <div className="pn">Growth</div>
              <h3>Growth</h3>
              <p className="who">One venue running the full front and back of house.</p>
              <div className="price"><span className="amt tnum">₹4,999</span><span className="per">/mo per venue</span></div>
              <ul>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Everything in Starter</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Reservations</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Billing and PDF invoices, tax and service charge</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Inventory with low-stock alerts</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Rule-based upsell suggestions</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Analytics: revenue, peak hours, top dishes</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Staff and roles</li>
              </ul>
              <Link className="btn btn-ember" to="/demo">Book a demo</Link>
            </div>

            {/* GROUP */}
            <div className="plan">
              <div className="pn">Group / Multi</div>
              <h3>Group / Multi</h3>
              <p className="who">Several restaurants and their branches, run together.</p>
              <div className="price"><span className="amt">Custom</span><span className="per">talk to us</span></div>
              <ul>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Everything in Growth</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Multiple restaurants from one login</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Branch structure under each house</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Per-restaurant data isolation</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Consolidated switching across venues</li>
                <li><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>Priority onboarding and support</li>
              </ul>
              <Link className="btn btn-out" to="/demo">Book a demo</Link>
            </div>

          </div>
          <p className="pnote">Indicative pricing · final plans set at launch.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="sec strip">
        <div className="wrap">
          <div className="sec-head"><span className="kick">Before you ask</span><h2>Questions, <em>answered.</em></h2></div>
          <div className="faq">
            <div className="qa"><h4>What's included in a plan?</h4><p>The platform and its modules for the tier you pick, run from your own console. No per-seat fee for staff on the boards.</p></div>
            <div className="qa"><h4>Do my guests need to download an app?</h4><p>No. Guests order from their phone's browser after scanning the table QR. There's nothing to install.</p></div>
            <div className="qa"><h4>Can I run more than one restaurant?</h4><p>Yes. The Group plan runs several restaurants and their branches from one login, each one's data kept to itself.</p></div>
            <div className="qa"><h4>How does payment and billing work?</h4><p>ToDining produces the guest's itemised check, applies tax and service charge, and exports a PDF with a per-year invoice number. Taking the guest's card or cash is still handled at your counter; ToDining doesn't process card payments yet.</p></div>
            <div className="qa"><h4>Is my data kept separate from other restaurants?</h4><p>Each restaurant's data is scoped to that restaurant. In a group, one house's floor is never visible to another.</p></div>
            <div className="qa"><h4>How do I start?</h4><p>Book a demo. We'll walk your team through it on your own menu and tables, then set you up.</p></div>
          </div>
        </div>
      </section>

      {/* CLOSE */}
      <section className="close">
        <img alt="" src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <div className="veil" />
        <div className="wrap inner">
          <span className="kick on-dark">On your own tables, on your own menu</span>
          <h2>Find your <em>plan</em> with us</h2>
          <div className="cta"><Link className="btn btn-cream" to="/demo">Book a demo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link><Link className="btn btn-line" to="/features">See the features</Link></div>
        </div>
      </section>
    </>
  );
}
