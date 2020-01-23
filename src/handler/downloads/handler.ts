import { MongoDB } from '../../drivers/database/mongodb/mongodb';
import { OutageReportUpdates, OutageReport } from '../../types/outageReport';
import { testDownloads } from '../../service-tests/download-tests';

// @ts-ignore
export const handler = async (event, context, callback) => {
  const database = await MongoDB.getInstance();

  await testDownloads(async (report: OutageReport) => {
    // Get active report
    const activeIssue = await database.getActiveIssue('downloads');
    
    if (activeIssue && report) { // If there are report updates...
        if (report.accessGroups !== activeIssue.accessGroups || report.issues !== activeIssue.issues || report.links !== activeIssue.links) {
            const updates: OutageReportUpdates = {
                accessGroups: report.accessGroups,
                issues: report.issues
            };
            // Dynamically set links since it is optional in mongo
            if (report.links) {
              updates['links'] = report.links;
            }
    
            await database.updateActiveIssue(updates, 'downloads');
        }
    } else if (report) { // If there is a new report...
        await database.createNewIssue(report);
    } else { // If a old report needs to be resolved...
        await database.updateActiveIssue({ resolved: new Date() }, 'downloads');
    }
  });

  return 'exiting';
}
