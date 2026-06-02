import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PublicHeader from "../../components/PublicHeader/PublicHeader";
import Footer from "../../components/Footer/Footer";
import { getPriceDetails } from "../../components/ProductPricing/getPriceDetails";
import useSubscription from "../../api_call/useSubscription";
import "./PricingPage.css";

const PricingPage = () => {
  const [priceView, setPriceView] = useState("monthly");
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();
  const { getPlans } = useSubscription();

  useEffect(() => {
    getPlans().then((res) => { if (res.success) setPlans(res.data); });
  }, []);

  return (
    <div className="pricing-pg">
      <PublicHeader dark />

      <div className="pricing-pg__hero">
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

      <div className="pricing-pg__cards-section">
        <span className="pricing-pg__cards-corner-tr" />
        <span className="pricing-pg__cards-corner-bl" />
        <div className="pricing-pg__cards">
          {plans.map((plan, i) => (
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
              <li>Up to {plan.max_students} students</li>
              <li>Up to {plan.max_staff} staff</li>
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
