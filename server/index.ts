import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { SOURCES } from './sources';
import { fetchIsaghaGold } from './providers/isagha';
import { getSndukFunds } from './providers/snduk';

const app = Fastify({ logger: true });

// أصول مسموحة مفصولة بفاصلة. تطبيق Android (Capacitor) يأتي من https://localhost
const origins = (process.env.ALLOWED_ORIGIN ?? 'http://localhost:5173').split(',').map((o) => o.trim()).filter(Boolean);
await app.register(cors, { origin: origins });
await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });

const isaghaOn = () => process.env.ISAGHA_SCRAPE_ENABLED === 'true';
const sndukOn = () => process.env.SNDUK_ENABLED === 'true';
const isConfigured = (envVar: string) => Boolean(process.env[envVar]);

app.get('/api/health', async () => ({ status: 'ok', time: new Date().toISOString() }));

app.get('/api/sources', async () => ({
  sources: SOURCES.map((s) =>
    s.domain === 'funds'
      ? { ...s, env_var: 'SNDUK_ENABLED', configured: sndukOn(), adapter_implemented: true, note: 'SNDUK: قيم وثائق دورية (ليست لحظية) من صفحاتهم العامة، بدون إذن كتابي منهم، والعوائد كما تعرضها المنصة.' }
      : s.domain === 'gold'
      ? { ...s, env_var: 'ISAGHA_SCRAPE_ENABLED', configured: isaghaOn(), adapter_implemented: true, note: 'آي صاغة: أسعار تاجر معلنة (شراء/بيع)، تُجلب من صفحتهم العامة، متأخرة وليست لحظية. بدون إذن كتابي منهم.' }
      : { ...s, configured: isConfigured(s.env_var) },
  ),
}));

app.get<{ Params: { domain: string } }>('/api/data/:domain', async (req, reply) => {
  const src = SOURCES.find((s) => s.domain === req.params.domain);
  if (!src) return reply.code(404).send({ error: 'unknown domain' });
  if (src.domain === 'gold' && isaghaOn()) {
    try {
      return { domain: 'gold', configured: true, env_var: 'ISAGHA_SCRAPE_ENABLED', message: 'أسعار تاجر معلنة من آي صاغة. ليست سعرًا مرجعيًا للسوق.', items: await fetchIsaghaGold() };
    } catch (e) {
      req.log.warn(e);
      return { domain: 'gold', configured: true, env_var: 'ISAGHA_SCRAPE_ENABLED', message: `تعذر جلب أسعار آي صاغة: ${e instanceof Error ? e.message : 'خطأ'}`, items: [] };
    }
  }
  if (src.domain === 'funds' && sndukOn()) {
    const r = getSndukFunds();
    const msg = r.running ? `جارٍ تحميل الصناديق تدريجيًا: ${r.loaded} من ${r.total || '؟'}. أعد التحديث بعد دقائق.` : r.loaded === 0 ? 'لم تُحمَّل أي صناديق بعد أو فشل الجلب؛ راجع سجل الخادم.' : 'قيم الوثائق كما تنشرها SNDUK مع تاريخ كل سعر. العوائد من حساب المنصة.';
    return { domain: 'funds', configured: true, env_var: 'SNDUK_ENABLED', message: msg, items: r.items };
  }
  const configured = isConfigured(src.env_var);
  // لا توجد adapters منفذة: نُرجع قائمة فارغة وسببًا واضحًا، ولا نُرجع أرقامًا مختلقة أبدًا.
  return {
    domain: src.domain,
    configured,
    env_var: src.env_var,
    message: src.adapter_implemented
      ? 'المصدر مفعّل.'
      : configured
        ? 'تم ضبط المفتاح لكن adapter هذا المصدر لم يُنفَّذ بعد.'
        : 'المصدر غير مهيأ. أضف المفتاح في متغيرات بيئة الخادم.',
    items: [],
  };
});

const port = Number(process.env.PORT ?? 8787);
await app.listen({ port, host: '0.0.0.0' });
