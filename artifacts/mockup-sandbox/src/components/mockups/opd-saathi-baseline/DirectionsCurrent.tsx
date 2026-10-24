import './_group.css';
import { Navigate } from './source-components';
import type { Lang } from './translations';

export function DirectionsCurrent() {
  const lang:Lang='en';
  return <div className="min-h-screen"><Navigate state={{patients:[],urgent:{active:false,acknowledged:false},doctors:{},delays:{}}} update={()=>{}} lang={lang} setLang={()=>{}}/></div>;
}
