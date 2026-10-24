import { useEffect, useMemo, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Link, useLocation, Router as WouterRouter } from 'wouter';
import { useForm } from 'react-hook-form';
import { Form } from '@/components/ui/form';
import { Accessibility, AlertCircle, ArrowLeft, ArrowRight, Bell, Check, ChevronRight, CircleHelp, ClipboardList, Clock3, Eye, HeartPulse, Hospital, MapPin, Mic, Navigation, Printer, RotateCcw, Search, ShieldCheck, Siren, Sparkles, Stethoscope, Volume2 } from 'lucide-react';
import { affectedAreas, assignedDepartmentFor, departments, departmentMeta, initialState, nextPatientToken, reasons, suggestDepartment, waitEstimate, type AffectedArea, type Department, type DoctorStatus, type HospitalState, type Patient } from './data';
import { useHospitalState } from './persistence';
import { directions, places, shortestRoute } from './navigation';
import { t, type Lang } from './translations';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
const navItems = [
  {path:'/',label:'Home',icon:Hospital},{path:'/register',label:'Register',icon:ClipboardList},{path:'/slip',label:'Slip',icon:HeartPulse},{path:'/queue',label:'Queue',icon:Clock3},{path:'/navigate',label:'Navigate',icon:MapPin},{path:'/assistant',label:'Assistant',icon:CircleHelp},{path:'/staff',label:'Staff',icon:Stethoscope},{path:'/board',label:'Board',icon:Eye}
];
type SharedProps = {state:HospitalState; update:(fn:(s:HospitalState)=>HospitalState)=>void; lang:Lang};
function speak(text:string,_lang:Lang='en') { if('speechSynthesis' in window){window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-IN';u.rate=.88;window.speechSynthesis.speak(u);} }
function Btn({children,onClick,className='',...props}:{children:React.ReactNode;onClick?:()=>void;className?:string;[key:string]:any}) {return <button className={`btn ${className}`} onClick={onClick} {...props}>{children}</button>}

function suggestedLocation(department:Department,lang:Lang) {
 return `${department==='General Medicine'?t('Rooms 1–2',lang):departmentMeta[department].room}, ${t('First floor',lang)}`;
}

function createUrgentAlert(state:HospitalState):HospitalState['urgent'] {
 const patientId=localStorage.getItem('opd-saathi-patient-id'),patient=state.patients.find(p=>p.id===patientId);
 return {active:true,createdAt:new Date().toISOString(),acknowledged:false,token:patient?.token,patientName:patient?.firstName,phone:patient?.phone};
}

function Shell({children,lang}:import('react').PropsWithChildren<{lang:Lang}>) {
 const [path]=useLocation(),[settings,setSettings]=useState(false);
 const toggleClass=(name:string)=>{document.documentElement.classList.toggle(name);localStorage.setItem(`opd-${name}`,String(document.documentElement.classList.contains(name)));};
 useEffect(()=>{document.documentElement.classList.toggle('large-text',localStorage.getItem('opd-large-text')==='true');document.documentElement.classList.toggle('high-contrast',localStorage.getItem('opd-high-contrast')==='true');},[]);
 return <div className="app-shell">
  <a href="#main-content" className="sr-only focus:not-sr-only">Skip to main content</a>
   {path!=='/board'&&<header className="topbar no-print"><div className="top-inner">
   <Link href="/" className="brand"><span className="brand-mark"><Hospital size={24}/></span><span>OPD Saathi<small style={{display:'block',fontSize:11,fontWeight:600,color:'#627985'}}>City District Hospital</small></span></Link>
   <nav className="nav-links" aria-label="Main navigation">{navItems.map(({path:p,label,icon:Icon})=><Link key={p} href={p} className={`nav-link ${p===path?'active':''}`} data-testid={`link-${label.toLowerCase()}`}><Icon size={17}/><span>{t(label,lang)}</span></Link>)}</nav>
   <button className="btn btn-small" data-testid="button-settings" onClick={()=>setSettings(!settings)} aria-label={t('Accessibility settings',lang)} aria-controls="accessibility-settings-panel" aria-expanded={settings} title={t('Accessibility settings',lang)}><Eye size={18}/></button>
  </div>{settings&&<div id="accessibility-settings-panel" role="region" aria-label={t('Accessibility settings',lang)} style={{maxWidth:1240,margin:'auto',padding:'0 24px 13px',display:'flex',gap:10,flexWrap:'wrap',alignItems:'center'}}>
    <span className="muted">{t('Accessibility settings',lang)}</span>
    <Btn className="btn-small" onClick={()=>toggleClass('large-text')}><Eye size={16}/>{t('Large text',lang)}</Btn><Btn className="btn-small" onClick={()=>toggleClass('high-contrast')}>{t('High contrast',lang)}</Btn>
    <Btn className="btn-small" onClick={()=>speak('Text and reading settings are available here.')}><Volume2 size={16}/>{t('Read aloud',lang)}</Btn>
   </div>}</header>}
  <main id="main-content">{children}</main>
   {path!=='/board'&&<nav className="bottom-nav no-print" aria-label="Quick navigation">{navItems.map(({path:p,label,icon:Icon})=><Link key={p} href={p} className={p===path?'active':''} aria-current={p===path?'page':undefined} data-testid={`mobile-link-${label.toLowerCase()}`}><Icon/><span>{t(label,lang)}</span></Link>)}</nav>}
 </div>;
}
function PageHead({eyebrow,title,description}:{eyebrow:string;title:string;description:string}) {return <div className="page-head"><div><div className="eyebrow">{eyebrow}</div><h1>{title}</h1><p className="subhead">{description}</p></div></div>}
function Home({state,lang}:SharedProps) {
 const latestId=localStorage.getItem('opd-saathi-patient-id'), latest=state.patients.find(p=>p.id===latestId);
 return <div className="page-wrap"><PageHead eyebrow="CITY DISTRICT HOSPITAL · OPD SAATHI" title={t('Care, made easier',lang)} description="A calm, clear way to find your clinic, registration, and next step."/>
  <div className="grid-2" style={{alignItems:'stretch'}}>
   <section className="card card-tint" style={{display:'flex',flexDirection:'column',justifyContent:'space-between',minHeight:285}}><div><span className="tag"><ShieldCheck size={15}/> Patient support</span><h2 style={{fontSize:30,marginTop:18}}>Welcome. We can help you find your way.</h2><p className="subhead">Start with one simple step. You can ask a staff member for help at any time.</p></div><div className="btn-row" style={{marginTop:20}}><Link href="/register" className="btn btn-primary" data-testid="link-start-registration"><ClipboardList size={18}/>{t('Register for a visit',lang)}<ArrowRight size={17}/></Link><Link href="/navigate" className="btn"><Navigation size={17}/>{t('Find my way',lang)}</Link></div></section>
   <section className="card" style={{display:'grid',gap:15,alignContent:'start'}}><h2>What would you like to do?</h2>
    <Link href="/queue" className="list-row" style={{textDecoration:'none',color:'inherit'}}><span className="icon-box"><Clock3/></span><span style={{flex:1}}><strong>{t('Track my turn',lang)}</strong><span className="muted" style={{display:'block'}}>See the queue and estimated wait</span></span><ChevronRight/></Link>
    <Link href="/slip" className="list-row" style={{textDecoration:'none',color:'inherit'}}><span className="icon-box"><ClipboardList/></span><span style={{flex:1}}><strong>{t('View my slip',lang)}</strong><span className="muted" style={{display:'block'}}>Your token and clinic details</span></span><ChevronRight/></Link>
     <Link href="/assistant" className="list-row" style={{textDecoration:'none',color:'inherit'}}><span className="icon-box"><CircleHelp/></span><span style={{flex:1}}><strong>{t('Ask hospital help',lang)}</strong><span className="muted" style={{display:'block'}}>Simple answers about hospital services</span></span><ChevronRight/></Link>
   </section>
  </div>
  {latest&&<section className="card" style={{marginTop:18}}><div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}><div className="icon-box"><ClipboardList/></div><div style={{flex:1}}><div className="eyebrow">YOUR LATEST VISIT</div><h2 style={{margin:'4px 0'}}>Hello, {latest.firstName}. Your slip is ready.</h2><span className="muted">{latest.department} · {latest.token}</span></div><Link href="/slip" className="btn btn-primary">Open slip<ArrowRight size={17}/></Link></div></section>}
   <div className="btn-row" style={{marginTop:18}}><Link href="/staff" className="btn btn-soft" data-testid="link-staff-dashboard-demo"><Stethoscope size={17}/>{t('Staff dashboard (demo)',lang)}</Link></div>
 </div>;
}

type RegistrationValues={firstName:string;age:string;gender:string;phone:string;symptoms:string;affectedArea:AffectedArea;duration:string;additionalDetails:string;requestedDepartment:Department};
function Registration({state,update,lang}:SharedProps) {
 const [step,setStep]=useState(0),[assisted,setAssisted]=useState(false),[requestMode,setRequestMode]=useState<'suggestion'|'other'|'helpdesk'>('suggestion'),[,go]=useLocation();
 const form=useForm<RegistrationValues>({defaultValues:{firstName:'',age:'',gender:'',phone:'',symptoms:'',affectedArea:'unclear',duration:'',additionalDetails:'',requestedDepartment:'General Medicine'}});
 const steps=['Your name','Age and gender','Phone (optional)','What brings you here?','Affected area','How long?','Additional details','Department suggestion'];
 const fields:(keyof RegistrationValues)[][]=[['firstName'],['age','gender'],['phone'],['symptoms'],['affectedArea'],['duration'],['additionalDetails'],['requestedDepartment']];
 const selectedArea=form.watch('affectedArea'),ageValue=form.watch('age'),suggestion=suggestDepartment(selectedArea,Number(ageValue)||0);
 const next=async()=>{if(await form.trigger(fields[step]))setStep(Math.min(step+1,steps.length-1));};
 const back=()=>setStep(Math.max(0,step-1));
 const recognitionAvailable=typeof window!=='undefined'&&('SpeechRecognition'in window||'webkitSpeechRecognition'in window);
 const listenForName=()=>{const w=window as any;const Rec=w.SpeechRecognition||w.webkitSpeechRecognition;if(Rec){const r=new Rec();r.lang='en-IN';r.onresult=(e:any)=>form.setValue('firstName',e.results[0][0].transcript);r.start();}};
 const submit=form.handleSubmit(data=>{
   const suggested=suggestDepartment(data.affectedArea,Number(data.age)),requested=data.requestedDepartment;
   const assigned= requestMode==='other'?requested:requestMode==='suggestion'&&suggested!=='Help Desk'?suggested:null;
   const department=assigned??(suggested==='Help Desk'?'General Medicine':suggested),meta=departmentMeta[department];
   const patient:Patient={id:`visit-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,token:nextPatientToken(state.patients),firstName:data.firstName.trim(),age:Number(data.age),gender:data.gender,phone:data.phone.trim()||undefined,department,assignedDepartment:null,suggestedDepartment:suggested,requestedDepartment:assigned,symptoms:data.symptoms.trim(),affectedArea:data.affectedArea,duration:data.duration,additionalDetails:data.additionalDetails.trim()||undefined,helpDeskReview:requestMode==='helpdesk'||suggested==='Help Desk',status:'pending-review',registeredAt:new Date().toISOString(),doctor:meta.doctor,room:meta.room,floor:1};
  update(s=>({...s,patients:[patient,...s.patients]}));localStorage.setItem('opd-saathi-patient-id',patient.id);go('/slip');
 });
 return <div className="page-wrap"><PageHead eyebrow="PATIENT REGISTRATION" title="A few details, one step at a time." description="You can go back and change any answer before submitting."/>
  <div className="grid-2" style={{alignItems:'start'}}><section className="card">
    <div className="step-indicator" aria-label={`Step ${step+1} of ${steps.length}`}>{steps.map((s,i)=><div key={s} style={{display:'contents'}}><span className={`step-dot ${i<=step?'active':''}`} aria-current={step===i?'step':undefined}>{i<step?<Check size={17}/>:i+1}</span>{i<steps.length-1&&<span className="step-line"/>}</div>)}</div>
   <h2>{t(steps[step],lang)}</h2><Form {...form}><form onSubmit={submit} noValidate>
    {step===0&&<div className="field"><label htmlFor="patient-name">{t('Patient name',lang)}</label><input id="patient-name" autoFocus {...form.register('firstName',{required:'Please enter a name.'})} placeholder="For example, Asha Sharma" data-testid="input-first-name"/>{form.formState.errors.firstName&&<small role="alert">{form.formState.errors.firstName.message}</small>}{recognitionAvailable&&<Btn type="button" className="btn-small" onClick={listenForName}><Mic size={16}/> {t('Speak your name',lang)}</Btn>}</div>}
   {step===1&&<><div className="field"><label htmlFor="patient-age">{t('How old are you?',lang)}</label><input id="patient-age" type="number" min="0" max="120" {...form.register('age',{required:'Please enter age.',validate:v=>Number(v)>=0&&Number(v)<=120||'Enter an age from 0 to 120.'})} data-testid="input-age"/></div><div className="field"><label htmlFor="patient-gender">{t('Gender',lang)}</label><select id="patient-gender" {...form.register('gender',{required:'Please choose an option.'})} data-testid="select-gender"><option value="">{t('Choose one',lang)}</option><option value="Female">{t('Female',lang)}</option><option value="Male">{t('Male',lang)}</option><option value="Other">{t('Other',lang)}</option><option value="Prefer not to say">{t('Prefer not to say',lang)}</option></select></div>{(form.formState.errors.age||form.formState.errors.gender)&&<small role="alert">Please complete both fields.</small>}</>}
    {step===2&&<div className="field"><label htmlFor="patient-phone">{t('Phone number (optional)',lang)}</label><input id="patient-phone" type="tel" {...form.register('phone',{validate:v=>!v||/^[0-9+\-\s()]{7,18}$/.test(v)||'Enter a valid phone number or leave blank.'})} placeholder="Only if you would like to share" data-testid="input-phone"/><small>{t('You can leave this empty. Your details stay on this device in this demo.',lang)}</small>{form.formState.errors.phone&&<small role="alert">{form.formState.errors.phone.message}</small>}</div>}
     {step===3&&<div className="field"><label htmlFor="patient-symptoms">{t('Describe your symptoms in your own words',lang)}</label><textarea id="patient-symptoms" rows={4} {...form.register('symptoms',{required:'Please describe what is bothering you.'})} placeholder="What has been bothering you?" data-testid="input-symptoms"/><small>{t('This helps staff guide you to a starting department. It is not used to diagnose.',lang)}</small>{form.formState.errors.symptoms&&<small role="alert">{form.formState.errors.symptoms.message}</small>}</div>}
    {step===4&&<div className="field"><label>{t('Which area or type of complaint is affected?',lang)}</label><div className="grid-2" role="group" aria-label="Affected area">{affectedAreas.map(area=><button type="button" key={area.id} className={`btn ${selectedArea===area.id?'btn-primary':'btn-soft'}`} aria-pressed={selectedArea===area.id} onClick={()=>form.setValue('affectedArea',area.id,{shouldValidate:true})} data-testid={`button-area-${area.id}`}>{t(area.label,lang)}</button>)}</div><small>{t('Choose the closest match, or choose “I am not sure” to ask for staff help.',lang)}</small></div>}
     {step===5&&<div className="field"><label htmlFor="symptom-duration">{t('How long have you had this concern?',lang)}</label><select id="symptom-duration" {...form.register('duration',{required:'Please choose a duration.'})} data-testid="select-symptom-duration"><option value="">{t('Choose one',lang)}</option>{['Today','1–3 days','4–7 days','More than a week','Ongoing or recurring'].map(duration=><option key={duration}>{t(duration,lang)}</option>)}</select></div>}
     {step===6&&<div className="field"><label htmlFor="additional-details">{t('Anything else you would like staff to know? (optional)',lang)}</label><textarea id="additional-details" rows={4} {...form.register('additionalDetails')} placeholder="Add details for hospital staff, if you wish." data-testid="input-additional-details"/></div>}
    {step===7&&<div className="stack">
      <div className="notice notice-blue" role="status"><Sparkles size={20}/><span><strong>{t('Suggested starting department',lang)}: {t(suggestion,lang)}{suggestion!=='Help Desk'?` · ${suggestedLocation(suggestion,lang)}`:''}</strong><br/>{t('Based on your selected symptoms, this department may be a suitable place to start. Hospital staff can help confirm your choice.',lang)}</span></div>
      <p className="muted">{t('These transparent rules use the selected area and age only. They do not diagnose or decide whether a concern is urgent.',lang)}</p>
      <div className="grid-2">
       <button type="button" className={`btn ${requestMode==='suggestion'?'btn-primary':'btn-soft'}`} aria-pressed={requestMode==='suggestion'} onClick={()=>setRequestMode('suggestion')} data-testid="button-accept-suggestion">{t('Accept suggestion',lang)}</button>
       <button type="button" className={`btn ${requestMode==='other'?'btn-primary':'btn-soft'}`} aria-pressed={requestMode==='other'} onClick={()=>setRequestMode('other')} data-testid="button-choose-department">{t('Choose another department',lang)}</button>
      </div>
      {requestMode==='other'&&<div className="field"><label htmlFor="requested-department">{t('Choose a department',lang)}</label><select id="requested-department" {...form.register('requestedDepartment')} data-testid="select-requested-department">{departments.map(d=><option key={d} value={d}>{t(d,lang)} — {t(reasons[d],lang)}</option>)}</select></div>}
      <button type="button" className={`btn ${requestMode==='helpdesk'?'btn-primary':'btn-soft'}`} aria-pressed={requestMode==='helpdesk'} onClick={()=>setRequestMode('helpdesk')} data-testid="button-request-helpdesk">{t('Request staff assistance',lang)}</button>
      <p className="muted">{t('Staff will review your request and confirm a department before adding you to a queue. This is a demo; ask hospital staff in person for immediate help.',lang)}</p>
     </div>}
    <div className="btn-row" style={{justifyContent:'space-between',marginTop:24}}>{step>0?<Btn type="button" onClick={back}><ArrowLeft size={17}/>{t('Back',lang)}</Btn>:<span/>}{step<steps.length-1?<Btn type="button" className="btn-primary" onClick={next}>{t('Continue',lang)}<ArrowRight size={17}/></Btn>:<Btn type="submit" className="btn-primary" data-testid="button-submit-registration">{t('Create token & send for review',lang)}<ArrowRight size={17}/></Btn>}</div>
  </form></Form></section>
   <aside className="stack">
     <section className="card card-warm"><div style={{display:'flex',gap:12}}><AlertCircle size={24} style={{flex:'none',color:'#966b1c'}}/><div><h3>Need immediate help?</h3><p style={{marginBottom:13}}>Please tell a nearby hospital staff member now. Do not wait for registration or a token.</p><Btn className="btn-danger btn-small" data-testid="button-urgent-help" onClick={()=>{localStorage.setItem('opd-urgent-route','true');update(s=>({...s,urgent:createUrgentAlert(s)}));go('/navigate');}}><Siren size={16}/>{t('I need urgent help',lang)}</Btn></div></div></section>
   <section className="card"><label style={{display:'flex',gap:12,alignItems:'center',fontWeight:750}}><input type="checkbox" checked={assisted} onChange={e=>setAssisted(e.target.checked)} data-testid="checkbox-assisted"/>I am registering with help from someone</label><p className="muted" style={{margin:'10px 0 0'}}>Staff at the help desk can guide you through each question.</p></section>
  </aside></div>
 </div>;
}

function getCurrentPatient(state:HospitalState) {const id=localStorage.getItem('opd-saathi-patient-id');return state.patients.find(p=>p.id===id)??state.patients.find(p=>p.id.startsWith('demo-'));}
function Slip({state,lang}:SharedProps) {
 const patient=getCurrentPatient(state);
 if(!patient)return <div className="page-wrap"><PageHead eyebrow="YOUR VISIT" title="No slip yet" description="Register for an OPD visit to create a slip."/><Link className="btn btn-primary" href="/register">Register for a visit</Link></div>;
 const assigned=assignedDepartmentFor(patient),{ahead,minutes}=waitEstimate(state,patient);
 return <div className="page-wrap"><PageHead eyebrow="YOUR OPD SLIP" title="Keep this slip with you." description="Show it to hospital staff if you need help finding your clinic."/>
  <div className="grid-2" style={{alignItems:'start'}}><section className="card" id="slip-print"><div className="print-only"><strong>City District Hospital · OPD Saathi</strong></div><div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'start'}}><div><span className="tag">OPD VISIT</span><h2 style={{marginTop:12}}>{patient.firstName}</h2><p className="muted">{assigned?t(assigned,lang):t('Department awaiting confirmation',lang)} · {patient.age} years</p></div><span className={`tag ${patient.status}`}>{t(patient.status==='no-show'?'No-show':patient.status==='pending-review'?'Pending staff review':patient.status[0].toUpperCase()+patient.status.slice(1),lang)}</span></div>
   <div style={{background:'#f0f8f7',padding:22,borderRadius:17,margin:'20px 0',textAlign:'center'}}><div className="eyebrow">YOUR TOKEN</div><div className="token" data-testid="text-patient-token">{patient.token}</div><div style={{marginTop:10,fontWeight:750}}>{assigned?`${patient.doctor} · ${patient.room}, First floor`:t('Department awaiting confirmation',lang)}</div>{!assigned&&<p className="muted" style={{marginBottom:0}}>{t('Staff will confirm your department before adding you to a queue.',lang)}</p>}</div>
   <div className="grid-2"><div><div className="metric" data-testid="text-people-ahead">{assigned?ahead:'—'}</div><div className="metric-label">{t('People ahead',lang)}</div></div><div><div className="metric" data-testid="text-estimated-wait">{assigned?`${minutes} min`:'—'}</div><div className="metric-label">{t('Estimated wait',lang)}</div></div></div>
    <div className="notice notice-blue" style={{marginTop:20}}><Clock3 size={21}/><span><strong>{t('Next steps',lang)}</strong><br/>{assigned?'Go to the OPD waiting hall on the first floor. Listen for your token, and ask staff if you need assistance. An estimate can change as the queue moves.':t('Your request is waiting for staff to review the department. Please ask a staff member if you need help.',lang)}</span></div>
   <div className="btn-row no-print" style={{marginTop:20}}><Btn className="btn-primary" onClick={()=>window.print()} data-testid="button-print-slip"><Printer size={17}/>{t('Print slip',lang)}</Btn>{'speechSynthesis'in window&&<Btn onClick={()=>speak(`${patient.firstName}. Token ${patient.token}. ${patient.doctor}. ${patient.room}. First floor. ${ahead} people ahead. Estimated wait ${minutes} minutes.`,lang)} data-testid="button-read-slip"><Volume2 size={17}/>{t('Read aloud',lang)}</Btn>}<Link href="/queue" className="btn">{t('Track my turn',lang)}<ArrowRight size={17}/></Link></div>
   </section><div className="stack"><section className="card"><h2>Need a hand?</h2><p className="muted">The help desk is on the ground floor near Registration. Staff can guide you to your clinic.</p><Link href="/navigate" className="btn btn-soft"><MapPin size={17}/>Directions to your clinic</Link></section></div></div>
 </div>;
}

function Queue({state,lang}:SharedProps) {
 const patient=getCurrentPatient(state); const [alerts,setAlerts]=useState(false);
 useEffect(()=>{if(!patient)return;const {ahead}=waitEstimate(state,patient);if(ahead===3&&'Notification'in window&&Notification.permission==='granted')new Notification('Your turn is getting closer',{body:'Three people are ahead of you.'});if(ahead===3&&navigator.vibrate)navigator.vibrate([120,80,120]);},[state,patient]);
 const allowAlerts=async()=>{if('Notification'in window&&Notification.permission==='default')await Notification.requestPermission();setAlerts(true);};
 if(!patient)return <div className="page-wrap"><PageHead eyebrow="QUEUE" title="Track your turn" description="Register first to see your place in the queue."/><Link href="/register" className="btn btn-primary">Register for a visit</Link></div>;
 if(!assignedDepartmentFor(patient))return <div className="page-wrap"><PageHead eyebrow="QUEUE" title="Track your turn" description="Your request is waiting for staff to confirm a department."/><section className="card"><span className="tag">{t('Pending staff review',lang)}</span><div className="token" style={{marginTop:12}}>{patient.token}</div><h2>{patient.firstName}</h2><div className="notice notice-blue" role="status"><Clock3 size={20}/><span>{t('Your request is not in an OPD queue yet. A staff member will confirm or change the department first.',lang)}</span></div><div className="btn-row" style={{marginTop:16}}><Link href="/slip" className="btn btn-primary">{t('View my slip',lang)}</Link><Link href="/staff" className="btn">{t('Staff dashboard (demo)',lang)}</Link></div></section></div>;
 const assigned=assignedDepartmentFor(patient)!;
 const {ahead,minutes}=waitEstimate(state,patient),warning=ahead<=3&&patient.status==='waiting';
 return <div className="page-wrap"><PageHead eyebrow="LIVE QUEUE" title="Your place, at a glance." description="Queue changes made by staff appear here automatically."/>
  <div className="grid-2" style={{alignItems:'start'}}><section className="card"><div style={{display:'flex',justifyContent:'space-between',alignItems:'start',gap:12}}><div><span className="eyebrow">{t(assigned,lang)}</span><div className="token" style={{marginTop:8}}>{patient.token}</div></div><span className={`tag ${patient.status}`}>{t(patient.status==='no-show'?'No-show':patient.status[0].toUpperCase()+patient.status.slice(1),lang)}</span></div>
   {warning&&<div className="notice notice-gold" role="status" style={{marginTop:20}}><Bell size={22}/><span><strong>Your turn is getting closer.</strong><br/>Only {ahead} {ahead===1?'person':'people'} ahead. Please stay near {patient.room}.</span></div>}
   {patient.status==='called'&&<div className="notice notice-blue" role="status" style={{marginTop:20}}><Bell size={22}/><span><strong>Your token is being called.</strong><br/>Please go to {patient.room} on the first floor and tell staff your token.</span></div>}
   <div className="grid-2" style={{marginTop:25}}><div className="card-tint" style={{padding:16,borderRadius:14}}><div className="metric">{ahead}</div><div className="metric-label">{t('People ahead',lang)}</div></div><div className="card-tint" style={{padding:16,borderRadius:14}}><div className="metric">{minutes} min</div><div className="metric-label">{t('Estimated wait',lang)}</div></div></div>
   <p className="muted" style={{marginTop:18}}>Estimate = people ahead × typical visit time + clinic delay, rounded to 5 minutes. It may change.</p>
   <Btn className="btn-soft" onClick={allowAlerts} data-testid="button-enable-notifications"><Bell size={17}/>{alerts?'Alerts enabled where supported':'Enable turn alerts'}</Btn>
   </section><div className="stack"><section className="card"><h2>Where to go</h2><p><strong>{patient.doctor}</strong><br/>{patient.room} · First floor · OPD waiting hall</p><Link href="/navigate" className="btn btn-primary"><Navigation size={17}/>Show directions</Link></section></div></div>
 </div>;
}

function Navigate({lang}:SharedProps) {
 const [from,setFrom]=useState('entrance'),[to,setTo]=useState(()=>localStorage.getItem('opd-urgent-route')==='true'?'help':'room1'),[avoid,setAvoid]=useState(localStorage.getItem('opd-avoid-stairs')==='true'),[lost,setLost]=useState(false);
 useEffect(()=>{localStorage.removeItem('opd-urgent-route');},[]);
 const route=useMemo(()=>shortestRoute(from,to,avoid),[from,to,avoid]),steps=directions(route);
 const placeName=(id:string)=>{const p=places.find(x=>x.id===id);return p?t(p.name,lang):id;};
 const runLost=()=>{setTo('help');setLost(true);};
 const setAvoidStairs=(v:boolean)=>{setAvoid(v);localStorage.setItem('opd-avoid-stairs',String(v));};
 const floorNames=['Ground floor','First floor','Second floor'];
  return <div className="page-wrap"><PageHead eyebrow="HOSPITAL DIRECTIONS" title="Find a clear route." description="Choose where you are and where you need to go. You can avoid stairs."/>
   <section className="card"><div className="grid-2"><div className="field"><label htmlFor="route-from">I am at</label><select id="route-from" value={from} onChange={e=>{setFrom(e.target.value);setLost(false);}} data-testid="select-route-start">{places.map(p=><option key={p.id} value={p.id}>{placeName(p.id)} · {t(floorNames[p.floor],lang)}</option>)}</select></div><div className="field"><label htmlFor="route-to">I need to go to</label><select id="route-to" value={to} onChange={e=>{setTo(e.target.value);setLost(false);}} data-testid="select-route-destination">{places.map(p=><option key={p.id} value={p.id}>{placeName(p.id)} · {t(floorNames[p.floor],lang)}</option>)}</select></div></div>
    <div className="btn-row" style={{alignItems:'center',marginBottom:19}}><label style={{display:'inline-flex',gap:10,alignItems:'center',fontWeight:700}}><input type="checkbox" checked={avoid} onChange={e=>setAvoidStairs(e.target.checked)} data-testid="checkbox-avoid-stairs"/><Accessibility size={19}/>{t('Avoid stairs',lang)}</label><Btn className="btn-soft" onClick={runLost} data-testid="button-im-lost"><CircleHelp size={17}/>I’m lost — find help desk</Btn><Btn className="btn-small" onClick={()=>speak(`Directions. ${steps.join(' ')}`)}><Volume2 size={17}/>Listen</Btn></div>
    {lost&&<div className="notice notice-blue" role="status"><ShieldCheck size={20}/><span>The route from your selected location to the help desk is shown. Hospital staff can guide you from there.</span></div>}
    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',margin:'20px 0 10px'}}><h2 style={{margin:0}}>Hospital map</h2><span className="tag">3 floors · Lift marked</span></div>
   {[0,1,2].map(floor=><div key={floor} style={{marginTop:16}}><h3>{t(floorNames[floor],lang)}</h3><div className="floor-map">{places.filter(p=>p.floor===floor).map(p=><div key={p.id} className={`map-node ${route.includes(p.id)?'route':''} ${p.id===to?'current':''}`} data-testid={`map-place-${p.id}`}><span>{route.includes(p.id)&&<Check size={13} style={{verticalAlign:'middle'}}/>} {placeName(p.id)}</span></div>)}</div></div>)}
    <div className="card-tint" style={{padding:18,borderRadius:15,marginTop:20}}><h3>Step-by-step directions</h3>{route.length?steps.map((step,i)=><div key={`${route[i]}-${i}`} className="list-row"><span className="step-dot active">{i+1}</span><span style={{flex:1}}>{step}</span></div>):<p role="alert">No accessible route found. Choose another location or ask a staff member.</p>}</div>
  </section>
 </div>;
}
const faqs=[
 {q:'Where is registration?',a:'Registration is on the ground floor, beside the main entrance. Ask the help desk if you would like someone to walk with you.'},
 {q:'Where do I collect medicine?',a:'The pharmacy is on the ground floor. Take your paper from the doctor to the pharmacy counter.'},
 {q:'How do I find my clinic?',a:'Use Find a place to see a route to your room. OPD departments are on the first floor, rooms 1 to 8.'},
 {q:'What should I do if I need immediate help?',a:'Tell a nearby hospital staff member immediately. Do not wait for registration or a token.'},
 {q:'Where is the lift?',a:'The lift connects the ground, first, and second floors. Follow the lift signs, or choose Avoid stairs in Find a place.'},
 {q:'Can I get help with a wheelchair?',a:'A wheelchair assistance point is by the main entrance. The help desk can guide you.'},
];
function Assistant({lang}:SharedProps) {
 const [query,setQuery]=useState(''),[active,setActive]=useState<number|null>(null);
 const filtered=faqs.filter(f=>`${f.q} ${f.a}`.toLowerCase().includes(query.toLowerCase()));
 return <div className="page-wrap"><PageHead eyebrow="HOSPITAL DIRECTORY" title="Simple answers, right here." description="Find hospital places and practical visit information."/>
  <div className="grid-2" style={{alignItems:'start'}}><section className="card"><span className="tag"><Sparkles size={14}/>{t('Not a live AI',lang)}</span><h2 style={{marginTop:15}}>Hospital helper</h2><p className="muted">This is rule-based guidance from the hospital directory and common questions. It is not a live AI model and cannot provide medical advice.</p>
    <label className="field"><span>Search a hospital question</span><span style={{position:'relative'}}><Search size={19} style={{position:'absolute',left:13,top:15,color:'#58717c'}}/><input style={{paddingLeft:42}} value={query} onChange={e=>setQuery(e.target.value)} placeholder="For example: Where is registration?" data-testid="input-assistant-search"/></span></label>
    <div>{filtered.map((f,i)=><div key={f.q} className="list-row" style={{display:'block'}}><button className="btn" style={{width:'100%',justifyContent:'space-between',textAlign:'left'}} onClick={()=>setActive(active===i?null:i)} data-testid={`button-faq-${i}`}><span>{f.q}</span><ChevronRight size={18}/></button>{active===i&&<div style={{padding:'12px 6px 4px',lineHeight:1.6}}>{f.a}<div style={{marginTop:10}}><Btn className="btn-small" onClick={()=>speak(f.a)}><Volume2 size={16}/>{t('Read aloud',lang)}</Btn></div></div>}</div>)}{filtered.length===0&&<div className="notice notice-blue">No directory answer found. Please ask the help desk on the ground floor.</div>}</div>
   </section><div className="stack"><section className="card card-tint"><h2>Find a hospital place</h2><p className="muted">The directory covers all three floors, including rooms, services, lift, stairs, and accessibility points.</p><Link href="/navigate" className="btn btn-primary"><MapPin size={17}/>Open hospital map</Link></section></div></div>
 </div>;
}

function Staff({state,update,lang}:SharedProps) {
 const [department,setDepartment]=useState<Department>('General Medicine'),[transfer,setTransfer]=useState<Department>('Children'),[notice,setNotice]=useState(''),[confirmReset,setConfirmReset]=useState(false),[openPatient,setOpenPatient]=useState<string|null>(null),[draftDepartments,setDraftDepartments]=useState<Record<string,Department>>({});
 const active=state.patients.filter(p=>assignedDepartmentFor(p)===department&&['waiting','called'].includes(p.status)).sort((a,b)=>new Date(a.registeredAt).getTime()-new Date(b.registeredAt).getTime());
 const current=active.find(p=>p.status==='called'),waiting=active.filter(p=>p.status==='waiting'),delay=state.delays[department]||0;
 const newRequests=state.patients.filter(p=>p.status==='pending-review'||!assignedDepartmentFor(p)).sort((a,b)=>new Date(b.registeredAt).getTime()-new Date(a.registeredAt).getTime());
 const fallbackDepartment=(p:Patient):Department=>p.requestedDepartment??(p.suggestedDepartment&&p.suggestedDepartment!=='Help Desk'?p.suggestedDepartment:'General Medicine');
 const mutatePatient=(id:string,patch:Partial<Patient>)=>update(s=>({...s,patients:s.patients.map(p=>p.id===id?{...p,...patch}:p)}));
 const assignDepartment=(p:Patient,target:Department)=>{const meta=departmentMeta[target];update(s=>({...s,patients:s.patients.map(x=>x.id===p.id?{...x,department:target,assignedDepartment:target,requestedDepartment:x.requestedDepartment??target,suggestedDepartment:x.suggestedDepartment??x.department,status:'waiting',doctor:meta.doctor,room:meta.room,floor:1,helpDeskReview:false}:x)}));setNotice(`${p.token} assigned to ${target}.`);};
 const confirmSuggested=(p:Patient)=>assignDepartment(p,p.suggestedDepartment&&p.suggestedDepartment!=='Help Desk'?p.suggestedDepartment:fallbackDepartment(p));
 const changeDepartment=(p:Patient)=>assignDepartment(p,draftDepartments[p.id]??fallbackDepartment(p));
 const requestHelpDeskReview=(p:Patient)=>{mutatePatient(p.id,{status:'pending-review',assignedDepartment:null,helpDeskReview:true});setNotice(`${p.token} sent for Help Desk review.`);};
 const advance=(p:Patient,status:Patient['status'])=>{mutatePatient(p.id,{status});setNotice(`${p.token} marked ${status}.`);};
 const callNext=()=>{if(current){setNotice(`${current.token} is still being called. Complete the consultation or mark the patient no-show before calling the next patient.`);return;}const next=waiting[0];if(!next){setNotice('No waiting patients in this department.');return;}mutatePatient(next.id,{status:'called'});setNotice(`${next.token} called to ${departmentMeta[department].room}.`);};
 const callPatient=(patient:Patient)=>{if(current){setNotice(`${current.token} is still being called. Complete the consultation or mark the patient no-show before calling another patient.`);return;}advance(patient,'called');};
 const completeCurrent=()=>{if(current)advance(current,'served');};
 const moveToEnd=(p:Patient)=>{update(s=>({...s,patients:s.patients.map(x=>x.id===p.id?{...x,status:'waiting',registeredAt:new Date().toISOString()}:x)}));setNotice(`${p.token} moved to the end of the queue.`);};
 const transferPatient=(p:Patient)=>{const target=transfer===department?departments.find(d=>d!==department)!:transfer;const meta=departmentMeta[target];update(s=>({...s,patients:s.patients.map(x=>x.id===p.id?{...x,department:target,assignedDepartment:target,doctor:meta.doctor,room:meta.room,floor:1,status:'waiting',registeredAt:new Date().toISOString()}:x)}));setNotice(`${p.token} transferred to ${target}.`);};
 const addDemoPatients=()=>{const names=['Aarav','Maya','Ishaan','Zoya','Kabir','Tara','Neil','Diya','Ayaan','Ira','Rehan','Anaya','Veer','Sana','Rohan','Nisha','Adil','Meera','Kunal','Riya'];update(s=>{const added:Patient[]=[];names.forEach((name,i)=>{const target=departments[(s.patients.length+i)%departments.length],meta=departmentMeta[target];added.push({id:`demo-added-${Date.now()}-${i}`,token:nextPatientToken([...s.patients,...added]),firstName:name,age:18+(i*9)%62,gender:i%2?'Female':'Male',department:target,assignedDepartment:target,suggestedDepartment:target,requestedDepartment:target,symptoms:'Fictional demo visit',affectedArea:'general',duration:'Today',status:'waiting',registeredAt:new Date(Date.now()+i).toISOString(),doctor:meta.doctor,room:meta.room,floor:1});});return {...s,patients:[...added,...s.patients]};});setNotice('Added 20 fictional patients to the demo queues.');};
 const reset=()=>{if(confirmReset){update(()=>initialState());localStorage.removeItem('opd-saathi-urgent-help');localStorage.removeItem('opd-saathi-patient-id');setConfirmReset(false);setNotice('Demo queue reset.');}else setConfirmReset(true);};
 const setDoctor=(status:DoctorStatus)=>update(s=>({...s,doctors:{...s.doctors,[department]:status}}));
 const setDelay=(value:number)=>update(s=>({...s,delays:{...s.delays,[department]:value}}));
 const acknowledge=()=>{const acknowledgedAt=new Date().toISOString();localStorage.setItem('opd-saathi-urgent-help',JSON.stringify({...state.urgent,active:false,acknowledged:true,acknowledgedAt}));update(s=>({...s,urgent:{...s.urgent,active:false,acknowledged:true,acknowledgedAt}}));};
 const handleUrgent=()=>{try{const raw=localStorage.getItem('opd-saathi-urgent-help');if(raw){const urgent=JSON.parse(raw);if(urgent.active&&!state.urgent.active)update(s=>({...s,urgent:{...urgent,acknowledged:false}}));}}catch{}};
 useEffect(()=>{window.addEventListener('opd-urgent',handleUrgent);const onStorage=(e:StorageEvent)=>{if(e.key==='opd-saathi-urgent-help')handleUrgent();};window.addEventListener('storage',onStorage);handleUrgent();return()=>{window.removeEventListener('opd-urgent',handleUrgent);window.removeEventListener('storage',onStorage);};});
 return <div className="page-wrap"><PageHead eyebrow="STAFF DESK · DEMO MODE" title="Queue control" description="Actions synchronize with patient tracking and the public queue board across open tabs."/>
  <div className="notice notice-blue" style={{marginBottom:18}}><ShieldCheck size={21}/><span><strong>Demo only. Do not enter real patient information.</strong> This simulation stores fictional data in this browser’s localStorage. It has no accounts, backend, or secure patient record system.</span></div>
   {state.urgent.active&&<section className="urgent-banner" role="alert" data-testid="status-urgent-flag" style={{marginBottom:18}}><div style={{display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}><Siren size={30}/><div style={{flex:1}}><h2 style={{color:'#702c24',margin:'0 0 3px'}}>Urgent help requested</h2><strong>Ask a nearby staff member to check in immediately. Do not ask the patient to wait in the queue.</strong><div style={{marginTop:8}}>Token: {state.urgent.token??'Not provided'} · Requested: {state.urgent.createdAt?new Date(state.urgent.createdAt).toLocaleString():'Time unavailable'} · Contact: {state.urgent.phone??'Not provided'}</div></div><Btn className="btn-danger" onClick={acknowledge} data-testid="button-acknowledge-urgent"><Check size={17}/>{t('Acknowledge',lang)}</Btn></div></section>}
   {state.urgent.acknowledged&&!state.urgent.active&&state.urgent.acknowledgedAt&&<p className="notice notice-blue" role="status" data-testid="status-urgent-acknowledged">Urgent request acknowledged at {new Date(state.urgent.acknowledgedAt).toLocaleString()}.</p>}
   <section className="card" style={{marginBottom:18}}><div className="page-head" style={{marginBottom:8}}><div><div className="eyebrow">PATIENT INTAKE</div><h2 style={{margin:'4px 0'}}>New patient requests <span className="tag">{newRequests.length}</span></h2><p className="muted">Review symptoms and confirm one department before a request joins a queue.</p></div></div>
    {newRequests.length===0&&<p className="muted">No requests awaiting department review.</p>}
    <div className="stack">{newRequests.map(p=>{const suggested=p.suggestedDepartment??p.department,defaultDepartment=fallbackDepartment(p),selected=draftDepartments[p.id]??defaultDepartment,area=affectedAreas.find(item=>item.id===p.affectedArea);return <article key={p.id} className="card-tint" style={{padding:16,borderRadius:14}} data-testid={`intake-request-${p.id}`}>
       <div className="grid-2" style={{alignItems:'start'}}><div><div style={{display:'flex',gap:8,alignItems:'center',flexWrap:'wrap'}}><strong style={{fontSize:20}}>{p.token}</strong><span className="tag pending-review">Pending review</span>{p.helpDeskReview&&<span className="tag">Help Desk review requested</span>}</div><p style={{margin:'7px 0'}}><strong>{p.firstName}, {p.age}</strong> · Registered {new Date(p.registeredAt).toLocaleString()}</p><p style={{margin:'5px 0'}}><strong>Symptoms:</strong> {p.symptoms||'No symptom description provided'}</p><p style={{margin:'5px 0'}}><strong>Affected area:</strong> {area?t(area.label,lang):'Not selected'} · <strong>Duration:</strong> {p.duration??'Not provided'}</p><p style={{margin:'5px 0'}}><strong>Suggested department:</strong> {t(suggested,lang)}{suggested!=='Help Desk'?` · ${suggestedLocation(suggested,lang)}`:''}</p>{p.requestedDepartment&&<p style={{margin:'5px 0'}}><strong>Patient preference:</strong> {t(p.requestedDepartment,lang)}</p>}
       <Btn className="btn-small" onClick={()=>setOpenPatient(openPatient===p.id?null:p.id)} aria-expanded={openPatient===p.id} data-testid={`button-review-${p.id}`}>{openPatient===p.id?'Hide details':'Review patient details'}</Btn>{openPatient===p.id&&<div className="notice notice-blue" style={{marginTop:12}}><div><strong>Patient-provided details</strong><br/>Symptoms: {p.symptoms||'Not provided'}<br/>Area: {area?t(area.label,lang):'Not selected'}<br/>Duration: {p.duration??'Not provided'}<br/>Additional details: {p.additionalDetails||'None provided'}<br/>Optional phone: {p.phone||'Not provided'}</div></div>}
      </div><div className="stack"><div className="field" style={{margin:0}}><label htmlFor={`assign-${p.id}`}>Assign department</label><select id={`assign-${p.id}`} value={selected} onChange={e=>setDraftDepartments(current=>({...current,[p.id]:e.target.value as Department}))} data-testid={`select-assign-${p.id}`}>{departments.map(d=><option key={d} value={d}>{t(d,lang)}{d===suggested?' · Suggested':''}</option>)}</select></div><div className="btn-row"><Btn className="btn-primary btn-small" onClick={()=>confirmSuggested(p)} data-testid={`button-confirm-department-${p.id}`}>Confirm Department</Btn><Btn className="btn-small" onClick={()=>changeDepartment(p)} data-testid={`button-change-department-${p.id}`}>Change Department</Btn></div><Btn className="btn-soft btn-small" onClick={()=>requestHelpDeskReview(p)} data-testid={`button-helpdesk-review-${p.id}`}>Request Help Desk Review</Btn></div></div>
     </article>;})}</div>
   </section>
   <div className="grid-2 staff-queue-layout" style={{alignItems:'start'}}><section className="card"><div className="field" style={{marginTop:0}}><label htmlFor="staff-department">Department</label><select id="staff-department" value={department} onChange={e=>setDepartment(e.target.value as Department)} data-testid="select-staff-department">{departments.map(d=><option key={d}>{d}</option>)}</select></div>
   <div className="grid-3"><div><div className="metric">{current?.token??'—'}</div><div className="metric-label">Current token</div></div><div><div className="metric">{waiting.length}</div><div className="metric-label">Waiting</div></div><div><div className="metric">{Math.max(0,Math.round((waiting.length*departmentMeta[department].average+delay)/5)*5)}m</div><div className="metric-label">Wait estimate</div></div></div>
    <div className="list-row" style={{marginTop:14}}><span><strong>{state.doctors[department]??'Available'}</strong><small className="muted" style={{display:'block'}}>{departmentMeta[department].doctor} · {departmentMeta[department].room}</small></span><div className="field" style={{margin:0}}><label htmlFor="doctor-status" className="sr-only">Doctor status</label><select id="doctor-status" value={state.doctors[department]??'Available'} onChange={e=>setDoctor(e.target.value as DoctorStatus)} data-testid="select-doctor-status"><option>Available</option><option>On Break</option><option>Delayed</option></select></div></div>
   <div className="field"><label htmlFor="delay">Doctor delay: {delay} minutes</label><input id="delay" type="range" min="0" max="60" step="5" value={delay} onChange={e=>setDelay(Number(e.target.value))} data-testid="input-doctor-delay"/></div>
    <div className="btn-row"><Btn className="btn-primary" onClick={callNext} data-testid="button-call-next"><Bell size={17}/>{t('Call Next',lang)}</Btn><Btn onClick={completeCurrent} disabled={!current} data-testid="button-complete-consultation">Complete Consultation</Btn><Btn onClick={()=>current&&advance(current,'no-show')} disabled={!current} data-testid="button-current-no-show">Mark No-Show</Btn></div>
   {notice&&<p role="status" className="notice notice-blue" style={{marginTop:14}}>{notice}</p>}
  </section>
   <section className="card"><h2>Department queue</h2><p className="muted">Names and symptom details appear only in this staff simulation, never on the public board.</p><div className="table-wrap"><table className="staff-queue-table"><thead><tr><th>Token / patient</th><th>Status</th><th>Queue actions</th></tr></thead><tbody>{state.patients.filter(p=>assignedDepartmentFor(p)===department&&p.status!=='served').sort((a,b)=>new Date(a.registeredAt).getTime()-new Date(b.registeredAt).getTime()).map(p=><tr key={p.id} data-testid={`row-patient-${p.id}`}><td><strong>{p.token}</strong><br/><span className="muted">{p.firstName}</span></td><td><span className={`tag ${p.status}`}>{t(p.status==='pending-review'?'Pending staff review':p.status==='no-show'?'No-show':p.status[0].toUpperCase()+p.status.slice(1),lang)}</span></td><td><div className="staff-row-actions"><div className="btn-row">{p.status==='waiting'&&<Btn className="btn-small" onClick={()=>callPatient(p)}>Call</Btn>}<Btn className="btn-small" onClick={()=>moveToEnd(p)}>{t('Move to End',lang)}</Btn><Btn className="btn-small" onClick={()=>advance(p,'no-show')}>{t('No-show',lang)}</Btn>{p.status==='called'&&<Btn className="btn-small" onClick={()=>advance(p,'served')}>Complete Consultation</Btn>}</div><div className="btn-row staff-transfer-actions"><select aria-label={`Transfer ${p.token} to department`} value={transfer===department?departments.find(d=>d!==department):transfer} onChange={e=>setTransfer(e.target.value as Department)} data-testid={`select-transfer-${p.id}`}>{departments.filter(d=>d!==department).map(d=><option key={d}>{d}</option>)}</select><Btn className="btn-small" onClick={()=>transferPatient(p)} data-testid={`button-transfer-${p.id}`}>{t('Transfer Department',lang)}</Btn></div></div></td></tr>)}</tbody></table>{!state.patients.some(p=>assignedDepartmentFor(p)===department&&p.status!=='served')&&<p className="muted">No patients currently in this queue.</p>}</div>
  </section></div>
   <div className="btn-row" style={{marginTop:18}}><Btn onClick={addDemoPatients} data-testid="button-add-demo-patients">Add 20 fictional patients</Btn><Btn onClick={reset} className={confirmReset?'btn-danger':''} data-testid="button-reset-demo"><RotateCcw size={16}/>{confirmReset?'Confirm reset':'Reset demo'}</Btn>{confirmReset&&<Btn className="btn-small" onClick={()=>setConfirmReset(false)}>Cancel reset</Btn>}</div>
 </div>;
}

function Board({state,lang}:SharedProps) {
 const roomGroups=departments.map(d=>({department:d,meta:departmentMeta[d],patients:state.patients.filter(p=>assignedDepartmentFor(p)===d&&['waiting','called'].includes(p.status)).sort((a,b)=>new Date(a.registeredAt).getTime()-new Date(b.registeredAt).getTime())}));
 const announce=(token:string,room:string)=>speak(`Token ${token}, please come to ${room}.`);
  return <div className="tv-mode"><div className="tv-header"><div><div className="eyebrow" style={{color:'#80d4cc'}}>CITY DISTRICT HOSPITAL · OPD</div><h1 style={{margin:'6px 0'}}>Queue board</h1></div><div className="btn-row"><Link href="/" className="btn">Patient home</Link></div></div>
  <div className="tv-board-grid">{roomGroups.map(({department,meta,patients})=>{const current=patients.find(p=>p.status==='called'),next=patients.filter(p=>p.status==='waiting').slice(0,3);return <section className="tv-room" key={department} data-testid={`board-room-${departmentMeta[department].prefix}`}><div style={{display:'flex',justifyContent:'space-between',gap:10}}><h2 style={{fontSize:20,margin:0}}>{t(department,lang)}</h2><span style={{color:'#b4cbd1'}}>{meta.room}</span></div><div className="board-calling-label" data-testid={`status-board-calling-${departmentMeta[department].prefix}`}>NOW CALLING</div><div className="tv-token" data-testid={`board-current-${departmentMeta[department].prefix}`}>{current?.token??'—'}</div>{current&&<button className="btn btn-small" style={{marginTop:8}} onClick={()=>announce(current.token,meta.room)} data-testid={`button-announce-${current.id}`}><Volume2 size={16}/>Announce</button>}
    <div style={{borderTop:'1px solid #355869',marginTop:20,paddingTop:16}}><div style={{display:'flex',justifyContent:'space-between',marginBottom:12}}><strong>Next tokens</strong><span style={{color:'#bdd1d7'}}>Delay {state.delays[department]||0} min</span></div>{[0,1,2].map(i=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'9px 0',borderBottom:'1px solid #29495a',fontSize:19}}><span style={{color:'#b6cbd2'}}>#{i+1}</span><strong>{next[i]?.token??'—'}</strong></div>)}</div>
  </section>;})}</div>
 </div>;
}

function Router({state,update,lang}:{state:HospitalState;update:(fn:(s:HospitalState)=>HospitalState)=>void;lang:Lang}) {
 const [path]=useLocation();
 return <ErrorBoundary resetKey={path}><Shell lang={lang}><Switch>
   <Route path="/"><Home state={state} update={update} lang={lang}/></Route>
   <Route path="/register"><Registration state={state} update={update} lang={lang}/></Route>
   <Route path="/slip"><Slip state={state} update={update} lang={lang}/></Route>
   <Route path="/queue"><Queue state={state} update={update} lang={lang}/></Route>
   <Route path="/navigate"><Navigate state={state} update={update} lang={lang}/></Route>
   <Route path="/assistant"><Assistant state={state} update={update} lang={lang}/></Route>
   <Route path="/staff"><Staff state={state} update={update} lang={lang}/></Route>
   <Route path="/board"><Board state={state} update={update} lang={lang}/></Route>
   <Route component={NotFound}/>
  </Switch></Shell></ErrorBoundary>;
}
function App() {
 const [state,update]=useHospitalState();const lang:Lang='en';
 return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/,'')}><Router state={state} update={update} lang={lang}/></WouterRouter><Toaster/></TooltipProvider></QueryClientProvider>;
}
export default App;
