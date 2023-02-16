import { ParseMobx } from "./index";

export type EventCallback = (someArg: ParseMobx) => any;
export type Attributes = {
  [key: string]: never;
};
export type CreateObjectOptions = {
  updateList?: boolean,
  saveEventually?: boolean
}
export type DeleteObjectOptions = {
  deleteEventually?: boolean
}

