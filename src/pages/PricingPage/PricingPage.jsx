import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import PublicHeader from "../../components/PublicHeader/PublicHeader";
import Footer from "../../components/Footer/Footer";
import { getPriceDetails } from "../../components/ProductPricing/getPriceDetails";
import useSubscription from "../../api_call/useSubscription";
import "./PricingPage.css";

const SKELETON_COUNT = 3;

const PricingPage = () => {
  const [priceView, setPriceView] = useState("monthly");
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [headerDark, setHeaderDark] = useState(true);
  const cardsSectionRef = useRef(null);
  const heroRef = useRef(null);
  const navigate = useNavigate();
  const { getPlans } = useSubscription();

  useEffect(() => {
    getPlans().then((res) => {
      if (res.success) setPlans(res.data);
      setLoading(false);
    });
  }, []);

  // Switch header to light once the hero bottom scrolls above the header
  useEffect(() => {
    const onScroll = () => {
      const el = heroRef.current;
      if (!el) return;
      setHeaderDark(el.getBoundingClientRect().bottom > 64);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="pricing-pg">
      <PublicHeader dark={headerDark} />

      <div className="pricing-pg__hero" ref={heroRef}>
        <span className="pricing-pg__hero-corner-tr" />
        <span className="pricing-pg__hero-corner-bl" />
        <span className="pricing-pg__tag">Simple Pricing</span>
        <h1>Plans that grow with your school</h1>
        <p>No hidden fees. Cancel anytime.</p>

        <div className="pricing-pg__toggle">
          {["monthly", "quarterly", "yearly"].map((v) => (
            <button
              key={v}
              className={`pricing-pg__toggle-btn${priceView === v ? " active" : ""}`}
              onClick={() => setPriceView(v)}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
              {v === "quarterly" && <span className="pricing-pg__toggle-badge">-10%</span>}
              {v === "yearly" && <span className="pricing-pg__toggle-badge">-20%</span>}
            </button>
          ))}
        </div>
      </div>

      <div className="pricing-pg__cards-section" ref={cardsSectionRef}>
        <span className="pricing-pg__cards-corner-tr" />
        <span className="pricing-pg__cards-corner-bl" />
        <div className="pricing-pg__cards">
          {loading
            ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
                <div key={i} className={`pricing-pg__card pricing-pg__card--skeleton${i === 1 ? " featured" : ""}`}>
                  <span className="pricing-pg__card-corner-tr" />
                  <span className="pricing-pg__card-corner-bl" />
                  <div className="pricing-pg__skeleton-header">
                    <div className="pricing-pg__skeleton-line pricing-pg__skeleton-line--sm" />
                    <div className="pricing-pg__skeleton-line pricing-pg__skeleton-line--xs" />
                  </div>
                  <div className="pricing-pg__skeleton-price" />
                  <div className="pricing-pg__skeleton-features">
                    {Array.from({ length: 4 }).map((_, j) => (
                      <div key={j} className="pricing-pg__skeleton-line" />
                    ))}
                  </div>
                  <div className="pricing-pg__skeleton-btn" />
                </div>
              ))
            : plans.map((plan, i) => (
          <div key={i} className={`pricing-pg__card${plan.featured ? " featured" : ""}`}>
            {/* corner accents */}
            <span className="pricing-pg__card-corner-tr" />
            <span className="pricing-pg__card-corner-bl" />
            {/* ghost deco */}
            <span className="pricing-pg__card-deco-circle" />
            <span className="pricing-pg__card-deco-box" />

            {plan.featured && <span className="pricing-pg__badge">Most Popular</span>}

            <div className="pricing-pg__card-header">
              <h3>{plan.plan_name}</h3>
              <p className="pricing-pg__desc">{plan.description}</p>
            </div>

            <div className="pricing-pg__price">
              {plan.plan_type === "Free"
                ? <div className="pricing-pg__price-free">Free</div>
                : getPriceDetails(plan, priceView, plan.featured)
              }
            </div>

            <ul className="pricing-pg__features">
              <li>Unlimited students</li>
              <li>Unlimited staff</li>
              <li>Up to {plan.max_subadmin} sub-admins</li>
              {plan.features?.map((f, j) => <li key={j}>{f}</li>)}
            </ul>

            <button
              className="pricing-pg__cta"
              onClick={() => navigate("/setup/1", { state: { plan, priceView } })}
            >
              {plan.plan_type === "Free" ? "Get Started Free" : "Choose Plan"}
            </button>
          </div>
        ))}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PricingPage;
