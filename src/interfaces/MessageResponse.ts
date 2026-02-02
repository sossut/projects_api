export default interface MessageResponse {
  message: string;
  id?: number;
  ids?: number[];
  jobId?: string;
  skipped?: any[];
}
