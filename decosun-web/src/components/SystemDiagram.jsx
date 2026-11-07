const labels = {
  "cortinas-roller": ["Una tela", "La tela se enrolla sobre un tubo."],
  "roller-doble": ["Dos telas independientes", "Dos cortinas permiten alternar funciones."],
  "roller-duo": ["Franjas que se superponen", "Dos capas de una tela de franjas regulan el paso de luz."],
  "persianas-verticales": ["Láminas orientables", "Las láminas verticales giran para dirigir la luz."],
  "toldos-proyectantes": ["Sombra proyectada", "La lona se despliega hacia el exterior."],
  "toldos-verticales": ["Descenso vertical", "La lona baja frente al espacio que se evalúa proteger."],
}

export default function SystemDiagram({ type, name }) {
  const [label, explanation] = labels[type]
  const vertical = type === "toldos-verticales"
  const exterior = type === "toldos-proyectantes" || vertical
  return <figure className="system-diagram"><svg viewBox="0 0 360 210" role="img" aria-label={`${name}: ${explanation}`}>
    <title>{name}: {explanation}</title>
    <path d="M24 180H336" stroke="#cbd5e1" strokeWidth="1" />
    {!exterior && <><rect x="98" y="30" width="164" height="150" rx="4" fill="white" stroke="#cbd5e1" strokeWidth="4" /><path d="M180 34V178M102 105H258" stroke="#e2e8f0" strokeWidth="2" /></>}
    {type === "cortinas-roller" && <><rect x="91" y="30" width="178" height="12" rx="6" fill="#0f172a" /><rect x="99" y="44" width="162" height="93" fill="#fbbf24" fillOpacity=".25" /><rect x="96" y="134" width="168" height="7" rx="3" fill="#475569" /><path d="M287 61V127M281 119L287 127L293 119" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" /><circle cx="260" cy="36" r="4" fill="#fbbf24" /></>}
    {type === "roller-doble" && <><rect x="87" y="23" width="178" height="12" rx="6" fill="#64748b" /><rect x="94" y="37" width="162" height="128" fill="#94a3b8" fillOpacity=".22" /><rect x="92" y="163" width="165" height="6" rx="2" fill="#64748b" /><rect x="103" y="43" width="178" height="12" rx="6" fill="#0f172a" /><rect x="111" y="57" width="162" height="48" fill="#fbbf24" fillOpacity=".55" /><rect x="108" y="103" width="168" height="7" rx="3" fill="#0f172a" /><path d="M72 45V152M66 144L72 152L78 144M298 66V99M292 91L298 99L304 91" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" /></>}
    {type === "roller-duo" && <><rect x="91" y="30" width="178" height="12" rx="6" fill="#0f172a" /><rect x="99" y="43" width="162" height="120" fill="#f1f5f9" />{[0,1,2,3,4].map(i => <g key={i}><rect x="99" y={44+i*24} width="162" height="12" fill="#94a3b8" fillOpacity=".55" /><rect x="103" y={49+i*24} width="158" height="12" fill="#fbbf24" fillOpacity=".5" /></g>)}<rect x="96" y="164" width="168" height="7" rx="3" fill="#475569" /><path d="M287 71V140M281 132L287 140L293 132M281 79L287 71L293 79" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" /></>}
    {type === "persianas-verticales" && <><rect x="91" y="30" width="178" height="10" rx="4" fill="#0f172a" />{[0,1,2,3,4,5,6].map(i => <g key={i}><path d={`M${101+i*23} 44L${116+i*23} 49V164L${101+i*23} 159Z`} fill={i % 2 ? "#cbd5e1" : "#e2e8f0"} stroke="#94a3b8" /><path d={`M${104+i*23} 46V159`} stroke="white" /></g>)}<path d="M290 90C317 90 317 120 291 120M297 114L289 120L297 126" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" /></>}
    {type === "toldos-proyectantes" && <><path d="M91 35V179" stroke="#94a3b8" strokeWidth="8" /><path d="M99 56L268 104L252 116L99 70Z" fill="#fbbf24" fillOpacity=".7" stroke="#b45309" strokeWidth="1.5" /><path d="M105 103L166 144L253 114M166 144L181 94" stroke="#475569" strokeWidth="4" fill="none" strokeLinecap="round" /><path d="M109 178H282L252 120Z" fill="#fbbf24" fillOpacity=".1" /><path d="M183 52L255 72M247 64L257 73L245 76" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" /></>}
    {vertical && <><path d="M97 38V179M263 38V179M97 38H263" stroke="#94a3b8" strokeWidth="5" fill="none" /><rect x="91" y="32" width="178" height="12" rx="6" fill="#0f172a" /><rect x="101" y="45" width="158" height="102" fill="#fbbf24" fillOpacity=".25" /><rect x="98" y="145" width="164" height="7" rx="3" fill="#475569" /><path d="M287 64V137M281 129L287 137L293 129" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" /><path d="M110 164H250" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 5" /></>}
  </svg><figcaption><strong>{label}</strong><span>Esquema de funcionamiento · Referencial</span></figcaption></figure>
}
