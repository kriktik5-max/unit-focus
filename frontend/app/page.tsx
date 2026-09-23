import Link from 'next/link';
import {
  Wallet, BarChart3, Scale, Tag, Truck, Megaphone, Undo2, Receipt,
  TrendingDown, RefreshCcw, Target, Check,
} from 'lucide-react';
import { Header } from './components/Header';

const painPoints = [
  { icon: TrendingDown, title: 'Кажется, что в плюсе', text: 'Продали на 100 000 ₽, а после комиссий, логистики и рекламы осталось 3 000 ₽' },
  { icon: RefreshCcw, title: 'Комиссии меняются', text: 'WB и Ozon каждый месяц меняют тарифы. Не успеваете пересчитывать' },
  { icon: Target, title: 'Не знаете точку безубыточности', text: 'До какой цены можно участвовать в акции, чтобы не уйти в минус?' },
];

const features = [
  { icon: Wallet, title: 'Чистая прибыль', text: 'С каждой единицы и со всей партии' },
  { icon: BarChart3, title: 'Маржа и ROI', text: 'Понятные проценты без бухгалтерии' },
  { icon: Scale, title: 'Точка безубыточности', text: 'Минимальная цена, чтобы не уйти в минус' },
  { icon: Tag, title: 'Максимальная скидка', text: 'Сколько можно скинуть под акцию' },
  { icon: Truck, title: 'Все расходы', text: 'Комиссия, логистика, хранение, эквайринг' },
  { icon: Megaphone, title: 'Реклама', text: 'Учитываем стоимость продвижения' },
  { icon: Undo2, title: 'Возвраты', text: 'Сколько съедают возвраты и утилизация' },
  { icon: Receipt, title: 'Налоги', text: 'УСН, самозанятый, ОСНО — все режимы' },
];

const marketplaces = [
  {
    name: 'Wildberries', model: 'Модель FBO', accent: '#6B4A73',
    items: ['Комиссия по категории', 'Логистика и хранение', 'Эквайринг', 'Расчёт возвратов'],
  },
  {
    name: 'Ozon', model: 'Модель FBO', accent: '#3E5C76',
    items: ['Комиссия по категории', 'Логистика по объёму', 'Последняя миля (5.5%)', 'Ozon Pay, утилизация'],
  },
  {
    name: 'Яндекс Маркет', model: 'Модель FBY', accent: '#B8924B',
    items: ['Комиссия по категории', 'Логистика по литрам', 'Доставка покупателю (5%)', 'Обработка заказа'],
  },
];

