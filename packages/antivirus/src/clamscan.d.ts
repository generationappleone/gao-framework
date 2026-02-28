// Type declaration for the 'clamscan' npm package (no @types available)
declare module 'clamscan' {
    interface ClamScanOptions {
        removeInfected?: boolean;
        quarantineInfected?: boolean;
        debugMode?: boolean;
        clamdscan?: {
            host?: string;
            port?: number;
            socket?: string | null;
            timeout?: number;
            localFallback?: boolean;
            path?: string;
            active?: boolean;
        };
        preference?: string;
    }

    interface ScanResponse {
        isInfected: boolean;
        viruses: string[];
    }

    class NodeClam {
        init(options: ClamScanOptions): Promise<NodeClam>;
        isInfected(filePath: string): Promise<ScanResponse>;
        scanStream(stream: NodeJS.ReadableStream): Promise<ScanResponse>;
    }

    export default NodeClam;
}
