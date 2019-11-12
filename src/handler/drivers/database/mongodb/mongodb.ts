import { MongoClient, Db } from 'mongodb';
import { OutageReport, OutageReportUpdates } from '../../../../types/outageReport';

export class MongoDB {

    private db: Db;

    private constructor() {}

    static async connect(dbURI: string): Promise<MongoDB> {
        const mongodbClient = await new MongoClient(dbURI, { useNewUrlParser: true }).connect();
        const mongodb = new MongoDB();
        mongodb.setDatabase(mongodbClient);
        return mongodb;
    }

    setDatabase(mongodbClient: MongoClient) {
        this.db = mongodbClient.db('utility-service');
    }

    async getActiveIssue() {
        return await this.db.collection('platform-outage-reports').findOne({ name: 'downloads', resolved: null });
    }

    async createNewIssue(outageReport: OutageReport) {
        await this.db.collection('platform-outage-reports').insertOne(outageReport);
    }

    async updateActiveIssue(updates: OutageReportUpdates) {
        await this.db.collection('platform-outage-reports').updateOne({ name: 'downloads', resolved: null }, { $set: { updates }});
    }
}
