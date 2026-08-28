import { useAuth } from "../../context/AuthContext/AuthContext";

/**
 * SubscriptionGuard — previously full-page blocked expired schools.
 * Now allows viewing all pages; mutation locks + banner handle expired state.
 * Kept as a pass-through so existing route wrappers keep working.
 */
const SubscriptionGuard = ({ children }) => {
  useAuth(); // keep hook usage stable if auth side-effects are expected
  return children;
};

export default SubscriptionGuard;
