export default interface MessageResponse {
  message: string;
  id?: number;
  ids?: number[];
  jobId?: string;
  jobIds?: string[];
  location?: string;
  skipped?: any[];
  buildingType?: string;
  buildingTypes?: string;
  data?: {
    newDevelopers?: any[];
    newArchitects?: any[];
    newContractors?: any[];
    newConsultants?: any[];
  };
}
