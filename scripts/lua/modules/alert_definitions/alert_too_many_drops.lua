--
-- (C) 2019-21 - ntop.org
--

-- ##############################################

local alert_keys = require "alert_keys"
package.path = dirs.installdir .. "/scripts/lua/modules/?.lua;" .. package.path

-- Import the classes library.
local classes = require "classes"
-- Make sure to import the Superclass!
local alert = require "alert"

-- ##############################################

local alert_too_many_drops = classes.class(alert)

-- ##############################################

alert_too_many_drops.meta = {
  alert_key = alert_keys.ntopng.alert_too_many_drops,
  i18n_title = "alerts_dashboard.too_many_drops",
  icon = "fas fa-tint",
}

-- ##############################################

-- @brief Prepare an alert table used to generate the alert
-- @param drops The number of dropped packets
-- @param drop_perc The percentage of dropped packets with reference to the total number of packets (recevied + dropped)
-- @param threshold A number indicating the threshold compared with `drop_perc`
-- @return A table with the alert built
function alert_too_many_drops:init(drops, drop_perc, threshold)
   -- Call the parent constructor
   self.super:init()

   self.alert_type_params = {
    drops = drops, 
    drop_perc = drop_perc, 
    edge = threshold,
   }
end

-- #######################################################

-- @brief Format an alert into a human-readable string
-- @param ifid The integer interface id of the generated alert
-- @param alert The alert description table, including alert data such as the generating entity, timestamp, granularity, type
-- @param alert_type_params Table `alert_type_params` as built in the `:init` method
-- @return A human-readable string
function alert_too_many_drops.format(ifid, alert, alert_type_params)
  local alert_consts = require("alert_consts")
  local entity = alert_consts.formatAlertEntity(ifid, alert_consts.alertEntityRaw(alert["alert_entity"]), alert["alert_entity_val"])
  local max_drop_perc = alert_type_params.threshold or 0

  return(i18n("alert_messages.too_many_drops", {iface = entity, max_drops = max_drop_perc}))
end

-- #######################################################

return alert_too_many_drops
