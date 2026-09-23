import type { ProductUnit, UserRole } from "@/lib/domain";

/** Usuarios demo (uno por rol). Las contraseñas se muestran en la pantalla de login. */
export const DEMO_USERS: { name: string; email: string; password: string; role: UserRole }[] = [
  { name: "Ana Torres", email: "admin@stockpilot.dev", password: "Admin123!", role: "ADMIN" },
  {
    name: "Luis Medina",
    email: "manager@stockpilot.dev",
    password: "Manager123!",
    role: "MANAGER",
  },
  {
    name: "Carla Rojas",
    email: "operator@stockpilot.dev",
    password: "Operator123!",
    role: "OPERATOR",
  },
];

export interface CategorySeed {
  code: string;
  name: string;
  description: string;
  /** Rango de costo unitario típico [min, max] en USD. */
  costRange: [number, number];
}

export const CATEGORIES: CategorySeed[] = [
  {
    code: "HER",
    name: "Herramientas",
    description: "Herramientas manuales y eléctricas para construcción y taller.",
    costRange: [4, 180],
  },
  {
    code: "ELE",
    name: "Electricidad",
    description: "Cables, protecciones, accesorios y equipos eléctricos.",
    costRange: [1, 60],
  },
  {
    code: "PLO",
    name: "Plomería",
    description: "Tuberías, conexiones, grifería y bombas de agua.",
    costRange: [0.5, 140],
  },
  {
    code: "PIN",
    name: "Pinturas",
    description: "Pinturas, esmaltes, barnices y accesorios para pintar.",
    costRange: [1.5, 75],
  },
  {
    code: "JAR",
    name: "Jardinería",
    description: "Herramientas y suministros para jardín y exteriores.",
    costRange: [2, 160],
  },
  {
    code: "SEG",
    name: "Seguridad industrial",
    description: "Equipos de protección personal y señalización.",
    costRange: [1, 55],
  },
  {
    code: "LIM",
    name: "Limpieza",
    description: "Productos e implementos de limpieza profesional.",
    costRange: [1, 18],
  },
  {
    code: "ILU",
    name: "Iluminación",
    description: "Luminarias LED, reflectores y accesorios de iluminación.",
    costRange: [1.5, 65],
  },
];

export interface SupplierSeed {
  name: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  /** Códigos de categoría que abastece. */
  categories: string[];
}

