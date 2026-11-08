import {redirectLegacyResearch} from '../../../lib/research-redirect';

export function GET(request:Request):Response{
  return redirectLegacyResearch(request)!;
}
