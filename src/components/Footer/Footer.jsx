import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">

      <div className="site-footer__brand-col">
        <div className="site-footer__brand">
          <img src="/logo.jpg" alt="" className="site-footer__brand-logo" />
          Scladapp
        </div>
        <p className="site-footer__tagline">The all-in-one school management platform built for modern education.</p>
        <a className="site-footer__whatsapp" href="https://wa.me/2347082189833" target="_blank" rel="noreferrer">
          WhatsApp +234 708 218 9833
        </a>
      </div>

      <div className="site-footer__col">
        <h4>Product</h4>
        <Link to="/pricing">Pricing</Link>
        <Link to="/docs">Documentation</Link>
      </div>

      <div className="site-footer__col">
        <h4>Support</h4>
        <Link to="/contact">Contact Us</Link>
        <a href="mailto:support@scladapp.com">support@scladapp.com</a>
      </div>

      <div className="site-footer__col">
        <h4>Legal</h4>
        <Link to="/terms">Terms of Service</Link>
        <Link to="/privacy">Privacy Policy</Link>
      </div>

    </div>

    <div className="site-footer__bottom">
      <div className="site-footer__bottom-inner">
        <span>© {new Date().getFullYear()} Scladapp Technologies. All rights reserved.</span>
        <div className="site-footer__bottom-links">
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;
