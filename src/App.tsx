import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import TourOptimization from './pages/TourOptimization';
import CreateProject from './pages/CreateProject';
import Wizard from './components/wizards/Wizard'; // <-- ADD THIS IMPORT

// We will add a 'wizard' view, but for now, the AppView type doesn't need to change
// as the logic will be handled by a different state variable.
export type AppView = 'dashboard' | 'tour-optimization' | 'help' | 'create-project';

function App() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState<AppView>('tour-optimization');
  const [currentView, setCurrentView] = useState<AppView>('tour-optimization');
  
  // --- STATE FOR RESUMING A PROJECT ---
  const [resumingProject, setResumingProject] = useState<{ id: string; name: string } | null>(null);

  const handleSidebarToggle = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleMenuItemClick = (item: string) => {
    const view = item as AppView;
    setActiveItem(view);
    setCurrentView(view);
    setResumingProject(null); // Clear any resumed project when navigating via sidebar
  };

  const handleCreateProject = () => {
    setCurrentView('create-project');
    setResumingProject(null); // Ensure we're not resuming
  };
  
  // --- NEW HANDLER FOR RESUME ---
  const handleResumeProject = (project: { id: string; name: string }) => {
    setResumingProject(project);
    // We don't change the `currentView` here; the render logic will handle it.
  };

  const handleBackToTourOptimization = () => {
    setCurrentView('tour-optimization');
    setActiveItem('tour-optimization');
    setResumingProject(null); // Clear resumed project on exit
  };

  const renderContent = () => {
    // --- NEW LOGIC: Prioritize resuming a project ---
    if (resumingProject) {
      return (
        <Wizard
          projectId={resumingProject.id}
          projectName={resumingProject.name}
          dataSource="existing" // Or whatever makes sense; it will be loaded from the backend
          onExit={handleBackToTourOptimization}
        />
      );
    }

    switch (currentView) {
      case 'tour-optimization':
        // Pass the new handler to the TourOptimization page
        return <TourOptimization onCreateProject={handleCreateProject} onResumeProject={handleResumeProject} />;
      case 'create-project':
        return <CreateProject onBack={handleBackToTourOptimization} />;
      case 'dashboard':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <p className="text-gray-600">Dashboard content will be displayed here.</p>
            </div>
          </div>
        );
      case 'help':
        return (
          <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
              <p className="text-gray-600">Help documentation will be displayed here.</p>
            </div>
          </div>
        );
      default:
        return <TourOptimization onCreateProject={handleCreateProject} onResumeProject={handleResumeProject} />;
    }
  };

  const isWizardActive = !!resumingProject || currentView === 'create-project';

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={handleSidebarToggle}
        activeItem={activeItem}
        onItemClick={handleMenuItemClick}
      />
      
      <main className={`flex-1 overflow-hidden ${isWizardActive ? '' : 'p-6'}`}>
        <div className={`h-full ${isWizardActive ? '' : 'overflow-y-auto'}`}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;