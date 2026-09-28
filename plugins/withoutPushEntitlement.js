// Level90 only uses local notifications (reminders, rest timer), never remote push.
// expo-notifications adds the `aps-environment` entitlement, which free Apple IDs
// cannot sign — removing it lets the app be sideloaded (e.g. with Sideloadly).
const { withEntitlementsPlist } = require('expo/config-plugins');

module.exports = function withoutPushEntitlement(config) {
  return withEntitlementsPlist(config, (cfg) => {
    delete cfg.modResults['aps-environment'];
    return cfg;
  });
};
