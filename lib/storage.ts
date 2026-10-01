import {env} from 'cloudflare:workers';
export function db(){if(!env.DB)throw new Error('Storage unavailable');return env.DB;}
export const now=()=>new Date().toISOString();