export const SUPPLIERS: SupplierSeed[] = [
  {
    name: "Ferretería Industrial del Sur S.A.",
    contactName: "Marcos Villalba",
    email: "ventas@fisur.com",
    phone: "+54 11 4321-7788",
    address: "Av. Rivadavia 4520, Buenos Aires",
    taxId: "30-71234567-9",
    categories: ["HER", "SEG"],
  },
  {
    name: "Distribuidora Eléctrica Andina",
    contactName: "Paola Guzmán",
    email: "pedidos@electroandina.com",
    phone: "+56 2 2345 6789",
    address: "Camino Melipilla 1200, Santiago",
    taxId: "76.543.210-K",
    categories: ["ELE", "ILU"],
  },
  {
    name: "Tubos y Conexiones del Pacífico",
    contactName: "Jorge Salazar",
    email: "contacto@tubopacifico.pe",
    phone: "+51 1 555 0192",
    address: "Av. Argentina 2890, Callao",
    taxId: "20512345678",
    categories: ["PLO"],
  },
  {
    name: "Pinturas Colorama Ltda.",
    contactName: "Verónica Ibáñez",
    email: "comercial@colorama.co",
    phone: "+57 1 744 5566",
    address: "Calle 13 # 68-45, Bogotá",
    taxId: "900.123.456-7",
    categories: ["PIN"],
  },
  {
    name: "Verde Campo Insumos",
    contactName: "Rodrigo Peña",
    email: "ventas@verdecampo.com.ar",
    phone: "+54 341 425-9900",
    address: "Bv. Oroño 1850, Rosario",
    taxId: "30-69876543-2",
    categories: ["JAR"],
  },
  {
    name: "ProtecLab EPP",
    contactName: "Daniela Fuentes",
    email: "info@proteclab.cl",
    phone: "+56 9 8765 4321",
    address: "Los Cerrillos 3400, Santiago",
    taxId: "77.889.001-3",
    categories: ["SEG"],
  },
  {
    name: "Química Limpia S.R.L.",
    contactName: "Esteban Cárdenas",
    email: "ventas@quimicalimpia.com",
    phone: "+591 3 352 7788",
    address: "Av. Banzer km 6, Santa Cruz",
    taxId: "1023456019",
    categories: ["LIM"],
  },
  {
    name: "LumiTech Iluminación",
    contactName: "Natalia Ferreira",
    email: "sales@lumitech.uy",
    phone: "+598 2 604 1122",
    address: "Av. Italia 3520, Montevideo",
    taxId: "215678900012",
    categories: ["ILU", "ELE"],
  },
  {
    name: "Importadora Herramientas Pro",
    contactName: "Sebastián Molina",
    email: "ventas@herrapro.ec",
    phone: "+593 4 260 3344",
    address: "Av. Juan Tanca Marengo km 2, Guayaquil",
    taxId: "0992345678001",
    categories: ["HER", "JAR"],
  },
  {
    name: "Comercial Multiabasto",
    contactName: "Lucía Herrera",
    email: "pedidos@multiabasto.com",
    phone: "+595 21 555 123",
    address: "Ruta 2 km 14, Capiatá",
    taxId: "80012345-6",
    categories: ["LIM", "PIN", "PLO"],
  },
];

export const WAREHOUSES = [
  { code: "CEN", name: "Almacén Central", address: "Parque Industrial Norte, Nave 4" },
  { code: "NOR", name: "Sucursal Norte", address: "Av. Libertador 2200" },
  { code: "SUR", name: "Sucursal Sur", address: "Ruta 5 km 18, local 3" },
] as const;

export interface ProductTemplate {
  category: string;
  name: string;
  unit?: ProductUnit;
}

const p = (category: string, names: string[]): ProductTemplate[] =>
  names.map((name) => ({ category, name }));

