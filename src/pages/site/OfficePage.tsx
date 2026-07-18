import { Link } from 'react-router-dom';

/**
 * Public marketing page: Back office (features-office). Renders only the
 * `<main>` content; the shared nav + footer come from MarketingLayout.
 */
export function OfficePage() {
  return (
    <>
      {/* HERO */}
      <section className="phero"><div className="wrap">
        <span className="kick">Everything after the pass</span>
        <h1>The house, <em>managed</em></h1>
        <p className="lede">Menu, tables, bookings, billing, stock and the numbers, in one console built for the hours an owner actually spends in it. Density without noise, and a clear read on what needs you now.</p>
        <div className="cta">
          <Link className="btn btn-ember" to="/demo">Book a demo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link>
          <Link className="btn btn-out" to="/pricing">View pricing</Link>
        </div>
      </div></section>

      {/* ROW · ADMIN CONSOLE */}
      <section className="sec"><div className="wrap">
        <div className="feature-row">
          <div className="fr-copy">
            <span className="kick">One console</span>
            <h3>The whole business, one <em>view.</em></h3>
            <p>Orders, menu, tables, reservations, billing, inventory and staff, with analytics on top. The overview surfaces what needs you first, then lets you go deep on any one of them.</p>
            <div className="mini"><span>13 admin screens</span><span>Live overview</span><span>What needs you now</span></div>
          </div>
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
        </div>
      </div></section>

      {/* GROUPED SUB-SECTIONS */}
      <section className="sec strip"><div className="wrap">
        <div className="sec-head"><span className="kick">What's inside</span><h2>Everything the house needs, <em>grouped.</em></h2></div>
        <div className="included">
          <div>
            <div className="gh">The menu &amp; the room</div>
            <div className="feat"><h4>Menu &amp; categories</h4><p>Build the menu, group it, price it, tag it, and take items off in a tap.</p></div>
            <div className="feat"><h4>Tables &amp; QR</h4><p>Lay out the room, generate a QR per table, and print the codes.</p></div>
            <div className="feat"><h4>Reservations</h4><p>Manage bookings by table and time, alongside the service they belong to.</p></div>
          </div>
          <div>
            <div className="gh">Money &amp; stock</div>
            <div className="feat"><h4>Orders</h4><p>Every order across the floor in one live view, current and past.</p></div>
            <div className="feat"><h4>Billing &amp; invoices</h4><p>Tax and service charge applied, the check exported as a PDF, invoice numbers kept in sequence per year.</p></div>
            <div className="feat"><h4>Inventory</h4><p>Track what you hold and get a low-stock alert before it runs out mid-service.</p></div>
          </div>
          <div>
            <div className="gh">People &amp; the numbers</div>
            <div className="feat"><h4>Analytics</h4><p>Revenue, peak hours and top dishes, drawn from the day's real orders.</p></div>
            <div className="feat"><h4>Staff &amp; roles</h4><p>Owner, manager, waiter, kitchen, each role landing on its own board.</p></div>
            <div className="feat"><h4>Multi-restaurant</h4><p>Run several houses and their branches from one login, each one's data kept to itself.</p></div>
          </div>
        </div>
      </div></section>

      {/* BENEFITS */}
      <section className="sec"><div className="wrap">
        <div className="sec-head"><span className="kick">Why owners run it here</span><h2>Density without the <em>noise.</em></h2></div>
        <div className="benefits" style={{ marginTop: '2rem', border: '1px solid var(--hairline)', borderRadius: '.9rem', overflow: 'hidden' }}>
          <div className="benefit"><span className="bn">i.</span><h4>What needs you, first</h4><p>The console surfaces the order, the low stock, the waiting table, before the noise.</p></div>
          <div className="benefit"><span className="bn">ii.</span><h4>One login, many houses</h4><p>Switch between restaurants and branches without a second account.</p></div>
          <div className="benefit"><span className="bn">iii.</span><h4>Kept to itself</h4><p>Each restaurant's data stays its own, so a group's houses never see each other's floor.</p></div>
        </div>
      </div></section>

      {/* CLOSE */}
      <section className="close">
        <img alt="" src="https://images.unsplash.com/photo-1552566626-52f8b828add9?w=1200&q=70&auto=format&fit=crop" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }} />
        <div className="veil"></div>
        <div className="wrap inner">
          <span className="kick on-dark">Go behind the pass</span>
          <h2>Take a look <em>behind</em></h2>
          <div className="cta"><Link className="btn btn-cream" to="/demo">Book a demo <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></Link><Link className="btn btn-line" to="/pricing">View pricing</Link></div>
        </div>
      </section>
    </>
  );
}
