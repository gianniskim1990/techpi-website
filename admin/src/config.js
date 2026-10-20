import { createConfig } from './config-core.js';

/** The CMS configuration for this build: Vite mode and content branch come from the environment (see config-core.js). */
export const config = createConfig({ mode: import.meta.env.MODE, branch: import.meta.env.VITE_CMS_BRANCH });