export const PRODUCT_TEMPLATES: ProductTemplate[] = [
  ...p("HER", [
    "Taladro percutor 650W",
    'Amoladora angular 4 1/2" 850W',
    'Sierra circular 7 1/4" 1400W',
    "Martillo de uña 16 oz",
    "Juego de destornilladores 12 piezas",
    'Llave ajustable 10"',
    'Caja de herramientas plástica 20"',
    'Nivel de aluminio 24"',
    "Cinta métrica 8 m",
    'Alicate universal 8"',
    'Serrucho carpintero 20"',
    "Juego de llaves combinadas 14 piezas",
    "Lijadora orbital 200W",
    "Atornillador inalámbrico 12V",
    "Escalera de aluminio 6 peldaños",
    "Pistola de calor 2000W",
    "Juego de brocas 25 piezas",
    'Prensa de banco 6"',
    "Cúter profesional 18 mm",
    "Flexómetro 5 m",
    "Compresor de aire 24 L",
    "Soldadora inverter 200A",
    "Hidrolavadora 1600W",
    'Esmeril de banco 6"',
  ]),
  ...p("ELE", [
    "Cable THHN 12 AWG rollo 100 m",
    "Cable THHN 14 AWG rollo 100 m",
    "Interruptor sencillo",
    "Tomacorriente doble con tierra",
    "Breaker termomagnético 20A",
    "Breaker termomagnético 32A",
    "Cinta aislante 20 m",
    "Caja octagonal metálica",
    'Tubo conduit PVC 3/4" 3 m',
    "Extensión eléctrica 10 m",
    "Multímetro digital",
    "Regleta 6 tomas con interruptor",
    "Timbre inalámbrico",
    "Fotocélula 10A",
    "Contactor 25A",
    "Canaleta 20x10 mm 2 m",
    "Terminal ojo 10-12 AWG caja 100",
    "Probador de voltaje",
    "Temporizador digital",
    "Interruptor doble",
  ]),
  ...p("PLO", [
    'Tubo PVC 1/2" 3 m',
    'Tubo PVC 3/4" 3 m',
    'Codo PVC 1/2" 90 grados',
    'Tee PVC 1/2"',
    'Llave de paso 1/2"',
    "Grifería monomando lavabo",
    "Mezcladora de ducha",
    "Flotador para tanque",
    "Cinta teflón 12 m",
    "Pegamento PVC 250 ml",
    "Sifón para lavabo",
    "Manguera flexible 40 cm",
    'Válvula check 1"',
    "Bomba de agua 1/2 HP",
    "Tanque de agua 1000 L",
    "Calentador eléctrico 50 L",
    "Destapador de cañería",
    'Llave stillson 14"',
    "Ducha eléctrica 5500W",
    'Reducción PVC 3/4" a 1/2"',
  ]),
  ...p("PIN", [
    "Pintura látex interior blanco 4 L",
    "Pintura látex interior blanco 20 L",
    "Esmalte sintético negro 1 L",
    "Esmalte sintético blanco 1 L",
    "Sellador acrílico 4 L",
    "Thinner 1 L",
    'Rodillo 9" lana',
    'Brocha 2"',
    'Brocha 4"',
    "Lija de agua #220",
    "Masilla plástica 1 kg",
    "Cinta de enmascarar 24 mm",
    "Barniz marino 1 L",
    "Pintura anticorrosiva 1 L",
    "Bandeja para rodillo",
    "Removedor de pintura 500 ml",
    "Pintura para pisos 4 L",
    'Espátula 3"',
  ]),
  ...p("JAR", [
    "Manguera de jardín 20 m",
    "Pistola de riego 7 funciones",
    "Tijera de podar",
    "Pala redonda con mango",
    "Rastrillo metálico 14 dientes",
    "Carretilla 65 L",
    "Cortacésped eléctrico 1200W",
    "Desmalezadora eléctrica 500W",
    "Fertilizante granulado 1 kg",
    "Sustrato universal 20 L",
    "Maceta plástica 30 cm",
    "Aspersor giratorio",
    "Guantes de jardín",
    'Machete 18"',
    "Regadera 10 L",
    "Malla sombra 80% rollo 4x10 m",
    'Motosierra 16" 2000W',
    "Tierra abonada 50 L",
  ]),
  ...p("SEG", [
    "Casco de seguridad",
    "Lentes de protección claros",
    "Guantes de nitrilo par",
    "Guantes de carnaza par",
    "Botas punta de acero T42",
    "Chaleco reflectivo",
    "Arnés de seguridad 4 argollas",
    "Mascarilla N95 caja 20",
    "Protector auditivo tipo copa",
    "Extintor PQS 10 lb",
    "Señal de evacuación fotoluminiscente",
    "Cinta de peligro 300 m",
    "Botiquín primeros auxilios",
    "Faja lumbar",
    "Careta para soldar",
    "Cono de seguridad 70 cm",
  ]),
  ...p("LIM", [
    "Detergente líquido 5 L",
    "Cloro 4 L",
    "Desinfectante 5 L",
    "Escoba plástica",
    "Trapeador de microfibra",
    "Balde con exprimidor 12 L",
    "Bolsas de basura 90x120 paquete 10",
    "Papel toalla paquete 6",
    "Jabón líquido para manos 5 L",
    "Esponja multiuso paquete 6",
    "Limpiavidrios 1 L",
    "Desengrasante 1 L",
    "Guantes de látex par",
    "Cepillo de mano",
    "Alcohol 70% 1 L",
    "Aromatizante 400 ml",
    "Cera para pisos 1 L",
    "Escobillón",
  ]),
  ...p("ILU", [
    "Foco LED 9W E27",
    "Foco LED 12W E27",
    "Tubo LED T8 18W",
    "Panel LED 18W redondo",
    "Reflector LED 50W",
    "Reflector LED 100W",
    "Lámpara colgante industrial",
    "Tira LED 5 m RGB",
    "Sensor de movimiento",
    "Luz de emergencia LED",
    "Foco solar 100W",
    "Lámpara de escritorio LED",
    "Dicroico LED GU10 5W",
    "Lámpara de pared exterior",
    "Cinta LED 5 m blanco cálido",
    "Regulador dimmer",
  ]),
];

