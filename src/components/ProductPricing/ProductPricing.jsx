import { useState, useEffect } from "react";
import { getPriceDetails } from "./getPriceDetails";
import "./ProductPricing.css";
import { useNavigate } from "react-router-dom";
import Button from "../Button/Button";
import useSubscription from "../../api_call/useSubscription";
import PublicHeader from "../PublicHeader/PublicHeader";

const ProductPricing = () => {
  const [priceView, setPriceView] = useState("monthly");
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();
  const { getPlans } = useSubscription();

  useEffect(() => {
    getPlans().then((res) => { if (res.success) setPlans(res.data); });
  }, []);

  const handleContinue = (plan) => {
    navigate("/setup/1", { state: { plan, priceView } });
  };

  return (
    <div className="pricing-wrapper">
      <PublicHeader />
      <Button onClick={() => navigate("login")}>Login</Button>
      <h2 className="pricing-title">
        Transparent pricing, with top tier design partner
      </h2>

      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <label style={{ marginRight: "0.5rem", fontWeight: "bold" }}>
          View Prices By:
        </label>
        <select
          value={priceView}
          onChange={(e) => setPriceView(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc", fontSize: "1rem" }}
        >
          <option value="monthly">Monthly</option>
          <option value="quarterly">Quarterly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      <div className="pricing-cards">
        {plans.map((plan, index) => (
          <div key={index} className={`pricing-card ${plan.featured ? "featured" : ""}`}>
            <span className="plan-type">{plan.plan_type}</span>
            <h3 className="plan-name">{plan.plan_name}</h3>
            <p className="plan-description">{plan.description}</p>
            <div style={{ marginTop: "1rem" }}>
              {getPriceDetails(plan, priceView)}
            </div>
            <button className="plan-button" onClick={() => handleContinue(plan)}>
              {plan.plan_type === "Free" ? "Get Started" : "Choose Plan"}
            </button>
            <ul className="plan-features">
              <li>Unlimited students</li>
              <li>Unlimited staff</li>
              <li>Up to {plan.max_subadmin} sub-admins</li>
              {plan.features?.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductPricing;
