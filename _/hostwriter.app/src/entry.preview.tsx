import { createQwikCity } from '@builder.io/qwik-city/middleware/node'
import qwikCityPlan from '@qwik-city-plan'
// make sure qwikCityPlan is imported before entry
import render from './entry.ssr'

/**
 * The default export is the QwikCity adapter used by Vite preview.
 */
export default createQwikCity({ render, qwikCityPlan })
