'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import {
  Users,
  CreditCard,
  Target,
  Bell,
  Shield,
  GraduationCap,
  CheckCircle,
  Star,
  ArrowRight,
  Smartphone,
  TrendingUp,
  DollarSign,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function HomePage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (session) {
    return null
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              <Image
                src="/logo.png"
                alt="FamFinz Logo"
                width={200}
                height={97}
                className="h-10 w-auto"
              />
            </div>
            <nav className="hidden md:flex space-x-8">
              <Link href="#caracteristicas" className="text-gray-600 hover:text-primary transition-colors">
                Características
              </Link>
              <Link href="#testimonios" className="text-gray-600 hover:text-primary transition-colors">
                Testimonios
              </Link>
              <Link href="#precios" className="text-gray-600 hover:text-primary transition-colors">
                Precios
              </Link>
              <Link href="#faq" className="text-gray-600 hover:text-primary transition-colors">
                FAQ
              </Link>
            </nav>
            <div className="flex items-center space-x-4">
              <Link href="/signin">
                <Button variant="ghost" className="hidden sm:inline-flex">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/signup">
                <Button>Comenzar Gratis</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/5 via-white to-emerald-50 py-20 lg:py-32">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                  🇨🇴 Especializado para familias colombianas
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Gestiona las finanzas de tu familia{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-emerald-500">
                    juntos
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  La primera plataforma colombiana que permite a toda tu familia colaborar en la gestión financiera.
                  Conecta tu Bancolombia, registra gastos en efectivo y mantén a todos informados.
                </p>
              </div>
              <div className="flex justify-center">
                <Link href="/signup">
                  <Button size="lg" className="text-lg px-8 py-4">
                    Comienza tu gestión familiar
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>
              <div className="flex items-center justify-center space-x-8 text-sm text-gray-500">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Beta cerrada</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Acceso exclusivo</span>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="relative z-10">
                <div className="w-full h-96 bg-gradient-to-br from-primary/10 to-emerald-100 rounded-2xl shadow-2xl flex items-center justify-center">
                  <div className="text-center">
                    <DollarSign className="w-24 h-24 text-primary mx-auto mb-4" />
                    <p className="text-gray-600 text-lg">Dashboard Preview</p>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 w-72 h-72 bg-gradient-to-r from-blue-400 to-green-400 rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute -bottom-4 -left-4 w-72 h-72 bg-gradient-to-r from-orange-400 to-yellow-400 rounded-full opacity-20 blur-3xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Características Principales */}
      <section id="caracteristicas" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
              Todo lo que tu familia necesita para gestionar sus finanzas
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Diseñado específicamente para familias colombianas que quieren tomar control de sus finanzas de manera
              colaborativa
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Gestión Familiar */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-xl">Gestión Familiar Colaborativa</CardTitle>
                <CardDescription className="text-base">
                  Invita a todos los miembros de tu familia y asigna roles específicos para mantener el control y la
                  transparencia.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Roles: Administrador, Miembro, Observador</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Invitaciones por email</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Múltiples familias por usuario</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Seguimiento Dual */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <CreditCard className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-xl">Seguimiento Automático + Manual</CardTitle>
                <CardDescription className="text-base">
                  Conecta tu Bancolombia para transacciones automáticas y registra gastos en efectivo manualmente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Integración con Bancolombia</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Registro manual de efectivo</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Categorización automática</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Presupuestos Inteligentes */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
                <CardTitle className="text-xl">Presupuestos Inteligentes</CardTitle>
                <CardDescription className="text-base">
                  Crea plantillas reutilizables y recibe alertas cuando te acerques a los límites de gasto.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Plantillas reutilizables</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Generación automática mensual</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Alertas inteligentes</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Recordatorios */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Bell className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle className="text-xl">Recordatorios Automatizados</CardTitle>
                <CardDescription className="text-base">
                  Nunca olvides un pago importante con nuestro sistema de recordatorios inteligente.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Notificaciones de pagos pendientes</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Calendario visual integrado</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Emails automáticos familiares</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Seguridad */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-red-600" />
                </div>
                <CardTitle className="text-xl">Seguridad Bancaria</CardTitle>
                <CardDescription className="text-base">
                  Protección de nivel bancario con encriptación de extremo a extremo y autenticación de dos factores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Encriptación de extremo a extremo</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Autenticación de dos factores</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Certificación ISO 27001</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Educación Financiera */}
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
                  <GraduationCap className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-xl">Educación Financiera</CardTitle>
                <CardDescription className="text-base">
                  Enseña a tus hijos sobre finanzas de manera práctica con herramientas educativas integradas.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Cuentas para menores supervisadas</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Metas de ahorro familiares</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Reportes educativos</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Beneficios Específicos */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Diseñado para familias colombianas</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Entendemos las necesidades únicas de las familias en Colombia
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Elimina el "quién pagó qué" en tu familia
                  </h3>
                  <p className="text-gray-600">
                    Todos los miembros pueden ver quién pagó cada gasto y mantener la transparencia total en las
                    finanzas familiares.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Conecta tu cuenta de Bancolombia automáticamente
                  </h3>
                  <p className="text-gray-600">
                    Integración directa y segura con el banco más grande de Colombia para importar transacciones
                    automáticamente.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-5 h-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No pierdas de vista el efectivo</h3>
                  <p className="text-gray-600">
                    Registra fácilmente gastos en efectivo que no aparecen en el banco, desde el almuerzo hasta el
                    transporte público.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <CheckCircle className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Enseña finanzas a tus hijos de forma práctica
                  </h3>
                  <p className="text-gray-600">
                    Involucra a los más jóvenes en la gestión financiera familiar con herramientas educativas apropiadas
                    para su edad.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="w-full h-80 bg-gradient-to-br from-emerald-100 to-primary/10 rounded-2xl shadow-xl flex items-center justify-center">
                <div className="text-center">
                  <Users className="w-20 h-20 text-emerald-600 mx-auto mb-4" />
                  <p className="text-gray-600 text-lg">Dashboard Familiar</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">Preguntas frecuentes</h2>
            <p className="text-xl text-gray-600">Resolvemos las dudas más comunes sobre FinanFamilia</p>
          </div>

          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem value="seguridad" className="bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left">¿Qué tan segura es la conexión con mi banco?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Utilizamos la misma tecnología de seguridad que los bancos más grandes del mundo. Toda la información
                  se encripta de extremo a extremo y nunca almacenamos tus credenciales bancarias. Trabajamos con Belvo,
                  una plataforma certificada y regulada para conexiones bancarias en América Latina.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="privacidad" className="bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left">
                  ¿Pueden otros miembros de la familia ver toda mi información?
                </AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Tú tienes control total sobre qué información compartes. Como administrador, puedes configurar qué
                  pueden ver los diferentes miembros. Los observadores solo ven resúmenes, los miembros pueden ver
                  gastos compartidos, y solo los administradores tienen acceso completo.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="bancos" className="bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left">¿Solo funciona con Bancolombia?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Actualmente tenemos integración completa con Bancolombia, pero estamos trabajando para agregar Banco
                  de Bogotá, Davivienda, y BBVA Colombia. Mientras tanto, puedes registrar transacciones de cualquier
                  banco manualmente.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="invitacion" className="bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left">¿Cómo invito a mi familia?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Es muy fácil. Desde tu panel de control, haces clic en "Invitar miembro", ingresas su email y
                  seleccionas su rol (Administrador, Miembro, o Observador). Ellos recibirán un email con instrucciones
                  para unirse a la familia.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="costo" className="bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left">¿Hay costos ocultos o comisiones adicionales?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  No, somos completamente transparentes. El precio que ves es el precio que pagas. No cobramos
                  comisiones por transacciones, no hay costos de configuración, y puedes cancelar en cualquier momento
                  sin penalidades.
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="datos" className="bg-white rounded-lg px-6">
                <AccordionTrigger className="text-left">¿Qué pasa con mis datos si cancelo?</AccordionTrigger>
                <AccordionContent className="text-gray-600">
                  Puedes exportar todos tus datos en cualquier momento. Si cancelas, mantenemos tus datos por 90 días
                  por si cambias de opinión, después de eso los eliminamos permanentemente de nuestros servidores.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-20 bg-gradient-to-r from-primary to-emerald-500">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-6">
              Comienza a gestionar las finanzas de tu familia hoy
            </h2>
            <p className="text-xl text-primary-foreground/80 mb-8">
              Únete a miles de familias colombianas que ya están tomando control de sus finanzas de manera colaborativa
            </p>
            <div className="flex justify-center">
              <Link href="/signup">
                <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
                  Invita a tu familia hoy
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Image
                  src="/logo.png"
                  alt="FamFinz Logo"
                  width={120}
                  height={40}
                  className="h-8 w-auto"
                />
              </div>
              <p className="text-gray-400">
                La plataforma de gestión financiera familiar diseñada especialmente para Colombia.
              </p>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Producto</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#caracteristicas" className="hover:text-white transition-colors">
                    Características
                  </Link>
                </li>
                <li>
                  <Link href="#precios" className="hover:text-white transition-colors">
                    Precios
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Seguridad
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Soporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Centro de Ayuda
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Contacto
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Términos de Servicio
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400">© 2025 FamFinz. Todos los derechos reservados.</p>
            <div className="flex items-center mt-4 md:mt-0">
              <span className="text-gray-400 text-sm">Hecho con ❤️ en Colombia</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}