import { RowDataPacket } from 'mysql2';

interface BuildingUse {
  id: number;
  buildingUse: string;
}

interface GetBuildingUse extends RowDataPacket, BuildingUse {}

type PostBuildingUse = Omit<BuildingUse, 'id'>;

type PutBuildingUse = Partial<PostBuildingUse>;

export { BuildingUse, GetBuildingUse, PostBuildingUse, PutBuildingUse };
