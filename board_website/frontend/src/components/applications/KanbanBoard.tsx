import React from 'react';
import { useApp } from '../../context/AppContext';
import { STAGES } from '../../utils/constants';
import { KanbanColumn } from './KanbanColumn';

export const KanbanBoard: React.FC = () => {
  const {
    applications,
    activeAppCategory,
    activeCountry,
    activeMobileStage,
    searchQuery,
  } = useApp();

  // Filter application pipeline
  const filteredApps = applications.filter(app => {
    // 1. Category Filter
    if (activeAppCategory !== 'All' && activeAppCategory !== 'Calendar') {
      const cat = app.category || 'Industry';
      if (cat !== activeAppCategory) return false;
    }

    // 2. Country Filter
    if (activeCountry) {
      if ((app.country || '').toUpperCase() !== activeCountry.toUpperCase()) return false;
    }

    // 3. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCo = (app.company || '').toLowerCase().includes(q);
      const matchRole = (app.role || '').toLowerCase().includes(q);
      const matchNotes = (app.recruiter_notes || '').toLowerCase().includes(q);
      const matchTags = (app.custom_tags || '').toLowerCase().includes(q);
      const matchCity = (app.city || '').toLowerCase().includes(q);
      if (!matchCo && !matchRole && !matchNotes && !matchTags && !matchCity) {
        return false;
      }
    }

    return true;
  });

  return (
    <main
      id="board"
      className="flex-1 w-full h-full min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-stretch overflow-hidden"
      data-active-stage={activeMobileStage}
    >
      {STAGES.map(stage => {
        const stageApps = filteredApps.filter(a => a.stage === stage);
        return (
          <KanbanColumn
            key={stage}
            stage={stage}
            applications={stageApps}
          />
        );
      })}
    </main>
  );
};