const steps = [
  { n: '1', title: 'Выберите маркетплейс', text: 'Wildberries, Ozon или Яндекс Маркет — переключение в один клик' },
  { n: '2', title: 'Введите данные товара', text: 'Цена, себестоимость, комиссия, логистика — всё уже подставлено по умолчанию' },
  { n: '3', title: 'Получите расчёт', text: 'Прибыль, маржа, ROI, точка безубыточности и максимальная скидка' },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <Header />

      {/* HERO */}
      <section
        className="bg-navy text-white py-28 md:py-36"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 40px), repeating-linear-gradient(90deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 40px)',
        }}
      >
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-[1.15fr_0.85fr] gap-16 items-end">
          <div>
            <h1 className="font-serif text-[38px] md:text-[54px] leading-[1.12] font-medium mb-7 max-w-[14ch]">
              Прибыль, а не <em className="italic text-gold">ощущение</em> прибыли
            </h1>
            <p className="text-white/60 text-[16.5px] leading-relaxed max-w-[46ch] mb-9">
              Комиссии, логистика, реклама и налоги — в одном расчёте для Wildberries, Ozon
              и Яндекс Маркета. Без бухгалтера и без иллюзий насчёт того, сколько вы
              зарабатываете на самом деле.
            </p>
            <div className="flex flex-wrap gap-3.5">
              <Link href="/calculator" className="bg-gold text-navy font-semibold px-7 py-3.5 hover:brightness-110 transition">
                Рассчитать бесплатно
              </Link>
              <Link href="/pricing" className="border border-navy-line text-white font-semibold px-7 py-3.5 hover:bg-white/5 transition">
                Тарифы
              </Link>
            </div>
            <p className="mt-5 text-[13px] text-white/40">Бесплатно и без регистрации</p>
          </div>

          <div className="text-right">
            <div className="font-serif text-gold text-[72px] md:text-[92px] leading-none font-medium">
              23,66%
            </div>
            <div className="text-[13.5px] text-white/50 mt-3 pt-3.5 border-t border-navy-line">
              Средняя чистая маржинальность продавцов на Юнит-Фокусе за 30 дней
            </div>
          </div>
        </div>
      </section>

      {/* БОЛЬ */}
      <section className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-serif text-[28px] md:text-[32px] font-medium mb-3">Знакомая ситуация?</h2>
          <p className="text-ink/60 mb-14 max-w-xl">
            Товар продаётся, выручка растёт, а денег почему-то нет
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            {painPoints.map((item) => (
              <div key={item.title} className="border-t border-line pt-6">
                <item.icon className="w-6 h-6 text-ink/40 mb-5" strokeWidth={1.5} />
                <h3 className="font-semibold text-[16px] mb-2">{item.title}</h3>
                <p className="text-ink/60 text-sm leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ЧТО СЧИТАЕМ */}
      <section id="features" className="py-24 bg-surface">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-serif text-[28px] md:text-[32px] font-medium mb-3">Что считает Юнит-Фокус</h2>
          <p className="text-ink/60 mb-14 max-w-xl">
            Полный расчёт — от цены до чистой прибыли
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 border border-line divide-y sm:divide-y-0 divide-x-0 sm:divide-x divide-line">
            {features.map((item, i) => (
              <div
                key={item.title}
                className={`p-6 ${i >= 4 ? 'sm:border-t sm:border-line' : ''} ${i % 2 === 1 ? 'sm:border-l sm:border-line lg:border-l-0' : ''}`}
              >
                <item.icon className="w-5 h-5 text-gold mb-4" strokeWidth={1.5} />
                <h3 className="font-semibold text-[14.5px] mb-1.5">{item.title}</h3>
                <p className="text-ink/60 text-[13.5px] leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* МАРКЕТПЛЕЙСЫ */}
      <section id="marketplaces" className="bg-navy text-white py-24">
        <div className="max-w-6xl mx-auto px-6">
          <h2 className="font-serif text-[28px] md:text-[32px] font-medium mb-14">Поддерживаемые маркетплейсы</h2>
          <div className="grid md:grid-cols-3 gap-px bg-navy-line max-w-5xl">
            {marketplaces.map((mp) => (
              <div key={mp.name} className="bg-navy p-8">
                <div className="w-8 h-[3px] mb-6" style={{ background: mp.accent }} />
                <div className="text-xl font-semibold mb-1">{mp.name}</div>
                <div className="text-white/45 text-sm mb-6">{mp.model}</div>
                <ul className="space-y-2.5 text-sm text-white/70">
                  {mp.items.map((it) => (
                    <li key={it} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 mt-[1px] flex-shrink-0" style={{ color: mp.accent }} strokeWidth={2} />
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* КАК РАБОТАЕТ */}
      <section id="how" className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="font-serif text-[28px] md:text-[32px] font-medium mb-14">Как это работает</h2>
          <div className="space-y-10">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-6 items-start">
                <div className="w-10 h-10 border border-gold text-gold flex items-center justify-center font-mono text-[15px] flex-shrink-0">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-ink/60">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-navy py-24">
        <div className="max-w-2xl mx-auto px-6 text-center text-white">
          <h2 className="font-serif text-[28px] md:text-[34px] font-medium mb-4">
            Узнайте реальную прибыль прямо сейчас
          </h2>
          <p className="text-white/50 mb-9">Бесплатно. Без регистрации. Без ограничений.</p>
          <Link
            href="/calculator"
            className="inline-block bg-gold text-navy font-semibold px-8 py-4 hover:brightness-110 transition"
          >
            Открыть калькулятор
          </Link>
        </div>
      </section>

      {/* ФУТЕР */}
      <footer className="border-t border-line py-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-ink/40">
          <div>© 2026 Юнит-Фокус. Юнит-экономика для маркетплейсов.</div>
          <div className="flex gap-6">
            <Link href="/calculator" className="hover:text-ink transition">Калькулятор</Link>
            <a href="#" className="hover:text-ink transition">Контакты</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
