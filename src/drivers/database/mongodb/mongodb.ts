import { MongoClient, Db } from 'mongodb';
import { OutageReport, OutageReportUpdates } from '../../../types/outageReport';

export class MongoDB {

    private static instance: MongoDB;

    private utilityDb: Db;
    private onionDb: Db;

    private constructor() {}

    public static async getInstance() {
        if (this.instance === undefined) {
            await this.connect(process.env.CLARK_DB_URI);
            this.instance = new MongoDB();
        }
        return this.instance;
    }

    private static async connect(dbURI: string): Promise<MongoDB> {
        const mongodbClient = await new MongoClient(dbURI, { useNewUrlParser: true }).connect();
        const mongodb = new MongoDB();
        mongodb.setDatabase(mongodbClient);
        return mongodb;
    }

    setDatabase(mongodbClient: MongoClient) {
        this.utilityDb = mongodbClient.db('utility');
        this.onionDb = mongodbClient.db('onion');
    }

    async getActiveIssue() {
        return await this.utilityDb.collection('platform-outage-reports').findOne({ name: 'downloads', resolved: null });
    }

    async createNewIssue(outageReport: OutageReport) {
        await this.utilityDb.collection('platform-outage-reports').insertOne(outageReport);
    }

    async updateActiveIssue(updates: OutageReportUpdates) {
        await this.utilityDb.collection('platform-outage-reports').updateOne({ name: 'downloads', resolved: null }, { $set: { updates }});
    }

    async getReleasedObject() {
        const object =  await this.onionDb.collection('objects').findOne({ status: 'released' });
        const user = await this.onionDb.collection('users').findOne({ _id: object.authorID });
        return { object, username: user.username };
        // `https://api-gateway.clark.center/users/${}/learning-objects/${}/versions/${}/bundle`;
    }

    async getUnreleasedObject() {

    }
}
