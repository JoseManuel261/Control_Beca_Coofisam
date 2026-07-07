import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE_NAME, verifySessionToken } from '@/lib/session';
import type { ResumenFinanciero } from '@/lib/finanzas/types';

export async function POST(request: Request) {
  // Autenticación: mismo mecanismo que el resto de la app.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const isValid = await verifySessionToken(token);
  if (!isValid) {
    return NextResponse.json({ error: 'No autenticado.' }, { status: 401 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'GROQ_API_KEY no está configurada en el servidor.' },
      { status: 500 }
    );
  }

  let resumen: ResumenFinanciero;
  try {
    resumen = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo de la petición inválido.' }, { status: 400 });
  }

  const prompt = construirPrompt(resumen);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20_000);

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      signal: controller.signal,
      body: JSON.stringify({
        // Verifica en console.groq.com/docs/models cuál es el modelo vigente
        // en el catálogo de Groq antes de desplegar; los proveedores rotan
        // modelos con frecuencia.
        model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asesor financiero personal. Respondes en español, en formato Markdown, con diagnósticos breves, concretos y prácticos. No inventes cifras que no te dieron.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.4,
        max_tokens: 900,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const detalle = await response.text();
      console.error('Error de Groq:', response.status, detalle);
      return NextResponse.json(
        { error: `Groq respondió con error ${response.status}.` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const analisis: string | undefined = data?.choices?.[0]?.message?.content;

    if (!analisis) {
      return NextResponse.json({ error: 'Groq no devolvió contenido.' }, { status: 502 });
    }

    return NextResponse.json({ analisis });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return NextResponse.json(
        { error: 'El servicio de IA tardó demasiado en responder (más de 20s). Intenta de nuevo.' },
        { status: 504 }
      );
    }
    console.error('Error al contactar Groq:', err);
    return NextResponse.json({ error: 'No se pudo contactar al servicio de IA.' }, { status: 502 });
  }
}

function construirPrompt(resumen: ResumenFinanciero): string {
  const categorias = Object.entries(resumen.porCategoria)
    .map(([cat, monto]) => `- ${cat}: $${monto.toLocaleString('es-CO')}`)
    .join('\n');

  const presupuestos = resumen.presupuestos.length
    ? resumen.presupuestos
        .map((p) => `- ${p.categoria}: límite $${p.monto_limite.toLocaleString('es-CO')}`)
        .join('\n')
    : 'No hay presupuestos definidos para este periodo.';

  return `Analiza mi situación financiera del periodo ${resumen.anioMes}:

Total ingresos: $${resumen.totalIngresos.toLocaleString('es-CO')}
Total gastos fijos: $${resumen.totalGastosFijos.toLocaleString('es-CO')}
Total gastos diarios: $${resumen.totalGastosDiarios.toLocaleString('es-CO')}
Total gastos: $${resumen.totalGeneral.toLocaleString('es-CO')}
Balance (ingresos - gastos): $${resumen.balance.toLocaleString('es-CO')}

Ahorro movido este mes (depósitos - retiros): $${resumen.ahorroDelMes.toLocaleString('es-CO')}
Saldo acumulado de ahorros (histórico, no solo este mes): $${resumen.saldoAhorroAcumulado.toLocaleString('es-CO')}

Gastos por categoría:
${categorias || 'Sin gastos registrados.'}

Presupuestos definidos:
${presupuestos}

Dame:
1. Un diagnóstico breve de mi situación este mes (considera el balance y el ahorro, no solo los gastos).
2. Alertas si alguna categoría superó o está cerca de su presupuesto.
3. 3 consejos concretos de ahorro para el próximo mes, basados en estos datos específicos.`;
}
