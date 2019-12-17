import { exec } from 'shelljs';
import * as fs from 'fs';
import 'source-map-support/register';
import { MongoDB } from '../../drivers/database/mongodb/mongodb';
import { OutageReportUpdates, OutageReport } from '../../types/outageReport';

export const testDownloads = async (): Promise<void> => {
  const database = await MongoDB.getInstance();
  const code = exec('npm test --outputFile=test-results.json');

  if (code !== '0') {
    const contents = fs.readFileSync('test-results.json');
    const jsonContent = JSON.parse(contents.toString());

    // Format of test output file: https://jestjs.io/docs/en/configuration#testresultsprocessor-string
    let issues = [];
    jsonContent.testResults.map(result => {
      if (result.status === 'failed') {
        issues.push(result.title);
      }
    });

    // Determine list of access groups that are impacted
    let accessGroups: string[];
    issues.map((i: string) => {
      if (i.includes('admin') && !accessGroups.includes('admin')) {
        accessGroups.push('admin');
      } else if (i.includes('editor') && !accessGroups.includes('editor')) {
        accessGroups.push('editor');
      } else if (i.includes('curator') && !accessGroups.includes('curator')) {
        accessGroups.push('curator');
      } else if (i.includes('reviewer') && !accessGroups.includes('reviewer')) {
        accessGroups.push('reviewer');
      }
    });

    // We need to read the database and determine if there is already an open issue
    const activeDownloadsIssue = await database.getActiveIssue();
    if (activeDownloadsIssue) {

      // If the issue or severity has changed, update the existing issue
      if (
        accessGroups !== activeDownloadsIssue.accessGroups
        || issues !== activeDownloadsIssue.issues
      ) {
        const updates: OutageReportUpdates = { accessGroups, issues };
        await database.updateActiveIssue(updates);
      }
    } else {
      // If there is not an active issue, create a new one
      const outageReport: OutageReport = {
        name: 'downloads',
        accessGroups,
        issues,
        discovered: Date.now().toString(),
      };
      await database.createNewIssue(outageReport);
    }
  } else {
    // Tests passed!
    // check if there is an open issue, if so resolve it
    const activeDownloadsIssue = await database.getActiveIssue();
    if (activeDownloadsIssue) {
      await database.updateActiveIssue({ resolved: true });
    }
  }
};



