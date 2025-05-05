// request.interface.ts
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user?: any; // or replace `any` with the specific type for your user
}
