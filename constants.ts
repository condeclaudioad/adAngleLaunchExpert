
// Vision & Text Analysis
export const MODEL_ANALYSIS = 'gemini-3-flash-preview';
export const MODEL_TEXT = 'gemini-3-flash-preview';

// Image Generation (Gemini 2.0 Flash Exp supports native generation)
export const MODEL_IMAGE = 'gemini-2.5-flash-image';

// FAL Model (Legacy/Backup)
export const FAL_MODEL = 'fal-ai/recraft-v3';

export const ADMIN_PASSWORD = (import.meta as any)?.env?.VITE_ADMIN_PASSWORD || "";

// --- CONFIGURACIÓN DEL DUEÑO DE LA APP ---
export const GOOGLE_AUTH_CLIENT_ID = "711671911659-vhug362pnrnb11idkmo8s71chio83gdv.apps.googleusercontent.com"; 

// --- ROBUST SYSTEM PROMPT ---
export const SYSTEM_PROMPT = `
Eres ANGLE MASTER, un copywriter experto en Direct Response Marketing especializado en Facebook Ads para el mercado hispanohablante.

🎯 MISIÓN PRINCIPAL:
Tu trabajo es analizar información de productos/servicios y generar:
1. Análisis estratégico estructurado (StructuredContext)
2. Ángulos de venta de alta conversión
3. Prompts visuales para generación de imágenes con IA

📋 REGLAS ABSOLUTAS (NUNCA VIOLAR):
1. IDIOMA DE RESPUESTA:
   - Campos de copy (name, hook, description, emotion): SIEMPRE EN ESPAÑOL
   - Campo "visuals": SIEMPRE EN INGLÉS (es prompt para IA de imágenes)
   
2. FORMATO DE RESPUESTA:
   - SIEMPRE JSON válido cuando se solicite JSON
   - NUNCA incluir \`\`\`json o \`\`\` al inicio/final
   - NUNCA dejar campos vacíos, null o undefined
   - NUNCA usar caracteres que rompan JSON (comillas sin escapar, saltos de línea)

3. ROBUSTEZ:
   - Si falta información, INVENTA valores coherentes
   - Si el texto es muy corto, EXTRAPOLA con creatividad
   - NUNCA respondas "no puedo" o "necesito más información"
`;

// Initial VIP List
export const VIP_EMAILS = [
"condeclaudioad@gmail.com",
"ayelenramirezmenendez@gmail.com",
"nicolehelman@hotmail.com",
"ariel_win85@hotmail.com",
"lemendoza1109@gmail.com",
"ddscani@gmail.com",
"martinezavellanedaa@gmail.com",
"tomasmartinezavella@gmail.com",
"noe_trabajo@hotmail.com",
"emanuel.patti.11@hotmail.com",
"guzman.osvaldo@hotmail.com",
"sab.carrizo@gmail.com",
"sanchezmar00@gmail.com",
"thlanghaus@gmail.com",
"genesiscamacho41@gmail.com",
"mabelenbustos@gmail.com",
"camilavqez96@gmail.com",
"adrianobaldassari@gmail.com",
"veronicadceli@gmail.com",
"chrismilitellotww@gmail.com",
"tamararmugnolo@gmail.com",
"matizetaproductosdigitales@gmail.com",
"josezentenoslt@gmail.com",
"camivazquez.ecom@gmail.com",
"stefanelliflor1@gmail.com",
"nazarenojesusdtozzi@gmail.com",
"angela.hurtado92@gmail.com",
"gomezyamila.d@gmail.com",
"alexbedoyanew@gmail.com",
"misterpossibilities@gmail.com",
"ivanboni836@gmail.com",
"cinnnmarin25@gmail.com",
"chinchillaisa12@gmail.com",
"kennethballesterosv@gmail.com",
"florencialopezag@gmail.com",
"martincortez55@hotmail.com",
"mkt.riseoficial@gmail.com",
"francescoboga@icloud.com",
"jimena_saggio_@hotmail.com",
"agata.ledesmag@gmail.com",
"giulianacortez30@hotmail.com",
"nanobravo67@gmail.com",
"endmediamkt@gmail.com",
"julyydbz904@gmail.com",
"orellanamelisa29@gmail.com",
"informaciondevalor21@gmail.com",
"davidenzo6@gmail.com",
"danielbcolman@gmail.com",
"flooroliv@gmail.com",
"marianievalucero@gmail.com",
"winidenise@gmail.com",
"maricielo.porras@gmail.com",
"cdkalbermatter@gmail.com",
"claudio@techainai.com",
"ludmiladesimoz@gmail.com",
"gabriela.a.campillay@gmail.com",
"marketingcontam@gmail.com",
"taliaperalta_21@hotmail.com",
"emmanuel_fontan@hotmail.com",
"carirobledo@outlook.com",
"melisa.schoon@hotmail.com",
"alvarocurvale14@gmail.com",
"bilbaoemmanuel1@gmail.com",
"polako0777@gmail.com",
"campos.mariela@live.com.ar",
"d.padron2023@gmail.com",
"rafaelbricenoo11@gmail.com",
"milenko.tadic15@gmail.com",
"julietta.fz21@gmail.com",
"llmunevarr@gmail.com",
"alesimo1312@gmail.com",
"marcelobailo@gmail.com",
"giselawalsamakis@gmail.com",
"soniamatu@gmail.com",
"lopezmelisa522@gmail.com",
"mahiabraianezequiel@gmail.com",
"weydi_1994@hotmail.com",
"tomybeltran.mkt@gmail.com",
"leohmanubens@gmail.com",
"maricielo.porras@gmail.com",
"carmen_ferniz@yahoo.com.mx",
"martiibaez2015@hotmail.com",
"craparguello@gmail.com"
];
