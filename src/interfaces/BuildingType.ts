import { RowDataPacket } from 'mysql2';

interface BuildingType {
  id?: number;
  buildingType: string;
}

interface GetBuildingType extends RowDataPacket, BuildingType {}

type PostBuildingType = Omit<BuildingType, 'id'>;

type PutBuildingType = Partial<PostBuildingType>;

export { BuildingType, GetBuildingType, PostBuildingType, PutBuildingType };
