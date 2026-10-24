import './_group.css';
import { useHospitalState } from './persistence';
import { Registration } from './source-components';
import type { Lang } from './translations';

export function RegistrationCurrent() {
  const [state,update]=useHospitalState();
  const lang:Lang='en';
  return <div className="min-h-screen"><Registration state={state} update={update} lang={lang} setLang={()=>{}}/></div>;
}
