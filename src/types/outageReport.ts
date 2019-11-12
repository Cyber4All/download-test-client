export interface OutageReport {
    name: string;
    accessGroups: string[];
    issues: string[];
    discovered: string;
    resolved?: string;
}

export interface OutageReportUpdates {
    accessGroups?: string[];
    issues?: string[];
    resolved?: boolean;
}
