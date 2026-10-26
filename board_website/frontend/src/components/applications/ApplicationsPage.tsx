import React from 'react';
import { useApp } from '../../context/AppContext';
import { KanbanBoard } from './KanbanBoard';
import { CalendarView } from '../calendar/CalendarView';

export const ApplicationsPage: React.FC = () => {
  const { activeAppCategory, activeMobileStage } = useApp();

  const isCalendar = activeAppCategory === 'Calendar' || activeMobileStage === 'Calendar';

  return isCalendar ? <CalendarView /> : <KanbanBoard />;
};
