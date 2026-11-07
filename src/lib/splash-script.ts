// The inline head script that decides, before first paint, whether this visit gets the splash (see components/Splash.tsx).
// Everyday look only (the layout leaves it out of the festive page), once per browser session, never for reduced motion, "Stop animations",
// crawlers, or the shopping and account pages. Slow phones (data-fx="lite") get a 300ms fade instead.
// It only sets <html data-splash>; CSS paints the cover, the island draws the rest, and this script removes the flag after 3s if the island never came.
export const splashScript = String.raw`try{if(d.dataset.season!=="festive"&&!sessionStorage.getItem("sm-splash")&&d.dataset.motion!=="off"&&!matchMedia("(prefers-reduced-motion:reduce)").matches&&!/bot|crawl|spider|slurp|lighthouse|pagespeed|prerender/i.test(navigator.userAgent)&&!/^\/(mr|hi)?\/?(cart|checkout|order|track|account|login|review|certificate|verify|learn|newsletter)(\/|$)/.test(location.pathname)){sessionStorage.setItem("sm-splash","1");if(d.dataset.fx==="lite"){d.dataset.splash="fade";setTimeout(function(){delete d.dataset.splash},450)}else{d.dataset.splash="";setTimeout(function(){d.dataset.splash===""&&delete d.dataset.splash},3000)}}}catch(e){}`

// ponytail: the pattern above mirrors src/lib/festive.ts's inline script; a unit test checks it still parses and does what it says.
