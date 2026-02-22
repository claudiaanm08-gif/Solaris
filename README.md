# Plataforma Integral de Gestión Energética Solensa

**Cliente:** Solensa S.A. de C.V.
**Fecha:** 17 de febrero de 2026
**Versión:** 1.0

---

## 📌 1. Visión General del Producto

La **Plataforma Integral de Gestión Energética de Solensa** tiene como objetivo digitalizar, estructurar y optimizar toda la operación relacionada con la licuefacción, suministro y comercialización de gas natural.

El sistema centraliza información crítica (clientes, contratos, consumos, entregas y costos logísticos), brindando:

- Visibilidad operativa en tiempo real
- Soporte analítico para toma de decisiones estratégicas
- Reducción de riesgos de desabasto
- Mejora de márgenes operativos
- Generación acelerada de propuestas comerciales

🎯 **Visión estratégica:** Transformar a Solensa en una organización *data-driven*, capaz de escalar su operación sin incrementar proporcionalmente su complejidad operativa.

---

## 🚨 2. Planteamiento del Problema

Actualmente, los equipos operativo y comercial gestionan información crítica de manera dispersa y no estructurada, lo que provoca:

- Dificultad para prever desabastos
- Cálculo impreciso de márgenes reales
- Lenta generación de propuestas comerciales
- Limitada toma de decisiones basada en datos
- Mayor riesgo operativo y financiero

La falta de centralización y análisis sistemático limita el crecimiento escalable del negocio.

---

## ⚙️ 3. Características y Funcionalidades

### F1. Gestión Centralizada de Clientes y Contratos

**Descripción:**
Módulo para crear, almacenar y relacionar clientes con contratos digitalizados y sus condiciones operativas.

**User Story:**
Como gerente operativo, quiero tener todos los clientes y contratos centralizados para consultar rápidamente condiciones pactadas y volúmenes acordados.

**Criterios de Aceptación:**

- Crear, editar y visualizar perfiles de clientes.
- Cargar contratos en PDF y asociarlos a clientes.
- Capturar volumen contratado, vigencia y condiciones clave.
- Indexación y consulta rápida de contratos.

---

### F2. Registro de Entregas y Consumos

**Descripción:**
Módulo para registrar entregas de gas, consumo real y niveles de almacenamiento.

**User Story:**
Como coordinador logístico, quiero registrar entregas y consumos para monitorear niveles y anticipar reabastecimientos.

**Criterios de Aceptación:**

- Registrar fecha, volumen entregado y costo logístico.
- Registrar consumo reportado.
- Cálculo automático de variación entre volumen contratado y consumo real.
- Histórico por cliente.

---

### F3. Panel de Monitoreo Operativo (Dashboard)

**Descripción:**
Dashboard con indicadores clave de operación y alertas de riesgo.

**User Story:**
Como director general, quiero visualizar el estado general de clientes y suministro para tomar decisiones estratégicas.

**Criterios de Aceptación:**

- Estado de almacenamiento por cliente.
- Alertas de posible desabasto.
- Resumen financiero (margen estimado).
- Filtros por cliente y periodo.

---

### F4. Proyección de Reabastecimiento

**Descripción:**
Motor de cálculo que proyecta necesidades futuras con base en consumo histórico.

**User Story:**
Como analista operativo, quiero proyectar necesidades de suministro para evitar desabastos.

**Criterios de Aceptación:**

- Cálculo de tendencia de consumo.
- Estimación de fecha probable de reabastecimiento.
- Alertas preventivas configurables.
- Exportación de resultados.

---

### F5. Simulador Comercial de Ahorro Energético

**Descripción:**
Herramienta para analizar consumo energético de prospectos y estimar ahorro potencial.

**User Story:**
Como ejecutivo comercial, quiero simular el ahorro frente a alternativas para generar propuestas más rápido.

**Criterios de Aceptación:**

- Carga de datos históricos de consumo.
- Ingreso de precio de alternativa energética.
- Cálculo comparativo.
- Generación de borrador descargable de propuesta.

---

### F6. Módulo de Digitalización Inteligente (RAG)

**Descripción:**
Sistema de extracción de texto y consulta inteligente sobre contratos y documentos.

**User Story:**
Como usuario administrativo, quiero consultar información clave dentro de contratos sin leerlos completos.

**Criterios de Aceptación:**

- Carga de PDFs.
- Extracción automática de texto.
- Generación de embeddings para búsqueda semántica.
- Respuesta a consultas sobre contenido del documento.

