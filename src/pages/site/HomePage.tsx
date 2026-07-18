import { Link } from 'react-router-dom';

/**
 * Public marketing home page. Renders only the content that sits inside the
 * MarketingLayout `<main>` (hero, proof row, teasers, quote, closing band);
 * the shell renders the grain, nav and footer. Ported from
 * design-samples/screens/site/home.html; page-scoped styles were moved into
 * src/styles/marketing.css.
 */
export function HomePage() {
  return (
    <>
      {/* HERO */}
      <header className="hero"><div className="wrap hero-grid">
        <div className="hero-copy">
          <span className="kick">A restaurant, run from one place</span>
          <h1>The dining room, <em>gathered.</em></h1>
          <p className="lede">From the guest's first scan to the printed check, ToDining runs ordering, the kitchen line, reservations and the back office. One system, sixteen parts, no clipboard.</p>
          <div className="cta">
            <Link className="btn btn-ember" to="/demo">Book a demo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
            <Link className="btn btn-out" to="/features">See the features</Link>
          </div>
          <p className="micro">Built for one room or fifty · every restaurant fully isolated.</p>
        </div>
        <div className="shot">
          <div className="browser">
            <div className="b-bar"><span className="b-dots"><span></span><span></span><span></span></span><span className="b-url">todining.app/admin</span></div>
            <div className="ad">
              <div className="ad-side">
                <div className="brand" style={{ gap: '.35rem', marginBottom: '.5rem' }}><span className="seal" style={{ width: '1.2rem', height: '1.2rem', fontSize: '.6rem' }}>T</span><b style={{ fontSize: '.85rem' }}>ToDining</b></div>
                <div className="sw"><span><span className="dot"></span>Velans</span><span style={{ color: 'var(--ink-mute)' }}>⌄</span></div>
                <div className="ad-nav"><a className="on">Dashboard</a><a>Orders</a><a>Menu</a><a>Tables &amp; QR</a><a>Reservations</a><a>Billing</a><a>Analytics</a></div>
              </div>
              <div className="ad-main">
                <h5>Dashboard</h5><div className="sub">Overview for Velans.</div>
                <div className="ad-kpis">
                  <div className="ad-kpi"><div className="l">Menu</div><div className="v">24</div></div>
                  <div className="ad-kpi"><div className="l">Orders</div><div className="v">138</div></div>
                  <div className="ad-kpi"><div className="l">Tables</div><div className="v">8</div></div>
                  <div className="ad-kpi"><div className="l">Revenue</div><div className="v">₹18,420</div></div>
                </div>
                <div className="ad-card">
                  <div className="ch"><h6>Recent orders</h6><a>View all →</a></div>
                  <div className="ad-row"><span className="l"><span className="tc">T1</span><span className="id">#F03RW</span></span><span><span className="amt">₹552</span><span className="bdg b-gold">Pending</span></span></div>
                  <div className="ad-row"><span className="l"><span className="tc">T3</span><span className="id">#K92LX</span></span><span><span className="amt">₹1,240</span><span className="bdg b-ember">Preparing</span></span></div>
                  <div className="ad-row"><span className="l"><span className="tc">T12</span><span className="id">#A24F8</span></span><span><span className="amt">₹320</span><span className="bdg b-forest">Served</span></span></div>
                </div>
              </div>
            </div>
          </div>
          <div className="phone"><div className="screen cph">
            <div className="cph-top"><span className="b"><span className="s">V</span>Velans</span><span className="chip">T12</span></div>
            <div className="cph-body" style={{ paddingBottom: '2.6rem' }}>
              <div className="est">Firewood Kitchen</div><h6>What are you <em>craving?</em></h6>
              <div className="cdish"><span className="th"><img alt="" src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=90&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm">Charred octopus</div><div className="pr">₹560</div></div></div>
              <div className="cdish"><span className="th"><img alt="" src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=90&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm">Burrata</div><div className="pr">₹420</div></div></div>
              <div className="cdish" style={{ borderBottom: 0 }}><span className="th"><img alt="" src="https://images.unsplash.com/photo-1633436375153-d7045cb93e38?w=90&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm">Tagliatelle</div><div className="pr">₹480</div></div></div>
            </div>
            <div className="cph-bar"><span style={{ display: 'flex', alignItems: 'center' }}><span className="cb">3</span>Cart</span><span className="tnum">₹1,460 →</span></div>
          </div></div>
        </div>
      </div></header>

      {/* PROOF */}
      <section className="proof"><div className="wrap"><div className="grid">
        <div className="cell"><div className="v tnum">30<em>s</em></div><div className="l">scan to first order</div></div>
        <div className="cell"><div className="v tnum">0</div><div className="l">apps for your guests to install</div></div>
        <div className="cell"><div className="v tnum">16</div><div className="l">modules, one platform</div></div>
        <div className="cell"><div className="v tnum">1</div><div className="l">bill per table visit</div></div>
      </div></div></section>

      {/* TEASERS */}
      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="kick">Three parts of the room</span><h2>One platform, from the <em>table</em> to the books.</h2></div>
        <div className="teasers">
          <Link className="teaser" to="/features/guest">
            <div className="viz guest"><div className="phone"><div className="screen cph">
              <div className="cph-top" style={{ padding: '.4rem .5rem' }}><span className="b" style={{ fontSize: '.66rem' }}><span className="s" style={{ width: '.9rem', height: '.9rem', fontSize: '.44rem' }}>V</span>Velans</span><span className="chip" style={{ fontSize: '.42rem' }}>T12</span></div>
              <div className="cph-body" style={{ padding: '.4rem' }}><h6 style={{ fontSize: '.82rem', margin: '.1rem 0 .35rem' }}>What are you <em>craving?</em></h6>
                <div className="cdish" style={{ padding: '.25rem 0' }}><span className="th" style={{ width: '1.5rem', height: '1.5rem' }}><img alt="" src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=70&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm" style={{ fontSize: '.6rem' }}>Charred octopus</div></div></div>
                <div className="cdish" style={{ padding: '.25rem 0', borderBottom: 0 }}><span className="th" style={{ width: '1.5rem', height: '1.5rem' }}><img alt="" src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=70&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm" style={{ fontSize: '.6rem' }}>Burrata</div></div></div>
              </div>
            </div></div></div>
            <div className="body"><div className="n">01 · Guest ordering</div><h3>Guest ordering</h3><p>A guest scans, browses your menu and orders from the table. No app, no waiting to be seen.</p><span className="lnk">Explore guest ordering →</span></div>
          </Link>
          <Link className="teaser" to="/features/kitchen">
            <div className="viz"><div className="kb" style={{ borderRadius: '.5rem', border: '1px solid var(--hairline)' }}>
              <div className="kb-cols">
                <div className="kb-col"><div className="kb-ch"><span className="d"><i className="i-new" />New</span><span className="c">2</span></div><div className="tk new" style={{ marginBottom: '.3rem' }}><div className="tk-h"><h6 style={{ fontSize: '.85rem' }}>T1</h6><span className="ago">2m</span></div></div></div>
                <div className="kb-col"><div className="kb-ch"><span className="d"><i className="i-prep" />Prep</span><span className="c">1</span></div><div className="tk"><div className="tk-h"><h6 style={{ fontSize: '.85rem' }}>T3</h6><span className="ago late">21m</span></div></div></div>
                <div className="kb-col"><div className="kb-ch"><span className="d"><i className="i-ready" />Ready</span><span className="c">1</span></div><div className="tk ready"><div className="tk-h"><h6 style={{ fontSize: '.85rem' }}>T12</h6></div></div></div>
              </div>
            </div></div>
            <div className="body"><div className="n">02 · Kitchen &amp; service</div><h3>Kitchen &amp; service</h3><p>Tickets land the moment they're placed. The line and the floor read the same board.</p><span className="lnk">See the line →</span></div>
          </Link>
          <Link className="teaser" to="/features/office">
            <div className="viz"><div style={{ width: '100%', border: '1px solid var(--hairline)', borderRadius: '.5rem', background: 'var(--card)', padding: '.6rem' }}>
              <div className="ad-kpis" style={{ marginBottom: '.4rem' }}><div className="ad-kpi"><div className="l">Orders</div><div className="v" style={{ fontSize: '.95rem' }}>138</div></div><div className="ad-kpi"><div className="l">Revenue</div><div className="v" style={{ fontSize: '.95rem' }}>₹18k</div></div></div>
              <div className="ad-row" style={{ fontSize: '.56rem' }}><span className="l"><span className="id">#F03RW</span></span><span><span className="bdg b-gold">Pending</span></span></div>
              <div className="ad-row" style={{ fontSize: '.56rem', borderBottom: 0 }}><span className="l"><span className="id">#K92LX</span></span><span><span className="bdg b-ember">Preparing</span></span></div>
            </div></div>
            <div className="body"><div className="n">03 · Back office</div><h3>Back office</h3><p>Menu, tables, reservations, billing, inventory and analytics, for one house or many.</p><span className="lnk">Go behind the pass →</span></div>
          </Link>
        </div>
      </div></section>

      {/* QUOTE */}
      <section className="quote"><div className="wrap"><p>Software should feel like a well-run <em>dining room</em>: generous, precise, a little bit special.</p></div></section>

      {/* CLOSE */}
      <section className="close">
        <img alt="" src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <div className="veil"></div>
        <div className="wrap inner">
          <span className="kick on-dark">See it on your own tables</span>
          <h2>Book a <em>walkthrough.</em></h2>
          <div className="cta"><Link className="btn btn-cream" to="/demo">Book a demo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link><Link className="btn btn-line" to="/pricing">View pricing</Link></div>
        </div>
      </section>
    </>
  );
}
