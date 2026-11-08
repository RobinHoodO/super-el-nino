import handler from 'vinext/server/fetch-handler';
import {redirectLegacyResearch} from '../lib/research-redirect';

export default {
  fetch(request:Request,env:Cloudflare.Env,ctx:ExecutionContext){
    return redirectLegacyResearch(request)??handler.fetch(request,env,ctx);
  },
};
