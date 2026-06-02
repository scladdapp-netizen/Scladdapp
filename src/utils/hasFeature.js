/**
 * Check if the user's active subscription plan includes a specific feature.
 * @param {object} user - The user object from AuthContext
 * @param {string} feature - The feature string to check (must match plans.json exactly)
 * @returns {boolean}
 */
const hasFeature = (user, feature) => {
  const features = user?.subscription?.plan_features;
  if (!Array.isArray(features)) return false;
  return features.includes(feature);
};

export default hasFeature;
