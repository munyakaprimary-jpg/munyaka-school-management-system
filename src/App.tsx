import React, { useEffect } from 'react';
import { dbService } from './services/DatabaseService';
import SyncStatusHeader from './components/SyncStatusHeader';

const App = () => {
  useEffect(() => {
    dbService.initialize();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <ThemeProvider attribute="class" defaultTheme="light" enableSystem={true}>
            <TooltipProvider>
              <SyncStatusHeader />
              <Layout>
                <Page />
              </Layout>
            </TooltipProvider>
          </ThemeProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;