import type {Metadata} from 'next';import './globals.css';
export const metadata:Metadata={title:'Super El Nino · Community support',description:'Find help, offer support and share plans and resources for El Niño preparation, response and recovery.'};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
