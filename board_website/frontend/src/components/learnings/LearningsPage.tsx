import React from 'react';
import { useApp } from '../../context/AppContext';
import { LearningsBoard } from './LearningsBoard';
import { CalendarView } from '../calendar/CalendarView';

export const LearningsPage: React.FC = () => {
  const { activeLearningCategory } = useApp();

  const isCalendar = activeLearningCategory === 'Calendar';

  return isCalendar ? <CalendarView /> : <LearningsBoard />;
};
