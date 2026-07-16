export interface ValidationError {
    path: string;
    message: string;
    keyword?: string;
    expected?: unknown;
    actual?: unknown;
}