---

## 🏗 4. Requisitos Técnicos

### Frontend

- **React (Vite o Next.js)**
- Arquitectura basada en componentes reutilizables.
- Escalable y adaptable.
- Next.js permite SSR/SSG para optimización futura.

### Backend

- **Python + FastAPI**
- Alto rendimiento.
- Asincronía nativa.
- Integración ideal con motores analíticos y modelos predictivos.
- Servicios REST escalables.

### Base de Datos

- **SQLite (Fase 1)**
- Base ligera y rápida implementación.
- Ideal para validación inicial (15 días).
- Migración futura recomendada a PostgreSQL.

### Integración IA

- **IBM Watson (Watsonx.ai + Watson Discovery)**
- Arquitectura RAG (Embeddings + PDF Parsing)
- Gobernanza y trazabilidad empresarial.
- Indexación inteligente de documentos contractuales.
- Generación de respuestas contextualizadas.

### Infraestructura

- **Google Cloud Run** (Backend)
- **Vercel** (Frontend)
- Arquitectura serverless.
- Escalabilidad automática.
- Baja carga operativa en Fase 1.

---

## 🔄 Arquitectura de Datos (Flujo)

1. Usuario ingresa información desde el frontend.
2. Solicitud enviada vía HTTPS a API FastAPI.
3. Backend valida reglas de negocio.
4. Datos estructurados almacenados en SQLite.
5. Para documentos PDF:
   - Extracción de texto.
   - Envío a Watson Discovery para indexación.
   - Generación de embeddings con Watsonx.ai.
6. Consulta inteligente:
   - Búsqueda semántica en Watson Discovery.
   - Envío de contexto a Watsonx.ai.
   - Generación de respuesta contextualizada.
7. Respuesta regresa al frontend para visualización.

---

## 🎨 5. Requisitos de Experiencia de Usuario (UX)

### Dashboard Principal

- Indicadores clave.
- Alertas.
- Resumen financiero.
- Enfoque ejecutivo.

### Vista Cliente 360°

- Contratos.
- Consumo histórico.
- Entregas.
- Información centralizada.

### Panel de Simulación Comercial

- Formulario estructurado.
- Resultados dinámicos.
- Generación rápida de propuestas.

### Sistema de Alertas Visuales

- Código de colores (Rojo / Amarillo / Verde).
- Interpretación inmediata del riesgo operativo.

### Buscador Inteligente de Contratos

- Campo tipo chat.
- Consulta semántica.
- Mejora eficiencia administrativa.

---

## 🗓 6. Hitos y Cronograma

### Días 1–3

- Creación repositorio GitHub.
- Definición estructura de carpetas.
- Configuración entorno base.
- Documentación PRD y backlog.

### Días 4–7

- Modelado base de datos.
- Desarrollo API clientes y contratos.
- Integración frontend básica.

### Días 8–11

- Registro de entregas y consumos.
- Motor de proyección.
- Dashboard operativo.

### Días 12–14

- Integración Watson API.
- Implementación extracción PDF.
- Generación borradores de propuesta.

### Día 15

- Pruebas funcionales.
- Ajustes finales.
- Deploy en Cloud Run y Vercel.

---

## ⚠️ 7. Riesgos y Supuestos

| Grado | Riesgo                              | Supuesto / Causa                    | Implicaciones                | Mitigación                                   |
| ----- | ----------------------------------- | ----------------------------------- | ---------------------------- | --------------------------------------------- |
| Alto  | Información histórica incompleta  | No existe base estructurada previa  | Proyecciones poco confiables | Fase de limpieza y validación manual inicial |
| Alto  | Reglas de negocio no formalizadas   | Conocimiento tácito no documentado | Errores en automatización   | Workshops de descubrimiento obligatorios      |
| Medio | Limitación de SQLite               | Crecimiento rápido de datos        | Problemas de rendimiento     | Plan de migración a PostgreSQL               |
| Medio | Dependencia de API externa (Watson) | Cambios de costo o disponibilidad   | Impacto en módulo RAG       | Capa abstracta para cambiar proveedor         |
| Bajo  | Resistencia al cambio               | Procesos manuales arraigados        | Baja adopción               | Capacitación y onboarding guiado             |

---

## 🚀 Objetivo Final

Construir una plataforma robusta, escalable y analítica que convierta la operación energética de Solensa en un sistema inteligente, predictivo y orientado a decisiones basadas en datos.
