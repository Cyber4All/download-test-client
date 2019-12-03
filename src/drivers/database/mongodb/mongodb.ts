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
        }
        return this.instance;
    }

    private static async connect(dbURI: string) {
        const mongodbClient = await new MongoClient(dbURI, { useNewUrlParser: true }).connect();
        this.instance = new MongoDB();
        this.instance.setDatabase(mongodbClient);
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

    async getObject(status: string, collection?: string) {
        const filter = { status };
        if (collection) {
            filter['collection'] = collection;
        }

        const object =  await this.onionDb.collection('objects').findOne(filter);
        const result = { object, username: undefined };

        if (object) {
            const user = await this.onionDb.collection('users').findOne({ _id: object.authorID });
            result['username'] = user.username;
        }

        return result;
    }

    async getUnreleasedObject() {

    }
}
