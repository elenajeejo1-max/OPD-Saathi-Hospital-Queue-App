export type Place={id:string;name:string;floor:number};
export const places:Place[]=[
 {id:'entrance',name:'Main entrance',floor:0},{id:'registration',name:'Registration',floor:0},{id:'help',name:'Help desk',floor:0},{id:'emergency',name:'Emergency / Casualty',floor:0},{id:'pharmacy',name:'Pharmacy',floor:0},{id:'lab',name:'Laboratory',floor:0},{id:'xray',name:'X-ray',floor:0},{id:'toilets-g',name:'Toilets',floor:0},{id:'water',name:'Drinking water',floor:0},{id:'wheelchair',name:'Wheelchair point',floor:0},{id:'lift-g',name:'Lift',floor:0},{id:'stairs-g',name:'Stairs',floor:0},{id:'ramp',name:'Ramp',floor:0},
 ...Array.from({length:8},(_,i)=>({id:`room${i+1}`,name:`Department room ${i+1}`,floor:1})),{id:'waiting',name:'OPD waiting hall',floor:1},{id:'lift-1',name:'Lift',floor:1},{id:'stairs-1',name:'Stairs',floor:1},
 ...[4,5,6].map(n=>({id:`ward${n}`,name:`Ward ${n}`,floor:2})),{id:'nurses',name:'Nurses’ station',floor:2},{id:'lift-2',name:'Lift',floor:2},{id:'stairs-2',name:'Stairs',floor:2}
];
type Edge=[string,string,number,boolean];
const edges:Edge[]=[
 ['entrance','registration',1,false],['registration','help',1,false],['help','emergency',2,false],['help','pharmacy',2,false],['registration','lab',2,false],['lab','xray',1,false],['registration','toilets-g',1,false],['help','water',1,false],['entrance','wheelchair',1,false],['entrance','ramp',1,false],['ramp','lift-g',2,false],['registration','lift-g',2,false],['registration','stairs-g',2,true],
 ['lift-g','lift-1',3,false],['stairs-g','stairs-1',3,true],['lift-1','waiting',1,false],['waiting','room1',1,false],['waiting','room2',1,false],['waiting','room3',1,false],['waiting','room4',1,false],['waiting','room5',1,false],['waiting','room6',1,false],['waiting','room7',1,false],['waiting','room8',1,false],['lift-1','room1',2,false],
 ['lift-1','lift-2',3,false],['stairs-1','stairs-2',3,true],['lift-2','ward4',1,false],['lift-2','ward5',1,false],['lift-2','ward6',1,false],['ward4','nurses',1,false],['ward5','nurses',1,false],['ward6','nurses',1,false]
];
export function shortestRoute(from:string,to:string,avoidStairs=false):string[] {
 const dist:Record<string,number>={},prev:Record<string,string>={},unvisited=new Set(places.map(p=>p.id));
 places.forEach(p=>dist[p.id]=Infinity);dist[from]=0;
 while(unvisited.size){let node:string|undefined;for(const id of unvisited)if(node===undefined||dist[id]<dist[node])node=id;if(!node||dist[node]===Infinity)break;unvisited.delete(node);if(node===to)break;
  edges.forEach(([a,b,w,stairs])=>{if(avoidStairs&&stairs)return;const next=a===node?b:b===node?a:'';if(next&&unvisited.has(next)&&dist[node]+w<dist[next]){dist[next]=dist[node]+w;prev[next]=node;}});
 }
 if(from!==to&&!prev[to])return [];const path=[to];while(path[0]!==from)path.unshift(prev[path[0]]);return path;
}
export function directions(path:string[]) {
 const names=path.map(id=>places.find(p=>p.id===id)?.name??id);
 return names.slice(1).map((name,i)=>`From ${names[i]}, continue to ${name}${places.find(p=>p.id===path[i+1])?.floor!==places.find(p=>p.id===path[i])?.floor?`. Go to floor ${places.find(p=>p.id===path[i+1])?.floor===0?'Ground':places.find(p=>p.id===path[i+1])?.floor===1?'First':'Second'} using the lift.`:'.'}`);
}
