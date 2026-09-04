# Laboratorio Interactivo ASR: De la Voz Humana al Texto y la Respuesta de una IA

Este proyecto es una aplicación web educativa e interactiva diseñada para estudiantes de Ingeniería en Inteligencia Artificial y Ciencia de Datos de la **Corporación Universitaria de Bogotá** (Asignatura: Reconocimiento de Voz - Docente: Gerson Gomez).

La aplicación permite visualizar paso a paso el proceso de digitalización, análisis frecuencial, y transcripción del habla, culminando con la interpretación semántica y generación de una respuesta utilizando **Google Gemini AI**.

## 1. Estructura de Archivos

\`\`\`
/
├── .env.example       # Archivo de ejemplo para variables de entorno
├── index.html         # Punto de entrada HTML
├── metadata.json      # Metadatos del proyecto
├── package.json       # Dependencias y scripts
├── server.ts          # Backend (Node.js/Express) que oculta la API Key e interactúa con Gemini
├── tsconfig.json      # Configuración de TypeScript
├── vite.config.ts     # Configuración de compilación con Vite
└── src/
    ├── App.tsx                    # Componente principal de React con toda la lógica de UI
    ├── main.tsx                   # Punto de entrada de React
    ├── index.css                  # Estilos globales (Tailwind)
    ├── types.ts                   # Definición de tipos de TypeScript
    ├── components/
    │   ├── Step.tsx               # Componente de interfaz para las etapas del proceso
    │   └── ui/Layout.tsx          # Componentes reutilizables (Botones, Tarjetas, Notas)
    ├── hooks/
    │   └── useAudioProcessor.ts   # Hook personalizado para manejar Web Audio API y grabación
    └── lib/
        ├── wer.ts                 # Algoritmo de cálculo de Word Error Rate (WER)
        └── utils.ts               # Utilidades de Tailwind (cn)
\`\`\`

## 2. Cómo Ejecutar Localmente

1. **Instalar dependencias:**
   \`\`\`bash
   npm install
   \`\`\`
2. **Iniciar el servidor de desarrollo:**
   \`\`\`bash
   npm run dev
   \`\`\`
   Esto ejecutará tanto el frontend (Vite) como el backend (Express) en \`http://localhost:3000\`.

## 3 & 4. Configuración de API de Gemini y Dónde Colocar la API Key

Para que el modelo ASR y el análisis semántico funcionen, necesitas una clave de API de **Google Gemini**.

1. Consigue tu API Key en [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Crea un archivo llamado \`.env\` en la raíz del proyecto.
3. Coloca tu API Key de la siguiente forma:
   \`\`\`env
   GEMINI_API_KEY="tu-api-key-aqui"
   \`\`\`
   > **Nota:** La API Key jamás debe colocarse directamente en el frontend (HTML, App.tsx). El archivo \`server.ts\` se encarga de usar esta clave para evitar que quede expuesta al usuario.

## 5. Cómo Realizar Pruebas

El sistema incluye una sección experimental. Para probar la aplicación:
1. Autoriza el uso del micrófono en tu navegador.
2. Ingresa un **"Texto que esperaba decir"** en la caja superior.
3. Selecciona una condición experimental (ej. "Hablar rápido" o "Hablar con ruido").
4. Haz clic en **INICIAR MICRÓFONO**, habla, y luego **DETENER GRABACIÓN**.
5. Observa el análisis gráfico en tiempo real, el cálculo de métricas, y espera la transcripción. 
6. Verifica en la tabla inferior los resultados del WER (Word Error Rate).

## 6. Cómo Desplegar Posteriormente

El proyecto está configurado para empaquetarse en un solo servidor de producción Node.js que sirve los archivos estáticos de React.

1. **Compilar la aplicación:**
   \`\`\`bash
   npm run build
   \`\`\`
   Esto generará una carpeta \`dist/\` con los archivos de React, y \`dist/server.cjs\` con el backend empaquetado.
2. **Ejecutar en producción:**
   \`\`\`bash
   NODE_ENV=production npm run start
   \`\`\`
3. **Plataformas sugeridas:**
   - **Google Cloud Run:** Perfectamente compatible construyendo un Dockerfile simple.
   - **Render / Heroku:** Simplemente define el script de inicio como \`npm run start\`.
   - Recuerda configurar la variable de entorno \`GEMINI_API_KEY\` en el panel de la plataforma donde despliegues.
