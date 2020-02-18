export interface OutageReport {
    name: string;
    accessGroups: string[];
    issues: string[];
    discovered: Date;
    links?: string[];
    resolved?: Date;
}

export interface OutageReportUpdates {
    accessGroups?: string[];
    issues?: string[];
    links?: string[];
    resolved?: Date;
}
