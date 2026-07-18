import { Link } from 'react-router-dom';

/**
 * Public marketing features page. Renders only the content that sits inside the
 * MarketingLayout `<main>` (hero, the 16 grouped modules, deep-page teasers,
 * quote, closing band); the shell renders the grain, nav and footer. Ported
 * from design-samples/screens/site/features.html, which uses only shared
 * marketing.css classes (its teaser-viz peek rules are the same ones moved from
 * home.html and now live in marketing.css).
 */
export function FeaturesPage() {
  return (
    <>
      {/* HERO */}
      <header className="phero"><div className="wrap">
        <span className="kick">The whole platform</span>
        <h1>Sixteen parts, <em>one</em> service</h1>
        <p className="lede">Everything a room needs between the door and the check. Grouped into three: what the guest touches, what the line and floor run on, and what you manage from the back.</p>
        <div className="cta">
          <Link className="btn btn-ember" to="/demo">Book a demo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link>
          <Link className="btn btn-out" to="/pricing">View pricing</Link>
        </div>
      </div></header>

      {/* THE 16 MODULES, grouped */}
      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="kick">Everything included</span><h2>One platform, from the <em>table</em> to the books.</h2></div>
        <div className="included">
          <div className="group">
            <div className="gh">Front of house</div>
            <div className="feat"><h4>QR ordering</h4><p>A guest scans the table code and starts ordering in seconds. Nothing to download.</p></div>
            <div className="feat"><h4>Digital menu</h4><p>Your full menu, categorised, priced and dietary-tagged, styled like a printed page.</p></div>
            <div className="feat"><h4>Cart &amp; upsell</h4><p>A shared table tab with rule-based suggestions: pair a starter, add a side.</p></div>
            <div className="feat"><h4>Service requests</h4><p>A guest taps to call a waiter or ask for the bill; the floor sees it at once.</p></div>
            <div className="feat"><h4>Reservations</h4><p>Take bookings by table and time, from the same system that runs the service.</p></div>
            <div className="feat"><h4>Feedback</h4><p>After the meal, guests rate food, service and the room in three quick taps.</p></div>
          </div>
          <div className="group">
            <div className="gh">Kitchen &amp; service</div>
            <div className="feat"><h4>Kitchen board</h4><p>New tickets arrive instantly, age on screen, and advance New to Preparing to Ready in one tap.</p></div>
            <div className="feat"><h4>Waiter board</h4><p>Ready plates, active tables and service calls, sorted by what needs attention first.</p></div>
            <div className="feat"><h4>Order lifecycle</h4><p>Every order carries its state from placed to served, visible to guest and staff alike.</p></div>
          </div>
          <div className="group">
            <div className="gh">Back office</div>
            <div className="feat"><h4>Orders</h4><p>One live view of every order across the floor, past and present.</p></div>
            <div className="feat"><h4>Menu &amp; categories</h4><p>Build and edit the menu, group it into categories, take items off in a tap.</p></div>
            <div className="feat"><h4>Tables &amp; QR</h4><p>Lay out your room, generate a QR per table, and print it.</p></div>
            <div className="feat"><h4>Billing &amp; invoices</h4><p>Tax and service charge applied, a PDF check exported, invoice numbers per year.</p></div>
            <div className="feat"><h4>Inventory</h4><p>Track stock and get low-stock alerts before you run out mid-service.</p></div>
            <div className="feat"><h4>Analytics</h4><p>Revenue, peak hours and top dishes, drawn straight from the day's orders.</p></div>
            <div className="feat"><h4>Staff &amp; roles</h4><p>Owner, manager, waiter, kitchen. Each role sees only its own board.</p></div>
            <div className="feat"><h4>Multi-restaurant</h4><p>Run several houses and their branches, each one's data kept to itself.</p></div>
          </div>
        </div>
      </div></section>

      {/* THREE DEEP-PAGE TEASERS */}
      <section className="sec strip"><div className="wrap">
        <div className="sec-head"><span className="kick">Three parts of the room</span><h2>Read the flow, screen by <em>screen.</em></h2></div>
        <div className="teasers">
          <Link className="teaser" to="/features/guest">
            <div className="viz guest"><div className="phone"><div className="screen cph">
              <div className="cph-top" style={{ padding: '.4rem .5rem' }}><span className="b" style={{ fontSize: '.66rem' }}><span className="s" style={{ width: '.9rem', height: '.9rem', fontSize: '.44rem' }}>V</span>Velans</span><span className="chip" style={{ fontSize: '.42rem' }}>T12</span></div>
              <div className="cph-body" style={{ padding: '.4rem' }}><h6 style={{ fontSize: '.82rem', margin: '.1rem 0 .35rem' }}>What are you <em>craving?</em></h6>
                <div className="cdish" style={{ padding: '.25rem 0' }}><span className="th" style={{ width: '1.5rem', height: '1.5rem' }}><img alt="" src="https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=70&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm" style={{ fontSize: '.6rem' }}>Charred octopus</div></div></div>
                <div className="cdish" style={{ padding: '.25rem 0', borderBottom: 0 }}><span className="th" style={{ width: '1.5rem', height: '1.5rem' }}><img alt="" src="https://images.unsplash.com/photo-1551782450-a2132b4ba21d?w=70&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} /></span><div><div className="nm" style={{ fontSize: '.6rem' }}>Burrata</div></div></div>
              </div>
            </div></div></div>
            <div className="body"><div className="n">01 · Guest ordering</div><h3>Guest ordering</h3><p>The diner's whole flow, scan to feedback. No app, no waiting to be seen.</p><span className="lnk">Explore guest ordering →</span></div>
          </Link>
          <Link className="teaser" to="/features/kitchen">
            <div className="viz"><div className="kb" style={{ borderRadius: '.5rem', border: '1px solid var(--hairline)' }}>
              <div className="kb-cols">
                <div className="kb-col"><div className="kb-ch"><span className="d"><i className="i-new" />New</span><span className="c">2</span></div><div className="tk new" style={{ marginBottom: '.3rem' }}><div className="tk-h"><h6 style={{ fontSize: '.85rem' }}>T1</h6><span className="ago">2m</span></div></div></div>
                <div className="kb-col"><div className="kb-ch"><span className="d"><i className="i-prep" />Prep</span><span className="c">1</span></div><div className="tk"><div className="tk-h"><h6 style={{ fontSize: '.85rem' }}>T3</h6><span className="ago late">21m</span></div></div></div>
                <div className="kb-col"><div className="kb-ch"><span className="d"><i className="i-ready" />Ready</span><span className="c">1</span></div><div className="tk ready"><div className="tk-h"><h6 style={{ fontSize: '.85rem' }}>T12</h6></div></div></div>
              </div>
            </div></div>
            <div className="body"><div className="n">02 · Kitchen &amp; service</div><h3>Kitchen &amp; service</h3><p>The board the line and floor share. Tickets land the moment they're placed.</p><span className="lnk">See the line →</span></div>
          </Link>
          <Link className="teaser" to="/features/office">
            <div className="viz"><div style={{ width: '100%', border: '1px solid var(--hairline)', borderRadius: '.5rem', background: 'var(--card)', padding: '.6rem' }}>
              <div className="ad-kpis" style={{ marginBottom: '.4rem' }}><div className="ad-kpi"><div className="l">Orders</div><div className="v" style={{ fontSize: '.95rem' }}>138</div></div><div className="ad-kpi"><div className="l">Revenue</div><div className="v" style={{ fontSize: '.95rem' }}>₹18k</div></div></div>
              <div className="ad-row" style={{ fontSize: '.56rem' }}><span className="l"><span className="id">#F03RW</span></span><span><span className="bdg b-gold">Pending</span></span></div>
              <div className="ad-row" style={{ fontSize: '.56rem', borderBottom: 0 }}><span className="l"><span className="id">#K92LX</span></span><span><span className="bdg b-ember">Preparing</span></span></div>
            </div></div>
            <div className="body"><div className="n">03 · Back office</div><h3>Back office</h3><p>Everything you run after close: menu, tables, billing, inventory, analytics.</p><span className="lnk">Go behind the pass →</span></div>
          </Link>
        </div>
      </div></section>

      {/* QUOTE */}
      <section className="quote"><div className="wrap"><p>One room or fifty, the whole service runs from a single <em>system.</em></p></div></section>

      {/* CLOSE */}
      <section className="close">
        <img alt="" src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <div className="veil"></div>
        <div className="wrap inner">
          <span className="kick on-dark">The whole platform, on your tables</span>
          <h2>See it on your <em>floor.</em></h2>
          <div className="cta"><Link className="btn btn-cream" to="/demo">Book a demo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg></Link><Link className="btn btn-line" to="/pricing">View pricing</Link></div>
        </div>
      </section>
    </>
  );
}
