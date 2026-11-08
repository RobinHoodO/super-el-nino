const RESEARCH_LIBRARY_URL='https://citizen-infra.github.io/senri/el-nino/research-library/';

export function GET():Response{
  return new Response(null,{status:308,headers:{Location:RESEARCH_LIBRARY_URL}});
}
