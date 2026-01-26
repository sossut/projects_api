export default interface MessageResponse {
  message: string;
  id?: number;
  ids?: number[];
  skipped?: any[];
}
