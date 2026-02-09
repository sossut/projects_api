export default interface MessageResponse {
  message: string;
  id?: number;
  ids?: number[];
  jobId?: string;
  location?: string;
  skipped?: any[];
  buildingType?: string;
}
