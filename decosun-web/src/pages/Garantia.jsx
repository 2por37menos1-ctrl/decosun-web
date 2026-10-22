import BrandSupport from "../components/BrandSupport"
import WhatsAppButton from "../components/WhatsAppButton"

export default function Garantia() {
  return <main className="bg-white text-slate-950">
    <section className="bg-slate-950 px-6 pb-16 pt-32 text-white lg:pt-40"><div className="mx-auto max-w-5xl"><p className="font-bold text-amber-400">GARANTÍA Y POSTVENTA</p><h1 className="mt-5 text-4xl font-black sm:text-5xl">Tu proyecto, con respaldo DecoSun</h1><p className="mt-6 text-lg leading-8 text-slate-300">Cortinas y motores con 5 años de garantía. Instalación con 1 año de garantía. Los mismos plazos en las ciudades atendidas por nuestra red.</p></div></section>
    <BrandSupport />
    <section className="mx-auto max-w-5xl px-6 py-16"><h2 className="text-3xl font-black">¿Necesitas atención de postventa?</h2><p className="mt-5 leading-8 text-slate-600">Contacta a DecoSun indicando tu ciudad, el producto instalado y una descripción de lo ocurrido. Si dispones de fotografías y antecedentes de la compra o instalación, compártelos directamente con nuestro equipo para revisar tu caso y coordinar la atención.</p><p className="mt-4 leading-7 text-slate-600">Si motorizamos una cortina que ya tenías, la garantía de la nueva intervención corresponde al motor suministrado y a su instalación. No otorga una nueva garantía a la cortina existente.</p><WhatsAppButton inline className="mt-8" message="Hola DecoSun, necesito atención de postventa. Quiero compartir mi ciudad y los antecedentes de mi instalación.">Solicitar atención de postventa</WhatsAppButton></section>
  </main>
}
