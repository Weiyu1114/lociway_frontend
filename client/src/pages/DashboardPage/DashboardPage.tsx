import { useEffect } from 'react';
import { DashboardProvider, useDashboard } from './context';
import HeaderSection from './HeaderSection';
import KpiCardsSection from './KpiCardsSection';
import PhaseFocusSection from './PhaseFocusSection';
import BusinessLinesSection from './BusinessLinesSection';
import OpportunitiesSection from './OpportunitiesSection';
import MeetingSummariesSection from './MeetingSummariesSection';
import TasksSection from './TasksSection';
import FooterSection from './FooterSection';

function DashboardContent() {
  const { refresh } = useDashboard();

  useEffect(() => {
    const intervalId = setInterval(() => {
      refresh();
    }, 5 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, [refresh]);

  return (
    <div className="w-full min-h-full bg-background">
      {/* Full-width header */}
      <div className="w-full">
        <HeaderSection />
      </div>

      {/* Full-width content area */}
      <div className="w-full px-5 md:px-8 lg:px-10 pt-6 pb-8 space-y-7">
        <KpiCardsSection />
        <PhaseFocusSection />
        <BusinessLinesSection />
        <OpportunitiesSection />
        <TasksSection />
        <FooterSection />
        <MeetingSummariesSection />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <DashboardProvider>
      <DashboardContent />
    </DashboardProvider>
  );
}
