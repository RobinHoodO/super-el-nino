export const RESEARCH_LIBRARY_URL='https://citizen-infra.github.io/senri/el-nino/research-library/';

export function redirectLegacyResearch(request:Request):Response|null{
  if(request.method!=='GET'&&request.method!=='HEAD')return null;
  const pathname=new URL(request.url).pathname;
  if(pathname==='/research'||pathname.startsWith('/research/')){
    return new Response(null,{status:308,headers:{Location:RESEARCH_LIBRARY_URL}});
  }
  return null;
}
