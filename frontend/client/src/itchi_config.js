import { SystemType } from "Util/SystemType.js";
import { core_config_version } from "itchi_core_config.js";

const config = {
  targetFlags: [
    SystemType.Default,
    SystemType.Custom,
    // SystemType.ERP //No need to use preload if not ERP (e.g. school project)
  ],
  app_name: "Solearna",
  version: core_config_version,
  language: "zh_Hant",
  // language: "en",
  serverBaseUrl: "http://localhost:5001/solearna/us-central1/app/"
};
export default config;
