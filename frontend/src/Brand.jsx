export default function Brand({variant='compact',tone='light',className=''}) {
  return <img className={`brand-asset ${className}`} src={`/branding/siaset-${variant==='icon'?'monogram':`logo-${variant}`}-${tone}.svg`} width={variant==='full'?780:variant==='icon'?256:360} height={variant==='full'?190:variant==='icon'?256:104} alt={variant==='full'?'SiaSet — Transposable Elements Virtual Laboratory':'SiaSet'}/>;
}
