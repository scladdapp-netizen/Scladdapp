export const getPriceDetails = (plan, priceView, dark = false) => {
  if (plan.type === "free") return "Free forever";

  let price = 0;
  let months = 1;
  let description = "";

  switch (priceView) {
    case "monthly":
      price = plan.monthly_price;
      months = 1;
      description = "Billed every month";
      break;
    case "quarterly":
      price = plan.quataly_price;
      months = 3;
      description = "Billed every 3 months";
      break;
    case "yearly":
      price = plan.yearly_price;
      months = 12;
      description = "Billed annually";
      break;
    default:
      price = plan.monthly_price;
      months = 1;
      description = "Billed every month";
  }

  const perMonth = price;
  const totprice = price * months;

  return (
    <>
      <div className="mkml-price-amount" style={{ color: dark ? "#fff" : "#111" }}>
        ₦{perMonth.toLocaleString()}
        <span className="mkml-price-period" style={{ color: dark ? "rgba(255,255,255,0.4)" : "#aaa" }}>/month</span>
      </div>
      <div className="mkml-price-total" style={{ color: dark ? "rgba(255,255,255,0.4)" : "#888" }}>
        {months} month{months > 1 ? "s" : ""} = ₦{totprice.toLocaleString()}
      </div>
      <p className="mkml-price-desc" style={{ color: dark ? "rgba(255,255,255,0.3)" : "#aaa" }}>
        {description}
      </p>
    </>
  );
};
