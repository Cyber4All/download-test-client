import { exec } from 'shelljs';
import * as fs from 'fs';
import 'source-map-support/register';
import { MongoDB } from '../../drivers/database/mongodb/mongodb';
import { OutageReportUpdates, OutageReport } from '../../types/outageReport';

export const testDownloads = async (): Promise<void> => {
  const database = await MongoDB.getInstance();
  const code = exec('npm test');

  if (code !== '0') {
    const contents = fs.readFileSync('test-results.json');
    const jsonContent = JSON.parse(contents.toString());

    // Format of test output file: https://jestjs.io/docs/en/configuration#testresultsprocessor-string
    const issues = [];
    const links: string[] = [];
    jsonContent.testResults[1].assertionResults.map(result => {
      if (result.status === 'failed') {
        issues.push(result.fullName);
        
        // Parse out download links if they exist in the failure message
        const link: string = parseDownloadLink(result.failureMessages[0]);
        if (link && !links.includes(link)) {
            links.push(link);
        }
    }
    });

    // Determine list of access groups that are impacted
    const accessGroups: string[] = [];
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
    const activeDownloadsIssue = await database.getActiveIssue('downloads');
    if (activeDownloadsIssue) {

      // If the issue or severity has changed, update the existing issue
      if (
        accessGroups !== activeDownloadsIssue.accessGroups
        || issues !== activeDownloadsIssue.issues || links !== activeDownloadsIssue.links
      ) {
        const updates: OutageReportUpdates = { accessGroups, issues };
        // Dynamically set links since it is optional in mongo
        if (links) {
          updates['links'] = links;
        }

        await database.updateActiveIssue(updates, 'downloads');
      }
    } else {
      // If there is not an active issue, create a new one
      const outageReport: OutageReport = {
        name: 'downloads',
        accessGroups,
        issues,
        discovered: Date.now().toString(),
      };
      // Dynamically set links since it is optional in mongo
      if (links) {
        outageReport['links'] = links;
      }

      await database.createNewIssue(outageReport);
    }
  } else {
    // Tests passed!
    // check if there is an open issue, if so resolve it
    const activeDownloadsIssue = await database.getActiveIssue('downloads');
    if (activeDownloadsIssue) {
      await database.updateActiveIssue({ resolved: true }, 'downloads');
    }
  }

  /**
   * Returns a download link that is parsed from a jest error message if it exists
   * @param message The error message to parse
   */
  function parseDownloadLink(message: String) {
    const start = message.indexOf('http');
    if (start) {
      const end = message.indexOf('/bundle') + 7;
      return message.substring(start, end);
    } else {
      return undefined;
    }
  }
};
