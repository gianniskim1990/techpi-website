/**
 * English is the source of the dictionary shape. Greek (el.ts) must satisfy the same type,
 * so a missing or extra key is a type error found by `npm run check`.
 *
 * Phase 3A: shell labels only. Page copy arrives with the pages (3B, 3C, 3D).
 */
export const en = {
  site: {
    name: 'TECHPI',
    descriptor: 'Digital Products & Technology',
  },
  skipLink: 'Skip to content',
  nav: {
    label: 'Primary',
    work: 'Work',
    capabilities: 'Capabilities',
    euProjects: 'EU Projects',
    about: 'About',
    contact: 'Contact',
    menu: 'Menu',
    close: 'Close',
  },
  footer: {
    label: 'Footer',
    note: 'TechPi — the evolution of pigiota314.',
    /** The accessible name of the footer's legal links. */
    legalLabel: 'Legal',
  },
  language: {
    label: 'Language',
    en: { short: 'EN', name: 'English' },
    el: { short: 'ΕΛ', name: 'Ελληνικά' },
    /** Said, in this language, when a page has no version in it and the switch offers a fallback instead. */
    notTranslated: 'This page is not available in English',
  },
  /** The short name of each page (accessible names, breadcrumbs). Titles and descriptions: src/content/seo.ts. */
  pages: {
    home: { heading: 'Home' },
    work: { heading: 'Work' },
    capabilities: { heading: 'Capabilities' },
    euProjects: { heading: 'EU Projects' },
    about: { heading: 'About' },
    contact: { heading: 'Contact' },
    privacy: { heading: 'Privacy Policy' },
    cookies: { heading: 'Cookies Policy' },
  },
  notFound: {
    title: 'Page not found | TechPi',
    heading: 'Page not found',
    text: 'The page you are looking for does not exist.',
    home: 'Back to the homepage',
  },
  /** The contact form (src/components/secondary/ContactForm.astro). {email} is replaced with the contact address. */
  contactForm: {
    heading: 'Send a message',
    name: 'Name',
    email: 'Email',
    organisation: 'Organisation',
    optional: 'optional',
    message: 'Your project or question',
    messageHint: 'What you need to solve, and anything we should know.',
    timeframe: 'Timeframe',
    timeframes: {
      '': 'Not decided',
      asap: 'As soon as possible',
      '1-3-months': 'In 1–3 months',
      '3-6-months': 'In 3–6 months',
      later: 'Later',
    },
    submit: 'Send message',
    sending: 'Sending…',
    privacy: 'We use your details only to reply to you.',
    privacyLink: 'Privacy Policy',
    successHeading: 'Thank you. Your message has been sent.',
    successText: 'We will reply to you by email.',
    errors: {
      name: 'Please enter your name.',
      email: 'Please enter a valid email address.',
      organisation: 'Please shorten the organisation name.',
      message: 'Please describe your project or question in at least 10 characters.',
      timeframe: 'Please choose a timeframe from the list.',
      invalid: 'Please check the highlighted fields.',
      verification: 'We could not confirm that this message was sent by a person. Please try again.',
      rateLimited: 'Too many messages in a short time. Please wait a minute and try again.',
      unavailable: 'The form is not available right now. Please email us at {email}.',
      failed: 'Your message could not be sent. Please try again, or email us at {email}.',
    },
    noscript: 'The form needs JavaScript. You can email us at {email} or call us.',
  },
};

export type Dictionary = typeof en;
