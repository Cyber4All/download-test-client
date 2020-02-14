import { MongoDB } from '../../drivers/database/mongodb/mongodb';
import { OutageReportUpdates, OutageReport } from '../../types/outageReport';
import { testDownloads } from '../../service-tests/download-tests';

/**
 * Wrapper that gets, saves, and updates reports from testing the download
 * functionality
 * @param event AWS lambda handler event
 * @param context AWS lambda handler context
 * @param callback AWS lambda handler callback
 */
// @ts-ignore
export const downloadTestHandler = async (event, context, callback) => {
  const database = await MongoDB.getInstance();

  // Runs download test suite, running the callback passed in here at the end.
  // This callback reads the final report and updates it in the database, if required. 
  await testDownloads(async (report: OutageReport) => {
    // Get active report
    const activeIssue = await database.getActiveIssue('downloads');
    
    if (activeIssue && report && report.issues.length > 0) { // If there are potential report updates...
      // And the old report doesn't reflect the new report
      if (report.accessGroups !== activeIssue.accessGroups || report.issues !== activeIssue.issues || report.links !== activeIssue.links) {
        const updates: OutageReportUpdates = {
          accessGroups: report.accessGroups,
          issues: report.issues
        };
        // Dynamically set links since it is optional in mongo
        if (report.links) {
          updates['links'] = report.links;
        }
        // Update the report in the database
        await database.updateActiveIssue(updates, 'downloads');
      }
    } else if (report && report.issues.length > 0) { // If there is a new report...
      await database.createNewIssue(report);
    } else if (activeIssue && activeIssue.issues.length > 0) { // If a old report needs to be resolved...
      await database.updateActiveIssue({
        resolved: new Date()
      }, 'downloads');
    }
  });

  return 'Finished';
}
