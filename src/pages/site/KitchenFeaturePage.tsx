import { Link } from 'react-router-dom';

/**
 * Public marketing page: Kitchen & service (features-kitchen). Renders only the
 * `<main>` content; the shared nav + footer come from MarketingLayout.
 *
 * Named KitchenFeaturePage to avoid clashing with the staff KitchenPage.
 */
export function KitchenFeaturePage() {
  return (
    <>
      {/* HERO */}
      <section className="phero"><div className="wrap">
        <span className="kick">The line and the floor</span>
        <h1>One board, <em>both</em> sides</h1>
        <p className="lede">The moment a guest orders, the kitchen sees it. The floor sees what's ready. Built to be read at arm's length, in the middle of a rush.</p>
        <div className="cta">
          <Link className="btn btn-ember" to="/demo">Book a demo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
          <Link className="btn btn-out" to="/features/guest">See guest ordering</Link>
        </div>
      </div></section>

      {/* ROW 1 · KITCHEN BOARD */}
      <section className="sec"><div className="wrap">
        <div className="feature-row">
          <div className="fr-copy">
            <span className="kick">The kitchen</span>
            <h3>Kitchen board</h3>
            <p>Tickets arrive the instant they're placed, no runner, no shouting down the pass. Each ticket ages on screen so nothing sits forgotten, and one tap moves it New to Preparing to Ready. The line always knows what's next.</p>
            <div className="mini"><span>New → Preparing → Ready</span><span>Ticket aging</span><span>One tap</span></div>
          </div>
          <div className="browser">
            <div className="b-bar"><span className="b-dots"><span></span><span></span><span></span></span><span className="b-url">todining.app/kitchen</span></div>
            <div className="kb">
              <div className="kb-top"><span className="t"><span className="seal" style={{ width: '1.1rem', height: '1.1rem', fontSize: '.55rem' }}>T</span> Kitchen board</span><span className="live"><i></i> Live · 5 active</span></div>
              <div className="kb-cols">
                <div className="kb-col">
                  <div className="kb-ch"><span className="d"><i className="i-new"></i> New</span><span className="c">2</span></div>
                  <div className="tk new"><div className="tk-h"><h6>Table 1</h6><span className="ago">2m</span></div><ul><li><span className="q">1</span>Veg biryani</li><li><span className="q">2</span>Chicken biryani</li></ul><button className="act act-e">Start cooking</button></div>
                  <div className="tk new"><div className="tk-h"><h6>Table 6</h6><span className="ago">9m</span></div><ul><li><span className="q">1</span>Charred octopus</li></ul><button className="act act-e">Start cooking</button></div>
                </div>
                <div className="kb-col">
                  <div className="kb-ch"><span className="d"><i className="i-prep"></i> Preparing</span><span className="c">2</span></div>
                  <div className="tk"><div className="tk-h"><h6>Table 3</h6><span className="ago late">21m</span></div><ul><li><span className="q">2</span>Tagliatelle</li></ul><button className="act act-f">Mark ready</button></div>
                  <div className="tk"><div className="tk-h"><h6>Table 8</h6><span className="ago">4m</span></div><ul><li><span className="q">3</span>Focaccia</li></ul><button className="act act-f">Mark ready</button></div>
                </div>
                <div className="kb-col">
                  <div className="kb-ch"><span className="d"><i className="i-ready"></i> Ready</span><span className="c">1</span></div>
                  <div className="tk ready"><div className="tk-h"><h6>Table 12</h6><span className="ago">1m</span></div><ul><li><span className="q">1</span>Grain bowl</li></ul><div className="wait">Waiting for waiter</div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div></section>

      {/* ROW 2 · WAITER BOARD */}
      <section className="sec strip"><div className="wrap">
        <div className="feature-row rev">
          <div className="fr-copy">
            <span className="kick">The floor</span>
            <h3>Waiter board</h3>
            <p>Ready plates to run, tables in service, and guest calls, all on one screen and sorted by priority. The floor knows what to carry and who's waiting, without walking the room to find out.</p>
            <div className="mini"><span>Ready to run</span><span>Guest calls</span><span>Sorted by priority</span></div>
          </div>
          <div className="browser">
            <div className="b-bar"><span className="b-dots"><span></span><span></span><span></span></span><span className="b-url">todining.app/waiter</span></div>
            <div className="ad-main" style={{ background: 'oklch(0.965 0.01 76)', padding: '.9rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.7rem' }}>
                <h5>Waiter board</h5>
                <span className="live" style={{ fontSize: '.56rem', fontWeight: '700', letterSpacing: '.1em', textTransform: 'uppercase', color: 'var(--forest)', display: 'flex', alignItems: 'center', gap: '.3rem' }}><i style={{ width: '.35rem', height: '.35rem', borderRadius: '99px', background: 'var(--forest)' }}></i> Live</span>
              </div>
              <div className="ad-card" style={{ marginBottom: '.6rem' }}>
                <div className="ch"><h6>Ready to run</h6><a>3 plates</a></div>
                <div className="ad-row"><span className="l"><span className="tc">T12</span><span className="id">Grain bowl</span></span><span><span className="bdg b-forest">Ready</span></span></div>
                <div className="ad-row"><span className="l"><span className="tc">T4</span><span className="id">Focaccia · Burrata</span></span><span><span className="bdg b-forest">Ready</span></span></div>
                <div className="ad-row"><span className="l"><span className="tc">T9</span><span className="id">Tagliatelle</span></span><span><span className="bdg b-forest">Ready</span></span></div>
              </div>
              <div className="ad-card">
                <div className="ch"><h6>Guest calls</h6><a>2 waiting</a></div>
                <div className="ad-row"><span className="l"><span className="tc">T7</span><span className="id">Calling waiter</span></span><span><span className="bdg b-ember">6m</span></span></div>
                <div className="ad-row"><span className="l"><span className="tc">T2</span><span className="id">Asked for the bill</span></span><span><span className="bdg b-gold">2m</span></span></div>
              </div>
            </div>
          </div>
        </div>
      </div></section>

      {/* BENEFITS */}
      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="kick">Why it holds up in service</span><h2>Built for the <em>rush,</em> not the demo.</h2></div>
        <div className="benefits" style={{ marginTop: '2rem', border: '1px solid var(--hairline)', borderRadius: '.9rem', overflow: 'hidden' }}>
          <div className="benefit"><span className="bn">i.</span><h4>Read in a glance</h4><p>Big type, clear states, and colour that means live. Legible from across a hot kitchen.</p></div>
          <div className="benefit"><span className="bn">ii.</span><h4>Nothing gets lost</h4><p>Tickets age on screen, so the oldest order is always the loudest.</p></div>
          <div className="benefit"><span className="bn">iii.</span><h4>The room stays in step</h4><p>Guest, kitchen and floor read the same live state, so no one's guessing.</p></div>
        </div>
      </div></section>

      {/* CLOSE */}
      <section className="close">
        <img alt="" src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <div className="veil"></div>
        <div className="wrap inner">
          <span className="kick on-dark">See it under pressure</span>
          <h2>See the board in a <em>rush</em></h2>
          <div className="cta"><Link className="btn btn-cream" to="/demo">Book a demo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link><Link className="btn btn-line" to="/features/guest">See guest ordering</Link></div>
        </div>
      </section>
    </>
  );
}