/**
 * Estima el nivel de precio de un producto dentro del rango de su categoría a partir
 * de palabras clave del nombre, para que un cúter no cueste lo mismo que un compresor.
 * Devuelve la fracción [desde, hasta] del rango de costo de la categoría.
 */
export function costTier(name: string): [number, number] {
  const lower = name.toLowerCase();
  const premium = [
    "compresor",
    "soldadora",
    "hidrolavadora",
    "motosierra",
    "cortacésped",
    "desmalezadora",
    "taladro",
    "amoladora",
    "sierra circular",
    "lijadora",
    "atornillador",
    "esmeril",
    "escalera",
    "carretilla",
    "bomba de agua",
    "tanque de agua",
    "calentador",
    "ducha eléctrica",
    "extintor",
    "arnés",
    "botas",
    "multímetro",
    "contactor",
    "reflector led 100w",
    "lámpara colgante",
    "foco solar",
    "20 l",
    "rollo 100 m",
    "grifería",
    "mezcladora",
  ];
  const cheap = [
    "cinta",
    "brocha",
    "lija",
    "codo",
    "tee",
    "foco led",
    "dicroico",
    "guantes",
    "esponja",
    "cepillo",
    "interruptor",
    "tomacorriente",
    "caja octagonal",
    "terminal",
    "sifón",
    "flotador",
    "reducción",
    "pegamento",
    "bandeja",
    "espátula",
    "maceta",
    "regadera",
    "lentes",
    "mascarilla",
    "señal",
    "cono",
    "escoba",
    "escobillón",
    "trapeador",
    "balde",
    "bolsas",
    "papel",
    "cloro",
    "alcohol",
    "aromatizante",
    "cera",
    "limpiavidrios",
    "desengrasante",
    "detergente",
    "desinfectante",
    "jabón",
    "cúter",
    "flexómetro",
    "probador",
    "timbre",
    "canaleta",
    "regulador",
    "sensor",
    "manguera flexible",
  ];
  if (premium.some((keyword) => lower.includes(keyword))) return [0.45, 1];
  if (cheap.some((keyword) => lower.includes(keyword))) return [0, 0.12];
  return [0.1, 0.45];
}

/** Deduce la unidad de medida a partir del nombre del producto. */
export function inferUnit(name: string): ProductUnit {
  const lower = name.toLowerCase();
  if (lower.endsWith(" par")) return "par";
  if (lower.includes("rollo")) return "rollo";
  if (lower.includes("caja")) return "caja";
  if (lower.includes("paquete")) return "paquete";
  return "unidad";
}

export const OUT_REASONS = ["Venta", "Venta mostrador", "Venta a crédito", "Uso interno"];
export const IN_REASONS = ["Compra a proveedor", "Devolución de cliente"];
export const TRANSFER_REASONS = ["Reposición de sucursal", "Balanceo de inventario"];
export const ADJUSTMENT_UP_REASONS = ["Conteo físico: sobrante", "Corrección de inventario"];
export const ADJUSTMENT_DOWN_REASONS = ["Producto dañado", "Merma", "Conteo físico: faltante"];
export const PO_NOTES = [
  "Entregar en horario de mañana.",
  "Confirmar disponibilidad antes de despachar.",
  "Incluir certificado de calidad.",
  "Pedido urgente para reposición.",
  "",
];
