import {findPlaces} from '../../../lib/geography';
export async function GET(req:Request){try{return Response.json({places:findPlaces(new URL(req.url).searchParams.get('q')??''),attribution:'GeoNames CC BY 4.0; country centroids from Osiris'});}catch(e){return Response.json({error:e instanceof Error?e.message:'Place search unavailable'},{status:400});}}
