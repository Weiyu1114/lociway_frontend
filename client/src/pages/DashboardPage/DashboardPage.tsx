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
      {/* Full-width header with negative margins to break out of content padding */}
      <div className="w-full -mx-4 md:-mx-10 lg:-mx-16">
        <HeaderSection />
      </div>

      {/* Constrained content area */}
      <div className="max-w-7xl mx-auto px-4 md:px-10 lg:px-16 pt-5 pb-8 space-y-7">
        <KpiCardsSection />
        <PhaseFocusSection />
        <BusinessLinesSection />
        <OpportunitiesSection />
        <MeetingSummariesSection />
        <TasksSection />
        <FooterSection />
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
