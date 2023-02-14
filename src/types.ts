import Parse from "parse";

export type EventCallback = (someArg: Parse.Object) => any;
export type Attributes = {
  [key: string]: any;
}