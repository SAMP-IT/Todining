import { Link, NavLink, Outlet } from 'react-router-dom';
import '@/styles/marketing.css';

/**
 * Shell for the public marketing website (Home, Features, the three product
 * pages, Pricing, Book a demo). Renders the shared nav + footer once; each page
 * renders only its own `<main>` content through the Outlet.
 *
 * Everything is wrapped in `.td-site` so the marketing stylesheet's element
 * resets stay scoped and never touch the app's own screens (which share the
 * bundle). This is the public front door: the app itself lives at /login, the
 * QR flow, /admin, /kitchen and /waiter, all untouched.
 */
function navClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'on' : undefined;
}

export function MarketingLayout() {
  return (
    <div className="td-site">
      <div className="grain" />

      <nav className="nav">
        <div className="wrap row">
          <Link className="brand" to="/">
            <span className="seal">T</span>
            <b>ToDining</b>
          </Link>
          <div className="nav-links">
            <NavLink to="/features" className={navClass}>Features</NavLink>
            <NavLink to="/pricing" className={navClass}>Pricing</NavLink>
            <NavLink to="/demo" className={navClass}>Book a demo</NavLink>
          </div>
          <div className="nav-cta">
            <Link className="signin" to="/login">Sign in</Link>
            <Link className="btn btn-ember btn-sm" to="/demo">Book a demo</Link>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="site-foot">
        <div className="wrap">
          <div className="top">
            <div className="about">
              <div className="brand"><span className="seal">T</span><b>ToDining</b></div>
              <p>The whole dining room, from one table. Hospitality, not software.</p>
            </div>
            <div className="col">
              <h5>Product</h5>
              <Link to="/features">Features</Link>
              <Link to="/features/guest">Guest ordering</Link>
              <Link to="/features/kitchen">Kitchen &amp; service</Link>
              <Link to="/features/office">Back office</Link>
            </div>
            <div className="col">
              <h5>Company</h5>
              <Link to="/pricing">Pricing</Link>
              <Link to="/demo">Book a demo</Link>
              <Link to="/login">Sign in</Link>
            </div>
            <div className="col">
              <h5>The visit</h5>
              <Link to="/features/guest">Scan</Link>
              <Link to="/features/guest">Order</Link>
              <Link to="/features/guest">Dine</Link>
            </div>
          </div>
          <div className="base">
            <span>ToDining · hospitality, not software.</span>
            <span>© {new Date().getFullYear()}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
