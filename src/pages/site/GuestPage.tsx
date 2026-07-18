import { Link } from 'react-router-dom';

/**
 * Public marketing page: Guest ordering (features-guest). Renders only the
 * `<main>` content; the shared nav + footer come from MarketingLayout.
 */
export function GuestPage() {
  return (
    <>
      {/* HERO */}
      <header className="phero"><div className="wrap">
        <span className="kick">What the guest touches</span>
        <h1>From the <em>table</em>, in seconds</h1>
        <p className="lede">A guest sits down, scans the code on the table, and orders from their own phone. No app to install, no account to make, no waiting to be seen.</p>
        <div className="cta">
          <a className="btn btn-ember" href="#flow">See it live <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
          <Link className="btn btn-out" to="/demo">Book a demo</Link>
        </div>
      </div></header>

      {/* THE GUEST JOURNEY */}
      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="kick">Start to finish</span><h2>The guest <em>journey.</em></h2></div>
        <div className="steps">
          <div className="step"><div className="n">1</div><div><h4>Scan</h4><p>A QR code on each table opens your menu on the guest's phone. Nothing to download.</p></div></div>
          <div className="step"><div className="n">2</div><div><h4>Browse &amp; order</h4><p>They read the full menu, add to a shared table tab, and send the order to the kitchen.</p></div></div>
          <div className="step"><div className="n">3</div><div><h4>Track live</h4><p>Each dish shows its state, placed to preparing to served, updating as the line works.</p></div></div>
          <div className="step"><div className="n">4</div><div><h4>Call a waiter</h4><p>A tap asks for a waiter or the bill; the floor sees the request at once.</p></div></div>
          <div className="step"><div className="n">5</div><div><h4>Pay &amp; feedback</h4><p>The check is itemised and totalled, then a quick rating on food, service and room.</p></div></div>
        </div>
      </div></section>

      {/* THREE PHONES: the flow */}
      <section className="sec strip" id="flow"><div className="wrap">
        <div className="sec-head"><span className="kick">The screens</span><h2>Scan, order and track, all from the <em>table.</em></h2><p>No app, no login. The same three taps your guests will actually move through, below.</p></div>
        <div className="trio">
          <div>
            <div className="phone"><div className="screen cph">
              <div className="cph-top"><span className="b"><span className="s">V</span>Velans</span><span style={{ fontSize: '.5rem', fontWeight: '700', color: 'var(--ink-mute)', border: '1px solid var(--hairline)', padding: '.15rem .3rem', borderRadius: '.3rem' }}>T12</span></div>
              <div className="cph-body" style={{ paddingBottom: '2.4rem' }}>
                <div className="est">Firewood Kitchen</div><h6>What are you <em>craving?</em></h6>
                <div className="cdish"><span className="th"><img alt="" src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=90&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm">Charred octopus</div><div className="pr">₹560</div></div></div>
                <div className="cdish"><span className="th"><img alt="" src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=90&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm">Burrata &amp; tomato</div><div className="pr">₹420</div></div></div>
                <div className="cdish" style={{ borderBottom: 0 }}><span className="th"><img alt="" src="https://images.unsplash.com/photo-1633436375153-d7045cb93e38?w=90&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm">Truffle tagliatelle</div><div className="pr">₹480</div></div></div>
              </div>
              <div className="cph-bar"><span style={{ display: 'flex', alignItems: 'center' }}><span className="cb">3</span>In your cart</span><span className="tnum">₹1,460 →</span></div>
            </div></div>
            <div className="pcap"><b>Browse</b> the menu</div>
          </div>
          <div>
            <div className="phone"><div className="screen cph">
              <div className="cph-top"><span style={{ fontSize: '.56rem', fontWeight: '700', color: 'var(--ink-soft)' }}>← Add items</span><span style={{ fontSize: '.5rem', fontWeight: '700', color: 'var(--ink-mute)', border: '1px solid var(--hairline)', padding: '.15rem .3rem', borderRadius: '.3rem' }}>T12</span></div>
              <div className="cph-body">
                <h6 style={{ textAlign: 'left', margin: '.1rem 0 .5rem' }}>Your order</h6>
                <div className="cdish"><span className="th"><img alt="" src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=90&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm">Charred octopus</div><div className="pr" style={{ color: 'var(--ink-mute)', fontSize: '.56rem', fontFamily: "'Plus Jakarta Sans'" }}>₹560 · 1</div></div></div>
                <div className="cdish" style={{ borderBottom: 0 }}><span className="th"><img alt="" src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=90&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm">Burrata &amp; tomato</div><div className="pr" style={{ color: 'var(--ink-mute)', fontSize: '.56rem', fontFamily: "'Plus Jakarta Sans'" }}>₹420 · 2</div></div></div>
                <div style={{ border: '1px solid var(--hairline)', borderRadius: '.4rem', padding: '.5rem', marginTop: '.6rem', fontSize: '.58rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)', padding: '.1rem 0' }}>Subtotal<span className="tnum">₹1,400</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ink-soft)', padding: '.1rem 0' }}>Tax + service<span className="tnum">₹140</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '1.5px solid var(--ink)', marginTop: '.3rem', paddingTop: '.3rem' }}><b style={{ fontFamily: "'Cormorant Garamond'", fontSize: '.82rem' }}>Total</b><span style={{ fontFamily: "'Cormorant Garamond'", fontWeight: '700', fontSize: '1rem' }} className="tnum">₹1,540</span></div>
                </div>
              </div>
              <div className="cph-bar" style={{ background: 'var(--ember)', justifyContent: 'center', gap: '.3rem' }}>Place order · <span className="tnum">₹1,540</span></div>
            </div></div>
            <div className="pcap"><b>Send</b> to the kitchen</div>
          </div>
          <div>
            <div className="phone"><div className="screen cph">
              <div className="cph-top"><span style={{ fontSize: '.5rem', fontWeight: '700', color: 'var(--ink-mute)' }}>Order #A24F8</span><span style={{ fontSize: '.5rem', fontWeight: '700', color: 'var(--ink-mute)', border: '1px solid var(--hairline)', padding: '.15rem .3rem', borderRadius: '.3rem' }}>T12</span></div>
              <div className="cph-body">
                <div style={{ display: 'flex', alignItems: 'center', gap: '.35rem', background: 'var(--forest-soft)', border: '1px solid oklch(0.86 0.05 150)', color: 'var(--forest)', borderRadius: '.4rem', padding: '.4rem .5rem', fontSize: '.56rem', fontWeight: '700', marginBottom: '.6rem' }}>✓ Order placed at 9:47</div>
                <h6 style={{ textAlign: 'left', fontSize: '.95rem', margin: '.1rem 0 .5rem' }}>Live status</h6>
                <div style={{ position: 'relative', paddingLeft: '1.2rem' }}>
                  <div style={{ position: 'absolute', left: '.42rem', top: '.3rem', bottom: '.3rem', width: '2px', background: 'var(--hairline)' }}></div>
                  <div style={{ position: 'absolute', left: '.42rem', top: '.3rem', height: '52%', width: '2px', background: 'var(--forest)' }}></div>
                  <div style={{ position: 'relative', paddingBottom: '.6rem' }}><span style={{ position: 'absolute', left: '-1.2rem', top: '-.05rem', width: '.85rem', height: '.85rem', borderRadius: '99px', background: 'var(--forest)', color: 'var(--paper)', display: 'grid', placeItems: 'center', fontSize: '.5rem' }}>✓</span><div style={{ fontFamily: "'Cormorant Garamond'", fontWeight: '600', fontSize: '.74rem' }}>Order placed</div></div>
                  <div style={{ position: 'relative', paddingBottom: '.6rem' }}><span style={{ position: 'absolute', left: '-1.2rem', top: '-.05rem', width: '.85rem', height: '.85rem', borderRadius: '99px', background: 'var(--forest)', color: 'var(--paper)', display: 'grid', placeItems: 'center', fontSize: '.5rem' }}>✓</span><div style={{ fontFamily: "'Cormorant Garamond'", fontWeight: '600', fontSize: '.74rem' }}>Preparing</div></div>
                  <div style={{ position: 'relative', paddingBottom: '.6rem' }}><span style={{ position: 'absolute', left: '-1.2rem', top: '-.05rem', width: '.85rem', height: '.85rem', borderRadius: '99px', background: 'var(--paper)', border: '2px solid var(--ember)' }}></span><div style={{ fontFamily: "'Cormorant Garamond'", fontWeight: '600', fontSize: '.74rem', color: 'var(--ember)' }}>Ready</div></div>
                  <div style={{ position: 'relative' }}><span style={{ position: 'absolute', left: '-1.2rem', top: '-.05rem', width: '.85rem', height: '.85rem', borderRadius: '99px', background: 'var(--paper)', border: '2px solid var(--hairline)' }}></span><div style={{ fontFamily: "'Cormorant Garamond'", fontWeight: '600', fontSize: '.74rem', color: 'var(--ink-mute)' }}>Served</div></div>
                </div>
              </div>
              <div className="cph-bar" style={{ background: 'var(--ember)', justifyContent: 'center' }}>Complete dining · <span className="tnum" style={{ marginLeft: '.2rem' }}>₹1,880</span></div>
            </div></div>
            <div className="pcap"><b>Track</b> it live</div>
          </div>
        </div>
      </div></section>

      {/* WHY IT MATTERS */}
      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="kick">Why it matters</span><h2>Less friction at the <em>table.</em></h2></div>
        <div className="benefits" style={{ marginTop: '1.6rem' }}>
          <div className="benefit"><div className="bn">i.</div><h4>No app to install</h4><p>The menu opens in the phone's browser. First-time guests are ordering in under a minute.</p></div>
          <div className="benefit"><div className="bn">ii.</div><h4>One shared table tab</h4><p>Everyone at the table adds to the same order, so the round arrives together.</p></div>
          <div className="benefit"><div className="bn">iii.</div><h4>One bill per visit</h4><p>A table's whole visit is a single dining session, so it closes to one clean check.</p></div>
          <div className="benefit"><div className="bn">iv.</div><h4>Reservations built in</h4><p>Bookings live in the same system, so a reserved table is ready when they arrive.</p></div>
        </div>
      </div></section>

      {/* CLOSE */}
      <section className="close">
        <img alt="" src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=1200&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <div className="veil"></div>
        <div className="wrap inner">
          <span className="kick on-dark">The diner's whole flow, on your tables</span>
          <h2>Watch a guest <em>order.</em></h2>
          <div className="cta"><a className="btn btn-cream" href="#flow">See it live <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a><Link className="btn btn-line" to="/demo">Book a demo</Link></div>
        </div>
      </section>
    </>
  );
}
