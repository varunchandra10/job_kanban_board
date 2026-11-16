/**
 * Job Tracker - 1-Click Universal Job Clipper Bookmarklet
 * Extracts job posting metadata (Schema.org / OpenGraph / DOM / Selection)
 * and opens the streamlined top-right clipper popup window on Job Tracker.
 */
(function () {
  var origin = window._JT_ORIGIN || 'https://kanban-board-job.vercel.app';
  var role = '', company = '', location = '', salary = '', notes = '', currency = 'USD';

  try {
    notes = window.getSelection().toString().trim();
  } catch (_) {}

  // Tier 1: Schema.org (JSON-LD)
  try {
    var scripts = document.querySelectorAll('script[type="application/ld+json"]');
    for (var i = 0; i < scripts.length; i++) {
      var raw = scripts[i].textContent || '{}';
      var d = JSON.parse(raw);
      if (Array.isArray(d)) d = d.find(function (x) { return x && x['@type'] === 'JobPosting'; }) || d[0];
      if (d && d['@graph']) d = d['@graph'].find(function (x) { return x && x['@type'] === 'JobPosting'; }) || d;
      if (d && (d['@type'] === 'JobPosting' || d.title || d.hiringOrganization)) {
        role = d.title || d.name || '';
        company = (d.hiringOrganization && (d.hiringOrganization.name || d.hiringOrganization.legalName || d.hiringOrganization)) || '';
        if (d.jobLocationType === 'TELECOMMUTE') {
          location = 'Remote';
        } else if (d.jobLocation && d.jobLocation.address) {
          var a = d.jobLocation.address;
          location = [a.addressLocality, a.addressRegion, a.addressCountry].filter(Boolean).join(', ');
        }
        if (d.baseSalary && d.baseSalary.value) {
          var bs = d.baseSalary;
          salary = (bs.currency || '') + ' ' + (bs.value.value || (bs.value.minValue ? bs.value.minValue + '-' + bs.value.maxValue : bs.value));
        }
        break;
      }
    }
  } catch (_) {}

  // Tier 2: OpenGraph / Twitter Meta Tags & Title
  if (!role || !company) {
    var ogTitle = (document.querySelector('meta[property="og:title"]') || {}).content || '';
    var twTitle = (document.querySelector('meta[name="twitter:title"]') || {}).content || '';
    var siteName = (document.querySelector('meta[property="og:site_name"]') || {}).content || '';
    var t = ogTitle || twTitle || document.title || '';
    var am = t.match(/^(.+?)\s+(?:at|@)\s+([^-|–—·]+)/i);
    var dm = t.match(/^([^-|–—·]+)\s*[-|–—·]\s*(.+)$/);
    if (am) {
      if (!role) role = am[1].trim();
      if (!company) company = am[2].trim();
    } else if (dm) {
      if (!company) company = dm[1].trim();
      if (!role) role = dm[2].trim();
    }
    if (!company && siteName) company = siteName.trim();
  }

  // Tier 3: DOM Fallback
  if (!role) {
    var h1 = document.querySelector('h1');
    if (h1) role = h1.textContent.trim().replace(/\s+/g, ' ');
  }
  if (!company) {
    var hostName = window.location.hostname.replace(/^www\./, '').split('.')[0];
    company = hostName.charAt(0).toUpperCase() + hostName.slice(1);
  }

  // Sanitize strings
  role = (role || 'Software Engineer').slice(0, 150);
  company = (company || 'Company').slice(0, 100);
  location = (location || '').slice(0, 100);
  salary = (salary || '').slice(0, 50);
  notes = (notes || '').slice(0, 1000);

  var q = '?company=' + encodeURIComponent(company) +
    '&role=' + encodeURIComponent(role) +
    '&location=' + encodeURIComponent(location) +
    '&salary=' + encodeURIComponent(salary) +
    '&url=' + encodeURIComponent(window.location.href) +
    '&notes=' + encodeURIComponent(notes);

  var w = 460, h = 760;
  var x = Math.max(0, (window.screen.availWidth || window.screen.width) - w - 24);
  window.open(origin + '/clipper' + q, 'jt_clipper', 'toolbar=no,location=no,status=no,menubar=no,scrollbars=yes,resizable=yes,width=' + w + ',height=' + h + ',top=24,left=' + x);
})();
