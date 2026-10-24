function exportCSV() {
  const visible = S.apps.filter(vis);
  if (!visible.length) { alert('No visible applications to export.'); return; }
  const headers = ['Company','Role','Country','City','Stage','Date Applied','Deadline','Salary','Currency','Category','Resume','Cover Letter','Custom Tags','Portal URL','Portal User','Recruiter Name','Recruiter Email','Recruiter Notes'];
  const escCSV = val => `"${String(val ?? '').replace(/"/g, '""')}"`;
  const rows = visible.map(a => [
    a.company,
    a.role,
    cname(a.country) || a.country,
    a.city,
    a.stage,
    a.date_applied,
    a.deadline,
    a.salary,
    a.currency,
    a.category || 'Industry',
    a.resume_path || '', a.cover_letter_path || '',
    (getAppTags(a).map(t => t.name).join('; ')),
    a.portal_url || '',
    a.portal_user || '',
    a.recruiter_name || '',
    a.recruiter_email || '',
    a.recruiter_notes || ''
  ].map(escCSV).join(','));

  const csvContent = '\uFEFF' + [headers.map(escCSV).join(','), ...rows].join('\r\n');
  const secName = currentSec.toLowerCase();
  const defaultFilename = `applications_${secName}_${today()}.csv`;

  if (typeof desktopInvoke === 'function' && typeof isDesktopApp === 'function' && isDesktopApp()) {
    desktopInvoke('export_csv', { content: csvContent, defaultFilename })
      .then(savedPath => {
        if (savedPath) {
          toast(`Exported CSV successfully to: ${savedPath}`);
        }
      })
      .catch(err => {
        console.error('Desktop CSV export error:', err);
        fallbackDownload();
      });
    return;
  }

  function fallbackDownload() {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = defaultFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
  fallbackDownload();
}
if ($('#expBtn')) $('#expBtn').onclick = exportCSV;
if ($('#backupZipBtn')) $('#backupZipBtn').onclick = () => {
  toast('Preparing full ZIP archive (Database + Documents)...');
  window.location.href = (typeof getApiBaseUrl === 'function' ? getApiBaseUrl() : '') + '/api/backup/export';
};


